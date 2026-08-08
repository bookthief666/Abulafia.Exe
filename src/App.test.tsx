// @vitest-environment happy-dom
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import App from './App'
import { getFieldState, resetField } from './components/fieldSignal'

/** Long enough to clear the crossfade in App. */
const CROSSFADE = 400

/** Drive a mode change through its crossfade. */
function settle() {
  act(() => {
    vi.advanceTimersByTime(CROSSFADE)
  })
}

function click(name: RegExp) {
  fireEvent.click(screen.getByRole('button', { name }))
  settle()
}

beforeEach(() => {
  vi.useFakeTimers()
  resetField()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('App', () => {
  it('opens at the gate, with no way to navigate away from it yet', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Abulafia.exe',
    )
    // The gate is the threshold; the mode nav only appears past it.
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('carries the entered name into the chamber', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('The Name'), {
      target: { value: 'ABC' },
    })
    click(/begin the rite/i)

    // 3! = 6 arrangements of three letters.
    const position = screen.getByRole('group', { name: 'Position' })
    expect(position.textContent).toContain('1/6')
    expect(position.textContent).toContain('1/3')
  })

  it('reaches the manual from the gate and comes back', () => {
    render(<App />)
    click(/study the method/i)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Tzeruf Ha-Otiot',
    )

    click(/^gate$/i)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Abulafia.exe',
    )
  })

  it('moves between the chamber and the manual', () => {
    render(<App />)
    click(/begin the rite/i)
    expect(screen.getByRole('group', { name: 'Position' })).toBeTruthy()

    click(/^study$/i)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Tzeruf Ha-Otiot',
    )

    click(/^ritual$/i)
    expect(screen.getByRole('group', { name: 'Position' })).toBeTruthy()
  })

  it('leaves the chamber for the gate', () => {
    render(<App />)
    click(/begin the rite/i)
    click(/^exit$/i)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Abulafia.exe',
    )
  })

  it('unmounts the chamber rather than hiding it behind the fade', () => {
    // A chamber left mounted under a transparent layer would keep its
    // metronome running unseen.
    render(<App />)
    click(/begin the rite/i)
    click(/^study$/i)

    expect(screen.queryByRole('group', { name: 'Position' })).toBeNull()
    expect(screen.queryByRole('button', { name: /^pause$|^begin$/i })).toBeNull()
  })

  it('returns the atmosphere to rest when the chamber is left', () => {
    render(<App />)
    click(/begin the rite/i)
    expect(getFieldState().mode).toBe('ritual')

    click(/^exit$/i)
    expect(getFieldState().mode).toBe('idle')
  })

  it('restarts the rite when a different name is entered', () => {
    render(<App />)
    click(/begin the rite/i)
    expect(screen.getByRole('group', { name: 'Position' }).textContent).toContain(
      '1/24',
    )

    click(/^exit$/i)
    fireEvent.change(screen.getByLabelText('The Name'), {
      target: { value: 'ABC' },
    })
    click(/begin the rite/i)

    expect(screen.getByRole('group', { name: 'Position' }).textContent).toContain(
      '1/6',
    )
  })
})
