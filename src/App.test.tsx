// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

// Stub SomaticHud so the App integration focuses on orchestration — completion
// overlay, repeat, reinvoke, stay, and mode isolation — rather than the
// RAF-driven chamber mechanics (already covered by useMivta + metronomeEngine
// test suites). The stub exposes a button that fires the exhale→inhale edge
// directly, standing in for the chamber's phase-edge detector.
vi.mock('./components/SomaticHud', () => {
  return {
    SomaticHud: (props: {
      permutation?: string
      permutationIndex?: number
      permutationTotal?: number
      onBreathCycle?: () => void
    }) => (
      <div data-testid="somatic-hud">
        <div data-testid="permutation-header">{props.permutation ?? ''}</div>
        <div data-testid="permutation-telemetry">
          {(props.permutationIndex ?? 0) + 1} / {props.permutationTotal ?? 0}
        </div>
        <button
          type="button"
          data-testid="fire-breath-cycle"
          onClick={() => props.onBreathCycle?.()}
        >
          Fire Breath Cycle
        </button>
      </div>
    ),
  }
})

import App from './App'

afterEach(() => {
  cleanup()
})

function invoke(root = 'yhv', reps = '1') {
  fireEvent.change(screen.getByLabelText(/Root · 3 letters/i), {
    target: { value: root },
  })
  fireEvent.change(screen.getByLabelText(/Repetitions · full loops/i), {
    target: { value: reps },
  })
  fireEvent.click(screen.getByRole('button', { name: /invoke/i }))
}

function fireBreathCycles(n: number) {
  const button = screen.getByTestId('fire-breath-cycle')
  for (let i = 0; i < n; i++) fireEvent.click(button)
}

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
    invoke('yhv', '2')

    expect(screen.queryByText(/Inscribe the Root/i)).toBeNull()
    const header = screen.getByTestId('permutation-header')
    expect(header.textContent).toBe('YHV')

    const telemetry = screen.getByTestId('permutation-telemetry')
    expect(telemetry.textContent).toMatch(/1\s*\/\s*6/)
  })

  it('isolates the inactive layer with inert, keeping both layers mounted', () => {
    render(<App />)
    const ritualLayer = screen.getByTestId('ritual-layer')
    const studyLayer = screen.getByTestId('study-layer')

    // Initially: ritual active, study inert.
    expect(ritualLayer.hasAttribute('inert')).toBe(false)
    expect(studyLayer.hasAttribute('inert')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /^study$/i }))
    expect(ritualLayer.hasAttribute('inert')).toBe(true)
    expect(studyLayer.hasAttribute('inert')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /^ritual$/i }))
    expect(ritualLayer.hasAttribute('inert')).toBe(false)
    expect(studyLayer.hasAttribute('inert')).toBe(true)
  })

  it('does not render the completion overlay before the rite ends', () => {
    render(<App />)
    invoke('yhv', '1')
    expect(screen.queryByTestId('rite-completion')).toBeNull()
  })
})

describe('App — ritual loop closure', () => {
  it('reveals the completion overlay after the final breath cycle', () => {
    render(<App />)
    invoke('yhv', '1')
    fireBreathCycles(6)
    const overlay = screen.getByTestId('rite-completion')
    expect(overlay).toBeTruthy()
    expect(screen.getByTestId('rite-completion-root').textContent).toBe('YHV')
    expect(screen.getByTestId('rite-completion-total').textContent).toBe('6')
    expect(screen.getByTestId('rite-completion-reps').textContent).toBe('1')
  })

  it('Repeat Session restarts the rite in-place and hides the overlay', () => {
    render(<App />)
    invoke('yhv', '1')
    fireBreathCycles(6)
    expect(screen.getByTestId('rite-completion')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /repeat session/i }))

    expect(screen.queryByTestId('rite-completion')).toBeNull()
    // Chamber stays mounted; permutation index resets to 0 (header shows YHV).
    expect(screen.getByTestId('permutation-header').textContent).toBe('YHV')
    const telemetry = screen.getByTestId('permutation-telemetry')
    expect(telemetry.textContent).toMatch(/1\s*\/\s*6/)
    // Builder did not re-appear.
    expect(screen.queryByText(/Inscribe the Root/i)).toBeNull()
  })

  it('Reinvoke returns to the builder with the previous root and reps prefilled', () => {
    render(<App />)
    invoke('yhv', '4')
    // 4 reps × 6 permutations each = 24 breath-cycle edges to complete.
    fireBreathCycles(24)
    expect(screen.getByTestId('rite-completion')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /reinvoke/i }))

    // Overlay is gone, chamber is gone, builder is back with prefilled values.
    expect(screen.queryByTestId('rite-completion')).toBeNull()
    expect(screen.queryByTestId('permutation-header')).toBeNull()
    expect(screen.getByText(/Inscribe the Root/i)).toBeTruthy()
    const root = screen.getByLabelText(/Root · 3 letters/i) as HTMLInputElement
    const reps = screen.getByLabelText(/Repetitions · full loops/i) as HTMLInputElement
    expect(root.value).toBe('YHV')
    expect(reps.value).toBe('4')
  })

  it('Stay in Chamber dismisses the overlay while the chamber keeps its frozen final permutation', () => {
    render(<App />)
    invoke('yhv', '1')
    fireBreathCycles(6)
    const finalText = screen.getByTestId('rite-completion-final').textContent
    fireEvent.click(screen.getByRole('button', { name: /stay in chamber/i }))

    expect(screen.queryByTestId('rite-completion')).toBeNull()
    // Chamber still reflects the final (frozen) permutation.
    expect(screen.getByTestId('permutation-header').textContent).toBe(finalText)
    // Extra breath cycles must not re-open the overlay —
    // advancePermutation is a no-op when the session is complete.
    fireBreathCycles(8)
    expect(screen.queryByTestId('rite-completion')).toBeNull()
  })
})
