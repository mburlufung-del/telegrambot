# 🔧 Railway Deployment Troubleshooting

## Common File Format Issues

### ZIP File Format Problems
- **Issue**: Railway may not accept certain compression formats
- **Solution**: Use standard ZIP format instead of tar.gz or other formats
- **Fix**: Recreated package as standard ZIP file

### Deployment Package Structure
```
TeleShop-Bot/
├── client/               # React frontend
├── server/               # Node.js backend  
├── shared/               # Shared schemas
├── package.json          # Dependencies
├── railway.toml          # Railway config with your token
├── Dockerfile            # Container config
├── railway-deploy.sh     # Automated deployment script
└── README.md             # Documentation
```

### Railway Configuration Issues

#### 1. Environment Variables Not Set
**Problem**: Bot token or other variables missing
**Solution**: Check `railway.toml` contains:
```toml
[environments.production]
variables = { 
  NODE_ENV = "production", 
  BOT_TOKEN = "7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs", 
  SESSION_SECRET = "teleshop_bot_secure_session_2024" 
}
```

#### 2. Build Command Issues
**Problem**: Build fails during deployment
**Solution**: Verify `railway.toml` build configuration:
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"
```

#### 3. Start Command Issues
**Problem**: App fails to start
**Solution**: Check start command in `railway.toml`:
```toml
[deploy]
startCommand = "npm start"
```

### File Upload Methods for Railway

#### Method 1: Railway CLI (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Extract package
unzip RAILWAY-DIRECT-DEPLOYMENT.zip
cd teleshop-bot

# Deploy
railway login
railway init
railway add postgresql
railway up
```

#### Method 2: GitHub Import (Alternative)
```bash
# Create GitHub repo and push
git init
git add .
git commit -m "TeleShop Bot"
git push origin main

# Then deploy from GitHub on Railway
```

#### Method 3: Docker Deploy
```bash
# Build and deploy with Docker
docker build -t teleshop-bot .
railway login
railway deploy
```

### Common Error Solutions

#### Error: "Build Failed"
**Cause**: Missing dependencies or build script issues
**Fix**: 
1. Check `package.json` has all dependencies
2. Verify build script exists: `npm run build`
3. Check for TypeScript compilation errors

#### Error: "Port Already in Use"
**Cause**: Port configuration conflict
**Fix**: Railway automatically assigns PORT, ensure your app uses `process.env.PORT`:
```javascript
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0');
```

#### Error: "Database Connection Failed"
**Cause**: PostgreSQL service not connected
**Fix**:
1. Add PostgreSQL service in Railway dashboard
2. Verify `DATABASE_URL` environment variable exists
3. Check database connection in your code

#### Error: "Bot Token Invalid"
**Cause**: Bot token not set or incorrect
**Fix**:
1. Verify token in Railway environment variables
2. Check token format: `BOT_TOKEN=1234567890:ABC-DEF...`
3. Test token with simple API call

### Verification Steps After Deployment

#### 1. Check Railway Logs
```bash
railway logs
```
Look for:
- ✅ "Bot initialized successfully"
- ✅ "Express server running on port X"
- ✅ "Database connected"

#### 2. Test Endpoints
- Health check: `https://your-app.railway.app/api/health`
- Bot status: `https://your-app.railway.app/api/bot/status`
- Dashboard: `https://your-app.railway.app`

#### 3. Test Telegram Bot
- Send `/start` to your bot
- Should receive welcome message
- Try browsing products

#### 4. Test Admin Dashboard
- Visit your Railway domain
- Should load admin interface
- Try adding a test product

### Railway-Specific Requirements

#### File Structure
- Must have `package.json` in root
- Build output should go to `dist/` folder
- Static files served from appropriate directory

#### Environment Variables
- `NODE_ENV=production` (required)
- `BOT_TOKEN=your_token` (required) 
- `SESSION_SECRET=random_string` (required)
- `DATABASE_URL` (auto-provided by Railway)

#### Build Process
1. `npm install` - Install dependencies
2. `npm run build` - Compile TypeScript and build React
3. `npm start` - Start production server

### Success Indicators

✅ **Deployment Successful When:**
- Railway build completes without errors
- App starts and shows "serving on port X"
- Bot initializes and shows "Bot initialized successfully"
- Database connects successfully
- Health check endpoint responds
- Telegram bot responds to `/start`
- Admin dashboard loads

### Getting Help

- **Railway Discord**: Community support
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Package Documentation**: Complete guides included
- **Bot API**: [core.telegram.org/bots/api](https://core.telegram.org/bots/api)

Your TeleShop bot package is production-ready and should deploy successfully with the standard ZIP format.