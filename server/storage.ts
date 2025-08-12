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
  addToCart(cartItem: InsertCart): Promise<Cart>;
  updateCartItem(telegramUserId: string, productId: string, quantity: number): Promise<Cart | undefined>;
  removeFromCart(telegramUserId: string, productId: string): Promise<boolean>;
  clearCart(telegramUserId: string): Promise<void>;
  getCartTotal(telegramUserId: string): Promise<{ itemCount: number; totalAmount: string }>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByUser(telegramUserId: string): Promise<Order[]>;
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
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private categories: Map<string, Category>;
  private cart: Map<string, Cart>; // key: `${telegramUserId}-${productId}`
  private orders: Map<string, Order>;
  private inquiries: Map<string, Inquiry>;
  private botSettings: Map<string, BotSettings>;
  private botStats: BotStats;

  constructor() {
    this.products = new Map();
    this.categories = new Map();
    this.cart = new Map();
    this.orders = new Map();
    this.inquiries = new Map();
    this.botSettings = new Map();
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
      { name: "Electronics", description: "Latest gadgets and electronic devices" },
      { name: "Fashion", description: "Trendy clothes and accessories" },
      { name: "Home & Garden", description: "Home improvement and garden supplies" },
      { name: "Books", description: "Educational and entertainment books" },
      { name: "Sports", description: "Sports equipment and fitness gear" }
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
    const electronicsCategory = Array.from(this.categories.values()).find(c => c.name === "Electronics");
    const fashionCategory = Array.from(this.categories.values()).find(c => c.name === "Fashion");
    const homeCategory = Array.from(this.categories.values()).find(c => c.name === "Home & Garden");

    const sampleProducts = [
      {
        name: "Wireless Bluetooth Headphones",
        description: "Premium noise-canceling wireless headphones with 30-hour battery life. Perfect for music, calls, and travel.",
        price: "89.99",
        compareAtPrice: "129.99",
        stock: 25,
        categoryId: electronicsCategory?.id || null,
        tags: JSON.stringify(["electronics", "audio", "wireless", "bluetooth"]),
        specifications: JSON.stringify({
          "Battery Life": "30 hours",
          "Noise Canceling": "Yes",
          "Bluetooth Version": "5.0",
          "Weight": "250g"
        }),
        isFeatured: true,
      },
      {
        name: "Smart Fitness Watch",
        description: "Track your health and fitness with this advanced smartwatch. Heart rate monitor, GPS, and 7-day battery.",
        price: "199.99",
        compareAtPrice: "249.99", 
        stock: 15,
        categoryId: electronicsCategory?.id || null,
        tags: JSON.stringify(["smartwatch", "fitness", "health", "gps"]),
        specifications: JSON.stringify({
          "Display": "1.4 inch AMOLED",
          "Battery": "7 days",
          "Water Resistant": "50m",
          "GPS": "Yes"
        }),
        isFeatured: true,
      },
      {
        name: "Organic Cotton T-Shirt",
        description: "Comfortable and sustainable organic cotton t-shirt. Available in multiple colors and sizes.",
        price: "24.99",
        stock: 50,
        categoryId: fashionCategory?.id || null,
        tags: JSON.stringify(["fashion", "organic", "cotton", "sustainable"]),
        specifications: JSON.stringify({
          "Material": "100% Organic Cotton",
          "Sizes": "XS, S, M, L, XL, XXL",
          "Colors": "White, Black, Navy, Gray",
          "Care": "Machine washable"
        }),
      },
      {
        name: "LED Desk Lamp",
        description: "Modern LED desk lamp with adjustable brightness and color temperature. USB charging port included.",
        price: "45.99",
        stock: 20,
        categoryId: homeCategory?.id || null,
        tags: JSON.stringify(["lighting", "led", "desk", "adjustable"]),
        specifications: JSON.stringify({
          "Power": "12W LED",
          "Brightness": "3 levels",
          "Color Temperature": "3000K-6500K",
          "USB Port": "Yes"
        }),
      },
      {
        name: "Premium Coffee Beans",
        description: "Single-origin premium coffee beans, freshly roasted. Rich flavor with chocolate notes.",
        price: "18.99",
        stock: 30,
        categoryId: homeCategory?.id,
        tags: JSON.stringify(["coffee", "premium", "organic", "single-origin"]),
        specifications: JSON.stringify({
          "Origin": "Colombia",
          "Roast": "Medium",
          "Weight": "500g",
          "Notes": "Chocolate, Caramel"
        }),
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
}

export const storage = new MemStorage();
