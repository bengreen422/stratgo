import React, { useState, useEffect } from 'react';

interface GameRecord {
  id: string;
  created_at: string;
  completed_at: string;
  players: string[];
  final_scores: { [key: string]: number };
  winner: string;
  total_moves: number;
  status: string;
}

interface AnalyticsData {
  wordLengthDistribution: Array<{ word: string; word_length: number }>;
  playerPerformance: Array<{ player: string; avg_score: number; total_moves: number }>;
  gameDuration: { avg_duration_minutes: number; total_completed_games: number };
}

const Analytics: React.FC = () => {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [gamesRes, analyticsRes] = await Promise.all([
        fetch('/api/games?limit=100'),
        fetch('/api/analytics')
      ]);
      
      const gamesData = await gamesRes.json();
      const analyticsData = await analyticsRes.json();
      
      setGames(gamesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWordLengthStats = () => {
    if (!analytics?.wordLengthDistribution) return null;
    
    const lengthCounts: { [key: number]: number } = {};
    analytics.wordLengthDistribution.forEach(item => {
      lengthCounts[item.word_length] = (lengthCounts[item.word_length] || 0) + 1;
    });
    
    return lengthCounts;
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <h2>Game Analytics Dashboard</h2>
      
      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Games</h3>
          <div className="stat-value">{games.length}</div>
        </div>
        <div className="stat-card">
          <h3>Completed Games</h3>
          <div className="stat-value">
            {games.filter(g => g.status === 'completed').length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Avg Duration</h3>
          <div className="stat-value">
            {analytics?.gameDuration?.avg_duration_minutes 
              ? `${Math.round(analytics.gameDuration.avg_duration_minutes)}m`
              : 'N/A'
            }
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Moves</h3>
          <div className="stat-value">
            {games.reduce((sum, game) => sum + game.total_moves, 0)}
          </div>
        </div>
      </div>

      {/* Word Length Distribution */}
      {analytics && (
        <div className="analytics-section">
          <h3>Word Length Distribution</h3>
          <div className="word-length-chart">
            {getWordLengthStats() && Object.entries(getWordLengthStats()!)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([length, count]) => (
                <div key={length} className="word-length-bar">
                  <div className="bar-label">{length} letters</div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${(count / Math.max(...Object.values(getWordLengthStats()!))) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="bar-count">{count}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Player Performance */}
      {analytics && (
        <div className="analytics-section">
          <h3>Player Performance</h3>
          <div className="player-stats">
            {analytics.playerPerformance.map(player => (
              <div key={player.player} className="player-stat">
                <h4>{player.player}</h4>
                <div>Avg Score: {Math.round(player.avg_score || 0)}</div>
                <div>Total Moves: {player.total_moves}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Games */}
      <div className="analytics-section">
        <h3>Recent Games</h3>
        <div className="games-list">
          {games.slice(0, 10).map(game => (
            <div key={game.id} className="game-record">
              <div className="game-header">
                <span className="game-id">#{game.id.slice(0, 8)}</span>
                <span className="game-status">{game.status}</span>
              </div>
              <div className="game-details">
                <div>Players: {game.players.join(' vs ')}</div>
                <div>Moves: {game.total_moves}</div>
                {game.final_scores && (
                  <div>Scores: {Object.entries(game.final_scores)
                    .map(([player, score]) => `${player}: ${score}`)
                    .join(', ')}
                  </div>
                )}
                {game.winner && <div>Winner: {game.winner}</div>}
                <div className="game-date">
                  {new Date(game.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 