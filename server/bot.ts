import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';

interface BotConfig {
  token: string;
  useWebhook?: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  port?: number;
}

class TeleShopBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;
  private config: BotConfig | null = null;

  async initialize(customConfig?: Partial<BotConfig>) {
    if (this.isInitialized) return;

    // Get bot token from storage first, fallback to environment variable
    const storedToken = await storage.getBotSetting('bot_token');
    const botToken = customConfig?.token || storedToken?.value || process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.warn('TELEGRAM_BOT_TOKEN not provided. Bot functionality will be disabled.');
      return;
    }

    // Configure bot based on environment
    this.config = {
      token: botToken,
      useWebhook: process.env.NODE_ENV === 'production' && !!process.env.WEBHOOK_URL,
      webhookUrl: process.env.WEBHOOK_URL,
      webhookSecret: process.env.WEBHOOK_SECRET,
      port: parseInt(process.env.PORT || '5000', 10),
      ...customConfig
    };

    try {
      if (this.config.useWebhook && this.config.webhookUrl) {
        // Production: Use webhook
        this.bot = new TelegramBot(this.config.token, { webHook: false });
        await this.setupWebhook();
        console.log('Telegram bot initialized with webhook for production');
      } else {
        // Development: Use polling
        this.bot = new TelegramBot(this.config.token, { 
          polling: {
            interval: 1000,
            autoStart: true,
            params: {
              timeout: 10
            }
          }
        });
        console.log('Telegram bot initialized with polling for development');
      }
      
      this.setupCommands();
      this.isInitialized = true;
      console.log('Telegram bot setup completed successfully');
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error);
      this.isInitialized = false;
    }
  }

  private async setupWebhook() {
    if (!this.bot || !this.config?.webhookUrl) return;

    try {
      await this.bot.setWebHook(this.config.webhookUrl, {
        secret_token: this.config.webhookSecret
      });
      console.log(`Webhook set to: ${this.config.webhookUrl}`);
    } catch (error) {
      console.error('Failed to set webhook:', error);
    }
  }

  async restart() {
    if (this.bot) {
      try {
        await this.bot.stopPolling();
        if (this.config?.useWebhook) {
          await this.bot.deleteWebHook();
        }
      } catch (error) {
        console.error('Error stopping bot:', error);
      }
    }
    
    this.bot = null;
    this.isInitialized = false;
    this.config = null;
    
    // Reinitialize with updated settings
    await this.initialize();
  }

  private setupCommands() {
    if (!this.bot) return;

    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || '';
      
      await storage.incrementUserCount();
      await storage.incrementMessageCount();

      const welcomeMessage = await storage.getBotSetting('welcome_message');
      const message = welcomeMessage?.value || 'Welcome to our store! Type /catalog to see our products or /help for assistance.';
      
      this.bot?.sendMessage(chatId, message);
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      await storage.incrementMessageCount();

      const helpMessage = await storage.getBotSetting('help_message');
      const message = helpMessage?.value || 'Available commands:\n/start - Start conversation\n/catalog - View products\n/help - Show this message';
      
      this.bot?.sendMessage(chatId, message);
    });

    // Catalog command
    this.bot.onText(/\/catalog/, async (msg) => {
      const chatId = msg.chat.id;
      
      await storage.incrementMessageCount();

      const products = await storage.getProducts();
      const activeProducts = products.filter(p => p.isActive);

      if (activeProducts.length === 0) {
        this.bot?.sendMessage(chatId, 'Sorry, no products are currently available.');
        return;
      }

      let catalogMessage = '🛍️ *Our Product Catalog:*\n\n';
      
      activeProducts.forEach((product, index) => {
        const stockStatus = product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock';
        catalogMessage += `${index + 1}. *${product.name}*\n`;
        catalogMessage += `   ${product.description}\n`;
        catalogMessage += `   💰 Price: $${product.price}\n`;
        catalogMessage += `   📦 Status: ${stockStatus}\n\n`;
      });

      catalogMessage += 'Reply with the product number for more details or to inquire about purchasing.';

      this.bot?.sendMessage(chatId, catalogMessage, { parse_mode: 'Markdown' });
    });

    // Handle product inquiries (numeric messages)
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const messageText = msg.text || '';
      const userId = msg.from?.id.toString() || '';
      const userName = msg.from?.first_name || 'Customer';

      await storage.incrementMessageCount();

      // Skip if it's a command
      if (messageText.startsWith('/')) return;

      // Check if it's a product number
      const productIndex = parseInt(messageText) - 1;
      const products = await storage.getProducts();
      const activeProducts = products.filter(p => p.isActive);

      if (!isNaN(productIndex) && productIndex >= 0 && productIndex < activeProducts.length) {
        const product = activeProducts[productIndex];
        
        let productMessage = `📱 *${product.name}*\n\n`;
        productMessage += `${product.description}\n\n`;
        productMessage += `💰 *Price:* $${product.price}\n`;
        productMessage += `📦 *Stock:* ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}\n\n`;
        
        if (product.stock > 0) {
          productMessage += 'To place an order or ask questions, please reply with your contact information (phone number or email) and we\'ll get back to you soon!';
        } else {
          productMessage += 'This item is currently out of stock. Please check back later or contact us for availability updates.';
        }

        this.bot?.sendMessage(chatId, productMessage, { parse_mode: 'Markdown' });
        return;
      }

      // Handle general inquiries and contact information
      if (messageText.includes('@') || messageText.includes('+') || messageText.length > 10) {
        // This looks like contact information or a detailed inquiry
        await storage.createInquiry({
          telegramUserId: userId,
          customerName: userName,
          message: messageText,
          contactInfo: messageText.includes('@') || messageText.includes('+') ? messageText : undefined,
          isRead: false,
        });

        const responseMessage = 'Thank you for your inquiry! We\'ve received your message and will get back to you as soon as possible. Our team typically responds within 24 hours.';
        this.bot?.sendMessage(chatId, responseMessage);
        return;
      }

      // Handle other general messages
      await storage.createInquiry({
        telegramUserId: userId,
        customerName: userName,
        message: messageText,
        isRead: false,
      });

      const defaultResponse = 'Thank you for your message! For product information, type /catalog. For help, type /help. If you need to place an order, please include your contact information.';
      this.bot?.sendMessage(chatId, defaultResponse);
    });
  }

  async sendMessage(chatId: string, message: string) {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }
    return this.bot.sendMessage(chatId, message);
  }

  isReady(): boolean {
    return this.isInitialized && this.bot !== null;
  }

  getConfig() {
    return this.config;
  }

  // Webhook handler for production deployment
  handleWebhookUpdate(req: any, res: any) {
    if (!this.bot || !this.config?.useWebhook) {
      return res.status(400).send('Webhook not configured');
    }

    try {
      // Verify webhook secret if configured
      if (this.config.webhookSecret) {
        const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
        if (receivedSecret !== this.config.webhookSecret) {
          return res.status(401).send('Invalid secret token');
        }
      }

      this.bot.processUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Webhook processing failed');
    }
  }

  // Graceful shutdown
  async shutdown() {
    if (this.bot) {
      try {
        if (this.config?.useWebhook) {
          await this.bot.deleteWebHook();
        } else {
          await this.bot.stopPolling();
        }
        console.log('Bot shutdown completed');
      } catch (error) {
        console.error('Error during bot shutdown:', error);
      }
    }
  }
}

export const teleShopBot = new TeleShopBot();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await teleShopBot.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await teleShopBot.shutdown();
  process.exit(0);
});
