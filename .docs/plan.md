# Monte Math — Canonical Architecture & Implementation Plan

> **Stack:**
> **Web (Player):** React + Vite, Tailwind + shadcn/ui, Zustand, TanStack Router, TanStack Query, PixiJS
> **Backend:** Bun + Hono, SQLite (libSQL/Turso in prod) + Kysely
> **Content:** Git-based versioning for MDX + JSON scripts (immutable published versions)
> **Studio (Admin/No-Code):** Next.js (or Vite) app for authoring/preview, publishing, KG visualization

---

## 0) Goals

* **Scale to thousands of lessons** with **immutable**, versioned JSON/MDX + media published to a CDN.
* Build **programmatic materials** (Pixi) + **programmatic tutorials/worked/practice** via templates and seeded generators.
* Keep **engine state** (skills, mastery, XP) small, fast, and type-safe in SQLite/Kysely.
* Provide a **Studio** for non-technical editing, organizing lessons, and **visualizing the Knowledge Graph (KG)**.
* Enable **AI-assisted authoring** (CLI agents) without corrupting structure (Zod-validated contracts).

---

## 1) Monorepo Layout

```
monte/
  apps/
    web/                      # Student player (Vite SPA)
      src/
        routes/               # /, /learn, /lesson/:id, /checkpoint/:id, /review
        components/
          player/             # LessonPlayer, Presenter, Controls
          materials/          # Pixi scenes (golden-beads, stamp-game, checkerboard)
            golden-beads/
              Scene.ts
              exchange.ts
              practice.ts
              effects.ts
          ui/                 # shadcn/ui wrappers
        lib/
          types.ts            # re-export from @monte/shared
          player-store.ts     # Zustand store (mode, stage, step, xp, hints)
          telemetry.ts
          sw.ts               # service worker (prefetch manifest + next lessons)
      vite.config.ts
      index.html
    api/                      # Bun + Hono (engine/state)
      src/
        index.ts
        routes/
          next.ts             # GET next task
          lessons.ts          # GET lesson manifest/version (proxy to CDN if needed)
          attempts.ts         # POST attempt (correct, latency)
          xp.ts               # GET/POST XP goal/progress
          auth.ts
        engine/
          mastery.ts          # mastery + fluency rules
          srs.ts              # spaced repetition scheduler
          selector.ts         # next-task policy (uses KG + user skill state)
        db/
          schema.ts           # Kysely tables
          migrations/
          seed.ts
      bunfig.toml
    studio/                   # Authoring/admin app (Next.js recommended)
      src/
        pages/
          lessons/[lessonId].tsx     # JSON/MDX editor + live preview (Pixi embed)
          publish.tsx                # publish flows, version bump, diffs
          knowledge-graph.tsx        # KG visualization, edit node edges
          search.tsx                 # search/filter lessons
          telemetry.tsx              # lesson health, hint usage, errors
        lib/
          api.ts                     # calls Content Registry + API
          graph.ts                   # graph transforms for vis
          auth.ts
      next.config.js
  packages/
    shared/                   # Zod & TS contracts used by all apps
      src/
        lesson.ts             # Lesson, LessonScript, Stage, StepAction, PracticeTemplate
        skill.ts              # Skill, SkillPrereq, mastery states
        events.ts             # SemanticEvent contracts
        zod.ts
      package.json
    content-builder/          # CLI library used by CI/studio to validate & publish
      src/
        validate.ts
        compile.ts            # macro expansion, template → script
        smoke-test.ts         # headless playback
        publish.ts            # push to S3/CDN, write manifest.json
      package.json
  content/                    # Git-backed content source (optional if Studio writes to S3)
    lessons/
      lesson-17-column-2x1/
        params.json           # template parameters for generation
        strings.en.json       # narration tokens
        1.0.0/script.json
        1.0.0/readme.mdx
        media/*
    manifests/
      manifest.json           # latest versions, indexes (generated)
  tools/
    build-content.ts          # CLI entrypoint (invokes content-builder)
  pnpm-workspace.yaml
  README.md
```

---

## 2) Shared Contracts (Zod + TS)

```ts
// packages/shared/src/lesson.ts
import { z } from "zod";

export const StepAction = z.union([
  z.object({ kind: z.literal("focus"), target: z.string(), zoom: z.number().optional() }),
  z.object({ kind: z.literal("highlight"), target: z.string(), style: z.enum(["ring","pulse"]).optional() }),
  z.object({ kind: z.literal("spawn"), thing: z.enum(["unit","ten","hundred","thousand","card"]), qty: z.number(), to: z.string() }),
  z.object({ kind: z.literal("move"), target: z.string(), to: z.string(), qty: z.number().optional() }),
  z.object({ kind: z.literal("exchange"), column: z.enum(["units","tens","hundreds","thousands"]) }),
  z.object({ kind: z.literal("prompt"), text: z.string(), token: z.string().optional() }), // token for i18n
  z.object({ kind: z.literal("gate-do"), expect: z.string(), hint: z.string().optional() }),
  z.object({ kind: z.literal("wait"), ms: z.number() })
]);

export const Step = z.object({
  id: z.string(),
  label: z.string().optional(),
  actions: z.array(StepAction)
});

export const Stage = z.object({
  id: z.string(),
  mode: z.enum(["tutorial","worked","practice"]),
  heading: z.string().optional(),
  materialSlug: z.string(),
  materialConfig: z.record(z.any()).optional(),
  steps: z.array(Step).optional(),
  practiceTemplateId: z.string().optional()
});

export const LessonScript = z.object({
  lessonId: z.string(),
  version: z.string(),           // immutable
  stages: z.array(Stage),
  practiceTemplates: z.array(z.object({
    id: z.string(),
    prompt: z.string(),
    inputs: z.record(z.any()),
    answer: z.any(),
    meta: z.record(z.any()).optional()
  })).optional()
});
export type LessonScript = z.infer<typeof LessonScript>;
```

```ts
// packages/shared/src/skill.ts
export const Skill = z.object({
  id: z.string(),                // "S053"
  code: z.string().optional(),
  name: z.string(),
  description: z.string().optional()
});
export const SkillPrereq = z.object({
  skillId: z.string(),
  prereqId: z.string()
});
export const MasteryState = z.enum(["not_started","learning","mastered","review_due"]);
```

```ts
// packages/shared/src/events.ts
export const SemanticEvent = z.union([
  z.object({ type: z.literal("beads.exchanged"), column: z.string(), count: z.number(), to: z.string() }),
  z.object({ type: z.literal("cards.composed"), value: z.number() }),
  z.object({ type: z.literal("sum.read"), value: z.number() }),
  // extend for each material
]);
```

---

## 3) Player ↔ Material Contract (Pixi)

**Material Scene API (simple, stable):**

```ts
export interface MaterialScene {
  mount(canvas: HTMLCanvasElement, cfg?: Record<string, unknown>): void;
  apply(action: z.infer<typeof StepAction>): Promise<void>; // script drives this
  lock(interactive: boolean): void;                          // gate during "do"
  onSemantic(cb: (e: z.infer<typeof SemanticEvent>) => void): () => void;
  generate(templateId: string, seed: number): any;           // practice input
  validate(input: any, reading: any): { correct: boolean };  // practice check
  unmount(): void;
}
```

**LessonPlayer loop (simplified):**

* Loads `LessonScript` (by `lessonId@version` from CDN).
* For **tutorial**: iterates steps → `scene.apply(action)`; supports pause/rewind; adds XP.
* For **worked**: runs “show” actions; for `gate-do` waits for matching `SemanticEvent`; hints reduce XP; continue.
* For **practice**: uses `scene.generate()` with seed; disables overlays; after user completes, `scene.validate()` → log attempt (correct + latency), add XP.

---

## 4) Data & API

**Kysely tables (essentials):**

* `skill(id TEXT PK, name TEXT, description TEXT)`
* `skill_prereq(skill_id TEXT, prereq_skill_id TEXT, PRIMARY KEY(skill_id, prereq_skill_id))`
* `user(id TEXT PK, …)`
* `user_skill(user_id TEXT, skill_id TEXT, mastery TEXT, fluency_ms INTEGER, last_seen_at TEXT, next_review_at TEXT)`
* `attempt(id TEXT PK, user_id TEXT, skill_id TEXT, lesson_id TEXT, version TEXT, correct INTEGER, latency_ms INTEGER, created_at TEXT)`
* `xp_log(id TEXT PK, user_id TEXT, source TEXT, amount INTEGER, meta_json TEXT, created_at TEXT)`
* `goal_daily(user_id TEXT PK, xp_target INTEGER, updated_at TEXT)`

**Hono routes:**

```
GET  /manifest                           # CDN proxy or cached manifest.json
GET  /lessons/:lessonId/script           # redirect/proxy to CDN script.json
GET  /next                               # engine selects next {kind, id, estXP}
POST /attempt                            # {userId, skillId, lessonId, version, correct, latencyMs}
GET  /xp                                 # {todayXP, goal, streak}
POST /xp/goal                            # {goal}
POST /auth/login                         # optional
```

**Engine basics:**

* `selector.ts`: unlockable skills = prereqs mastered; choose next by priority (new learning, review due via SRS, checkpoint).
* `mastery.ts`: e.g., mastery = `3 of last 4` correct + **fluency** threshold (skill-specific).
* `srs.ts`: review intervals (1w → 1m → 3m → 6m); shorten on failure/high latency.

---

## 5) Content Pipeline (Immutable Versions)

**Authoring options:**

* **Files-first:** `content/lessons/**` – PR-based authoring.
* **Studio:** internal app writes JSON/MDX to S3 (drafts), then triggers **Content Builder** to publish immutable version.

**Content Builder steps:**

1. **Validate** with Zod contracts.
2. **Compile** templates → scripts (macro expansion).
3. **Smoke-test**: headless Pixi runner advances timeline; validates `gate-do.expect` has matching emitted events.
4. **Publish** to CDN under immutable path:
   `/lessons/<lessonId>/<version>/script.json`
   `/lessons/<lessonId>/<version>/readme.mdx`
5. **Emit `manifest.json`** (latest versions + indexes):

   * `lessons.json`: `{ "lesson-17-column-2x1": "1.3.2", ... }`
   * `skills.json`: skill → lessonIds\@versions
   * `topics.json`: topic → lessonIds\@versions
   * `search.json`: tags, locale, difficulty

**Player flow:** fetch `manifest.json` on boot (cache), then `script.json` for the assigned lesson/version.

---

## 6) Programmatic Materials & Content Generation

**Materials (Pixi)**

* Each manipulative implements `MaterialScene` and exposes a **factory**:

  ```ts
  export function createMaterial(slug: "golden-beads" | "checkerboard", opts): MaterialScene
  ```
* Keep **deterministic RNG** for practice seeds and reproducible sessions.

**Template Generators**

* Example: `golden-beads:column-add` produces tutorial/worked timelines from params `{ addendA, addendB }`.
* Practice generators: `(seed)=>{input}` + `validate(input, reading)`.

**AI-assisted authoring**

* Use a CLI (`tools/authoring-agent.ts`) to draft steps/narration **into a valid schema** (Zod-checked).
* Require **CI validation** + smoke tests; never allow agents to publish directly.

---

## 7) Studio (Authoring/Admin + KG Visualization)

**Features:**

* **Lesson list/search:** filter by topic, skill, version, status (draft/published).
* **Lesson editor:** JSON form (Zod-driven), narration tokens with locale tabs, **live preview** (mount Pixi scene with the current JSON).
* **Publish panel:** diff from previous version, semantic check results, push to CDN.
* **Knowledge Graph view:**

  * Force-directed or DAG layout (e.g., Cytoscape.js/elkjs).
  * Search nodes by ID/name/tags.
  * Select a skill → see prereqs, dependents, linked lessons.
  * **Edit edges** (add/remove prereqs) with validation (no cycles).
  * “Simulate learner” mode: toggle mastered nodes to preview unlockable set.
* **Telemetry dashboards:** step durations, hint usage, gate failures, item difficulty drift.
* **Permissions:** roles (Viewer, Author, Reviewer, Publisher, Admin).

**Tech choices:**

* Next.js (RSC OK, but mark player preview route as `"use client"`).
* Component libs: shadcn/ui, react-hook-form + Zod, TanStack Table, Cytoscape.js for graph; Monaco editor for JSON with schema intellisense.

---

## 8) UX & Player

* **Home:** XP goal progress, “Start” (engine-chosen next task), Review card.
* **Lesson Player:** tabs (Tutorial / Worked / Practice / Review), captions, hints, rewind.
* **Checkpoint quiz:** branded “Checkpoint”, items span multiple skills; XP bonus.
* **Progress:** streaks, XP history; parents see mastery/fluency and upcoming reviews.
* **Accessibility:** keyboard equivalents for drag/drop; captions; high-contrast mode.

---

## 9) Testing, CI/CD, Ops

* **Unit tests:** materials logic (exchange/compose), practice validators, engine rules.
* **Integration tests:** headless Pixi smoke run per script (catch bad steps).
* **Visual snapshots:** optional for key material frames.
* **CI pipeline:** lint → typecheck → unit → content-builder validate+smoke → publish to CDN (staging) → promote to prod.
* **Observability:** API logs, attempt metrics; client telemetry batched per stage.
* **Backups:** SQLite with Turso branches (or Litestream to S3 if self-hosted).
* **Feature flags:** allow pinning lesson versions per cohort.

---

## 10) Copy-Paste Quick Starts

**Player install**

```bash
pnpm add react react-dom vite tailwindcss @tanstack/router @tanstack/react-query zustand pixi.js
```

**API install**

```bash
pnpm add -w hono bun sqlite kysely @libsql/kysely-libsql zod
```

**Shared package alias (tsconfig paths)**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@monte/shared": ["packages/shared/src"] }
  }
}
```

**Minimal Player mount**

```tsx
// apps/web/src/routes/lesson.$id.tsx
import script from "../../content/local/lesson-17-column-2x1/script.json"; // dev only
import { LessonPlayer } from "../components/player/LessonPlayer";
export default function LessonRoute() {
  return <LessonPlayer script={script} />;
}
```

**Hono route skeleton**

```ts
// apps/api/src/routes/next.ts
import { Hono } from "hono";
export const next = new Hono()
  .get("/", async (c) => {
    // read user_skill, pick next task via engine/selector
    return c.json({ kind: "lesson", lessonId: "lesson-17-column-2x1", version: "1.0.3", estXP: 12 });
  });
```

**Content Builder (CLI entry)**

```ts
// tools/build-content.ts
import { LessonScript } from "@monte/shared";
import { validateScript, smokeTest, publish, emitManifest } from "@monte/content-builder";

const lessons: LessonScript[] = loadLocalLessons(); // from content/
for (const script of lessons) {
  validateScript(script);
  await smokeTest(script);     // headless Pixi runner
  await publish(script);       // push to CDN path by lessonId/version
}
await emitManifest();
```

---

## 11) Organization & Naming

* **Lesson IDs:** `lesson-<topic-number>-<slug>` e.g., `lesson-17-column-2x1`
* **Versions:** semantic (`1.3.2`) — **immutable**; publish a new version to change behavior.
* **Materials:** slugs: `golden-beads`, `checkerboard`, `stamp-game`, `bead-frame`.
* **Practice templates:** `golden-beads:add-2x1`, `checkerboard:pp-2x2`, etc.
* **Skill IDs:** keep the canonical `S001…` as already defined; store `skills.json` on CDN.

---

## 12) Security & Roles

* **Studio auth:** email SSO or Auth0; roles in DB.
* **Publish rights:** Reviewer → Publisher workflow; record version + checksum + publisher id.
* **API auth:** JWT per student/parent; rate limit attempts endpoint.
* **Content integrity:** script JSON must pass schema + smoke test; signed publish artifacts if needed.

---

## 13) Roadmap (practical)

1. **Week 1–2:** Stand up `apps/web` (player shell), `apps/api` (attempt/xp/next), `packages/shared` (schemas). Implement **Golden Beads** scene + first scripted lesson.
2. **Week 3:** Add **Content Builder** (validate+smoke+publish) and publish to CDN; player loads via manifest.
3. **Week 4:** Implement **engine** (selector/mastery/SRS) with a small KG seed; wire `GET /next`.
4. **Week 5:** Spin up **Studio** MVP (list/search, JSON editor, preview, publish).
5. **Week 6+:** KG visualization; templates for **Checkerboard**, **Stamp Game**; add telemetry dashboards; localization; authoring guardrails.

---

### TL;DR

* **React/Vite** player + **Pixi** materials; **Bun/Hono + SQLite/Kysely** engine.
* **Immutable lesson bundles** (JSON/MDX) on **CDN**, built by a **Content Builder**; **Studio** edits and publishes.
* **Programmatic** everything: materials, tutorials, worked examples, practice generators.
* **Shared schemas** + **headless smoke tests** keep thousands of lessons organized and safe.
* **Studio** doubles as **admin** with **KG visualization** and publish workflow.
