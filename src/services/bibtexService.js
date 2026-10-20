const { getPaperById } = require('./arxivService');

// arXiv titles/authors arrive with hard line breaks and runs of spaces from the Atom XML
function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

/**
 * Generate standard BibTeX @misc block and APA string for a paper
 */
async function generateCitation(paperId) {
  const paper = await getPaperById(paperId);
  const cleanId = paper.id.replace(/[^a-zA-Z0-9._-]/g, '');

  const title = clean(paper.title);
  const authors = (paper.authors || []).map(clean).filter(Boolean);
  const year = paper.published ? new Date(paper.published).getUTCFullYear() : new Date().getUTCFullYear();
  const authorsBib = authors.length > 0 ? authors.join(' and ') : 'Anonymous';
  const url = paper.arxivUrl || `https://arxiv.org/abs/${paper.id}`;

  // Format BibTeX
  const doiField = paper.doi ? `\n  doi = {${paper.doi}},` : '';
  const bibtex = `@misc{arxiv:${cleanId},
  title = {${title}},
  author = {${authorsBib}},
  year = {${year}},
  eprint = {${paper.id}},
  archivePrefix = {arXiv},
  primaryClass = {${paper.primaryCategory || 'cs.AI'}},${doiField}
  url = {${url}}
}`;

  // Format APA 7th style
  let authorsApa = 'Anonymous';
  if (authors.length === 1) {
    authorsApa = authors[0];
  } else if (authors.length === 2) {
    authorsApa = `${authors[0]} & ${authors[1]}`;
  } else if (authors.length > 2) {
    authorsApa = `${authors[0]} et al.`;
  }
  const doiApa = paper.doi ? ` https://doi.org/${paper.doi}` : '';
  const apa = `${authorsApa} (${year}). ${title}. arXiv preprint arXiv:${paper.id}.${doiApa} ${url}`;

  return {
    status: 'success',
    paperId: paper.id,
    title,
    year,
    doi: paper.doi || null,
    bibtex,
    apa,
  };
}

module.exports = {
  generateCitation,
};
