# 🏪 Multi-Store Architecture

## Overview

The TeleShop Bot system now supports **multi-store architecture**, allowing up to 10 different Telegram bots to run simultaneously, each managing its own independent store with separate products, categories, orders, and settings.

## How It Works

### 1. **Bot ID Extraction**

Each bot has a unique Bot ID extracted from its Telegram token:
- Bot Token format: `BOT_ID:SECRET_KEY`
- Example: `8467452442:AAESTxYaWdTGsacW6YSqTnITpQdj-e8-Nkw`
- Bot ID: `8467452442`

### 2. **Data Partitioning**

All store-related data is partitioned by `botId` in the database:

**Tables with Bot ID:**
- `products` - Each bot has its own product catalog
- `categories` - Each bot has its own category tree
- `orders` - Orders are tracked per bot
- `cart` & `wishlist` - Shopping data per bot
- `inquiries` - Customer inquiries per bot
- `payment_methods` - Payment options per bot
- `delivery_methods` - Shipping options per bot
- `bot_settings` - Bot configuration per bot
- `bot_stats` - Analytics per bot
- `tracked_users` - User tracking per bot
- `broadcasts` - Broadcast messages per bot
- `pricing_tiers` - Tier pricing per bot

**Shared Tables:**
- `currencies` - Global currency definitions
- `languages` - Global language definitions
- `exchange_rates` - Global exchange rate data
- `operators` - Support staff can work across bots (optional)

### 3. **Storage Layer Auto-Injection**

The storage layer automatically injects `botId` into all database operations:

**Writes (INSERT):**
```typescript
// User creates a product via API
await storage.createProduct({
  name: "Widget",
  price: "9.99",
  // botId is auto-injected by storage layer
});

// Storage layer adds botId before insert:
await db.insert(products).values({
  botId: currentBotId, // ← Automatically added
  name: "Widget",
  price: "9.99",
});
```

**Reads (SELECT):**
```typescript
// User fetches all products
const products = await storage.getProducts();

// Storage layer adds botId filter:
const products = await db
  .select()
  .from(products)
  .where(eq(products.botId, currentBotId)); // ← Automatically filtered
```

### 4. **Bot Isolation**

Each bot operates in complete isolation:

**Bot 1** (ID: 8467452442):
- Dashboard: `http://72.60.20.38:5001`
- Products: Only sees products where `botId = '8467452442'`
- Orders: Only sees orders where `botId = '8467452442'`
- Settings: Only sees settings where `botId = '8467452442'`

**Bot 2** (ID: 9876543210):
- Dashboard: `http://72.60.20.38:5002`
- Products: Only sees products where `botId = '9876543210'`
- Orders: Only sees orders where `botId = '9876543210'`
- Settings: Only sees settings where `botId = '9876543210'`

### 5. **Deployment Architecture**

```
┌─────────────────────────────────────────────┐
│          Hostinger VPS (72.60.20.38)        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────┐│
│  │  Bot 1     │  │  Bot 2     │  │ Bot 10 ││
│  │  :5001     │  │  :5002     │  │ :5010  ││
│  │            │  │            │  │        ││
│  │ Same       │  │ Same       │  │ Same   ││
│  │ Codebase   │  │ Codebase   │  │ Codebase││
│  └────┬───────┘  └────┬───────┘  └────┬───┘│
│       │               │               │    │
│       └───────────────┼───────────────┘    │
│                       │                    │
│              ┌────────▼────────┐           │
│              │   PostgreSQL    │           │
│              │                 │           │
│              │  All Bots Share │           │
│              │  Same Database  │           │
│              │  (Data filtered │           │
│              │   by botId)     │           │
│              └─────────────────┘           │
└─────────────────────────────────────────────┘
```

## Database Schema Changes

### Added `botId` Column to Tables:

```sql
ALTER TABLE products ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE categories ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE orders ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE inquiries ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE cart ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE wishlist ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE payment_methods ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE delivery_methods ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE bot_settings ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE bot_stats ADD COLUMN bot_id TEXT NOT NULL UNIQUE;
ALTER TABLE tracked_users ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE broadcasts ADD COLUMN bot_id TEXT NOT NULL;
ALTER TABLE pricing_tiers ADD COLUMN bot_id TEXT NOT NULL;
```

### Removed Unique Constraint:

```sql
-- botSettings.key is no longer globally unique
-- Instead, unique per (botId, key) combination
-- This allows each bot to have its own 'bot_token' setting, etc.
```

## Implementation Benefits

### ✅ Advantages

1. **Single Codebase**: All bots run the same code, making updates easy
2. **Shared Infrastructure**: One database, one server, lower costs
3. **Independent Stores**: Each bot manages its own products and orders
4. **Easy Scaling**: Add new bots by just adding tokens
5. **Centralized Management**: Manage all bots from one VPS
6. **Cost Effective**: Share resources across 10 bots

### ⚠️ Considerations

1. **Database Size**: All bots share one database (plan for growth)
2. **Resource Limits**: VPS must handle 10 concurrent Node.js processes
3. **Data Backup**: One database contains all stores (backup critical)
4. **Bot Token Security**: Each token must be kept secure

## Migration from Single-Store to Multi-Store

### For Existing Bot 1 Data:

After deploying the multi-store changes, you'll need to set the `botId` for existing data:

```sql
-- Update existing Bot 1 data (one-time migration)
UPDATE products SET bot_id = '8467452442' WHERE bot_id IS NULL;
UPDATE categories SET bot_id = '8467452442' WHERE bot_id IS NULL;
UPDATE orders SET bot_id = '8467452442' WHERE bot_id IS NULL;
-- ... repeat for all tables
```

**Note**: This migration will be handled automatically by the storage layer on first startup.

## Adding New Bots

### Steps to Add Bot 2-10:

1. **Get Bot Token from @BotFather**
2. **Add to `.env.docker` on VPS:**
   ```bash
   BOT2_TOKEN=9876543210:ABCxyz123456789
   ```
3. **Deploy Bot:**
   ```bash
   docker-compose --env-file .env.docker up -d bot2
   ```
4. **Access Dashboard:**
   ```
   http://72.60.20.38:5002
   ```
5. **Configure Store:**
   - Add products, categories, payment methods
   - Each bot starts with empty database (clean slate)

## Security & Data Isolation

### Data Isolation Guarantees:

1. **Storage Layer**: All queries automatically filtered by `botId`
2. **API Layer**: Routes use storage layer (inherits filtering)
3. **Bot Layer**: Each bot only knows its own `botId`
4. **No Cross-Contamination**: Bot 1 cannot see Bot 2's data

### Protection Mechanisms:

```typescript
// Example: Storage layer automatically adds botId filter
async getProducts() {
  const botId = this.getBotId(); // Extracted from bot token
  return await db
    .select()
    .from(products)
    .where(eq(products.botId, botId)); // ← Automatic filter
}
```

## Performance Considerations

### Database Indexes:

Add indexes on `botId` columns for optimal performance:

```sql
CREATE INDEX idx_products_bot_id ON products(bot_id);
CREATE INDEX idx_categories_bot_id ON categories(bot_id);
CREATE INDEX idx_orders_bot_id ON orders(bot_id);
-- ... for all tables with botId
```

### Query Optimization:

All queries are scoped to a single bot, so:
- No cross-bot queries
- Smaller result sets
- Faster queries

## Monitoring & Analytics

### Per-Bot Metrics:

Each bot tracks its own metrics in `bot_stats`:
- Total users
- Total orders
- Total revenue
- Total messages

### Global Metrics:

Aggregate across all bots for total system metrics:

```sql
SELECT 
  SUM(total_users) as all_users,
  SUM(total_orders) as all_orders,
  SUM(total_revenue) as all_revenue
FROM bot_stats;
```

## Troubleshooting

### Bot Can't See Products:

**Cause**: `botId` mismatch or not set
**Solution**: Check bot token and database records

```sql
-- Check what botId products have
SELECT DISTINCT bot_id FROM products;

-- Check current bot's ID
-- It's extracted from TELEGRAM_BOT_TOKEN env variable
```

### All Bots See Same Data:

**Cause**: Storage layer not filtering by `botId`
**Solution**: Verify storage layer implementation

### Migration Failed:

**Cause**: Existing data has null `botId`
**Solution**: Run migration SQL to set `botId` for existing records

---

## Summary

The multi-store architecture enables running 10 independent Telegram shop bots using:
- ✅ Same codebase
- ✅ Shared database
- ✅ Isolated data (by `botId`)
- ✅ Independent dashboards
- ✅ Easy deployment

Each bot operates as if it's the only bot in the system, with complete data isolation guaranteed by the storage layer.
