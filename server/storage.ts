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
  getCartItems(telegramUserId: string): Promise<Cart[]>;
  addToCart(cartItem: InsertCart): Promise<Cart>;
  updateCartItem(telegramUserId: string, productId: string, quantity: number): Promise<Cart | undefined>;
  removeFromCart(telegramUserId: string, productId: string): Promise<boolean>;
  clearCart(telegramUserId: string): Promise<void>;
  getCartTotal(telegramUserId: string): Promise<{ itemCount: number; totalAmount: string }>;

  // Wishlist
  addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist>;
  getWishlistItems(telegramUserId: string): Promise<Wishlist[]>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByUser(telegramUserId: string): Promise<Order[]>;
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
  updateBotStats(stats: Partial<InsertBotStats>): Promise<BotStats>;
  incrementUserCount(): Promise<void>;
  incrementOrderCount(): Promise<void>;
  incrementMessageCount(): Promise<void>;
  addRevenue(amount: string): Promise<void>;

  // Product Ratings
  addProductRating(rating: InsertProductRating): Promise<ProductRating>;
  getProductRating(productId: string, telegramUserId: string): Promise<ProductRating | undefined>;
  getWeeklyProductRatings(): Promise<{
    productId: string;
    productName: string;
    averageRating: number;
    totalRatings: number;
    ratingCounts: Record<number, number>;
  }[]>;
  getProductRatings(productId: string): Promise<ProductRating[]>;

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

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private categories: Map<string, Category>;
  private cart: Map<string, Cart>; // key: `${telegramUserId}-${productId}`
  private wishlist: Map<string, Cart>; // key: `${telegramUserId}-${productId}`
  private orders: Map<string, Order>;
  private inquiries: Map<string, Inquiry>;
  private botSettings: Map<string, BotSettings>;
  private botStats: BotStats;
  private productRatings: Map<string, ProductRating>; // key: `${productId}-${telegramUserId}`
  private pricingTiers: Map<string, PricingTier>; // key: tierId
  private paymentMethods: Map<string, PaymentMethod>;
  private deliveryMethods: Map<string, DeliveryMethod>;

  constructor() {
    this.products = new Map();
    this.categories = new Map();
    this.cart = new Map();
    this.wishlist = new Map();
    this.orders = new Map();
    this.inquiries = new Map();
    this.botSettings = new Map();
    this.productRatings = new Map();
    this.pricingTiers = new Map();
    this.paymentMethods = new Map();
    this.botStats = {
      id: randomUUID(),
      totalUsers: 0,
      totalOrders: 0,
      totalMessages: 0,
      totalRevenue: "0",
      updatedAt: new Date(),
    };

    // Initialize with sample data
    this.initializeDefaultSettings();
    this.initializeSampleData();
    this.initializeSampleRatings();
    this.initializeSampleOrders();
    // Payment methods are now managed via database only
    this.initializeSamplePricingTiers();
  }

  // Payment methods are now managed via database only - no default initialization

  private initializeDefaultSettings() {
    const defaultSettings = [
      { key: "welcome_message", value: "🛍️ Welcome to TeleShop! Your one-stop shopping destination.\n\n📱 Use /catalog to browse products\n🛒 Use /cart to view your cart\n💬 Use /help for assistance\n\nHappy shopping!" },
      { key: "help_message", value: "🔹 Available Commands:\n\n/start - Welcome message\n/catalog - Browse products\n/categories - View categories\n/cart - View your cart\n/orders - Your order history\n/contact - Contact support\n/help - Show this message\n\n💡 Tips:\n• Add items to cart by typing product numbers\n• Use /checkout when ready to order\n• We're here to help with any questions!" },
      { key: "contact_message", value: "📞 Contact Information:\n\n📧 Email: support@teleshop.com\n📱 Phone: +1 (555) 123-4567\n🕒 Hours: Mon-Fri 9AM-6PM\n\n💬 Send us a message anytime and we'll respond within 24 hours!" },
      { key: "order_confirmation", value: "✅ Order confirmed! We'll process your order and contact you within 24 hours with shipping details." },
      { key: "payment_methods", value: "💳 Payment Methods:\n• Cash on Delivery\n• Bank Transfer\n• Credit/Debit Card\n• PayPal\n• Cryptocurrency" },
      { key: "bot_token", value: process.env.TELEGRAM_BOT_TOKEN || "" },
    ];

    defaultSettings.forEach(setting => {
      const botSetting: BotSettings = {
        id: randomUUID(),
        key: setting.key,
        value: setting.value,
        updatedAt: new Date(),
      };
      this.botSettings.set(setting.key, botSetting);
    });
  }

  // Payment Methods Implementation
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const results = await db.select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder));
    return results;
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    const results = await db.select().from(paymentMethods)
      .where(eq(paymentMethods.isActive, true))
      .orderBy(asc(paymentMethods.sortOrder));
    return results;
  }

  async getPaymentMethod(id: string): Promise<PaymentMethod | undefined> {
    const [result] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return result;
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const [newMethod] = await db.insert(paymentMethods).values(method).returning();
    return newMethod;
  }

  async updatePaymentMethod(id: string, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const [updated] = await db.update(paymentMethods)
      .set({
        ...method,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethods.id, id))
      .returning();
    return updated;
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    return result.rowCount > 0;
  }

  async reorderPaymentMethods(methods: { id: string; sortOrder: number }[]): Promise<void> {
    for (const { id, sortOrder } of methods) {
      await db.update(paymentMethods)
        .set({ 
          sortOrder,
          updatedAt: new Date()
        })
        .where(eq(paymentMethods.id, id));
    }
  }

  // Delivery Methods Implementation
  async getDeliveryMethods(): Promise<DeliveryMethod[]> {
    const results = await db.select().from(deliveryMethods).orderBy(asc(deliveryMethods.sortOrder));
    return results;
  }

  async getActiveDeliveryMethods(): Promise<DeliveryMethod[]> {
    const results = await db.select().from(deliveryMethods)
      .where(eq(deliveryMethods.isActive, true))
      .orderBy(asc(deliveryMethods.sortOrder));
    return results;
  }

  async getDeliveryMethod(id: string): Promise<DeliveryMethod | undefined> {
    const [result] = await db.select().from(deliveryMethods).where(eq(deliveryMethods.id, id));
    return result;
  }

  async createDeliveryMethod(method: InsertDeliveryMethod): Promise<DeliveryMethod> {
    const [result] = await db.insert(deliveryMethods)
      .values(method)
      .returning();
    return result;
  }

  async updateDeliveryMethod(id: string, method: Partial<InsertDeliveryMethod>): Promise<DeliveryMethod | undefined> {
    const updateData = { ...method };
    // Remove any undefined or null values and ensure proper date handling
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined || updateData[key as keyof typeof updateData] === null) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    
    const [result] = await db.update(deliveryMethods)
      .set(updateData)
      .where(eq(deliveryMethods.id, id))
      .returning();
    return result;
  }

  async deleteDeliveryMethod(id: string): Promise<boolean> {
    const result = await db.delete(deliveryMethods).where(eq(deliveryMethods.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async reorderDeliveryMethods(methods: { id: string; sortOrder: number }[]): Promise<void> {
    for (const { id, sortOrder } of methods) {
      await db.update(deliveryMethods)
        .set({ sortOrder })
        .where(eq(deliveryMethods.id, id));
    }
  }

  // Initialize other sample data methods...
  private initializeSampleData() {
    // Create sample categories  
    const categoryData = [
      { name: "Steroids Powder", description: "High-quality steroid powder compounds" },
      { name: "Acetate Powder", description: "Premium acetate-based powder formulations" },
      { name: "Injectable Solutions", description: "Ready-to-use injectable compounds" },
      { name: "PCT Products", description: "Post Cycle Therapy supplements" },
      { name: "Fat Burners", description: "Advanced fat burning compounds" }
    ];

    categoryData.forEach(cat => {
      const category: Category = {
        id: randomUUID(),
        name: cat.name,
        description: cat.description,
        isActive: true,
        createdAt: new Date(),
      };
      this.categories.set(category.id, category);
    });

    // Create sample products
    const steroidsCategory = Array.from(this.categories.values()).find(c => c.name === "Steroids Powder");
    const acetateCategory = Array.from(this.categories.values()).find(c => c.name === "Acetate Powder");
    const injectableCategory = Array.from(this.categories.values()).find(c => c.name === "Injectable Solutions");

    const sampleProducts = [
      {
        name: "Testosterone Enanthate Powder",
        description: "High-purity testosterone enanthate powder for advanced users. Pharmaceutical grade quality with full lab testing results included.",
        price: "89.99",
        compareAtPrice: "129.99",
        stock: 25,
        categoryId: steroidsCategory?.id || null,
        tags: JSON.stringify(["testosterone", "enanthate", "powder", "bulking"]),
        specifications: JSON.stringify({
          "Purity": "99.5%+",
          "CAS Number": "315-37-7",
          "Molecular Weight": "400.6 g/mol",
          "Storage": "Cool, dry place"
        }),
        isFeatured: true,
      },
      {
        name: "Trenbolone Acetate Powder",
        description: "Premium trenbolone acetate powder. Highly potent compound for experienced users seeking maximum results.",
        price: "199.99",
        compareAtPrice: "249.99", 
        stock: 15,
        categoryId: acetateCategory?.id || null,
        tags: JSON.stringify(["trenbolone", "acetate", "cutting", "strength"]),
        specifications: JSON.stringify({
          "Purity": "99.8%+",
          "CAS Number": "10161-34-9",
          "Half-life": "3 days",
          "Melting Point": "94-97°C"
        }),
        isFeatured: true,
      },
      {
        name: "Masteron Propionate Powder",
        description: "High-quality drostanolone propionate powder. Excellent for cutting cycles and muscle hardening effects.",
        price: "124.99",
        stock: 30,
        categoryId: acetateCategory?.id || null,
        tags: JSON.stringify(["masteron", "propionate", "cutting", "hardening"]),
        specifications: JSON.stringify({
          "Purity": "99.2%+",
          "CAS Number": "521-12-0",
          "Molecular Formula": "C23H36O3",
          "Appearance": "White crystalline powder"
        }),
      },
      {
        name: "Anavar Oxandrolone Powder",
        description: "Pure oxandrolone powder. Mild yet effective compound perfect for beginners and cutting phases.",
        price: "159.99",
        stock: 40,
        categoryId: steroidsCategory?.id || null,
        tags: JSON.stringify(["anavar", "oxandrolone", "mild", "cutting"]),
        specifications: JSON.stringify({
          "Purity": "99.3%+",
          "CAS Number": "53-39-4",
          "Molecular Formula": "C19H30O3",
          "Bioavailability": "High oral"
        }),
        isFeatured: true,
      }
    ];

    sampleProducts.forEach(prod => {
      const product: Product = {
        id: randomUUID(),
        ...prod,
        compareAtPrice: prod.compareAtPrice || null,
        minOrderQuantity: 1,
        maxOrderQuantity: null,
        imageUrl: null,
        isActive: true,
        isFeatured: prod.isFeatured || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.products.set(product.id, product);
    });
  }

  private initializeSampleRatings() {
    // Add some sample ratings for this week
    const products = Array.from(this.products.values());
    const sampleUserIds = ['12345', '67890', '11111', '22222', '33333'];
    
    // Create ratings for the past week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6); // 6 days ago

    products.slice(0, 8).forEach((product, productIndex) => {
      // Generate 3-15 ratings per product
      const ratingCount = Math.floor(Math.random() * 13) + 3;
      
      for (let i = 0; i < ratingCount; i++) {
        const userId = sampleUserIds[i % sampleUserIds.length] + productIndex + i;
        const rating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
        
        // Random date within the past week
        const randomDate = new Date(weekAgo.getTime() + Math.random() * (Date.now() - weekAgo.getTime()));
        
        const productRating: ProductRating = {
          id: randomUUID(),
          productId: product.id,
          telegramUserId: userId,
          rating: rating,
          createdAt: randomDate
        };
        
        const key = `${product.id}-${userId}`;
        this.productRatings.set(key, productRating);
      }
    });
  }

  private initializeSampleOrders() {
    const products = Array.from(this.products.values());
    if (products.length === 0) return;

    const sampleOrders = [
      {
        telegramUserId: "12345",
        customerName: "John Doe",
        contactInfo: "+1-555-1234",
        deliveryAddress: "123 Main St, City, State 12345",
        totalAmount: "129.99",
        status: "completed",
        paymentMethod: "card",
        items: JSON.stringify([
          { productId: products[0]?.id, productName: products[0]?.name, quantity: 1, price: products[0]?.price }
        ])
      },
      {
        telegramUserId: "67890",
        customerName: "Jane Smith",
        contactInfo: "+1-555-5678",
        deliveryAddress: "456 Oak Ave, City, State 67890",
        totalAmount: "275.00",
        status: "completed",
        paymentMethod: "bank",
        items: JSON.stringify([
          { productId: products[2]?.id, productName: products[2]?.name, quantity: 3, price: products[2]?.price }
        ])
      },
      {
        telegramUserId: "7996630474", // Current test user
        customerName: "Test User",
        contactInfo: "+1-555-7890",
        deliveryAddress: "789 Test St, Test City, TC 12345",
        totalAmount: "199.99",
        status: "delivered",
        paymentMethod: "card",
        items: JSON.stringify([
          { productId: products[1]?.id, productName: products[1]?.name, quantity: 1, price: products[1]?.price }
        ])
      },
      {
        telegramUserId: "7996630474", // Current test user
        customerName: "Test User",
        contactInfo: "+1-555-7890", 
        deliveryAddress: "789 Test St, Test City, TC 12345",
        totalAmount: "324.98",
        status: "shipped",
        paymentMethod: "bitcoin",
        items: JSON.stringify([
          { productId: products[0]?.id, productName: products[0]?.name, quantity: 2, price: products[0]?.price }
        ])
      }
    ];

    sampleOrders.forEach(orderData => {
      if (products.length > 0) {
        const order: Order = {
          id: randomUUID(),
          ...orderData,
          notes: null,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
          updatedAt: new Date()
        };
        this.orders.set(order.id, order);
      }
    });
  }

  private initializeSamplePricingTiers() {
    const products = Array.from(this.products.values());
    
    products.slice(0, 3).forEach((product) => {
      // Add pricing tiers for first few products
      const tiers = [
        {
          productId: product.id,
          minQuantity: 1,
          maxQuantity: 9,
          price: product.price,
        },
        {
          productId: product.id,
          minQuantity: 10,
          maxQuantity: 49,
          price: (parseFloat(product.price) * 0.9).toFixed(2), // 10% discount
        },
        {
          productId: product.id,
          minQuantity: 50,
          maxQuantity: null,
          price: (parseFloat(product.price) * 0.8).toFixed(2), // 20% discount
        },
      ];

      tiers.forEach(tierData => {
        const tier: PricingTier = {
          id: randomUUID(),
          ...tierData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.pricingTiers.set(tier.id, tier);
      });
    });
  }

  // Implement all required methods...
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.categoryId === categoryId && p.isActive);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isFeatured && p.isActive);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(p => 
      p.isActive && (
        p.name.toLowerCase().includes(lowercaseQuery) ||
        p.description.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      id: randomUUID(),
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated: Product = {
      ...existing,
      ...product,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(c => c.isActive);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = {
      id: randomUUID(),
      ...category,
      createdAt: new Date(),
    };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    
    const updated: Category = {
      ...existing,
      ...category,
    };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Cart
  async getCart(telegramUserId: string): Promise<Cart[]> {
    return Array.from(this.cart.values()).filter(c => c.telegramUserId === telegramUserId);
  }

  async getCartItems(telegramUserId: string): Promise<Cart[]> {
    return this.getCart(telegramUserId);
  }

  async addToCart(cartItem: InsertCart): Promise<Cart> {
    const key = `${cartItem.telegramUserId}-${cartItem.productId}`;
    const existing = this.cart.get(key);
    
    if (existing) {
      existing.quantity += cartItem.quantity;
      existing.updatedAt = new Date();
      return existing;
    }
    
    const newCartItem: Cart = {
      id: randomUUID(),
      ...cartItem,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cart.set(key, newCartItem);
    return newCartItem;
  }

  async updateCartItem(telegramUserId: string, productId: string, quantity: number): Promise<Cart | undefined> {
    const key = `${telegramUserId}-${productId}`;
    const existing = this.cart.get(key);
    
    if (!existing) return undefined;
    
    existing.quantity = quantity;
    existing.updatedAt = new Date();
    return existing;
  }

  async removeFromCart(telegramUserId: string, productId: string): Promise<boolean> {
    const key = `${telegramUserId}-${productId}`;
    return this.cart.delete(key);
  }

  async clearCart(telegramUserId: string): Promise<void> {
    const cartItems = Array.from(this.cart.entries());
    cartItems.forEach(([key, item]) => {
      if (item.telegramUserId === telegramUserId) {
        this.cart.delete(key);
      }
    });
  }

  async getCartTotal(telegramUserId: string): Promise<{ itemCount: number; totalAmount: string }> {
    const cartItems = await this.getCart(telegramUserId);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    let totalAmount = 0;
    for (const item of cartItems) {
      const product = await this.getProduct(item.productId);
      if (product) {
        totalAmount += parseFloat(product.price) * item.quantity;
      }
    }
    
    return { itemCount, totalAmount: totalAmount.toFixed(2) };
  }

  // Wishlist
  async addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist> {
    const key = `${wishlistItem.telegramUserId}-${wishlistItem.productId}`;
    const newWishlistItem: Wishlist = {
      id: randomUUID(),
      ...wishlistItem,
      createdAt: new Date(),
    };
    this.wishlist.set(key, newWishlistItem);
    return newWishlistItem;
  }

  async getWishlistItems(telegramUserId: string): Promise<Wishlist[]> {
    return Array.from(this.wishlist.values()).filter(w => w.telegramUserId === telegramUserId);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersByUser(telegramUserId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.telegramUserId === telegramUserId);
  }

  async getUserOrders(telegramUserId: string): Promise<Order[]> {
    return this.getOrdersByUser(telegramUserId);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = {
      id: randomUUID(),
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated: Order = {
      ...existing,
      ...order,
      updatedAt: new Date(),
    };
    this.orders.set(id, updated);
    return updated;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return this.updateOrder(id, { status });
  }

  // Inquiries
  async getInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values());
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const newInquiry: Inquiry = {
      id: randomUUID(),
      ...inquiry,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inquiries.set(newInquiry.id, newInquiry);
    return newInquiry;
  }

  async updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const existing = this.inquiries.get(id);
    if (!existing) return undefined;
    
    const updated: Inquiry = {
      ...existing,
      ...inquiry,
      updatedAt: new Date(),
    };
    this.inquiries.set(id, updated);
    return updated;
  }

  async getUnreadInquiriesCount(): Promise<number> {
    return Array.from(this.inquiries.values()).filter(i => i.status === "new").length;
  }

  // Bot Settings
  async getBotSettings(): Promise<BotSettings[]> {
    return Array.from(this.botSettings.values());
  }

  async getBotSetting(key: string): Promise<BotSettings | undefined> {
    return this.botSettings.get(key);
  }

  async setBotSetting(setting: InsertBotSettings): Promise<BotSettings> {
    const existing = this.botSettings.get(setting.key);
    if (existing) {
      existing.value = setting.value;
      existing.updatedAt = new Date();
      return existing;
    }
    
    const newSetting: BotSettings = {
      id: randomUUID(),
      ...setting,
      updatedAt: new Date(),
    };
    this.botSettings.set(setting.key, newSetting);
    return newSetting;
  }

  // Bot Statistics
  async getBotStats(): Promise<BotStats | undefined> {
    return this.botStats;
  }

  async updateBotStats(stats: Partial<InsertBotStats>): Promise<BotStats> {
    this.botStats = { ...this.botStats, ...stats, updatedAt: new Date() };
    return this.botStats;
  }

  async incrementUserCount(): Promise<void> {
    this.botStats.totalUsers += 1;
    this.botStats.updatedAt = new Date();
  }

  async incrementOrderCount(): Promise<void> {
    this.botStats.totalOrders += 1;
    this.botStats.updatedAt = new Date();
  }

  async incrementMessageCount(): Promise<void> {
    this.botStats.totalMessages += 1;
    this.botStats.updatedAt = new Date();
  }

  async addRevenue(amount: string): Promise<void> {
    this.botStats.totalRevenue = (parseFloat(this.botStats.totalRevenue) + parseFloat(amount)).toString();
    this.botStats.updatedAt = new Date();
  }

  // Product Ratings
  async addProductRating(rating: InsertProductRating): Promise<ProductRating> {
    const key = `${rating.productId}-${rating.telegramUserId}`;
    const newRating: ProductRating = {
      id: randomUUID(),
      ...rating,
      createdAt: new Date(),
    };
    this.productRatings.set(key, newRating);
    return newRating;
  }

  async getProductRating(productId: string, telegramUserId: string): Promise<ProductRating | undefined> {
    const key = `${productId}-${telegramUserId}`;
    return this.productRatings.get(key);
  }

  async getWeeklyProductRatings(): Promise<{
    productId: string;
    productName: string;
    averageRating: number;
    totalRatings: number;
    ratingCounts: Record<number, number>;
  }[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyRatings = Array.from(this.productRatings.values())
      .filter(rating => rating.createdAt >= weekAgo);

    const grouped = new Map<string, ProductRating[]>();
    weeklyRatings.forEach(rating => {
      const existing = grouped.get(rating.productId) || [];
      existing.push(rating);
      grouped.set(rating.productId, existing);
    });

    const results = [];
    for (const [productId, ratings] of grouped) {
      const product = this.products.get(productId);
      if (!product) continue;

      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
      
      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => {
        ratingCounts[rating.rating]++;
      });

      results.push({
        productId,
        productName: product.name,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        ratingCounts,
      });
    }

    return results.sort((a, b) => b.averageRating - a.averageRating);
  }

  async getProductRatings(productId: string): Promise<ProductRating[]> {
    return Array.from(this.productRatings.values()).filter(r => r.productId === productId);
  }

  // Pricing Tiers
  async getPricingTiers(productId: string): Promise<PricingTier[]> {
    return Array.from(this.pricingTiers.values())
      .filter(t => t.productId === productId)
      .sort((a, b) => a.minQuantity - b.minQuantity);
  }

  async createPricingTier(tier: InsertPricingTier): Promise<PricingTier> {
    const newTier: PricingTier = {
      id: randomUUID(),
      ...tier,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pricingTiers.set(newTier.id, newTier);
    return newTier;
  }

  async updatePricingTier(id: string, tier: Partial<PricingTier>): Promise<PricingTier | undefined> {
    const existing = this.pricingTiers.get(id);
    if (!existing) return undefined;
    
    const updated: PricingTier = {
      ...existing,
      ...tier,
      updatedAt: new Date(),
    };
    this.pricingTiers.set(id, updated);
    return updated;
  }

  async deletePricingTier(id: string): Promise<boolean> {
    return this.pricingTiers.delete(id);
  }

  async getProductPriceForQuantity(productId: string, quantity: number): Promise<string | undefined> {
    const tiers = await this.getPricingTiers(productId);
    
    if (tiers.length === 0) {
      // No pricing tiers, return base product price
      const product = await this.getProduct(productId);
      return product?.price;
    }

    // Find the appropriate tier for this quantity
    for (const tier of tiers) {
      if (quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity)) {
        return tier.price;
      }
    }

    // If no tier matches, return the base product price
    const product = await this.getProduct(productId);
    return product?.price;
  }
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt));
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
    const result = await db.insert(products).values(product).returning();
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
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
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
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Cart
  async getCart(telegramUserId: string): Promise<Cart[]> {
    return await db.select().from(cart)
      .where(eq(cart.telegramUserId, telegramUserId))
      .orderBy(desc(cart.addedAt));
  }

  async getCartItems(telegramUserId: string): Promise<Cart[]> {
    return this.getCart(telegramUserId);
  }

  async addToCart(cartItem: InsertCart): Promise<Cart> {
    // Check if item already exists in cart
    const existing = await db.select().from(cart)
      .where(and(
        eq(cart.telegramUserId, cartItem.telegramUserId),
        eq(cart.productId, cartItem.productId)
      ));

    if (existing.length > 0) {
      // Update existing item
      const result = await db.update(cart)
        .set({ 
          quantity: existing[0].quantity + cartItem.quantity
        })
        .where(eq(cart.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Insert new item
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
      ))
      .returning();
    return result.length > 0;
  }

  async clearCart(telegramUserId: string): Promise<void> {
    await db.delete(cart).where(eq(cart.telegramUserId, telegramUserId));
  }

  async getCartTotal(telegramUserId: string): Promise<{ itemCount: number; totalAmount: string }> {
    const cartItems = await this.getCart(telegramUserId);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    let totalAmount = 0;
    for (const item of cartItems) {
      const product = await this.getProduct(item.productId);
      if (product) {
        const price = await this.getProductPriceForQuantity(item.productId, item.quantity);
        totalAmount += parseFloat(price || product.price) * item.quantity;
      }
    }
    
    return { itemCount, totalAmount: totalAmount.toFixed(2) };
  }

  // Wishlist
  async addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist> {
    const result = await db.insert(wishlist).values(wishlistItem).returning();
    return result[0];
  }

  async getWishlistItems(telegramUserId: string): Promise<Wishlist[]> {
    return await db.select().from(wishlist)
      .where(eq(wishlist.telegramUserId, telegramUserId))
      .orderBy(desc(wishlist.addedAt));
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByUser(telegramUserId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.telegramUserId, telegramUserId))
      .orderBy(desc(orders.createdAt));
  }

  async getUserOrders(telegramUserId: string): Promise<Order[]> {
    return this.getOrdersByUser(telegramUserId);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
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
      .set({ ...inquiry, updatedAt: new Date() })
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

  async updateBotStats(stats: Partial<InsertBotStats>): Promise<BotStats> {
    const existing = await this.getBotStats();
    
    if (existing) {
      const result = await db.update(botStats)
        .set({ ...stats, updatedAt: new Date() })
        .where(eq(botStats.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(botStats).values({
        ...stats,
        totalUsers: stats.totalUsers || 0,
        totalOrders: stats.totalOrders || 0,
        totalMessages: stats.totalMessages || 0,
        totalRevenue: stats.totalRevenue || "0",
      }).returning();
      return result[0];
    }
  }

  async incrementUserCount(): Promise<void> {
    const stats = await this.getBotStats();
    if (stats) {
      await this.updateBotStats({ totalUsers: stats.totalUsers + 1 });
    } else {
      await this.updateBotStats({ totalUsers: 1 });
    }
  }

  async incrementOrderCount(): Promise<void> {
    const stats = await this.getBotStats();
    if (stats) {
      await this.updateBotStats({ totalOrders: stats.totalOrders + 1 });
    } else {
      await this.updateBotStats({ totalOrders: 1 });
    }
  }

  async incrementMessageCount(): Promise<void> {
    const stats = await this.getBotStats();
    if (stats) {
      await this.updateBotStats({ totalMessages: stats.totalMessages + 1 });
    } else {
      await this.updateBotStats({ totalMessages: 1 });
    }
  }

  async addRevenue(amount: string): Promise<void> {
    const stats = await this.getBotStats();
    const currentRevenue = parseFloat(stats?.totalRevenue || "0");
    const newRevenue = currentRevenue + parseFloat(amount);
    
    await this.updateBotStats({ totalRevenue: newRevenue.toString() });
  }

  // Product Ratings
  async addProductRating(rating: InsertProductRating): Promise<ProductRating> {
    // Check if user has already rated this product
    const existing = await db.select().from(productRatings)
      .where(and(
        eq(productRatings.productId, rating.productId),
        eq(productRatings.telegramUserId, rating.telegramUserId)
      ));

    if (existing.length > 0) {
      // Update existing rating
      const result = await db.update(productRatings)
        .set({ rating: rating.rating })
        .where(eq(productRatings.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Insert new rating
      const result = await db.insert(productRatings).values(rating).returning();
      return result[0];
    }
  }

  async getProductRating(productId: string, telegramUserId: string): Promise<ProductRating | undefined> {
    const result = await db.select().from(productRatings)
      .where(and(
        eq(productRatings.productId, productId),
        eq(productRatings.telegramUserId, telegramUserId)
      ));
    return result[0];
  }

  async getWeeklyProductRatings(): Promise<{
    productId: string;
    productName: string;
    averageRating: number;
    totalRatings: number;
    ratingCounts: Record<number, number>;
  }[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get ratings from the past week with product info
    const ratings = await db.select({
      productId: productRatings.productId,
      productName: products.name,
      rating: productRatings.rating,
    })
    .from(productRatings)
    .innerJoin(products, eq(productRatings.productId, products.id))
    .where(lt(productRatings.createdAt, weekAgo))
    .orderBy(productRatings.productId);

    // Group by product and calculate stats
    const grouped = new Map<string, {
      productName: string;
      ratings: number[];
    }>();

    ratings.forEach(rating => {
      if (!grouped.has(rating.productId)) {
        grouped.set(rating.productId, {
          productName: rating.productName,
          ratings: [],
        });
      }
      grouped.get(rating.productId)!.ratings.push(rating.rating);
    });

    const results = [];
    for (const [productId, data] of grouped) {
      const totalRatings = data.ratings.length;
      const averageRating = data.ratings.reduce((sum, r) => sum + r, 0) / totalRatings;
      
      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      data.ratings.forEach(rating => {
        ratingCounts[rating]++;
      });

      results.push({
        productId,
        productName: data.productName,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        ratingCounts,
      });
    }

    return results.sort((a, b) => b.averageRating - a.averageRating);
  }

  async getProductRatings(productId: string): Promise<ProductRating[]> {
    return await db.select().from(productRatings)
      .where(eq(productRatings.productId, productId))
      .orderBy(desc(productRatings.createdAt));
  }

  // Pricing Tiers (full implementation for DatabaseStorage)
  async getPricingTiers(productId: string): Promise<PricingTier[]> {
    return await db.select().from(pricingTiers)
      .where(eq(pricingTiers.productId, productId))
      .orderBy(asc(pricingTiers.minQuantity));
  }

  async createPricingTier(tier: InsertPricingTier): Promise<PricingTier> {
    const result = await db.insert(pricingTiers).values(tier).returning();
    return result[0];
  }

  async updatePricingTier(id: string, tier: Partial<PricingTier>): Promise<PricingTier | undefined> {
    const result = await db.update(pricingTiers)
      .set({ ...tier, updatedAt: new Date() })
      .where(eq(pricingTiers.id, id))
      .returning();
    return result[0];
  }

  async deletePricingTier(id: string): Promise<boolean> {
    const result = await db.delete(pricingTiers).where(eq(pricingTiers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getProductPriceForQuantity(productId: string, quantity: number): Promise<string | undefined> {
    const tiers = await this.getPricingTiers(productId);
    
    if (tiers.length === 0) {
      // No pricing tiers, return base product price
      const product = await this.getProduct(productId);
      return product?.price;
    }

    // Find the appropriate tier for this quantity
    for (const tier of tiers) {
      if (quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity)) {
        return tier.price;
      }
    }

    // If no tier matches, return the base product price
    const product = await this.getProduct(productId);
    return product?.price;
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).orderBy(paymentMethods.sortOrder, paymentMethods.createdAt);
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods)
      .where(eq(paymentMethods.isActive, true))
      .orderBy(paymentMethods.sortOrder, paymentMethods.createdAt);
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
      .set({ ...method, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id))
      .returning();
    return result[0];
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id)).returning();
    return result.length > 0;
  }

  async reorderPaymentMethods(methods: { id: string; sortOrder: number }[]): Promise<void> {
    const promises = methods.map(method =>
      db.update(paymentMethods)
        .set({ sortOrder: method.sortOrder, updatedAt: new Date() })
        .where(eq(paymentMethods.id, method.id))
    );
    await Promise.all(promises);
  }

  // Delivery Methods
  async getDeliveryMethods(): Promise<DeliveryMethod[]> {
    return await db.select().from(deliveryMethods).orderBy(deliveryMethods.sortOrder, deliveryMethods.createdAt);
  }

  async getActiveDeliveryMethods(): Promise<DeliveryMethod[]> {
    return await db.select().from(deliveryMethods)
      .where(eq(deliveryMethods.isActive, true))
      .orderBy(deliveryMethods.sortOrder, deliveryMethods.createdAt);
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
      .set({ ...method, updatedAt: new Date() })
      .where(eq(deliveryMethods.id, id))
      .returning();
    return result[0];
  }

  async deleteDeliveryMethod(id: string): Promise<boolean> {
    const result = await db.delete(deliveryMethods).where(eq(deliveryMethods.id, id)).returning();
    return result.length > 0;
  }

  async reorderDeliveryMethods(methods: { id: string; sortOrder: number }[]): Promise<void> {
    const promises = methods.map(method =>
      db.update(deliveryMethods)
        .set({ sortOrder: method.sortOrder, updatedAt: new Date() })
        .where(eq(deliveryMethods.id, method.id))
    );
    await Promise.all(promises);
  }
}

export const storage = new DatabaseStorage();