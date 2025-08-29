import express from 'express';
import { teleShopBot } from './bot';
import { storage } from './storage';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    bot_status: 'online'
  });
});

function log(message: string, source: string = 'express') {
  const timestamp = new Date();
  const formattedTime = timestamp.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Start server and initialize bot
(async () => {
  await autoInitializeBot();
  
  app.listen({
    port,
    host: "0.0.0.0", 
    reusePort: true,
  }, () => {
    log(`🤖 TeleShop Bot Server (Bot + Admin Dashboard) running on port ${port}`);
    log(`📱 Telegram bot will be initialized automatically`);
    log(`🔍 Health check: http://localhost:${port}/health`);
  });
})();

async function autoInitializeBot() {
  try {
    const settings = await storage.getBotSettings();
    const tokenSetting = settings.find(s => s.key === 'bot_token');
    
    if (!tokenSetting && process.env.TELEGRAM_BOT_TOKEN) {
      await storage.setBotSetting({
        key: 'bot_token',
        value: process.env.TELEGRAM_BOT_TOKEN
      });
      log('✅ Bot token auto-configured from environment');
    }
    
    // Setup dashboard
    const { setupSimpleDashboard } = await import("./simple-dashboard");
    setupSimpleDashboard(app);
    log('🖥️  Admin dashboard interface ready');

    // Register all routes for admin dashboard
    const { registerApiRoutes } = await import("./routes");
    await registerApiRoutes(app);
    log('✅ Admin dashboard API routes registered');

    // Initialize the bot
    await teleShopBot.initialize();
    log('🚀 Telegram bot initialized and running with admin dashboard');
    
  } catch (error) {
    log(`❌ Bot initialization failed: ${error}`);
  }
}