# Sistema Central R&M - Replit Configuration

## Overview

Sistema Central R&M is a comprehensive business management desktop application designed for "R&M Store," a family-owned convenience store and bakery in Córdoba, Argentina. The system serves as the single source of truth for all business data, supporting both manual data entry and real-time API integration with a mobile AI assistant. The application manages sales, inventory, customers, suppliers, finances, and provides intelligent analytics for business optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and Material Icons for consistent theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with session-based authentication using express-session
- **API Security**: Custom API key validation middleware for mobile assistant integration
- **Password Hashing**: Bcrypt for secure API key and password hashing

### Database Design
- **Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Core Entities**:
  - Users (Replit Auth integration)
  - Products with inventory tracking
  - Customers with credit account management
  - Sales with itemized transactions
  - Payments and expenses tracking
  - Suppliers and categories management
  - Stock movements for inventory auditing
  - API keys for mobile assistant access

### API Architecture
- **REST API**: Express.js with TypeScript for type-safe endpoints
- **Dual Authentication**: Web session-based auth for desktop UI, API key authentication for mobile assistant
- **Comprehensive CRUD**: Full operations for all business entities (products, customers, sales, payments, etc.)
- **Real-time Integration**: API endpoints designed for seamless mobile assistant integration
- **Data Validation**: Zod schemas for request/response validation and type safety

### Key Architectural Decisions

**Monorepo Structure**: Single repository with shared schema types between client and server to ensure type consistency and reduce duplication.

**Dual Data Entry Paradigm**: System designed to handle both manual batch entry (end-of-day reconciliation) and real-time API updates from mobile assistant, with clear visual distinction in the UI.

**Type Safety First**: Full TypeScript implementation with shared types, Drizzle ORM, and Zod validation to prevent runtime errors and ensure data integrity.

**Component-Driven UI**: Shadcn/ui components with Radix UI primitives provide accessible, customizable, and consistent user interface elements.

**Serverless-Ready Database**: Neon PostgreSQL with connection pooling for scalability and cost-effectiveness in cloud deployment.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling and automatic scaling
- **Database Connection**: @neondatabase/serverless for optimized serverless database connections

### Authentication & Security
- **Replit Auth**: OpenID Connect authentication integration for user management
- **Session Storage**: PostgreSQL-backed session storage using connect-pg-simple
- **Password Security**: Bcrypt for hashing API keys and sensitive data

### Frontend Libraries
- **UI Framework**: React 18 with TypeScript for modern component development
- **Component Library**: Shadcn/ui with Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **Icons**: Material Icons and Lucide React for comprehensive iconography
- **State Management**: TanStack Query for server state and caching
- **Form Handling**: React Hook Form with Hookform Resolvers for form management
- **Date Management**: date-fns for date formatting and manipulation
- **Routing**: Wouter for lightweight client-side routing

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **TypeScript**: Full type safety across client, server, and shared code
- **Database Tooling**: Drizzle Kit for schema migrations and database management
- **Development Plugins**: Replit-specific plugins for cartographer and dev banner integration
- **Code Quality**: ESBuild for fast server bundling and TypeScript compilation

### Backend Dependencies
- **Server Framework**: Express.js for robust API development
- **ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod for schema validation and type inference
- **Utilities**: Various utility libraries for encryption, memoization, and data processing