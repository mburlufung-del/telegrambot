import express from 'express';
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

// Create HTTP server and start it
import { createServer } from 'http';
const server = createServer(app);

server.listen({
  port,
  host: "0.0.0.0", 
  reusePort: true,
}, () => {
  log(`🚀 Server started on port ${port}`);
  log(`✅ Health check available at /health`);
  log(`🔍 Bot initialization starting in background...`);
  
  // Initialize bot after server is listening
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
    const settings = await storage.getBotSettings();
    const tokenSetting = settings.find(s => s.key === 'bot_token');
    
    if (!tokenSetting && process.env.TELEGRAM_BOT_TOKEN) {
      await storage.setBotSetting({
        key: 'bot_token',
        value: process.env.TELEGRAM_BOT_TOKEN
      });
      log('✅ Bot token auto-configured from environment');
    }
    
    // Register API routes first (before static files)
    const { registerApiRoutes } = await import("./routes");
    await registerApiRoutes(app);
    log('✅ API routes registered');
    
    // Add global error handler for debugging
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('[ERROR HANDLER] Error occurred:', err);
      console.error('[ERROR HANDLER] Stack:', err.stack);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error', 
          message: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    });
    
    // Setup static file serving for built React app
    const path = await import('path');
    const distPath = path.resolve(process.cwd(), 'dist', 'public');
    app.use(express.static(distPath));
    
    // Fallback to index.html for client-side routing
    app.use('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    log('🖥️  Admin dashboard (React v2) ready');

    // Initialize the bot (this can fail or timeout)
    if (tokenSetting?.value || process.env.TELEGRAM_BOT_TOKEN) {
      await teleShopBot.initialize();
      log('🚀 Telegram bot initialized and running');
    } else {
      log('⚠️  No bot token found, skipping bot initialization');
      throw new Error('No bot token configured');
    }
    
  } catch (error) {
    log(`❌ Bot initialization step failed: ${error}`);
    throw error; // Re-throw to be caught by timeout wrapper
  }
}