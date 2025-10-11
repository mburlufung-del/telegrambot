#!/bin/bash

# Image Fix Deployment Script for VPS
# This script updates the bot code to fix image display issues

echo "=========================================="
echo "  Fixing Image Display for Telegram Bot"
echo "=========================================="
echo ""

VPS_IP="72.60.20.38"
PORT="5001"

cd /var/www/telegrambot || exit 1

echo "📝 Step 1: Backing up current files..."
cp server/bot.ts server/bot.ts.backup-$(date +%Y%m%d-%H%M%S)
cp .env.docker .env.docker.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

echo ""
echo "📝 Step 2: Adding getBaseUrl() helper to bot.ts..."

# Check if getBaseUrl already exists
if grep -q "getBaseUrl" server/bot.ts; then
    echo "✅ getBaseUrl() already exists in bot.ts"
else
    # Add the helper method after class declaration
    sed -i '/private autoVanishTimers: Map<number, NodeJS.Timeout> = new Map();/a\
\
  // Get the correct base URL for image construction\
  private getBaseUrl(): string {\
    if (process.env.PUBLIC_URL) {\
      return process.env.PUBLIC_URL;\
    }\
    if (process.env.WEBHOOK_URL) {\
      return process.env.WEBHOOK_URL;\
    }\
    if (process.env.REPLIT_DOMAINS) {\
      return `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`;\
    }\
    return "http://localhost:5000";\
  }' server/bot.ts
    
    echo "✅ Added getBaseUrl() method"
fi

echo ""
echo "📝 Step 3: Fixing image URL construction in bot.ts..."

# Fix broadcast image URLs
sed -i 's|const baseUrl = process\.env\.WEBHOOK_URL || `https://\${process\.env\.REPLIT_DOMAINS.*split.*`|const baseUrl = this.getBaseUrl()|g' server/bot.ts

# Alternative pattern if the above doesn't match
sed -i 's|process\.env\.WEBHOOK_URL || `https://\${.*REPLIT_DOMAINS.*||.*5000.*`|this.getBaseUrl()|g' server/bot.ts

echo "✅ Fixed image URL construction"

echo ""
echo "📝 Step 4: Updating .env.docker with PUBLIC_URL..."

# Create or update .env.docker
if [ ! -f .env.docker ]; then
    echo "Creating new .env.docker file..."
    cat > .env.docker << ENVEOF
PUBLIC_URL=http://${VPS_IP}:${PORT}
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
ENVEOF
else
    # Check if PUBLIC_URL already exists
    if grep -q "PUBLIC_URL" .env.docker; then
        echo "PUBLIC_URL already exists, updating it..."
        sed -i "s|PUBLIC_URL=.*|PUBLIC_URL=http://${VPS_IP}:${PORT}|g" .env.docker
    else
        echo "Adding PUBLIC_URL to existing .env.docker..."
        sed -i "1iPUBLIC_URL=http://${VPS_IP}:${PORT}" .env.docker
    fi
fi

echo "✅ Updated .env.docker"

echo ""
echo "📝 Step 5: Showing .env.docker configuration..."
head -3 .env.docker

echo ""
echo "📝 Step 6: Rebuilding and restarting bot1..."
docker-compose down
docker-compose build --no-cache bot1
docker-compose --env-file .env.docker up -d

echo ""
echo "📝 Step 7: Waiting for bot to initialize..."
sleep 5

echo ""
echo "📝 Step 8: Checking bot environment..."
echo "PUBLIC_URL setting:"
docker-compose exec bot1 printenv PUBLIC_URL || echo "❌ PUBLIC_URL not set!"

echo ""
echo "📝 Step 9: Checking bot logs..."
docker-compose logs bot1 --tail 30

echo ""
echo "=========================================="
echo "  ✅ Fix Deployment Complete!"
echo "=========================================="
echo ""
echo "🧪 TEST THE FIX:"
echo ""
echo "1. Open dashboard: http://${VPS_IP}:${PORT}"
echo "2. Go to Products > Add Product"
echo "3. Upload an image and save"
echo "4. Check the product in Telegram bot"
echo "5. Try broadcast with image"
echo ""
echo "🔍 VERIFY IMAGE URLs:"
echo ""
echo "docker-compose logs -f bot1 | grep -i 'image'"
echo ""
echo "You should see URLs like:"
echo "  http://${VPS_IP}:${PORT}/api/images/..."
echo ""
echo "NOT localhost:5000!"
echo ""
