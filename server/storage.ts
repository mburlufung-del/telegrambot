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

  // Product Ratings
  createProductRating(rating: InsertProductRating): Promise<ProductRating>;
  getProductRatings(productId: string): Promise<ProductRating[]>;
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
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)))
      .orderBy(products.name);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.isActive, true),
        ilike(products.name, `%${query}%`)
      ))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
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
    
    const result = await db.insert(products).values(productWithDefaults).returning();
    return result[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.update(categories)
      .set({ isActive: false })
      .where(eq(categories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Cart
  async getCart(telegramUserId: string): Promise<Cart[]> {
    return await db.select().from(cart).where(eq(cart.telegramUserId, telegramUserId)).orderBy(desc(cart.addedAt));
  }

  async addToCart(cartItem: InsertCart): Promise<Cart> {
    // Check if item already exists in cart
    const existingItems = await db.select().from(cart)
      .where(and(
        eq(cart.telegramUserId, cartItem.telegramUserId),
        eq(cart.productId, cartItem.productId)
      ));

    if (existingItems.length > 0) {
      // Update quantity if item exists
      const newQuantity = existingItems[0].quantity + (cartItem.quantity || 1);
      const result = await db.update(cart)
        .set({ quantity: newQuantity })
        .where(and(
          eq(cart.telegramUserId, cartItem.telegramUserId),
          eq(cart.productId, cartItem.productId)
        ))
        .returning();
      return result[0];
    } else {
      // Add new item
      const result = await db.insert(cart).values(cartItem).returning();
      return result[0];
    }
  }

  async updateCartItem(telegramUserId: string, productId: string, quantity: number): Promise<Cart | undefined> {
    const result = await db.update(cart)
      .set({ quantity })
      .where(and(
        eq(cart.telegramUserId, telegramUserId),
        eq(cart.productId, productId)
      ))
      .returning();
    return result[0];
  }

  async removeFromCart(telegramUserId: string, productId: string): Promise<boolean> {
    const result = await db.delete(cart)
      .where(and(
        eq(cart.telegramUserId, telegramUserId),
        eq(cart.productId, productId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async clearCart(telegramUserId: string): Promise<boolean> {
    const result = await db.delete(cart).where(eq(cart.telegramUserId, telegramUserId));
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
    return await db.select().from(wishlist).where(eq(wishlist.telegramUserId, telegramUserId)).orderBy(desc(wishlist.addedAt));
  }

  async addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist> {
    const result = await db.insert(wishlist).values(wishlistItem).returning();
    return result[0];
  }

  async removeFromWishlist(telegramUserId: string, productId: string): Promise<boolean> {
    const result = await db.delete(wishlist)
      .where(and(
        eq(wishlist.telegramUserId, telegramUserId),
        eq(wishlist.productId, productId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async isInWishlist(telegramUserId: string, productId: string): Promise<boolean> {
    const result = await db.select().from(wishlist)
      .where(and(
        eq(wishlist.telegramUserId, telegramUserId),
        eq(wishlist.productId, productId)
      ));
    return result.length > 0;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByUserId(telegramUserId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.telegramUserId, telegramUserId)).orderBy(desc(orders.createdAt));
  }

  async getUserOrders(telegramUserId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.telegramUserId, telegramUserId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
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
    
    const result = await db.insert(orders).values(orderWithNumber).returning();
    return result[0];
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return this.updateOrder(id, { status });
  }

  // Inquiries
  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const result = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return result[0];
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const result = await db.insert(inquiries).values(inquiry).returning();
    return result[0];
  }

  async updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const result = await db.update(inquiries)
      .set(inquiry)
      .where(eq(inquiries.id, id))
      .returning();
    return result[0];
  }

  async getUnreadInquiriesCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(inquiries)
      .where(eq(inquiries.isRead, false));
    return parseInt(result[0].count as string) || 0;
  }

  // Bot Settings
  async getBotSettings(): Promise<BotSettings[]> {
    return await db.select().from(botSettings).orderBy(botSettings.key);
  }

  async getBotSetting(key: string): Promise<BotSettings | undefined> {
    const result = await db.select().from(botSettings).where(eq(botSettings.key, key));
    return result[0];
  }

  async setBotSetting(setting: InsertBotSettings): Promise<BotSettings> {
    const existing = await this.getBotSetting(setting.key);
    
    if (existing) {
      const result = await db.update(botSettings)
        .set({ value: setting.value, updatedAt: new Date() })
        .where(eq(botSettings.key, setting.key))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(botSettings).values(setting).returning();
      return result[0];
    }
  }

  // Bot Statistics
  async getBotStats(): Promise<BotStats | undefined> {
    const result = await db.select().from(botStats);
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
        .where(eq(botStats.id, existing.id));
    } else {
      await db.insert(botStats).values({
        totalUsers: 1,
        totalOrders: 0,
        totalMessages: 0,
        totalRevenue: "0",
        updatedAt: new Date()
      });
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
        .where(eq(botStats.id, existing.id));
    } else {
      await db.insert(botStats).values({
        totalUsers: 0,
        totalOrders: 1,
        totalMessages: 0,
        totalRevenue: "0",
        updatedAt: new Date()
      });
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
        .where(eq(botStats.id, existing.id));
    } else {
      await db.insert(botStats).values({
        totalUsers: 0,
        totalOrders: 0,
        totalMessages: 1,
        totalRevenue: "0",
        updatedAt: new Date()
      });
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
        .where(eq(botStats.id, existing.id));
    } else {
      await db.insert(botStats).values({
        totalUsers: 0,
        totalOrders: 0,
        totalMessages: 0,
        totalRevenue: amount,
        updatedAt: new Date()
      });
    }
  }

  // Product Ratings
  async createProductRating(rating: InsertProductRating): Promise<ProductRating> {
    const result = await db.insert(productRatings).values(rating).returning();
    return result[0];
  }

  async getProductRatings(productId: string): Promise<ProductRating[]> {
    return await db.select().from(productRatings)
      .where(eq(productRatings.productId, productId))
      .orderBy(desc(productRatings.createdAt));
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
      .where(and(
        eq(productRatings.productId, productId),
        eq(productRatings.telegramUserId, telegramUserId)
      ));
    return result[0];
  }

  async updateUserProductRating(productId: string, telegramUserId: string, rating: number): Promise<ProductRating | undefined> {
    const existing = await this.getUserProductRating(productId, telegramUserId);
    if (existing) {
      const result = await db.update(productRatings)
        .set({ rating })
        .where(eq(productRatings.id, existing.id))
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
      .where(and(eq(pricingTiers.productId, productId), eq(pricingTiers.isActive, true)))
      .orderBy(asc(pricingTiers.minQuantity));
  }

  async createPricingTier(tier: InsertPricingTier): Promise<PricingTier> {
    const result = await db.insert(pricingTiers).values(tier).returning();
    return result[0];
  }

  async updatePricingTier(id: string, tier: Partial<PricingTier>): Promise<PricingTier | undefined> {
    const result = await db.update(pricingTiers)
      .set(tier)
      .where(eq(pricingTiers.id, id))
      .returning();
    return result[0];
  }

  async deletePricingTier(id: string): Promise<boolean> {
    const result = await db.update(pricingTiers)
      .set({ isActive: false })
      .where(eq(pricingTiers.id, id));
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
    return await db.select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder));
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods)
      .where(eq(paymentMethods.isActive, true))
      .orderBy(asc(paymentMethods.sortOrder));
  }

  async getPaymentMethod(id: string): Promise<PaymentMethod | undefined> {
    const result = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return result[0];
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const result = await db.insert(paymentMethods).values(method).returning();
    return result[0];
  }

  async updatePaymentMethod(id: string, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const result = await db.update(paymentMethods)
      .set(method)
      .where(eq(paymentMethods.id, id))
      .returning();
    return result[0];
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async reorderPaymentMethods(methods: { id: string; sortOrder: number }[]): Promise<void> {
    for (const method of methods) {
      await db.update(paymentMethods)
        .set({ sortOrder: method.sortOrder })
        .where(eq(paymentMethods.id, method.id));
    }
  }

  // Delivery Methods
  async getDeliveryMethods(): Promise<DeliveryMethod[]> {
    return await db.select().from(deliveryMethods).orderBy(asc(deliveryMethods.sortOrder));
  }

  async getActiveDeliveryMethods(): Promise<DeliveryMethod[]> {
    return await db.select().from(deliveryMethods)
      .where(eq(deliveryMethods.isActive, true))
      .orderBy(asc(deliveryMethods.sortOrder));
  }

  async getDeliveryMethod(id: string): Promise<DeliveryMethod | undefined> {
    const result = await db.select().from(deliveryMethods).where(eq(deliveryMethods.id, id));
    return result[0];
  }

  async createDeliveryMethod(method: InsertDeliveryMethod): Promise<DeliveryMethod> {
    const result = await db.insert(deliveryMethods).values(method).returning();
    return result[0];
  }

  async updateDeliveryMethod(id: string, method: Partial<InsertDeliveryMethod>): Promise<DeliveryMethod | undefined> {
    const result = await db.update(deliveryMethods)
      .set(method)
      .where(eq(deliveryMethods.id, id))
      .returning();
    return result[0];
  }

  async deleteDeliveryMethod(id: string): Promise<boolean> {
    const result = await db.delete(deliveryMethods).where(eq(deliveryMethods.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async reorderDeliveryMethods(methods: { id: string; sortOrder: number }[]): Promise<void> {
    for (const method of methods) {
      await db.update(deliveryMethods)
        .set({ sortOrder: method.sortOrder })
        .where(eq(deliveryMethods.id, method.id));
    }
  }
}

export const storage = new DatabaseStorage();