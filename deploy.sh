#!/bin/bash

set -e

echo "=================================================="
echo "   Telegram Shop Bot - VPS Deployment Script"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (use: sudo bash deploy.sh)${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${YELLOW}Step 3: Installing PM2 process manager...${NC}"
npm install -g pm2

echo -e "${YELLOW}Step 4: Installing Nginx web server...${NC}"
apt install -y nginx

echo -e "${YELLOW}Step 5: Installing PostgreSQL database...${NC}"
apt install -y postgresql postgresql-contrib

echo -e "${YELLOW}Step 6: Configuring PostgreSQL...${NC}"
# Generate a random password for database
DB_PASSWORD=$(openssl rand -base64 32)

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE teleshop;
CREATE USER teleshopuser WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE teleshop TO teleshopuser;
ALTER DATABASE teleshop OWNER TO teleshopuser;
\q
EOF

echo -e "${GREEN}✓ Database created successfully${NC}"
echo -e "${YELLOW}Database password: $DB_PASSWORD${NC}"
echo -e "${YELLOW}(Save this password - you'll need it for .env file)${NC}"
echo ""

# Create app directory
echo -e "${YELLOW}Step 7: Creating application directory...${NC}"
mkdir -p /var/www/teleshop-bot
cd /var/www/teleshop-bot

echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "=================================================="
echo "Next Steps:"
echo "=================================================="
echo "1. Upload your project files to: /var/www/teleshop-bot"
echo "2. Create .env file with these settings:"
echo ""
echo "   NODE_ENV=production"
echo "   PORT=5000"
echo "   TELEGRAM_BOT_TOKEN=your-bot-token-here"
echo "   DATABASE_URL=postgresql://teleshopuser:$DB_PASSWORD@localhost:5432/teleshop"
echo ""
echo "3. Run the app setup script:"
echo "   cd /var/www/teleshop-bot"
echo "   bash setup-app.sh"
echo ""
echo "Database password saved to: /root/db-password.txt"
echo "=================================================="

# Save DB password to file
echo "$DB_PASSWORD" > /root/db-password.txt
chmod 600 /root/db-password.txt

echo -e "${GREEN}Server setup completed successfully!${NC}"
