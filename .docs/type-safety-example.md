# End-to-End Type Safety Example

## 1. Define Schema Once (Shared Package)

```typescript
// packages/shared/src/procedures.ts
import { z } from 'zod'

export const CreateLessonInput = z.object({
  title: z.string().min(1).max(100),
  skillId: z.string(),
  stages: z.array(
    z.object({
      mode: z.enum(['tutorial', 'worked', 'practice']),
      materialSlug: z.string(),
    })
  ),
})

export type CreateLessonInput = z.infer<typeof CreateLessonInput>
```

## 2. Server Uses Schema (API)

```typescript
// apps/api/src/procedures/lessons.ts
import { orpc } from '@orpc/server'
import { CreateLessonInput } from '@monte/shared'

export const lessonRouter = orpc.router({
  create: orpc
    .input(CreateLessonInput) // ← Zod validation
    .mutation(async ({ input }) => {
      // input is fully typed & validated
      const result = await db
        .insertInto('lessons')
        .values(input) // ← Kysely type-checks this
        .execute()
      return result
    }),
})
```

## 3. Client Gets Full Types (Web/Studio)

```typescript
// apps/studio/src/components/LessonForm.tsx
import { useForm } from '@tanstack/react-form'
import { CreateLessonInput } from '@monte/shared'
import { orpc } from '@/lib/orpc-client'

function LessonForm() {
  const createLesson = orpc.lessons.create.useMutation()

  const form = useForm({
    defaultValues: {
      title: '',
      skillId: '',
      stages: []
    },
    onSubmit: async (values) => {
      // values is type-checked against CreateLessonInput
      await createLesson.mutateAsync(values)
    },
    validators: {
      onChange: CreateLessonInput // ← Same Zod schema!
    }
  })

  return (
    <form onSubmit={form.handleSubmit}>
      <form.Field
        name="title"
        children={(field) => (
          <input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      />
      {/* Auto-complete and type checking for all fields! */}
    </form>
  )
}
```

## 4. Database Types (Kysely)

```typescript
// apps/api/src/db/types.ts
interface Database {
  lessons: {
    id: string
    title: string
    skill_id: string
    created_at: Date
  }
  // ... other tables
}

// Kysely queries are fully typed
const lessons = await db
  .selectFrom('lessons')
  .where('skill_id', '=', skillId) // ← Type-checked!
  .select(['id', 'title'])
  .execute()
// lessons is typed as Array<{id: string, title: string}>
```

## Type Safety Guarantees

✅ **Can't pass wrong types** - TypeScript catches at compile time
✅ **Can't skip validation** - Zod enforces at runtime
✅ **Can't query wrong columns** - Kysely types from schema
✅ **Can't mismatch client/server** - oRPC shares contracts
✅ **Can't submit invalid forms** - TanStack Form + Zod

## What Happens When You Change Something?

1. Update Zod schema in `shared` package
2. TypeScript immediately shows errors everywhere affected
3. Fix all type errors → guaranteed consistency
4. Runtime validation automatically updated

No manual type syncing, no out-of-sync contracts! 🎉
