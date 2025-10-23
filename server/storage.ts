import { randomUUID } from "crypto";
import { and, asc, desc, eq, ilike, lt, sql } from "drizzle-orm";
import { db } from "./db";
import type {
  Cart,
  Category,
  Order,
  Product,
  Inquiry,
  BotSettings,
  BotStats,
  ProductRating,
  Wishlist,
  PricingTier,
  PaymentMethod,
  DeliveryMethod,
  Operator,
  OperatorSession,
  SupportMessage,
  AiChatSuggestion,
  TrackedUser,
  Broadcast,
  Language,
  Currency,
  ExchangeRate,
  UserPreferences,
  ProductTranslation,
  CategoryTranslation,
  InsertCart,
  InsertCategory,
  InsertOrder,
  InsertProduct,
  InsertInquiry,
  InsertBotSettings,
  InsertBotStats,
  InsertProductRating,
  InsertWishlist,
  InsertPricingTier,
  InsertPaymentMethod,
  InsertDeliveryMethod,
  InsertOperator,
  InsertOperatorSession,
  InsertSupportMessage,
  InsertAiChatSuggestion,
  InsertTrackedUser,
  InsertBroadcast,
  InsertLanguage,
  InsertCurrency,
  InsertExchangeRate,
  InsertUserPreferences,
  InsertProductTranslation,
  InsertCategoryTranslation,
} from "@shared/schema";
import {
  categories,
  products,
  orders,
  inquiries,
  botSettings,
  botStats,
  cart,
  wishlist,
  productRatings,
  pricingTiers,
  paymentMethods,
  deliveryMethods,
  operators,
  operatorSessions,
  supportMessages,
  aiChatSuggestions,
  trackedUsers,
  broadcasts,
  languages,
  currencies,
  exchangeRates,
  userPreferences,
  productTranslations,
  categoryTranslations,
} from "@shared/schema";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getParentCategories(): Promise<Category[]>;
  getSubcategories(parentId: string): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Cart
  getCart(telegramUserId: string): Promise<Cart[]>;
  addToCart(cartItem: InsertCart): Promise<Cart>;
  updateCartItem(telegramUserId: string, productId: string, quantity: number): Promise<Cart | undefined>;
  removeFromCart(telegramUserId: string, productId: string): Promise<boolean>;
  clearCart(telegramUserId: string): Promise<boolean>;
  getCartTotal(telegramUserId: string): Promise<{ itemCount: number; totalAmount: string }>;

  // Wishlist
  getWishlist(telegramUserId: string): Promise<Wishlist[]>;
  addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(telegramUserId: string, productId: string): Promise<boolean>;
  isInWishlist(telegramUserId: string, productId: string): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getUserOrders(telegramUserId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Inquiries
  getInquiries(): Promise<Inquiry[]>;
  getInquiry(id: string): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined>;
  getUnreadInquiriesCount(): Promise<number>;

  // Bot Settings
  getBotSettings(): Promise<BotSettings[]>;
  getBotSetting(key: string): Promise<BotSettings | undefined>;
  setBotSetting(setting: InsertBotSettings): Promise<BotSettings>;

  // Bot Statistics
  getBotStats(): Promise<BotStats | undefined>;
  incrementUserCount(): Promise<void>;
  incrementOrderCount(): Promise<void>;
  incrementMessageCount(): Promise<void>;
  addRevenue(amount: string): Promise<void>;
  updateBotStats(stats: InsertBotStats): Promise<BotStats>;

  // Product Ratings
  createProductRating(rating: InsertProductRating): Promise<ProductRating>;
  addProductRating(rating: InsertProductRating): Promise<ProductRating>;
  getProductRatings(productId: string): Promise<ProductRating[]>;
  getWeeklyRatings(): Promise<{
    productId: string;
    productName: string;
    averageRating: number;
    totalRatings: number;
    ratingCounts: { [key: number]: number };
  }[]>;
  getProductAverageRating(productId: string): Promise<{ averageRating: number; totalRatings: number }>;
  getUserProductRating(productId: string, telegramUserId: string): Promise<ProductRating | undefined>;
  updateUserProductRating(productId: string, telegramUserId: string, rating: number): Promise<ProductRating | undefined>;
  getTopRatedProducts(): Promise<{
    productId: string;
    productName: string;
    averageRating: number;
    totalRatings: number;
  }[]>;

  // Pricing Tiers
  getPricingTiers(productId: string): Promise<PricingTier[]>;
  createPricingTier(tier: InsertPricingTier): Promise<PricingTier>;
  updatePricingTier(id: string, tier: Partial<PricingTier>): Promise<PricingTier | undefined>;
  deletePricingTier(id: string): Promise<boolean>;
  getProductPriceForQuantity(productId: string, quantity: number): Promise<string | undefined>;

  // Payment Methods
  getPaymentMethods(): Promise<PaymentMethod[]>;
  getActivePaymentMethods(): Promise<PaymentMethod[]>;
  getPaymentMethod(id: string): Promise<PaymentMethod | undefined>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: string, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: string): Promise<boolean>;
  reorderPaymentMethods(methods: { id: string; sortOrder: number }[]): Promise<void>;

  // Delivery Methods
  getDeliveryMethods(): Promise<DeliveryMethod[]>;
  getActiveDeliveryMethods(): Promise<DeliveryMethod[]>;
  getDeliveryMethod(id: string): Promise<DeliveryMethod | undefined>;
  createDeliveryMethod(method: InsertDeliveryMethod): Promise<DeliveryMethod>;
  updateDeliveryMethod(id: string, method: Partial<InsertDeliveryMethod>): Promise<DeliveryMethod | undefined>;
  deleteDeliveryMethod(id: string): Promise<boolean>;
  reorderDeliveryMethods(methods: { id: string; sortOrder: number }[]): Promise<void>;

  // Operators
  getOperators(): Promise<Operator[]>;
  getActiveOperators(): Promise<Operator[]>;
  getOperator(id: string): Promise<Operator | undefined>;
  createOperator(operator: InsertOperator): Promise<Operator>;
  updateOperator(id: string, operator: Partial<InsertOperator>): Promise<Operator | undefined>;
  deleteOperator(id: string): Promise<boolean>;
  toggleOperatorStatus(id: string): Promise<Operator | undefined>;
  
  // User tracking operations
  trackUser(chatId: string, userData: any): Promise<void>;
  getTrackedUsers(): Promise<any[]>;
  
  // Broadcast operations
  getAllUsers(): Promise<any[]>;
  saveBroadcast(broadcast: any): Promise<void>;
  getBroadcastHistory(): Promise<any[]>;
  
  // Operator Support
  createOperatorSession(session: InsertOperatorSession): Promise<OperatorSession>;
  getOperatorSessions(status?: string): Promise<OperatorSession[]>;
  getOperatorSession(id: string): Promise<OperatorSession | undefined>;
  getUserActiveSession(telegramUserId: string): Promise<OperatorSession | undefined>;
  updateOperatorSession(id: string, updates: Partial<InsertOperatorSession>): Promise<OperatorSession | undefined>;
  
  // Support Messages
  addSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  getSupportMessages(sessionId: string): Promise<SupportMessage[]>;
  
  // AI Chat Suggestions
  createAiSuggestion(suggestion: InsertAiChatSuggestion): Promise<AiChatSuggestion>;
  getLatestAiSuggestion(sessionId: string): Promise<AiChatSuggestion | undefined>;
  markAiSuggestionAsUsed(suggestionId: string): Promise<boolean>;
  
  // Operator Management
  assignOperator(sessionId: string, operatorName: string): Promise<boolean>;
  closeOperatorSession(sessionId: string): Promise<boolean>;

  // Languages
  getLanguages(): Promise<Language[]>;
  getActiveLanguages(): Promise<Language[]>;
  getLanguage(code: string): Promise<Language | undefined>;
  getDefaultLanguage(): Promise<Language | undefined>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  updateLanguage(code: string, language: Partial<InsertLanguage>): Promise<Language | undefined>;
  deleteLanguage(code: string): Promise<boolean>;
  setDefaultLanguage(code: string): Promise<boolean>;

  // Currencies  
  getCurrencies(): Promise<Currency[]>;
  getActiveCurrencies(): Promise<Currency[]>;
  getCurrency(code: string): Promise<Currency | undefined>;
  getDefaultCurrency(): Promise<Currency | undefined>;
  createCurrency(currency: InsertCurrency): Promise<Currency>;
  updateCurrency(code: string, currency: Partial<InsertCurrency>): Promise<Currency | undefined>;
  deleteCurrency(code: string): Promise<boolean>;
  setDefaultCurrency(code: string): Promise<boolean>;

  // Exchange Rates
  getExchangeRates(): Promise<ExchangeRate[]>;
  getExchangeRate(currencyCode: string): Promise<ExchangeRate | undefined>;
  setExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate>;
  updateExchangeRates(rates: InsertExchangeRate[]): Promise<void>;

  // User Preferences
  getUserPreferences(telegramUserId: string): Promise<UserPreferences | undefined>;
  setUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(telegramUserId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  getUserLanguage(telegramUserId: string): Promise<string>; // Returns language code with fallback to default
  getUserCurrency(telegramUserId: string): Promise<string>; // Returns currency code with fallback to default

  // Product Translations
  getProductTranslations(productId: string): Promise<ProductTranslation[]>;
  getProductTranslation(productId: string, languageCode: string): Promise<ProductTranslation | undefined>;
  createProductTranslation(translation: InsertProductTranslation): Promise<ProductTranslation>;
  updateProductTranslation(id: string, translation: Partial<InsertProductTranslation>): Promise<ProductTranslation | undefined>;
  deleteProductTranslation(id: string): Promise<boolean>;
  deleteProductTranslations(productId: string): Promise<boolean>;

  // Category Translations
  getCategoryTranslations(categoryId: string): Promise<CategoryTranslation[]>;
  getCategoryTranslation(categoryId: string, languageCode: string): Promise<CategoryTranslation | undefined>;
  createCategoryTranslation(translation: InsertCategoryTranslation): Promise<CategoryTranslation>;
  updateCategoryTranslation(id: string, translation: Partial<InsertCategoryTranslation>): Promise<CategoryTranslation | undefined>;
  deleteCategoryTranslation(id: string): Promise<boolean>;
  deleteCategoryTranslations(categoryId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private botId: string;

  constructor(botId: string) {
    this.botId = botId;
  }

  // Helper: Add botId to WHERE clause for SELECT operations
  private withBotId(table: any, condition?: any) {
    const botIdCondition = eq(table.botId, this.botId);
    return condition ? and(condition, botIdCondition) : botIdCondition;
  }

  // Helper: Add botId to INSERT values
  private withBotIdValue<T extends Record<string, any>>(data: T): T & { botId: string } {
    return { ...data, botId: this.botId };
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(this.withBotId(products, eq(products.isActive, true)))
      .orderBy(desc(products.createdAt));
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(this.withBotId(products, and(eq(products.categoryId, categoryId), eq(products.isActive, true))))
      .orderBy(products.name);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(this.withBotId(products, and(eq(products.isFeatured, true), eq(products.isActive, true))))
      .orderBy(desc(products.createdAt));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(this.withBotId(products, and(
        eq(products.isActive, true),
        ilike(products.name, `%${query}%`)
      )))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(this.withBotId(products, eq(products.id, id)));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // PRODUCTION HOSTING: Ensure cart functionality for all new products
    const productWithDefaults = {
      ...product,
      // Override stock default to ensure cart buttons show
      stock: product.stock || 10,
      // Ensure active for immediate bot visibility  
      isActive: product.isActive !== undefined ? product.isActive : true,
      // Ensure minimum order quantity
      minOrderQuantity: product.minOrderQuantity || 1
    };
    
    const result = await db.insert(products).values(this.withBotIdValue(productWithDefaults)).returning();
    return result[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(this.withBotId(products, eq(products.id, id)))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.update(products)
      .set({ isActive: false })
      .where(this.withBotId(products, eq(products.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(this.withBotId(categories, eq(categories.isActive, true))).orderBy(categories.name);
  }

  async getParentCategories(): Promise<Category[]> {
    return await db.select().from(categories)
      .where(this.withBotId(categories, and(
        eq(categories.isActive, true),
        sql`${categories.parentId} IS NULL`
      )))
      .orderBy(categories.name);
  }

  async getSubcategories(parentId: string): Promise<Category[]> {
    return await db.select().from(categories)
      .where(this.withBotId(categories, and(
        eq(categories.isActive, true),
        eq(categories.parentId, parentId)
      )))
      .orderBy(categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(this.withBotId(categories, eq(categories.id, id)));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(this.withBotIdValue(category)).returning();
    return result[0];
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories)
      .set(category)
      .where(this.withBotId(categories, eq(categories.id, id)))
      .returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.update(categories)
      .set({ isActive: false })
      .where(this.withBotId(categories, eq(categories.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Cart
  async getCart(telegramUserId: string): Promise<Cart[]> {
    return await db.select().from(cart).where(this.withBotId(cart, eq(cart.telegramUserId, telegramUserId))).orderBy(desc(cart.addedAt));
  }

  async addToCart(cartItem: InsertCart): Promise<Cart> {
    // Check if item already exists in cart
    const existingItems = await db.select().from(cart)
      .where(this.withBotId(cart, and(
        eq(cart.telegramUserId, cartItem.telegramUserId),
        eq(cart.productId, cartItem.productId)
      )));

    if (existingItems.length > 0) {
      // Update quantity if item exists
      const newQuantity = existingItems[0].quantity + (cartItem.quantity || 1);
      const result = await db.update(cart)
        .set({ quantity: newQuantity })
        .where(this.withBotId(cart, and(
          eq(cart.telegramUserId, cartItem.telegramUserId),
          eq(cart.productId, cartItem.productId)
        )))
        .returning();
      return result[0];
    } else {
      // Add new item
      const result = await db.insert(cart).values(this.withBotIdValue(cartItem)).returning();
      return result[0];
    }
  }

  async updateCartItem(telegramUserId: string, productId: string, quantity: number): Promise<Cart | undefined> {
    const result = await db.update(cart)
      .set({ quantity })
      .where(this.withBotId(cart, and(
        eq(cart.telegramUserId, telegramUserId),
        eq(cart.productId, productId)
      )))
      .returning();
    return result[0];
  }

  async removeFromCart(telegramUserId: string, productId: string): Promise<boolean> {
    const result = await db.delete(cart)
      .where(this.withBotId(cart, and(
        eq(cart.telegramUserId, telegramUserId),
        eq(cart.productId, productId)
      )));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async clearCart(telegramUserId: string): Promise<boolean> {
    const result = await db.delete(cart).where(this.withBotId(cart, eq(cart.telegramUserId, telegramUserId)));
    return result.rowCount !== null && result.rowCount >= 0;
  }

  async getCartTotal(telegramUserId: string): Promise<{ itemCount: number; totalAmount: string }> {
    const cartItems = await this.getCart(telegramUserId);
    let itemCount = 0;
    let totalAmount = 0;

    for (const item of cartItems) {
      const product = await this.getProduct(item.productId);
      if (product) {
        itemCount += item.quantity;
        totalAmount += parseFloat(product.price) * item.quantity;
      }
    }

    return {
      itemCount,
      totalAmount: totalAmount.toFixed(2)
    };
  }

  // Wishlist
  async getWishlist(telegramUserId: string): Promise<Wishlist[]> {
    return await db.select().from(wishlist).where(this.withBotId(wishlist, eq(wishlist.telegramUserId, telegramUserId))).orderBy(desc(wishlist.addedAt));
  }

  async addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist> {
    const result = await db.insert(wishlist).values(this.withBotIdValue(wishlistItem)).returning();
    return result[0];
  }

  async removeFromWishlist(telegramUserId: string, productId: string): Promise<boolean> {
    const result = await db.delete(wishlist)
      .where(this.withBotId(wishlist, and(
        eq(wishlist.telegramUserId, telegramUserId),
        eq(wishlist.productId, productId)
      )));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async isInWishlist(telegramUserId: string, productId: string): Promise<boolean> {
    const result = await db.select().from(wishlist)
      .where(this.withBotId(wishlist, and(
        eq(wishlist.telegramUserId, telegramUserId),
        eq(wishlist.productId, productId)
      )));
    return result.length > 0;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).where(this.withBotId(orders)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByUserId(telegramUserId: string): Promise<Order[]> {
    return await db.select().from(orders).where(this.withBotId(orders, eq(orders.telegramUserId, telegramUserId))).orderBy(desc(orders.createdAt));
  }

  async getUserOrders(telegramUserId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(this.withBotId(orders, eq(orders.telegramUserId, telegramUserId)))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(this.withBotId(orders, eq(orders.id, id)));
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Use provided order number if available, otherwise generate unique order number
    const orderNumber = order.orderNumber || Math.floor(100000 + Math.random() * 900000).toString();
    const orderWithNumber = {
      ...order,
      orderNumber,
      status: order.status || "pending"
    };
    
    const result = await db.insert(orders).values(this.withBotIdValue(orderWithNumber)).returning();
    return result[0];
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(this.withBotId(orders, eq(orders.id, id)))
      .returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return this.updateOrder(id, { status });
  }

  // Inquiries
  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).where(this.withBotId(inquiries)).orderBy(desc(inquiries.createdAt));
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const result = await db.select().from(inquiries).where(this.withBotId(inquiries, eq(inquiries.id, id)));
    return result[0];
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const result = await db.insert(inquiries).values(this.withBotIdValue(inquiry)).returning();
    return result[0];
  }

  async updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const result = await db.update(inquiries)
      .set(inquiry)
      .where(this.withBotId(inquiries, eq(inquiries.id, id)))
      .returning();
    return result[0];
  }

  async getUnreadInquiriesCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(inquiries)
      .where(this.withBotId(inquiries, eq(inquiries.isRead, false)));
    return parseInt(result[0].count as string) || 0;
  }

  // Bot Settings
  async getBotSettings(): Promise<BotSettings[]> {
    return await db.select().from(botSettings).where(this.withBotId(botSettings)).orderBy(botSettings.key);
  }

  async getBotSetting(key: string): Promise<BotSettings | undefined> {
    const result = await db.select().from(botSettings).where(this.withBotId(botSettings, eq(botSettings.key, key)));
    return result[0];
  }

  async setBotSetting(setting: InsertBotSettings): Promise<BotSettings> {
    const existing = await this.getBotSetting(setting.key);
    
    if (existing) {
      const result = await db.update(botSettings)
        .set({ value: setting.value, updatedAt: new Date() })
        .where(this.withBotId(botSettings, eq(botSettings.key, setting.key)))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(botSettings).values(this.withBotIdValue(setting)).returning();
      return result[0];
    }
  }

  // Bot Statistics
  async getBotStats(): Promise<BotStats | undefined> {
    const result = await db.select().from(botStats).where(this.withBotId(botStats));
    return result[0];
  }

  async incrementUserCount(): Promise<void> {
    const existing = await this.getBotStats();
    if (existing) {
      await db.update(botStats)
        .set({
          totalUsers: existing.totalUsers + 1,
          updatedAt: new Date()
        })
        .where(this.withBotId(botStats, eq(botStats.id, existing.id)));
    } else {
      await db.insert(botStats).values(this.withBotIdValue({
        totalUsers: 1,
        totalOrders: 0,
        totalMessages: 0,
        totalRevenue: "0",
        updatedAt: new Date()
      }));
    }
  }

  async incrementOrderCount(): Promise<void> {
    const existing = await this.getBotStats();
    if (existing) {
      await db.update(botStats)
        .set({
          totalOrders: existing.totalOrders + 1,
          updatedAt: new Date()
        })
        .where(this.withBotId(botStats, eq(botStats.id, existing.id)));
    } else {
      await db.insert(botStats).values(this.withBotIdValue({
        totalUsers: 0,
        totalOrders: 1,
        totalMessages: 0,
        totalRevenue: "0",
        updatedAt: new Date()
      }));
    }
  }

  async incrementMessageCount(): Promise<void> {
    const existing = await this.getBotStats();
    if (existing) {
      await db.update(botStats)
        .set({
          totalMessages: existing.totalMessages + 1,
          updatedAt: new Date()
        })
        .where(this.withBotId(botStats, eq(botStats.id, existing.id)));
    } else {
      await db.insert(botStats).values(this.withBotIdValue({
        totalUsers: 0,
        totalOrders: 0,
        totalMessages: 1,
        totalRevenue: "0",
        updatedAt: new Date()
      }));
    }
  }

  async addRevenue(amount: string): Promise<void> {
    const existing = await this.getBotStats();
    if (existing) {
      const currentRevenue = parseFloat(existing.totalRevenue || "0");
      const newRevenue = currentRevenue + parseFloat(amount);
      await db.update(botStats)
        .set({
          totalRevenue: newRevenue.toString(),
          updatedAt: new Date()
        })
        .where(this.withBotId(botStats, eq(botStats.id, existing.id)));
    } else {
      await db.insert(botStats).values(this.withBotIdValue({
        totalUsers: 0,
        totalOrders: 0,
        totalMessages: 0,
        totalRevenue: amount,
        updatedAt: new Date()
      }));
    }
  }

  async updateBotStats(stats: InsertBotStats): Promise<BotStats> {
    const existing = await this.getBotStats();
    if (existing) {
      const result = await db.update(botStats)
        .set({
          ...stats,
          updatedAt: new Date()
        })
        .where(this.withBotId(botStats, eq(botStats.id, existing.id)))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(botStats).values(this.withBotIdValue({
        ...stats,
        updatedAt: new Date()
      })).returning();
      return result[0];
    }
  }

  // Product Ratings
  async createProductRating(rating: InsertProductRating): Promise<ProductRating> {
    const result = await db.insert(productRatings).values(this.withBotIdValue(rating)).returning();
    return result[0];
  }

  async addProductRating(rating: InsertProductRating): Promise<ProductRating> {
    return await this.createProductRating(rating);
  }

  async getProductRatings(productId: string): Promise<ProductRating[]> {
    return await db.select().from(productRatings)
      .where(this.withBotId(productRatings, eq(productRatings.productId, productId)))
      .orderBy(desc(productRatings.createdAt));
  }

  async getWeeklyRatings(): Promise<{
    productId: string;
    productName: string;
    averageRating: number;
    totalRatings: number;
    ratingCounts: { [key: number]: number };
  }[]> {
    // Get ratings from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentRatings = await db.select({
      productId: productRatings.productId,
      rating: productRatings.rating,
      productName: products.name
    })
    .from(productRatings)
    .innerJoin(products, eq(productRatings.productId, products.id))
    .where(this.withBotId(productRatings, sql`${productRatings.createdAt} >= ${weekAgo.toISOString()}`))
    .orderBy(desc(productRatings.createdAt));

    // Group by product and calculate averages
    const productMap = new Map<string, {
      productId: string;
      productName: string;
      ratings: number[];
      ratingCounts: { [key: number]: number };
    }>();

    for (const rating of recentRatings) {
      if (!productMap.has(rating.productId)) {
        productMap.set(rating.productId, {
          productId: rating.productId,
          productName: rating.productName,
          ratings: [],
          ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }
      
      const product = productMap.get(rating.productId)!;
      product.ratings.push(rating.rating);
      product.ratingCounts[rating.rating] = (product.ratingCounts[rating.rating] || 0) + 1;
    }

    // Calculate averages and return sorted by average rating
    return Array.from(productMap.values()).map(product => ({
      productId: product.productId,
      productName: product.productName,
      averageRating: product.ratings.length > 0 
        ? product.ratings.reduce((sum, r) => sum + r, 0) / product.ratings.length 
        : 0,
      totalRatings: product.ratings.length,
      ratingCounts: product.ratingCounts
    })).sort((a, b) => b.averageRating - a.averageRating);
  }

  async getProductAverageRating(productId: string): Promise<{ averageRating: number; totalRatings: number }> {
    const ratings = await this.getProductRatings(productId);
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;
    
    return { averageRating, totalRatings };
  }

  async getUserProductRating(productId: string, telegramUserId: string): Promise<ProductRating | undefined> {
    const result = await db.select().from(productRatings)
      .where(this.withBotId(productRatings, and(
        eq(productRatings.productId, productId),
        eq(productRatings.telegramUserId, telegramUserId)
      )));
    return result[0];
  }

  async updateUserProductRating(productId: string, telegramUserId: string, rating: number): Promise<ProductRating | undefined> {
    const existing = await this.getUserProductRating(productId, telegramUserId);
    if (existing) {
      const result = await db.update(productRatings)
        .set({ rating })
        .where(this.withBotId(productRatings, eq(productRatings.id, existing.id)))
        .returning();
      return result[0];
    }
    return undefined;
  }

  async getTopRatedProducts(): Promise<{
    productId: string;
    productName: string;
    averageRating: number;
    totalRatings: number;
  }[]> {
    const allProducts = await this.getProducts();
    const ratedProducts = [];
    
    for (const product of allProducts) {
      const ratings = await this.getProductRatings(product.id);
      if (ratings.length > 0) {
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        ratedProducts.push({
          productId: product.id,
          productName: product.name,
          averageRating,
          totalRatings: ratings.length
        });
      }
    }
    
    return ratedProducts.sort((a, b) => b.averageRating - a.averageRating);
  }

  // Pricing Tiers
  async getPricingTiers(productId: string): Promise<PricingTier[]> {
    return await db.select().from(pricingTiers)
      .where(this.withBotId(pricingTiers, and(eq(pricingTiers.productId, productId), eq(pricingTiers.isActive, true))))
      .orderBy(asc(pricingTiers.minQuantity));
  }

  async createPricingTier(tier: InsertPricingTier): Promise<PricingTier> {
    const result = await db.insert(pricingTiers).values(this.withBotIdValue(tier)).returning();
    return result[0];
  }

  async updatePricingTier(id: string, tier: Partial<PricingTier>): Promise<PricingTier | undefined> {
    const result = await db.update(pricingTiers)
      .set(tier)
      .where(this.withBotId(pricingTiers, eq(pricingTiers.id, id)))
      .returning();
    return result[0];
  }

  async deletePricingTier(id: string): Promise<boolean> {
    const result = await db.update(pricingTiers)
      .set({ isActive: false })
      .where(this.withBotId(pricingTiers, eq(pricingTiers.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getProductPriceForQuantity(productId: string, quantity: number): Promise<string | undefined> {
    const tiers = await this.getPricingTiers(productId);
    
    if (tiers.length === 0) {
      const product = await this.getProduct(productId);
      return product?.price;
    }

    for (const tier of tiers) {
      if (quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity)) {
        return tier.price;
      }
    }

    const product = await this.getProduct(productId);
    return product?.price;
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).where(this.withBotId(paymentMethods)).orderBy(asc(paymentMethods.sortOrder));
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods)
      .where(this.withBotId(paymentMethods, eq(paymentMethods.isActive, true)))
      .orderBy(asc(paymentMethods.sortOrder));
  }

  async getPaymentMethod(id: string): Promise<PaymentMethod | undefined> {
    const result = await db.select().from(paymentMethods).where(this.withBotId(paymentMethods, eq(paymentMethods.id, id)));
    return result[0];
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const result = await db.insert(paymentMethods).values(this.withBotIdValue(method)).returning();
    return result[0];
  }

  async updatePaymentMethod(id: string, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const result = await db.update(paymentMethods)
      .set(method)
      .where(this.withBotId(paymentMethods, eq(paymentMethods.id, id)))
      .returning();
    return result[0];
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const result = await db.delete(paymentMethods).where(this.withBotId(paymentMethods, eq(paymentMethods.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async reorderPaymentMethods(methods: { id: string; sortOrder: number }[]): Promise<void> {
    for (const method of methods) {
      await db.update(paymentMethods)
        .set({ sortOrder: method.sortOrder })
        .where(this.withBotId(paymentMethods, eq(paymentMethods.id, method.id)));
    }
  }

  // Delivery Methods
  async getDeliveryMethods(): Promise<DeliveryMethod[]> {
    return await db.select().from(deliveryMethods).where(this.withBotId(deliveryMethods)).orderBy(asc(deliveryMethods.sortOrder));
  }

  async getActiveDeliveryMethods(): Promise<DeliveryMethod[]> {
    return await db.select().from(deliveryMethods)
      .where(this.withBotId(deliveryMethods, eq(deliveryMethods.isActive, true)))
      .orderBy(asc(deliveryMethods.sortOrder));
  }

  async getDeliveryMethod(id: string): Promise<DeliveryMethod | undefined> {
    const result = await db.select().from(deliveryMethods).where(this.withBotId(deliveryMethods, eq(deliveryMethods.id, id)));
    return result[0];
  }

  async createDeliveryMethod(method: InsertDeliveryMethod): Promise<DeliveryMethod> {
    const result = await db.insert(deliveryMethods).values(this.withBotIdValue(method)).returning();
    return result[0];
  }

  async updateDeliveryMethod(id: string, method: Partial<InsertDeliveryMethod>): Promise<DeliveryMethod | undefined> {
    const result = await db.update(deliveryMethods)
      .set(method)
      .where(this.withBotId(deliveryMethods, eq(deliveryMethods.id, id)))
      .returning();
    return result[0];
  }

  async deleteDeliveryMethod(id: string): Promise<boolean> {
    const result = await db.delete(deliveryMethods).where(this.withBotId(deliveryMethods, eq(deliveryMethods.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async reorderDeliveryMethods(methods: { id: string; sortOrder: number }[]): Promise<void> {
    for (const method of methods) {
      await db.update(deliveryMethods)
        .set({ sortOrder: method.sortOrder })
        .where(this.withBotId(deliveryMethods, eq(deliveryMethods.id, method.id)));
    }
  }

  // Operators implementation
  async getOperators(): Promise<Operator[]> {
    return await db.select().from(operators).where(this.withBotId(operators)).orderBy(asc(operators.name));
  }

  async getActiveOperators(): Promise<Operator[]> {
    return await db.select().from(operators)
      .where(this.withBotId(operators, eq(operators.active, true)))
      .orderBy(asc(operators.name));
  }

  async getOperator(id: string): Promise<Operator | undefined> {
    const result = await db.select().from(operators).where(this.withBotId(operators, eq(operators.id, id)));
    return result[0];
  }

  async createOperator(operator: InsertOperator): Promise<Operator> {
    const result = await db.insert(operators).values(this.withBotIdValue(operator)).returning();
    const newOperator = result[0];
    
    // If this operator has admin role, set it as the primary operator
    if (newOperator.active && newOperator.role?.toLowerCase().includes('admin')) {
      await this.setBotSetting({ key: 'operator_username', value: newOperator.telegramUsername });
      console.log(`[OPERATOR] Set primary operator to ${newOperator.telegramUsername}`);
    }
    
    return newOperator;
  }

  async updateOperator(id: string, operator: Partial<InsertOperator>): Promise<Operator | undefined> {
    const result = await db.update(operators)
      .set({ ...operator, updatedAt: sql`now()` })
      .where(this.withBotId(operators, eq(operators.id, id)))
      .returning();
    
    const updatedOperator = result[0];
    
    // If this operator has admin role and is active, set it as the primary operator
    if (updatedOperator?.active && updatedOperator.role?.toLowerCase().includes('admin')) {
      await this.setBotSetting({ key: 'operator_username', value: updatedOperator.telegramUsername });
      console.log(`[OPERATOR] Updated primary operator to ${updatedOperator.telegramUsername}`);
    }
    
    return updatedOperator;
  }

  async deleteOperator(id: string): Promise<boolean> {
    const result = await db.delete(operators).where(this.withBotId(operators, eq(operators.id, id))).returning();
    return result.length > 0;
  }

  async toggleOperatorStatus(id: string): Promise<Operator | undefined> {
    const operator = await this.getOperator(id);
    if (!operator) return undefined;
    
    const result = await db.update(operators)
      .set({ active: !operator.active, updatedAt: sql`now()` })
      .where(this.withBotId(operators, eq(operators.id, id)))
      .returning();
    return result[0];
  }

  // User tracking implementation
  async trackUser(chatId: string, userData: any): Promise<void> {
    const userToInsert: InsertTrackedUser = {
      chatId,
      username: userData.username || null,
      firstName: userData.first_name || null,
      lastName: userData.last_name || null,
      lastSeen: new Date()
    };
    
    // Insert or update user (unique on botId + chatId)
    await db
      .insert(trackedUsers)
      .values(this.withBotIdValue(userToInsert))
      .onConflictDoUpdate({
        target: [trackedUsers.botId, trackedUsers.chatId],
        set: {
          username: userToInsert.username,
          firstName: userToInsert.firstName,
          lastName: userToInsert.lastName,
          lastSeen: userToInsert.lastSeen,
        },
      });
    
    console.log(`[USER TRACKING] User ${chatId} tracked:`, userToInsert);
  }

  async getTrackedUsers(): Promise<TrackedUser[]> {
    return await db.select().from(trackedUsers).where(this.withBotId(trackedUsers)).orderBy(desc(trackedUsers.lastSeen));
  }

  // Broadcast operations implementation
  async getAllUsers(): Promise<TrackedUser[]> {
    // Return tracked users for broadcast
    return this.getTrackedUsers();
  }

  async saveBroadcast(broadcast: any): Promise<void> {
    const broadcastToInsert: InsertBroadcast = {
      title: broadcast.title || 'Broadcast Message',
      message: broadcast.message,
      hasImage: broadcast.hasImage || false,
      recipientCount: broadcast.recipientCount || 0,
      sentCount: broadcast.sentCount || 0,
      status: broadcast.status || 'sent',
    };
    
    await db.insert(broadcasts).values(this.withBotIdValue(broadcastToInsert));
    console.log('Broadcast saved:', broadcast);
  }

  async getBroadcastHistory(): Promise<Broadcast[]> {
    return await db.select().from(broadcasts).where(this.withBotId(broadcasts)).orderBy(desc(broadcasts.createdAt)).limit(20);
  }

  // Operator Support implementation
  async createOperatorSession(session: InsertOperatorSession): Promise<OperatorSession> {
    const result = await db.insert(operatorSessions)
      .values(this.withBotIdValue({
        ...session,
        lastActivityAt: new Date(),
      }))
      .returning();
    return result[0];
  }

  async getOperatorSessions(status?: string): Promise<OperatorSession[]> {
    if (status) {
      return await db.select().from(operatorSessions)
        .where(this.withBotId(operatorSessions, eq(operatorSessions.status, status)))
        .orderBy(desc(operatorSessions.lastActivityAt));
    }
    return await db.select().from(operatorSessions)
      .where(this.withBotId(operatorSessions))
      .orderBy(desc(operatorSessions.lastActivityAt));
  }

  async getOperatorSession(id: string): Promise<OperatorSession | undefined> {
    const result = await db.select().from(operatorSessions)
      .where(this.withBotId(operatorSessions, eq(operatorSessions.id, id)));
    return result[0];
  }

  async getUserActiveSession(telegramUserId: string): Promise<OperatorSession | undefined> {
    const result = await db.select().from(operatorSessions)
      .where(this.withBotId(operatorSessions, and(
        eq(operatorSessions.telegramUserId, telegramUserId),
        eq(operatorSessions.status, "waiting")
      )))
      .orderBy(desc(operatorSessions.createdAt));
    return result[0];
  }

  async updateOperatorSession(id: string, updates: Partial<InsertOperatorSession>): Promise<OperatorSession | undefined> {
    const result = await db.update(operatorSessions)
      .set({
        ...updates,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(this.withBotId(operatorSessions, eq(operatorSessions.id, id)))
      .returning();
    return result[0];
  }

  // Support Messages implementation
  async addSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const result = await db.insert(supportMessages)
      .values(this.withBotIdValue(message))
      .returning();
    
    // Update session last activity
    await db.update(operatorSessions)
      .set({
        lastMessage: message.message,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(this.withBotId(operatorSessions, eq(operatorSessions.id, message.sessionId)));
    
    return result[0];
  }

  async getSupportMessages(sessionId: string): Promise<SupportMessage[]> {
    return await db.select().from(supportMessages)
      .where(this.withBotId(supportMessages, eq(supportMessages.sessionId, sessionId)))
      .orderBy(asc(supportMessages.createdAt));
  }

  // Operator Management implementation
  async assignOperator(sessionId: string, operatorName: string): Promise<boolean> {
    const result = await db.update(operatorSessions)
      .set({
        operatorName,
        status: "active",
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(this.withBotId(operatorSessions, eq(operatorSessions.id, sessionId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async closeOperatorSession(sessionId: string): Promise<boolean> {
    const result = await db.update(operatorSessions)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(this.withBotId(operatorSessions, eq(operatorSessions.id, sessionId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createAiSuggestion(suggestion: InsertAiChatSuggestion): Promise<AiChatSuggestion> {
    const result = await db.insert(aiChatSuggestions)
      .values(this.withBotIdValue(suggestion))
      .returning();
    return result[0];
  }

  async getLatestAiSuggestion(sessionId: string): Promise<AiChatSuggestion | undefined> {
    const results = await db.select()
      .from(aiChatSuggestions)
      .where(this.withBotId(aiChatSuggestions, eq(aiChatSuggestions.sessionId, sessionId)))
      .orderBy(desc(aiChatSuggestions.createdAt))
      .limit(1);
    return results[0];
  }

  async markAiSuggestionAsUsed(suggestionId: string): Promise<boolean> {
    const result = await db.update(aiChatSuggestions)
      .set({ wasUsed: true })
      .where(this.withBotId(aiChatSuggestions, eq(aiChatSuggestions.id, suggestionId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Languages implementation
  async getLanguages(): Promise<Language[]> {
    return await db.select().from(languages).orderBy(languages.name);
  }

  async getActiveLanguages(): Promise<Language[]> {
    return await db.select().from(languages).where(eq(languages.isActive, true)).orderBy(languages.name);
  }

  async getLanguage(code: string): Promise<Language | undefined> {
    const result = await db.select().from(languages).where(eq(languages.code, code));
    return result[0];
  }

  async getDefaultLanguage(): Promise<Language | undefined> {
    const result = await db.select().from(languages).where(eq(languages.isDefault, true));
    return result[0] || await db.select().from(languages).where(eq(languages.code, 'en'));
  }

  async createLanguage(language: InsertLanguage): Promise<Language> {
    const result = await db.insert(languages).values(language).returning();
    return result[0];
  }

  async updateLanguage(code: string, language: Partial<InsertLanguage>): Promise<Language | undefined> {
    const result = await db.update(languages)
      .set(language)
      .where(eq(languages.code, code))
      .returning();
    return result[0];
  }

  async deleteLanguage(code: string): Promise<boolean> {
    const result = await db.update(languages)
      .set({ isActive: false })
      .where(eq(languages.code, code));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async setDefaultLanguage(code: string): Promise<boolean> {
    // First, remove default from all languages
    await db.update(languages).set({ isDefault: false });
    // Then set the specified language as default
    const result = await db.update(languages)
      .set({ isDefault: true })
      .where(eq(languages.code, code));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Currencies implementation  
  async getCurrencies(): Promise<Currency[]> {
    return await db.select().from(currencies).orderBy(currencies.name);
  }

  async getActiveCurrencies(): Promise<Currency[]> {
    return await db.select().from(currencies).where(eq(currencies.isActive, true)).orderBy(currencies.name);
  }

  async getCurrency(code: string): Promise<Currency | undefined> {
    const result = await db.select().from(currencies).where(eq(currencies.code, code));
    return result[0];
  }

  async getDefaultCurrency(): Promise<Currency | undefined> {
    const result = await db.select().from(currencies).where(eq(currencies.isDefault, true));
    return result[0] || await db.select().from(currencies).where(eq(currencies.code, 'USD'));
  }

  async createCurrency(currency: InsertCurrency): Promise<Currency> {
    const result = await db.insert(currencies).values(currency).returning();
    return result[0];
  }

  async updateCurrency(code: string, currency: Partial<InsertCurrency>): Promise<Currency | undefined> {
    const result = await db.update(currencies)
      .set(currency)
      .where(eq(currencies.code, code))
      .returning();
    return result[0];
  }

  async deleteCurrency(code: string): Promise<boolean> {
    const result = await db.update(currencies)
      .set({ isActive: false })
      .where(eq(currencies.code, code));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async setDefaultCurrency(code: string): Promise<boolean> {
    // First, remove default from all currencies
    await db.update(currencies).set({ isDefault: false });
    // Then set the specified currency as default
    const result = await db.update(currencies)
      .set({ isDefault: true })
      .where(eq(currencies.code, code));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Exchange Rates implementation
  async getExchangeRates(): Promise<ExchangeRate[]> {
    return await db.select().from(exchangeRates);
  }

  async getExchangeRate(currencyCode: string): Promise<ExchangeRate | undefined> {
    const result = await db.select().from(exchangeRates).where(eq(exchangeRates.currencyCode, currencyCode));
    return result[0];
  }

  async setExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate> {
    const existing = await this.getExchangeRate(rate.currencyCode);
    
    if (existing) {
      const result = await db.update(exchangeRates)
        .set({ rate: rate.rate, lastUpdated: new Date() })
        .where(eq(exchangeRates.currencyCode, rate.currencyCode))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(exchangeRates).values(rate).returning();
      return result[0];
    }
  }

  async updateExchangeRates(rates: InsertExchangeRate[]): Promise<void> {
    for (const rate of rates) {
      await this.setExchangeRate(rate);
    }
  }

  // User Preferences implementation
  async getUserPreferences(telegramUserId: string): Promise<UserPreferences | undefined> {
    const result = await db.select().from(userPreferences).where(eq(userPreferences.telegramUserId, telegramUserId));
    return result[0];
  }

  async setUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(preferences.telegramUserId);
    
    if (existing) {
      const result = await db.update(userPreferences)
        .set({ ...preferences, updatedAt: new Date() })
        .where(eq(userPreferences.telegramUserId, preferences.telegramUserId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(userPreferences).values(preferences).returning();
      return result[0];
    }
  }

  async updateUserPreferences(telegramUserId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const result = await db.update(userPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(userPreferences.telegramUserId, telegramUserId))
      .returning();
    return result[0];
  }

  async getUserLanguage(telegramUserId: string): Promise<string> {
    const preferences = await this.getUserPreferences(telegramUserId);
    if (preferences) {
      return preferences.languageCode;
    }
    
    // Fallback to default language
    const defaultLang = await this.getDefaultLanguage();
    return defaultLang?.code || 'en';
  }

  async getUserCurrency(telegramUserId: string): Promise<string> {
    const preferences = await this.getUserPreferences(telegramUserId);
    if (preferences) {
      return preferences.currencyCode;
    }
    
    // Fallback to default currency
    const defaultCurrency = await this.getDefaultCurrency();
    return defaultCurrency?.code || 'USD';
  }

  // Product Translations implementation
  async getProductTranslations(productId: string): Promise<ProductTranslation[]> {
    return await db.select().from(productTranslations).where(eq(productTranslations.productId, productId));
  }

  async getProductTranslation(productId: string, languageCode: string): Promise<ProductTranslation | undefined> {
    const result = await db.select().from(productTranslations)
      .where(and(
        eq(productTranslations.productId, productId),
        eq(productTranslations.languageCode, languageCode)
      ));
    return result[0];
  }

  async createProductTranslation(translation: InsertProductTranslation): Promise<ProductTranslation> {
    const result = await db.insert(productTranslations).values(translation).returning();
    return result[0];
  }

  async updateProductTranslation(id: string, translation: Partial<InsertProductTranslation>): Promise<ProductTranslation | undefined> {
    const result = await db.update(productTranslations)
      .set({ ...translation, updatedAt: new Date() })
      .where(eq(productTranslations.id, id))
      .returning();
    return result[0];
  }

  async deleteProductTranslation(id: string): Promise<boolean> {
    const result = await db.delete(productTranslations).where(eq(productTranslations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteProductTranslations(productId: string): Promise<boolean> {
    const result = await db.delete(productTranslations).where(eq(productTranslations.productId, productId));
    return result.rowCount !== null && result.rowCount >= 0;
  }

  // Category Translations implementation
  async getCategoryTranslations(categoryId: string): Promise<CategoryTranslation[]> {
    return await db.select().from(categoryTranslations).where(eq(categoryTranslations.categoryId, categoryId));
  }

  async getCategoryTranslation(categoryId: string, languageCode: string): Promise<CategoryTranslation | undefined> {
    const result = await db.select().from(categoryTranslations)
      .where(and(
        eq(categoryTranslations.categoryId, categoryId),
        eq(categoryTranslations.languageCode, languageCode)
      ));
    return result[0];
  }

  async createCategoryTranslation(translation: InsertCategoryTranslation): Promise<CategoryTranslation> {
    const result = await db.insert(categoryTranslations).values(translation).returning();
    return result[0];
  }

  async updateCategoryTranslation(id: string, translation: Partial<InsertCategoryTranslation>): Promise<CategoryTranslation | undefined> {
    const result = await db.update(categoryTranslations)
      .set({ ...translation, updatedAt: new Date() })
      .where(eq(categoryTranslations.id, id))
      .returning();
    return result[0];
  }

  async deleteCategoryTranslation(id: string): Promise<boolean> {
    const result = await db.delete(categoryTranslations).where(eq(categoryTranslations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteCategoryTranslations(categoryId: string): Promise<boolean> {
    const result = await db.delete(categoryTranslations).where(eq(categoryTranslations.categoryId, categoryId));
    return result.rowCount !== null && result.rowCount >= 0;
  }
}

// Helper: Extract bot ID from Telegram bot token
// Token format: BOT_ID:SECRET_KEY (e.g., "8467452442:AAESTxYaWdTGsacW6YSqTnITpQdj-e8-Nkw")
function extractBotId(token: string | undefined): string {
  if (!token) {
    console.warn('⚠️  No TELEGRAM_BOT_TOKEN found, using default bot ID');
    return 'default';
  }
  const botId = token.split(':')[0];
  if (!botId) {
    console.error('❌ Invalid bot token format, using default bot ID');
    return 'default';
  }
  return botId;
}

// For multi-store architecture, extract bot ID from token
// In multi-bot deployment, each bot process has its own TELEGRAM_BOT_TOKEN env var
// and creates its own storage instance with isolated data
const botId = extractBotId(process.env.TELEGRAM_BOT_TOKEN);
console.log(`✅ Initializing storage for Bot ID: ${botId}`);
export const storage = new DatabaseStorage(botId);