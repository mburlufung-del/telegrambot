import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { seedDatabase } from "./seed";

const app = express();

// Add proper MIME type handling middleware
app.use((req, res, next) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.mjs')) {
    res.type('application/javascript');
  } else if (req.url.endsWith('.css')) {
    res.type('text/css');
  } else if (req.url.endsWith('.html')) {
    res.type('text/html');
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Auto-initialize bot with token and seed database after routes are set up
  setTimeout(async () => {
    // Check if database is empty and seed if needed
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
    
    await autoInitializeBot();
    
    // Set up periodic bot health check
    setInterval(async () => {
      try {
        const response = await fetch('http://localhost:5000/api/bot/status');
        const status = await response.json();
        if (!status.ready) {
          log('Bot offline, restarting...');
          await fetch('http://localhost:5000/api/bot/restart', { method: 'POST' });
        }
      } catch (error) {
        // Ignore check errors
      }
    }, 60000); // Check every minute
  }, 2000);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // serve the React admin dashboard with workaround for Vite path issues
  const path = require('path');
  
  // Try to serve built files first, then development files
  app.use(express.static(path.resolve(process.cwd(), 'dist', 'public')));
  app.use('/assets', express.static(path.resolve(process.cwd(), 'client', 'src')));
  
  // For all non-API routes, serve the React app
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    
    // Try built version first, fallback to development
    const builtIndex = path.resolve(process.cwd(), 'dist', 'public', 'index.html');
    const devIndex = path.resolve(process.cwd(), 'client', 'index.html');
    
    const fs = require('fs');
    if (fs.existsSync(builtIndex)) {
      res.sendFile(builtIndex);
    } else {
      res.sendFile(devIndex);
    }
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

// Auto-initialize bot function
async function autoInitializeBot() {
  try {
    // Check if bot token exists in storage
    const settings = await storage.getBotSettings();
    const tokenSetting = settings.find(s => s.key === 'bot_token');
    
    if (!tokenSetting) {
      // Set the bot token from environment variable
      if (process.env.TELEGRAM_BOT_TOKEN) {
        await storage.setBotSetting({
          key: 'bot_token',
          value: process.env.TELEGRAM_BOT_TOKEN
        });
        log('Bot token auto-configured from environment');
      } else {
        log('TELEGRAM_BOT_TOKEN environment variable not found');
      }
    }
    
    // Initialize bot by calling the bot restart endpoint
    setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:5000/api/bot/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          log('Bot auto-initialized and running');
        }
      } catch (error) {
        log('Bot restart API not ready yet');
      }
    }, 1000);
  } catch (error) {
    log(`Bot auto-initialization failed: ${error}`);
  }
}
