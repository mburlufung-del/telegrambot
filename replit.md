# TeleShop Bot Admin Dashboard

## Overview
TeleShop Bot is a comprehensive Telegram e-commerce bot system with EXCLUSIVE client access through Telegram bot only (no web interface for customers). The system provides robust administrative control via a web-based admin dashboard. It offers a scalable e-commerce solution with automated customer service, product catalog management, and real-time statistics. Administrators manage products, handle inquiries, configure bot settings, and monitor performance through the web dashboard, while all customer interactions happen exclusively through the Telegram bot interface.

## User Preferences
- Preferred communication style: Simple, everyday language
- Client access: EXCLUSIVE Telegram bot access only (no web interface for customers)
- Admin access: Web dashboard for management and configuration
- Integration: All admin changes instantly reflected in Telegram bot for customers

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter library
- **UI Components**: Shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom design tokens

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints
- **Database ORM**: Drizzle ORM
- **Validation**: Zod schemas (shared)

### Data Storage
- **Primary Database**: PostgreSQL (Neon serverless hosting)
- **Session Storage**: PostgreSQL-backed sessions
- **Schema Management**: Drizzle Kit for migrations
- **Data Models**: Products, customer inquiries, bot settings, bot statistics, orders, delivery methods.

### Bot Integration - Production Ready
- **Platform**: Telegram Bot API
- **Core Features**: Welcome messages, product catalogs, customer inquiry handling, multi-step checkout, real-time cart management, order confirmation, and a product rating system.
- **Product Discovery**: Automatic detection of new products via standard database queries (human logic based)
- **Cart Integration**: Universal cart functionality for all products with stock > 0
- **Stock Management**: Auto-defaults to 10 units for new products to ensure immediate cart availability
- **Configuration**: Dynamic bot settings managed via admin dashboard.
- **Statistics**: Real-time user interaction tracking.
- **Enhanced User Experience**: Auto-vanish functionality, persistent welcome interface, inline keyboard navigation, and user-specific order history.
- **Admin Control**: Comprehensive bot information management (general info, messages, operator settings, payment settings, custom commands) and a robust broadcast system with image upload capabilities.
- **Delivery Management**: Dynamic and configurable delivery methods integrated into the checkout flow.
- **Production Logic**: Simple boolean logic (isActive=true AND stock>0 = cart buttons show)

### Development Environment
- **Build Tool**: Vite
- **Deployment**: Multi-platform support (Docker, Railway, Vercel, VPS).
- **Bot Auto-Management**: Always-online infrastructure with auto-initialization, health monitoring, and fault tolerance.
- **Production Hosting**: Permanent product integration with human-understandable logic, no AI-specific patterns.

## External Dependencies

### Database Services
- **PostgreSQL**: Primary data and session storage.

### Telegram Integration
- **Telegram Bot API**: Official framework for bot interactions.

### UI and Styling
- **Radix UI**: Headless component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.

### Development Tools
- **TypeScript**: Static type checking.
- **Vite**: Build tool.

### Form and Validation
- **React Hook Form**: Form management.
- **Zod**: Runtime type validation and schema definition.

### Utility Libraries
- **Date-fns**: Date manipulation.
- **Class Variance Authority**: Type-safe component variant management.
- **CLSX**: Conditional CSS class name composition.