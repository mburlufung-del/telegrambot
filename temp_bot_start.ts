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
  private userMessages: Map<number, number[]> = new Map(); // Track user messages for auto-vanish

  async initialize(customConfig?: Partial<BotConfig>) {
    if (this.isInitialized) return;

    // Get bot token from storage first, fallback to hardcoded token
    const hardcodedToken = '7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs';
    let storedToken;
    try {
      storedToken = await storage.getBotSetting('bot_token');
    } catch (error) {
      console.log('Error getting stored token:', error);
    }
    const botToken = customConfig?.token || storedToken?.value || hardcodedToken;
    console.log('Bot token found:', botToken ? 'YES' : 'NO');
    console.log('Initializing bot with token...');
    
    if (!botToken) {
      console.log('No bot token available');
      return;
    }
    
    // Ensure token is saved for future use
    if (!storedToken?.value) {
      try {
        await storage.setBotSetting({
          key: 'bot_token',
          value: hardcodedToken
        });
        console.log('Bot token saved to storage');
      } catch (error) {
        console.log('Failed to save bot token:', error);
      }
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
      this.setupAdditionalCallbacks();
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

  // Auto-vanish helper method
  private async clearPreviousMessages(chatId: number) {
    const messages = this.userMessages.get(chatId) || [];
    for (const messageId of messages) {
      try {
        await this.bot?.deleteMessage(chatId, messageId);
      } catch (error) {
        // Ignore errors - message might already be deleted
      }
    }
    this.userMessages.set(chatId, []);
  }

  // Track sent messages for auto-vanish
  private async sendAutoVanishMessage(chatId: number, text: string, options?: any) {
    if (!this.bot) return;
    
    // Clear previous messages first
    await this.clearPreviousMessages(chatId);
    
    try {
      const sentMessage = await this.bot.sendMessage(chatId, text, options);
      const messages = this.userMessages.get(chatId) || [];
      messages.push(sentMessage.message_id);
      this.userMessages.set(chatId, messages);
      return sentMessage;
    } catch (error) {
      console.error('Error sending auto-vanish message:', error);
    }
  }

  private setupCommands() {
    if (!this.bot) return;

    // Handle initial message to show welcome menu only once
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || '';
      const text = msg.text || '';
      
      // Skip if it's a callback query response or other commands
      if (text.startsWith('/callback_')) return;
      
      await storage.incrementMessageCount();
      
      // Only show main menu for initial messages or explicit menu requests
      if (text === '/start' || text.toLowerCase() === 'menu' || text.toLowerCase() === 'main menu') {
        await this.sendMainMenu(chatId);
      } else {
        // For other messages, just acknowledge and stay in current context
        const ackMessage = '👋 Hello! Use the buttons below to navigate.';
        await this.sendAutoVanishMessage(chatId, ackMessage);
      }
    });

    // Handle callback queries for the command buttons
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id;
      const userId = query.from.id.toString();
      const data = query.data;
      
      if (!chatId || !data) return;
      
      await storage.incrementMessageCount();
      
      // Answer the callback query to remove loading state
      await this.bot?.answerCallbackQuery(query.id);
      
      switch (data) {
        case 'listings':
          await this.handleListingsCommand(chatId, userId);
          break;
        case 'carts':
          await this.handleCartsCommand(chatId, userId);
          break;
        case 'orders':
          await this.handleOrdersCommand(chatId, userId);
          break;
        case 'wishlist':
          await this.handleWishlistCommand(chatId, userId);
          break;
        case 'rating':
          await this.handleRatingCommand(chatId, userId);
          break;
        case 'operator':
          await this.handleOperatorCommand(chatId, userId);
          break;
        default:
          // Unknown callback, show main menu again
          await this.sendMainMenu(chatId);
      }
    });
  }

  // Main menu method
  private async sendMainMenu(chatId: number) {
    const welcomeMessage = '🛍️ Welcome to TeleShop!\n\nChoose an option below:';
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '📋 Listings', callback_data: 'listings' },
          { text: '🛒 Carts', callback_data: 'carts' },
          { text: '📦 Orders', callback_data: 'orders' }
        ],
        [
          { text: '❤️ Wishlist', callback_data: 'wishlist' },
          { text: '⭐ Rating', callback_data: 'rating' },
          { text: '👤 Operator', callback_data: 'operator' }
        ]
      ]
    };

    await this.sendAutoVanishMessage(chatId, welcomeMessage, {
      reply_markup: keyboard
    });
  }

  // Command handlers for each button
  private async handleListingsCommand(chatId: number, userId: string) {
    const categories = await storage.getCategories();

    if (categories.length === 0) {
      const message = '📋 No categories available at the moment.\n\nCome back later for new listings!';
      const backButton = {
        inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
      };
      
      await this.sendAutoVanishMessage(chatId, message, { reply_markup: backButton });
      return;
    }

    let categoriesMessage = '📋 *Choose Product Category:*\n\n';
    
    const categoryButtons: Array<Array<{text: string, callback_data: string}>> = [];
    categories.forEach((category, index) => {
      categoriesMessage += `${index + 1}. *${category.name}*\n`;
      if (category.description) {
        categoriesMessage += `   ${category.description}\n`;
      }
      categoriesMessage += '\n';
      
      // Create buttons in rows of 2
      if (index % 2 === 0) {
        categoryButtons.push([]);
      }
      categoryButtons[categoryButtons.length - 1].push({
        text: `${index + 1}. ${category.name}`,
        callback_data: `category_${category.id}`
      });
    });

    // Add navigation buttons
    categoryButtons.push([
      { text: '🔍 Search All Products', callback_data: 'search_all_products' }
    ]);
    categoryButtons.push([
      { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
    ]);

    const keyboard = { inline_keyboard: categoryButtons };

    await this.sendAutoVanishMessage(chatId, categoriesMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleOrdersCommand(chatId: number, userId: string) {
    const orders = await storage.getOrders();
    const userOrders = orders.filter(order => order.telegramUserId === userId);

    if (userOrders.length === 0) {
      const message = '📦 No orders found.\n\nPlace your first order by adding items to cart and checking out!';
      const keyboard = {
        inline_keyboard: [
          [
            { text: '📋 Browse Listings', callback_data: 'listings' }
          ],
          [
            { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
          ]
        ]
      };
      
      await this.sendAutoVanishMessage(chatId, message, { reply_markup: keyboard });
      return;
    }

    let ordersMessage = '📦 *Your Orders:*\n\n';
    
    userOrders.slice(0, 5).forEach((order, index) => {
      const orderDate = new Date(order.createdAt).toLocaleDateString();
      const statusEmoji = order.status === 'pending' ? '⏳' : 
                         order.status === 'confirmed' ? '✅' : 
                         order.status === 'shipped' ? '🚚' : 
                         order.status === 'delivered' ? '📦' : '❌';
      
      ordersMessage += `${index + 1}. *Order #${order.id.substring(0, 8)}*\n`;
      ordersMessage += `   ${statusEmoji} ${order.status.toUpperCase()}\n`;
      ordersMessage += `   💰 Total: $${order.totalAmount}\n`;
      ordersMessage += `   📅 ${orderDate}\n\n`;
    });

    if (userOrders.length > 5) {
      ordersMessage += `... and ${userOrders.length - 5} more orders.`;
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔄 Refresh Orders', callback_data: 'orders' }
        ],
        [
          { text: '📋 Continue Shopping', callback_data: 'listings' }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await this.sendAutoVanishMessage(chatId, ordersMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleCartsCommand(chatId: number, userId: string) {
    const cartItems = await storage.getCart(userId);

    if (cartItems.length === 0) {
      const message = '🛒 Your cart is empty.\n\nBrowse our listings to add items!';
      const keyboard = {
        inline_keyboard: [
          [
            { text: '📋 View Listings', callback_data: 'listings' }
          ],
          [
            { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
          ]
        ]
      };
      
      await this.sendAutoVanishMessage(chatId, message, { reply_markup: keyboard });
      return;
    }

    let cartMessage = '🛒 *Your Shopping Cart:*\n\n';
    let totalAmount = 0;

    for (const item of cartItems) {
      const product = await storage.getProduct(item.productId);
      if (product) {
        const itemTotal = parseFloat(product.price) * item.quantity;
        totalAmount += itemTotal;
        
        cartMessage += `• *${product.name}*\n`;
        cartMessage += `  Qty: ${item.quantity} × $${product.price} = $${itemTotal.toFixed(2)}\n\n`;
      }
    }

    cartMessage += `💰 *Total: $${totalAmount.toFixed(2)}*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Checkout', callback_data: 'checkout' },
          { text: '🗑️ Clear Cart', callback_data: 'clear_cart' }
        ],
        [
          { text: '📋 Continue Shopping', callback_data: 'listings' }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await this.sendAutoVanishMessage(chatId, cartMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleWishlistCommand(chatId: number, userId: string) {
    // For now, show a feature coming soon message
    const message = '❤️ *Wishlist Feature*\n\nSave your favorite products for later!\n\n🚧 This feature is coming soon. Stay tuned for updates!';
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '📋 Browse Listings', callback_data: 'listings' }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleRatingCommand(chatId: number, userId: string) {
    const message = '⭐ *Rate Your Experience*\n\nHow would you rate your shopping experience with us?';
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '⭐', callback_data: 'rate_1' },
          { text: '⭐⭐', callback_data: 'rate_2' },
          { text: '⭐⭐⭐', callback_data: 'rate_3' }
        ],
        [
          { text: '⭐⭐⭐⭐', callback_data: 'rate_4' },
          { text: '⭐⭐⭐⭐⭐', callback_data: 'rate_5' }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleOperatorCommand(chatId: number, userId: string) {
    const message = '👤 *Contact Operator*\n\nNeed help? Our support team is here for you!\n\n📞 Support Options:';
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '💬 Live Chat', callback_data: 'live_chat' }
        ],
        [
          { text: '📧 Send Email', callback_data: 'send_email' },
          { text: '❓ FAQ', callback_data: 'view_faq' }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Additional callback handlers
  private setupAdditionalCallbacks() {
    if (!this.bot) return;

    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id;
      const data = query.data;
      
      if (!chatId || !data) return;
      
      await this.bot?.answerCallbackQuery(query.id);
      
      // Handle additional callbacks
      switch (data) {
        case 'back_to_menu':
          await this.sendMainMenu(chatId);
          break;
        case 'rate_1':
        case 'rate_2':
        case 'rate_3':
        case 'rate_4':
