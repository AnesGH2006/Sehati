# Herfati - Artisan Marketplace Platform

## Overview

Herfati (حرفتي) is an Arabic-language marketplace platform connecting customers with skilled artisans in the Tiaret region of Algeria. The platform enables users to browse artisan profiles, filter by category and location (daira), communicate via real-time chat, and manage subscription tiers. The interface is fully RTL (right-to-left) with Arabic typography using Cairo and Tajawal fonts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS v4 with CSS variables for theming, plus shadcn/ui component library (New York style)
- **Theme Support**: next-themes for light/dark mode switching
- **Animations**: Framer Motion for page transitions and micro-interactions

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Connection**: Neon Serverless PostgreSQL with WebSocket support
- **Build System**: Custom esbuild script that bundles server dependencies for faster cold starts

### Data Layer
- **Schema Location**: `shared/schema.ts` contains all Drizzle table definitions
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Tables**: users, artisans, messages, conversations
- **Storage Interface**: Abstract `IStorage` interface in `server/storage.ts` with `DatabaseStorage` implementation

### Key Design Patterns
- **Shared Types**: The `shared/` directory contains schema definitions used by both client and server
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared modules
- **Component Structure**: UI primitives in `components/ui/`, feature components in dedicated folders
- **Mock Data**: `lib/constants.ts` contains mock artisans and reference data for development

### Page Structure
- Home (`/`): Hero section with search, featured artisans, feature highlights
- Artisans (`/artisans`): Filterable grid with sidebar filters (category, daira, price range)
- Profile (`/profile/:id`): Individual artisan detail page with portfolio
- Chat (`/chat`, `/chat/:id`): Real-time messaging interface
- Subscription (`/subscription`): Tiered pricing plans for customers and artisans
- Auth (`/auth`): Login and registration with role selection

### Guest Customer Mode
- Customers do **not** need to register to chat with artisans, send emergency requests, or post reviews.
- `useAuth().ensureGuest()` in `client/src/lib/auth.tsx` lazily creates a stable guest session (id stored in `localStorage.herfati_guest_id`, name "زائر") on first interaction.
- `isLoggedIn` stays `false` for guests so the navbar still surfaces Login / Join CTAs; `isGuest` is exposed if a feature needs to differentiate.
- Artisan accounts still require real registration via the existing auth flow.

### Arabic Craft Labels
- All UI surfaces (dashboard, profile, chat header, nearby map popups & list, admin, emergency result) translate the raw English category id ("tailoring", "carpentry", …) via the `categoryLabel(id)` helper exported from `client/src/lib/constants.ts`.
- Database & API still store the canonical English id; only the display layer is Arabic.

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL via `@neondatabase/serverless`
- **Connection**: Requires `DATABASE_URL` environment variable
- **Migrations**: Managed via `drizzle-kit push` command

### UI Libraries
- **Radix UI**: Full suite of accessible primitives (dialog, dropdown, tabs, etc.)
- **Embla Carousel**: For image carousels
- **cmdk**: Command palette component
- **vaul**: Drawer component

### Development Tools
- **Replit Plugins**: cartographer, dev-banner, runtime-error-modal for Replit integration
- **PostCSS**: With Tailwind and Autoprefixer

### Fonts (External)
- Google Fonts: Cairo (headings) and Tajawal (body text) loaded via CDN