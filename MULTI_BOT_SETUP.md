# 🤖 Multi-Bot Setup Guide

This guide will help you add Bot Tokens 2-10 to your deployment.

## 📝 Quick Setup Steps

### Step 1: Create Your Configuration File

```bash
# On your VPS, navigate to the project directory
cd /var/www/telegrambot

# Copy the example file to create your config
cp .env.docker.example .env.docker
```

### Step 2: Add Your Bot Tokens

```bash
# Edit the configuration file
nano .env.docker
```

You'll see a file like this:

```env
# Public URL for image access (use your VPS IP or domain)
PUBLIC_URL=http://72.60.20.38

# Bot tokens from @BotFather
BOT1_TOKEN=8467452442:AAESTxYaWdTGsacW6YSqTnITpQdj-e8-Nkw
BOT2_TOKEN=your_bot_2_token_here
BOT3_TOKEN=your_bot_3_token_here
BOT4_TOKEN=your_bot_4_token_here
BOT5_TOKEN=your_bot_5_token_here
BOT6_TOKEN=your_bot_6_token_here
BOT7_TOKEN=your_bot_7_token_here
BOT8_TOKEN=your_bot_8_token_here
BOT9_TOKEN=your_bot_9_token_here
BOT10_TOKEN=your_bot_10_token_here
```

**Replace `your_bot_X_token_here` with your actual bot tokens from @BotFather**

### Step 3: Get Bot Tokens from @BotFather

If you haven't created your bots yet:

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow the prompts to name your bot
4. Copy the token that looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. Repeat for each bot you want to create

### Step 4: Save the Configuration

After adding your tokens:
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

## 🚀 Deployment Options

### Option A: Deploy All 10 Bots

```bash
docker-compose --env-file .env.docker up -d
```

### Option B: Deploy Specific Bots

#### Deploy only Bot 1, 2, and 3:
```bash
docker-compose --env-file .env.docker up -d postgres bot1 bot2 bot3
```

#### Deploy only Bot 1 through 5:
```bash
docker-compose --env-file .env.docker up -d postgres bot1 bot2 bot3 bot4 bot5
```

#### Add Bot 6 later:
```bash
docker-compose --env-file .env.docker up -d bot6
```

---

## 📊 Access Your Dashboards

After deployment, access each bot's admin dashboard:

| Bot | Dashboard URL | Telegram Bot |
|-----|--------------|--------------|
| Bot 1 | http://72.60.20.38:5001 | @mdphpwelt_shopbot |
| Bot 2 | http://72.60.20.38:5002 | Your Bot 2 |
| Bot 3 | http://72.60.20.38:5003 | Your Bot 3 |
| Bot 4 | http://72.60.20.38:5004 | Your Bot 4 |
| Bot 5 | http://72.60.20.38:5005 | Your Bot 5 |
| Bot 6 | http://72.60.20.38:5006 | Your Bot 6 |
| Bot 7 | http://72.60.20.38:5007 | Your Bot 7 |
| Bot 8 | http://72.60.20.38:5008 | Your Bot 8 |
| Bot 9 | http://72.60.20.38:5009 | Your Bot 9 |
| Bot 10 | http://72.60.20.38:5010 | Your Bot 10 |

---

## 🔄 Management Commands

### Check Running Bots
```bash
docker-compose ps
```

Expected output:
```
NAME                      STATUS
telegrambot-postgres-1    Up 2 hours (healthy)
telegrambot-bot1-1        Up 2 hours
telegrambot-bot2-1        Up 2 hours
telegrambot-bot3-1        Up 2 hours
```

### View Logs for Specific Bot
```bash
# View Bot 2 logs
docker-compose logs -f bot2

# View Bot 3 logs
docker-compose logs -f bot3
```

### Restart a Specific Bot
```bash
# Restart Bot 2
docker-compose restart bot2

# Restart Bot 5
docker-compose restart bot5
```

### Stop a Specific Bot
```bash
docker-compose stop bot2
```

### Stop All Bots (Keep Database)
```bash
docker-compose down
```

---

## 🛠️ Common Tasks

### Add a New Bot (Example: Bot 6)

1. **Get token from @BotFather**
2. **Add to .env.docker:**
   ```bash
   nano .env.docker
   # Add your Bot 6 token
   # Save and exit
   ```
3. **Deploy Bot 6:**
   ```bash
   docker-compose --env-file .env.docker up -d bot6
   ```
4. **Check it's running:**
   ```bash
   docker-compose logs -f bot6
   ```

### Change a Bot Token

1. **Edit configuration:**
   ```bash
   nano .env.docker
   # Update the token
   ```
2. **Restart that bot:**
   ```bash
   docker-compose restart bot3  # example for bot3
   ```

### Check All Active Bots
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## 📋 Checklist for Adding Bots 2-10

- [ ] Create 9 new bots in @BotFather (or use existing ones)
- [ ] Copy bot tokens from @BotFather
- [ ] Open .env.docker file
- [ ] Paste each token next to BOT2_TOKEN through BOT10_TOKEN
- [ ] Save the file
- [ ] Deploy selected bots
- [ ] Verify each bot is running with `docker-compose ps`
- [ ] Access each dashboard in browser
- [ ] Test each bot in Telegram

---

## ⚠️ Important Notes

1. **All bots share the same database** - They can have separate products, categories, and orders
2. **Each bot needs a unique token** - You cannot reuse the same token
3. **You don't need to deploy all 10** - Start with 2-3 and add more as needed
4. **Tokens are sensitive** - Never commit .env.docker to GitHub (it's in .gitignore)
5. **The database must be running** - Docker Compose automatically starts it with `postgres` service

---

## 🎯 Example: Adding Just Bot 2

```bash
# 1. Get token from @BotFather
# Example token: 987654321:ABCxyz123456789

# 2. Edit config
nano .env.docker

# 3. Find this line:
BOT2_TOKEN=your_bot_2_token_here

# 4. Replace with your token:
BOT2_TOKEN=987654321:ABCxyz123456789

# 5. Save (Ctrl+X, Y, Enter)

# 6. Deploy Bot 2
docker-compose --env-file .env.docker up -d bot2

# 7. Check logs
docker-compose logs -f bot2

# 8. Open browser
# Navigate to: http://72.60.20.38:5002
```

---

## 🆘 Troubleshooting

### Bot won't start?
```bash
# Check logs for errors
docker-compose logs bot2 --tail 50

# Common issues:
# - Invalid token format
# - Token already used by another instance
# - Database not ready (wait 30 seconds and try again)
```

### Can't access dashboard?
```bash
# Check if bot is running
docker ps | grep bot2

# Check if port is accessible
curl http://localhost:5002/health

# Check firewall
sudo ufw status
```

### Database connection error?
```bash
# Make sure postgres is healthy
docker-compose ps postgres

# If not healthy, restart everything
docker-compose down
docker-compose --env-file .env.docker up -d
```

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ `docker-compose ps` shows all your bots as "Up"  
✅ Each dashboard loads in your browser  
✅ Each bot responds to `/start` in Telegram  
✅ You can add products in each dashboard  
✅ Products appear in the Telegram bot  

---

**Need help? Check the logs first with `docker-compose logs -f botX`**
