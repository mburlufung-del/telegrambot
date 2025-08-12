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
      
      // Answer the callback query to remove loading state with error handling
      try {
        await this.bot?.answerCallbackQuery(query.id);
      } catch (error) {
        console.log('Callback query response failed, continuing...');
      }
      
      // Handle all callback data patterns
      if (data === 'listings') {
        await this.handleListingsCommand(chatId, userId);
      } else if (data === 'carts') {
        await this.handleCartsCommand(chatId, userId);
      } else if (data === 'orders') {
        await this.handleOrdersCommand(chatId, userId);
      } else if (data === 'wishlist') {
        await this.handleWishlistCommand(chatId, userId);
      } else if (data === 'rating') {
        await this.handleRatingCommand(chatId, userId);
      } else if (data === 'operator') {
        await this.handleOperatorCommand(chatId, userId);
      } else if (data === 'back_to_menu') {
        await this.sendMainMenu(chatId);
      } else if (data.startsWith('category_')) {
        const categoryId = data.replace('category_', '');
        await this.handleCategoryProducts(chatId, userId, categoryId);
      } else if (data.startsWith('product_')) {
        const productId = data.replace('product_', '');
        await this.handleProductDetails(chatId, userId, productId);
      } else if (data.startsWith('select_qty_')) {
        const parts = data.split('_');
        const productId = parts[2];
        const currentQty = parseInt(parts[3]) || 1;
        await this.handleQuantitySelection(chatId, userId, productId, currentQty);
      } else if (data.startsWith('qty_change_')) {
        const parts = data.split('_');
        const action = parts[2]; // 'plus' or 'minus'
        const productId = parts[3];
        const currentQty = parseInt(parts[4]) || 1;
        await this.handleQuantityChange(chatId, userId, productId, currentQty, action);
      } else if (data.startsWith('addcart_')) {
        const parts = data.split('_');
        const productId = parts[1];
        const quantity = parseInt(parts[2]) || 1;
        await this.handleAddToCart(chatId, userId, productId, quantity);
      } else if (data.startsWith('wishlist_')) {
        const parts = data.split('_');
        const productId = parts[1];
        const quantity = parseInt(parts[2]) || 1;
        await this.handleAddToWishlist(chatId, userId, productId, quantity);
      } else if (data.startsWith('rate_product_')) {
        const productId = data.replace('rate_product_', '');
        await this.handleProductRating(chatId, userId, productId);
      } else if (data.startsWith('rating_')) {
        const rating = data.split('_')[1];
        const thankYouMessage = `⭐ Thank you for your ${rating}-star rating!\n\nYour feedback helps us improve our service.`;
        const backButton = {
          inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
        };
        await this.sendAutoVanishMessage(chatId, thankYouMessage, { reply_markup: backButton });
      } else {
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
    const allCategories = await storage.getCategories();

    // Filter categories to only show those with active products
    const categoriesWithProducts = [];
    for (const category of allCategories) {
      const products = await storage.getProductsByCategory(category.id);
      const activeProducts = products.filter(p => p.isActive && p.stock > 0);
      if (activeProducts.length > 0) {
        categoriesWithProducts.push({
          ...category,
          productCount: activeProducts.length
        });
      }
    }

    if (categoriesWithProducts.length === 0) {
      const message = '📋 No products available at the moment.\n\nCome back later for new listings!';
      const backButton = {
        inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
      };
      
      await this.sendAutoVanishMessage(chatId, message, { reply_markup: backButton });
      return;
    }

    let categoriesMessage = '📋 *Choose Product Category:*\n\n';
    
    const categoryButtons: Array<Array<{text: string, callback_data: string}>> = [];
    categoriesWithProducts.forEach((category, index) => {
      categoriesMessage += `${index + 1}. *${category.name}* (${category.productCount} products)\n`;
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

  // Handle cart viewing with actual cart items
  private async handleCartsCommand(chatId: number, userId: string) {
    try {
      const cartItems = await storage.getCartItems(userId);
      
      if (cartItems.length === 0) {
        const message = '🛒 *Your Shopping Cart*\n\nYour cart is empty. Start shopping to add items!';
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
        return;
      }

      let cartMessage = '🛒 *Your Shopping Cart*\n\n';
      let totalAmount = 0;

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const product = await storage.getProduct(item.productId);
        
        if (product) {
          const itemTotal = parseFloat(product.price) * item.quantity;
          totalAmount += itemTotal;
          
          cartMessage += `${i + 1}. *${product.name}*\n`;
          cartMessage += `   Qty: ${item.quantity} × $${product.price} = $${itemTotal.toFixed(2)}\n\n`;
        }
      }

      cartMessage += `💰 *Total: $${totalAmount.toFixed(2)}*`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔄 Clear Cart', callback_data: 'clear_cart' },
            { text: '💳 Checkout', callback_data: 'checkout' }
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
      
    } catch (error) {
      console.error('Error fetching cart:', error);
      const message = '🛒 *Your Shopping Cart*\n\nUnable to load cart. Please try again.';
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
    console.log('Fetching weekly ratings...');
    const weeklyRatings = await storage.getWeeklyProductRatings();
    console.log('Weekly ratings found:', weeklyRatings.length);
    
    if (weeklyRatings.length === 0) {
      const message = '⭐ *Weekly Product Ratings*\n\nNo products have been rated this week yet.\n\nBe the first to rate a product! Browse our catalog and share your experience.';
      
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
      return;
    }

    let message = '⭐ *Weekly Product Ratings*\n\nHere are the most rated products this week:\n\n';
    
    weeklyRatings.slice(0, 10).forEach((rating, index) => {
      const stars = '⭐'.repeat(Math.round(rating.averageRating));
      const starsDisplay = stars.padEnd(5, '☆');
      
      message += `${index + 1}. *${rating.productName}*\n`;
      message += `   ${starsDisplay} ${rating.averageRating}/5\n`;
      message += `   👥 ${rating.totalRatings} ${rating.totalRatings === 1 ? 'person' : 'people'} rated\n`;
      
      // Show star distribution
      const starBreakdown = [];
      for (let i = 5; i >= 1; i--) {
        const count = rating.ratingCounts[i] || 0;
        if (count > 0) {
          starBreakdown.push(`${i}⭐: ${count}`);
        }
      }
      if (starBreakdown.length > 0) {
        message += `   📊 ${starBreakdown.join(' | ')}\n`;
      }
      message += '\n';
    });

    if (weeklyRatings.length > 10) {
      message += `... and ${weeklyRatings.length - 10} more rated products.`;
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Browse Products to Rate', callback_data: 'listings' }],
        [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
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
      // Handle +/- quantity selector
      else if (data?.startsWith('select_qty_')) {
        const parts = data.split('_');
        const productId = parts[2];
        const quantity = parseInt(parts[3]);
        await this.handleAdvancedQuantitySelection(chatId, userId, productId, quantity);
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
        const parts = data.split('_');
        const productId = parts[1];
        const quantity = parts[2] ? parseInt(parts[2]) : 1;
        await this.handleAddToWishlist(chatId, userId, productId, quantity);
      }
      // Handle no action (for current quantity display)
      else if (data === 'no_action') {
        // Do nothing - this is for the current quantity display button
        return;
      }
      // Handle product rating
      else if (data?.startsWith('rate_product_')) {
        const parts = data.split('_');
        const productId = parts[2];
        const rating = parseInt(parts[3]);
        await this.handleProductRating(chatId, userId, productId, rating);
      }
      // Handle cart actions
      else if (data === 'clear_cart') {
        await this.handleClearCart(chatId, userId);
      }
      else if (data === 'checkout') {
        await this.handleCheckout(chatId, userId);
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
      { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
    ]);

    const keyboard = { inline_keyboard: productButtons };

    await this.sendAutoVanishMessage(chatId, productsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle individual product details with enhanced display and image support
  private async handleProductDetails(chatId: number, userId: string, productId: string) {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      await this.sendMainMenu(chatId);
      return;
    }

    const category = await storage.getCategories().then(cats => cats.find(c => c.id === product.categoryId));
    
    // Send product image if available
    if (product.imageUrl) {
      try {
        await this.bot?.sendPhoto(chatId, product.imageUrl, {
          caption: `📦 *${product.name}*\n\n📝 ${product.description}`,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        console.log('Image sending failed, continuing with text display');
      }
    }
    
    // Build comprehensive product message
    let message = `🏷️ *${product.name}*\n\n`;
    
    // Enhanced description display
    if (product.description) {
      message += `📝 *Description:*\n${product.description}\n\n`;
    }
    
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
      // Quantity selection with +/- controls
      actionButtons.push([
        { text: '🔢 Select Quantity', callback_data: `select_qty_${productId}_1` }
      ]);

      // Main action buttons
      actionButtons.push([
        { text: '🛒 Add to Cart', callback_data: `addcart_${productId}_1` },
        { text: '❤️ Add to Wishlist', callback_data: `wishlist_${productId}_1` }
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

  // Handle add to wishlist with quantity support - automatically returns to main menu
  private async handleAddToWishlist(chatId: number, userId: string, productId: string, quantity: number = 1) {
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        await this.sendMainMenu(chatId);
        return;
      }

      // Add to wishlist with quantity
      await storage.addToWishlist({
        telegramUserId: userId,
        productId: productId,
        quantity: quantity
      });

      // Show success message and auto-return to main menu
      const message = `❤️ *Added to Wishlist!*\n\n• ${product.name}\n• Quantity: ${quantity}\n• Price: $${product.price} each\n\nReturning to main menu...`;
      
      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'Markdown'
      });

      // Auto-return to main menu after 2 seconds
      setTimeout(async () => {
        await this.sendMainMenu(chatId);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      await this.sendMainMenu(chatId);
    }
  }

  // Handle product rating
  private async handleProductRating(chatId: number, userId: string, productId: string, rating?: number) {
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
      // Save the rating to storage
      try {
        console.log(`Saving rating: Product ${productId}, User ${userId}, Rating ${rating}`);
        await storage.addProductRating({
          productId: productId,
          telegramUserId: userId,
          rating: rating
        });
        console.log('Rating saved successfully');

        // Process the rating
        const stars = '⭐'.repeat(rating);
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
      } catch (error) {
        console.error('Error saving rating:', error);
        const message = 'Failed to save your rating. Please try again.';
        await this.sendAutoVanishMessage(chatId, message);
      }
    }
  }

  // Handle cart clearing
  private async handleClearCart(chatId: number, userId: string) {
    try {
      await storage.clearCart(userId);
      const message = '🗑️ *Cart Cleared*\n\nAll items have been removed from your cart.';
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
    } catch (error) {
      console.error('Error clearing cart:', error);
      await this.sendMainMenu(chatId);
    }
  }

  // Handle checkout process
  private async handleCheckout(chatId: number, userId: string) {
    try {
      const cartItems = await storage.getCartItems(userId);
      
      if (cartItems.length === 0) {
        const message = '🛒 Your cart is empty. Add items before checkout.';
        await this.sendAutoVanishMessage(chatId, message);
        setTimeout(() => this.sendMainMenu(chatId), 2000);
        return;
      }

      // Create order and clear cart
      let totalAmount = 0;
      const orderItems = [];

      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          const itemTotal = parseFloat(product.price) * item.quantity;
          totalAmount += itemTotal;
          orderItems.push({
            productName: product.name,
            quantity: item.quantity,
            price: product.price,
            total: itemTotal.toFixed(2)
          });
        }
      }

      // Create order record
      await storage.createOrder({
        telegramUserId: userId,
        customerName: `User ${userId}`,
        contactInfo: `Telegram User ID: ${userId}`, // Add required contactInfo field
        totalAmount: totalAmount.toString(),
        status: 'pending',
        items: JSON.stringify(orderItems)
      });

      // Clear cart after successful order
      await storage.clearCart(userId);

      const message = `✅ *Order Placed Successfully!*\n\nOrder Total: $${totalAmount.toFixed(2)}\nStatus: Pending\n\nThank you for your purchase! We'll process your order shortly.`;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '📦 View Orders', callback_data: 'orders' }],
          [{ text: '📋 Continue Shopping', callback_data: 'listings' }],
          [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
        ]
      };

      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error during checkout:', error);
      const message = '❌ Checkout failed. Please try again or contact support.';
      await this.sendAutoVanishMessage(chatId, message);
      setTimeout(() => this.sendMainMenu(chatId), 2000);
    }
  }

  // Handle quantity selection interface
  private async handleQuantitySelection(chatId: number, userId: string, productId: string, currentQty: number) {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      await this.sendMainMenu(chatId);
      return;
    }

    // Validate quantity bounds
    if (currentQty > product.stock) {
      currentQty = product.stock;
    }
    if (currentQty < 1) {
      currentQty = 1;
    }

    const message = `🔢 *Quantity Selection*\n\n📦 *${product.name}*\n\n` +
                   `Current Selection: *${currentQty}*\n` +
                   `💰 Price: $${product.price} each\n` +
                   `💵 Total: $${(parseFloat(product.price) * currentQty).toFixed(2)}\n` +
                   `📦 Available: ${product.stock}`;

    // Create quantity control buttons with +/- system
    const quantityControls = [];
    
    // Quantity adjustment row
    const minusEnabled = currentQty > 1;
    const plusEnabled = currentQty < product.stock;
    
    quantityControls.push([
      { 
        text: minusEnabled ? '➖' : '🚫', 
        callback_data: minusEnabled ? `qty_change_minus_${productId}_${currentQty}` : 'disabled'
      },
      { 
        text: `${currentQty}`, 
        callback_data: 'disabled'
      },
      { 
        text: plusEnabled ? '➕' : '🚫', 
        callback_data: plusEnabled ? `qty_change_plus_${productId}_${currentQty}` : 'disabled'
      }
    ]);

    // Action buttons with current quantity
    quantityControls.push([
      { text: '🛒 Add to Cart', callback_data: `addcart_${productId}_${currentQty}` },
      { text: '❤️ Add to Wishlist', callback_data: `wishlist_${productId}_${currentQty}` }
    ]);

    // Navigation buttons
    quantityControls.push([
      { text: '🔙 Back to Product', callback_data: `product_${productId}` }
    ]);

    const keyboard = { inline_keyboard: quantityControls };

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle quantity changes (+ or -)
  private async handleQuantityChange(chatId: number, userId: string, productId: string, currentQty: number, action: string) {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      await this.sendMainMenu(chatId);
      return;
    }

    let newQty = currentQty;
    
    if (action === 'plus' && currentQty < product.stock) {
      newQty = currentQty + 1;
    } else if (action === 'minus' && currentQty > 1) {
      newQty = currentQty - 1;
    }

    // Refresh the quantity selection interface with new quantity
    await this.handleQuantitySelection(chatId, userId, productId, newQty);
  }

  // Handle advanced quantity selection with dedicated +/- controls (legacy method)
  private async handleAdvancedQuantitySelection(chatId: number, userId: string, productId: string, quantity: number) {
    // Redirect to the new quantity selection method
    await this.handleQuantitySelection(chatId, userId, productId, quantity);
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