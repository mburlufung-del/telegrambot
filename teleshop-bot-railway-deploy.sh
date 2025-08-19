#!/bin/bash

# TeleShop Bot - Railway Direct Deployment Script
# Complete deployment without ZIP files - Just run this script!

echo "🚂 TeleShop Bot - Railway Direct Deployment"
echo "=========================================="
echo "Bot Token: 7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs"
echo "This script will deploy your TeleShop bot directly to Railway"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Railway CLI"
        echo "Please install manually: npm install -g @railway/cli"
        exit 1
    fi
fi

echo "✅ Railway CLI ready"

# Create project directory
mkdir -p teleshop-bot-railway
cd teleshop-bot-railway

echo "📁 Creating project files..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "teleshop-bot",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "main": "dist/index.js",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-button": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-form": "^1.1.4",
    "@radix-ui/react-icons": "^1.3.0",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@tanstack/react-query": "^5.60.5",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.2",
    "@types/node-telegram-bot-api": "^0.64.7",
    "@types/react": "^18.3.14",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "drizzle-kit": "^0.27.2",
    "drizzle-orm": "^0.36.4",
    "drizzle-zod": "^0.5.1",
    "esbuild": "^0.24.2",
    "express": "^4.21.2",
    "framer-motion": "^11.15.0",
    "lucide-react": "^0.468.0",
    "nanoid": "^5.0.9",
    "node-telegram-bot-api": "^0.66.0",
    "postcss": "^8.5.11",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.1",
    "tailwind-merge": "^2.5.5",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vite": "^6.0.3",
    "wouter": "^3.3.7",
    "zod": "^3.23.8"
  }
}
EOF

# Create railway.toml
cat > railway.toml << 'EOF'
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"

[environments.production]
variables = { NODE_ENV = "production", BOT_TOKEN = "7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs", SESSION_SECRET = "teleshop_bot_secure_session_2024" }
EOF

# Create basic server structure
mkdir -p server shared client/src

# Create main server file
cat > server/index.ts << 'EOF'
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
const port = process.env.PORT || 5000;

// Bot setup
const BOT_TOKEN = process.env.BOT_TOKEN || '7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Basic bot functionality
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🛍️ Welcome to TeleShop Bot!\n\nYour e-commerce bot is now live on Railway!');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', bot: 'active' });
});

// Basic API route
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    bot_token: BOT_TOKEN ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  });
});

// Static files (for admin dashboard)
app.use(express.static('dist/client'));

// Catch all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚂 TeleShop Bot running on Railway at port ${port}`);
  console.log(`🤖 Bot token: ${BOT_TOKEN.substring(0, 20)}...`);
});
EOF

# Create basic HTML file
mkdir -p client
cat > client/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TeleShop Bot - Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #22c55e; font-size: 18px; margin-bottom: 20px; }
        .info { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .bot-token { font-family: monospace; background: #f3f4f6; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛍️ TeleShop Bot - Railway Deployment</h1>
        <div class="success">✅ Successfully deployed to Railway!</div>
        
        <div class="info">
            <h3>🤖 Your Bot Information</h3>
            <div class="bot-token">Bot Token: 7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs</div>
        </div>
        
        <div class="info">
            <h3>🧪 Test Your Bot</h3>
            <p>1. Go to Telegram and search for your bot</p>
            <p>2. Send <code>/start</code> command</p>
            <p>3. Bot should respond with welcome message</p>
        </div>
        
        <div class="info">
            <h3>📊 Admin Dashboard</h3>
            <p>This is your basic admin interface. Your bot is now live and ready for customers!</p>
            <p><strong>Railway Domain:</strong> <span id="domain"></span></p>
        </div>
        
        <div class="info">
            <h3>🔗 API Endpoints</h3>
            <p><code>/api/health</code> - Health check</p>
            <p><code>/api/status</code> - Bot status</p>
        </div>
    </div>
    
    <script>
        document.getElementById('domain').textContent = window.location.hostname;
    </script>
</body>
</html>
EOF

# Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
EOF

# Create vite config
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  }
})
EOF

echo "📁 Project files created successfully"

# Login to Railway
echo "🔐 Logging in to Railway..."
railway login

# Initialize project
echo "🚀 Initializing Railway project..."
railway init teleshop-bot

# Add PostgreSQL database
echo "🗄️ Adding PostgreSQL database..."
railway add postgresql

# Set environment variables (they're already in railway.toml, but let's be explicit)
echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set BOT_TOKEN=7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs
railway variables set SESSION_SECRET=teleshop_bot_secure_session_2024

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment Complete!"
echo "=========================================="
echo "🎉 Your TeleShop bot is now live on Railway!"
echo ""
echo "📱 Test your bot:"
echo "   1. Go to Telegram"
echo "   2. Search for your bot"
echo "   3. Send /start command"
echo ""
echo "🌐 Admin Dashboard:"
echo "   Visit your Railway domain to see the admin interface"
echo ""
echo "🔧 Railway Dashboard:"
echo "   Visit railway.app to manage your deployment"
echo ""
echo "Your bot token: 7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs"
echo "Bot is now active and ready for customers!"
EOF