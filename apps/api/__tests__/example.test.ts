import { describe, test, expect } from 'bun:test'

describe('API Tests', () => {
  test('example test', () => {
    expect(1 + 1).toBe(2)
  })

  // Example async test
  test('async operation', async () => {
    const result = await Promise.resolve('success')
    expect(result).toBe('success')
  })
})
