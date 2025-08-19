# 🎮 StratGO - Word Strategy Game

A multiplayer word strategy game combining the strategic depth of Go with the linguistic creativity of Scrabble. Players form words on a hexagonal board to earn points and capture territory.

## 🚀 Quick Deployment (MVP)

### Prerequisites
- Node.js 16+ installed
- Railway account (free tier)
- Vercel account (free tier)

### Automated Deployment
```bash
# Install CLI tools
npm install -g @railway/cli vercel

# Login to services
railway login
vercel login

# Run deployment script
./deploy.sh
```

### Manual Deployment

#### 1. Backend (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Deploy backend
railway init --name stratgo-backend
railway add postgresql
railway variables set NODE_ENV=production
railway up
```

#### 2. Frontend (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel
vercel login

# Deploy frontend
cd frontend
echo "REACT_APP_API_URL=YOUR_RAILWAY_URL" > .env
vercel --prod
```

## 🎯 Game Features

### Core Gameplay
- **169 hexagonal tiles** with weighted letter distribution
- **Real-time multiplayer** using Socket.io
- **Word validation** against comprehensive dictionary
- **Territory capture** through strategic encirclement
- **Live scoring** and move history

### Scoring System
- **Word Score**: 2-30 points based on word length
- **Capture Score**: 1 point per captured tile
- **Balanced Opening**: Player 2 gets +2 bonus for first word

### Analytics & Data Collection
- **Game History**: Complete move-by-move records
- **Word Analysis**: Length distribution and frequency
- **Player Performance**: Win rates and average scores
- **Strategic Insights**: Capture events and patterns

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Real-time Communication**: Socket.io for live multiplayer
- **Database**: PostgreSQL for game persistence
- **API Endpoints**: RESTful API for game management
- **Analytics**: Built-in data collection and analysis

### Frontend (React + TypeScript)
- **Real-time UI**: Live updates via WebSocket
- **Responsive Design**: Works on desktop and mobile
- **Analytics Dashboard**: Built-in game statistics
- **Modern UI**: Clean, intuitive interface

### Database Schema
```sql
-- Games table
CREATE TABLE games (
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
);

-- Analytics table
CREATE TABLE game_analytics (
  id SERIAL PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  word_length_distribution JSONB,
  capture_events JSONB,
  player_performance JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎮 How to Play

### Starting a Game
1. **Create Game**: Click "Create New Game"
2. **Share Game ID**: Copy the generated Game ID
3. **Join Game**: Second player enters the Game ID
4. **Start Playing**: First player begins with a 3+ letter word

### Game Rules
- **First Word**: Must include center tile, minimum 3 letters
- **Word Formation**: Select contiguous hexagonal tiles
- **Dictionary Validation**: All words must be valid
- **Turn-based**: Players alternate moves
- **Territory Capture**: Surround opponent tiles to capture
- **Scoring**: Word points + capture points

### Winning
- **Highest Score**: Combined word and capture points
- **Game End**: No valid moves remaining or player resigns
- **Tie**: Equal scores result in a draw

## 📊 Analytics Dashboard

Access comprehensive game analytics:
- **Game Statistics**: Total games, completion rates, duration
- **Word Analysis**: Length distribution, frequency patterns
- **Player Performance**: Win rates, average scores, move counts
- **Strategic Data**: Capture events, territory analysis

## 🔧 Development

### Local Setup
```bash
# Clone repository
git clone <repository-url>
cd StratGO

# Install dependencies
npm install
cd frontend && npm install

# Set up environment
cp env.example .env
# Edit .env with your database URL

# Start development servers
npm run dev  # Backend
cd frontend && npm start  # Frontend
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Frontend (.env)
REACT_APP_API_URL=http://localhost:4000
```

### API Endpoints
- `POST /api/game` - Create new game
- `GET /api/game/:id` - Get game state
- `GET /api/games` - List games
- `GET /api/analytics` - Get analytics data
- `GET /api/health` - Health check

### Socket Events
- `join-game` - Join a game room
- `submit-move` - Submit a word move
- `complete-game` - Mark game as completed
- `game-state` - Receive game state updates
- `move-submitted` - Receive move updates

## 📈 Data Analysis

The game collects rich data for analysis:
- **Move Patterns**: Word choices and strategic decisions
- **Board Evolution**: How games progress over time
- **Player Behavior**: Decision-making patterns
- **Balance Metrics**: Win rates and scoring distribution

## 🚀 Production Deployment

### Railway (Backend)
- **Automatic Scaling**: Handles traffic spikes
- **PostgreSQL**: Managed database with backups
- **SSL/TLS**: Secure connections
- **Monitoring**: Built-in logging and metrics

### Vercel (Frontend)
- **Global CDN**: Fast loading worldwide
- **Automatic Deployments**: Git-based deployments
- **Edge Functions**: Serverless API capabilities
- **Analytics**: Built-in performance monitoring

## 🔒 Security & Performance

### Security Features
- **Input Validation**: All moves validated server-side
- **CORS Protection**: Configured for production domains
- **SQL Injection Protection**: Parameterized queries
- **Rate Limiting**: Built into hosting platforms

### Performance Optimizations
- **Real-time Updates**: Efficient WebSocket communication
- **Database Indexing**: Optimized for game queries
- **CDN Delivery**: Static assets served globally
- **Caching**: Browser and CDN caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the deployment logs in Railway/Vercel
2. Review the browser console for errors
3. Verify environment variables are set correctly
4. Check database connectivity

---

**Built with ❤️ for strategic word gaming** 