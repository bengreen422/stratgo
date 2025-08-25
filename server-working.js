const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Dictionary endpoint
app.get('/words_alpha.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'words_alpha.txt'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'StratGO server running' });
});

// Catch all - serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 StratGO server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📚 Dictionary loaded from: /words_alpha.txt`);
}); 