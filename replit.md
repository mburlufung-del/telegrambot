# TeleShop Bot Admin Dashboard

## Overview

TeleShop Bot is a Telegram e-commerce bot with an accompanying web-based admin dashboard. The system allows administrators to manage products, handle customer inquiries, configure bot settings, and monitor bot statistics through a modern React-based interface. The bot integrates with Telegram's API to provide automated customer service and product catalog functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter library for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful API endpoints with proper HTTP status codes and error handling
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Validation**: Zod schemas shared between frontend and backend for consistent data validation

### Data Storage
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Data Models**: Products, customer inquiries, bot settings, and bot statistics tables

### Bot Integration
- **Telegram Bot**: Node.js Telegram Bot API integration for automated customer interactions
- **Bot Features**: Welcome messages, help commands, product catalogs, and customer inquiry handling
- **Configuration**: Dynamic bot settings stored in database for runtime customization
- **Statistics**: Real-time tracking of user interactions, message counts, and order metrics

### Development Environment
- **Build Tool**: Vite for fast development server and optimized production builds
- **Development**: Hot module replacement and runtime error overlay for developer experience
- **Deployment**: Multi-platform support with Docker, Railway, Vercel, and VPS configurations
- **Environment**: Auto-detection of development/production modes with appropriate bot configurations
- **Platform Agnostic**: Designed for seamless deployment across multiple hosting providers

## External Dependencies

### Database Services
- **In-Memory Storage**: Default development storage with automatic initialization
- **PostgreSQL Support**: Optional production database with Neon or custom hosting
- **Environment-based Configuration**: Automatic detection and connection setup

### Telegram Integration
- **Telegram Bot API**: Official Telegram bot framework with polling and webhook support
- **Multi-Environment Support**: Development polling mode and production webhook mode
- **Dynamic Configuration**: Bot token manageable through admin dashboard or environment variables
- **Platform Compatibility**: Supports Railway, Vercel, DigitalOcean, Docker, and VPS deployments

### UI and Styling
- **Radix UI**: Headless component primitives for accessibility and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Consistent icon library for user interface elements

### Development Tools
- **TypeScript**: Static type checking across the entire application stack
- **Vite Plugins**: Runtime error modals and Replit-specific development enhancements
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer plugins

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Runtime type validation and schema definition
- **Hookform Resolvers**: Integration between React Hook Form and Zod validation

### Utility Libraries
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Type-safe component variant management
- **CLSX**: Conditional CSS class name composition