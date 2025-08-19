#!/bin/bash

echo "🚀 StratGO Deployment Script"
echo "=============================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    echo "railway login"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    echo "vercel login"
    exit 1
fi

echo "✅ All required tools are installed"

# Step 1: Deploy Backend to Railway
echo ""
echo "📦 Step 1: Deploying Backend to Railway..."
echo "This will create a new Railway project with PostgreSQL database"

# Create Railway project
railway init --name stratgo-backend

# Add PostgreSQL database
railway add postgresql

# Get the database URL
echo "🔗 Getting database URL..."
DATABASE_URL=$(railway variables get DATABASE_URL)

# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="$DATABASE_URL"

# Deploy the backend
echo "🚀 Deploying backend..."
railway up

# Get the backend URL
BACKEND_URL=$(railway domain)
echo "✅ Backend deployed at: $BACKEND_URL"

# Step 2: Deploy Frontend to Vercel
echo ""
echo "🌐 Step 2: Deploying Frontend to Vercel..."

# Navigate to frontend directory
cd frontend

# Set environment variable for the backend URL
echo "REACT_APP_API_URL=$BACKEND_URL" > .env

# Deploy to Vercel
echo "🚀 Deploying frontend..."
vercel --prod

# Get the frontend URL
FRONTEND_URL=$(vercel ls | grep stratgo | head -1 | awk '{print $2}')
echo "✅ Frontend deployed at: $FRONTEND_URL"

# Step 3: Update backend with frontend URL
echo ""
echo "🔗 Step 3: Updating backend with frontend URL..."

cd ..
railway variables set FRONTEND_URL="$FRONTEND_URL"

# Redeploy backend with updated CORS settings
railway up

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo ""
echo "📊 Analytics Dashboard: $FRONTEND_URL/analytics"
echo ""
echo "🎮 To play:"
echo "1. Open $FRONTEND_URL"
echo "2. Click 'Create New Game'"
echo "3. Share the Game ID with your opponent"
echo "4. They can join by entering the Game ID"
echo ""
echo "📈 To view analytics:"
echo "Click 'View Analytics' in the game interface" 