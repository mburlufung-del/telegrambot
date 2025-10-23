# TeleShop Bot - Multi-Store E-Commerce Telegram Bot System

## Overview

TeleShop Bot is a production-ready **multi-store** Telegram e-commerce platform with comprehensive admin dashboards. The system enables running up to **10 independent Telegram shop bots** simultaneously, each managing its own store with separate products, categories, orders, and settings. All bots share the same codebase and database but maintain complete data isolation through bot ID partitioning. The architecture follows a full-stack approach with React admin dashboards and Express.js backends.

## User Preferences

Preferred communication style: Simple, everyday language.

## Multi-Store Architecture

### Core Concept
- **10 Bots, 1 Codebase**: All bots run identical code from the same Docker image
- **Shared Database**: Single PostgreSQL instance with data partitioned by `botId`
- **Complete Isolation**: Each bot only accesses its own data (products, orders, etc.)
- **Independent Dashboards**: Each bot has its own admin dashboard on separate ports (5001-5010)

### Bot ID System
- Bot ID extracted from Telegram token: `8467452442:SECRET` → Bot ID: `8467452442`
- Every database table includes `botId` column for data partitioning
- Storage layer auto-injects `botId` into all queries and inserts
- Zero cross-contamination between bots

### Data Partitioning Tables
All store data is partitioned by `botId`:
- **products**, **categories**, **orders**, **cart**, **wishlist**
- **inquiries**, **payment_methods**, **delivery_methods**
- **bot_settings**, **bot_stats**, **tracked_users**, **broadcasts**
- **pricing_tiers**, **product_ratings**

Shared global data (not partitioned):
- **currencies**, **languages**, **exchange_rates**

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Custom component library built with Radix UI primitives and Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the entire stack
- **Bot Framework**: node-telegram-bot-api for Telegram Bot API integration
- **API Design**: RESTful API with consistent error handling and logging middleware
- **File Upload**: Object storage service with presigned URL generation for secure file uploads
- **Development Mode**: Polling for development, webhook support for production deployment

### Database & ORM
- **Database**: PostgreSQL 16 for reliable data persistence
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Migration System**: Drizzle Kit for database schema migrations
- **Connection**: Connection pooling with pg (node-postgres) driver for optimal performance
- **Schema**: Comprehensive schema covering products, orders, categories, inquiries, bot settings, payment methods, delivery methods, and user analytics

### Data Models
- **Products**: Full catalog management with pricing tiers, stock tracking, categories, and specifications
- **Orders**: Complete order lifecycle with status tracking and delivery information
- **Categories**: Hierarchical product organization with active/inactive states
- **Inquiries**: Customer support system with read/unread status tracking
- **Bot Settings**: Dynamic configuration management for bot behavior customization
- **Payment Methods**: Flexible payment options with instructions and active status
- **Delivery Methods**: Multiple shipping options with pricing and estimated delivery times

### Authentication & Security
- **Bot Authentication**: Telegram Bot Token-based authentication with secure token storage
- **API Security**: Express middleware for request validation and error handling
- **File Upload Security**: Signed URLs with expiration for secure object storage access
- **Environment Variables**: Secure configuration management for sensitive data

### Real-time Features
- **Live Data Updates**: Auto-refreshing queries with configurable intervals for real-time dashboard updates
- **Bot Status Monitoring**: Live bot status tracking with automatic reconnection capabilities
- **Activity Logging**: Comprehensive request/response logging for debugging and monitoring

## Recent Changes (October 2025)

### Multi-Bot Deployment System
- **Date**: October 9, 2025
- **Status**: Bot 1 deployed and operational (bots 2-10 ready for deployment)
- **Infrastructure**: Docker-based deployment on Hostinger VPS (72.60.20.38)
- **Database**: PostgreSQL 16 with standard pg driver (replaced Neon WebSocket driver)
- **Critical Bug Fixed**: Server now serves dashboard regardless of bot initialization status
- **Note**: All features described in this document currently apply to Bot 1. Multi-bot deployment in progress.

### Multi-Bot Setup Tools (October 23, 2025)
- **Helper Scripts Created**: Comprehensive tools to simplify adding bots 2-10
  - `MULTI_BOT_SETUP.md`: Detailed step-by-step guide for multi-bot deployment
  - `QUICK_START_BOTS_2-10.txt`: Quick reference card with all essential commands
  - `check-bot-setup.sh`: Validation script to verify bot token configuration
  - `bot-commands.sh`: Interactive command-line tool for bot management
- **Configuration**: `.env.docker.example` contains placeholders for all 10 bot tokens
- **Deployment Strategy**: Users can deploy 1-10 bots incrementally without rebuilding infrastructure

### Deployment Architecture
- **Hosting**: Hostinger VPS at 72.60.20.38
- **Containerization**: Docker with docker-compose orchestration
- **Bot Capacity**: Designed for 10 bots on ports 5001-5010
- **Database**: Single PostgreSQL instance shared across all bots
- **Bot 1**: ✅ Deployed and operational on port 5001 (@mdphpwelt_shopbot)
- **Bots 2-10**: Ports 5002-5010 reserved for future deployment

### VPS Configuration
- **Location**: /var/www/telegrambot
- **Docker Network**: telegrambot_default
- **PostgreSQL**: telegrambot-postgres-1 (internal port 5432)
- **Environment**: Production mode with tsx runtime

## External Dependencies

### Core Services
- **Telegram Bot API**: Primary integration for bot functionality using official Telegram Bot API
- **PostgreSQL**: Standard PostgreSQL database with pg driver for reliable connections
- **Docker**: Containerization platform for isolated bot deployments

### Development Dependencies
- **Vite Plugins**: Runtime error handling, development cartographer, and React support
- **Tailwind CSS**: Utility-first CSS framework with custom design system variables
- **TypeScript**: Type safety across frontend, backend, and shared schema definitions

### Bot Capabilities
- **Product Browsing**: Interactive product catalog with category navigation
- **Order Management**: Full e-commerce workflow from cart to order completion
- **Customer Support**: Inquiry system with admin dashboard integration
- **Broadcast Messaging**: Mass messaging capabilities with targeting options
- **Payment Processing**: Multiple payment method support with custom instructions
- **Delivery Options**: Configurable shipping methods with pricing and time estimates

### Admin Dashboard Features
- **Product Management**: CRUD operations with image upload and pricing tier support
- **Order Tracking**: Real-time order status monitoring and management
- **Analytics**: Dashboard with key metrics and performance indicators
- **Bot Configuration**: Dynamic bot settings with real-time updates
- **Customer Inquiries**: Centralized inbox for customer communications
- **Broadcast System**: Marketing message distribution with user targeting