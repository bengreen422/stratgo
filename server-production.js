const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        players JSONB NOT NULL,
        board JSONB NOT NULL,
        moves JSONB DEFAULT '[]',
        final_scores JSONB,
        winner VARCHAR(50),
        game_duration INTEGER,
        total_moves INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        current_turn VARCHAR(20) DEFAULT 'Player 1'
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_analytics (
        id SERIAL PRIMARY KEY,
        game_id UUID REFERENCES games(id),
        word_length_distribution JSONB,
        capture_events JSONB,
        player_performance JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Hexagonal board generation (matching frontend)
function generateHexagonalBoard(rows = 15) {
  const board = [];
  const tilesPerRow = [8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8];
  
  const letterFrequencies = [
    { letter: 'E', freq: 12.7 }, { letter: 'T', freq: 9.1 }, { letter: 'A', freq: 8.2 },
    { letter: 'O', freq: 7.5 }, { letter: 'I', freq: 7.0 }, { letter: 'N', freq: 6.7 },
    { letter: 'S', freq: 6.3 }, { letter: 'H', freq: 6.1 }, { letter: 'R', freq: 6.0 },
    { letter: 'D', freq: 4.3 }, { letter: 'L', freq: 4.0 }, { letter: 'C', freq: 2.8 },
    { letter: 'U', freq: 2.8 }, { letter: 'M', freq: 2.4 }, { letter: 'W', freq: 2.4 },
    { letter: 'F', freq: 2.2 }, { letter: 'G', freq: 2.0 }, { letter: 'Y', freq: 2.0 },
    { letter: 'P', freq: 1.9 }, { letter: 'B', freq: 1.5 }, { letter: 'V', freq: 1.0 },
    { letter: 'K', freq: 0.8 }, { letter: 'J', freq: 0.15 }, { letter: 'X', freq: 0.15 },
    { letter: 'Q', freq: 0.10 }, { letter: 'Z', freq: 0.07 },
  ];
  
  const weightedLetters = [];
  letterFrequencies.forEach(({ letter, freq }) => {
    for (let i = 0; i < Math.round(freq * 10); i++) weightedLetters.push(letter);
  });
  
  function getRandomLetter() {
    return weightedLetters[Math.floor(Math.random() * weightedLetters.length)];
  }
  
  for (let row = 0; row < rows; row++) {
    const cellsInRow = tilesPerRow[row];
    const rowCells = [];
    for (let col = 0; col < cellsInRow; col++) {
      rowCells.push(getRandomLetter());
    }
    board.push(rowCells);
  }
  
  return board;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a game room
  socket.on('join-game', async (gameId) => {
    socket.join(gameId);
    console.log(`User ${socket.id} joined game ${gameId}`);
    
    // Emit current game state to the joining player
    try {
      const result = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
      if (result.rows.length > 0) {
        const game = result.rows[0];
        socket.emit('game-state', {
          id: game.id,
          board: game.board,
          moves: game.moves || [],
          turn: game.current_turn,
          players: game.players,
          status: game.status
        });
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  });

  // Handle move submission
  socket.on('submit-move', async (data) => {
    const { gameId, word, positions, player, score, capturePoints } = data;
    
    try {
      // Get current game state
      const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
      if (gameResult.rows.length === 0) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      const game = gameResult.rows[0];
      const moves = game.moves || [];
      
      // Add the new move
      const newMove = {
        word,
        positions,
        player,
        score: score || 0,
        capturePoints: capturePoints || 0,
        timestamp: new Date().toISOString()
      };
      
      moves.push(newMove);
      const nextTurn = player === 'Player 1' ? 'Player 2' : 'Player 1';
      
      // Update game in database
      await pool.query(
        'UPDATE games SET moves = $1, total_moves = $2, current_turn = $3 WHERE id = $4',
        [JSON.stringify(moves), moves.length, nextTurn, gameId]
      );
      
      // Broadcast the move to all players in the game
      io.to(gameId).emit('move-submitted', {
        move: newMove,
        nextTurn: nextTurn,
        totalMoves: moves.length
      });
      
    } catch (error) {
      console.error('Error submitting move:', error);
      socket.emit('error', { message: 'Failed to submit move' });
    }
  });

  // Handle game completion
  socket.on('complete-game', async (data) => {
    const { gameId, finalScores, winner } = data;
    
    try {
      await pool.query(
        'UPDATE games SET status = $1, completed_at = $2, final_scores = $3, winner = $4 WHERE id = $5',
        ['completed', new Date(), JSON.stringify(finalScores), winner, gameId]
      );
      
      io.to(gameId).emit('game-completed', { finalScores, winner });
    } catch (error) {
      console.error('Error completing game:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// REST API endpoints
app.post('/api/game', async (req, res) => {
  try {
    const gameId = uuidv4();
    const board = generateHexagonalBoard();
    const players = ['Player 1', 'Player 2'];
    
    const result = await pool.query(
      'INSERT INTO games (id, players, board) VALUES ($1, $2, $3) RETURNING *',
      [gameId, JSON.stringify(players), JSON.stringify(board)]
    );
    
    res.json({
      id: gameId,
      board: board,
      turn: 'Player 1',
      moves: [],
      players: players
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

app.get('/api/game/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const game = result.rows[0];
    res.json({
      id: game.id,
      board: game.board,
      moves: game.moves || [],
      turn: game.current_turn,
      players: game.players,
      status: game.status,
      finalScores: game.final_scores
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

app.get('/api/games', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    let query = 'SELECT id, created_at, completed_at, players, final_scores, winner, total_moves, status FROM games';
    const params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    // Word length distribution
    const wordLengthResult = await pool.query(`
      SELECT 
        jsonb_array_elements(moves)->>'word' as word,
        LENGTH(jsonb_array_elements(moves)->>'word') as word_length
      FROM games 
      WHERE status = 'completed'
    `);
    
    // Player performance
    const playerPerformanceResult = await pool.query(`
      SELECT 
        jsonb_array_elements(moves)->>'player' as player,
        AVG(CAST(jsonb_array_elements(moves)->>'score' AS INTEGER)) as avg_score,
        COUNT(*) as total_moves
      FROM games 
      WHERE status = 'completed'
      GROUP BY player
    `);
    
    // Game duration statistics
    const durationResult = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_duration_minutes,
        COUNT(*) as total_completed_games
      FROM games 
      WHERE status = 'completed'
    `);
    
    res.json({
      wordLengthDistribution: wordLengthResult.rows,
      playerPerformance: playerPerformanceResult.rows,
      gameDuration: durationResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

const PORT = process.env.PORT || 4000;

// Initialize database and start server
initializeDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Production server running on port ${PORT}`);
    console.log(`Socket.io server ready for real-time connections`);
  });
}); 