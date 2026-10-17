require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paperRoutes = require('./routes/paperRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger for debugging Android Emulator traffic
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// REST API routes
app.use('/api', paperRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'arXiv Mobile Gateway & Middleware Service (Topic 28)',
    status: 'running',
    endpoints: {
      papers: '/api/papers?category=cs.AI&page=0&limit=10',
      search: '/api/search?q=transformer&category=cs.AI',
      bibtex: '/api/bibtex/2401.12345',
      health: '/api/health',
    },
    clientGuide: {
      localWeb: `http://localhost:${PORT}`,
      androidEmulator: `http://10.0.2.2:${PORT}`,
    },
  });
});

// Start Express server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`🚀 arXiv Express Backend Gateway is RUNNING on port ${PORT}`);
  console.log(`🌐 Local machine:          http://localhost:${PORT}`);
  console.log(`📱 Android Emulator (AVD):  http://10.0.2.2:${PORT}`);
  console.log(`📡 Sample Feed API:        http://localhost:${PORT}/api/papers?category=cs.AI`);
  console.log(`🔎 Sample Search API:      http://localhost:${PORT}/api/search?q=transformer`);
  console.log('====================================================');
});

module.exports = app;
