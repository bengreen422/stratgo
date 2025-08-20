import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';
import './AppFigma.css';
import './Analytics.css';
import Analytics from './Analytics';

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

const MultiplayerGame: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
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
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [myPlayer, setMyPlayer] = useState<'Player 1' | 'Player 2' | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('https://5b27d1b8a4e7.ngrok-free.app');
    setSocket(newSocket);

    newSocket.on('game-state', (gameState) => {
      setBoard(createHexagonalBoardWithOwnership(gameState.board));
      setTurn(gameState.turn);
      setMoves(gameState.moves || []);
      setGameOver(gameState.status === 'completed');
      
      // Calculate scores from moves
      const newScores = { 'Player 1': 0, 'Player 2': 0 };
      gameState.moves?.forEach((move: any) => {
        if (move.player === 'Player 1' || move.player === 'Player 2') {
          newScores[move.player as keyof typeof newScores] += move.score + move.capturePoints;
        }
      });
      setScores(newScores);
    });

    newSocket.on('move-submitted', (data) => {
      // Update local state with the new move
      setMoves(prev => [...prev, data.move]);
      setTurn(data.nextTurn);
      setSelected([]);
      
      // Update scores
      setScores(prev => ({
        ...prev,
        [data.move.player]: prev[data.move.player] + data.move.score + data.move.capturePoints
      }));
    });

    newSocket.on('game-completed', (data) => {
      setGameOver(true);
      setWinner(data.winner);
      setScores(data.finalScores);
    });

    newSocket.on('error', (error) => {
      setError(error.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Load dictionary
  useEffect(() => {
    fetch('/words_alpha.txt')
      .then(res => res.text())
      .then(text => {
        const words = text.split(/\r?\n/).map(w => w.trim().toUpperCase());
        const validWords = words.filter(w => w.length >= 2);
        const wordSet = new Set(validWords);
        setDictionary(wordSet);
      })
      .catch(error => {
        console.error('Error loading dictionary:', error);
      });
  }, []);

  // Create new game
  const createGame = async () => {
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const game = await response.json();
      setGameId(game.id);
      setBoard(createHexagonalBoardWithOwnership(game.board));
      setTurn('Player 1');
      setSelected([]);
      setMoves([]);
      setScores({ 'Player 1': 0, 'Player 2': 0 });
      setGameOver(false);
      setWinner(null);
      setMyPlayer('Player 1');
      setIsMyTurn(true);
      
      // Join the game room
      socket?.emit('join-game', game.id);
    } catch (error) {
      setError('Failed to create game');
    }
  };

  // Join existing game
  const joinGame = (id: string) => {
    setGameId(id);
    setMyPlayer('Player 2');
    setIsMyTurn(false);
    socket?.emit('join-game', id);
  };

  // Handle cell click
  const handleCellClick = (i: number, j: number) => {
    if (gameOver || !isMyTurn) return;
    
    if (board[i][j].owner !== null) {
      setError('Cannot select claimed tiles');
      return;
    }
    
    const idx = selected.findIndex(([x, y]) => x === i && y === j);
    let newSelected: [number, number][];
    
    if (idx !== -1) {
      newSelected = selected.slice(0, idx).concat(selected.slice(idx + 1));
    } else {
      if (selected.length === 0) {
        newSelected = [[i, j]];
      } else {
        const lastSelected = selected[selected.length - 1];
        const isAdjacentToLast = areHexAdjacent(lastSelected, [i, j]);
        if (!isAdjacentToLast) {
          setError('Tiles must be adjacent to the previous tile to form a word');
          return;
        }
        newSelected = [...selected, [i, j]];
      }
    }
    
    setSelected(newSelected);
    setError(null);
  };

  // Handle submit
  const handleSubmit = () => {
    if (gameOver || !isMyTurn || !socket || !gameId) return;
    
    if (selected.length < 2) {
      setError('Word must be at least 2 letters.');
      return;
    }
    
    if (!isContiguous(selected)) {
      setError('Selected letters must be contiguous.');
      return;
    }
    
    if (!dictionary) {
      setError('Dictionary not loaded yet.');
      return;
    }
    
    const word = selected.map(([i, j]) => board[i]?.[j]?.letter || '').join('').toUpperCase();
    if (!dictionary.has(word)) {
      setError('Word not in dictionary.');
      return;
    }
    
    const score = getScore(word);
    
    // Submit move via socket
    socket.emit('submit-move', {
      gameId,
      word,
      positions: selected,
      player: myPlayer,
      score,
      capturePoints: 0 // Simplified for MVP
    });
    
    setIsMyTurn(false);
  };

  // Helper: get word from selected cells
  const selectedWord = selected.map(([i, j]) => board[i]?.[j]?.letter || '').join('');

  // Calculate board width for layout
  const boardWidth = 15 * 40;

  if (showAnalytics) {
    return (
      <div>
        <button onClick={() => setShowAnalytics(false)} style={{ marginBottom: 20 }}>
          ← Back to Game
        </button>
        <Analytics />
      </div>
    );
  }

  if (!gameId) {
    return (
      <div className="App">
        <h1>Word Strategy Game - Multiplayer</h1>
        <div style={{ margin: '20px 0' }}>
          <button onClick={createGame} style={{ marginRight: 10, padding: '10px 20px' }}>
            Create New Game
          </button>
          <input 
            type="text" 
            placeholder="Enter Game ID to join"
            style={{ padding: '10px', marginRight: 10 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                joinGame(input.value);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Word Strategy Game (Multiplayer)</h1>
      <div><strong>Game ID:</strong> {gameId}</div>
      <div><strong>Current Turn:</strong> {turn}</div>
      <div><strong>You are:</strong> {myPlayer}</div>
      <div><strong>Your turn:</strong> {isMyTurn ? 'Yes' : 'No'}</div>
      
      {gameOver && (
        <div style={{ background: '#eee', padding: 20, borderRadius: 8, margin: 20 }}>
          <h2>Game Over</h2>
          {winner === 'Draw' ? <div><strong>It's a draw!</strong></div> : <div><strong>{winner} wins!</strong></div>}
          <button onClick={createGame}>New Game</button>
        </div>
      )}
      
      {/* Hexagonal Board */}
      <div style={{ display: 'inline-block', marginTop: 20 }}>
        <div
          className="hex-board-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            width: 15 * 40,
            margin: '0 auto',
            height: 15 * 40,
            position: 'relative',
          }}
        >
          {board.map((row, i) => {
            const rowWidth = row.length * 40;
            const maxWidth = 15 * 40;
            const rowOffset = (maxWidth - rowWidth) / 2;
            const verticalOffset = i * 35;
            
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 0,
                  justifyContent: 'center',
                  position: 'absolute',
                  left: rowOffset,
                  top: verticalOffset,
                  width: rowWidth,
                  height: 46,
                  overflow: 'visible',
                }}
              >
                {row.map((cell, j) => {
                  const isSelected = selected.some(([x, y]) => x === i && y === j);
                  const claimed = cell.owner !== null;
                  let cellClass = 'hex-cell';
                  
                  if (i === 7 && j === 7) {
                    cellClass += ' center-tile';
                  }
                  
                  if (isSelected) {
                    cellClass += ' selected';
                    if (turn === 'Player 2') {
                      cellClass += ' player2-selected';
                    }
                  }
                  
                  if (claimed) {
                    cellClass += cell.owner === 'Player 1' ? ' player1 claimed' : ' player2 claimed';
                  }
                  
                  return (
                    <div
                      key={j}
                      className={cellClass}
                      style={{ 
                        opacity: cell.captured ? 0.5 : 1,
                        cursor: isMyTurn && !claimed ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (isMyTurn && !claimed) handleCellClick(i, j);
                      }}
                    >
                      {cell.letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      
      <div style={{ marginTop: 20 }}>
        <strong>Selected Word:</strong> {selectedWord}
      </div>
      
      {/* Player Scores and Submit Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: boardWidth, margin: '30px auto 0 auto' }}>
        <div className="player-score-left" style={{ textAlign: 'left', minWidth: 120 }}>
          <div style={{ color: '#3399ff', fontWeight: 'bold', fontSize: 48, lineHeight: 1 }}>{scores['Player 1']}</div>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>Player 1</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: 32, marginBottom: 10 }}>{selectedWord}</div>
          <button
            className="submit-word-btn"
            style={{
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '16px 48px',
              fontWeight: 'bold',
              fontSize: 20,
              margin: '0 auto',
              display: 'block',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: isMyTurn ? 'pointer' : 'not-allowed',
              opacity: isMyTurn ? 1 : 0.5
            }}
            onClick={handleSubmit}
            disabled={!isMyTurn || selected.length === 0 || gameOver}
          >
            Submit Word
          </button>
        </div>
        <div className="player-score-right" style={{ textAlign: 'right', minWidth: 120 }}>
          <div style={{ color: '#FFA600', fontWeight: 'bold', fontSize: 48, lineHeight: 1 }}>{scores['Player 2']}</div>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>Player 2</div>
        </div>
      </div>
      
      {/* Player Words List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: boardWidth, margin: '30px auto 0 auto' }}>
        <div style={{ textAlign: 'left', minWidth: 180 }}>
          {moves.filter(m => m.player === 'Player 1').map((move, idx, arr) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: idx === arr.length - 1 ? 'bold' : 'normal', borderRadius: 6, padding: 0, marginBottom: 2, textAlign: 'left' }}>
              <span>{move.word}</span>
              <span>{move.score + move.capturePoints}</span>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #222', margin: '8px 0' }}></div>
          <div style={{ fontWeight: 'bold', marginTop: 4 }}>TOTAL {scores['Player 1']}</div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 180 }}>
          {moves.filter(m => m.player === 'Player 2').map((move, idx, arr) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: idx === arr.length - 1 ? 'bold' : 'normal', borderRadius: 6, padding: 0, marginBottom: 2, textAlign: 'left' }}>
              <span>{move.word}</span>
              <span>{move.score + move.capturePoints}</span>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #222', margin: '8px 0' }}></div>
          <div style={{ fontWeight: 'bold', marginTop: 4 }}>TOTAL {scores['Player 2']}</div>
        </div>
      </div>
      
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button onClick={() => setShowAnalytics(true)} style={{ padding: '12px 32px', borderRadius: 24, background: '#222', color: '#fff', fontWeight: 'bold', fontSize: 18, border: 'none', cursor: 'pointer', marginRight: 10 }}>
          View Analytics
        </button>
        <button onClick={createGame} style={{ padding: '12px 32px', borderRadius: 24, background: '#35A0FF', color: '#fff', fontWeight: 'bold', fontSize: 18, border: 'none', cursor: 'pointer' }}>
          New Game
        </button>
      </div>
    </div>
  );
};

export default MultiplayerGame; 