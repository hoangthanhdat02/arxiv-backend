const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const path = require('path');
const fs = require('fs');

const ARXIV_BASE_URL = process.env.ARXIV_BASE_URL || 'https://export.arxiv.org/api/query';
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '600000', 10); // 10 minutes
const RATE_LIMIT_DELAY_MS = parseInt(process.env.RATE_LIMIT_DELAY_MS || '3000', 10); // 3 seconds
const MAX_CACHE_ENTRIES = 200;

// In-memory cache: queryKey -> { timestamp, data }
const memoryCache = new Map();

function getFromCache(key) {
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached) {
    memoryCache.delete(key);
  }
  return null;
}

function setCache(key, data) {
  // Evict oldest entry if cache exceeds limit (prevent memory leak)
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { timestamp: Date.now(), data });
}

// Sequential Promise Queue (Ensures STRICTLY 1 request / 3s to arXiv servers)
let requestQueue = Promise.resolve();
let lastArxivRequestTimestamp = 0;

function queueArxivRequest(requestTask) {
  const taskExecution = requestQueue
    .catch(() => {}) // Don't let previous failures block future requests
    .then(async () => {
      const now = Date.now();
      const timeSinceLast = now - lastArxivRequestTimestamp;
      if (timeSinceLast < RATE_LIMIT_DELAY_MS && lastArxivRequestTimestamp !== 0) {
        const waitTime = RATE_LIMIT_DELAY_MS - timeSinceLast;
        console.log(`[RateLimiter] ⏳ Enforcing arXiv policy: waiting ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      try {
        return await requestTask();
      } finally {
        lastArxivRequestTimestamp = Date.now();
      }
    });

  requestQueue = taskExecution;
  return taskExecution;
}

// Fallback sample data in case arXiv API is unreachable or in Airplane Mode
function getFallbackPapers() {
  try {
    const samplePath = path.join(__dirname, '..', '..', 'data', 'sample_papers.json');
    if (fs.existsSync(samplePath)) {
      const raw = fs.readFileSync(samplePath, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.map((item) => ({
          id: String(item.id || '').trim(),
          title: String(item.title || '').replace(/\s+/g, ' ').trim(),
          summary: String(item.summary || item.abstract || '').replace(/\s+/g, ' ').trim(),
          authors: Array.isArray(item.authors) && item.authors.length > 0 ? item.authors : [String(item.authors || 'arXiv Researcher')],
          published: String(item.published || item.published_date || new Date().toISOString()),
          updated: String(item.updated || item.updated_date || item.published || new Date().toISOString()),
          categories: Array.isArray(item.categories) ? item.categories : ['cs.AI'],
          primaryCategory: String(item.primaryCategory || item.primary_category || 'cs.AI'),
          pdfUrl: String(item.pdfUrl || item.pdf_url || `https://arxiv.org/pdf/${item.id}.pdf`),
          arxivUrl: String(item.arxivUrl || `https://arxiv.org/abs/${item.id}`),
          doi: item.doi ? String(item.doi) : null,
          comment: item.comment ? String(item.comment) : null,
        }));
      }
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

  const rawId = (entry.id || '').trim();
  const idMatch = rawId.match(/abs\/(.+)$/) || rawId.match(/arxiv\.org\/abs\/(.+)$/);
  const cleanId = (idMatch ? idMatch[1] : rawId.replace(/^https?:\/\/arxiv\.org\/abs\//i, '')).trim();

  const title = (entry.title || '').replace(/\s+/g, ' ').trim();
  const summary = (entry.summary || '').replace(/\s+/g, ' ').trim();

  // Authors can be object or array
  let authors = [];
  if (entry.author) {
    if (Array.isArray(entry.author)) {
      authors = entry.author.map((a) => (typeof a === 'string' ? a : a.name || '')).filter(Boolean);
    } else if (typeof entry.author === 'object') {
      const name = entry.author.name || '';
      if (name) authors = [name];
    } else {
      authors = [String(entry.author)];
    }
  }
  if (authors.length === 0) {
    authors = ['arXiv Researcher'];
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
  const safePage = Math.max(0, parseInt(page, 10) || 0);
  const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 30));

  const cacheKey = `papers:${category}:${safePage}:${safeLimit}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return { ...cachedData, fromCache: true };
  }

  const start = safePage * safeLimit;
  const searchQuery = `cat:${category}`;

  try {
    const response = await queueArxivRequest(() =>
      axios.get(ARXIV_BASE_URL, {
        params: {
          search_query: searchQuery,
          start,
          max_results: safeLimit,
          sortBy: 'submittedDate',
          sortOrder: 'descending',
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'arXiv-Mobile-Client/1.0 (Topic 28 Academic Project)',
        },
      })
    );

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
      page: safePage,
      limit: safeLimit,
      data: items,
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[arxivService] Error fetching arXiv category ${category}:`, error.message);
    const fallbackList = getFallbackPapers().filter((p) => !category || p.primaryCategory === category || p.categories?.includes(category));
    const paged = fallbackList.slice(start, start + safeLimit);
    return {
      status: 'fallback',
      category,
      totalResults: fallbackList.length,
      page: safePage,
      limit: safeLimit,
      data: paged.length > 0 ? paged : getFallbackPapers().slice(0, safeLimit),
      warning: 'Live arXiv request failed or timed out, serving local cached sample papers.',
    };
  }
}

/**
 * Search papers by keyword, category, and sort
 */
async function searchPapers({ query = '', category = '', sortBy = 'relevance', page = 0, limit = 10 } = {}) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  const safePage = Math.max(0, parseInt(page, 10) || 0);
  const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 30));

  const cacheKey = `search:${normalizedQuery}:${category}:${sortBy}:${safePage}:${safeLimit}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return { ...cachedData, fromCache: true };
  }

  const start = safePage * safeLimit;
  let searchQuery = '';
  // Note: Using standard space for boolean AND so Axios encodes properly without double %2B
  if (query && category) {
    searchQuery = `all:${query} AND cat:${category}`;
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
    const response = await queueArxivRequest(() =>
      axios.get(ARXIV_BASE_URL, {
        params: {
          search_query: searchQuery,
          start,
          max_results: safeLimit,
          sortBy: arxivSortBy,
          sortOrder: arxivSortOrder,
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'arXiv-Mobile-Client/1.0 (Topic 28 Academic Project)',
        },
      })
    );

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
      page: safePage,
      limit: safeLimit,
      data: items,
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[arxivService] Error searching arXiv:`, error.message);
    const fallbackList = getFallbackPapers().filter((p) => {
      const titleStr = (p.title || '').toLowerCase();
      const summaryStr = (p.summary || '').toLowerCase();
      const qLower = normalizedQuery;
      const matchQ = !qLower || titleStr.includes(qLower) || summaryStr.includes(qLower);
      const matchC = !category || p.primaryCategory === category || (p.categories && p.categories.includes(category));
      return matchQ && matchC;
    });
    return {
      status: 'fallback',
      query,
      category,
      totalResults: fallbackList.length,
      page: safePage,
      limit: safeLimit,
      data: fallbackList.slice(start, start + safeLimit),
      warning: 'Live arXiv search failed or timed out, serving filtered local sample papers.',
    };
  }
}

/**
 * Get single paper detail by ID
 */
async function getPaperById(id) {
  const cleanId = (id || '').replace(/^arxiv:/i, '').trim();
  const cacheKey = `paper:${cleanId}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await queueArxivRequest(() =>
      axios.get(ARXIV_BASE_URL, {
        params: { id_list: cleanId },
        timeout: 10000,
        headers: {
          'User-Agent': 'arXiv-Mobile-Client/1.0 (Topic 28 Academic Project)',
        },
      })
    );
    const parsed = xmlParser.parse(response.data);
    const feed = parsed.feed || {};
    let entry = feed.entry;
    if (Array.isArray(entry)) entry = entry[0];

    if (entry) {
      const paper = normalizeEntry(entry);
      setCache(cacheKey, paper);
      return paper;
    }
  } catch (err) {
    console.warn(`[arxivService] Failed to fetch paper ${cleanId} from arXiv:`, err.message);
  }

  // Fallback
  const samples = getFallbackPapers();
  const found = samples.find(
    (s) => s.id === cleanId || cleanId.startsWith(s.id) || s.id.startsWith(cleanId)
  );
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
  getFallbackPapers,
};
