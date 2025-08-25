import React, { useEffect, useState } from 'react';
import './App.css';
import './AppFigma.css';

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

function App() {
  const [board, setBoard] = useState<string[][]>([]);
  const [selectedTiles, setSelectedTiles] = useState<[number, number][]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState<Array<{ word: string; score: number; positions: [number, number][] }>>([]);
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load dictionary
  useEffect(() => {
    fetch('/words_alpha.txt')
      .then(response => response.text())
      .then(text => {
        const words = new Set(text.split('\n').map(word => word.trim().toUpperCase()));
        setDictionary(words);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading dictionary:', error);
        setIsLoading(false);
      });
  }, []);

  // Generate hexagonal board
  useEffect(() => {
    const size = 19;
    const newBoard: string[][] = [];
    
    for (let i = 0; i < size; i++) {
      const row: string[] = [];
      for (let j = 0; j < size; j++) {
        row.push(weightedLetters[Math.floor(Math.random() * weightedLetters.length)]);
      }
      newBoard.push(row);
    }
    
    setBoard(newBoard);
  }, []);

  const handleTileClick = (row: number, col: number) => {
    const isSelected = selectedTiles.some(([r, c]) => r === row && c === col);
    
    if (isSelected) {
      // Deselect tile
      setSelectedTiles(selectedTiles.filter(([r, c]) => !(r === row && c === col)));
    } else {
      // Select tile
      setSelectedTiles([...selectedTiles, [row, col]]);
    }
  };

  const handleSubmit = () => {
    if (selectedTiles.length === 0) return;

    // Build word from selected tiles
    const word = selectedTiles
      .sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0];
        return a[1] - b[1];
      })
      .map(([row, col]) => board[row][col])
      .join('');

    // Validate word
    if (word.length < 3) {
      alert('Words must be at least 3 letters long');
      return;
    }

    if (!dictionary.has(word)) {
      alert(`"${word}" is not a valid word`);
      return;
    }

    // Check if first move includes center
    if (moves.length === 0) {
      const center = [9, 9];
      const includesCenter = selectedTiles.some(([row, col]) => row === center[0] && col === center[1]);
      if (!includesCenter) {
        alert('First word must include the center tile');
        return;
      }
    }

    // Calculate score
    const wordScore = getScore(word);
    const newScore = score + wordScore;

    // Add move
    const newMove = { word, score: wordScore, positions: [...selectedTiles] };
    setMoves([...moves, newMove]);
    setScore(newScore);
    setSelectedTiles([]);
    setCurrentWord('');
  };

  const isTileSelected = (row: number, col: number) => {
    return selectedTiles.some(([r, c]) => r === row && c === col);
  };

  const isTileClaimed = (row: number, col: number) => {
    return moves.some(move => 
      move.positions.some(([r, c]) => r === row && c === col)
    );
  };

  const getTileClass = (row: number, col: number) => {
    let className = 'hex-cell';
    
    if (row === 9 && col === 9) {
      className += ' center';
    }
    
    if (isTileSelected(row, col)) {
      className += ' selected';
    } else if (isTileClaimed(row, col)) {
      className += ' claimed';
    }
    
    return className;
  };

  if (isLoading) {
    return <div>Loading dictionary...</div>;
  }

  return (
    <div className="App">
      <h1>🎮 StratGO - Hexagonal Word Game</h1>
      
      <div className="score-panel">
        <div>Score: <span className="player1">{score}</span></div>
      </div>

      <div className="hex-board-container">
        <div className="hex-board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="hex-row" style={{ marginLeft: rowIndex % 2 === 1 ? '20px' : '0' }}>
              {row.map((letter, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getTileClass(rowIndex, colIndex)}
                  onClick={() => handleTileClick(rowIndex, colIndex)}
                >
                  {letter}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button 
        className="submit-word-btn" 
        onClick={handleSubmit}
        disabled={selectedTiles.length === 0}
      >
        Submit Word ({selectedTiles.length} tiles)
      </button>

      <div className="move-history">
        <h3>Move History:</h3>
        {moves.map((move, index) => (
          <div key={index} className="player1">
            {move.word} (+{move.score})
          </div>
        ))}
      </div>
    </div>
  );
}

export default App; 