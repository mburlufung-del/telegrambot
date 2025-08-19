#!/bin/bash

# TeleShop Bot - Direct Railway Deployment Script
echo "🚂 TeleShop Bot - Railway Deployment"
echo "======================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI ready"

# Login to Railway
echo "🔐 Logging in to Railway..."
railway login

# Initialize project
echo "🚀 Initializing Railway project..."
railway init teleshop-bot

# Add PostgreSQL database
echo "🗄️ Adding PostgreSQL database..."
railway add postgresql

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set BOT_TOKEN=7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs
railway variables set SESSION_SECRET=teleshop_bot_secure_session_2024

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "📱 Your TeleShop bot is now live on Railway"
echo "🌐 Visit your Railway dashboard to get the live URL"
echo "🤖 Test your bot on Telegram by sending /start"