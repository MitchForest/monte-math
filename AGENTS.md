# Repository Guidelines

## Project Structure & Module Organization

- `apps/` hosts runtime targets: `api` (Bun + Hono BFF), `web` (lesson player), `studio` (authoring UI). Source lives in `src/` with colocated `__tests__/`.
- `packages/` shares reusable code: `shared` defines Zod contracts, `api-client` wraps oRPC calls, `content-builder` provides CLI utilities.
- `content/` stores canonical curriculum JSON used for seeding SQLite; treat commits here as source of truth.
- `tools/` holds Bun scripts for exports, secret generation, and maintenance tasks.

## Build, Test, and Development Commands

- Install once with `pnpm install`; individual apps rely on workspace hoisting.
- Start the stack with `pnpm dev:api`, `pnpm dev:web`, and `pnpm dev:studio` (API on 3001, clients on 5173 and 3002).
- Run `pnpm build` to compile every package; use `pnpm --filter <name> build` when iterating locally.
- Use `pnpm check` before review; it runs type-checking, linting, and Prettier verification.

## Coding Style & Naming Conventions

- TypeScript everywhere; keep modules ESNext and avoid `any` (lint warns).
- Format with Prettier (`pnpm format`). Respect repo defaults: 2-space tabs, single quotes, no semicolons, 100-character line width, LF endings.
- ESLint enforces unused-variable rules; prefix throwaway values with `_` if needed. UI components follow PascalCase, hooks remain camelCase.

## Testing Guidelines

- Client apps use Vitest + Testing Library; run with `pnpm --filter @monte/web test` for suites.
- Bun-based packages (`apps/api`, `packages/shared`, etc.) rely on `bun test`; call through `pnpm --filter @monte/api test` to stay within the workspace.
- Place specs in a colocated `__tests__/` directory and suffix files with `.test.ts`/`.test.tsx`.
- Aim to keep coverage steady—Vitest and Bun emit reports via `pnpm test:coverage`; review HTML output before merging.

## Commit & Pull Request Guidelines

- Match the existing log: short, imperative commit subjects (`add auth and design`); include scope when useful (for example, `feat(api): add auth guard`).
- Open PRs with a crisp summary, linked issue or ticket, and screenshots or recordings for UI changes. Note schema or DB migrations explicitly.
- Confirm `pnpm check` and relevant tests pass, and mention any skipped suites. Flag impacts to `content/` so reviewers can inspect data diffs.

## Environment & Data Sync

- Seed the local database from curriculum files via `pnpm --filter @monte/api db:seed`.
- Keep content and SQLite in sync with `pnpm sync:pull` (content → DB) and `pnpm sync:push` (DB → content).
- Store secrets locally using `bun run tools/generate-secrets.ts`; never commit generated `.env` artifacts.
