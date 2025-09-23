import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Studio App Tests', () => {
  test('basic math', () => {
    expect(1 + 1).toBe(2)
  })

  test('component render example', () => {
    // Example component test
    const TestComponent = () => <div>Monte Studio</div>

    render(<TestComponent />)
    expect(screen.getByText('Monte Studio')).toBeInTheDocument()
  })
})
