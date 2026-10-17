const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const path = require('path');
const fs = require('fs');

const ARXIV_BASE_URL = process.env.ARXIV_BASE_URL || 'https://export.arxiv.org/api/query';
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '600000', 10); // 10 minutes
const RATE_LIMIT_DELAY_MS = parseInt(process.env.RATE_LIMIT_DELAY_MS || '3000', 10); // 3 seconds

// In-memory cache: queryKey -> { timestamp, data }
const memoryCache = new Map();

// Rate limit queue
let lastRequestTime = 0;
async function waitRateLimit() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < RATE_LIMIT_DELAY_MS) {
    const delay = RATE_LIMIT_DELAY_MS - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();
}

// Fallback sample data in case arXiv API is unreachable
function getFallbackPapers() {
  try {
    const samplePath = path.join(__dirname, '..', '..', 'data', 'sample_papers.json');
    if (fs.existsSync(samplePath)) {
      const raw = fs.readFileSync(samplePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[arxivService] Failed to read sample papers fallback:', err.message);
  }
  return [];
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
});

/**
 * Normalizes an XML Atom entry into a standard PaperItem JSON object
 */
function normalizeEntry(entry) {
  if (!entry) return null;

  const rawId = entry.id || '';
  const idMatch = rawId.match(/abs\/(.+)$/) || rawId.match(/arxiv\.org\/abs\/(.+)$/);
  const cleanId = idMatch ? idMatch[1] : rawId.replace('http://arxiv.org/abs/', '');

  const title = (entry.title || '').replace(/\s+/g, ' ').trim();
  const summary = (entry.summary || '').replace(/\s+/g, ' ').trim();

  // Authors can be object or array
  let authors = [];
  if (entry.author) {
    if (Array.isArray(entry.author)) {
      authors = entry.author.map((a) => (typeof a === 'string' ? a : a.name || '')).filter(Boolean);
    } else if (typeof entry.author === 'object') {
      authors = [entry.author.name || ''];
    } else {
      authors = [String(entry.author)];
    }
  }

  // Categories
  let categories = [];
  let primaryCategory = '';
  if (entry['arxiv:primary_category'] && entry['arxiv:primary_category']['@_term']) {
    primaryCategory = entry['arxiv:primary_category']['@_term'];
  }
  if (entry.category) {
    if (Array.isArray(entry.category)) {
      categories = entry.category.map((c) => c['@_term'] || '').filter(Boolean);
    } else if (typeof entry.category === 'object') {
      categories = [entry.category['@_term'] || ''];
    }
  }
  if (!primaryCategory && categories.length > 0) {
    primaryCategory = categories[0];
  }

  // Links
  let pdfUrl = `https://arxiv.org/pdf/${cleanId}.pdf`;
  let arxivUrl = `https://arxiv.org/abs/${cleanId}`;
  if (entry.link) {
    const links = Array.isArray(entry.link) ? entry.link : [entry.link];
    for (const l of links) {
      if (l['@_title'] === 'pdf' || l['@_type'] === 'application/pdf') {
        pdfUrl = l['@_href'] || pdfUrl;
      }
      if (l['@_rel'] === 'alternate') {
        arxivUrl = l['@_href'] || arxivUrl;
      }
    }
  }

  const published = entry.published || '';
  const updated = entry.updated || published;
  const doi = entry['arxiv:doi'] ? entry['arxiv:doi']['#text'] || entry['arxiv:doi'] : null;
  const comment = entry['arxiv:comment'] ? entry['arxiv:comment']['#text'] || entry['arxiv:comment'] : null;

  return {
    id: cleanId,
    title,
    summary,
    authors,
    published,
    updated,
    categories,
    primaryCategory: primaryCategory || 'cs.AI',
    pdfUrl,
    arxivUrl,
    doi: doi ? String(doi) : null,
    comment: comment ? String(comment) : null,
  };
}

/**
 * Fetch papers by category (e.g. cs.AI or cs.LG) with pagination
 */
async function fetchPapers({ category = 'cs.AI', page = 0, limit = 10 } = {}) {
  const cacheKey = `papers:${category}:${page}:${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const start = page * limit;
  const searchQuery = `cat:${category}`;

  try {
    await waitRateLimit();
    const response = await axios.get(ARXIV_BASE_URL, {
      params: {
        search_query: searchQuery,
        start,
        max_results: limit,
        sortBy: 'submittedDate',
        sortOrder: 'descending',
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'arXiv-Mobile-Client/1.0 (Topic 28 Academic Project)',
      },
    });

    const parsed = xmlParser.parse(response.data);
    const feed = parsed.feed || {};
    let entries = feed.entry || [];
    if (!Array.isArray(entries)) {
      entries = entries ? [entries] : [];
    }

    const items = entries.map(normalizeEntry).filter(Boolean);
    const totalResults = parseInt(feed['opensearch:totalResults']?.['#text'] || feed['opensearch:totalResults'] || '100', 10);

    const result = {
      status: 'success',
      category,
      totalResults,
      page,
      limit,
      data: items,
    };

    memoryCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error(`[arxivService] Error fetching arXiv category ${category}:`, error.message);
    const fallbackList = getFallbackPapers().filter((p) => !category || p.primaryCategory === category || p.categories?.includes(category));
    const paged = fallbackList.slice(start, start + limit);
    return {
      status: 'fallback',
      category,
      totalResults: fallbackList.length,
      page,
      limit,
      data: paged.length > 0 ? paged : getFallbackPapers().slice(0, limit),
      warning: 'Live arXiv request failed, serving local cached sample papers.',
    };
  }
}

/**
 * Search papers by keyword, category, and sort
 */
async function searchPapers({ query = '', category = '', sortBy = 'relevance', page = 0, limit = 10 } = {}) {
  const cacheKey = `search:${query}:${category}:${sortBy}:${page}:${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const start = page * limit;
  let searchQuery = '';
  if (query && category) {
    searchQuery = `all:${query}+AND+cat:${category}`;
  } else if (query) {
    searchQuery = `all:${query}`;
  } else if (category) {
    searchQuery = `cat:${category}`;
  } else {
    searchQuery = 'cat:cs.AI';
  }

  let arxivSortBy = 'relevance';
  let arxivSortOrder = 'descending';
  if (sortBy === 'submittedDate' || sortBy === 'date') {
    arxivSortBy = 'submittedDate';
  }

  try {
    await waitRateLimit();
    const response = await axios.get(ARXIV_BASE_URL, {
      params: {
        search_query: searchQuery,
        start,
        max_results: limit,
        sortBy: arxivSortBy,
        sortOrder: arxivSortOrder,
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'arXiv-Mobile-Client/1.0 (Topic 28 Academic Project)',
      },
    });

    const parsed = xmlParser.parse(response.data);
    const feed = parsed.feed || {};
    let entries = feed.entry || [];
    if (!Array.isArray(entries)) {
      entries = entries ? [entries] : [];
    }

    const items = entries.map(normalizeEntry).filter(Boolean);
    const totalResults = parseInt(feed['opensearch:totalResults']?.['#text'] || feed['opensearch:totalResults'] || '0', 10);

    const result = {
      status: 'success',
      query,
      category,
      sortBy,
      totalResults,
      page,
      limit,
      data: items,
    };

    memoryCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error(`[arxivService] Error searching arXiv:`, error.message);
    const fallbackList = getFallbackPapers().filter((p) => {
      const titleStr = (p.title || '').toLowerCase();
      const summaryStr = (p.summary || p.abstract || '').toLowerCase();
      const qLower = query.toLowerCase();
      const matchQ = !query || titleStr.includes(qLower) || summaryStr.includes(qLower);
      const matchC = !category || p.primaryCategory === category || (p.categories && p.categories.includes(category));
      return matchQ && matchC;
    });
    return {
      status: 'fallback',
      query,
      category,
      totalResults: fallbackList.length,
      page,
      limit,
      data: fallbackList.slice(start, start + limit),
      warning: 'Live arXiv search failed, serving filtered local sample papers.',
    };
  }
}

/**
 * Get single paper detail by ID
 */
async function getPaperById(id) {
  const cleanId = id.replace(/^arxiv:/i, '');
  const cacheKey = `paper:${cleanId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    await waitRateLimit();
    const response = await axios.get(ARXIV_BASE_URL, {
      params: { id_list: cleanId },
      timeout: 10000,
    });
    const parsed = xmlParser.parse(response.data);
    const feed = parsed.feed || {};
    let entry = feed.entry;
    if (Array.isArray(entry)) entry = entry[0];

    if (entry) {
      const paper = normalizeEntry(entry);
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: paper });
      return paper;
    }
  } catch (err) {
    console.warn(`[arxivService] Failed to fetch paper ${cleanId} from arXiv:`, err.message);
  }

  // Fallback
  const samples = getFallbackPapers();
  const found = samples.find((s) => s.id === cleanId || s.id.includes(cleanId));
  if (found) return found;

  return {
    id: cleanId,
    title: `arXiv Paper ${cleanId}`,
    summary: 'Detailed abstract is available via direct arXiv PDF download.',
    authors: ['arXiv Researcher'],
    published: new Date().toISOString(),
    updated: new Date().toISOString(),
    categories: ['cs.AI'],
    primaryCategory: 'cs.AI',
    pdfUrl: `https://arxiv.org/pdf/${cleanId}.pdf`,
    arxivUrl: `https://arxiv.org/abs/${cleanId}`,
  };
}

module.exports = {
  fetchPapers,
  searchPapers,
  getPaperById,
};
