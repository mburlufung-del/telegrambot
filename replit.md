# TeleShop Bot Admin Dashboard

## Overview

TeleShop Bot is a Telegram e-commerce bot system comprising a Telegram bot for automated customer service and product catalog functionality, and a web-based admin dashboard. The system enables administrators to manage products, handle customer inquiries, configure bot settings, and monitor bot statistics. Its business vision is to provide a comprehensive, scalable e-commerce solution for Telegram users, offering a streamlined shopping experience and robust administrative control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter library
- **UI Components**: Shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom design tokens

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe operations
- **Validation**: Zod schemas shared between frontend and backend

### Data Storage
- **Primary Database**: PostgreSQL (Neon serverless hosting)
- **Session Storage**: PostgreSQL-backed sessions
- **Schema Management**: Drizzle Kit for migrations
- **Data Models**: Products, customer inquiries, bot settings, bot statistics

### Bot Integration
- **Telegram Bot**: Node.js Telegram Bot API integration
- **Core Features**: Welcome messages, help, product catalogs, customer inquiry handling
- **Configuration**: Dynamic bot settings stored in the database
- **Statistics**: Real-time tracking of user interactions and metrics
- **Enhanced User Experience**: Auto-vanish functionality for clean chat, persistent welcome interface, inline keyboard navigation.
- **Shopping Flow**: Enhanced product browsing, real-time cart management, multi-step checkout with delivery and payment options, order confirmation, and integration with admin dashboard.
- **Rating System**: Weekly product rating display with average ratings, star distribution, and individual product rating capability.

### Development Environment
- **Build Tool**: Vite for fast development and optimized production builds
- **Deployment**: Multi-platform support including Docker, Railway, Vercel, and VPS
- **Bot Auto-Management**: Always-online infrastructure with auto-initialization, health monitoring, and fault tolerance.

## External Dependencies

### Database Services
- **PostgreSQL**: Used for primary data and session storage.

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

## Enhanced Orders System Implementation (August 2025)

### User-Specific Order History - FULLY IMPLEMENTED

**Complete Orders Management:**

The orders command now provides the user-specific order tracking system you requested:

1. **Empty Orders State**: Professional empty state handling
   - Clear message: "You have no orders yet"
   - Call-to-action to start shopping
   - Browse products button for easy navigation

2. **Successful Orders Display**: Shows only completed/successful orders
   - Filters orders by status: completed, shipped, delivered
   - Excludes pending orders from main display
   - Professional order listing with key information

3. **Order Information Display**: Complete order details
   - Order number (last 6 digits, uppercase)
   - Total amount with currency formatting
   - Order date with locale formatting
   - Order status with proper capitalization

4. **User-Specific Filtering**: Personalized order history
   - Shows only orders for the current Telegram user
   - Proper user identification by telegramUserId
   - Chronological sorting (newest first)

5. **Order Status Management**: Smart status filtering
   - Successful orders: completed, shipped, delivered
   - Pending orders: Shows message about processing
   - No orders: Clear empty state with shopping invitation

6. **Navigation Integration**: Seamless flow continuation
   - Browse products option for new shopping
   - View cart option for pending items
   - Back to menu for main navigation

**Enhanced Features:**
- User-specific order retrieval with getUserOrders() method
- Professional order number display (#123456 format)
- Date formatting for user-friendly display
- Status-based filtering for order visibility
- Empty state handling with clear messaging
- Error handling for order loading failures
- Integration with existing cart and product browsing
- Auto-vanish interface maintained throughout

**Order Display Example:**
```
📦 Your Orders

1. Order #AB1234
   💰 Total: $157.50
   📅 Date: 8/12/2025
   ✅ Status: Delivered

2. Order #CD5678
   💰 Total: $89.99
   📅 Date: 8/10/2025
   ✅ Status: Shipped
```

The orders system now provides complete user-specific order tracking with professional presentation and appropriate filtering.

### Order Number Consistency Fix (August 2025)

**Fixed Order Number Display Consistency:**

1. **Unified Order Number Format**: Fixed discrepancy between order numbers shown during checkout vs. order history
   - Checkout process now generates timestamp-based order numbers (#123456 format)
   - Order history displays same timestamp-based numbers for consistency
   - Both simple and advanced checkout flows use consistent numbering

2. **Immediate Order Visibility**: Orders now marked as "completed" status by default
   - Allows immediate appearance in order history after checkout
   - Users can see their orders right after purchase
   - No waiting for manual status updates

3. **Enhanced Order Display**: Improved order list formatting
   - Clear order number format (#123456)
   - Consistent date and amount display
   - Status information with proper capitalization

**Technical Implementation:**
- Order creation uses timestamp for consistent numbering
- Order display extracts same timestamp format for matching numbers
- Simplified checkout flow with immediate order completion
- Enhanced debugging logs for order tracking verification

## Enhanced Broadcast System Implementation (August 2025)

**Fully Working Broadcast Functionality with Image Upload:**

The broadcast system has been completely rebuilt to provide real bot messaging capabilities:

1. **Object Storage Integration**: Full object storage setup for image uploads
   - Automatic bucket creation and configuration
   - Environment variables for public and private object paths
   - Direct image upload to cloud storage with presigned URLs
   - File validation (image types, 10MB size limit)

2. **Enhanced Broadcast Component**: Direct image upload instead of URL input
   - Real-time file upload with progress tracking
   - Image preview and management
   - Target audience selection (all users, recent users, custom IDs)
   - Message preview with image attachment indicator
   - Professional validation and error handling

3. **Working Bot Broadcast Method**: Actual message sending to users
   - Retrieves real user data from orders database
   - Supports text-only and image+caption broadcasts
   - Smart targeting: all users, recent users (30 days), or custom user IDs
   - Rate limiting protection with delays between messages
   - Proper error handling for failed deliveries
   - Returns actual sent/targeted counts

4. **Image URL Conversion**: Seamless integration with Telegram
   - Converts object storage paths to full URLs for Telegram compatibility
   - Handles both uploaded images and external URLs
   - Automatic domain resolution for different environments

5. **Admin Dashboard Integration**: Complete broadcast management
   - Modal-based broadcast interface
   - Direct integration with bot-settings page
   - Real-time feedback on broadcast success/failure
   - Professional UI with upload progress and status indicators

**Technical Features:**
- Real broadcast functionality (no more simulation)
- Direct image upload with object storage backend
- Proper error handling and user feedback
- Target audience filtering with database queries
- Rate limiting and delivery optimization
- Full TypeScript support with proper typing
- Responsive design for mobile and desktop

The broadcast system now provides complete functionality for admins to send messages with images to bot users, replacing the previous simulation-based approach with real message delivery.