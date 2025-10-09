# Multi-Bot Deployment Guide

## Overview

This guide explains how to deploy and manage 10 Telegram bots simultaneously on your Hostinger VPS (72.60.20.38).

## Architecture

- **VPS**: Hostinger at 72.60.20.38
- **Location**: /var/www/telegrambot
- **Database**: Single PostgreSQL instance (shared by all bots)
- **Ports**: 5001-5010 (each bot gets its own port)
- **Containerization**: Docker with docker-compose

## Current Status

- **Bot 1**: ✅ Deployed on port 5001
  - Username: @mdphpwelt_shopbot
  - Dashboard: http://72.60.20.38:5001

- **Bots 2-10**: Pending deployment (ports 5002-5010 reserved)

## Deploy Remaining Bots

### Step 1: Get Bot Tokens

For each bot you want to deploy:

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot`
3. Follow the prompts to create your bot
4. Copy the bot token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Update .env.docker on VPS

```bash
# SSH into your VPS
ssh root@72.60.20.38

# Navigate to project directory
cd /var/www/telegrambot

# Edit the environment file
nano .env.docker
```

Add your bot tokens:

```env
BOT1_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example1
BOT2_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example2
BOT3_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example3
BOT4_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example4
BOT5_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example5
BOT6_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example6
BOT7_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example7
BOT8_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example8
BOT9_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example9
BOT10_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_example10
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Deploy Specific Bots

**To start all bots at once:**

```bash
cd /var/www/telegrambot
docker-compose --env-file .env.docker up -d
```

**To start specific bots:**

```bash
# Start just bot2
docker-compose --env-file .env.docker up -d bot2

# Start bots 2, 3, and 4
docker-compose --env-file .env.docker up -d bot2 bot3 bot4
```

**To rebuild and start:**

```bash
# Rebuild all images and start
docker-compose --env-file .env.docker up -d --build

# Rebuild specific bot
docker-compose --env-file .env.docker up -d --build bot2
```

### Step 4: Verify Deployment

```bash
# Check running containers
docker-compose ps

# View logs for all bots
docker-compose logs -f

# View logs for specific bot
docker-compose logs -f bot2

# Check health status
curl http://localhost:5002/health
```

## Accessing Bot Dashboards

Each bot has its own admin dashboard:

- **Bot 1**: http://72.60.20.38:5001
- **Bot 2**: http://72.60.20.38:5002
- **Bot 3**: http://72.60.20.38:5003
- **Bot 4**: http://72.60.20.38:5004
- **Bot 5**: http://72.60.20.38:5005
- **Bot 6**: http://72.60.20.38:5006
- **Bot 7**: http://72.60.20.38:5007
- **Bot 8**: http://72.60.20.38:5008
- **Bot 9**: http://72.60.20.38:5009
- **Bot 10**: http://72.60.20.38:5010

## Managing Bots

### Start/Stop Commands

```bash
# Stop all bots
docker-compose down

# Stop specific bot
docker-compose stop bot2

# Start specific bot
docker-compose start bot2

# Restart specific bot
docker-compose restart bot2

# Restart all bots
docker-compose restart
```

### View Logs

```bash
# All bots (live tail)
docker-compose logs -f

# Specific bot (live tail)
docker-compose logs -f bot2

# Last 100 lines from bot2
docker-compose logs bot2 --tail 100
```

### Update Code

When you push code changes to the repository:

```bash
cd /var/www/telegrambot

# Pull latest changes
git pull

# Rebuild and restart all bots
docker-compose down
docker-compose build --no-cache
docker-compose --env-file .env.docker up -d

# Or rebuild specific bot
docker-compose build --no-cache bot2
docker-compose --env-file .env.docker up -d bot2
```

### Database Management

All bots share the same PostgreSQL database:

```bash
# Access database shell
docker-compose exec postgres psql -U teleshopuser -d teleshop

# Run migrations (from inside any bot container)
docker-compose exec bot1 npm run db:push

# Force migration
docker-compose exec bot1 npm run db:push --force
```

### Troubleshooting

**Bot won't start:**

```bash
# Check logs for errors
docker-compose logs bot2

# Check if token is valid
docker-compose exec bot2 node -e "console.log(process.env.TELEGRAM_BOT_TOKEN)"

# Rebuild container
docker-compose build --no-cache bot2
docker-compose --env-file .env.docker up -d bot2
```

**Dashboard shows "Cannot GET /":**

- Check if the bot is running: `docker-compose ps`
- Check logs: `docker-compose logs bot2`
- Verify port mapping in docker-compose.yml
- Try rebuilding: `docker-compose build --no-cache bot2`

**Database connection errors:**

```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

## Security Best Practices

1. **Never commit bot tokens** to the repository
2. **Use strong database passwords** (already set: SecurePass123)
3. **Keep .env.docker private** (already in .gitignore)
4. **Rotate bot tokens** if exposed:
   - Message @BotFather
   - Send `/token` 
   - Select your bot
   - Generate new token
   - Update .env.docker
   - Restart bot

## Monitoring

### Health Checks

```bash
# Check all bot health endpoints
for i in {1..10}; do
  echo "Bot $i:"
  curl -s http://localhost:500$i/health | jq
  echo ""
done
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# View running processes
docker-compose ps
```

## Backup and Recovery

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U teleshopuser teleshop > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U teleshopuser teleshop < backup_20251009.sql
```

### Export Bot Configuration

```bash
# Export all environment variables
docker-compose config > docker-config-backup.yml
```

## Scaling Beyond 10 Bots

To add more bots (bot11, bot12, etc.):

1. Edit `docker-compose.yml` - add new bot service:

```yaml
  bot11:
    build: .
    ports:
      - "5011:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      TELEGRAM_BOT_TOKEN: ${BOT11_TOKEN}
      DATABASE_URL: postgresql://teleshopuser:SecurePass123@postgres:5432/teleshop
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
```

2. Add token to `.env.docker`:

```env
BOT11_TOKEN=your_bot_11_token_here
```

3. Deploy:

```bash
docker-compose --env-file .env.docker up -d bot11
```

## Quick Reference

```bash
# Deploy all bots
docker-compose --env-file .env.docker up -d

# Deploy specific bot
docker-compose --env-file .env.docker up -d bot2

# View logs
docker-compose logs -f bot2

# Restart bot
docker-compose restart bot2

# Update code and rebuild
git pull && docker-compose build --no-cache && docker-compose --env-file .env.docker up -d

# Check health
curl http://localhost:5002/health

# Access database
docker-compose exec postgres psql -U teleshopuser -d teleshop
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Test bot token manually (see troubleshooting section)
4. Rebuild containers: `docker-compose build --no-cache`

---

**Last Updated**: October 9, 2025
**Author**: TeleShop Bot Team
