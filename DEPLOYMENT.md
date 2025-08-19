# StratGO Deployment Guide

## 🚀 Quick Start Options

### Option 1: Railway (Recommended for MVP)
1. **Sign up** at [railway.app](https://railway.app)
2. **Connect your GitHub** repository
3. **Add PostgreSQL** service from Railway dashboard
4. **Set environment variables**:
   - `DATABASE_URL` (from PostgreSQL service)
   - `NODE_ENV=production`
5. **Deploy** - Railway will auto-deploy from your main branch

### Option 2: Render
1. **Sign up** at [render.com](https://render.com)
2. **Create new Web Service** from GitHub
3. **Add PostgreSQL** database
4. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`
5. **Set environment variables** (same as Railway)

### Option 3: Heroku
1. **Install Heroku CLI**
2. **Create app**: `heroku create your-app-name`
3. **Add PostgreSQL**: `heroku addons:create heroku-postgresql:mini`
4. **Set environment**: `heroku config:set NODE_ENV=production`
5. **Deploy**: `git push heroku main`

## 🗄️ Database Setup

### Local Development
```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
sudo apt-get install postgresql  # Ubuntu

# Create database
createdb stratgo

# Set environment variables
cp env.example .env
# Edit .env with your local database URL
```

### Production Database
- **Supabase** (Recommended): Free tier with 500MB
- **Railway PostgreSQL**: Included with Railway deployment
- **AWS RDS**: For enterprise scaling

## 📊 Analytics Dashboard

The enhanced server includes analytics endpoints:

- `GET /api/games` - Game history
- `GET /api/analytics` - Performance metrics
- `GET /api/health` - Health check

## 🔧 Frontend Deployment

### Vercel (Recommended)
1. **Connect GitHub** to [vercel.com](https://vercel.com)
2. **Import** your repository
3. **Configure**:
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **Set environment variables**:
   - `REACT_APP_API_URL` = Your backend URL

### Netlify
1. **Connect GitHub** to [netlify.com](https://netlify.com)
2. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
3. **Set environment variables** (same as Vercel)

## 🔄 Migration Steps

### 1. Update Frontend API Calls
Modify your React app to use the new API endpoints:

```javascript
// Instead of local state, fetch from API
const createGame = async () => {
  const response = await fetch('/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const game = await response.json();
  // Update your game state
};

const submitMove = async (gameId, move) => {
  const response = await fetch(`/api/game/${gameId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(move)
  });
  // Handle response
};
```

### 2. Install Dependencies
```bash
npm install pg dotenv
```

### 3. Environment Configuration
Create `.env` file with your database URL:
```
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

## 📈 Analytics Features

The enhanced backend tracks:

- **Game History**: All completed games with scores
- **Word Analysis**: Length distribution, frequency
- **Player Performance**: Average scores, win rates
- **Game Duration**: Time analysis for balance
- **Capture Events**: Strategic move analysis

## 🔍 Monitoring

### Health Checks
- Endpoint: `GET /api/health`
- Monitor: Response time, database connectivity

### Logs
- Railway/Render: Built-in logging
- Heroku: `heroku logs --tail`
- Custom: Add Winston or similar

## 🚀 Next Steps

1. **Deploy backend** to Railway/Render
2. **Deploy frontend** to Vercel/Netlify
3. **Set up monitoring** and alerts
4. **Collect initial data** (50+ games)
5. **Analyze patterns** and iterate on game balance

## 💡 Pro Tips

- **Start with Railway** - easiest setup
- **Use environment variables** for all configs
- **Monitor database size** - upgrade when needed
- **Backup regularly** - especially game data
- **Test thoroughly** before production

## 🆘 Troubleshooting

### Common Issues
1. **Database connection fails**: Check DATABASE_URL format
2. **CORS errors**: Ensure frontend URL is allowed
3. **Build fails**: Check Node.js version compatibility
4. **Memory issues**: Upgrade database plan if needed

### Support
- Check logs in your hosting platform
- Verify environment variables
- Test locally first
- Use health check endpoint 