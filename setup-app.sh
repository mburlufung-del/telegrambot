#!/bin/bash

set -e

echo "=================================================="
echo "   Installing and Starting Telegram Shop Bot"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file with required variables:"
    echo "  NODE_ENV=production"
    echo "  PORT=5000"
    echo "  TELEGRAM_BOT_TOKEN=your-token"
    echo "  DATABASE_URL=postgresql://user:pass@localhost:5432/teleshop"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing npm dependencies...${NC}"
npm install --production

echo -e "${YELLOW}Step 2: Building application...${NC}"
npm run build

echo -e "${YELLOW}Step 3: Running database migrations...${NC}"
npm run db:push --force || npm run db:push

echo -e "${YELLOW}Step 4: Stopping any existing PM2 processes...${NC}"
pm2 delete teleshop-bot 2>/dev/null || true

echo -e "${YELLOW}Step 5: Starting application with PM2...${NC}"
pm2 start npm --name "teleshop-bot" -- start

echo -e "${YELLOW}Step 6: Saving PM2 configuration...${NC}"
pm2 save

echo -e "${YELLOW}Step 7: Enabling PM2 on system startup...${NC}"
pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true

echo ""
echo -e "${GREEN}✓ Application started successfully!${NC}"
echo ""
echo "=================================================="
echo "Useful Commands:"
echo "=================================================="
echo "View logs:        pm2 logs teleshop-bot"
echo "View status:      pm2 status"
echo "Restart bot:      pm2 restart teleshop-bot"
echo "Stop bot:         pm2 stop teleshop-bot"
echo "Monitor:          pm2 monit"
echo "=================================================="
echo ""

pm2 status
