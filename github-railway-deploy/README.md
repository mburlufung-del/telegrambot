# TeleShop Bot - Railway Deployment via GitHub

Complete Telegram e-commerce bot with admin dashboard, ready for Railway deployment.

## 🚀 Quick Railway Deployment

### Method 1: Railway Dashboard (Recommended)
1. Fork this repository to your GitHub account
2. Visit [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your forked repository
5. Add PostgreSQL database service
6. Deploy automatically

### Method 2: Railway CLI
```bash
git clone https://github.com/YOUR_USERNAME/teleshop-bot.git
cd teleshop-bot
railway login
railway init
railway add postgresql
railway up
```

## 🤖 Bot Configuration

**Bot Token**: `7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs`

Pre-configured in all deployment files. Bot will start automatically on Railway deployment.

## 📱 Features

### Telegram Bot
- Welcome messages with inline keyboards
- Product catalog with categories
- Shopping cart functionality
- Order management and checkout
- Customer inquiry system
- Automated stock management
- Order confirmation and tracking

### Admin Dashboard
- Product management (add, edit, delete, image upload)
- Category management
- Order tracking and fulfillment
- Customer inquiry responses
- Broadcasting system with image upload
- Bot settings configuration
- Real-time analytics and statistics
- Payment settings management
- Delivery method configuration

## 🛠 Technical Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React 18, Vite, Tailwind CSS
- **Database**: PostgreSQL (Neon serverless)
- **Bot**: Telegram Bot API with node-telegram-bot-api
- **UI**: Shadcn/ui components, Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **State**: TanStack Query for server state

## 🌍 Environment Variables

Pre-configured for Railway deployment:

```env
NODE_ENV=production
BOT_TOKEN=7331717510:AAGbWPSCRgCgi3TO423wu7RWH1oTTaRSXbs
SESSION_SECRET=teleshop_bot_secure_session_2024
DATABASE_URL=postgresql://... (auto-configured by Railway)
```

## 🎯 Post-Deployment

1. **Test Bot**: Search for your bot on Telegram and send `/start`
2. **Admin Access**: Visit your Railway domain for the admin dashboard
3. **Setup Products**: Add your products and categories
4. **Configure Settings**: Set up payment methods and delivery options
5. **Go Live**: Your e-commerce bot is ready for customers!

## 🔧 Railway Configuration

- **Build**: `npm install && npm run build`
- **Start**: `npm start`
- **Health Check**: `/api/health`
- **Auto-restart**: On failure
- **Database**: PostgreSQL included

## 📊 Monitoring

The admin dashboard provides real-time monitoring:
- Total users and orders
- Revenue tracking
- Bot status and health
- Database connectivity tests
- Integration status verification

## 🛡 Security

- Session-based authentication
- CSRF protection
- SQL injection prevention
- XSS protection
- Environment variable encryption

## 📞 Support

Bot is production-ready with comprehensive error handling, auto-recovery, and monitoring systems.

Railway deployment typically completes in 2-3 minutes with automatic SSL certificates and custom domains available.