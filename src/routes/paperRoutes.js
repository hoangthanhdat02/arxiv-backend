const express = require('express');
const router = express.Router();
const { fetchPapers, searchPapers, getPaperById } = require('../services/arxivService');
const { generateCitation } = require('../services/bibtexService');

/**
 * GET /api/papers
 * Query: category (cs.AI, cs.LG), page (default 0), limit (default 10)
 */
router.get('/papers', async (req, res) => {
  try {
    const category = req.query.category || 'cs.AI';
    const page = Math.max(0, parseInt(req.query.page || '0', 10) || 0);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '10', 10) || 10, 30));

    const result = await fetchPapers({ category, page, limit });
    return res.json(result);
  } catch (error) {
    console.error('[Route /papers] Error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/papers/:id
 */
router.get('/papers/:id', async (req, res) => {
  try {
    const paper = await getPaperById(req.params.id);
    return res.json({ status: 'success', data: paper });
  } catch (error) {
    console.error(`[Route /papers/${req.params.id}] Error:`, error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/search
 * Query: q (keyword), category (cs.AI/cs.LG), sortBy (relevance/submittedDate), page, limit
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || req.query.query || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'relevance';
    const page = Math.max(0, parseInt(req.query.page || '0', 10) || 0);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '10', 10) || 10, 30));

    const result = await searchPapers({ query, category, sortBy, page, limit });
    return res.json(result);
  } catch (error) {
    console.error('[Route /search] Error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/bibtex/:paperId
 */
router.get('/bibtex/:paperId', async (req, res) => {
  try {
    const citation = await generateCitation(req.params.paperId);
    return res.json(citation);
  } catch (error) {
    console.error(`[Route /bibtex/${req.params.paperId}] Error:`, error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/health
 */
router.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'arxiv-backend-express',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    emulatorNote: 'Connect Android Virtual Device via http://10.0.2.2:3001/api',
  });
});

module.exports = router;
