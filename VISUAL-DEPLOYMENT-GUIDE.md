# 🎬 Visual Step-by-Step Deployment Guide
## Deploy Your Telegram Bot on Hostinger VPS

---

## 📋 **What You'll Need**
- ✅ Hostinger VPS (any plan works, starting at $4.99/month)
- ✅ Your Telegram Bot Token: `8411974702:AAGUrco5I7e0ypXhwBGbhOHoJFXiU-9iGHw`
- ✅ SSH client (Terminal on Mac/Linux, PuTTY on Windows)
- ✅ 15-20 minutes of your time

---

# 🚀 **PART 1: Setting Up Your VPS**

## Step 1: Create Your VPS

### 1.1 Log into Hostinger
- Go to https://hpanel.hostinger.com
- Navigate to **VPS** section
- Click **"Order New VPS"** or **"Setup VPS"**

### 1.2 Choose Your Plan
```
Recommended: KVM 2 Plan
- 2 vCPU cores
- 8 GB RAM
- 100 GB NVMe storage
- Cost: ~$8.99/month
```

### 1.3 Select Operating System
**IMPORTANT: Choose this exact option:**
```
✅ Ubuntu 22.04 LTS 64-bit
```
**OR** if available:
```
✅ Ubuntu 22.04 64-bit with Node.js
```

### 1.4 Choose Server Location
Pick the location closest to your users:
- 🇺🇸 USA (East/West)
- 🇪🇺 Europe (Netherlands/UK)
- 🇦🇺 Asia (Singapore/Australia)

### 1.5 Complete Purchase
- Review and confirm
- Complete payment
- Wait 2-5 minutes for VPS setup

---

## Step 2: Get Your SSH Credentials

### 2.1 Find Your IP Address
In your Hostinger VPS dashboard:
```
Look for: IP Address: xxx.xxx.xxx.xxx
Copy this number - you'll need it!
```

### 2.2 Get Your Password
**Option A:** Check your email
- Subject: "Your VPS is ready" or "VPS Setup Complete"
- Contains: Root password

**Option B:** In VPS Dashboard
- Go to **Settings** or **Overview** tab
- Look for **"Root Password"** or **"SSH Password"**
- If not visible, click **"Change Root Password"**

### 2.3 Write Down These Details
```
IP Address: _________________
Username: root
Password: _________________
Port: 22
```

---

# 💻 **PART 2: Connect to Your VPS**

## Step 3: SSH Connection

### For Mac/Linux Users:

**3.1** Open Terminal (Applications → Terminal)

**3.2** Type this command (replace with YOUR IP):
```bash
ssh root@YOUR_VPS_IP
```
Example:
```bash
ssh root@123.45.67.89
```

**3.3** First time connection will ask:
```
Are you sure you want to continue? (yes/no)
```
Type: `yes` and press Enter

**3.4** Enter your password when prompted
- **Note:** You won't see characters as you type - this is normal!
- Paste password and press Enter

---

### For Windows Users:

**3.1** Download PuTTY
- Go to: https://www.putty.org
- Download and install

**3.2** Open PuTTY

**3.3** Enter connection details:
```
Host Name: YOUR_VPS_IP
Port: 22
Connection Type: SSH
```

**3.4** Click "Open"

**3.5** Login:
```
login as: root
password: [your password]
```

---

## ✅ **Success Check**
You should see something like:
```
Welcome to Ubuntu 22.04.3 LTS
root@vps-12345:~#
```
**🎉 You're now connected to your VPS!**

---

# 🔧 **PART 3: Install Required Software**

## Step 4: Run Server Setup Script

**4.1** Upload the deployment script
From your **local computer**, run:
```bash
scp deploy.sh root@YOUR_VPS_IP:/root/
```
Enter your password when prompted

**Alternative:** If you can't upload, create the file manually:
```bash
nano deploy.sh
```
Then copy the content from the `deploy.sh` file in your project

**4.2** Make script executable
```bash
chmod +x deploy.sh
```

**4.3** Run the setup script
```bash
bash deploy.sh
```

**What happens now:**
```
✓ Updates Ubuntu system
✓ Installs Node.js 20.x
✓ Installs PM2 (process manager)
✓ Installs Nginx (web server)
✓ Installs PostgreSQL (database)
✓ Creates database automatically
```

**⏱️ This takes 3-5 minutes**

**📝 IMPORTANT:** At the end, you'll see:
```
Database password: abc123xyz456...
```
**COPY THIS PASSWORD! You need it for the next step.**

---

# 📦 **PART 4: Upload Your Bot Code**

## Step 5: Transfer Your Application

### Option A: Using Git (Recommended)

**5.1** If your code is on GitHub:
```bash
cd /var/www/teleshop-bot
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git .
```

### Option B: Using SCP (Upload from Computer)

**5.2** On your **local computer**, compress your project:
```bash
tar -czf bot.tar.gz --exclude=node_modules --exclude=.git .
```

**5.3** Upload to VPS:
```bash
scp bot.tar.gz root@YOUR_VPS_IP:/var/www/teleshop-bot/
```

**5.4** On your VPS, extract:
```bash
cd /var/www/teleshop-bot
tar -xzf bot.tar.gz
rm bot.tar.gz
```

---

# ⚙️ **PART 5: Configure Your Bot**

## Step 6: Set Up Environment Variables

**6.1** Create .env file:
```bash
cd /var/www/teleshop-bot
nano .env
```

**6.2** Add these lines (replace DB_PASSWORD with the one from Step 4):
```env
NODE_ENV=production
PORT=5000
TELEGRAM_BOT_TOKEN=8411974702:AAGUrco5I7e0ypXhwBGbhOHoJFXiU-9iGHw
DATABASE_URL=postgresql://teleshopuser:DB_PASSWORD_HERE@localhost:5432/teleshop
```

**6.3** Save and exit:
- Press `Ctrl + X`
- Press `Y` (yes)
- Press `Enter`

---

# 🎯 **PART 6: Launch Your Bot**

## Step 7: Install and Start

**7.1** Upload the app setup script:
```bash
scp setup-app.sh root@YOUR_VPS_IP:/var/www/teleshop-bot/
```

**7.2** Make it executable:
```bash
chmod +x setup-app.sh
```

**7.3** Run the setup:
```bash
bash setup-app.sh
```

**What happens:**
```
✓ Installs npm packages
✓ Builds your application
✓ Sets up database tables
✓ Starts bot with PM2
✓ Enables auto-restart on reboot
```

**⏱️ This takes 2-3 minutes**

---

## Step 8: Verify Bot is Running

**8.1** Check PM2 status:
```bash
pm2 status
```

You should see:
```
┌────┬─────────────┬─────────┬─────────┬─────────┐
│ id │ name        │ status  │ restart │ uptime  │
├────┼─────────────┼─────────┼─────────┼─────────┤
│ 0  │ teleshop-bot│ online  │ 0       │ 10s     │
└────┴─────────────┴─────────┴─────────┴─────────┘
```
**✅ Status should be "online"**

**8.2** Check logs:
```bash
pm2 logs teleshop-bot --lines 20
```

Look for:
```
✓ Telegram bot initialized and running
✓ Server started on port 5000
```

---

# 🧪 **PART 7: Test Your Bot**

## Step 9: Test in Telegram

**9.1** Open Telegram on your phone/computer

**9.2** Search for your bot:
```
Search: @YourBotUsername
```

**9.3** Start conversation:
```
Send: /start
```

**✅ You should receive:**
```
🎉 Welcome to our Shop!
🛍️ Your one-stop destination for amazing products
```

**🎉 Your bot is now live and running 24/7!**

---

# 🌐 **PART 8: Set Up Admin Dashboard (Optional)**

## Step 10: Configure Domain

### If you have a domain name:

**10.1** Upload Nginx setup script:
```bash
scp setup-nginx.sh root@YOUR_VPS_IP:/root/
chmod +x setup-nginx.sh
```

**10.2** Run the script:
```bash
bash setup-nginx.sh
```

**10.3** Enter your domain when prompted:
```
Enter your domain: shop.yourdomain.com
```

**10.4** Point your domain to VPS:
- Go to your domain registrar (GoDaddy, Namecheap, etc.)
- Add DNS A record:
  ```
  Type: A
  Name: @ (or shop)
  Value: YOUR_VPS_IP
  TTL: 3600
  ```

**10.5** Wait for DNS propagation (1-24 hours)

**10.6** Install SSL certificate:
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d shop.yourdomain.com
```

**✅ Your admin dashboard is now at: https://shop.yourdomain.com**

---

# 🛡️ **PART 9: Secure Your Server**

## Step 11: Enable Firewall

```bash
# Allow SSH
ufw allow 22

# Allow HTTP
ufw allow 80

# Allow HTTPS
ufw allow 443

# Enable firewall
ufw enable
```

Type `y` when asked to confirm.

**11.2** Verify:
```bash
ufw status
```

Should show:
```
Status: active
22/tcp    ALLOW
80/tcp    ALLOW
443/tcp   ALLOW
```

---

# 📊 **Monitoring & Maintenance**

## Useful Commands

### Check Bot Status
```bash
pm2 status
```

### View Live Logs
```bash
pm2 logs teleshop-bot
```

### Restart Bot
```bash
pm2 restart teleshop-bot
```

### Stop Bot
```bash
pm2 stop teleshop-bot
```

### Monitor Resources
```bash
pm2 monit
```

### Update Bot (after making changes)
```bash
cd /var/www/teleshop-bot
git pull                    # If using Git
npm install                 # Install new packages
npm run build               # Rebuild
pm2 restart teleshop-bot    # Restart
```

---

# 🆘 **Troubleshooting**

## Problem: Bot Not Responding

**Solution:**
```bash
pm2 logs teleshop-bot
```
Check for errors and restart:
```bash
pm2 restart teleshop-bot
```

## Problem: Database Connection Error

**Solution:**
```bash
# Check .env file
cat .env

# Verify PostgreSQL is running
systemctl status postgresql

# Test database connection
sudo -u postgres psql teleshop
```

## Problem: Port Already in Use

**Solution:**
```bash
# Find what's using port 5000
lsof -i :5000

# Kill the process (replace PID)
kill -9 PID

# Restart bot
pm2 restart teleshop-bot
```

## Problem: Forgot Database Password

**Solution:**
```bash
cat /root/db-password.txt
```

---

# ✅ **Deployment Complete!**

## What You've Accomplished:

✅ Set up Ubuntu VPS on Hostinger  
✅ Installed Node.js, PM2, Nginx, PostgreSQL  
✅ Deployed your Telegram bot  
✅ Configured auto-restart on crashes/reboots  
✅ Secured your server with firewall  
✅ (Optional) Set up admin dashboard with SSL  

## Your Bot is Now:
- 🟢 Running 24/7
- 🔄 Auto-restarts on crashes
- 🔐 Secure with firewall
- 📊 Monitored with PM2
- 💾 Data saved in PostgreSQL

---

# 📺 **Video Tutorials (Similar Process)**

While there's no specific Hostinger+Telegram bot video, these cover the same process:

**Search YouTube for:**
- "deploy node js ubuntu vps"
- "telegram bot vps deployment"
- "pm2 nginx deployment tutorial"

**Recommended Channels:**
- Traversy Media (Node.js deployment)
- DigitalOcean Tutorials
- Hostinger Academy

---

# 💰 **Cost Summary**

**Monthly Costs:**
- Hostinger VPS KVM 2: **$8.99/month**
- SSL Certificate: **FREE** (Let's Encrypt)
- Domain (optional): **~$10-15/year**

**Total: ~$9-10/month for a fully hosted bot!**

---

# 🎓 **Next Steps**

1. **Test all bot features** in Telegram
2. **Explore admin dashboard** (if configured)
3. **Set up automated backups**:
   ```bash
   crontab -e
   # Add: 0 2 * * * sudo -u postgres pg_dump teleshop > /backups/db-$(date +\%Y\%m\%d).sql
   ```
4. **Monitor server resources**:
   ```bash
   htop
   df -h
   ```
5. **Keep system updated**:
   ```bash
   apt update && apt upgrade -y
   ```

---

## 🆘 Need Help?

If you get stuck at any step:

1. **Check logs**: `pm2 logs teleshop-bot`
2. **Verify status**: `pm2 status`
3. **Test connection**: `curl http://localhost:5000/health`
4. **Contact Hostinger support** (24/7 chat available)

---

**🎉 Congratulations! Your Telegram bot is now deployed and running!**

*Last updated: October 2025*
