import express from 'express';
import path from 'path';
import { teleShopBot } from './bot';
import { storage } from './storage';

const app = express();
const port = process.env.PORT || 5000;

// Bot status tracking
let botStatus = 'initializing';
let botInitError: string | null = null;

// CRITICAL: Health check endpoint MUST be first for deployment health checks
// This endpoint responds immediately without any async operations
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    bot_status: botStatus,
    bot_error: botInitError
  });
});

// Root path health check (for deployment systems that check /)
app.get('/', (req, res, next) => {
  // Only respond as health check if it's not a browser request
  const accept = req.headers.accept || '';
  if (!accept.includes('text/html')) {
    return res.status(200).json({
      status: 'healthy',
      service: 'TeleShop Bot',
      timestamp: new Date().toISOString()
    });
  }
  // For browser requests, continue to static file serving
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    
    // Serve static files (CSS, JS, images, etc.)
    app.use(express.static(distPath));
    
    // SPA fallback to index.html for client-side routing
    // Only for GET requests that accept HTML (not API calls or health checks)
    app.get('*', (req, res, next) => {
      // Skip if it's an API route
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      // Only serve HTML to browser requests
      const accept = req.headers.accept || '';
      if (accept.includes('text/html')) {
        res.sendFile(path.resolve(distPath, 'index.html'));
      } else {
        next();
      }
    });
    
    log('✅ Static file serving configured');
  } catch (error) {
    log(`❌ Failed to setup static files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Create HTTP server
import { createServer } from 'http';
const server = createServer(app);

// Setup all routes and static files BEFORE starting the server
// This ensures immediate availability for health checks
async function setupServer() {
  log('🔧 Setting up API routes...');
  await setupRoutes();
  
  log('🔧 Setting up static file serving...');
  setupStaticFiles();
  
  // Start the server after everything is ready
  server.listen({
    port,
    host: "0.0.0.0", 
    reusePort: true,
  }, () => {
    log(`🚀 Server started on port ${port}`);
    log(`✅ Health check available at / and /health`);
    log(`🖥️  Admin dashboard ready`);
    
    // Initialize bot in background (can fail without affecting dashboard)
    log(`🔍 Bot initialization starting in background...`);
    initializeBotWithTimeout(server);
  });
}

// Start the server setup
setupServer().catch((error) => {
  log(`❌ Failed to setup server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

// Initialize bot with timeout and error handling
async function initializeBotWithTimeout(server: any) {
  const timeout = 10000; // 10 second timeout (reduced from 30s)
  
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