// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

afterEach(() => {
  cleanup()
})

describe('App shell', () => {
  it('renders the ritual mode with the invocation builder before invoke', () => {
    render(<App />)
    expect(screen.getByText(/Inscribe the Root/i)).toBeTruthy()
    expect(screen.queryByTestId('permutation-header')).toBeNull()
  })

  it('exposes both Ritual and Study mode toggles', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /ritual/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /study/i })).toBeTruthy()
  })

  it('transitions into the chamber with the first permutation after INVOKE', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText(/Root · 3 letters/i), {
      target: { value: 'yhv' },
    })
    fireEvent.change(screen.getByLabelText(/Repetitions · full loops/i), {
      target: { value: '2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /invoke/i }))

    // The builder is gone; the chamber header shows the first permutation.
    expect(screen.queryByText(/Inscribe the Root/i)).toBeNull()
    const header = screen.getByTestId('permutation-header')
    expect(header.textContent).toBe('YHV')

    // Telemetry shows 1 / 6 (6 permutations of 3-letter root).
    const telemetry = screen.getByTestId('permutation-telemetry')
    expect(telemetry.textContent).toMatch(/1\s*\/\s*6/)
  })
})
