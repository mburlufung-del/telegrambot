# Railway Deployment Guide for TeleShop Bot

## Quick Deployment Steps

### 1. Create Railway Project
```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
```

### 2. Add PostgreSQL Database
```bash
# Add PostgreSQL service to your project
railway add postgresql
```

Or in Railway Dashboard:
- Go to your project
- Click "New Service" 
- Select "Database" → "PostgreSQL"

### 3. Environment Variables
Set these in Railway Dashboard → Variables tab:

**REQUIRED:**
```
TELEGRAM_BOT_TOKEN=7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs
NODE_ENV=production
WEBHOOK_URL=https://your-app-name.railway.app/webhook
```

**AUTOMATIC (Railway sets these):**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=${{PORT}}
```

**OPTIONAL (for enhanced security):**
```
WEBHOOK_SECRET=your_random_32_char_secret
```

### 4. Deploy Application
```bash
# Connect to GitHub (recommended)
railway link

# Deploy
railway up
```

Or use GitHub integration:
- Connect your GitHub repository in Railway dashboard
- Auto-deploy on every push to main branch

### 5. Set Webhook URL
After deployment, update the webhook URL with your actual Railway domain:
- Get your app URL from Railway dashboard
- Update `WEBHOOK_URL` to: `https://your-actual-domain.railway.app/webhook`

### 6. Initialize Database Schema
After first deployment:
```bash
# Run database migrations
railway run npm run db:push
```

## Post-Deployment Verification

1. **Check bot status:** `https://your-app.railway.app/api/bot/status`
2. **Check dashboard:** `https://your-app.railway.app`
3. **Test Telegram bot:** Send `/start` to your bot
4. **Verify webhook:** Check Railway logs for incoming webhook events

## File Changes for Production

The following files are optimized for Railway deployment:

### Key Files:
- `railway.toml` - Railway build configuration
- `package.railway.json` - Production dependencies
- `.env.railway` - Environment variables template
- `server/index.ts` - Auto-switches to webhook mode in production

### Production Optimizations:
- **Webhook Mode**: Automatically enabled in production
- **Build Optimization**: Vite build + esbuild bundling
- **Health Checks**: `/api/bot/status` endpoint for monitoring
- **Error Handling**: Production-ready error logging
- **Database**: Ready for Railway PostgreSQL
- **Auto-restart**: On failure policy configured

## Monitoring & Maintenance

### Health Monitoring:
- Railway automatically monitors `/api/bot/status`
- Check Railway dashboard for service health
- View logs in Railway dashboard → Logs tab

### Database Management:
- Access database via Railway dashboard
- Use `railway shell` to connect to database
- Backup automatically handled by Railway PostgreSQL

### Bot Management:
- Admin dashboard available at your Railway URL
- All bot settings configurable via web interface
- Real-time statistics and monitoring

## Troubleshooting

### Common Issues:
1. **Bot not responding**: Check WEBHOOK_URL is correct
2. **Database errors**: Verify PostgreSQL service is running  
3. **Build failures**: Check Railway build logs
4. **Environment variables**: Ensure all required vars are set

### Support Commands:
```bash
# Check deployment status
railway status

# View logs
railway logs

# Connect to database
railway connect postgres

# Open project dashboard
railway open
```

## Cost Estimation

**Railway Pricing (as of 2024):**
- **Hobby Plan**: $5/month - Good for small projects
- **Pro Plan**: $20/month - Recommended for production
- **PostgreSQL**: Additional $5-10/month based on usage

**Total Monthly Cost**: ~$10-30/month for full production setup

Ready to deploy! All files are configured for Railway deployment with your bot token and PostgreSQL database.