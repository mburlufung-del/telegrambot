import express from 'express';
import path from 'path';
import { teleShopBot } from './bot';
import { storage } from './storage';

const app = express();
const port = process.env.PORT || 5000;

// Bot status tracking
let botStatus = 'initializing';
let botInitError: string | null = null;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check - immediately available
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    bot_status: botStatus,
    bot_error: botInitError
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

// Register API routes (always available, even if bot fails)
async function setupRoutes() {
  try {
    const { registerApiRoutes } = await import("./routes");
    await registerApiRoutes(app);
    log('✅ API routes registered');
  } catch (error) {
    log(`❌ Failed to register API routes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Setup static file serving (always available)
function setupStaticFiles() {
  try {
    const distPath = path.resolve(process.cwd(), 'dist', 'public');
    app.use(express.static(distPath));
    
    // Fallback to index.html for client-side routing (must be last)
    app.use('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    log('🖥️  Admin dashboard ready');
  } catch (error) {
    log(`❌ Failed to setup static files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Create HTTP server and start it
import { createServer } from 'http';
const server = createServer(app);

server.listen({
  port,
  host: "0.0.0.0", 
  reusePort: true,
}, async () => {
  log(`🚀 Server started on port ${port}`);
  log(`✅ Health check available at /health`);
  
  // Setup routes and static files first (so dashboard is always accessible)
  await setupRoutes();
  setupStaticFiles();
  
  // Initialize bot in background (can fail without affecting dashboard)
  log(`🔍 Bot initialization starting in background...`);
  initializeBotWithTimeout(server);
});

// Initialize bot with timeout and error handling
async function initializeBotWithTimeout(server: any) {
  const timeout = 30000; // 30 second timeout
  
  try {
    botStatus = 'initializing';
    botInitError = null;
    
    // Race between initialization and timeout
    await Promise.race([
      autoInitializeBot(server),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Bot initialization timeout')), timeout)
      )
    ]);
    
    botStatus = 'online';
    log('✅ Bot initialization completed successfully');
    
  } catch (error) {
    botStatus = 'error';
    botInitError = error instanceof Error ? error.message : String(error);
    log(`❌ Bot initialization failed: ${botInitError}`);
    
    // Continue running server even if bot fails
    log('🔄 Server continues running with admin dashboard only');
  }
}

async function autoInitializeBot(server: any) {
  try {
    // Check for bot token in database or environment
    const settings = await storage.getBotSettings();
    const tokenSetting = settings.find(s => s.key === 'bot_token');
    
    // Auto-configure token from environment if not in database
    if (!tokenSetting && process.env.TELEGRAM_BOT_TOKEN) {
      await storage.setBotSetting({
        key: 'bot_token',
        value: process.env.TELEGRAM_BOT_TOKEN
      });
      log('✅ Bot token auto-configured from environment');
    }

    // Initialize the bot
    if (tokenSetting?.value || process.env.TELEGRAM_BOT_TOKEN) {
      await teleShopBot.initialize();
      log('🚀 Telegram bot initialized and running');
    } else {
      log('⚠️  No bot token found, skipping bot initialization');
      throw new Error('No bot token configured');
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    log(`❌ Bot initialization step failed: ${errorMsg}`);
    console.error('Full error:', error);
    throw error; // Re-throw to be caught by timeout wrapper
  }
}