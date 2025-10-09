# Deployment Checklist ✅

## Before Pushing to GitHub

- [x] Docker files created (Dockerfile, docker-compose.yml)
- [x] Environment example created (.env.docker.example)
- [x] Deployment script created (deploy-vps.sh)
- [x] README.md updated with instructions
- [x] .gitignore includes .env.docker

## Push to GitHub

```bash
git add .
git commit -m "Complete Docker deployment setup for multi-bot hosting"
git push
```

## On Your Hostinger VPS

### Option 1: Automatic Deployment (Recommended)

```bash
ssh root@YOUR_VPS_IP
curl -fsSL https://raw.githubusercontent.com/mburlufung-del/telegrambot/main/deploy-vps.sh | bash
cd /var/www/telegrambot
nano .env.docker  # Add your bot tokens
docker-compose --env-file .env.docker up -d
```

### Option 2: Manual Deployment

```bash
# 1. Connect to VPS
ssh root@YOUR_VPS_IP

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Clone repo
cd /var/www
git clone https://github.com/mburlufung-del/telegrambot.git
cd telegrambot

# 4. Configure tokens
cp .env.docker.example .env.docker
nano .env.docker  # Add your tokens

# 5. Deploy
docker-compose --env-file .env.docker up -d
```

## Get Bot Tokens from @BotFather

1. Open Telegram
2. Search: `@BotFather`
3. Send: `/mybots`
4. Select bot → API Token
5. Copy token: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

## Verify Deployment

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f bot1

# Test dashboard
curl http://localhost:5001/health
```

## Access Dashboards

Replace `YOUR_VPS_IP` with your actual IP (e.g., 72.60.20.38):

- Bot 1: http://YOUR_VPS_IP:5001
- Bot 2: http://YOUR_VPS_IP:5002
- Bot 3: http://YOUR_VPS_IP:5003
- Bot 4: http://YOUR_VPS_IP:5004
- Bot 5: http://YOUR_VPS_IP:5005
- Bot 6: http://YOUR_VPS_IP:5006
- Bot 7: http://YOUR_VPS_IP:5007
- Bot 8: http://YOUR_VPS_IP:5008
- Bot 9: http://YOUR_VPS_IP:5009
- Bot 10: http://YOUR_VPS_IP:5010

## Firewall Setup (Optional but Recommended)

```bash
ufw allow 22
ufw allow 5001:5010/tcp
ufw enable
```

## Common Issues

### Issue: Port already in use
```bash
docker-compose down
docker-compose up -d
```

### Issue: Can't connect to dashboard
```bash
# Check if bot is running
docker-compose ps

# Check firewall
ufw status
```

### Issue: Bot token error
```bash
# Verify token in .env.docker
cat .env.docker

# Restart specific bot
docker-compose restart bot1
```

## Success Indicators

✅ `docker-compose ps` shows all bots "Up"  
✅ `docker-compose logs bot1` shows "Server started on port 5000"  
✅ Dashboard accessible at http://YOUR_VPS_IP:5001  
✅ Telegram bot responds to commands  

## Next Steps After Deployment

1. Test each bot on Telegram
2. Configure products/services in admin dashboard
3. Set up domain names (optional)
4. Configure SSL with Nginx (optional)
5. Set up monitoring and backups

---

**Deployment Time: ~5 minutes** ⚡
