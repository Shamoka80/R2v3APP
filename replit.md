# RUR2 - R2v3 Pre-Certification Self-Assessment

## Overview

RUR2 is a professional monorepo application designed for managing R2v3 pre-certification self-assessments. The application provides a structured workflow for organizations to conduct comprehensive security and compliance evaluations, manage assessment data, and track progress through a modern web interface.

The system follows a clean architecture pattern with a React-based frontend and Express.js backend, designed to be extensible for future integrations with authentication systems, document storage, and export capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing with support for dynamic routes
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Tailwind CSS with custom brand theming and shadcn/ui component library
- **Layout Pattern**: Global layout with top navigation and sidebar navigation for assessment workflow

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js framework
- **Language**: TypeScript with strict mode for enhanced code quality
- **API Design**: RESTful endpoints with health check monitoring
- **Validation**: Zod library integrated for future request/response validation
- **Development**: Hot reload with ts-node and nodemon for rapid development cycles

### Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL with migration support
- **Database**: PostgreSQL datasource with Neon serverless configuration
- **Schema Management**: Shared schema definitions between client and server
- **Connection**: Connection pooling with WebSocket support for serverless environments

### Styling and Theming
- **Design System**: Custom brand color palette with CSS variables
  - Primary: Jade green (#37A874) for primary actions and branding
  - Text: Dim grey (#696B7F) for secondary text and accents
  - Status Colors: Warm oranges and yellows for status indicators
- **Responsive Design**: Mobile-first approach with responsive navigation patterns
- **Accessibility**: AA contrast compliance and focus management

### Development Environment
- **Monorepo Structure**: Organized with separate client, server, and shared directories
- **Package Management**: npm workspaces for dependency management
- **Development Workflow**: Concurrent client and server development with Replit integration
- **Code Quality**: TypeScript strict mode, path aliases, and consistent formatting

### Component Architecture
- **UI Components**: Modular shadcn/ui components with consistent styling
- **Layout Components**: Reusable layout components for navigation and page structure
- **Page Components**: Route-based page components with placeholder functionality
- **Form Handling**: React Hook Form integration prepared for future form implementations

### Security Considerations
- **Type Safety**: Comprehensive TypeScript coverage across client and server
- **Input Validation**: Zod schema validation framework integrated for future API endpoints
- **Error Handling**: Structured error handling with proper HTTP status codes
- **Development Security**: Secure development practices with environment variable management

## External Dependencies

### Core Frontend Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (wouter)
- **UI Library**: Radix UI primitives with shadcn/ui component system
- **State Management**: TanStack React Query for API state management
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: Lucide React icon library
- **Forms**: React Hook Form with Hookform Resolvers

### Core Backend Dependencies
- **Server Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM with Neon PostgreSQL serverless driver
- **Validation**: Zod for schema validation and type inference
- **Development Tools**: tsx for TypeScript execution, nodemon for hot reload

### Development and Build Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: TypeScript compiler with strict configuration
- **Development Environment**: Replit-specific plugins for development banner and error overlay
- **Package Management**: npm with workspace support for monorepo structure

### Database and Storage
- **Database Provider**: Neon serverless PostgreSQL
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection Pooling**: Neon serverless connection pooling
- **Schema Management**: Drizzle Kit for database migrations and schema management

### UI and Styling Dependencies
- **Component Library**: Complete shadcn/ui component set including forms, navigation, data display
- **Styling Utilities**: clsx and tailwind-merge for conditional styling
- **Design Tokens**: class-variance-authority for component variant management
- **Carousel**: Embla Carousel for future data presentation features

The system is architected to support future expansion with authentication providers, document storage services, PDF/Excel export capabilities, and third-party compliance framework integrations while maintaining a clean separation of concerns and type safety throughout the application stack.