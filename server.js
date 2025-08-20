const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // npm install uuid
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Serve the dictionary file
app.get('/words_alpha.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'words_alpha.txt'));
});

const games = {};

// Helper: generate board (reuse your existing function)
function generateBoard(size = 19) {
  // ... your existing board generation code ...
  // For now, use a simple random board:
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const board = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(letters[Math.floor(Math.random() * letters.length)]);
    }
    board.push(row);
  }
  return board;
}

// Create a new game
app.post('/api/game', (req, res) => {
  const id = uuidv4();
  const board = generateBoard();
  games[id] = {
    board,
    moves: [],
    turn: 'Player 1',
    // Add more state as needed
  };
  res.json({ id, board: games[id].board, turn: games[id].turn, moves: games[id].moves });
});

// Get game state
app.get('/api/game/:id', (req, res) => {
  const game = games[req.params.id];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

// Submit a move
app.post('/api/game/:id/move', (req, res) => {
  const game = games[req.params.id];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const { word, positions, player } = req.body;
  if (!word || !positions || !player) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Enforce center square rule for first move
  const center = [9, 9];
  if (game.moves.length === 0) {
    const includesCenter = positions.some(([i, j]) => i === center[0] && j === center[1]);
    if (!includesCenter) {
      return res.status(400).json({ error: 'First word must include the center square.' });
    }
  }
  // TODO: Add more validation, update board, scoring, etc.
  game.moves.push({ word, positions, player });
  game.turn = player === 'Player 1' ? 'Player 2' : 'Player 1';
  res.json(game);
});

app.listen(4000, () => console.log('Server running on http://localhost:4000')); 