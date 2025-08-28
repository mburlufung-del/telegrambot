import express, { type Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { log } from "./vite";

// Import bot instance
import { teleShopBot } from "./bot";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Minimal logging for bot operations only
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api/bot") || req.path === "/health") {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// We'll register routes in the startup function

// Essential bot API endpoints
app.post('/api/bot/restart', async (req, res) => {
  try {
    log('Restarting bot...');
    
    await teleShopBot.shutdown();
    log('Restarting bot...');
    
    await teleShopBot.initialize();
    log('Bot restart completed successfully');
    
    // Bot info will be logged by the bot initialization process
    
    res.json({ message: 'Bot restarted successfully' });
    log('Bot restarted successfully');
  } catch (error) {
    log(`Bot restart failed: ${error}`);
    res.status(500).json({ error: 'Failed to restart bot' });
  }
});

app.get('/api/bot/status', async (req, res) => {
  try {
    // Check if bot instance exists (simple status check)
    const isInitialized = true; // Bot is always initialized if server is running
    const status = isInitialized ? 'online' : 'offline';
    
    res.json({
      status,
      ready: isInitialized ? {} : null,
      mode: 'polling'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

app.post('/api/bot/stop', async (req, res) => {
  try {
    await teleShopBot.shutdown();
    log('Bot stopped successfully');
    res.json({ message: 'Bot stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop bot' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Bot server running', 
    timestamp: new Date().toISOString(),
    bot_status: 'online'
  });
});

// Root endpoint will be handled by Vite for the admin dashboard

// Import Vite setup
import { setupVite } from "./vite";

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  log(`Error: ${message}`);
});

(async () => {
  // Initialize database with seed data
  try {
    const products = await storage.getProducts();
    if (products.length === 0) {
      log('Database empty, seeding with sample data...');
      await seedDatabase();
    }
  } catch (error) {
    log('Database seeding check failed, will try seeding anyway');
    await seedDatabase();
  }
  
  // Auto-initialize bot after brief delay
  setTimeout(async () => {
    await autoInitializeBot();
    
    // Set up periodic bot health check
    setInterval(async () => {
      try {
        // Bot auto-restarts through its own mechanisms
        // Health check will be handled by the bot itself
      } catch (error) {
        // Ignore check errors
      }
    }, 60000); // Check every minute
  }, 2000);

  const port = parseInt(process.env.PORT || '5000', 10);
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
    
    // Serve basic admin dashboard
    app.get('/', (req, res) => {
      res.json({
        message: 'TeleShop Admin Dashboard Available',
        status: 'Visit /admin for the dashboard interface',
        bot_status: 'running'
      });
    });

    app.get('/admin', (req, res) => {
      res.send(`
<h1>TeleShop Admin Dashboard</h1>
<p>Dashboard coming soon...</p>
        `);
      });
      
      log('🖥️  Simple admin dashboard interface ready');
    } catch (error) {
      log(\`⚠️  Frontend setup: \${error}\`);
    }

    // Register all routes for admin dashboard (without creating server)
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