import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD").references(() => currencies.code),
  stock: integer("stock").notNull().default(0),
  minOrderQuantity: integer("min_order_quantity").notNull().default(1),
  maxOrderQuantity: integer("max_order_quantity"),
  unit: text("unit").notNull().default("piece"), // unit of measurement
  imageUrl: text("image_url"),
  categoryId: varchar("category_id").references(() => categories.id),
  tags: text("tags"), // JSON array of tags
  specifications: text("specifications"), // JSON object with specs
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramUserId: text("telegram_user_id").notNull(),
  username: text("username"), // Telegram username without @
  customerName: text("customer_name").notNull(),
  message: text("message").notNull(),
  productId: varchar("product_id").references(() => products.id),
  contactInfo: text("contact_info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const botSettings = pgTable("bot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Payment methods table for dynamic management
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  paymentInfo: text("payment_info"), // Bank account, crypto address, etc.
  instructions: text("instructions"), // Step-by-step payment instructions
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Delivery methods table for dynamic management
export const deliveryMethods = pgTable("delivery_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  isFree: boolean("is_free").notNull().default(false), // For free delivery option
  estimatedTime: text("estimated_time"), // e.g., "2-3 hours", "1-2 days", "Same day"
  timeUnit: text("time_unit").default("days"), // hours, days, weeks
  minTime: integer("min_time"), // Minimum time estimate
  maxTime: integer("max_time"), // Maximum time estimate
  instructions: text("instructions"), // Special delivery instructions
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Bot operators table for managing support staff
export const operators = pgTable("operators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  telegramUsername: text("telegram_username").notNull().unique(),
  email: text("email"),
  role: text("role"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Operator support sessions table for live customer support
export const operatorSessions = pgTable("operator_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramUserId: text("telegram_user_id").notNull(),
  customerName: text("customer_name").notNull(),
  operatorName: text("operator_name"),
  status: text("status").notNull().default("waiting"), // waiting, active, resolved, closed
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  category: text("category"), // general, order, product, payment, delivery
  initialMessage: text("initial_message").notNull(),
  lastMessage: text("last_message"),
  lastActivityAt: timestamp("last_activity_at").notNull().default(sql`now()`),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Support messages for operator chat history
export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => operatorSessions.id),
  senderType: text("sender_type").notNull(), // customer, operator, system, ai
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").default("text"), // text, image, file, system
  metadata: text("metadata"), // JSON for additional data
  isAiSuggestion: boolean("is_ai_suggestion").notNull().default(false), // Track AI-generated suggestions
  aiContext: text("ai_context"), // AI reasoning or context for the suggestion
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// AI chat suggestions for operators
export const aiChatSuggestions = pgTable("ai_chat_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => operatorSessions.id),
  suggestion: text("suggestion").notNull(), // AI-generated response suggestion
  context: text("context").notNull(), // Conversation context used
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  wasUsed: boolean("was_used").notNull().default(false), // Track if operator used the suggestion
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").unique(), // User-visible order number
  telegramUserId: text("telegram_user_id").notNull(),
  customerName: text("customer_name").notNull(),
  contactInfo: text("contact_info").notNull(),
  items: text("items").notNull(), // JSON string of order items
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).references(() => currencies.code), // Currency used for this order (nullable for backward compatibility)
  fxRateUsed: decimal("fx_rate_used", { precision: 18, scale: 8 }).default("1"), // Exchange rate at time of order
  status: text("status").notNull().default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  paymentMethod: text("payment_method"),
  deliveryAddress: text("delivery_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const cart = pgTable("cart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramUserId: text("telegram_user_id").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").notNull().default(sql`now()`),
});

export const wishlist = pgTable("wishlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramUserId: text("telegram_user_id").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").notNull().default(sql`now()`),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const botStats = pgTable("bot_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalUsers: integer("total_users").notNull().default(0),
  totalOrders: integer("total_orders").notNull().default(0),
  totalMessages: integer("total_messages").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const productRatings = pgTable("product_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  telegramUserId: text("telegram_user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity"), // null means unlimited
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPricingTierSchema = createInsertSchema(pricingTiers).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products, {
  price: z.string().or(z.number()).transform(val => String(val)),
  compareAtPrice: z.string().or(z.number()).transform(val => val ? String(val) : undefined).optional().nullable(),
  stock: z.number().or(z.string()).transform(val => Number(val)),
  minOrderQuantity: z.number().or(z.string()).transform(val => Number(val)),
  maxOrderQuantity: z.number().or(z.string()).transform(val => val ? Number(val) : undefined).optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).transform((data: any) => ({
  ...data,
  // Convert empty strings to null for optional fields
  compareAtPrice: data.compareAtPrice === "" || data.compareAtPrice == null ? null : data.compareAtPrice,
  maxOrderQuantity: data.maxOrderQuantity === "" || data.maxOrderQuantity === 0 ? null : data.maxOrderQuantity,
  imageUrl: data.imageUrl === "" ? null : data.imageUrl,
  categoryId: data.categoryId === "" ? null : data.categoryId,
  tags: data.tags === "" ? null : data.tags,
  specifications: data.specifications === "" ? null : data.specifications,
}));

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliveryMethodSchema = createInsertSchema(deliveryMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currencyCode: z.string().length(3).optional(),
  fxRateUsed: z.string().or(z.number()).transform(val => String(val)).optional(),
});

export const insertCartSchema = createInsertSchema(cart).omit({
  id: true,
  addedAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlist).omit({
  id: true,
  addedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertBotStatsSchema = createInsertSchema(botStats).omit({
  id: true,
  updatedAt: true,
});

export const insertProductRatingSchema = createInsertSchema(productRatings).omit({
  id: true,
  createdAt: true,
});

// Tracked users table for broadcast functionality
export const trackedUsers = pgTable("tracked_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: text("chat_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  lastSeen: timestamp("last_seen").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertTrackedUserSchema = createInsertSchema(trackedUsers).omit({
  id: true,
  createdAt: true,
});

// Broadcasts table for storing broadcast history
export const broadcasts = pgTable("broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  hasImage: boolean("has_image").notNull().default(false),
  recipientCount: integer("recipient_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertBroadcastSchema = createInsertSchema(broadcasts).omit({
  id: true,
  createdAt: true,
});

// Order item type for cart and orders
export const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  price: z.string(),
  quantity: z.number().min(1),
  total: z.string(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Cart = typeof cart.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type Wishlist = typeof wishlist.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type DeliveryMethod = typeof deliveryMethods.$inferSelect;
export type InsertDeliveryMethod = z.infer<typeof insertDeliveryMethodSchema>;
export type BotStats = typeof botStats.$inferSelect;
export type InsertBotStats = z.infer<typeof insertBotStatsSchema>;
export type ProductRating = typeof productRatings.$inferSelect;
export type InsertProductRating = z.infer<typeof insertProductRatingSchema>;
export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;

export const insertOperatorSchema = createInsertSchema(operators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Operator = typeof operators.$inferSelect;
export type InsertOperator = z.infer<typeof insertOperatorSchema>;

export const insertOperatorSessionSchema = createInsertSchema(operatorSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActivityAt: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAiChatSuggestionSchema = createInsertSchema(aiChatSuggestions).omit({
  id: true,
  createdAt: true,
});

export type OperatorSession = typeof operatorSessions.$inferSelect;
export type InsertOperatorSession = z.infer<typeof insertOperatorSessionSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type AiChatSuggestion = typeof aiChatSuggestions.$inferSelect;
export type InsertAiChatSuggestion = z.infer<typeof insertAiChatSuggestionSchema>;
export type TrackedUser = typeof trackedUsers.$inferSelect;
export type InsertTrackedUser = z.infer<typeof insertTrackedUserSchema>;
export type Broadcast = typeof broadcasts.$inferSelect;
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;

// Multi-language and multi-currency support tables

// Supported languages table
export const languages = pgTable("languages", {
  code: varchar("code", { length: 10 }).primaryKey(), // ISO language code like 'en', 'es', 'fr'
  name: text("name").notNull(), // Display name like 'English', 'Español', 'Français'
  nativeName: text("native_name").notNull(), // Native name like 'English', 'Español', 'Français'
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Supported currencies table
export const currencies = pgTable("currencies", {
  code: varchar("code", { length: 3 }).primaryKey(), // ISO currency code like 'USD', 'EUR', 'GBP'
  name: text("name").notNull(), // Display name like 'US Dollar', 'Euro', 'British Pound'
  symbol: text("symbol").notNull(), // Currency symbol like '$', '€', '£'
  decimalPlaces: integer("decimal_places").notNull().default(2), // Number of decimal places
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Exchange rates table (base currency is USD)
export const exchangeRates = pgTable("exchange_rates", {
  currencyCode: varchar("currency_code", { length: 3 }).primaryKey().references(() => currencies.code),
  rate: decimal("rate", { precision: 20, scale: 10 }).notNull(), // Exchange rate relative to USD
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

// User language and currency preferences
export const userPreferences = pgTable("user_preferences", {
  telegramUserId: text("telegram_user_id").primaryKey(),
  languageCode: varchar("language_code", { length: 10 }).notNull().references(() => languages.code),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().references(() => currencies.code),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Product name and description translations
export const productTranslations = pgTable("product_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  languageCode: varchar("language_code", { length: 10 }).notNull().references(() => languages.code),
  name: text("name").notNull(),
  description: text("description").notNull(),
  unit: text("unit").notNull().default("piece"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueProductLanguage: sql`UNIQUE (${table.productId}, ${table.languageCode})`,
}));

// Category name and description translations
export const categoryTranslations = pgTable("category_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  languageCode: varchar("language_code", { length: 10 }).notNull().references(() => languages.code),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueCategoryLanguage: sql`UNIQUE (${table.categoryId}, ${table.languageCode})`,
}));

// Insert schemas for new tables
export const insertLanguageSchema = createInsertSchema(languages).omit({
  createdAt: true,
});

export const insertCurrencySchema = createInsertSchema(currencies).omit({
  createdAt: true,
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  lastUpdated: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProductTranslationSchema = createInsertSchema(productTranslations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategoryTranslationSchema = createInsertSchema(categoryTranslations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type Language = typeof languages.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type ProductTranslation = typeof productTranslations.$inferSelect;
export type InsertProductTranslation = z.infer<typeof insertProductTranslationSchema>;
export type CategoryTranslation = typeof categoryTranslations.$inferSelect;
export type InsertCategoryTranslation = z.infer<typeof insertCategoryTranslationSchema>;
