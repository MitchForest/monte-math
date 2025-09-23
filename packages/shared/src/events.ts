import { z } from 'zod'

export const semanticEventSchema = z.union([
  z.object({ type: z.literal('beads.exchanged'), column: z.string(), count: z.number(), to: z.string() }),
  z.object({ type: z.literal('cards.composed'), value: z.number() }),
  z.object({ type: z.literal('sum.read'), value: z.number() }),
  z.object({ type: z.literal('stamp.placed'), row: z.number(), column: z.number(), value: z.number() }),
  z.object({ type: z.literal('checkerboard.placed'), x: z.number(), y: z.number(), value: z.number() }),
  z.object({ type: z.literal('bead-frame.moved'), wire: z.string(), position: z.number() })
])

export type SemanticEvent = z.infer<typeof semanticEventSchema>
