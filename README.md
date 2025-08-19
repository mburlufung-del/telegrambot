# 🛍️ TeleShop Bot - Complete E-Commerce System

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template)

## 🎯 Complete Telegram E-Commerce Solution

Professional Telegram bot with synchronized admin dashboard for managing products, orders, and customers. Built with Node.js, React, and PostgreSQL.

### ✨ Key Features

#### 🤖 Telegram Bot
- **Product Catalog**: Browse products by categories with search functionality
- **Shopping Cart**: Add/remove items with real-time stock management
- **Checkout Process**: Complete order flow with customer details
- **Order Tracking**: View order history and status updates
- **Customer Support**: Built-in inquiry system with admin responses
- **Broadcasting**: Admin can send messages to all users with images

#### 📊 Admin Dashboard
- **Product Management**: Full CRUD operations for products and categories
- **Order Processing**: View, update, and manage customer orders
- **Customer Support**: Respond to customer inquiries in real-time
- **Bot Configuration**: Customize messages, operators, and payment settings
- **Broadcasting System**: Send announcements with image upload
- **Analytics**: User statistics and performance metrics
- **Delivery Management**: Configure delivery methods and pricing

#### 🔄 Real-time Synchronization
- Dashboard changes instantly reflect in Telegram bot
- New products automatically appear in bot catalog
- Stock updates immediately affect cart availability
- Zero maintenance required for product integration

## 🚀 Quick Railway Deployment

### Prerequisites
- Railway account ([Sign up free](https://railway.app))
- GitHub account
- Telegram bot token from [@BotFather](https://t.me/botfather)

### Step 1: Upload to GitHub

```bash
# Clone or download this repository
git clone https://github.com/your-username/teleshop-bot.git
cd teleshop-bot

# Or if you downloaded the zip file
unzip TeleShop-Bot-Complete.zip
cd teleshop-bot

# Initialize and push to your GitHub repository
git init
git add .
git commit -m "Initial commit: TeleShop Bot"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### Step 2: Deploy on Railway

1. **Visit Railway**: Go to [railway.app](https://railway.app) and sign in
2. **New Project**: Click "Deploy from GitHub repo"
3. **Select Repository**: Choose your TeleShop bot repository
4. **Auto-Detection**: Railway automatically detects the Node.js project

### Step 3: Add Database

1. **Add Service**: Click "Add Service" in your project
2. **PostgreSQL**: Select "PostgreSQL" from the list
3. **Auto-Connect**: Railway automatically provides `DATABASE_URL`

### Step 4: Configure Environment Variables

Go to your service → Variables tab and add:

```env
NODE_ENV=production
BOT_TOKEN=your_telegram_bot_token_here
SESSION_SECRET=your_secure_random_string_here
```

> **Note**: `DATABASE_URL` is automatically provided by Railway's PostgreSQL service

### Step 5: Deploy

Railway automatically builds and deploys your application:

1. **Build Process**: Installs dependencies and compiles TypeScript
2. **Database Migration**: Automatically runs database setup
3. **Bot Initialization**: Starts Telegram bot polling
4. **Ready**: Your application is live!

## 🎯 Post-Deployment Testing

### Test Admin Dashboard
1. Visit your Railway domain (e.g., `https://your-app.railway.app`)
2. Create your first product with category
3. Configure bot settings and messages
4. Test the broadcasting system

### Test Telegram Bot
1. Send `/start` to your bot on Telegram
2. Browse the product catalog
3. Add items to cart and complete checkout
4. Send a customer inquiry message
5. Check order history

### Verify Synchronization
1. Add a new product in the dashboard
2. Check that it appears in the bot immediately
3. Update stock levels in dashboard
4. Verify cart buttons update in bot automatically

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL
- **node-telegram-bot-api** for bot functionality

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack Query** for state management

### Database
- **PostgreSQL** for data persistence
- **Drizzle ORM** for database operations
- **Automatic migrations** on deployment

## 📁 Project Structure

```
├── client/                 # React frontend (Admin Dashboard)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Dashboard pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Node.js backend
│   ├── bot.ts             # Telegram bot implementation
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared code
│   └── schema.ts          # Database schema definitions
├── railway.toml           # Railway deployment configuration
└── package.json           # Dependencies and scripts
```

## 🔧 Development

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your bot token and database URL

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run db:generate # Generate database migrations
npm run db:push     # Apply migrations to database
npm run db:studio   # Open database studio
```

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `BOT_TOKEN` | Telegram bot token from BotFather | `123456:ABC-DEF...` |
| `SESSION_SECRET` | Secret for session management | `your-secure-random-string` |

### Auto-Provided by Railway

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Application port (default: 5000) |

## 🚀 Production Features

### Auto-Management
- **Always Online**: Bot stays active 24/7 on Railway
- **Auto-Restart**: Automatic recovery from errors
- **Health Monitoring**: Built-in health checks
- **Scaling**: Railway handles traffic scaling automatically

### Security
- **Session Management**: Secure user sessions
- **Input Validation**: All inputs validated with Zod
- **SQL Injection Protection**: Drizzle ORM prevents SQL injection
- **XSS Protection**: React's built-in XSS protection

### Performance
- **Optimized Queries**: Efficient database operations
- **Caching**: TanStack Query caching for dashboard
- **Lazy Loading**: Component lazy loading for faster startup
- **Compression**: Gzip compression for static assets

## 📊 Bot Commands

### User Commands
- `/start` - Start the bot and show main menu
- `/help` - Show help information
- `/orders` - View order history
- `/cancel` - Cancel current operation

### Admin Features
- **Product Management**: Add, edit, delete products via dashboard
- **Order Management**: Process and update order statuses
- **Customer Support**: Respond to customer inquiries
- **Broadcasting**: Send messages to all users
- **Analytics**: View user and sales statistics

## 🎯 Success Metrics

After deployment, you'll have:

✅ **Professional E-commerce Bot**: Complete shopping experience on Telegram
✅ **Admin Dashboard**: Full control over products, orders, and customers
✅ **Real-time Sync**: Perfect synchronization between bot and dashboard
✅ **Zero Maintenance**: New products automatically work in bot
✅ **Production Ready**: Optimized for Railway hosting with auto-scaling

## 📞 Support

### Issues and Questions
- Create an issue on GitHub for bugs or feature requests
- Check the deployment guide in `RAILWAY-DEPLOYMENT-GUIDE.md`
- Review environment variables in `ENV-RAILWAY.txt`

### Common Solutions
- **Bot not responding**: Check `BOT_TOKEN` environment variable
- **Database errors**: Verify PostgreSQL service is connected
- **Build failures**: Ensure all dependencies are installed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Telegram Bot API](https://core.telegram.org/bots/api) for bot functionality
- [Railway](https://railway.app) for hosting platform
- [React](https://reactjs.org/) for the frontend framework
- [Node.js](https://nodejs.org/) for the backend runtime

---

**Ready to start selling on Telegram?** Deploy now and have your e-commerce bot running in minutes!