# Telegram Bot Multi-Instance Deployment

Deploy up to 10 Telegram bots with individual admin dashboards on a single VPS using Docker.

## 🚀 Quick Deploy on Hostinger VPS

### Prerequisites
- Hostinger VPS (Ubuntu 22.04 or 24.04)
- SSH access to your VPS
- 10 Telegram bot tokens from @BotFather

### One-Command Deployment

```bash
curl -fsSL https://raw.githubusercontent.com/mburlufung-del/telegrambot/main/deploy-vps.sh | bash
```

---

## 📋 Manual Deployment Steps

### 1. Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
```

### 2. Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker
```

### 3. Clone Repository

```bash
cd /var/www
git clone https://github.com/mburlufung-del/telegrambot.git
cd telegrambot
```

### 4. Configure Bot Tokens

```bash
cp .env.docker.example .env.docker
nano .env.docker
```

**Replace with your actual bot tokens:**
```env
BOT1_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
BOT2_TOKEN=987654321:ZYXwvuTSRqpONMLkjihgfedcba
# ... add all 10 tokens
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### 5. Deploy All Bots

```bash
docker-compose --env-file .env.docker up -d
```

### 6. Access Your Dashboards

- **Bot 1:** `http://YOUR_VPS_IP:5001`
- **Bot 2:** `http://YOUR_VPS_IP:5002`
- **Bot 3:** `http://YOUR_VPS_IP:5003`
- ... through Bot 10 on port 5010

---

## 🎯 Deploy Specific Number of Bots

### Only 3 Bots
```bash
docker-compose --env-file .env.docker up -d bot1 bot2 bot3 postgres
```

### Only 5 Bots
```bash
docker-compose --env-file .env.docker up -d bot1 bot2 bot3 bot4 bot5 postgres
```

---

## 📊 Management Commands

### View All Running Bots
```bash
docker-compose ps
```

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

### Stop and Remove Everything (including database)
```bash
docker-compose down -v
```

---

## 🔄 Update Deployment

```bash
cd /var/www/telegrambot
git pull
docker-compose build
docker-compose --env-file .env.docker up -d
```

---

## 🔧 Change Bot Token

```bash
cd /var/www/telegrambot
nano .env.docker
# Edit the token
docker-compose restart bot1
```

---

## 🔒 Security Best Practices

1. **Never commit `.env.docker`** to GitHub (already in `.gitignore`)
2. **Use strong PostgreSQL password** (change in `docker-compose.yml`)
3. **Enable firewall** on your VPS:
   ```bash
   ufw allow 22
   ufw allow 5001:5010/tcp
   ufw enable
   ```

---

## 🛠️ Troubleshooting

### Check Docker Status
```bash
docker ps
```

### Check Bot Logs for Errors
```bash
docker-compose logs bot1 --tail 50
```

### Database Connection Issues
```bash
docker-compose exec postgres psql -U teleshopuser -d teleshop
```

### Rebuild Without Cache
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Check Resource Usage
```bash
docker stats
```

---

## 📁 Project Structure

```
telegrambot/
├── server/           # Backend code
├── client/           # Frontend admin dashboard
├── shared/           # Shared types and schemas
├── Dockerfile        # Docker image definition
├── docker-compose.yml # Multi-bot orchestration
├── .env.docker.example # Environment template
└── README.md         # This file
```

---

## 🌐 Architecture

```
VPS (e.g., 72.60.20.38)
│
├── PostgreSQL (Container)
│   └── Shared database for all bots
│
├── Bot 1 (Container) → Port 5001
├── Bot 2 (Container) → Port 5002
├── Bot 3 (Container) → Port 5003
├── ...
└── Bot 10 (Container) → Port 5010
```

Each bot:
- Runs in isolated Docker container
- Has its own admin dashboard
- Shares the same PostgreSQL database
- Auto-restarts on failure
- Uses its own Telegram bot token

---

## 💡 Features

✅ **Easy Deployment** - One command deploys all bots  
✅ **Isolated Containers** - Each bot runs independently  
✅ **Auto-Restart** - Bots restart automatically on crash  
✅ **Shared Database** - Single PostgreSQL for all bots  
✅ **Admin Dashboard** - Web interface for each bot  
✅ **Easy Updates** - Pull from GitHub and redeploy  
✅ **No PM2 Issues** - Environment variables work perfectly  

---

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose logs -f bot1`
2. Verify tokens in `.env.docker`
3. Ensure Docker is running: `docker ps`

---

## 📝 License

This project is for deployment purposes. Customize as needed.
