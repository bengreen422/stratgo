import React, { useEffect, useState } from 'react';
import './App.css';
import './AppFigma.css';
import './Analytics.css';

// Letter frequencies for board generation
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

const weightedLetters: string[] = [];
letterFrequencies.forEach(({ letter, freq }) => {
  for (let i = 0; i < Math.round(freq * 10); i++) weightedLetters.push(letter);
});

const scoreTable: { [len: number]: number } = {
  2: 2, 3: 3, 4: 4, 5: 6, 6: 8, 7: 11, 8: 14, 9: 19, 10: 24
};

function getScore(word: string) {
  if (word.length >= 11) return 30;
  return scoreTable[word.length] || 0;
}

// Hexagonal adjacency logic
function areHexAdjacent(a: [number, number], b: [number, number]) {
  const [row1, col1] = a;
  const [row2, col2] = b;
  
  if (row1 === row2 && Math.abs(col1 - col2) === 1) return true;
  
  if (Math.abs(row1 - row2) === 1) {
    return Math.abs(col1 - col2) <= 1;
  }
  
  return false;
}

function isContiguous(selected: [number, number][]) {
  if (selected.length <= 1) return true;
  const visited = new Set<string>();
  function dfs(cell: [number, number]) {
    visited.add(cell.join(','));
    for (const next of selected) {
      if (!visited.has(next.join(',')) && areHexAdjacent(cell, next)) dfs(next);
    }
  }
  dfs(selected[0]);
  return visited.size === selected.length;
}

interface Cell {
  letter: string;
  owner: null | 'Player 1' | 'Player 2';
  captured: boolean;
  pulse: boolean;
}

function createHexagonalBoardWithOwnership(letters: string[][]): Cell[][] {
  return letters.map(row => row.map(letter => ({ letter, owner: null, captured: false, pulse: false })));
}

// Hexagonal board generation
function generateHexagonalBoard(rows = 15) {
  const board = [];
  const tilesPerRow = [8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8];
  
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

const SinglePlayerGame: React.FC = () => {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [turn, setTurn] = useState<'Player 1' | 'Player 2'>('Player 1');
  const [selected, setSelected] = useState<[number, number][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [moves, setMoves] = useState<{ player: string, word: string, positions: [number, number][], score: number, capturePoints: number }[]>([]);
  const [scores, setScores] = useState<{ [player: string]: number }>({ 'Player 1': 0, 'Player 2': 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<Set<string> | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load dictionary
  useEffect(() => {
    fetch('/words_alpha.txt')
      .then(response => response.text())
      .then(text => {
        const words = new Set(text.split('\n').map(word => word.trim().toUpperCase()).filter(word => word.length > 1));
        setDictionary(words);
      })
      .catch(error => {
        console.error('Error loading dictionary:', error);
        setDictionary(new Set());
      });
  }, []);

  // Initialize board
  useEffect(() => {
    if (dictionary) {
      setBoard(createHexagonalBoardWithOwnership(generateHexagonalBoard()));
    }
  }, [dictionary]);

  const handleCellClick = (row: number, col: number) => {
    if (gameOver) return;
    
    const cell = board[row][col];
    if (cell.captured) return;

    const position: [number, number] = [row, col];
    const isSelected = selected.some(pos => pos[0] === row && pos[1] === col);
    
    if (isSelected) {
      setSelected(selected.filter(pos => pos[0] !== row || pos[1] !== col));
    } else {
      setSelected([...selected, position]);
    }
    setError(null);
  };

  const handleSubmit = () => {
    if (selected.length === 0) {
      setError('Please select at least one tile');
      return;
    }

    if (!isContiguous(selected)) {
      setError('Selected tiles must be adjacent');
      return;
    }

    const word = selected.map(([row, col]) => board[row][col].letter).join('');
    
    if (!dictionary?.has(word)) {
      setError(`"${word}" is not a valid word`);
      return;
    }

    if (word.length < 2) {
      setError('Word must be at least 2 letters long');
      return;
    }

    const score = getScore(word);
    let capturePoints = 0;

    // Update board with captured tiles
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    selected.forEach(([row, col]) => {
      newBoard[row][col].captured = true;
      newBoard[row][col].owner = turn;
      newBoard[row][col].pulse = true;
      capturePoints += 1;
    });

    // Remove pulse effect after animation
    setTimeout(() => {
      setBoard(prevBoard => 
        prevBoard.map(row => 
          row.map(cell => ({ ...cell, pulse: false }))
        )
      );
    }, 500);

    setBoard(newBoard);
    setSelected([]);
    setError(null);

    const move = {
      player: turn,
      word,
      positions: selected,
      score,
      capturePoints
    };

    setMoves([...moves, move]);
    
    // Update scores
    const newScores = { ...scores };
    newScores[turn] += score + capturePoints;
    setScores(newScores);

    // Check for game over (when all tiles are captured)
    const totalTiles = newBoard.flat().length;
    const capturedTiles = newBoard.flat().filter(cell => cell.captured).length;
    
    if (capturedTiles >= totalTiles) {
      setGameOver(true);
      setWinner(newScores['Player 1'] > newScores['Player 2'] ? 'Player 1' : 'Player 2');
    } else {
      setTurn(turn === 'Player 1' ? 'Player 2' : 'Player 1');
    }
  };

  const resetGame = () => {
    setBoard(createHexagonalBoardWithOwnership(generateHexagonalBoard()));
    setTurn('Player 1');
    setSelected([]);
    setError(null);
    setMoves([]);
    setScores({ 'Player 1': 0, 'Player 2': 0 });
    setGameOver(false);
    setWinner(null);
  };

  const getCurrentWord = () => {
    return selected.map(([row, col]) => board[row][col].letter).join('');
  };

  return (
    <div className="game-container">
      <div className="score-panel">
        <div className="player1">Player 1: {scores['Player 1']}</div>
        <div className="player2">Player 2: {scores['Player 2']}</div>
      </div>

      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>{winner} wins with {scores[winner!]} points!</p>
          <button onClick={resetGame} className="reset-btn">Play Again</button>
        </div>
      )}

      {!gameOver && (
        <div className="turn-indicator">
          Current Turn: <span className={turn === 'Player 1' ? 'player1' : 'player2'}>{turn}</span>
        </div>
      )}

      <div className="hex-board-container">
        <div className="hex-board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="board-row" style={{ marginLeft: rowIndex % 2 === 1 ? '20px' : '0' }}>
              {row.map((cell, colIndex) => {
                const isSelected = selected.some(pos => pos[0] === rowIndex && pos[1] === colIndex);
                const isAdjacent = selected.length > 0 && selected.some(pos => areHexAdjacent(pos, [rowIndex, colIndex]));
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`hex-cell ${cell.owner || ''} ${isSelected ? 'selected' : ''} ${cell.captured ? 'claimed' : ''} ${cell.pulse ? 'pulse' : ''}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    style={{
                      cursor: cell.captured ? 'not-allowed' : 'pointer',
                      opacity: cell.captured ? 0.6 : 1,
                      backgroundColor: isSelected ? '#90ee90' : 
                                    cell.owner === 'Player 1' ? '#35A0FF' :
                                    cell.owner === 'Player 2' ? '#FFA600' : '#fff',
                      color: cell.owner ? '#fff' : '#222'
                    }}
                  >
                    {cell.letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {selected.length > 0 && (
        <div className="selected-word">
          Selected: <strong>{getCurrentWord()}</strong> ({selected.length} tiles)
        </div>
      )}

      {!gameOver && (
        <button 
          onClick={handleSubmit} 
          className="submit-word-btn"
          disabled={selected.length === 0}
        >
          Submit Word
        </button>
      )}

      <div className="move-history">
        <h3>Move History</h3>
        {moves.map((move, index) => (
          <div key={index} className={`move ${move.player}`}>
            <strong>{move.player}</strong>: "{move.word}" ({move.score} + {move.capturePoints} capture = {move.score + move.capturePoints} total)
          </div>
        ))}
      </div>

      <button onClick={() => setShowAnalytics(!showAnalytics)} className="analytics-toggle">
        {showAnalytics ? 'Hide' : 'Show'} Analytics
      </button>

      {showAnalytics && (
        <div className="analytics-container">
          <h3>Game Analytics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Moves</h4>
              <p>{moves.length}</p>
            </div>
            <div className="stat-card">
              <h4>Average Word Length</h4>
              <p>{moves.length > 0 ? (moves.reduce((sum, move) => sum + move.word.length, 0) / moves.length).toFixed(1) : 0}</p>
            </div>
            <div className="stat-card">
              <h4>Longest Word</h4>
              <p>{moves.length > 0 ? Math.max(...moves.map(move => move.word.length)) : 0}</p>
            </div>
            <div className="stat-card">
              <h4>Total Score</h4>
              <p>{scores['Player 1'] + scores['Player 2']}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SinglePlayerGame; 