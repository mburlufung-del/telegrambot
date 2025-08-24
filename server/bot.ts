import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage.js';

export class TeleShopBot {
  private bot: TelegramBot | null = null;
  private userMessages: Map<number, number[]> = new Map();
  private autoVanishTimers: Map<number, NodeJS.Timeout> = new Map();

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
      // setupAdditionalCallbacks() removed to prevent duplicate callback processing
      return true;
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error);
      this.bot = null;
      return false;
    }
  }

  async restart() {
    try {
      console.log('Restarting bot...');
      // Stop current bot
      if (this.bot) {
        await this.bot.stopPolling();
        this.bot = null;
      }
      
      // Clear timers
      this.autoVanishTimers.clear();
      this.userMessages.clear();
      
      // Reinitialize
      await this.initialize();
      console.log('Bot restart completed successfully');
      return true;
    } catch (error) {
      console.error('Bot restart failed:', error);
      throw error;
    }
  }

  // Get actual bot information from Telegram API
  async getBotInfo() {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }
    try {
      const me = await this.bot.getMe();
      return {
        id: me.id,
        username: me.username,
        first_name: me.first_name,
        is_bot: me.is_bot
      };
    } catch (error) {
      console.error('Failed to get bot info from Telegram:', error);
      throw error;
    }
  }

  // Broadcast message to users
  async broadcastMessage({
    message,
    imageUrl,
    targetType,
    customUsers
  }: {
    message: string;
    imageUrl?: string;
    targetType: 'all' | 'recent' | 'custom';
    customUsers?: string;
  }) {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }

    let targetUserIds: string[] = [];
    
    try {
      // Get target users based on type
      if (targetType === 'all') {
        // Get all users who have interacted with the bot (from orders)
        const orders = await storage.getOrders();
        const uniqueUserIds = new Set(orders.map(order => order.telegramUserId));
        targetUserIds = Array.from(uniqueUserIds);
      } else if (targetType === 'recent') {
        // Get users from recent orders (last 30 days)
        const orders = await storage.getOrders();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentOrders = orders.filter(order => 
          new Date(order.createdAt) > thirtyDaysAgo
        );
        const uniqueUserIds = new Set(recentOrders.map(order => order.telegramUserId));
        targetUserIds = Array.from(uniqueUserIds);
      } else if (targetType === 'custom' && customUsers) {
        // Parse custom user IDs
        targetUserIds = customUsers
          .split(/[,\n]/)
          .map((id: string) => id.trim())
          .filter((id: string) => id.length > 0);
      }

      if (targetUserIds.length === 0) {
        return { sentCount: 0, totalTargeted: 0, error: 'No target users found' };
      }

      let sentCount = 0;
      const totalTargeted = targetUserIds.length;

      console.log(`Attempting to broadcast to ${targetUserIds.length} users:`, targetUserIds);

      // Send to each user
      for (const userId of targetUserIds) {
        try {
          const chatId = parseInt(userId);
          console.log(`Attempting to send to user ${userId} (chatId: ${chatId})`);
          
          if (imageUrl && imageUrl.trim() !== '') {
            // Send image with caption
            // Convert relative path to full URL
            const baseUrl = process.env.WEBHOOK_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
            const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
            
            console.log(`Sending broadcast image to user ${userId}:`, fullImageUrl);
            
            // Test the image URL accessibility first
            try {
              const testResponse = await fetch(fullImageUrl, { method: 'HEAD' });
              console.log(`Image URL test for ${userId}: ${testResponse.status}`);
            } catch (testError) {
              console.log(`Image URL test failed: ${testError}`);
            }
            
            try {
              await this.bot.sendPhoto(chatId, fullImageUrl, {
                caption: message,
                parse_mode: 'Markdown'
              });
            } catch (photoError: any) {
              console.log(`Failed to send photo, trying as document:`, photoError?.message);
              // Fallback to sending as document if photo fails
              try {
                await this.bot.sendDocument(chatId, fullImageUrl, {
                  caption: message,
                  parse_mode: 'Markdown'
                });
              } catch (docError) {
                console.log(`Document also failed, sending text only:`, docError);
                await this.bot.sendMessage(chatId, `${message}\n\n[Image could not be sent - ${fullImageUrl}]`, {
                  parse_mode: 'Markdown'
                });
              }
            }
          } else {
            // Send text message only
            await this.bot.sendMessage(chatId, message, {
              parse_mode: 'Markdown'
            });
          }
          
          sentCount++;
          console.log(`Successfully sent broadcast to user ${userId}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error(`Failed to send broadcast to user ${userId}:`, error);
          
          // If chat not found, the user hasn't started the bot - this is expected
          if (error?.response?.body?.description?.includes('chat not found')) {
            console.log(`User ${userId} hasn't started the bot yet - skipping`);
          }
          // Continue with other users even if one fails
        }
      }

      return { 
        sentCount, 
        totalTargeted,
        message: sentCount === 0 ? 'No users have started the bot yet. Users must send /start to the bot before receiving broadcasts.' : undefined
      };
    } catch (error) {
      console.error('Broadcast error:', error);
      throw error;
    }
  }

  private async sendAutoVanishMessage(chatId: number, text: string, options: any = {}) {
    if (!this.bot) return;

    try {
      // Delete ALL previous messages for this user (instant vanish)
      const userMsgIds = this.userMessages.get(chatId) || [];
      for (const msgId of userMsgIds) {
        try {
          await this.bot.deleteMessage(chatId, msgId);
        } catch (error) {
          // Ignore deletion errors (message might be too old)
        }
      }

      // Clear the message tracking array since we deleted everything
      this.userMessages.set(chatId, []);

      // Clear existing timer for this user
      const existingTimer = this.autoVanishTimers.get(chatId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Send new message
      const message = await this.bot.sendMessage(chatId, text, options);
      
      // Track this message for future deletion
      this.userMessages.set(chatId, [message.message_id]);
      
      console.log(`[INSTANT-VANISH] Cleared previous messages and sent new message ${message.message_id} for user ${chatId}`);
      
      // Set up 5-hour auto-deletion timer
      const vanishTimer = setTimeout(async () => {
        await this.clearUserChatHistory(chatId);
      }, 5 * 60 * 60 * 1000); // 5 hours in milliseconds
      
      this.autoVanishTimers.set(chatId, vanishTimer);
      
      return message;
    } catch (error) {
      console.error('Error sending auto-vanish message:', error);
    }
  }

  private async handleCustomCommands(messageText: string): Promise<string | null> {
    try {
      console.log(`[handleCustomCommands] Processing message: "${messageText}"`);
      const botSettings = await storage.getBotSettings();
      console.log(`[handleCustomCommands] Loaded ${botSettings.length} bot settings`);
      
      // Check all three custom command slots
      for (let i = 1; i <= 3; i++) {
        const commandSetting = botSettings.find(s => s.key === `custom_command_${i}`);
        const responseSetting = botSettings.find(s => s.key === `custom_response_${i}`);
        
        console.log(`[handleCustomCommands] Slot ${i}: command="${commandSetting?.value}", response="${responseSetting?.value}"`);
        
        if (commandSetting?.value && responseSetting?.value) {
          const commandKeyword = commandSetting.value.toLowerCase().trim();
          console.log(`[handleCustomCommands] Comparing "${messageText}" with "${commandKeyword}"`);
          
          if (messageText === commandKeyword) {
            console.log(`[handleCustomCommands] MATCH! Returning response: "${responseSetting.value}"`);
            return responseSetting.value;
          }
        }
      }
      
      console.log(`[handleCustomCommands] No match found for message: "${messageText}"`);
      return null;
    } catch (error) {
      console.error('Error checking custom commands:', error);
      return null;
    }
  }

  // Test method for custom commands
  async testCustomCommand(message: string): Promise<string | null> {
    return await this.handleCustomCommands(message.toLowerCase());
  }

  private async clearUserChatHistory(chatId: number) {
    if (!this.bot) return;

    try {
      // Delete all tracked messages for this user (both bot and client)
      const userMsgIds = this.userMessages.get(chatId) || [];
      let deletedCount = 0;
      
      for (const msgId of userMsgIds) {
        try {
          await this.bot.deleteMessage(chatId, msgId);
          deletedCount++;
        } catch (error) {
          // Ignore deletion errors (message might be too old or already deleted)
          console.log(`Could not delete message ${msgId} for user ${chatId}:`, error instanceof Error ? error.message : error);
        }
      }

      // Clear tracking data
      this.userMessages.delete(chatId);
      this.autoVanishTimers.delete(chatId);

      // Send a brief notice about auto-cleanup (this message will also auto-vanish)
      const cleanupNotice = "🕐 Chat history automatically cleared after 5 hours.\n\n" +
                           "✅ Your order history is safely preserved and can be accessed anytime.\n\n" +
                           "Type /start to begin a new session.";
      
      const noticeMessage = await this.bot.sendMessage(chatId, cleanupNotice);
      
      // This notice will also auto-vanish after 1 hour
      setTimeout(async () => {
        try {
          await this.bot?.deleteMessage(chatId, noticeMessage.message_id);
        } catch (error) {
          // Ignore deletion errors
        }
      }, 60 * 60 * 1000); // 1 hour

      console.log(`[AUTO-VANISH] Cleared ${deletedCount}/${userMsgIds.length} messages for user ${chatId} after 5 hours`);
    } catch (error) {
      console.error('Error clearing user chat history:', error);
    }
  }



  private resetAutoVanishTimer(chatId: number) {
    // Clear existing timer
    const existingTimer = this.autoVanishTimers.get(chatId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new 5-hour timer
    const vanishTimer = setTimeout(async () => {
      await this.clearUserChatHistory(chatId);
    }, 5 * 60 * 60 * 1000); // 5 hours in milliseconds
    
    this.autoVanishTimers.set(chatId, vanishTimer);
  }

  private setupMessageHandlers() {
    if (!this.bot) return;

    // Handle /start command and main menu requests
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || '';
      const userName = msg.from?.first_name || 'there';
      
      // Track user's /start message for auto-vanish
      const userMsgIds = this.userMessages.get(chatId) || [];
      userMsgIds.push(msg.message_id);
      this.userMessages.set(chatId, userMsgIds);
      
      await storage.incrementMessageCount();
      
      // Update user statistics for dashboard integration
      try {
        const existingOrders = await storage.getUserOrders(userId);
        if (existingOrders.length === 0) {
          console.log(`[NEW USER] Welcome ${userName} (${userId}) - updating dashboard stats`);
        }
      } catch (error) {
        console.log(`[USER STATS] Error checking user stats: ${error}`);
      }
      
      // Send personalized welcome message with auto-vanish tracking
      const welcomeMessage = `🎉 Welcome to our Shop, ${userName}! 

🛍️ *Your one-stop destination for amazing products*

Use the buttons below to explore our catalog, manage your cart, or get support.`;
      
      // Send welcome message with auto-vanish
      await this.sendAutoVanishMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
      
      await this.sendMainMenu(chatId);
    });

    // Handle text messages
    this.bot.on('message', async (msg) => {
      console.log(`[MESSAGE] Received message from chat ${msg.chat.id}: "${msg.text}"`);
      
      if (msg.text?.startsWith('/')) {
        console.log(`[MESSAGE] Skipping command: ${msg.text}`);
        return; // Skip commands
      }

      const chatId = msg.chat.id;
      const userId = msg.from?.id.toString() || '';
      const messageText = msg.text?.toLowerCase() || '';
      
      // Track user's message for auto-vanish
      const userMsgIds = this.userMessages.get(chatId) || [];
      userMsgIds.push(msg.message_id);
      this.userMessages.set(chatId, userMsgIds);
      
      console.log(`[MESSAGE] Processing text: "${messageText}"`);
      await storage.incrementMessageCount();
      
      // Create customer inquiry if it's not a command or known keyword
      if (!messageText.startsWith('/') && messageText !== 'menu' && messageText !== 'main menu') {
        try {
          await storage.createInquiry({
            telegramUserId: userId,
            customerName: msg.from?.first_name || 'Anonymous',
            contactInfo: `Telegram User: ${userId}`,
            message: msg.text || ''
          });
          console.log(`[INQUIRY] Created new inquiry from user ${userId}`);
        } catch (error) {
          console.log(`[INQUIRY] Failed to create inquiry: ${error}`);
        }
      }

      // Check for menu keyword
      if (messageText === 'menu' || messageText === 'main menu') {
        console.log(`[MESSAGE] Menu keyword detected`);
        await this.sendMainMenu(chatId);
        return;
      }

      // Check for custom commands
      console.log(`[MESSAGE] Checking custom commands for message: "${messageText}"`);
      const customResponse = await this.handleCustomCommands(messageText);
      if (customResponse) {
        console.log(`[MESSAGE] Custom command matched! Response: ${customResponse}`);
        await this.sendAutoVanishMessage(chatId, customResponse, { parse_mode: 'Markdown' });
        return;
      }
      console.log('[MESSAGE] No custom command matched');

      // Send acknowledgment without showing menu for other messages
      const ackMessage = 'Message received! Use /start to see the main menu or type "menu" anytime.';
      console.log(`[MESSAGE] Sending acknowledgment`);
      await this.sendAutoVanishMessage(chatId, ackMessage);
    });

    // Handle callback queries for the command buttons
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id;
      const userId = query.from.id.toString();
      const data = query.data;
      
      if (!chatId || !data) return;
      
      await storage.incrementMessageCount();
      
      // Answer the callback query to remove loading state - skip if old query
      try {
        await this.bot?.answerCallbackQuery(query.id);
      } catch (error) {
        // Skip processing old/invalid callback queries
        return;
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
        // Update dashboard stats in real-time
        await storage.incrementMessageCount();
      } else if (data.startsWith('wishlist_')) {
        const parts = data.split('_');
        const productId = parts[1];
        const quantity = parseInt(parts[2]) || 1;
        await this.handleAddToWishlist(chatId, userId, productId, quantity);
      } else if (data.startsWith('rate_product_')) {
        const parts = data.split('_');
        if (parts.length === 4) {
          // Handle rating selection: rate_product_productId_rating
          const productId = parts[2];
          const rating = parseInt(parts[3]);
          await this.handleProductRating(chatId, userId, productId, rating);
        } else {
          // Handle show rating interface: rate_product_productId
          const productId = parts[2];
          await this.handleProductRating(chatId, userId, productId);
        }
      } else if (data.startsWith('cart_minus_')) {
        const parts = data.split('_');
        const productId = parts[2];
        const currentQty = parseInt(parts[3]) || 1;
        await this.handleCartQuantityChange(chatId, userId, productId, currentQty, 'minus');
      } else if (data.startsWith('cart_plus_')) {
        const parts = data.split('_');
        const productId = parts[2];
        const currentQty = parseInt(parts[3]) || 1;
        await this.handleCartQuantityChange(chatId, userId, productId, currentQty, 'plus');
      } else if (data.startsWith('cart_remove_')) {
        const productId = data.replace('cart_remove_', '');
        await this.handleCartRemoveItem(chatId, userId, productId);
      } else if (data === 'clear_cart') {
        await this.handleClearCart(chatId, userId);
      } else if (data === 'send_support_message') {
        await this.handleSendSupportMessage(chatId, userId);
      } else if (data === 'email_support') {
        await this.handleEmailSupport(chatId, userId);
      } else if (data === 'faq') {
        await this.handleFAQ(chatId, userId);
      } else if (data?.startsWith('select_qty_')) {
        const parts = data.split('_');
        const productId = parts[2];
        const quantity = parseInt(parts[3]);
        await this.handleAdvancedQuantitySelection(chatId, userId, productId, quantity);
      } else if (data === 'no_action') {
        // Do nothing - this is for the current quantity display button
        return;
      } else if (data === 'checkout' || data === 'start_checkout') {
        await this.handleCheckoutStart(chatId, userId);
      } else if (data?.startsWith('delivery_')) {
        const parts = data.replace('delivery_', '').split('_');
        const method = parts[0];
        const orderNumber = parts.length > 1 ? `#${parts[1]}` : `#${Date.now().toString().slice(-6)}`;
        await this.handleDeliverySelection(chatId, userId, method, orderNumber);
      } else if (data === 'enter_address') {
        await this.handleAddressEntry(chatId, userId);
      } else if (data === 'confirm_address') {
        await this.handleAddressConfirmation(chatId, userId);
      } else if (data?.startsWith('payment_method_')) {
        const parts = data.replace('payment_method_', '').split('_');
        const methodId = parts[0];
        const orderNumber = parts.length > 1 ? `#${parts[1]}` : `#${Date.now().toString().slice(-6)}`;
        await this.handlePaymentSelection(chatId, userId, methodId, orderNumber);
      } else if (data?.startsWith('complete_order')) {
        const parts = data.split('_');
        const orderNumber = parts.length > 2 ? `#${parts[2]}` : `#${Date.now().toString().slice(-6)}`;
        await this.handleOrderCompletion(chatId, userId, orderNumber);
      } else {
        // Unknown callback, show main menu again
        await this.sendMainMenu(chatId);
      }
    });
  }

  // Main menu method
  private async sendMainMenu(chatId: number) {
    // Get welcome message from database settings
    const botSettings = await storage.getBotSettings();
    const welcomeSetting = botSettings.find(s => s.key === 'welcome_message');
    const welcomeMessage = welcomeSetting?.value || '🛍️ Welcome to TeleShop!\n\nChoose an option below:';
    
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
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  }

  // Enhanced Listings command with full category → product → details → actions flow
  private async handleListingsCommand(chatId: number, userId: string) {
    const allCategories = await storage.getCategories();

    // Filter categories to only show those with active products
    const categoriesWithProducts = [];
    for (const category of allCategories) {
      const products = await storage.getProductsByCategory(category.id);
      // getProductsByCategory already filters for isActive=true, so all products are active
      if (products.length > 0) {
        categoriesWithProducts.push({
          ...category,
          productCount: products.length
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
      const cartItems = await storage.getCart(userId);
      
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
      const cartButtons: Array<Array<{text: string, callback_data: string}>> = [];

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const product = await storage.getProduct(item.productId);
        
        if (product) {
          // Use pricing tier price if available, otherwise use base price
          const tierPrice = await storage.getProductPriceForQuantity(item.productId, item.quantity);
          const effectivePrice = tierPrice || product.price;
          const itemTotal = parseFloat(effectivePrice) * item.quantity;
          totalAmount += itemTotal;
          
          cartMessage += `${i + 1}. *${product.name}*\n`;
          cartMessage += `   Qty: ${item.quantity} × $${effectivePrice} = $${itemTotal.toFixed(2)}\n\n`;

          // Add quantity control buttons for each item
          const minusEnabled = item.quantity > 1;
          const plusEnabled = item.quantity < product.stock;
          
          cartButtons.push([
            { 
              text: minusEnabled ? '➖' : '🚫', 
              callback_data: minusEnabled ? `cart_minus_${product.id}_${item.quantity}` : 'disabled'
            },
            { 
              text: `${product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name} (${item.quantity})`, 
              callback_data: 'disabled'
            },
            { 
              text: plusEnabled ? '➕' : '🚫', 
              callback_data: plusEnabled ? `cart_plus_${product.id}_${item.quantity}` : 'disabled'
            },
            { 
              text: '🗑️', 
              callback_data: `cart_remove_${product.id}` 
            }
          ]);
        }
      }

      cartMessage += `💰 *Total: $${totalAmount.toFixed(2)}*\n\n`;
      cartMessage += `🚀 *Ready to checkout?*\nComplete your order with delivery, payment, and contact options.`;

      // Add main action buttons
      cartButtons.push([
        { text: '🛒 Proceed to Checkout', callback_data: 'start_checkout' }
      ]);
      cartButtons.push([
        { text: '🔄 Clear Cart', callback_data: 'clear_cart' },
        { text: '📋 Continue Shopping', callback_data: 'listings' }
      ]);
      cartButtons.push([
        { text: '🔙 Back to Menu', callback_data: 'back_to_menu' }
      ]);

      const keyboard = { inline_keyboard: cartButtons };
      
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
    try {
      const userOrders = await storage.getUserOrders(userId);
      console.log(`Raw orders for user ${userId}:`, userOrders.length);
      
      if (userOrders.length === 0) {
        const message = '📦 *Your Orders*\n\nYou have no orders yet.\n\nStart shopping to create your first order!';
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

      // Show all orders regardless of status for debugging
      let message = `📦 Your Orders (${userOrders.length} total)\n\n`;
      
      for (let i = 0; i < userOrders.length; i++) {
        const order = userOrders[i];
        const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString();
        
        // Use stored order number if available, fallback to timestamp-based for older orders
        const orderNumber = order.orderNumber || 
          (order.createdAt ? 
            new Date(order.createdAt).getTime().toString().slice(-6) : 
            order.id.slice(-6).toUpperCase());
        
        message += `${i + 1}. Order #${orderNumber}\n`;
        message += `   💰 Total: $${order.totalAmount}\n`;
        message += `   📅 Date: ${orderDate}\n`;
        message += `   📋 Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\n\n`;
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '📋 Browse Products', callback_data: 'listings' }],
          [{ text: '🛒 View Cart', callback_data: 'carts' }],
          [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
        ]
      };
      
      console.log(`Sending orders message for user ${userId}: ${message.length} chars`);
      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } catch (error) {
      console.error('Error fetching user orders:', error);
      const message = '📦 *Your Orders*\n\nUnable to load orders. Please try again.';
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

  private async handleWishlistCommand(chatId: number, userId: string) {
    try {
      const wishlistItems = await storage.getWishlist(userId);
      
      if (wishlistItems.length === 0) {
        const message = '❤️ *Your Wishlist*\n\nYour wishlist is empty.\n\nBrowse products and add items you love to your wishlist!';
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

      let message = '❤️ *Your Wishlist*\n\n';
      
      for (let i = 0; i < wishlistItems.length; i++) {
        const item = wishlistItems[i];
        const product = await storage.getProduct(item.productId);
        
        if (product) {
          message += `${i + 1}. *${product.name}*\n`;
          message += `   💰 $${product.price}\n`;
          message += `   📦 Quantity: ${item.quantity}\n`;
          message += `   📊 Stock: ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}\n\n`;
        }
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '📋 Browse More Products', callback_data: 'listings' }],
          [{ text: '🛒 View Cart', callback_data: 'carts' }],
          [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
        ]
      };
      
      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      await this.sendMainMenu(chatId);
    }
  }

  private async handleRatingCommand(chatId: number, userId: string) {
    console.log('Fetching weekly ratings...');
    const weeklyRatings = await storage.getWeeklyRatings();
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

    let message = '⭐ *Weekly Product Ratings*\n\nProducts rated in the past 7 days:\n\n';
    
    console.log('Processing ratings for display:', weeklyRatings);
    weeklyRatings.slice(0, 10).forEach((rating: any, index: number) => {
      console.log(`Rating ${index + 1}:`, rating);
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
    // Dynamically load operator settings from database using correct keys
    const botSettings = await storage.getBotSettings();
    const operatorContactSetting = botSettings.find(s => s.key === 'operator_username');
    const operatorEmailSetting = botSettings.find(s => s.key === 'support_email');
    const responseTimeSetting = botSettings.find(s => s.key === 'response_time');
    const businessHoursSetting = botSettings.find(s => s.key === 'support_hours');
    
    const operatorContact = operatorContactSetting?.value || '@murzion';
    const operatorEmail = operatorEmailSetting?.value || 'support@teleshop.com';
    const responseTime = responseTimeSetting?.value || '2-4 hours';
    const businessHours = businessHoursSetting?.value || 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed';
    
    // Helper function to escape Markdown special characters but preserve @ for usernames
    const escapeMarkdown = (text: string) => {
      return text.replace(/[_*[\]()~`>#+-=|{}.!\\]/g, '\\$&');
    };
    
    // Don't escape @ symbol for Telegram usernames - they need to be clickable
    const escapeMarkdownPreserveAt = (text: string) => {
      return text.replace(/[_*[\]()~`>#+-=|{}.!\\]/g, '\\$&');
    };
    
    const message = `👤 <b>Contact Operator</b>

Need help? Our support team is here for you!

📞 <b>Support Contact:</b>
• Telegram: ${operatorContact}
• Email: ${operatorEmail}

🕒 <b>Business Hours:</b>
${businessHours}

💬 <b>For Quick Help:</b>
• Order issues: Reply with your order number
• Product questions: Ask about specific items
• Technical support: Describe your problem

⚡ <b>Average Response Time:</b> ${responseTime}`;
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '💬 Send Message to Support', callback_data: 'send_support_message' }],
        [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
      ]
    };

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'HTML',
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
      // addcart_ handled in main callback handler - removed to prevent duplicates
      // wishlist_ handled in main callback handler - removed to prevent duplicates
      // Handle add to wishlist - auto-returns to main menu
      else if (data?.startsWith('wishlist_old_')) {
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

      // Handle cart actions
      else if (data === 'clear_cart') {
        await this.handleClearCart(chatId, userId);
      }
      else if (data === 'checkout' || data === 'start_checkout') {
        await this.handleCheckoutStart(chatId, userId);
      }
      
      // Handle checkout flow
      else if (data?.startsWith('delivery_method_')) {
        const parts = data.replace('delivery_method_', '').split('_');
        const methodId = parts[0];
        const orderNumber = parts.length > 1 ? `#${parts[1]}` : `#${Date.now().toString().slice(-6)}`;
        await this.handleDeliverySelection(chatId, userId, methodId, orderNumber);
      } else if (data?.startsWith('delivery_')) {
        // Support legacy delivery format during transition
        const parts = data.replace('delivery_', '').split('_');
        const method = parts[0];
        const orderNumber = parts.length > 1 ? `#${parts[1]}` : `#${Date.now().toString().slice(-6)}`;
        await this.handleDeliverySelection(chatId, userId, method, orderNumber);
      }
      else if (data === 'enter_address') {
        await this.handleAddressEntry(chatId, userId);
      }
      else if (data === 'confirm_address') {
        await this.handleAddressConfirmation(chatId, userId);
      }
      else if (data?.startsWith('payment_')) {
        const parts = data.replace('payment_', '').split('_');
        const method = parts[0];
        const orderNumber = parts.length > 1 ? `#${parts[1]}` : `#${Date.now().toString().slice(-6)}`;
        await this.handlePaymentSelection(chatId, userId, method, orderNumber);
      }
      else if (data?.startsWith('complete_order')) {
        const parts = data.split('_');
        const orderNumber = parts.length > 2 ? `#${parts[2]}` : `#${Date.now().toString().slice(-6)}`;
        await this.handleOrderCompletion(chatId, userId, orderNumber);
      }
      
      // Handle operator support actions
      else if (data === 'send_support_message') {
        await this.handleSendSupportMessage(chatId, userId);
      }

    });
  }

  // Enhanced Listings Flow Methods

  // Handle category product listing
  private async handleCategoryProducts(chatId: number, userId: string, categoryId: string) {
    const category = await storage.getCategories().then(cats => cats.find(c => c.id === categoryId));
    const products = await storage.getProductsByCategory(categoryId);
    // getProductsByCategory already filters for active products, no need to filter again
    const activeProducts = products;

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
        // Convert relative path to full URL for Telegram compatibility
        const baseUrl = process.env.WEBHOOK_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
        const fullImageUrl = product.imageUrl.startsWith('http') ? product.imageUrl : `${baseUrl}${product.imageUrl}`;
        
        console.log(`Sending product image: ${fullImageUrl}`);
        
        await this.bot?.sendPhoto(chatId, fullImageUrl, {
          caption: `📦 *${product.name}*`,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        console.log('Image sending failed, continuing with text display:', error);
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

      // Check if item already exists in cart to show proper message
      const existingCartItems = await storage.getCart(userId);
      const existingItem = existingCartItems.find(item => item.productId === productId);
      
      await storage.addToCart({
        telegramUserId: userId,
        productId: productId,
        quantity: quantity
      });

      // Use pricing tier price if available, otherwise use base price
      const tierPrice = await storage.getProductPriceForQuantity(productId, quantity);
      const effectivePrice = tierPrice || product.price;
      const total = (parseFloat(effectivePrice) * quantity).toFixed(2);
      
      // Get updated cart to show final quantity
      const updatedCartItems = await storage.getCart(userId);
      const finalItem = updatedCartItems.find(item => item.productId === productId);
      const finalQuantity = finalItem ? finalItem.quantity : quantity;
      
      let message;
      if (existingItem) {
        // Calculate effective price for final quantity
        const tierPriceForFinal = await storage.getProductPriceForQuantity(productId, finalQuantity);
        const effectiveFinalPrice = tierPriceForFinal || product.price;
        message = `✅ *Added to Cart!*\n\n• ${product.name}\n• Added: ${quantity}\n• Total in cart: ${finalQuantity}\n• Item total: $${(parseFloat(effectiveFinalPrice) * finalQuantity).toFixed(2)}`;
      } else {
        message = `✅ *Added to Cart!*\n\n• ${product.name}\n• Quantity: ${quantity}\n• Total: $${total}`;
      }
      
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
        await storage.createProductRating({
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

  // Handle checkout process (multi-step checkout)
  private async handleCheckout(chatId: number, userId: string) {
    await this.handleCheckoutStart(chatId, userId);
  }

  // Start the multi-step checkout process  
  private async handleCheckoutStart(chatId: number, userId: string) {
    try {
      const cartItems = await storage.getCart(userId);
      
      if (cartItems.length === 0) {
        const message = '🛒 Your cart is empty. Add items before checkout.';
        await this.sendAutoVanishMessage(chatId, message);
        setTimeout(() => this.sendMainMenu(chatId), 2000);
        return;
      }

      // Calculate total with pricing tiers
      let total = 0;
      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          const tierPrice = await storage.getProductPriceForQuantity(item.productId, item.quantity);
          const effectivePrice = tierPrice || product.price;
          total += parseFloat(effectivePrice) * item.quantity;
        }
      }

      // Generate order number for this checkout session
      const orderNumber = `#${Date.now().toString().slice(-6)}`;

      // Get active delivery methods from database
      const deliveryMethods = await storage.getActiveDeliveryMethods();

      if (deliveryMethods.length === 0) {
        const message = '❌ No delivery methods available. Please contact support.';
        await this.sendAutoVanishMessage(chatId, message);
        return;
      }

      let message = `📦 *Choose Delivery Method*\n\n**Order Number:** ${orderNumber}\n**Cart Total:** $${total.toFixed(2)}\n\nSelect your preferred delivery option:`;

      const keyboard = {
        inline_keyboard: [] as any[]
      };

      // Add delivery methods from database
      for (const method of deliveryMethods) {
        const cost = parseFloat(method.price);
        const finalTotal = (total + cost).toFixed(2);
        
        message += `\n\n📦 **${method.name}**`;
        if (method.description) {
          message += ` - ${method.description}`;
        }
        message += `\n⏱️ Time: ${method.estimatedDays || 'As scheduled'}`;
        message += `\n💰 Cost: ${cost === 0 ? 'Free' : `$${cost}`}`;
        message += `\n💵 **Total with delivery: $${finalTotal}**`;
        
        keyboard.inline_keyboard.push([{
          text: `📦 ${method.name} - $${finalTotal}`,
          callback_data: `delivery_${method.id}_${orderNumber.replace('#', '')}`
        }]);
      }

      // Add back button
      keyboard.inline_keyboard.push([{ text: '🔙 Back to Cart', callback_data: 'cart' }]);

      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error during checkout start:', error);
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

    // Use pricing tier price if available, otherwise use base price
    const tierPrice = await storage.getProductPriceForQuantity(productId, currentQty);
    const effectivePrice = tierPrice || product.price;
    const totalPrice = (parseFloat(effectivePrice) * currentQty).toFixed(2);
    
    const message = `🔢 *Quantity Selection*\n\n📦 *${product.name}*\n\n` +
                   `Current Selection: *${currentQty}*\n` +
                   `💰 Price: $${effectivePrice} each\n` +
                   `💵 Total: $${totalPrice}\n` +
                   `📦 Available: ${product.stock}` +
                   (tierPrice ? `\n\n💡 *Bulk pricing applied!*` : '');

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

  // Handle cart quantity changes
  private async handleCartQuantityChange(chatId: number, userId: string, productId: string, currentQty: number, action: string) {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      await this.handleCartsCommand(chatId, userId);
      return;
    }

    let newQty = currentQty;
    
    if (action === 'plus' && currentQty < product.stock) {
      newQty = currentQty + 1;
    } else if (action === 'minus' && currentQty > 1) {
      newQty = currentQty - 1;
    }

    // Update the cart with new quantity
    await storage.updateCartItem(userId, productId, newQty);
    
    // Refresh the cart view
    await this.handleCartsCommand(chatId, userId);
  }

  // Handle cart item removal
  private async handleCartRemoveItem(chatId: number, userId: string, productId: string) {
    await storage.removeFromCart(userId, productId);
    
    // Refresh the cart view
    await this.handleCartsCommand(chatId, userId);
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

  // Operator Support Methods
  private async handleSendSupportMessage(chatId: number, userId: string) {
    // Dynamically load operator settings using correct keys
    const botSettings = await storage.getBotSettings();
    const operatorContactSetting = botSettings.find(s => s.key === 'operator_username');
    const responseTimeSetting = botSettings.find(s => s.key === 'response_time');
    
    const operatorContact = operatorContactSetting?.value || '@murzion';
    const responseTime = responseTimeSetting?.value || '2-4 hours';
    
    const message = `💬 *Send Message to Support*

Please describe your issue or question. Our support team will respond within ${responseTime}.

📞 **Direct Contact:**
• Contact ${operatorContact} directly on Telegram
• Your User ID: ${userId}

📝 **What to include:**
• Order number (if applicable)
• Product name (if applicable)
• Detailed description of your issue
• Any error messages you received

Type your message below and send it:`;

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Operator Menu', callback_data: 'operator' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
        ]
      }
    });

    // Set up message listener for support inquiry
    this.bot?.once('message', async (msg) => {
      if (msg.chat.id === chatId && msg.text && !msg.text.startsWith('/')) {
        await this.createSupportInquiry(chatId, userId, msg.text, msg.from?.username);
      }
    });
  }

  private async handleEmailSupport(chatId: number, userId: string) {
    // Dynamically load operator settings using correct keys
    const botSettings = await storage.getBotSettings();
    const operatorEmailSetting = botSettings.find(s => s.key === 'support_email');
    const responseTimeSetting = botSettings.find(s => s.key === 'response_time');
    
    const operatorEmail = operatorEmailSetting?.value || 'support@teleshop.com';
    const responseTime = responseTimeSetting?.value || '2-4 hours';
    
    const message = `📧 *Email Support*

You can reach our support team directly at:

**Email:** ${operatorEmail}

📋 **Email Template:**
Copy and paste this template for faster assistance:

\`\`\`
Subject: TeleShop Support Request

Customer ID: ${userId}
Issue Type: [Order/Product/Technical/Other]
Order Number: [If applicable]

Description:
[Describe your issue here]

Additional Details:
[Any additional information]
\`\`\`

⚡ **Response Time:** ${responseTime} during business hours`;

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬 Send Message Instead', callback_data: 'send_support_message' }],
          [{ text: '🔙 Back to Operator Menu', callback_data: 'operator' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
        ]
      }
    });
  }

  private async handleFAQ(chatId: number, userId: string) {
    const message = `❓ *Frequently Asked Questions*

**🛒 Ordering:**
• Q: How do I place an order?
• A: Browse products, add to cart, then checkout

• Q: Can I modify my order?
• A: Contact support within 1 hour of ordering

**📦 Shipping:**
• Q: How long does shipping take?
• A: 3-7 business days for standard shipping

• Q: Do you ship internationally?
• A: Currently shipping within the US only

**💳 Payment:**
• Q: What payment methods do you accept?
• A: Credit cards, PayPal, bank transfer, and crypto

**🔄 Returns:**
• Q: What's your return policy?
• A: 30-day returns for unopened products

**📱 Technical:**
• Q: Bot not responding?
• A: Try /start command or contact support

Need more help? Contact our support team!`;

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬 Contact Support', callback_data: 'send_support_message' }],
          [{ text: '🔙 Back to Operator Menu', callback_data: 'operator' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
        ]
      }
    });
  }

  private async createSupportInquiry(chatId: number, userId: string, message: string, username?: string) {
    try {
      const customerName = username ? `@${username} (ID: ${userId})` : `User ${userId}`;
      const contactInfo = username ? `@${username}` : `user${userId}@telegram.local`;
      
      await storage.createInquiry({
        customerName: customerName,
        message: message,
        telegramUserId: userId,
        contactInfo: contactInfo,
        isRead: false
      });

      // Load dynamic operator settings
      const botSettings = await storage.getBotSettings();
      const operatorContactSetting = botSettings.find(s => s.key === 'operator_username');
      const responseTimeSetting = botSettings.find(s => s.key === 'response_time');
      const operatorContact = operatorContactSetting?.value || '@murzion';
      const responseTime = responseTimeSetting?.value || '2-4 hours';
      
      const confirmMessage = `✅ *Message Sent Successfully!*

Your support request has been received. Our team will respond within ${responseTime}.

**Your message:** "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"

**Contact ${operatorContact} directly:** You can also message ${operatorContact} on Telegram${username ? ` mentioning your username @${username}` : ` with your User ID: ${userId}`}

**Ticket ID:** #${Date.now().toString().slice(-6)}

You can continue shopping while we prepare your response.`;

      await this.sendAutoVanishMessage(chatId, confirmMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Browse Products', callback_data: 'listings' }],
            [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error creating support inquiry:', error);
      await this.sendAutoVanishMessage(chatId, '❌ Error sending message. Please try again or contact support directly.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
          ]
        }
      });
    }
  }



  private async handleDeliverySelection(chatId: number, userId: string, methodId: string, orderNumber: string) {
    const deliveryMethods = await storage.getActiveDeliveryMethods();
    const selected = deliveryMethods.find(m => m.id === methodId);
    
    if (!selected) {
      await this.handleCheckoutStart(chatId, userId);
      return;
    }

    const deliveryInfo = {
      name: selected.name,
      time: selected.estimatedDays || 'As scheduled',
      cost: parseFloat(selected.price),
      requiresAddress: !selected.name.toLowerCase().includes('pickup') // Store pickup doesn't require address
    };

    if (!deliveryInfo.requiresAddress) {
      // Skip address for methods that don't require it (e.g., pickup)
      await this.handlePaymentMethodSelection(chatId, userId, methodId, orderNumber);
    } else {
      const message = `📍 *Customer Information & Delivery Address*

**Order Number:** ${orderNumber}
**Selected:** ${deliveryInfo.name} (${deliveryInfo.time})
**Cost:** ${deliveryInfo.cost === 0 ? 'Free' : `$${deliveryInfo.cost}`}

Please provide your information in this format:

📝 **Required Format:**
Full Name
Phone Number
Street Address
City, State ZIP
Country

**Example:**
John Smith
+1 (555) 123-4567
123 Main Street
New York, NY 10001
United States

Type your complete information below:`;

      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Change Delivery Method', callback_data: 'start_checkout' }]
          ]
        }
      });

      // Set up address listener
      this.bot?.once('message', async (msg) => {
        if (msg.chat.id === chatId && msg.text && !msg.text.startsWith('/')) {
          await this.handleAddressConfirmation(chatId, userId, msg.text, methodId, orderNumber, msg.from?.username);
        }
      });
    }
  }

  private async handleAddressEntry(chatId: number, userId: string) {
    // This method is for callback handling, actual address entry is handled in delivery selection
    await this.handleCheckoutStart(chatId, userId);
  }

  private async handleAddressConfirmation(chatId: number, userId: string, address?: string, deliveryMethod?: string, orderNumber?: string, username?: string) {
    if (!address || !deliveryMethod || !orderNumber) {
      await this.handleCheckoutStart(chatId, userId);
      return;
    }

    const lines = address.trim().split('\n');
    const customerName = lines[0] || `User ${userId}`;
    const customerPhone = lines[1] || 'Not provided';
    const customerAddress = lines.slice(2).join('\n') || address;

    const message = `✅ Confirm Customer Information

Order Number: ${orderNumber}
Customer Name: ${customerName}
Phone: ${customerPhone}
Username: ${username ? `@${username}` : 'Not available'}

Delivery Address:
${customerAddress}

Delivery Method: ${deliveryMethod}

Is this information correct?`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '✅ Confirm Information', callback_data: `confirm_info_${deliveryMethod}_${orderNumber.replace('#', '')}` }],
        [{ text: '✏️ Re-enter Information', callback_data: `start_checkout` }],
        [{ text: '🔙 Change Delivery Method', callback_data: 'start_checkout' }]
      ]
    };

    await this.sendAutoVanishMessage(chatId, message, {
      reply_markup: keyboard
    });

    // Store information temporarily (in production, use proper session storage)
    // For now, proceed to payment after confirmation
    setTimeout(() => {
      this.handlePaymentMethodSelection(chatId, userId, deliveryMethod, orderNumber, customerName, customerPhone, customerAddress, username);
    }, 3000);
  }

  private async handlePaymentMethodSelection(chatId: number, userId: string, deliveryMethod: string, orderNumber: string, customerName?: string, customerPhone?: string, customerAddress?: string, username?: string) {
    // Get active payment methods from database
    const paymentMethods = await storage.getActivePaymentMethods();
    
    let message = `💳 *Choose Payment Method*

**Order Number:** ${orderNumber}
**Customer:** ${customerName || `User ${userId}`}

Select your preferred payment option:`;

    const keyboard = {
      inline_keyboard: [] as any[]
    };

    // Add payment methods from database
    for (const method of paymentMethods) {
      message += `\n💳 **${method.name}**`;
      if (method.description) {
        message += ` - ${method.description}`;
      }
      
      keyboard.inline_keyboard.push([{
        text: `💳 ${method.name}`,
        callback_data: `payment_method_${method.id}_${orderNumber.replace('#', '')}`
      }]);
    }

    // Add back button
    keyboard.inline_keyboard.push([{ text: '🔙 Back to Delivery', callback_data: 'start_checkout' }]);

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handlePaymentSelection(chatId: number, userId: string, methodId: string, orderNumber: string) {
    const cartItems = await storage.getCart(userId);
    let total = 0;
    
    for (const item of cartItems) {
      const product = await storage.getProduct(item.productId);
      if (product) {
        // Use pricing tier price if available, otherwise use base price
        const tierPrice = await storage.getProductPriceForQuantity(item.productId, item.quantity);
        const effectivePrice = tierPrice || product.price;
        total += parseFloat(effectivePrice) * item.quantity;
      }
    }

    // Get payment method from database
    const paymentMethod = await storage.getPaymentMethod(methodId);
    if (!paymentMethod) {
      await this.handlePaymentMethodSelection(chatId, userId, 'standard', orderNumber);
      return;
    }

    // Use HTML formatting to avoid parsing issues
    let message = `💳 <b>${paymentMethod.name} Payment</b>

<b>Order Number:</b> ${orderNumber}
<b>Total Amount:</b> $${total.toFixed(2)}`;

    if (paymentMethod.description) {
      message += `\n\n${paymentMethod.description}`;
    }

    if (paymentMethod.paymentInfo) {
      message += `\n\n<b>Payment Information:</b>\n${paymentMethod.paymentInfo}`;
    }

    if (paymentMethod.instructions) {
      message += `\n\n<b>Instructions:</b>\n${paymentMethod.instructions}`;
    }

    // Load dynamic operator settings
    const botSettings = await storage.getBotSettings();
    const operatorContactSetting = botSettings.find(s => s.key === 'operator_username');
    const operatorContact = operatorContactSetting?.value || '@murzion';
    
    message += `\n\n📸 <b>After Payment:</b>
Send screenshot of payment confirmation to ${operatorContact}
Include your Order Number: ${orderNumber}`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '✅ Payment Completed', callback_data: `complete_order_${orderNumber.replace('#', '')}` }],
        [{ text: '👤 Contact Support', callback_data: 'operator' }],
        [{ text: '🔙 Change Payment Method', callback_data: `delivery_standard_${orderNumber.replace('#', '')}` }]
      ]
    };

    await this.sendAutoVanishMessage(chatId, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }

  private async handleOrderCompletion(chatId: number, userId: string, orderNumber: string) {
    try {
      const cartItems = await storage.getCart(userId);
      
      if (cartItems.length === 0) {
        await this.sendAutoVanishMessage(chatId, '🛒 No items in cart to checkout.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Browse Products', callback_data: 'listings' }]
            ]
          }
        });
        return;
      }

      // Create order items and calculate total
      const orderItems = [];
      let total = 0;

      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          // Use pricing tier price if available, otherwise use base price
          const tierPrice = await storage.getProductPriceForQuantity(item.productId, item.quantity);
          const effectivePrice = tierPrice || product.price;
          const itemTotal = parseFloat(effectivePrice) * item.quantity;
          total += itemTotal;
          orderItems.push({
            productId: product.id,
            productName: product.name,
            price: effectivePrice,
            quantity: item.quantity,
            total: itemTotal.toFixed(2)
          });
        }
      }

      // Create order with completed status since payment is confirmed
      console.log(`[ORDER] Creating new order for user ${userId} - ${orderNumber}`);
      const orderId = await storage.createOrder({
        orderNumber: orderNumber.replace('#', ''), // Store the consistent order number
        customerName: `User ${userId}`,
        telegramUserId: userId,
        contactInfo: 'Telegram contact',
        totalAmount: total.toFixed(2),
        status: 'completed',
        items: JSON.stringify(orderItems)
      });

      // Clear cart
      await storage.clearCart(userId);
      
      // Load dynamic operator settings
      const botSettings = await storage.getBotSettings();
      const operatorContactSetting = botSettings.find(s => s.key === 'operator_username');
      const operatorContact = operatorContactSetting?.value || '@murzion';
      
      const message = `🎉 <b>Order Confirmed!</b>

<b>Order Number:</b> ${orderNumber}
<b>Customer ID:</b> ${userId}
<b>Total:</b> $${total.toFixed(2)}
<b>Status:</b> Completed

📋 <b>Next Steps:</b>
1. Payment verification (if applicable)
2. Order processing (1-2 business days)
3. Shipping/Pickup preparation
4. Delivery tracking info

📞 <b>Support Contact:</b>
• Telegram: ${operatorContact}
• Include your order number: ${orderNumber}

<b>Estimated Processing:</b> 1-2 business days

Thank you for shopping with us! 🛍️`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '📦 View My Orders', callback_data: 'orders' }],
          [{ text: '👤 Contact Support', callback_data: 'operator' }],
          [{ text: '📋 Continue Shopping', callback_data: 'listings' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
        ]
      };

      await this.sendAutoVanishMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error completing order:', error);
      await this.sendAutoVanishMessage(chatId, '❌ Error processing order. Please contact support.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👤 Contact Support', callback_data: 'operator' }],
            [{ text: '🔙 Back to Cart', callback_data: 'carts' }]
          ]
        }
      });
    }
  }
}

export const teleShopBot = new TeleShopBot();