# Deploy TeleShop Bot from GitHub to VPS

## Quick Deployment Steps

### Option 1: Pull from Your GitHub Repo

**1. On your VPS, restore the backup first:**
```bash
cd /var/www/telegrambot
cp server/bot.ts.backup server/bot.ts
```

**2. Push this code to your GitHub repository:**

On this Replit, export the code:
```bash
# Download all files as ZIP from Replit
# Or use Replit's Git integration to push to GitHub
```

**3. On your VPS, pull the latest code:**
```bash
cd /var/www/telegrambot

# If you haven't set up Git yet:
git init
git remote add origin https://github.com/YOUR_USERNAME/teleshop-bot.git

# Pull latest changes
git pull origin main

# Rebuild all bots
docker-compose up -d --build bot1 bot2 bot3
```

---

### Option 2: Direct File Transfer via SCP

**1. From your local machine (with access to this Replit):**
```bash
# Download server/bot.ts from Replit
# Then upload to VPS:
scp server/bot.ts root@72.60.20.38:/var/www/telegrambot/server/bot.ts
```

**2. On VPS, rebuild:**
```bash
cd /var/www/telegrambot
docker-compose up -d --build bot2
```

---

### Option 3: Manual Copy-Paste (Simplest for single file)

**1. On your VPS:**
```bash
cd /var/www/telegrambot
nano server/bot.ts
```

**2. Find line ~1921 (search for "Try to send product image")**

**3. Replace the image sending block with the fixed version**

The key change is switching from sending URLs to sending image buffers:

```typescript
// OLD (doesn't work - port blocked):
const fullImageUrl = product.imageUrl.startsWith('http') ? ...
await this.bot?.sendPhoto(chatId, fullImageUrl, ...);

// NEW (works - sends file directly):
const imageId = product.imageUrl.replace('/api/images/', '');
const imageStore = (global as any).imageStore || new Map();
const imageData = imageStore.get(imageId);
if (imageData && imageData.data) {
  await this.bot?.sendPhoto(chatId, imageData.data, ...);
}
```

---

## What This Fix Does

**Problem:** Telegram servers cannot download images from `http://72.60.20.38:5002` (port blocked)

**Solution:** Send image file content directly to Telegram instead of URLs

**Result:** Product images will display on Telegram even if ports are blocked
