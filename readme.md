# Overview

StockFlow is a comprehensive inventory management system built as a full-stack web application. The system provides stock catalog browsing for public users, request management for authenticated users, and administrative controls for inventory managers. It features a modern React frontend with shadcn/ui components, an Express.js backend, and PostgreSQL database integration through Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React 18 with TypeScript, using Vite for build tooling and development server
- **UI Framework**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Styling**: Tailwind CSS with CSS variables for theming support

**Component Architecture**: 
- Modular component structure with clear separation between UI components (`/components/ui`) and business logic components
- Page-based routing with dedicated components for public catalog, user dashboard, and admin dashboard
- Modal-based interactions for stock requests and administrative actions

## Backend Architecture

**Server Framework**: Express.js with TypeScript running in ESM mode
- **Database Integration**: Drizzle ORM with PostgreSQL, using Neon serverless for database connectivity
- **Authentication**: OpenID Connect integration with Replit Auth system using Passport.js
- **Session Management**: Express sessions with PostgreSQL session store for persistent authentication
- **API Design**: RESTful endpoints with role-based access control

**Data Layer**:
- Type-safe database queries using Drizzle ORM
- Schema validation with Zod for API endpoints
- Centralized storage interface pattern for data operations

## Database Design

**Core Entities**:
- **Users**: Authentication data with admin role flags
- **Stocks**: Inventory items with metadata, quantities, and categories  
- **Stock Requests**: User requests for inventory items with approval workflow
- **Stock History**: Audit trail for inventory changes
- **Sessions**: Persistent session storage for authentication

**Key Relationships**:
- Users can create multiple stock requests
- Stock requests reference specific stock items
- Stock history tracks changes to stock quantities
- Admin users can approve/deny requests and manage inventory

## Authentication & Authorization

**Authentication Strategy**: OpenID Connect with Replit as identity provider
- Session-based authentication with secure cookie storage
- Automatic user profile creation and updates
- Role-based access control with admin/user distinctions

**Access Patterns**:
- Public access: Stock catalog viewing
- Authenticated users: Request submission and status tracking
- Admin users: Full inventory management and request approval

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Authentication Services  
- **Replit Auth**: OpenID Connect identity provider integration
- **Passport.js**: Authentication middleware with OpenID Connect strategy

## UI & Styling Libraries
- **Radix UI**: Headless component primitives for accessibility and behavior
- **shadcn/ui**: Pre-built component library with consistent design system
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Build tool and development server with HMR support
- **TypeScript**: Static type checking across frontend and backend
- **Drizzle Kit**: Database migration and schema management tooling
- **TanStack Query**: Server state management with automatic caching and synchronization

## Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Schema validation for runtime type safety
- **@hookform/resolvers**: Integration between React Hook Form and Zod validation