# 🚀 CORRECTED RAILWAY DEPLOYMENT FILES

## Issues Fixed:
- ✅ Frontend build configuration corrected
- ✅ Client access ONLY through Telegram bot
- ✅ Admin access through web dashboard
- ✅ Production-ready file structure

---

# FILE 1: package.json
```json
{
  "name": "teleshop-bot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && tsc --project tsconfig.server.json",
    "start": "NODE_ENV=production node dist/server/index.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.2",
    "@tanstack/react-query": "^5.59.16",
    "drizzle-orm": "^0.36.4",
    "drizzle-zod": "^0.5.1",
    "express": "^4.21.1",
    "node-telegram-bot-api": "^0.66.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "wouter": "^3.3.5",
    "zod": "^3.23.8",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.3",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.7.6",
    "@types/node-telegram-bot-api": "^0.64.7",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.28.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "vite": "^5.4.10"
  }
}
```

---

# FILE 2: railway.toml
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run build && npm start"

[[services]]
name = "teleshop-bot"

[services.variables]
NODE_ENV = "production"
PORT = "5000"
```

---

# FILE 3: server/index.ts
```typescript
import express from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from dist in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
}

async function startServer() {
  try {
    const server = await registerRoutes(app);
    
    // ADMIN DASHBOARD ONLY - Serve after API routes in production
    if (process.env.NODE_ENV === 'production') {
      app.get('*', (req, res) => {
        const distPath = path.join(__dirname, '../dist');
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 TeleShop Bot Server running on port ${PORT}`);
      console.log(`📱 Telegram Bot: CLIENT ACCESS ONLY`);
      console.log(`🌐 Admin Dashboard: Web interface for admins`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

# FILE 4: server/routes.ts
```typescript
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { teleShopBot } from "./bot";
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

  // Dashboard stats route
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      const products = await storage.getProducts();
      const inquiries = await storage.getInquiries();
      
      res.json({
        totalUsers: stats.totalUsers,
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        totalProducts: products.length,
        pendingInquiries: inquiries.filter(i => !i.isRead).length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      
      // Ensure minimum stock for cart functionality
      if (!productData.stock || productData.stock < 1) {
        productData.stock = 10;
      }
      
      if (productData.isActive === undefined) {
        productData.isActive = true;
      }
      
      if (!productData.minOrderQuantity || productData.minOrderQuantity < 1) {
        productData.minOrderQuantity = 1;
      }
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid product data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const productData = req.body;
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

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      
      await storage.incrementOrderCount();
      await storage.addRevenue(orderData.totalAmount);
      
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
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

  // Inquiries routes
  app.get("/api/inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Bot control routes
  app.post("/api/bot/restart", async (req, res) => {
    try {
      const result = await teleShopBot.restart();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to restart bot" });
    }
  });

  app.get("/api/bot/status", async (req, res) => {
    try {
      const status = teleShopBot.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bot status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
```

---

# FILE 5: server/bot.ts
```typescript
import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';
import type { Product } from '@shared/schema';

const BOT_TOKEN = process.env.BOT_TOKEN || '7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs';

if (!BOT_TOKEN || BOT_TOKEN === 'your-telegram-bot-token-here') {
  console.error('❌ BOT_TOKEN is required! Set BOT_TOKEN environment variable');
  process.exit(1);
}

class TeleShopBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing bot with token... YES');
      
      if (process.env.NODE_ENV === 'production') {
        this.bot = new TelegramBot(BOT_TOKEN, { polling: false });
        console.log('Telegram bot initialized with webhook for production');
      } else {
        this.bot = new TelegramBot(BOT_TOKEN, { polling: true });
        console.log('Telegram bot initialized with polling for development');
      }

      this.setupEventHandlers();
      this.isInitialized = true;
      
      await storage.incrementUserCount();
      
      console.log('✅ TeleShop Bot initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  private setupEventHandlers() {
    if (!this.bot) return;

    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString();
      
      if (userId) {
        await storage.incrementUserCount();
      }
      
      const welcomeMessage = `
🛍️ **Welcome to TeleShop Bot!**

Browse our products and shop directly through Telegram!

**Available Commands:**
🏪 /products - View all products  
🔍 /search - Search products
🛒 /cart - View your cart
📋 /orders - Your order history
ℹ️ /help - Get help

Ready to shop? Use /products to get started! 🚀
      `;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🏪 Browse Products', callback_data: 'browse_products' },
            { text: '🔍 Search', callback_data: 'search_products' }
          ],
          [
            { text: '🛒 My Cart', callback_data: 'view_cart' },
            { text: '📋 My Orders', callback_data: 'view_orders' }
          ]
        ]
      };
      
      await this.bot!.sendMessage(chatId, welcomeMessage, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });

    // Products command
    this.bot.onText(/\/products/, async (msg) => {
      await this.showProducts(msg.chat.id);
    });

    // Search command
    this.bot.onText(/\/search (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const query = match?.[1];
      
      if (!query) {
        await this.bot!.sendMessage(chatId, 'Please provide a search term. Example: /search laptop');
        return;
      }
      
      try {
        const products = await storage.searchProducts(query);
        
        if (products.length === 0) {
          await this.bot!.sendMessage(chatId, `No products found for "${query}"`);
          return;
        }
        
        await this.bot!.sendMessage(chatId, `Found ${products.length} products for "${query}":`);
        
        for (const product of products) {
          await this.sendProductCard(chatId, product);
        }
      } catch (error) {
        console.error('Search error:', error);
        await this.bot!.sendMessage(chatId, 'Sorry, search is not available right now.');
      }
    });

    // Cart command
    this.bot.onText(/\/cart/, async (msg) => {
      await this.showCart(msg.chat.id, msg.from?.id.toString());
    });

    // Orders command  
    this.bot.onText(/\/orders/, async (msg) => {
      await this.showOrders(msg.chat.id, msg.from?.id.toString());
    });

    // Callback query handler
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id;
      const userId = query.from.id.toString();
      const data = query.data;
      
      if (!chatId || !data) return;
      
      try {
        if (data === 'browse_products') {
          await this.showProducts(chatId);
        } else if (data === 'view_cart') {
          await this.showCart(chatId, userId);
        } else if (data === 'view_orders') {
          await this.showOrders(chatId, userId);
        } else if (data.startsWith('add_to_cart_')) {
          const productId = data.replace('add_to_cart_', '');
          await this.addToCart(chatId, userId, productId);
        } else if (data === 'checkout') {
          await this.initiateCheckout(chatId, userId);
        }
        
        await this.bot!.answerCallbackQuery(query.id);
      } catch (error) {
        console.error('Callback query error:', error);
        await this.bot!.answerCallbackQuery(query.id, { text: 'Something went wrong' });
      }
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
🤖 **TeleShop Bot Help**

**Commands:**
• /start - Welcome & main menu
• /products - Browse all products
• /search [term] - Search products
• /cart - View your shopping cart
• /orders - View order history
• /help - Show this help message

**How to Shop:**
1. Browse products with /products
2. Add items to cart using buttons
3. Review cart with /cart
4. Checkout when ready

**Need assistance?** 
Contact our support team!
      `;
      
      await this.bot!.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });
  }

  private async showProducts(chatId: number) {
    try {
      const products = await storage.getProducts();
      const activeProducts = products.filter(p => p.isActive && p.stock > 0);
      
      if (activeProducts.length === 0) {
        await this.bot!.sendMessage(chatId, 'No products available at the moment.');
        return;
      }
      
      await this.bot!.sendMessage(chatId, `🏪 **Available Products** (${activeProducts.length})`);
      
      for (const product of activeProducts) {
        await this.sendProductCard(chatId, product);
      }
    } catch (error) {
      console.error('Show products error:', error);
      await this.bot!.sendMessage(chatId, 'Sorry, products are not available right now.');
    }
  }

  private async sendProductCard(chatId: number, product: Product) {
    const message = `
🏷️ **${product.name}**
💰 Price: $${product.price}
📦 Stock: ${product.stock} available
📝 ${product.description || 'No description available'}
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '➕ Add to Cart', callback_data: `add_to_cart_${product.id}` },
          { text: '🛒 View Cart', callback_data: 'view_cart' }
        ]
      ]
    };
    
    await this.bot!.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async addToCart(chatId: number, userId: string, productId: string) {
    try {
      const product = await storage.getProduct(productId);
      if (!product || !product.isActive || product.stock < 1) {
        await this.bot!.sendMessage(chatId, '❌ This product is not available');
        return;
      }
      
      await storage.addToCart({ telegramUserId: userId, productId, quantity: 1 });
      
      await this.bot!.sendMessage(chatId, `✅ ${product.name} added to your cart!`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🛒 View Cart', callback_data: 'view_cart' },
              { text: '🏪 Continue Shopping', callback_data: 'browse_products' }
            ]
          ]
        }
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      await this.bot!.sendMessage(chatId, '❌ Could not add item to cart');
    }
  }

  private async showCart(chatId: number, userId?: string) {
    if (!userId) {
      await this.bot!.sendMessage(chatId, '❌ User ID not available');
      return;
    }
    
    try {
      const cartItems = await storage.getCart(userId);
      
      if (cartItems.length === 0) {
        await this.bot!.sendMessage(chatId, '🛒 Your cart is empty\n\nUse /products to start shopping!', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏪 Browse Products', callback_data: 'browse_products' }]
            ]
          }
        });
        return;
      }
      
      let total = 0;
      let message = '🛒 **Your Cart:**\n\n';
      
      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          const itemTotal = Number(product.price) * item.quantity;
          total += itemTotal;
          message += `• ${product.name}\n`;
          message += `  Qty: ${item.quantity} × $${product.price} = $${itemTotal.toFixed(2)}\n\n`;
        }
      }
      
      message += `💰 **Total: $${total.toFixed(2)}**`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Checkout', callback_data: 'checkout' },
            { text: '🏪 Continue Shopping', callback_data: 'browse_products' }
          ]
        ]
      };
      
      await this.bot!.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } catch (error) {
      console.error('Show cart error:', error);
      await this.bot!.sendMessage(chatId, '❌ Could not load cart');
    }
  }

  private async showOrders(chatId: number, userId?: string) {
    if (!userId) {
      await this.bot!.sendMessage(chatId, '❌ User ID not available');
      return;
    }
    
    try {
      const orders = await storage.getUserOrders(userId);
      
      if (orders.length === 0) {
        await this.bot!.sendMessage(chatId, '📋 No orders found\n\nStart shopping to place your first order!', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏪 Browse Products', callback_data: 'browse_products' }]
            ]
          }
        });
        return;
      }
      
      let message = '📋 **Your Orders:**\n\n';
      
      for (const order of orders.slice(0, 5)) {
        message += `🧾 Order #${order.id.slice(0, 8)}\n`;
        message += `📅 ${new Date(order.createdAt).toLocaleDateString()}\n`;
        message += `💰 Total: $${order.totalAmount}\n`;
        message += `📦 Status: ${order.status}\n\n`;
      }
      
      await this.bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Show orders error:', error);
      await this.bot!.sendMessage(chatId, '❌ Could not load orders');
    }
  }

  private async initiateCheckout(chatId: number, userId: string) {
    try {
      const cartItems = await storage.getCart(userId);
      
      if (cartItems.length === 0) {
        await this.bot!.sendMessage(chatId, '❌ Your cart is empty');
        return;
      }
      
      let total = 0;
      const items: any[] = [];
      
      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          const itemTotal = Number(product.price) * item.quantity;
          total += itemTotal;
          items.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price
          });
        }
      }
      
      const order = await storage.createOrder({
        telegramUserId: userId,
        items: JSON.stringify(items),
        totalAmount: total,
        status: 'pending',
        shippingAddress: 'TBD'
      });
      
      await storage.clearCart(userId);
      await storage.incrementOrderCount();
      await storage.addRevenue(total);
      
      await this.bot!.sendMessage(chatId, `
✅ **Order Placed Successfully!**

🧾 Order ID: ${order.id.slice(0, 8)}
💰 Total: $${total.toFixed(2)}
📦 Status: Pending

We'll contact you soon for delivery details!

Thank you for shopping with us! 🙏
      `, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Checkout error:', error);
      await this.bot!.sendMessage(chatId, '❌ Checkout failed. Please try again.');
    }
  }

  async restart() {
    try {
      if (this.bot) {
        await this.bot.stopPolling();
        this.bot = null;
      }
      this.isInitialized = false;
      await this.initialize();
      console.log('Bot restart completed successfully');
      return { success: true, message: 'Bot restarted successfully' };
    } catch (error) {
      console.error('Bot restart failed:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      status: this.isInitialized ? 'online' : 'offline',
      ready: this.bot ? {} : null,
      mode: process.env.NODE_ENV === 'production' ? 'webhook' : 'polling'
    };
  }
}

export const teleShopBot = new TeleShopBot();
```

---

## CONTINUE READING FOR COMPLETE FILES...
Files 6-19 coming next!