import { 
  type Product, 
  type InsertProduct, 
  type Inquiry, 
  type InsertInquiry,
  type Order,
  type InsertOrder,
  type Cart,
  type InsertCart,
  type Category,
  type InsertCategory,
  type BotSettings,
  type InsertBotSettings,
  type BotStats,
  type InsertBotStats,
  type ProductRating,
  type InsertProductRating,
  type OrderItem
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  getCartItems(telegramUserId: string): Promise<Cart[]>; // Alias for getCart
  addToCart(cartItem: InsertCart): Promise<Cart>;
  addToWishlist(cartItem: InsertCart): Promise<Cart>; // Add wishlist functionality
  getWishlistItems(telegramUserId: string): Promise<Cart[]>;
  updateCartItem(telegramUserId: string, productId: string, quantity: number): Promise<Cart | undefined>;
  removeFromCart(telegramUserId: string, productId: string): Promise<boolean>;
  clearCart(telegramUserId: string): Promise<void>;
  getCartTotal(telegramUserId: string): Promise<{ itemCount: number; totalAmount: string }>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByUser(telegramUserId: string): Promise<Order[]>;
  getUserOrders(telegramUserId: string): Promise<Order[]>; // Alias for getOrdersByUser
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

  // Bot Stats
  getBotStats(): Promise<BotStats | undefined>;
  updateBotStats(stats: Partial<InsertBotStats>): Promise<BotStats>;
  incrementUserCount(): Promise<void>;
  incrementOrderCount(): Promise<void>;
  incrementMessageCount(): Promise<void>;
  addRevenue(amount: string): Promise<void>;

  // Product Ratings
  addProductRating(rating: InsertProductRating): Promise<ProductRating>;
  getProductRating(productId: string, telegramUserId: string): Promise<ProductRating | undefined>;
  getWeeklyProductRatings(): Promise<{ productId: string; productName: string; averageRating: number; totalRatings: number; ratingCounts: Record<number, number> }[]>;
  getProductRatings(productId: string): Promise<ProductRating[]>;
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

  constructor() {
    this.products = new Map();
    this.categories = new Map();
    this.cart = new Map();
    this.wishlist = new Map();
    this.orders = new Map();
    this.inquiries = new Map();
    this.botSettings = new Map();
    this.productRatings = new Map();
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
  }

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

  private initializeSampleData() {
    // Create sample categories  
    const categories = [
      { name: "Steroids Powder", description: "High-quality steroid powder compounds" },
      { name: "Acetate Powder", description: "Premium acetate-based powder formulations" },
      { name: "Injectable Solutions", description: "Ready-to-use injectable compounds" },
      { name: "PCT Products", description: "Post Cycle Therapy supplements" },
      { name: "Fat Burners", description: "Advanced fat burning compounds" }
    ];

    categories.forEach(cat => {
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
        name: "Sustanon 250 Injectable",
        description: "Ready-to-inject testosterone blend. Four different testosterone esters for sustained release and stable blood levels.",
        price: "45.99",
        stock: 20,
        categoryId: injectableCategory?.id || null,
        tags: JSON.stringify(["sustanon", "injectable", "testosterone", "blend"]),
        specifications: JSON.stringify({
          "Concentration": "250mg/ml",
          "Volume": "10ml vial",
          "Carrier Oil": "Grape seed oil",
          "Sterility": "Lab tested"
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

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(p => p.categoryId === categoryId && p.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(p => p.isFeatured && p.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.products.values())
      .filter(p => 
        p.isActive && (
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          (p.tags && p.tags.toLowerCase().includes(searchTerm))
        )
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      stock: insertProduct.stock ?? 0,
      minOrderQuantity: insertProduct.minOrderQuantity ?? 1,
      maxOrderQuantity: insertProduct.maxOrderQuantity ?? null,
      compareAtPrice: insertProduct.compareAtPrice ?? null,
      imageUrl: insertProduct.imageUrl ?? null,
      categoryId: insertProduct.categoryId ?? null,
      tags: insertProduct.tags ?? null,
      specifications: insertProduct.specifications ?? null,
      isActive: insertProduct.isActive ?? true,
      isFeatured: insertProduct.isFeatured ?? false,
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, insertProduct: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    const updated: Product = { ...existing, ...insertProduct, updatedAt: new Date() };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter(c => c.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      id,
      name: insertCategory.name,
      description: insertCategory.description ?? null,
      isActive: insertCategory.isActive ?? true,
      createdAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, insertCategory: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;

    const updated: Category = { ...existing, ...insertCategory };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Cart
  async getCart(telegramUserId: string): Promise<Cart[]> {
    return Array.from(this.cart.values())
      .filter(item => item.telegramUserId === telegramUserId)
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  async getCartItems(telegramUserId: string): Promise<Cart[]> {
    // Alias method for getCart
    return this.getCart(telegramUserId);
  }

  async addToCart(cartItem: InsertCart): Promise<Cart> {
    const key = `${cartItem.telegramUserId}-${cartItem.productId}`;
    const existing = this.cart.get(key);
    
    if (existing) {
      // Update quantity if item already in cart
      existing.quantity += cartItem.quantity || 1;
      this.cart.set(key, existing);
      return existing;
    } else {
      // Add new item to cart
      const newItem: Cart = {
        id: randomUUID(),
        telegramUserId: cartItem.telegramUserId,
        productId: cartItem.productId,
        quantity: cartItem.quantity || 1,
        addedAt: new Date(),
      };
      this.cart.set(key, newItem);
      return newItem;
    }
  }

  async addToWishlist(cartItem: InsertCart): Promise<Cart> {
    const key = `${cartItem.telegramUserId}-${cartItem.productId}`;
    const existing = this.wishlist.get(key);
    
    if (existing) {
      // Update quantity if item already in wishlist
      existing.quantity += cartItem.quantity || 1;
      this.wishlist.set(key, existing);
      return existing;
    } else {
      // Add new item to wishlist
      const newItem: Cart = {
        id: randomUUID(),
        telegramUserId: cartItem.telegramUserId,
        productId: cartItem.productId,
        quantity: cartItem.quantity || 1,
        addedAt: new Date(),
      };
      this.wishlist.set(key, newItem);
      return newItem;
    }
  }

  async getWishlistItems(telegramUserId: string): Promise<Cart[]> {
    return Array.from(this.wishlist.values())
      .filter(item => item.telegramUserId === telegramUserId)
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  async updateCartItem(telegramUserId: string, productId: string, quantity: number): Promise<Cart | undefined> {
    const key = `${telegramUserId}-${productId}`;
    const existing = this.cart.get(key);
    
    if (!existing) return undefined;
    
    if (quantity <= 0) {
      this.cart.delete(key);
      return undefined;
    }
    
    existing.quantity = quantity;
    this.cart.set(key, existing);
    return existing;
  }

  async removeFromCart(telegramUserId: string, productId: string): Promise<boolean> {
    const key = `${telegramUserId}-${productId}`;
    return this.cart.delete(key);
  }

  async clearCart(telegramUserId: string): Promise<void> {
    const userCartItems = Array.from(this.cart.keys())
      .filter(key => key.startsWith(`${telegramUserId}-`));
    
    userCartItems.forEach(key => this.cart.delete(key));
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
      totalAmount: totalAmount.toFixed(2),
    };
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getOrdersByUser(telegramUserId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.telegramUserId === telegramUserId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserOrders(telegramUserId: string): Promise<Order[]> {
    // Alias method for getOrdersByUser
    return this.getOrdersByUser(telegramUserId);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertOrder.status || "pending",
      paymentMethod: insertOrder.paymentMethod || null,
      deliveryAddress: insertOrder.deliveryAddress || null,
      notes: insertOrder.notes || null,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, insertOrder: Partial<InsertOrder>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;

    const updated: Order = { ...existing, ...insertOrder, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return this.updateOrder(id, { status });
  }

  // Inquiries
  async getInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const id = randomUUID();
    const inquiry: Inquiry = { 
      ...insertInquiry, 
      id, 
      createdAt: new Date(),
      productId: insertInquiry.productId ?? null,
      contactInfo: insertInquiry.contactInfo ?? null,
      isRead: insertInquiry.isRead ?? false,
    };
    this.inquiries.set(id, inquiry);
    return inquiry;
  }

  async updateInquiry(id: string, insertInquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const existing = this.inquiries.get(id);
    if (!existing) return undefined;

    const updated: Inquiry = { ...existing, ...insertInquiry };
    this.inquiries.set(id, updated);
    return updated;
  }

  async getUnreadInquiriesCount(): Promise<number> {
    return Array.from(this.inquiries.values()).filter(inquiry => !inquiry.isRead).length;
  }

  // Bot Settings
  async getBotSettings(): Promise<BotSettings[]> {
    return Array.from(this.botSettings.values());
  }

  async getBotSetting(key: string): Promise<BotSettings | undefined> {
    return this.botSettings.get(key);
  }

  async setBotSetting(insertSetting: InsertBotSettings): Promise<BotSettings> {
    const existing = this.botSettings.get(insertSetting.key);
    const setting: BotSettings = {
      id: existing?.id || randomUUID(),
      ...insertSetting,
      updatedAt: new Date(),
    };
    this.botSettings.set(insertSetting.key, setting);
    return setting;
  }

  // Bot Stats
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
    const currentRevenue = parseFloat(this.botStats.totalRevenue);
    const newRevenue = currentRevenue + parseFloat(amount);
    this.botStats.totalRevenue = newRevenue.toFixed(2);
    this.botStats.updatedAt = new Date();
  }

  // Product Ratings
  async addProductRating(insertRating: InsertProductRating): Promise<ProductRating> {
    const id = randomUUID();
    const rating: ProductRating = {
      id,
      ...insertRating,
      createdAt: new Date(),
    };

    const key = `${rating.productId}-${rating.telegramUserId}`;
    console.log(`Adding rating with key: ${key}, rating: ${rating.rating}, created: ${rating.createdAt}`);
    this.productRatings.set(key, rating);
    console.log(`Total ratings in storage: ${this.productRatings.size}`);
    return rating;
  }

  async getProductRating(productId: string, telegramUserId: string): Promise<ProductRating | undefined> {
    const key = `${productId}-${telegramUserId}`;
    return this.productRatings.get(key);
  }

  async getWeeklyProductRatings(): Promise<{ productId: string; productName: string; averageRating: number; totalRatings: number; ratingCounts: Record<number, number> }[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    console.log(`Checking ratings from ${oneWeekAgo.toISOString()} onwards`);
    console.log(`Total ratings in storage: ${this.productRatings.size}`);
    
    const allRatings = Array.from(this.productRatings.values());
    console.log('All ratings:', allRatings.map(r => ({productId: r.productId, rating: r.rating, createdAt: r.createdAt})));
    
    const weeklyRatings = allRatings.filter(rating => rating.createdAt >= oneWeekAgo);
    console.log(`Weekly ratings count: ${weeklyRatings.length}`);

    const ratingsByProduct = new Map<string, ProductRating[]>();
    
    for (const rating of weeklyRatings) {
      if (!ratingsByProduct.has(rating.productId)) {
        ratingsByProduct.set(rating.productId, []);
      }
      ratingsByProduct.get(rating.productId)!.push(rating);
    }

    const results: { productId: string; productName: string; averageRating: number; totalRatings: number; ratingCounts: Record<number, number> }[] = [];
    for (const [productId, ratings] of Array.from(ratingsByProduct.entries())) {
      const product = this.products.get(productId);
      if (!product) continue;

      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum: number, r: ProductRating) => sum + r.rating, 0) / totalRatings;
      
      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach((r: ProductRating) => {
        ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
      });

      results.push({
        productId,
        productName: product.name,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        ratingCounts
      });
    }

    return results.sort((a, b) => b.totalRatings - a.totalRatings);
  }

  async getProductRatings(productId: string): Promise<ProductRating[]> {
    return Array.from(this.productRatings.values())
      .filter(rating => rating.productId === productId);
  }

  private initializeSampleOrders() {
    // Add some sample completed orders for different users
    const products = Array.from(this.products.values());
    const sampleOrders = [
      {
        telegramUserId: "12345", // Sample user
        customerName: "John Smith",
        contactInfo: "+1-555-0123",
        deliveryAddress: "123 Main St, City, State 12345",
        totalAmount: "157.50",
        status: "delivered",
        paymentMethod: "card",
        items: JSON.stringify([
          { productId: products[0]?.id, productName: products[0]?.name, quantity: 2, price: products[0]?.price }
        ])
      },
      {
        telegramUserId: "12345", // Same user
        customerName: "John Smith", 
        contactInfo: "+1-555-0123",
        deliveryAddress: "123 Main St, City, State 12345",
        totalAmount: "89.99",
        status: "shipped",
        paymentMethod: "bitcoin",
        items: JSON.stringify([
          { productId: products[1]?.id, productName: products[1]?.name, quantity: 1, price: products[1]?.price }
        ])
      },
      {
        telegramUserId: "67890", // Different user
        customerName: "Jane Doe",
        contactInfo: "+1-555-0456",
        deliveryAddress: "456 Oak Ave, City, State 67890",
        totalAmount: "275.00",
        status: "completed",
        paymentMethod: "bank",
        items: JSON.stringify([
          { productId: products[2]?.id, productName: products[2]?.name, quantity: 3, price: products[2]?.price }
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
}

export const storage = new MemStorage();
