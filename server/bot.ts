import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage.js';

export class TeleShopBot {
  private bot: TelegramBot | null = null;
  private userMessages: Map<number, number[]> = new Map();

  async initialize(token?: string) {
    if (this.bot) {
      await this.shutdown();
    }

    try {
      // Get token from storage if not provided
      if (!token) {
        const botSettings = await storage.getBotSettings();
        const tokenSetting = botSettings.find(s => s.key === 'bot_token');
        token = tokenSetting?.value || '7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs';
        
        // Save default token if none exists
        if (!tokenSetting) {
          await storage.setBotSetting({
            key: 'bot_token',
            value: '7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs'
          });
        }
      }

      console.log('Initializing bot with token...', token ? 'YES' : 'NO');
      
      // Choose polling for development, webhook for production
      const useWebhook = process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL;
      
      if (useWebhook) {
        this.bot = new TelegramBot(token, { webHook: true });
        const webhookUrl = `${process.env.WEBHOOK_URL}/webhook`;
        await this.bot.setWebHook(webhookUrl);
        console.log(`Telegram bot initialized with webhook: ${webhookUrl}`);
      } else {
        this.bot = new TelegramBot(token, { polling: true });
        console.log('Telegram bot initialized with polling for development');
      }

      this.setupMessageHandlers();
      this.setupAdditionalCallbacks();
      return true;
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error);
      this.bot = null;
      return false;
    }
  }

  async restart() {
    console.log('Restarting bot...');
    return await this.initialize();
  }

  private async sendAutoVanishMessage(chatId: number, text: string, options: any = {}) {
    if (!this.bot) return;

    try {
      // Delete previous messages for this user
      const userMsgIds = this.userMessages.get(chatId) || [];
      for (const msgId of userMsgIds) {
        try {
          await this.bot.deleteMessage(chatId, msgId);
        } catch (error) {
          // Ignore deletion errors (message might be too old)
        }
      }

      // Send new message
      const message = await this.bot.sendMessage(chatId, text, options);
      
      // Track this message for future deletion
      this.userMessages.set(chatId, [message.message_id]);
      
      return message;
    } catch (error) {
      console.error('Error sending auto-vanish message:', error);
    }
  }

  private setupMessageHandlers() {
    if (!this.bot) return;

    // Handle /start command and main menu requests
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      await storage.incrementMessageCount();
      await this.sendMainMenu(chatId);
    });

    // Handle text messages
    this.bot.on('message', async (msg) => {
      if (msg.text?.startsWith('/')) return; // Skip commands

      const chatId = msg.chat.id;
      const messageText = msg.text?.toLowerCase() || '';
      
      await storage.incrementMessageCount();

      // Check for menu keyword
      if (messageText === 'menu' || messageText === 'main menu') {
        await this.sendMainMenu(chatId);
      } else {
        // Send acknowledgment without showing menu for other messages
        const ackMessage = 'Message received! Use /start to see the main menu or type "menu" anytime.';
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

  // Enhanced Listings command with full category → product → details → actions flow
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
      { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
    ]);

    const keyboard = { inline_keyboard: categoryButtons };

    await this.sendAutoVanishMessage(chatId, categoriesMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle other commands (simplified for now)
  private async handleCartsCommand(chatId: number, userId: string) {
    const message = '🛒 *Your Shopping Cart*\n\nCart functionality coming soon!';
    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Continue Shopping', callback_data: 'listings' }],
        [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
      ]
    };
    
    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleOrdersCommand(chatId: number, userId: string) {
    const message = '📦 *Your Orders*\n\nOrder history coming soon!';
    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Browse Products', callback_data: 'listings' }],
        [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
      ]
    };
    
    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleWishlistCommand(chatId: number, userId: string) {
    const message = '❤️ *Your Wishlist*\n\nWishlist feature coming soon!';
    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Browse Products', callback_data: 'listings' }],
        [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
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
    const message = '👤 *Contact Operator*\n\nNeed help? Our support team is here for you!';
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '💬 Live Chat', callback_data: 'live_chat' }],
        [{ text: '📧 Send Email', callback_data: 'send_email' }],
        [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
      ]
    };

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Additional callback handlers for enhanced Listings flow
  private setupAdditionalCallbacks() {
    if (!this.bot) return;

    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id;
      const data = query.data;
      const userId = query.from.id.toString();
      
      if (!chatId || !data) return;
      
      await this.bot?.answerCallbackQuery(query.id);
      
      // Handle additional callbacks
      if (data === 'back_to_menu') {
        await this.sendMainMenu(chatId);
      }
      // Handle category selection
      else if (data?.startsWith('category_')) {
        const categoryId = data.replace('category_', '');
        await this.handleCategoryProducts(chatId, userId, categoryId);
      }
      // Handle product selection
      else if (data?.startsWith('product_')) {
        const productId = data.replace('product_', '');
        await this.handleProductDetails(chatId, userId, productId);
      }
      // Handle quantity selection
      else if (data?.startsWith('qty_')) {
        const parts = data.split('_');
        const productId = parts[1];
        const quantity = parseInt(parts[2]);
        await this.handleQuantitySelection(chatId, userId, productId, quantity);
      }
      // Handle add to cart with quantity
      else if (data?.startsWith('addcart_')) {
        const parts = data.split('_');
        const productId = parts[1];
        const quantity = parts[2] ? parseInt(parts[2]) : 1;
        await this.handleAddToCart(chatId, userId, productId, quantity);
      }
      // Handle add to wishlist - auto-returns to main menu
      else if (data?.startsWith('wishlist_')) {
        const productId = data.replace('wishlist_', '');
        await this.handleAddToWishlist(chatId, userId, productId);
      }
      // Handle product rating
      else if (data?.startsWith('rate_product_')) {
        const parts = data.split('_');
        const productId = parts[2];
        const rating = parts[3];
        await this.handleProductRating(chatId, userId, productId, rating);
      }
      // Handle rating responses
      else if (data?.startsWith('rate_')) {
        const rating = data.split('_')[1];
        const thankYouMessage = `⭐ Thank you for your ${rating}-star rating!\n\nYour feedback helps us improve our service.`;
        const backButton = {
          inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
        };
        await this.sendAutoVanishMessage(chatId, thankYouMessage, { reply_markup: backButton });
      }
    });
  }

  // Enhanced Listings Flow Methods

  // Handle category product listing
  private async handleCategoryProducts(chatId: number, userId: string, categoryId: string) {
    const category = await storage.getCategories().then(cats => cats.find(c => c.id === categoryId));
    const products = await storage.getProductsByCategory(categoryId);
    const activeProducts = products.filter(p => p.isActive);

    if (!category) {
      await this.sendMainMenu(chatId);
      return;
    }

    if (activeProducts.length === 0) {
      const message = `📂 *${category.name}*\n\nNo products available in this category at the moment.`;
      const keyboard = {
        inline_keyboard: [
          [{ text: '📋 Browse Other Categories', callback_data: 'listings' }],
          [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
        ]
      };
      
      await this.sendAutoVanishMessage(chatId, message, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
      return;
    }

    let productsMessage = `📂 *${category.name}*\n\n`;
    
    const productButtons: Array<Array<{text: string, callback_data: string}>> = [];
    activeProducts.slice(0, 10).forEach((product, index) => {
      const stockStatus = product.stock > 0 ? '✅' : '❌';
      const priceDisplay = product.compareAtPrice 
        ? `~~$${product.compareAtPrice}~~ *$${product.price}*`
        : `*$${product.price}*`;
      
      productsMessage += `${index + 1}. *${product.name}* ${stockStatus}\n`;
      productsMessage += `   ${priceDisplay}\n`;
      productsMessage += `   ${product.description.substring(0, 60)}${product.description.length > 60 ? '...' : ''}\n\n`;
      
      // Create product buttons in rows of 2
      if (index % 2 === 0) {
        productButtons.push([]);
      }
      productButtons[productButtons.length - 1].push({
        text: `${index + 1}. ${product.name}`,
        callback_data: `product_${product.id}`
      });
    });

    if (activeProducts.length > 10) {
      productsMessage += `... and ${activeProducts.length - 10} more products.`;
    }

    // Add navigation buttons
    productButtons.push([
      { text: '📋 Other Categories', callback_data: 'listings' }
    ]);
    productButtons.push([
      { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
    ]);

    const keyboard = { inline_keyboard: productButtons };

    await this.sendAutoVanishMessage(chatId, productsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle individual product details with full interface
  private async handleProductDetails(chatId: number, userId: string, productId: string) {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      await this.sendMainMenu(chatId);
      return;
    }

    const category = await storage.getCategories().then(cats => cats.find(c => c.id === product.categoryId));
    
    // Build detailed product message
    let message = `🏷️ *${product.name}*\n\n`;
    message += `📝 *Description:*\n${product.description}\n\n`;
    
    // Price information
    if (product.compareAtPrice) {
      message += `💰 *Price:* ~~$${product.compareAtPrice}~~ *$${product.price}*\n`;
      const savings = (parseFloat(product.compareAtPrice) - parseFloat(product.price)).toFixed(2);
      message += `💸 *You Save:* $${savings}\n\n`;
    } else {
      message += `💰 *Price:* $${product.price}\n\n`;
    }

    // Stock and availability
    const stockStatus = product.stock > 0 ? `✅ In Stock (${product.stock} available)` : '❌ Out of Stock';
    message += `📦 *Stock:* ${stockStatus}\n`;
    
    if (category) {
      message += `📂 *Category:* ${category.name}\n`;
    }

    // Specifications if available
    if (product.specifications) {
      try {
        const specs = JSON.parse(product.specifications);
        message += `\n🔬 *Specifications:*\n`;
        Object.entries(specs).forEach(([key, value]) => {
          message += `• *${key}:* ${value}\n`;
        });
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Build action buttons
    const actionButtons: Array<Array<{text: string, callback_data: string}>> = [];

    if (product.stock > 0) {
      // Quantity selection row
      actionButtons.push([
        { text: 'Qty: 1', callback_data: `qty_${productId}_1` },
        { text: 'Qty: 2', callback_data: `qty_${productId}_2` },
        { text: 'Qty: 3', callback_data: `qty_${productId}_3` }
      ]);
      actionButtons.push([
        { text: 'Qty: 5', callback_data: `qty_${productId}_5` }
      ]);

      // Main action buttons
      actionButtons.push([
        { text: '🛒 Add to Cart', callback_data: `addcart_${productId}_1` },
        { text: '❤️ Add to Wishlist', callback_data: `wishlist_${productId}` }
      ]);
    }

    // Rating and navigation
    actionButtons.push([
      { text: '⭐ Rate Product', callback_data: `rate_product_${productId}` }
    ]);
    actionButtons.push([
      { text: '🔙 Back to Category', callback_data: `category_${product.categoryId}` },
      { text: '🏠 Main Menu', callback_data: 'back_to_menu' }
    ]);

    const keyboard = { inline_keyboard: actionButtons };

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle quantity selection
  private async handleQuantitySelection(chatId: number, userId: string, productId: string, quantity: number) {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      await this.sendMainMenu(chatId);
      return;
    }

    const message = `📦 *Quantity Selected: ${quantity}*\n\nProduct: *${product.name}*\nPrice: $${product.price} each\nTotal: $${(parseFloat(product.price) * quantity).toFixed(2)}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🛒 Add to Cart', callback_data: `addcart_${productId}_${quantity}` },
          { text: '❤️ Add to Wishlist', callback_data: `wishlist_${productId}` }
        ],
        [
          { text: '🔙 Back to Product', callback_data: `product_${productId}` }
        ]
      ]
    };

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle add to cart
  private async handleAddToCart(chatId: number, userId: string, productId: string, quantity: number = 1) {
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        await this.sendMainMenu(chatId);
        return;
      }

      if (product.stock < quantity) {
        const message = `❌ *Not enough stock*\n\nRequested: ${quantity}\nAvailable: ${product.stock}`;
        const keyboard = {
          inline_keyboard: [[{ text: '🔙 Back to Product', callback_data: `product_${productId}` }]]
        };
        
        await this.sendAutoVanishMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        return;
      }

      await storage.addToCart({
        telegramUserId: userId,
        productId: productId,
        quantity: quantity
      });

      const total = (parseFloat(product.price) * quantity).toFixed(2);
      const message = `✅ *Added to Cart!*\n\n• ${product.name}\n• Quantity: ${quantity}\n• Total: $${total}`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🛒 View Cart', callback_data: 'carts' },
            { text: '📋 Continue Shopping', callback_data: 'listings' }
          ],
          [
            { text: '🔙 Back to Product', callback_data: `product_${productId}` }
          ]
        ]
      };

      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      await this.sendMainMenu(chatId);
    }
  }

  // Handle add to wishlist - automatically returns to main menu
  private async handleAddToWishlist(chatId: number, userId: string, productId: string) {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      await this.sendMainMenu(chatId);
      return;
    }

    // Show success message and auto-return to main menu
    const message = `❤️ *Added to Wishlist!*\n\n${product.name} has been saved to your wishlist.\n\nReturning to main menu...`;
    
    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown'
    });

    // Auto-return to main menu after 2 seconds
    setTimeout(async () => {
      await this.sendMainMenu(chatId);
    }, 2000);
  }

  // Handle product rating
  private async handleProductRating(chatId: number, userId: string, productId: string, rating?: string) {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      await this.sendMainMenu(chatId);
      return;
    }

    if (!rating) {
      // Show rating selection
      const message = `⭐ *Rate: ${product.name}*\n\nHow would you rate this product?`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '⭐', callback_data: `rate_product_${productId}_1` },
            { text: '⭐⭐', callback_data: `rate_product_${productId}_2` },
            { text: '⭐⭐⭐', callback_data: `rate_product_${productId}_3` }
          ],
          [
            { text: '⭐⭐⭐⭐', callback_data: `rate_product_${productId}_4` },
            { text: '⭐⭐⭐⭐⭐', callback_data: `rate_product_${productId}_5` }
          ],
          [
            { text: '🔙 Back to Product', callback_data: `product_${productId}` }
          ]
        ]
      };

      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } else {
      // Process the rating
      const stars = '⭐'.repeat(parseInt(rating));
      const message = `${stars} *Thank you for rating!*\n\nYou gave *${product.name}* a ${rating}-star rating.\n\nYour feedback helps other customers!`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔙 Back to Product', callback_data: `product_${productId}` },
            { text: '🏠 Main Menu', callback_data: 'back_to_menu' }
          ]
        ]
      };

      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    }
  }

  async isReady(): Promise<boolean> {
    return this.bot !== null;
  }

  getConfig() {
    return {
      mode: process.env.NODE_ENV === 'production' ? 'webhook' : 'polling',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  async handleWebhookUpdate(req: any, res: any) {
    if (!this.bot) {
      res.status(500).json({ error: 'Bot not initialized' });
      return;
    }

    try {
      await this.bot.processUpdate(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Failed to process update' });
    }
  }

  async shutdown() {
    if (this.bot) {
      try {
        await this.bot.stopPolling();
      } catch (error) {
        // Ignore errors when stopping polling
      }
      this.bot = null;
    }
  }
}

export const teleShopBot = new TeleShopBot();