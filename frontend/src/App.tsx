import React from 'react';
import SinglePlayerGame from './SinglePlayerGame';
import './App.css';
import './AppFigma.css';
import './Analytics.css';

function App() {
  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>🎮 StratGO - Single Player Mode</h1>
      <SinglePlayerGame />
    </div>
  );
}

export default App; 