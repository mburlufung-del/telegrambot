# Railway Deployment Guide

## 🚀 Automated Railway Deployment

### Prerequisites
- GitHub account
- Railway account (free tier available)

### Quick Start

1. **Fork Repository**
   ```bash
   # Fork this repository to your GitHub account
   # Or download and push to your own repository
   ```

2. **Deploy to Railway**
   - Visit [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository
   - Railway will automatically detect the configuration

3. **Add Database**
   - Click "Add Service" → "PostgreSQL"
   - Database will be automatically configured

4. **Environment Variables** (Pre-configured)
   ```env
   NODE_ENV=production
   BOT_TOKEN=7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs
   SESSION_SECRET=teleshop_bot_secure_session_2024
   DATABASE_URL=(auto-configured by Railway)
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for completion
   - Bot will start automatically

## 🤖 Bot Testing

1. **Test Bot on Telegram**
   - Search for your bot using the token
   - Send `/start` command
   - Bot should respond with welcome message

2. **Access Admin Dashboard**
   - Visit your Railway deployment URL
   - Admin dashboard will be available

## 🛠 Railway Configuration Files

- `railway.toml` - Railway deployment configuration
- `package.json` - Dependencies and build scripts
- `.env.example` - Environment variable template
- `.gitignore` - Files to exclude from repository

## 🔧 Build Process

Railway automatically runs:
```bash
npm install && npm run build && npm start
```

## 📊 Monitoring

- Railway provides built-in monitoring
- Health check endpoint: `/api/health`
- Automatic restart on failure
- Resource usage monitoring

## 🌍 Custom Domain

1. Go to Railway project dashboard
2. Click on "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## 🔒 Security

- All environment variables are encrypted
- HTTPS enabled by default
- Session security configured
- CSRF protection enabled

## 🚨 Troubleshooting

### Build Fails
- Check Railway logs for specific error
- Verify all dependencies in package.json
- Ensure Node.js version compatibility (>= 18.0.0)

### Bot Not Responding
- Verify BOT_TOKEN in environment variables
- Check Telegram bot API limitations
- Review Railway application logs

### Database Issues
- Ensure PostgreSQL service is added
- Check DATABASE_URL environment variable
- Verify database migrations ran successfully

## 📈 Scaling

Railway automatically scales based on usage:
- CPU and memory scaling
- Multiple regions available
- Load balancing included
- CDN for static assets

## 💰 Pricing

- Free tier: 500 hours/month
- Pro tier: $5/month for unlimited usage
- Database: Included in tier limits
- Custom domains: Free on all tiers

## 📞 Support

- Railway documentation: [docs.railway.app](https://docs.railway.app)
- Community Discord: [discord.gg/railway](https://discord.gg/railway)
- GitHub issues for bot-specific problems