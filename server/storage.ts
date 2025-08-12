import { 
  type Product, 
  type InsertProduct, 
  type Inquiry, 
  type InsertInquiry,
  type BotSettings,
  type InsertBotSettings,
  type BotStats,
  type InsertBotStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

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
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private inquiries: Map<string, Inquiry>;
  private botSettings: Map<string, BotSettings>;
  private botStats: BotStats;

  constructor() {
    this.products = new Map();
    this.inquiries = new Map();
    this.botSettings = new Map();
    this.botStats = {
      id: randomUUID(),
      totalUsers: 0,
      totalOrders: 0,
      totalMessages: 0,
      updatedAt: new Date(),
    };

    // Initialize with some default settings
    this.initializeDefaultSettings();
  }

  private initializeDefaultSettings() {
    const defaultSettings = [
      { key: "welcome_message", value: "Welcome to our store! Type /catalog to see our products or /help for assistance." },
      { key: "help_message", value: "Available commands:\n/start - Start conversation\n/catalog - View products\n/help - Show this message" },
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

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
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
      stock: insertProduct.stock ?? 0,
      imageUrl: insertProduct.imageUrl ?? null,
      isActive: insertProduct.isActive ?? true,
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, insertProduct: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    const updated: Product = { ...existing, ...insertProduct };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
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
}

export const storage = new MemStorage();
