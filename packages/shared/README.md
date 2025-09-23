# @monte/shared – Schemas & Contracts

This package is the canonical source of truth for Monte Math data models. It defines every Zod schema, TypeScript type, and oRPC contract used across the platform.

## Responsibilities

- Declare curriculum entities (skills, lesson scripts, practice templates).
- Expose the oRPC `appContract` consumed by the API and clients.
- Provide reusable validation logic so content, API handlers, and tools stay aligned.

## What It Does **Not** Do

- It does not include any HTTP/RPC transport logic (see `@monte/api-client`).
- It does not read files or talk to databases.
- It should remain dependency-light (Zod + contract only).

## Structure

- `src/lesson.ts` – Golden bead lesson schema (stages, actions, configs).
- `src/skill.ts` – Skill & prerequisite schema + mastery states.
- `src/events.ts` – Semantic event definitions for material telemetry.
- `src/types.ts` – Shared utility schemas (next task, attempts, XP responses).
- `src/contracts/app.ts` – oRPC router definition (skills, lessons, engine, xp).

## Usage Examples

```ts
import { lessonScriptSchema, appContract } from '@monte/shared'

// Validate JSON content
const script = lessonScriptSchema.parse(rawLesson)

// Extend the contract (in apps/api)
const lessons = implement(appContract.lessons)
```

Any new endpoint or entity must be added here first so every consumer (API, tooling, clients) receives updated typings automatically.
