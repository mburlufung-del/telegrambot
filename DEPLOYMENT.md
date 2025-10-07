# Hostinger VPS Deployment Guide

Complete guide to deploy your Telegram Shop Bot on Hostinger VPS.

## Prerequisites

- Hostinger VPS (any plan will work)
- SSH access to your VPS
- Your Telegram Bot Token: `8411974702:AAGUrco5I7e0ypXhwBGbhOHoJFXiU-9iGHw`
- (Optional) Domain name for admin dashboard

## Quick Start

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

Enter your VPS password when prompted.

### Step 2: Upload Deployment Files

From your local machine, upload the deployment scripts:

```bash
scp deploy.sh setup-app.sh setup-nginx.sh root@your-vps-ip:/root/
```

### Step 3: Run Initial Server Setup

On your VPS:

```bash
cd /root
chmod +x deploy.sh setup-app.sh setup-nginx.sh
bash deploy.sh
```

This will install:
- Node.js 20.x
- PM2 process manager
- Nginx web server
- PostgreSQL database

**IMPORTANT:** Save the database password that is displayed!

### Step 4: Upload Your Application

#### Option A: Using Git

```bash
cd /var/www/teleshop-bot
git clone <your-repository-url> .
```

#### Option B: Using SCP/SFTP

From your local machine:

```bash
# Compress your project (exclude node_modules)
tar -czf teleshop-bot.tar.gz --exclude=node_modules --exclude=.git .

# Upload to VPS
scp teleshop-bot.tar.gz root@your-vps-ip:/var/www/teleshop-bot/

# On VPS, extract:
cd /var/www/teleshop-bot
tar -xzf teleshop-bot.tar.gz
rm teleshop-bot.tar.gz
```

### Step 5: Configure Environment Variables

On your VPS:

```bash
cd /var/www/teleshop-bot
nano .env
```

Add this content (replace DB_PASSWORD with the one from step 3):

```env
NODE_ENV=production
PORT=5000
TELEGRAM_BOT_TOKEN=8411974702:AAGUrco5I7e0ypXhwBGbhOHoJFXiU-9iGHw
DATABASE_URL=postgresql://teleshopuser:DB_PASSWORD@localhost:5432/teleshop
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 6: Install and Start Application

```bash
bash setup-app.sh
```

This will:
- Install dependencies
- Build the application
- Set up the database
- Start the bot with PM2
- Configure auto-restart on reboot

### Step 7: Set Up Admin Dashboard (Optional)

If you have a domain name:

```bash
bash setup-nginx.sh
```

Enter your domain when prompted.

Then point your domain's DNS to your VPS IP:
- Type: A
- Name: @ (or subdomain)
- Value: your-vps-ip

### Step 8: Install SSL Certificate (Optional)

After DNS propagation (wait 1-24 hours):

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com
```

### Step 9: Configure Firewall

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## Verification

Check if bot is running:

```bash
pm2 status
pm2 logs teleshop-bot
```

Test the bot:
1. Open Telegram
2. Search for your bot
3. Send `/start`

## Useful Commands

### PM2 Commands

```bash
pm2 status                    # View all processes
pm2 logs teleshop-bot         # View logs
pm2 logs teleshop-bot --lines 100  # View last 100 lines
pm2 restart teleshop-bot      # Restart bot
pm2 stop teleshop-bot         # Stop bot
pm2 start teleshop-bot        # Start bot
pm2 delete teleshop-bot       # Remove from PM2
pm2 monit                     # Live monitoring
```

### Update Your Bot

```bash
cd /var/www/teleshop-bot
git pull origin main          # If using Git
npm install                   # Install new dependencies
npm run build                 # Rebuild
pm2 restart teleshop-bot      # Restart
```

### View Logs

```bash
# Application logs
pm2 logs teleshop-bot

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Database logs
tail -f /var/log/postgresql/postgresql-*.log
```

### Database Management

```bash
# Access database
sudo -u postgres psql teleshop

# Backup database
sudo -u postgres pg_dump teleshop > backup.sql

# Restore database
sudo -u postgres psql teleshop < backup.sql
```

## Troubleshooting

### Bot Not Responding

```bash
pm2 logs teleshop-bot  # Check for errors
pm2 restart teleshop-bot
```

### Port Already in Use

```bash
lsof -i :5000  # Find process using port 5000
kill -9 <PID>  # Kill the process
pm2 restart teleshop-bot
```

### Database Connection Error

1. Check DATABASE_URL in .env file
2. Verify PostgreSQL is running: `systemctl status postgresql`
3. Test connection: `sudo -u postgres psql teleshop`

### Nginx Issues

```bash
nginx -t              # Test configuration
systemctl status nginx
systemctl restart nginx
```

## Performance Tips

1. **Enable PM2 Cluster Mode** for multiple CPU cores:
   ```bash
   pm2 start npm --name "teleshop-bot" -i max -- start
   ```

2. **Monitor Resources**:
   ```bash
   pm2 monit
   htop
   ```

3. **Set up automated backups** (cron job):
   ```bash
   crontab -e
   # Add: 0 2 * * * sudo -u postgres pg_dump teleshop > /backups/teleshop-$(date +\%Y\%m\%d).sql
   ```

## Security Checklist

- ✅ Firewall enabled (UFW)
- ✅ SSL certificate installed
- ✅ Database password secured
- ✅ .env file permissions: `chmod 600 .env`
- ✅ Regular system updates: `apt update && apt upgrade`
- ✅ SSH key authentication (recommended over password)
- ✅ Fail2ban installed (optional but recommended)

## Support

If you encounter issues:

1. Check logs: `pm2 logs teleshop-bot`
2. Check bot status: `pm2 status`
3. Verify environment variables: `cat .env`
4. Test database connection
5. Check Nginx configuration: `nginx -t`

## Estimated Costs

Hostinger VPS pricing (as of 2025):
- KVM 1: $4.99/month (1 vCPU, 4GB RAM) - Suitable for small bots
- KVM 2: $8.99/month (2 vCPU, 8GB RAM) - Recommended for production
- KVM 4: $12.99/month (4 vCPU, 16GB RAM) - High traffic bots

---

**Your bot is now running 24/7 on Hostinger VPS!** 🚀
