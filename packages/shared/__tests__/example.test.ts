import { describe, test, expect } from 'bun:test'
import { z } from 'zod'

describe('Shared Schema Tests', () => {
  test('zod schema validation', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().min(0),
    })

    const valid = { name: 'Test', age: 25 }
    const result = schema.safeParse(valid)

    expect(result.success).toBe(true)
  })
})
