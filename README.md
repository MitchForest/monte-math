# Monte Math

Montessori mathematics education platform with programmatic materials and content.

## Project Structure

```
monte/
├── apps/
│   ├── web/          # Student player app (Vite + React)
│   ├── api/          # Backend API (Bun + Hono)
│   └── studio/       # Content authoring (Next.js)
├── packages/
│   ├── shared/       # Shared types and schemas (Zod)
│   └── content-builder/ # Content validation and publishing
├── content/          # Lesson content and materials
└── tools/           # Build scripts and utilities
```

## Development Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start development servers:
```bash
# Player app (http://localhost:5173)
pnpm dev:web

# API server (http://localhost:3001)
pnpm dev:api

# Studio app (http://localhost:3002)
pnpm dev:studio
```

## Scripts

- `pnpm build` - Build all packages
- `pnpm test` - Run tests
- `pnpm lint` - Lint code
- `pnpm typecheck` - Type check all packages
- `bun tools/build-content.ts` - Build and validate content

## Tech Stack

- **Player:** React, Vite, PixiJS, Zustand, TanStack Router/Query
- **API:** Bun, Hono, SQLite/Kysely
- **Studio:** Next.js, React
- **Shared:** TypeScript, Zod