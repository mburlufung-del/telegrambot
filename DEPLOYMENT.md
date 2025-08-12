# TeleShop Bot Deployment Guide

This guide covers deploying your Telegram shop bot to various platforms.

## Prerequisites

1. **Telegram Bot Token**: Get from @BotFather on Telegram
2. **Environment Variables**: Configure based on platform
3. **Database** (optional): PostgreSQL for production

## Platform-Specific Deployment

### 1. Replit (Current Platform)
- ✅ Already configured and running
- Uses polling mode for development
- No additional setup needed

### 2. Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

**Environment Variables:**
- `TELEGRAM_BOT_TOKEN`: Your bot token
- `NODE_ENV`: production
- `WEBHOOK_URL`: https://your-app.railway.app/webhook
- `WEBHOOK_SECRET`: Generate random secret

### 3. Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Note**: Vercel uses serverless functions, webhook mode only.

### 4. Docker/VPS
```bash
# Build and run with Docker
docker build -t teleshop-bot .
docker run -p 5000:5000 --env-file .env teleshop-bot

# Or use docker-compose
docker-compose up -d
```

### 5. DigitalOcean App Platform
1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy automatically on push

## Environment Configuration

### Development (.env)
```env
NODE_ENV=development
TELEGRAM_BOT_TOKEN=your_bot_token
PORT=5000
```

### Production (.env.production)
```env
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your_bot_token
WEBHOOK_URL=https://your-domain.com/webhook
WEBHOOK_SECRET=your_secret_key
PORT=5000
DATABASE_URL=postgresql://user:pass@host:port/db
```

## Webhook vs Polling

### Development (Polling)
- ✅ Works locally
- ✅ No HTTPS required
- ❌ Not suitable for production

### Production (Webhook)
- ✅ More efficient
- ✅ Better for high traffic
- ✅ Required for some platforms
- ❌ Requires HTTPS URL

## Database Options

### In-Memory (Default)
- ✅ No setup required
- ❌ Data lost on restart
- ❌ Not scalable

### PostgreSQL (Recommended for Production)
- ✅ Persistent data
- ✅ Scalable
- ✅ Supported by most platforms

## Security Checklist

- [ ] Bot token stored as environment variable
- [ ] Webhook secret configured (production)
- [ ] HTTPS enabled (production)
- [ ] Database credentials secured
- [ ] No sensitive data in code

## Monitoring

### Health Checks
- Endpoint: `/api/bot/status`
- Returns bot status and configuration

### Logs
- Bot initialization status
- Webhook/polling mode
- Error messages

## Troubleshooting

### Bot Not Responding
1. Check bot token validity
2. Verify webhook URL (production)
3. Check server logs
4. Test `/api/bot/status` endpoint

### Webhook Issues
1. Ensure HTTPS URL is accessible
2. Verify webhook secret matches
3. Check server can receive POST requests

### Database Connection
1. Verify DATABASE_URL format
2. Check network connectivity
3. Confirm database exists

## Platform Recommendations

| Platform | Best For | Pros | Cons |
|----------|----------|------|------|
| Railway | Simple deployment | Easy setup, good pricing | Limited free tier |
| Vercel | Serverless | Excellent DX, fast deploys | Webhook only |
| DigitalOcean | Full control | Flexible, predictable pricing | More setup required |
| VPS | Custom needs | Full control, cost-effective | Manual maintenance |