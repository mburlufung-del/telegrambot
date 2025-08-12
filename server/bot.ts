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

    // Handle any message/command to trigger auto-vanish welcome
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || '';
      const text = msg.text || '';
      
      // Skip if it's a callback query response
      if (text.startsWith('/callback_')) return;
      
      await storage.incrementMessageCount();
      
      // Auto-vanish welcome interface with command buttons
      const welcomeMessage = '🛍️ Welcome to TeleShop!\n\nChoose an option below:';
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '📋 Listings', callback_data: 'listings' },
            { text: '🛒 Carts', callback_data: 'carts' }
          ],
          [
            { text: '📦 Orders', callback_data: 'orders' },
            { text: '❤️ Wishlist', callback_data: 'wishlist' }
          ],
          [
            { text: '⭐ Rating', callback_data: 'rating' },
            { text: '👤 Operator', callback_data: 'operator' }
          ]
        ]
      };

      await this.sendAutoVanishMessage(chatId, welcomeMessage, {
        reply_markup: keyboard
      });
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
          { text: '🛒 Carts', callback_data: 'carts' }
        ],
        [
          { text: '📦 Orders', callback_data: 'orders' },
          { text: '❤️ Wishlist', callback_data: 'wishlist' }
        ],
        [
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
    const products = await storage.getProducts();
    const activeProducts = products.filter(p => p.isActive);

    if (activeProducts.length === 0) {
      const message = '📋 No products available at the moment.\n\nCome back later for new listings!';
      const backButton = {
        inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
      };
      
      await this.sendAutoVanishMessage(chatId, message, { reply_markup: backButton });
      return;
    }

    let listingsMessage = '📋 *Product Listings:*\n\n';
    
    activeProducts.slice(0, 8).forEach((product, index) => {
      const stockStatus = product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock';
      const priceDisplay = product.compareAtPrice 
        ? `💰 ~~$${product.compareAtPrice}~~ *$${product.price}*`
        : `💰 *$${product.price}*`;
      
      listingsMessage += `${index + 1}. *${product.name}*\n`;
      listingsMessage += `   ${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}\n`;
      listingsMessage += `   ${priceDisplay}\n`;
      listingsMessage += `   📦 ${stockStatus}\n\n`;
    });

    if (activeProducts.length > 8) {
      listingsMessage += `... and ${activeProducts.length - 8} more products.`;
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Search Products', callback_data: 'search_products' },
          { text: '📂 Categories', callback_data: 'view_categories' }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await this.sendAutoVanishMessage(chatId, listingsMessage, {
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
        case 'rate_5':
          const rating = data.split('_')[1];
          const thankYouMessage = `⭐ Thank you for your ${rating}-star rating!\n\nYour feedback helps us improve our service.`;
          const backButton = {
            inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
          };
          await this.sendAutoVanishMessage(chatId, thankYouMessage, { reply_markup: backButton });
          break;
        case 'live_chat':
          await this.createInquiry(chatId, query.from.id.toString(), 'Live Chat Request', 'Customer requested live chat support');
          const chatMessage = '💬 Your live chat request has been received!\n\nOur support team will respond shortly.';
          const chatBackButton = {
            inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
          };
          await this.sendAutoVanishMessage(chatId, chatMessage, { reply_markup: chatBackButton });
          break;
      }
    });
  }

  // Helper method to create inquiries
  private async createInquiry(chatId: number, userId: string, subject: string, message: string) {
    try {
      await storage.createInquiry({
        telegramUserId: userId,
        customerName: subject,
        message: message,
        isRead: false
      });
    } catch (error) {
      console.error('Error creating inquiry:', error);
    }
  }

  // Legacy command support (optional - can be removed)
  private setupLegacyCommands() {
    if (!this.bot) return;

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      await storage.incrementMessageCount();

      const helpMessage = await storage.getBotSetting('help_message');
      const message = helpMessage?.value || '🔹 Available Commands:\n\n/start - Welcome message\n/catalog - Browse products\n/categories - View categories\n/cart - View your cart\n/orders - Your order history\n/contact - Contact support\n/help - Show this message\n\n💡 Tips:\n• Add items to cart by typing product numbers\n• Use /checkout when ready to order\n• We\'re here to help with any questions!';
      
      this.bot?.sendMessage(chatId, message);
    });

    // Categories command
    this.bot.onText(/\/categories/, async (msg) => {
      const chatId = msg.chat.id;
      
      await storage.incrementMessageCount();

      const categories = await storage.getCategories();

      if (categories.length === 0) {
        this.bot?.sendMessage(chatId, 'No categories available at the moment.');
        return;
      }

      let categoryMessage = '📂 *Product Categories:*\n\n';
      
      categories.forEach((category, index) => {
        categoryMessage += `${index + 1}. *${category.name}*\n`;
        if (category.description) {
          categoryMessage += `   ${category.description}\n`;
        }
        categoryMessage += '\n';
      });

      categoryMessage += 'Reply with a category number to browse products in that category.';

      this.bot?.sendMessage(chatId, categoryMessage, { parse_mode: 'Markdown' });
    });

    // Featured products command
    this.bot.onText(/\/featured/, async (msg) => {
      const chatId = msg.chat.id;
      
      await storage.incrementMessageCount();

      const featuredProducts = await storage.getFeaturedProducts();

      if (featuredProducts.length === 0) {
        this.bot?.sendMessage(chatId, 'No featured products available at the moment.');
        return;
      }

      let featuredMessage = '⭐ *Featured Products:*\n\n';
      
      featuredProducts.forEach((product, index) => {
        const stockStatus = product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock';
        const priceDisplay = product.compareAtPrice 
          ? `💰 ~~$${product.compareAtPrice}~~ *$${product.price}*`
          : `💰 *$${product.price}*`;
        
        featuredMessage += `${index + 1}. *${product.name}*\n`;
        featuredMessage += `   ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}\n`;
        featuredMessage += `   ${priceDisplay}\n`;
        featuredMessage += `   📦 ${stockStatus}\n\n`;
      });

      featuredMessage += 'Reply with the product number to add to cart or get more details.';

      this.bot?.sendMessage(chatId, featuredMessage, { parse_mode: 'Markdown' });
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
      
      activeProducts.slice(0, 10).forEach((product, index) => {
        const stockStatus = product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock';
        const priceDisplay = product.compareAtPrice 
          ? `💰 ~~$${product.compareAtPrice}~~ *$${product.price}*`
          : `💰 *$${product.price}*`;
        
        catalogMessage += `${index + 1}. *${product.name}*\n`;
        catalogMessage += `   ${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}\n`;
        catalogMessage += `   ${priceDisplay}\n`;
        catalogMessage += `   📦 ${stockStatus}\n\n`;
      });

      if (activeProducts.length > 10) {
        catalogMessage += `... and ${activeProducts.length - 10} more products.\n\n`;
      }

      catalogMessage += 'Reply with the product number to add to cart or get details.\nUse /search <keyword> to find specific products.';

      this.bot?.sendMessage(chatId, catalogMessage, { parse_mode: 'Markdown' });
    });

    // Search command
    this.bot.onText(/\/search (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const searchQuery = match?.[1] || '';
      
      await storage.incrementMessageCount();

      const searchResults = await storage.searchProducts(searchQuery);

      if (searchResults.length === 0) {
        this.bot?.sendMessage(chatId, `No products found for "${searchQuery}". Try different keywords or browse /catalog.`);
        return;
      }

      let searchMessage = `🔍 *Search Results for "${searchQuery}":*\n\n`;
      
      searchResults.slice(0, 8).forEach((product, index) => {
        const stockStatus = product.stock > 0 ? '✅' : '❌';
        searchMessage += `${index + 1}. *${product.name}* ${stockStatus}\n`;
        searchMessage += `   $${product.price} • Stock: ${product.stock}\n\n`;
      });

      searchMessage += 'Reply with the product number for details or to add to cart.';

      this.bot?.sendMessage(chatId, searchMessage, { parse_mode: 'Markdown' });
    });

    // Cart command
    this.bot.onText(/\/cart/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || '';
      
      await storage.incrementMessageCount();

      const cartItems = await storage.getCart(userId);
      const cartTotal = await storage.getCartTotal(userId);

      if (cartItems.length === 0) {
        this.bot?.sendMessage(chatId, '🛒 Your cart is empty.\n\nUse /catalog to browse products and add items to your cart!');
        return;
      }

      let cartMessage = '🛒 *Your Shopping Cart:*\n\n';
      
      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          const itemTotal = (parseFloat(product.price) * item.quantity).toFixed(2);
          cartMessage += `• *${product.name}*\n`;
          cartMessage += `  $${product.price} × ${item.quantity} = $${itemTotal}\n\n`;
        }
      }

      cartMessage += `📊 *Total: ${cartTotal.itemCount} items • $${cartTotal.totalAmount}*\n\n`;
      cartMessage += '💡 Commands:\n';
      cartMessage += '• /checkout - Place your order\n';
      cartMessage += '• /clear_cart - Empty your cart\n';
      cartMessage += '• Type "remove [product name]" to remove items';

      this.bot?.sendMessage(chatId, cartMessage, { parse_mode: 'Markdown' });
    });

    // Checkout command
    this.bot.onText(/\/checkout/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || '';
      const userName = msg.from?.first_name || 'Customer';
      
      await storage.incrementMessageCount();

      const cartItems = await storage.getCart(userId);
      const cartTotal = await storage.getCartTotal(userId);

      if (cartItems.length === 0) {
        this.bot?.sendMessage(chatId, '🛒 Your cart is empty. Add some products first using /catalog!');
        return;
      }

      // Create order items
      const orderItems = [];
      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          orderItems.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: item.quantity,
            total: (parseFloat(product.price) * item.quantity).toFixed(2)
          });
        }
      }

      let checkoutMessage = '🛍️ *Order Summary:*\n\n';
      
      orderItems.forEach(item => {
        checkoutMessage += `• ${item.productName}\n`;
        checkoutMessage += `  $${item.price} × ${item.quantity} = $${item.total}\n\n`;
      });

      checkoutMessage += `💰 *Total: $${cartTotal.totalAmount}*\n\n`;
      checkoutMessage += '📝 To complete your order, please reply with:\n';
      checkoutMessage += '• Your full name\n';
      checkoutMessage += '• Contact information (phone/email)\n';
      checkoutMessage += '• Delivery address\n';
      checkoutMessage += '• Preferred payment method\n\n';
      checkoutMessage += 'Format: NAME | CONTACT | ADDRESS | PAYMENT';

      this.bot?.sendMessage(chatId, checkoutMessage, { parse_mode: 'Markdown' });
    });

    // Clear cart command
    this.bot.onText(/\/clear_cart/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || '';
      
      await storage.incrementMessageCount();
      await storage.clearCart(userId);

      this.bot?.sendMessage(chatId, '🗑️ Your cart has been cleared.');
    });

    // Orders command
    this.bot.onText(/\/orders/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || '';
      
      await storage.incrementMessageCount();

      const userOrders = await storage.getOrdersByUser(userId);

      if (userOrders.length === 0) {
        this.bot?.sendMessage(chatId, '📦 You have no orders yet.\n\nStart shopping with /catalog to place your first order!');
        return;
      }

      let ordersMessage = '📦 *Your Orders:*\n\n';
      
      userOrders.slice(0, 5).forEach((order, index) => {
        const statusEmoji = {
          'pending': '⏳',
          'confirmed': '✅',
          'processing': '🔄',
          'shipped': '🚚',
          'delivered': '📦',
          'cancelled': '❌'
        }[order.status] || '📋';

        ordersMessage += `${index + 1}. Order #${order.id.substring(0, 8)}\n`;
        ordersMessage += `   ${statusEmoji} Status: ${order.status.toUpperCase()}\n`;
        ordersMessage += `   💰 Total: $${order.totalAmount}\n`;
        ordersMessage += `   📅 ${order.createdAt.toLocaleDateString()}\n\n`;
      });

      if (userOrders.length > 5) {
        ordersMessage += `... and ${userOrders.length - 5} more orders.\n\n`;
      }

      ordersMessage += 'Contact us if you have any questions about your orders!';

      this.bot?.sendMessage(chatId, ordersMessage, { parse_mode: 'Markdown' });
    });

    // Contact command
    this.bot.onText(/\/contact/, async (msg) => {
      const chatId = msg.chat.id;
      
      await storage.incrementMessageCount();

      const contactMessage = await storage.getBotSetting('contact_message');
      const message = contactMessage?.value || '📞 Contact Information:\n\n📧 Email: support@teleshop.com\n📱 Phone: +1 (555) 123-4567\n🕒 Hours: Mon-Fri 9AM-6PM\n\n💬 Send us a message anytime and we\'ll respond within 24 hours!';
      
      this.bot?.sendMessage(chatId, message);
    });

    // Payment methods command
    this.bot.onText(/\/payment/, async (msg) => {
      const chatId = msg.chat.id;
      
      await storage.incrementMessageCount();

      const paymentMessage = await storage.getBotSetting('payment_methods');
      const message = paymentMessage?.value || '💳 Payment Methods:\n• Cash on Delivery\n• Bank Transfer\n• Credit/Debit Card\n• PayPal\n• Cryptocurrency';
      
      this.bot?.sendMessage(chatId, message);
    });

    // Handle all other messages
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const messageText = msg.text || '';
      const userId = msg.from?.id.toString() || '';
      const userName = msg.from?.first_name || 'Customer';

      await storage.incrementMessageCount();

      // Skip if it's a command
      if (messageText.startsWith('/')) return;

      // Handle remove from cart
      if (messageText.toLowerCase().startsWith('remove ')) {
        const productName = messageText.substring(7).trim();
        const cartItems = await storage.getCart(userId);
        
        for (const item of cartItems) {
          const product = await storage.getProduct(item.productId);
          if (product && product.name.toLowerCase().includes(productName.toLowerCase())) {
            await storage.removeFromCart(userId, product.id);
            this.bot?.sendMessage(chatId, `✅ Removed "${product.name}" from your cart.`);
            return;
          }
        }
        
        this.bot?.sendMessage(chatId, `❌ Couldn't find "${productName}" in your cart.`);
        return;
      }

      // Handle order checkout format (NAME | CONTACT | ADDRESS | PAYMENT)
      if (messageText.includes('|') && messageText.split('|').length >= 3) {
        const orderParts = messageText.split('|').map(part => part.trim());
        const [customerName, contactInfo, deliveryAddress, paymentMethod] = orderParts;

        const cartItems = await storage.getCart(userId);
        const cartTotal = await storage.getCartTotal(userId);

        if (cartItems.length === 0) {
          this.bot?.sendMessage(chatId, '❌ Your cart is empty. Please add items before placing an order.');
          return;
        }

        // Create order items
        const orderItems = [];
        for (const item of cartItems) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            orderItems.push({
              productId: product.id,
              productName: product.name,
              price: product.price,
              quantity: item.quantity,
              total: (parseFloat(product.price) * item.quantity).toFixed(2)
            });
          }
        }

        // Create the order
        const order = await storage.createOrder({
          telegramUserId: userId,
          customerName: customerName || userName,
          contactInfo,
          items: JSON.stringify(orderItems),
          totalAmount: cartTotal.totalAmount,
          status: 'pending',
          paymentMethod: paymentMethod || null,
          deliveryAddress: deliveryAddress || null,
        });

        // Update stats
        await storage.incrementOrderCount();
        await storage.addRevenue(cartTotal.totalAmount);

        // Clear the cart
        await storage.clearCart(userId);

        const confirmationMessage = await storage.getBotSetting('order_confirmation');
        let orderConfirmMessage = confirmationMessage?.value || '✅ Order confirmed! We\'ll process your order and contact you within 24 hours with shipping details.';
        
        orderConfirmMessage += `\n\n📋 *Order Details:*\n`;
        orderConfirmMessage += `Order ID: #${order.id.substring(0, 8)}\n`;
        orderConfirmMessage += `Total: $${order.totalAmount}\n`;
        orderConfirmMessage += `Status: ${order.status.toUpperCase()}\n\n`;
        orderConfirmMessage += 'Thank you for your order! 🎉';

        this.bot?.sendMessage(chatId, orderConfirmMessage, { parse_mode: 'Markdown' });
        return;
      }

      // Handle numeric inputs (product selection)
      const productIndex = parseInt(messageText) - 1;

      // Check if it's a category number
      if (!isNaN(productIndex) && productIndex >= 0) {
        const categories = await storage.getCategories();
        
        if (productIndex < categories.length) {
          const category = categories[productIndex];
          const categoryProducts = await storage.getProductsByCategory(category.id);
          
          if (categoryProducts.length === 0) {
            this.bot?.sendMessage(chatId, `No products available in ${category.name} category.`);
            return;
          }

          let categoryMessage = `📂 *${category.name} Products:*\n\n`;
          
          categoryProducts.slice(0, 8).forEach((product, index) => {
            const stockStatus = product.stock > 0 ? '✅' : '❌';
            categoryMessage += `${index + 1}. *${product.name}* ${stockStatus}\n`;
            categoryMessage += `   $${product.price} • Stock: ${product.stock}\n\n`;
          });

          categoryMessage += 'Reply with the product number to add to cart or get details.';

          this.bot?.sendMessage(chatId, categoryMessage, { parse_mode: 'Markdown' });
          return;
        }

        // Check if it's a product number
        const products = await storage.getProducts();
        const activeProducts = products.filter(p => p.isActive);

        if (productIndex < activeProducts.length) {
          const product = activeProducts[productIndex];
          
          let productMessage = `📱 *${product.name}*\n\n`;
          productMessage += `${product.description}\n\n`;
          
          if (product.compareAtPrice) {
            productMessage += `💰 ~~$${product.compareAtPrice}~~ *$${product.price}*\n`;
          } else {
            productMessage += `💰 *Price:* $${product.price}\n`;
          }
          
          productMessage += `📦 *Stock:* ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}\n`;
          
          if (product.specifications) {
            try {
              const specs = JSON.parse(product.specifications);
              productMessage += '\n🔧 *Specifications:*\n';
              Object.entries(specs).forEach(([key, value]) => {
                productMessage += `• ${key}: ${value}\n`;
              });
            } catch (e) {
              // Ignore parsing errors
            }
          }
          
          if (product.stock > 0) {
            productMessage += '\n✅ Reply with "add" to add this item to your cart!\n';
            productMessage += 'Or include quantity: "add 2" for multiple items.';
          } else {
            productMessage += '\n❌ This item is currently out of stock.';
          }

          this.bot?.sendMessage(chatId, productMessage, { parse_mode: 'Markdown' });
          return;
        }
      }

      // Handle add to cart
      if (messageText.toLowerCase().startsWith('add')) {
        const parts = messageText.toLowerCase().split(' ');
        const quantity = parts.length > 1 ? parseInt(parts[1]) || 1 : 1;
        
        // We need to track the last viewed product for this user
        // For simplicity, we'll just let them know to select a product first
        this.bot?.sendMessage(chatId, '📱 Please select a product first by typing its number from the catalog, then type "add" to add it to your cart.');
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

        const responseMessage = '📧 Thank you for your message! We\'ve received your inquiry and will get back to you within 24 hours.\n\n💡 Tip: Use /help to see all available commands.';
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

      const defaultResponse = '💬 Thank you for your message!\n\n🔹 For products: /catalog\n🔹 For help: /help\n🔹 For your cart: /cart\n🔹 To contact us: /contact\n\n We\'re here to help! 😊';
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
