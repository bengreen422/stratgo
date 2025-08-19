import React, { useEffect, useState } from 'react';
import './App.css';
import './AppFigma.css'; // Figma UI update START
import ReactMarkdown from 'react-markdown';

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
function getRandomLetter() {
  return weightedLetters[Math.floor(Math.random() * weightedLetters.length)];
}
function generateBoard(size = 19) {
  return Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => getRandomLetter())
  );
}

const scoreTable: { [len: number]: number } = {
  2: 2, 3: 3, 4: 4, 5: 6, 6: 8, 7: 11, 8: 14, 9: 19, 10: 24
};
function getScore(word: string) {
  if (word.length >= 11) return 30;
  return scoreTable[word.length] || 0;
}

function areAdjacent(a: [number, number], b: [number, number]) {
  const [x1, y1] = a;
  const [x2, y2] = b;
  return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1 && !(x1 === x2 && y1 === y2);
}
function isContiguous(selected: [number, number][]) {
  if (selected.length <= 1) return true;
  const visited = new Set<string>();
  function dfs(cell: [number, number]) {
    visited.add(cell.join(','));
    for (const next of selected) {
      if (!visited.has(next.join(',')) && areAdjacent(cell, next)) dfs(next);
    }
  }
  dfs(selected[0]);
  return visited.size === selected.length;
}

const center = [9, 9];

// Figma UI update START
// Cell type for ownership and capture
interface Cell {
  letter: string;
  owner: null | 'Player 1' | 'Player 2';
  captured: boolean;
  pulse: boolean;
}

function createBoardWithOwnership(letters: string[][]): Cell[][] {
  return letters.map(row => row.map(letter => ({ letter, owner: null, captured: false, pulse: false })));
}
// Figma UI update END

function App() {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [turn, setTurn] = useState<'Player 1' | 'Player 2'>('Player 1');
  const [selected, setSelected] = useState<[number, number][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [moves, setMoves] = useState<{ player: string, word: string, positions: [number, number][], score: number, capturePoints: number }[]>([]);
  const [scores, setScores] = useState<{ [player: string]: number }>({ 'Player 1': 0, 'Player 2': 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<Set<string> | null>(null);
  const [passCount, setPassCount] = useState(0);
  // Add modal state
  const [showInstructions, setShowInstructions] = useState(false);

  // Replace board generation
  useEffect(() => {
    const letters = generateBoard();
    setBoard(createBoardWithOwnership(letters));
    // Load dictionary
    fetch('/words_alpha.txt')
      .then(res => res.text())
      .then(text => {
        const words = text.split(/\r?\n/).map(w => w.trim().toUpperCase());
        setDictionary(new Set(words));
      });
  }, []);

  // Helper: get word from selected cells
  const selectedWord = selected.map(([i, j]) => board[i]?.[j]?.letter || '').join('');

  // Handle cell click
  const handleCellClick = (i: number, j: number) => {
    if (gameOver) return;
    
    // --- BEGIN: New contiguous word creation logic (for easy rollback) ---
    // Check if cell is already claimed
    if (board[i][j].owner !== null) {
      setError('Cannot select claimed tiles');
      return;
    }
    
    const idx = selected.findIndex(([x, y]) => x === i && y === j);
    let newSelected: [number, number][];
    
    if (idx !== -1) {
      // Deselecting a tile - always allowed
      newSelected = selected.slice(0, idx).concat(selected.slice(idx + 1));
    } else {
      // Selecting a new tile - must be contiguous
      if (selected.length === 0) {
        // First tile can be any unclaimed tile
        newSelected = [[i, j]];
      } else {
        // Subsequent tiles must be adjacent to the most recently selected tile
        const lastSelected = selected[selected.length - 1];
        const isAdjacentToLast = areAdjacent(lastSelected, [i, j]);
        if (!isAdjacentToLast) {
          setError('Tiles must be adjacent to the previous tile to form a word');
          return;
        }
        newSelected = [...selected, [i, j]];
      }
    }
    // --- END: New contiguous word creation logic ---
    
    // --- BEGIN: Old logic for easy rollback ---
    /*
    const idx = selected.findIndex(([x, y]) => x === i && y === j);
    let newSelected: [number, number][];
    if (idx !== -1) {
      newSelected = selected.slice(0, idx).concat(selected.slice(idx + 1));
    } else {
      newSelected = [...selected, [i, j]];
    }
    */
    // --- END: Old logic ---
    
    setSelected(newSelected);
    setError(null);
  };

  // Helper: check if cell is claimed
  const isCellClaimed = (i: number, j: number, moves: { positions: [number, number][] }[]) => {
    return board[i][j].owner !== null;
  };

  // --- Encirclement Logic Version 1 ---
  // This is the preferred and tested encirclement logic as of [date].
  // To roll back to this version, search for 'Encirclement Logic Version 1'.
  // The logic allows capture even if there are unclaimed tiles adjacent, as long as those unclaimed tiles are also fully surrounded and cannot form a valid word.
  // The previous logic is commented out below for easy rollback.
  // --- END Encirclement Logic Version 1 ---
  function findEncircledGroups(board: Cell[][], currentPlayer: 'Player 1' | 'Player 2', dictionary: Set<string>): [number, number][][] {
    const size = board.length;
    const opponent = currentPlayer === 'Player 1' ? 'Player 2' : 'Player 1';
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const groups: [number, number][][] = [];
    function isEdge(i: number, j: number) {
      return i === 0 || j === 0 || i === size - 1 || j === size - 1;
    }
    function bfs(startI: number, startJ: number) {
      const queue: [number, number][] = [[startI, startJ]];
      const group: [number, number][] = [];
      let edgeTouches = 0;
      visited[startI][startJ] = true;
      const edgeSet = new Set<string>();
      while (queue.length) {
        const [i, j] = queue.shift()!;
        group.push([i, j]);
        if (isEdge(i, j)) {
          // Count unique edges, not unique edge positions
          if (i === 0) edgeSet.add('top');
          if (i === size - 1) edgeSet.add('bottom');
          if (j === 0) edgeSet.add('left');
          if (j === size - 1) edgeSet.add('right');
        }
        for (const [di, dj] of [
          [-1, 0], [1, 0], [0, -1], [0, 1]
        ]) {
          const ni = i + di, nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= size || nj >= size) continue;
          const cell = board[ni][nj];
          if (!visited[ni][nj] && cell.owner === opponent && !cell.captured) {
            visited[ni][nj] = true;
            queue.push([ni, nj]);
          }
        }
      }
      edgeTouches = edgeSet.size;
      return { group, edgeTouches };
    }
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!visited[i][j] && board[i][j].owner === opponent && !board[i][j].captured) {
          const { group, edgeTouches } = bfs(i, j);
          console.log('Checking group:', group, 'edgeTouches:', edgeTouches);
          if (edgeTouches > 1) {
            console.log('Group touches more than one edge, skipping');
            continue;
          }
          // --- BEGIN: Old adjacency-based surrounded check (commented for rollback) ---
          /*
          let surrounded = true;
          for (const [x, y] of group) {
            for (const [di, dj] of [
              [-1, 0], [1, 0], [0, -1], [0, 1]
            ]) {
              const ni = x + di, nj = y + dj;
              if (ni < 0 || nj < 0 || ni >= size || nj >= size) continue;
              const cell = board[ni][nj];
              if (cell.owner !== currentPlayer && cell.owner !== opponent) surrounded = false;
            }
          }
          if (!surrounded) {
            console.log('Group not fully surrounded, skipping');
            continue;
          }
          */
          // --- END: Old adjacency-based surrounded check ---
          // --- BEGIN: Old logic for easy rollback ---
          /*
          // New encirclement logic: expand group to include any unclaimed tiles fully enclosed by the boundary. Only capture if no valid word can be formed from the unclaimed tiles inside the boundary.
          // 1. Find all unclaimed tiles orthogonally connected to the group that are also fully enclosed (do not touch more than one edge or connect to outside)
          const groupSet = new Set(group.map(([x, y]) => `${x},${y}`));
          const enclosedUnclaimed: [number, number][] = [];
          for (const [x, y] of group) {
            for (const [di, dj] of [
              [-1, 0], [1, 0], [0, -1], [0, 1]
            ]) {
              const ni = x + di, nj = y + dj;
              if (ni < 0 || nj < 0 || ni >= size || nj >= size) continue;
              if (board[ni][nj].owner === null && !groupSet.has(`${ni},${nj}`)) {
                // Check if this unclaimed tile is fully enclosed (BFS to see if it can reach the edge without passing through currentPlayer's tiles)
                const queue: [number, number][] = [[ni, nj]];
                const visitedUnclaimed = new Set([`${ni},${nj}`]);
                let touchesEdge = false;
                let escapes = false;
                while (queue.length) {
                  const [ui, uj] = queue.shift()!;
                  if (isEdge(ui, uj)) touchesEdge = true;
                  for (const [udi, udj] of [
                    [-1, 0], [1, 0], [0, -1], [0, 1]
                  ]) {
                    const vi = ui + udi, vj = uj + udj;
                    if (vi < 0 || vj < 0 || vi >= size || vj >= size) continue;
                    if (board[vi][vj].owner === currentPlayer) continue; // blocked by current player's tile
                    if (!visitedUnclaimed.has(`${vi},${vj}`) && board[vi][vj].owner === null) {
                      visitedUnclaimed.add(`${vi},${vj}`);
                      queue.push([vi, vj]);
                    }
                  }
                }
                if (!touchesEdge) {
                  enclosedUnclaimed.push([ni, nj]);
                  groupSet.add(`${ni},${nj}`);
                }
              }
            }
          }
          // Now, group + enclosedUnclaimed is the full encircled area
          const allEncircled = [...group, ...enclosedUnclaimed];
          const groupLetters = allEncircled.filter(([x, y]) => board[x][y].owner === null).map(([x, y]) => board[x][y].letter);
          let hasValidWord = false;
          for (let len = 2; len <= groupLetters.length; len++) {
            for (let start = 0; start <= groupLetters.length - len; start++) {
              const word = groupLetters.slice(start, start + len).join('').toUpperCase();
              if (dictionary.has(word)) {
                hasValidWord = true;
                break;
              }
            }
            if (hasValidWord) break;
          }
          if (hasValidWord) {
            console.log('Group has valid word, skipping:', groupLetters);
          }
          if (!hasValidWord) {
            console.log('Group is encircled and has no valid word:', allEncircled);
            groups.push(group);
          }
          */
          // --- END: Old logic for easy rollback ---
          // --- BEGIN: Simplified encirclement logic (for easy rollback) ---
          // Simplified approach: Check if the group is surrounded by current player's tiles
          // and if any unclaimed tiles within the surrounded area can form valid words
          
          // Step 1: Check if group touches multiple edges (can't be encircled)
          const edgesTouched = new Set<string>();
          for (const [x, y] of group) {
            if (isEdge(x, y)) {
              if (x === 0) edgesTouched.add('top');
              if (x === size - 1) edgesTouched.add('bottom');
              if (y === 0) edgesTouched.add('left');
              if (y === size - 1) edgesTouched.add('right');
            }
          }
          console.log('Group touches edges:', Array.from(edgesTouched));
          if (edgesTouched.size > 1) {
            console.log('Group touches multiple edges, not encircled');
            continue;
          }
          
          // Step 2: Find all unclaimed tiles that are adjacent to the group
          const adjacentUnclaimed: [number, number][] = [];
          const groupSet = new Set(group.map(([x, y]) => `${x},${y}`));
          
          for (const [x, y] of group) {
            for (const [di, dj] of [
              [-1, 0], [1, 0], [0, -1], [0, 1]
            ]) {
              const ni = x + di, nj = y + dj;
              if (ni < 0 || nj < 0 || ni >= size || nj >= size) continue;
              if (board[ni][nj].owner === null && !groupSet.has(`${ni},${nj}`)) {
                adjacentUnclaimed.push([ni, nj]);
              }
            }
          }
          
          // Step 3: Check if any of these adjacent unclaimed tiles can reach an edge
          // without passing through current player's tiles
          let canEscape = false;
          for (const [x, y] of adjacentUnclaimed) {
            const visited = new Set<string>();
            const queue: [number, number][] = [[x, y]];
            visited.add(`${x},${y}`);
            
            while (queue.length > 0) {
              const [cx, cy] = queue.shift()!;
              
              // Check if we reached an edge
              if (isEdge(cx, cy)) {
                const currentEdge = cx === 0 ? 'top' : cx === size - 1 ? 'bottom' : 
                                   cy === 0 ? 'left' : 'right';
                // If group touches no edges, any edge is an escape
                // If group touches one edge, only that edge is allowed
                if (edgesTouched.size === 0 || !edgesTouched.has(currentEdge)) {
                  canEscape = true;
                  console.log('Escape found from position:', x, y, 'to edge:', currentEdge);
                  break;
                }
              }
              
              // Continue BFS through unclaimed tiles
              for (const [di, dj] of [
                [-1, 0], [1, 0], [0, -1], [0, 1]
              ]) {
                const nx = cx + di, ny = cy + dj;
                if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                if (visited.has(`${nx},${ny}`)) continue;
                if (board[nx][ny].owner === currentPlayer) continue; // blocked by current player
                if (board[nx][ny].owner === null) { // can pass through unclaimed tiles
                  visited.add(`${nx},${ny}`);
                  queue.push([nx, ny]);
                }
              }
            }
            
            if (canEscape) break;
          }
          
          if (canEscape) {
            console.log('Group can escape, not encircled');
            continue;
          }
          
          // Step 4: Check if any valid word can be formed from unclaimed tiles in the area
          const allUnclaimedInArea = [...group, ...adjacentUnclaimed].filter(([x, y]) => board[x][y].owner === null);
          const unclaimedLetters = allUnclaimedInArea.map(([x, y]) => board[x][y].letter);
          
          let hasValidWord = false;
          for (let len = 2; len <= unclaimedLetters.length; len++) {
            for (let start = 0; start <= unclaimedLetters.length - len; start++) {
              const word = unclaimedLetters.slice(start, start + len).join('').toUpperCase();
              if (dictionary.has(word)) {
                hasValidWord = true;
                console.log('Valid word found in encircled area:', word);
                break;
              }
            }
            if (hasValidWord) break;
          }
          
          if (hasValidWord) {
            console.log('Group has valid word, skipping:', unclaimedLetters);
          } else {
            console.log('Group is encircled and has no valid word:', group);
            groups.push(group);
          }
          // --- END: Simplified encirclement logic ---
          
          // --- BEGIN: Old complex encirclement logic (for easy rollback) ---
          /*
          // Fixed encirclement logic: corrected edge detection and flood fill
          // Step 1: Determine which edges the group touches
          const edgesTouched = new Set<string>();
          for (const [x, y] of group) {
            if (isEdge(x, y)) {
              if (x === 0) edgesTouched.add('top');
              if (x === size - 1) edgesTouched.add('bottom');
              if (y === 0) edgesTouched.add('left');
              if (y === size - 1) edgesTouched.add('right');
            }
          }
          console.log('Group touches edges:', Array.from(edgesTouched));
          if (edgesTouched.size > 1) {
            console.log('Group touches multiple edges, not encircled');
            continue;
          }
          // Step 2: Flood fill from the group to find all connected unclaimed tiles
          const floodVisited = Array.from({ length: size }, () => Array(size).fill(false));
          const queue: [number, number][] = [...group];
          group.forEach(([x, y]) => { floodVisited[x][y] = true; });
          // Add all orthogonally adjacent unclaimed tiles to the queue
          for (const [x, y] of group) {
            for (const [di, dj] of [
              [-1, 0], [1, 0], [0, -1], [0, 1]
            ]) {
              const ni = x + di, nj = y + dj;
              if (ni < 0 || nj < 0 || ni >= size || nj >= size) continue;
              if (!floodVisited[ni][nj] && board[ni][nj].owner === null) {
                queue.push([ni, nj]);
                floodVisited[ni][nj] = true;
              }
            }
          }
          // Step 3: Continue flood fill to find all connected unclaimed tiles
          let allFlood: [number, number][] = [];
          while (queue.length) {
            const [cx, cy] = queue.shift()!;
            allFlood.push([cx, cy]);
            // Continue flood fill through unclaimed tiles
            for (const [di, dj] of [
              [-1, 0], [1, 0], [0, -1], [0, 1]
            ]) {
              const nx = cx + di, ny = cy + dj;
              if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
              if (floodVisited[nx][ny]) continue;
              if (board[nx][ny].owner === currentPlayer) continue; // blocked by current player's tile
              floodVisited[nx][ny] = true;
              queue.push([nx, ny]);
            }
          }
          // Step 4: Check if any tile in the flood area can reach an edge (other than the allowed edge)
          let escapes = false;
          for (const [x, y] of allFlood) {
            if (isEdge(x, y)) {
              const currentEdge = x === 0 ? 'top' : x === size - 1 ? 'bottom' : 
                                 y === 0 ? 'left' : 'right';
              // If group touches no edges, any edge is an escape
              // If group touches one edge, only that edge is allowed
              if (edgesTouched.size === 0 || !edgesTouched.has(currentEdge)) {
                escapes = true;
                console.log('Escape detected at edge:', currentEdge, 'at position:', x, y);
                break;
              }
            }
          }
          if (escapes) {
            console.log('Flood fill escapes to edge, not encircled');
            continue;
          }
          // Step 5: Check if any valid word can be formed from unclaimed tiles in the area
          const groupLetters = allFlood.filter(([x, y]) => board[x][y].owner === null).map(([x, y]) => board[x][y].letter);
          let hasValidWord = false;
          for (let len = 2; len <= groupLetters.length; len++) {
            for (let start = 0; start <= groupLetters.length - len; start++) {
              const word = groupLetters.slice(start, start + len).join('').toUpperCase();
              if (dictionary.has(word)) {
                hasValidWord = true;
                break;
              }
            }
            if (hasValidWord) break;
          }
          if (hasValidWord) {
            console.log('Group has valid word, skipping:', groupLetters);
          }
          if (!hasValidWord) {
            console.log('Group is encircled and has no valid word:', allFlood);
            groups.push(group);
          }
          */
          // --- END: Old complex encirclement logic ---
        }
      }
    }
    console.log('Returning encircled groups:', groups);
    return groups;
  }

  // Handle submit (with encirclement)
  const handleSubmit = () => {
    if (gameOver) return;
    if (selected.length < 2) {
      setError('Word must be at least 2 letters.');
      return;
    }
    if (!isContiguous(selected)) {
      setError('Selected letters must be contiguous.');
      return;
    }
    // --- BEGIN: Removed center square rule (for easy rollback) ---
    // First word can now be placed anywhere on the board
    // --- END: Removed center square rule ---
    
    // --- BEGIN: Old center square rule (for easy rollback) ---
    /*
    if (moves.length === 0 && !selected.some(([i, j]) => i === center[0] && j === center[1])) {
      setError('First word must include the center square.');
      return;
    }
    */
    // --- END: Old center square rule ---
    if (!dictionary) {
      setError('Dictionary not loaded yet.');
      return;
    }
    const word = selectedWord.toUpperCase();
    if (!dictionary.has(word)) {
      setError('Word not in dictionary.');
      return;
    }
    // --- Refactor: perform encirclement/capture logic before setBoard ---
    // 1. Create a copy of the board and apply the current move
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    selected.forEach(([i, j]) => {
      newBoard[i][j].owner = turn;
      newBoard[i][j].captured = false;
      newBoard[i][j].pulse = true;
    });
    console.log('Board after claiming:', newBoard.map(row => row.map(cell => cell.owner)));
    // 2. Find encircled groups and apply captures
    const encircledGroups = findEncircledGroups(newBoard, turn, dictionary);
    console.log('Encircled groups:', encircledGroups);
    let capturedCount = 0;
    let capturedPositions: [number, number][] = [];
    encircledGroups.forEach(group => {
      group.forEach(([x, y]) => {
        newBoard[x][y].captured = true;
        newBoard[x][y].pulse = true; // pulse animation
        newBoard[x][y].owner = turn; // transfer ownership
        capturedCount++;
        capturedPositions.push([x, y]);
      });
    });
    console.log('Captured count:', capturedCount);
    setBoard(newBoard);
    setTimeout(() => {
      setBoard(b => b.map(row => row.map(cell => ({ ...cell, pulse: false }))));
    }, 700);
    const score = getScore(word);
    setMoves([...moves, { player: turn, word, positions: [...selected], score, capturePoints: capturedCount }]);
    setScores(s => ({ ...s, [turn]: s[turn] + score + capturedCount }));
    setTurn(turn === 'Player 1' ? 'Player 2' : 'Player 1');
    setSelected([]);
    if (capturedCount > 0) {
      setError(`${capturedCount} tile(s) captured!`);
    } else {
      setError(null);
    }
    setPassCount(0); // reset pass count on valid move
  };

  const handlePass = () => {
    if (gameOver) return;
    setTurn(turn === 'Player 1' ? 'Player 2' : 'Player 1');
    setSelected([]);
    setError(null);
    setPassCount(c => c + 1);
  };

  // End game logic (simple: after 900 moves or manual end)
  useEffect(() => {
    if (moves.length >= 900 || passCount >= 2) {
      setGameOver(true);
      if (scores['Player 1'] > scores['Player 2']) setWinner('Player 1');
      else if (scores['Player 2'] > scores['Player 1']) setWinner('Player 2');
      else setWinner('Draw');
    }
  }, [moves, scores, passCount]);

  const handleEndGame = () => {
    setGameOver(true);
    if (scores['Player 1'] > scores['Player 2']) setWinner('Player 1');
    else if (scores['Player 2'] > scores['Player 1']) setWinner('Player 2');
    else setWinner('Draw');
  };

  const handleRestart = () => {
    const letters = generateBoard();
    setBoard(createBoardWithOwnership(letters));
    setTurn('Player 1');
    setSelected([]);
    setError(null);
    setMoves([]);
    setScores({ 'Player 1': 0, 'Player 2': 0 });
    setGameOver(false);
    setWinner(null);
    setPassCount(0);
  };

  // Helper to get cell color based on moves
  function getCellColor(i: number, j: number, moves: { player: string, positions: [number, number][] }[]) {
    // Find the most recent move that includes this cell
    for (let k = moves.length - 1; k >= 0; k--) {
      if (moves[k].positions.some(([x, y]) => x === i && y === j)) {
        return moves[k].player === 'Player 1' ? '#ffcccc' : '#cce0ff'; // red for P1, blue for P2
      }
    }
    // --- BEGIN: Removed center square highlight (for easy rollback) ---
    // Center square no longer has special highlighting
    // --- END: Removed center square highlight ---
    
    // --- BEGIN: Old center square highlight (for easy rollback) ---
    /*
    // Center square highlight
    if (i === center[0] && j === center[1]) return '#ffe680';
    */
    // --- END: Old center square highlight ---
    
    return '#fff';
  }

  // Replace the instructionsMarkdown and ReactMarkdown usage with the .txt content in a <pre> tag
  return (
    <div className="App">
      <h1>Word Strategy Game (Local Two-Player)</h1>
      <div><strong>Current Turn:</strong> {turn}</div>
      {/* Figma UI update START: Score Panel */}
      <div style={{ display: 'none' }}>
        <div className="score-panel" style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <span className="player1">Player 1: {scores['Player 1']}</span>
          <span className="player2">Player 2: {scores['Player 2']}</span>
        </div>
      </div>
      {/* Figma UI update END */}
      {gameOver && (
        <div style={{ background: '#eee', padding: 20, borderRadius: 8, margin: 20 }}>
          <h2>Game Over</h2>
          {winner === 'Draw' ? <div><strong>It's a draw!</strong></div> : <div><strong>{winner} wins!</strong></div>}
          <button onClick={handleRestart}>Restart Game</button>
        </div>
      )}
      {/* Column numbers (1-based, aligned above columns) */}
      {/* Removed the flex div with the numbers at the top as requested */}
      <div style={{ display: 'inline-block', marginTop: 20 }}>
        {/* Board rows with row numbers (1-based, aligned left) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${board.length + 1}, 30px)`,
            marginTop: 20,
            border: '3px solid #000',
            width: (board.length + 1) * 30,
            position: 'relative',
          }}
        >
          {/* Column numbers (1-based) */}
          {board[0] && board[0].map((_, j) => (
            <div
              key={j}
              style={{
                gridRow: 1,
                gridColumn: j + 2,
                width: 30,
                height: 30,
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#888',
                lineHeight: '30px',
                background: '#fff',
                zIndex: 1,
              }}
            >
              {j + 1}
            </div>
          ))}
          {/* Row numbers (1-based) and board cells */}
          {board.map((row, i) => (
            <React.Fragment key={i}>
              {/* Row number */}
              <div
                style={{
                  gridRow: i + 2,
                  gridColumn: 1,
                  width: 30,
                  height: 30,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#888',
                  lineHeight: '30px',
                  background: '#fff',
                  zIndex: 1,
                }}
              >
                {i + 1}
              </div>
              {/* Board cells */}
              {row.map((cell, j) => {
                const isSelected = selected.some(([x, y]) => x === i && y === j);
                const claimed = isCellClaimed(i, j, moves);
                let cellClass = 'board-cell';
                // --- BEGIN: Removed center class assignment (for easy rollback) ---
                // Center square no longer gets special CSS class
                // --- END: Removed center class assignment ---
                
                // --- BEGIN: Old center class assignment (for easy rollback) ---
                /*
                if (i === center[0] && j === center[1]) cellClass += ' center';
                */
                // --- END: Old center class assignment ---
                if (isSelected) cellClass += ' selected';
                if (claimed) {
                  const lastMove = moves.slice().reverse().find(m => m.positions.some(([x, y]) => x === i && y === j));
                  if (lastMove) cellClass += lastMove.player === 'Player 1' ? ' player1 claimed' : ' player2 claimed';
                  else cellClass += ' claimed';
                }
                let pulse = '';
                if (moves.length > 0 && moves[moves.length - 1].positions.some(([x, y]) => x === i && y === j)) {
                  pulse = ' pulse';
                }
                return (
                  <div
                    key={j}
                    className={cellClass + pulse}
                    style={{ 
                      width: 30, 
                      height: 30, 
                      gridRow: i + 2, 
                      gridColumn: j + 2,
                      opacity: cell.captured ? 0.5 : 1
                    }}
                    onClick={() => {
                      if (!claimed) handleCellClick(i, j);
                    }}
                  >
                    {cell.letter}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <strong>Selected Word:</strong> {selectedWord}
      </div>
      {/* Player Scores and Submit Button Layout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: (board.length + 1) * 30, margin: '30px auto 0 auto' }}>
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
              cursor: 'pointer',
              marginTop: 10
            }}
            onClick={handleSubmit}
            disabled={selected.length === 0 || gameOver}
          >
            Submit Word
          </button>
        </div>
        <div className="player-score-right" style={{ textAlign: 'right', minWidth: 120 }}>
          <div style={{ color: '#FFA600', fontWeight: 'bold', fontSize: 48, lineHeight: 1 }}>{scores['Player 2']}</div>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>Player 2</div>
        </div>
      </div>
      {/* Player Words List - Two Columns */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: (board.length + 1) * 30, margin: '30px auto 0 auto' }}>
        {/* Player 1 Words */}
        <div style={{ textAlign: 'left', minWidth: 180 }}>
          {moves.filter(m => m.player === 'Player 1').map((move, idx, arr) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: idx === arr.length - 1 ? 'bold' : 'normal', borderRadius: 6, padding: 0, marginBottom: 2, textAlign: 'left' }}>
              <span>{move.word}</span>
              <span>
                {move.score}
                {move.capturePoints > 0 && (
                  <span style={{ color: '#FFA600', marginLeft: 4 }}>+ {move.capturePoints}</span>
                )}
              </span>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #222', margin: '8px 0' }}></div>
          <div style={{ fontWeight: 'bold', marginTop: 4 }}>TOTAL {scores['Player 1']}</div>
        </div>
        {/* Player 2 Words */}
        <div style={{ textAlign: 'right', minWidth: 180 }}>
          {moves.filter(m => m.player === 'Player 2').map((move, idx, arr) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: idx === arr.length - 1 ? 'bold' : 'normal', borderRadius: 6, padding: 0, marginBottom: 2, textAlign: 'left' }}>
              <span>{move.word}</span>
              <span>
                {move.score}
                {move.capturePoints > 0 && (
                  <span style={{ color: '#3399ff', marginLeft: 4 }}>+ {move.capturePoints}</span>
                )}
              </span>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #222', margin: '8px 0' }}></div>
          <div style={{ fontWeight: 'bold', marginTop: 4 }}>TOTAL {scores['Player 2']}</div>
        </div>
      </div>
      <button onClick={handlePass} disabled={gameOver} style={{ marginLeft: 10 }}>Pass Turn</button>
      <button onClick={handleEndGame} style={{ marginLeft: 10 }}>End Game</button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {/* Figma UI update START: Move History */}
      <div className="move-history-container" style={{ display: 'none' }}>
        {/* Player 1 Move History (Left) */}
        <div className="move-history-player1" style={{ textAlign: 'left', minWidth: 180 }}>
          <h2 style={{ color: '#3399ff' }}>Player 1</h2>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Points: {scores['Player 1']}</div>
          <ol>
            {moves.filter(m => m.player === 'Player 1').map((move, idx) => (
              <li key={idx} className="player1">
                {move.word} ({move.score} pts)
                {move.capturePoints > 0 && (
                  <span style={{ color: '#FFA600', marginLeft: 6 }}>+{move.capturePoints} capture</span>
                )}
              </li>
            ))}
          </ol>
        </div>
        {/* Player 2 Move History (Right) */}
        <div className="move-history-player2" style={{ textAlign: 'right', minWidth: 180 }}>
          <h2 style={{ color: '#FFA600' }}>Player 2</h2>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Points: {scores['Player 2']}</div>
          <ol>
            {moves.filter(m => m.player === 'Player 2').map((move, idx) => (
              <li key={idx} className="player2">
                {move.word} ({move.score} pts)
                {move.capturePoints > 0 && (
                  <span style={{ color: '#3399ff', marginLeft: 6 }}>+{move.capturePoints} capture</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {/* Figma UI update END */}
      {/* Add Instructions Modal and Button at the bottom */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button onClick={() => setShowInstructions(true)} style={{ padding: '12px 32px', borderRadius: 24, background: '#222', color: '#fff', fontWeight: 'bold', fontSize: 18, border: 'none', cursor: 'pointer' }}>
          Show Instructions
        </button>
      </div>
      {showInstructions && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 600, width: '90%', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setShowInstructions(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            <h2>Game Instructions</h2>
            <div style={{ maxHeight: 400, overflowY: 'auto', textAlign: 'left', fontFamily: 'inherit', fontSize: 16 }}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
{`[Working Title]: A Word Strategy Game of Territory and Capture
Overview
A two-player game combining the strategic depth of Go with the linguistic creativity of Scrabble. Players take turns forming words on a 19x19 board to earn points and capture territory.
Objective
Score the highest number of points by:
- Forming valid words on the board (word score)
- Capturing your opponent’s tiles through strategic encirclement (tile capture)
Components
- 19x19 game board populated with randomly generated letters per game
- Two sets of tiles (Black and White), one for each player
- A valid dictionary for word verification (e.g., Scrabble dictionary)
- Game software to validate moves and track scores
Setup
- Each game begins with a freshly generated 19x19 board of letters.
- The distribution is based on common letter frequency, and may include pre-baked eight-letter words for bonus opportunities.
- Players are assigned either White or Black tiles.
- The central square of the board must be part of the first move.
Gameplay
Starting the Game:
- Player 1 begins by forming a word using contiguous tiles (touching on sides or corners).
- The word must be at least two letters long and must include the center square.
- Words can be placed in any direction (horizontally, vertically, or diagonally).
- Player 2 then makes their move, and players alternate turns.

Forming Words:
- On a turn, a player must place a new word on the board using available letters.
- Words must be valid as determined by the shared dictionary. The system will automatically verify validity.
- Words do not need to connect to existing words unless used to break an encirclement.
- Multiple words may exist independently on the board.
Scoring
Word Score
Points are awarded based on the length of each valid word:
Word Length
Points
2 letters
2 pts
3 letters
3 pts
4 letters
4 pts
5 letters
6 pts
6 letters
8 pts
7 letters
11 pts
8 letters
14 pts
9 letters
19 pts
10 letters
24 pts
11+ letters
30 pts
Capture Score
- When a player successfully encircles a group of their opponent’s tiles, those tiles are captured.
- Each captured tile adds 1 point to the capturing player’s score.
- A tile can only be captured once; it cannot be part of multiple encirclements.
Encirclement Rules
A group of tiles is considered encircled and captured if:
1. The opponent’s tiles are completely surrounded by the current player’s tiles.
2. The surrounded player cannot make a legitimate contiguous move (side-touching only; corner-touching doesn’t count).
3. There are no valid words possible inside the encircled area.
4. Encirclement is also valid if:
   - The opponent is blocked against a single edge of the board and surrounded on all other sides.
   - However, if they touch more than one edge, it's not considered encircled.

The software will automatically detect and indicate when an encirclement occurs, and display how many tiles have been captured.
End of Game
The game ends when:
- No valid moves remain for either player, or
- A player resigns
Winning
The player with the highest combined score wins. The total score is:
- Word Score (sum of all valid words created)
- Capture Score (number of opponent tiles captured)
Live Scoring
After each move, the current scores (word + capture) are displayed so both players can monitor progress.
`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
