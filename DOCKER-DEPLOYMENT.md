# Docker Deployment Guide

## Quick Start - Deploy All 10 Bots in Minutes!

### 1. Install Docker on Your VPS

```bash
# On Ubuntu/Debian VPS
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Log out and log back in for group changes to take effect.

### 2. Clone Your Repository

```bash
cd /var/www
git clone https://github.com/mburlufung-del/telegrambot.git
cd telegrambot
```

### 3. Create Environment File

```bash
cp .env.docker.example .env.docker
nano .env.docker
```

**Add your bot tokens:**
```
BOT1_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
BOT2_TOKEN=987654321:ZYXwvuTSRqpONMLkjihgfedcba
... (add all 10 tokens)
```

Save and exit (Ctrl+X, then Y, then Enter)

### 4. Deploy All Bots

```bash
# Start all 10 bots
docker-compose --env-file .env.docker up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 5. Access Your Dashboards

- **Bot 1:** http://72.60.20.38:5001
- **Bot 2:** http://72.60.20.38:5002
- **Bot 3:** http://72.60.20.38:5003
- **Bot 4:** http://72.60.20.38:5004
- **Bot 5:** http://72.60.20.38:5005
- **Bot 6:** http://72.60.20.38:5006
- **Bot 7:** http://72.60.20.38:5007
- **Bot 8:** http://72.60.20.38:5008
- **Bot 9:** http://72.60.20.38:5009
- **Bot 10:** http://72.60.20.38:5010

---

## Deploy Specific Bots Only

If you only want to run 3 bots instead of 10:

```bash
docker-compose --env-file .env.docker up -d bot1 bot2 bot3 postgres
```

---

## Common Commands

### View Logs
```bash
# All bots
docker-compose logs -f

# Specific bot
docker-compose logs -f bot1
```

### Restart a Bot
```bash
docker-compose restart bot1
```

### Stop All Bots
```bash
docker-compose down
```

### Update Code from GitHub
```bash
git pull
docker-compose build
docker-compose up -d
```

### Change a Bot Token
```bash
nano .env.docker
# Update the token
docker-compose restart bot1
```

---

## Benefits of Docker Deployment

✅ **Easy Setup** - One command deploys all 10 bots  
✅ **Isolated** - Each bot runs in its own container  
✅ **Auto-Restart** - Bots restart automatically if they crash  
✅ **Easy Updates** - Just `git pull` and restart  
✅ **Database Included** - PostgreSQL runs in a container  
✅ **No PM2 Issues** - Environment variables work perfectly  

---

## Troubleshooting

### Check if Docker is running
```bash
docker ps
```

### Check database connection
```bash
docker-compose exec postgres psql -U teleshopuser -d teleshop
```

### Rebuild after code changes
```bash
docker-compose build --no-cache
docker-compose up -d
```

### View resource usage
```bash
docker stats
```
