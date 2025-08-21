# 🎮 StratGO - Development Setup Guide

## 📋 **Quick Start (When You Return)**

### 1. **Clone the Repository**
```bash
git clone https://github.com/bengreen422/stratgo.git
cd stratgo
```

### 2. **Install Dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. **Start Development**
```bash
# Terminal 1: Start React dev server
cd frontend
npm start

# Terminal 2: Start backend server (if needed)
node server.js
```

## 🚀 **Current Status**

### ✅ **Working Features:**
- **Single-player game**: Fully functional with hexagonal board
- **Word validation**: Dictionary-based validation
- **Scoring system**: Length-based scoring
- **UI**: Modern hexagonal tiles with black spacing
- **Vercel deployment**: Available at `stratgo.vercel.app`

### 🔧 **Known Issues:**
- **Railway backend**: 502 errors, CORS issues
- **Express server**: Path-to-regexp compatibility issues
- **Multiplayer**: Temporarily disabled for testing

## 📁 **Project Structure**
```
stratgo/
├── frontend/                 # React application
│   ├── src/
│   │   ├── App.tsx          # Main app (single-player mode)
│   │   ├── SinglePlayerGame.tsx  # Single-player game logic
│   │   ├── MultiplayerGame.tsx   # Multiplayer game (disabled)
│   │   ├── App.css          # Hexagonal tile styles
│   │   └── AppFigma.css     # Additional styles
│   ├── public/
│   └── package.json
├── server.js                # Local development server
├── server-production.js     # Railway deployment server
├── package.json
├── vercel.json             # Vercel configuration
├── railway.json            # Railway configuration
└── words_alpha.txt         # Dictionary file
```

## 🎯 **Development Workflow**

### **Local Development:**
1. **Frontend**: `cd frontend && npm start` (runs on port 3000)
2. **Backend**: `node server.js` (runs on port 4000, optional for single-player)

### **Testing:**
- **Local**: `http://localhost:3000`
- **Vercel**: `https://stratgo.vercel.app`
- **Ngrok**: `https://[your-ngrok-url].ngrok-free.app`

### **Deployment:**
- **Frontend**: Automatically deploys to Vercel on git push
- **Backend**: Manual deployment to Railway (currently broken)

## 🔧 **Fixing Known Issues**

### **Express Server Path-to-Regexp Error:**
The `server.js` has compatibility issues with newer Express versions. To fix:

```bash
# Option 1: Downgrade Express
npm install express@4.18.2

# Option 2: Use a simpler server
# (See server-simple.js for reference)
```

### **Railway Backend Issues:**
1. **CORS**: Update `server-production.js` CORS settings
2. **Database**: Ensure PostgreSQL connection string is correct
3. **Health checks**: Configure proper health check endpoints

## 📊 **Next Steps for Multiplayer**

### **Phase 1: Fix Railway Backend**
1. Debug CORS configuration
2. Test database connections
3. Verify Socket.io setup

### **Phase 2: Re-enable Multiplayer**
1. Switch `App.tsx` back to `MultiplayerGame`
2. Update frontend to connect to Railway backend
3. Test real-time functionality

### **Phase 3: Analytics**
1. Implement game history storage
2. Create analytics dashboard
3. Add performance metrics

## 🛠️ **Useful Commands**

```bash
# Build frontend for production
cd frontend && npm run build

# Test local server
node server.js

# Check git status
git status

# Push changes to GitHub
git add .
git commit -m "Your commit message"
git push

# Start ngrok (if needed)
ngrok http 4000
```

## 📱 **Environment Variables**

Create `.env` file in root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/stratgo

# Server Configuration
PORT=4000
NODE_ENV=development

# For production
# NODE_ENV=production
# FRONTEND_URL=https://stratgo.vercel.app
```

## 🎮 **Game Features**

### **Current Game Rules:**
- Hexagonal board with 19x19 tiles
- First word must include center tile
- Words must be 3+ letters
- Scoring: 2-30 points based on word length
- Dictionary validation using `words_alpha.txt`

### **UI Features:**
- Hexagonal tiles with black spacing
- Player colors: Blue (Player 1), Orange (Player 2)
- Real-time score updates
- Move history display

## 🚨 **Troubleshooting**

### **Port Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

### **Node Modules Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Git Issues:**
```bash
# Reset to last working state
git reset --hard HEAD

# Pull latest changes
git pull origin main
```

## 📞 **Support**

- **GitHub Issues**: Create issues in the repository
- **Vercel Dashboard**: Check deployment status
- **Railway Dashboard**: Monitor backend health

---

**Happy coding! 🎮✨** 