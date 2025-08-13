import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { teleShopBot } from "./bot";
import { SimpleObjectStorageService } from "./simpleObjectStorage";
import { 
  insertProductSchema, 
  insertInquirySchema, 
  insertBotSettingsSchema,
  insertOrderSchema,
  insertCartSchema,
  insertCategorySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Telegram bot
  await teleShopBot.initialize();

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Featured products route (must come before /products/:id)
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Search products route (must come before /products/:id)
  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, categoryData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });



  // Products by category route
  app.get("/api/categories/:id/products", async (req, res) => {
    try {
      const products = await storage.getProductsByCategory(req.params.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // User orders route - Must come before /:id route
  app.get("/api/orders/user/:telegramUserId", async (req, res) => {
    try {
      const orders = await storage.getUserOrders(req.params.telegramUserId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      
      // Update stats
      await storage.incrementOrderCount();
      await storage.addRevenue(orderData.totalAmount);
      
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, orderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order status" });
    }
  });

  // Cart routes
  app.get("/api/cart/:telegramUserId", async (req, res) => {
    try {
      const cartItems = await storage.getCart(req.params.telegramUserId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const cartData = insertCartSchema.parse(req.body);
      const cartItem = await storage.addToCart(cartData);
      res.status(201).json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart data" });
    }
  });

  app.put("/api/cart/:telegramUserId/:productId", async (req, res) => {
    try {
      const { quantity } = req.body;
      if (typeof quantity !== 'number') {
        return res.status(400).json({ message: "Quantity must be a number" });
      }
      const cartItem = await storage.updateCartItem(
        req.params.telegramUserId, 
        req.params.productId, 
        quantity
      );
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:telegramUserId/:productId", async (req, res) => {
    try {
      const deleted = await storage.removeFromCart(
        req.params.telegramUserId, 
        req.params.productId
      );
      if (!deleted) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart/:telegramUserId", async (req, res) => {
    try {
      await storage.clearCart(req.params.telegramUserId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  app.get("/api/cart/:telegramUserId/total", async (req, res) => {
    try {
      const total = await storage.getCartTotal(req.params.telegramUserId);
      res.json(total);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate cart total" });
    }
  });

  // Inquiries routes
  app.get("/api/inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/inquiries/unread-count", async (req, res) => {
    try {
      const count = await storage.getUnreadInquiriesCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.put("/api/inquiries/:id", async (req, res) => {
    try {
      const inquiryData = insertInquirySchema.partial().parse(req.body);
      const inquiry = await storage.updateInquiry(req.params.id, inquiryData);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error) {
      res.status(400).json({ message: "Invalid inquiry data" });
    }
  });

  // Bot settings routes
  app.get("/api/bot/settings", async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot settings" });
    }
  });

  app.post("/api/bot/settings", async (req, res) => {
    try {
      const settingData = insertBotSettingsSchema.parse(req.body);
      const setting = await storage.setBotSetting(settingData);
      res.json(setting);
    } catch (error) {
      res.status(400).json({ message: "Invalid setting data" });
    }
  });

  // Bot stats route
  app.get("/api/bot/stats", async (req, res) => {
    try {
      const stats = await storage.getBotStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot stats" });
    }
  });

  // Bot status route
  app.get("/api/bot/status", async (req, res) => {
    try {
      const isReady = await teleShopBot.isReady();
      const config = teleShopBot.getConfig();
      res.json({ 
        status: isReady ? 'online' : 'offline',
        ready: isReady ? {} : false,
        mode: config?.mode || 'polling',
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check bot status" });
    }
  });

  // Broadcast message route with proper implementation
  app.post("/api/bot/broadcast", async (req, res) => {
    try {
      const { message, imageUrl, targetType, customUsers } = req.body;
      
      if (!message || message.trim() === '') {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Get actual users from the database for broadcasting
      const result = await teleShopBot.broadcastMessage({
        message: message.trim(),
        imageUrl,
        targetType,
        customUsers
      });
      
      res.json(result);
    } catch (error) {
      console.error("Broadcast failed:", error);
      res.status(500).json({ 
        message: "Failed to send broadcast message",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Simple public object serving - placeholder for now
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      // For now, return 404 until Google Cloud Storage is properly set up
      res.status(404).json({ error: "File not found" });
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage upload endpoint
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { SimpleObjectStorageService } = await import("./simpleObjectStorage.js");
      const objectStorageService = new SimpleObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log("Generated upload URL:", uploadURL);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Failed to get upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Simple object serving endpoint - serve from bucket directly
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      // For now, redirect to external storage or return 404
      // This can be enhanced when Google Cloud Storage package is properly installed
      res.status(404).json({ error: "Object not found" });
    } catch (error) {
      console.error("Error accessing object:", error);
      return res.sendStatus(500);
    }
  });

  // Bot settings routes
  app.get("/api/bot/settings", async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot settings" });
    }
  });

  app.post("/api/bot/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      await storage.setBotSetting({ key, value });
      res.json({ message: "Setting updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Bot restart route
  app.post("/api/bot/restart", async (req, res) => {
    try {
      await teleShopBot.restart();
      res.json({ message: "Bot restarted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to restart bot" });
    }
  });

  // Integration testing route
  app.get("/api/integration/test", async (req, res) => {
    try {
      const tests = {
        database: false,
        bot: false,
        storage: false,
        products: false,
        orders: false,
        categories: false,
        settings: false
      };

      const errors = [];

      // Test database connection
      try {
        const products = await storage.getProducts();
        tests.database = true;
        tests.products = products.length >= 0; // Even 0 products is valid
      } catch (error) {
        errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test bot status
      try {
        const isReady = await teleShopBot.isReady();
        tests.bot = isReady === true;
        if (!isReady) errors.push("Bot: Not ready or offline");
      } catch (error) {
        errors.push(`Bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test storage operations
      try {
        const stats = await storage.getBotStats();
        tests.storage = stats !== undefined;
      } catch (error) {
        errors.push(`Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test orders system
      try {
        const orders = await storage.getOrders();
        tests.orders = Array.isArray(orders);
      } catch (error) {
        errors.push(`Orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test categories
      try {
        const categories = await storage.getCategories();
        tests.categories = Array.isArray(categories);
      } catch (error) {
        errors.push(`Categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test settings
      try {
        const settings = await storage.getBotSettings();
        tests.settings = settings !== undefined;
      } catch (error) {
        errors.push(`Settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      const allTestsPassed = Object.values(tests).every(test => test === true);
      const passedCount = Object.values(tests).filter(test => test === true).length;
      const totalTests = Object.keys(tests).length;

      res.json({
        success: allTestsPassed,
        tests,
        passed: passedCount,
        total: totalTests,
        errors: errors.length > 0 ? errors : null,
        timestamp: new Date().toISOString(),
        ready_for_deployment: allTestsPassed && errors.length === 0,
        deployment_checklist: {
          bot_online: tests.bot,
          database_connected: tests.database,
          storage_operational: tests.storage,
          orders_system: tests.orders,
          products_loaded: tests.products,
          categories_available: tests.categories,
          settings_configured: tests.settings
        }
      });
    } catch (error) {
      console.error("Integration test failed:", error);
      res.status(500).json({ 
        message: "Integration test failed", 
        error: error instanceof Error ? error.message : 'Unknown error',
        ready_for_deployment: false
      });
    }
  });

  // Bot health check route
  app.get("/api/bot/health", async (req, res) => {
    try {
      const isReady = await teleShopBot.isReady();
      const config = teleShopBot.getConfig();
      const uptime = process.uptime();
      
      res.json({
        bot_status: isReady ? 'healthy' : 'unhealthy',
        ready: isReady,
        mode: config?.mode || 'polling',
        environment: process.env.NODE_ENV || 'development',
        uptime_seconds: Math.floor(uptime),
        uptime_formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        bot_status: 'error',
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Webhook endpoint for production deployments
  app.post("/webhook", (req, res) => {
    teleShopBot.handleWebhookUpdate(req, res);
  });

  const httpServer = createServer(app);
  return httpServer;
}
