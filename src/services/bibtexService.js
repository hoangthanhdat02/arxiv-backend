const { getPaperById } = require('./arxivService');

/**
 * Generate standard BibTeX @misc block and APA string for a paper
 */
async function generateCitation(paperId) {
  const paper = await getPaperById(paperId);
  const cleanId = paper.id.replace(/[^a-zA-Z0-9._-]/g, '');

  const year = paper.published ? new Date(paper.published).getFullYear() : new Date().getFullYear();
  const authorsBib = paper.authors && paper.authors.length > 0 ? paper.authors.join(' and ') : 'Anonymous';

  // Format BibTeX
  const bibtex = `@misc{arxiv:${cleanId},
  title = {${paper.title}},
  author = {${authorsBib}},
  year = {${year}},
  eprint = {${paper.id}},
  archivePrefix = {arXiv},
  primaryClass = {${paper.primaryCategory || 'cs.AI'}},
  url = {${paper.arxivUrl || `https://arxiv.org/abs/${paper.id}`}}
}`;

  // Format APA 7th style
  let authorsApa = 'Anonymous';
  if (paper.authors && paper.authors.length > 0) {
    if (paper.authors.length === 1) {
      authorsApa = paper.authors[0];
    } else if (paper.authors.length === 2) {
      authorsApa = `${paper.authors[0]} & ${paper.authors[1]}`;
    } else {
      authorsApa = `${paper.authors[0]} et al.`;
    }
  }
  const apa = `${authorsApa} (${year}). ${paper.title}. arXiv preprint arXiv:${paper.id}. ${paper.arxivUrl || ''}`;

  return {
    status: 'success',
    paperId: paper.id,
    title: paper.title,
    year,
    bibtex,
    apa,
  };
}

module.exports = {
  generateCitation,
};
