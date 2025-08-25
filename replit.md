# TeleShop Bot - E-Commerce Telegram Bot System

## Overview

TeleShop Bot is a production-ready Telegram e-commerce bot with a comprehensive admin dashboard. The system enables businesses to sell products through Telegram with features like product catalog management, order processing, customer inquiries, payment methods, delivery options, and broadcast messaging. The architecture follows a full-stack approach with a React admin dashboard and Express.js backend powering the Telegram bot functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Database**: PostgreSQL (Neon serverless) for reliable data persistence
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Migration System**: Drizzle Kit for database schema migrations
- **Connection**: Connection pooling with @neondatabase/serverless for optimal performance
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

## External Dependencies

### Core Services
- **Telegram Bot API**: Primary integration for bot functionality using official Telegram Bot API
- **Neon PostgreSQL**: Serverless PostgreSQL database with WebSocket support for real-time connections
- **Replit Object Storage**: File storage service with Google Cloud Storage backend for image uploads

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