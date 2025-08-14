# Railway Deployment Guide

## Quick Start (5 minutes)

### 1. Upload to GitHub
- Create new GitHub repository
- Upload all files from this directory
- Commit and push to main branch

### 2. Deploy on Railway
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Add PostgreSQL: Railway Dashboard → Add → PostgreSQL

### 3. Set Environment Variables
In Railway dashboard, add:
```
TELEGRAM_BOT_TOKEN=7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs
WEBHOOK_URL=https://your-app-name.railway.app/webhook
```

### 4. Deploy
Railway automatically:
- Installs dependencies
- Builds the application
- Runs database migrations
- Starts the bot

## Verification

Your bot should be live at:
- **Dashboard**: https://your-app-name.railway.app
- **Bot Status**: https://your-app-name.railway.app/api/bot/status
- **Health Check**: Automatic monitoring every 60 seconds

## Cost Estimate
- Railway Pro: $20/month
- PostgreSQL: $5-10/month
- **Total**: $25-30/month

## Support
- Bot automatically restarts if offline
- Health monitoring included
- Database backups handled by Railway
- SSL certificates automatic