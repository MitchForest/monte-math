# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

Monte Math is a TypeScript monorepo using pnpm workspaces for Montessori mathematics education:

- `apps/api/` - Backend API (Bun + Hono + oRPC + SQLite/Kysely)
- `apps/web/` - Student lesson player (React + Vite + PixiJS)
- `apps/studio/` - Content authoring tool (React + Vite + Dagre)
- `packages/shared/` - Core schemas, types, and oRPC contracts (Zod v4)
- `packages/api-client/` - Type-safe API client wrapper
- `packages/content-builder/` - Content validation utilities
- `content/` - Educational content (skills graph, lessons)

## Essential Development Commands

```bash
# Development servers
pnpm dev:api       # Start API on port 3001
pnpm dev:web       # Start web app on port 5173
pnpm dev:studio    # Start studio on port 3002

# Quality checks (ALWAYS run before committing)
pnpm lint          # ESLint check
pnpm lint:fix      # Auto-fix linting issues
pnpm typecheck     # TypeScript type checking
pnpm format        # Prettier formatting
pnpm check         # Combined type/lint/format check

# Testing
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm test:coverage # Generate coverage report

# Building
pnpm build         # Build all packages

# Content sync (API must be running)
pnpm sync:pull     # Import content/ to database
pnpm sync:push     # Export database to content/
```

## Architecture & Key Patterns

### Contract-First API Design

All API contracts are defined in `packages/shared/src/contract.ts` using Zod schemas and oRPC. This provides end-to-end type safety:

1. Define schemas in `@monte/shared` using Zod
2. Implement server routes in `apps/api/src/router/`
3. Client apps consume via `@monte/api-client`

### Workspace Dependencies

Packages reference each other using `workspace:*` protocol. Import shared code using:

```typescript
import { schemas } from '@monte/shared'
import { client } from '@monte/api-client'
```

### Technology Stack

- **Runtime**: Bun for API, Node for frontend apps
- **API**: oRPC for type-safe RPC with REST compatibility
- **Database**: SQLite with Kysely query builder
- **Frontend**: React 18, TanStack Router/Query, Zustand
- **Styling**: Tailwind CSS v4 with shadcn/ui (New York theme)
- **Graphics**: PixiJS for interactive math materials
- **Validation**: Zod v4 throughout the stack

### Key Files & Patterns

- API routes: `apps/api/src/router/*.ts`
- Database migrations: `apps/api/drizzle/`
- Shared schemas: `packages/shared/src/schemas/*.ts`
- Content definitions: `content/lessons/*.json`, `content/skills/*.json`
- Frontend routing: `apps/*/src/routes/` using file-based routing

### Development Workflow

1. For API changes: Update contract in `@monte/shared`, implement in `apps/api`
2. For UI changes: Work in relevant app directory, use existing components
3. For content: Edit JSON in `content/`, run `pnpm sync:pull` to update database
4. Always run `pnpm check` before committing code changes
