# @monte/api – Contract-First Backend

The API service exposes the Monte Math contract over HTTP, acting as the “backend-for-frontend” for both the player and studio applications.

## Responsibilities

- Implement the oRPC contract from `@monte/shared/src/contracts/app.ts`.
- Validate every request/response with Zod 4.
- Persist curriculum metadata (skills & prerequisites) in SQLite via Kysely.
- Stream lesson scripts from `content/lessons/*/script.json`.
- Serve a single RPC endpoint (`/rpc`) for both web clients.

## Key Technology

| Layer          | Library                        | Reason                                                 |
| -------------- | ------------------------------ | ------------------------------------------------------ |
| Runtime        | Bun                            | Fast startup + native TypeScript/ESM                   |
| HTTP           | Hono                           | Lightweight router over Fetch API                      |
| Contracts      | @orpc/server + Zod 4           | Type-safe RPC with runtime validation                  |
| Database       | SQLite (libsql-ready) + Kysely | Strong typing end-to-end, easy to swap to Turso/libSQL |
| Content ingest | Native FS                      | Reads immutable lesson JSON under `content/`           |

## Package Boundaries

- **Consumes:** `@monte/shared` (schemas + contract), content files (skills/lessons).
- **Exports:** RPC endpoint only. Client apps must go through `@monte/api-client`.
- **Does not:** Provide React assets, expose DB handles, or define UI logic.

## Development

```bash
# Run migrations (writes to apps/api/monte.db)
pnpm --filter @monte/api db:migrate

# Optional seed from content/skills/graph.json
pnpm --filter @monte/api db:seed

# Start the API
pnpm dev:api
```

To export the current database state back into the `content/` directory, run `pnpm sync:push` from the repository root.

The service listens on `http://localhost:3001` with RPC routes under `/rpc`. Health check is `/health`.

## Data Flow

1. **Contract:** request shapes defined in `@monte/shared`.
2. **Implementation:** `apps/api/src/procedures/index.ts` binds contract procedures to Bun handlers.
3. **Transport:** `@orpc/server/fetch` adapter publishes `/rpc/*` routes via Hono (`src/index.ts`).
4. **Storage:** skills/prereqs live in SQLite (`src/db`), lesson JSON is read on demand.

Keep all new endpoints inside the contract. Add Zod schemas in `@monte/shared`, implement in `apps/api`, and rely on the generated `@monte/api-client` for consumers.
