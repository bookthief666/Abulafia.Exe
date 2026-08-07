// @vitest-environment happy-dom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { RitualGate } from './RitualGate'

afterEach(() => {
  document.body.innerHTML = ''
})

function nameField(): HTMLInputElement {
  return screen.getByLabelText('The Name') as HTMLInputElement
}

function beginButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: /begin the rite/i }) as HTMLButtonElement
}

describe('RitualGate', () => {
  it('opens on the canonical name', () => {
    render(<RitualGate onBegin={vi.fn()} />)
    expect(nameField().value).toBe('YHVH')
  })

  it('explains the practice in plain language', () => {
    render(<RitualGate onBegin={vi.fn()} />)
    expect(screen.getByText(/every arrangement of its/i)).toBeTruthy()
    expect(screen.getByText(/five gates of vowel and/i)).toBeTruthy()
  })

  it('reports permutations, breaths and duration for the default name', () => {
    render(<RitualGate onBegin={vi.fn()} />)
    // YHVH: 4! = 24 permutations, x4 letters x5 gates = 480 breaths,
    // at 8s each = 3840s, which rolls over into hours.
    const scope = screen.getByText(/permutations/)
    expect(scope.textContent).toContain('24 permutations')
    expect(scope.textContent).toContain('480 breaths')
    expect(scope.textContent).toContain('1h 4m')
  })

  it('recomputes the scope as the name changes', () => {
    render(<RitualGate onBegin={vi.fn()} />)
    fireEvent.change(nameField(), { target: { value: 'ABC' } })
    // 3! = 6 permutations, x3 letters x5 gates = 90 breaths.
    const scope = screen.getByText(/permutations/)
    expect(scope.textContent).toContain('6 permutations')
    expect(scope.textContent).toContain('90 breaths')
  })

  it('reports hours once a rite runs past sixty minutes', () => {
    render(<RitualGate onBegin={vi.fn()} />)
    fireEvent.change(nameField(), { target: { value: 'ABCDE' } })
    // 5! = 120 permutations, x5 letters x5 gates = 3000 breaths = 400 min.
    expect(screen.getByText(/permutations/).textContent).toMatch(/6h 40m/)
  })

  it('hands the normalised name to the caller', () => {
    const onBegin = vi.fn()
    render(<RitualGate onBegin={onBegin} />)
    fireEvent.change(nameField(), { target: { value: ' yh vh ' } })
    fireEvent.click(beginButton())
    expect(onBegin).toHaveBeenCalledWith('YHVH')
  })

  it('opens the rite on Enter as well as the button', () => {
    const onBegin = vi.fn()
    render(<RitualGate onBegin={onBegin} />)
    fireEvent.keyDown(nameField(), { key: 'Enter' })
    expect(onBegin).toHaveBeenCalledWith('YHVH')
  })

  it('refuses an empty name', () => {
    const onBegin = vi.fn()
    render(<RitualGate onBegin={onBegin} />)
    fireEvent.change(nameField(), { target: { value: '' } })
    expect(beginButton().disabled).toBe(true)
    fireEvent.click(beginButton())
    expect(onBegin).not.toHaveBeenCalled()
  })

  it('refuses a name longer than seven letters, and says why', () => {
    const onBegin = vi.fn()
    render(<RitualGate onBegin={onBegin} />)
    fireEvent.change(nameField(), { target: { value: 'ABCDEFGH' } })

    expect(screen.getByText(/7 letters maximum/i)).toBeTruthy()
    expect(beginButton().disabled).toBe(true)
    fireEvent.click(beginButton())
    expect(onBegin).not.toHaveBeenCalled()
  })

  it('accepts exactly seven letters', () => {
    const onBegin = vi.fn()
    render(<RitualGate onBegin={onBegin} />)
    fireEvent.change(nameField(), { target: { value: 'ABCDEFG' } })
    expect(beginButton().disabled).toBe(false)
    fireEvent.click(beginButton())
    expect(onBegin).toHaveBeenCalledWith('ABCDEFG')
  })

  it('offers the manual only when there is somewhere to send the reader', () => {
    const onStudy = vi.fn()
    const { unmount } = render(<RitualGate onBegin={vi.fn()} onStudy={onStudy} />)
    fireEvent.click(screen.getByRole('button', { name: /study the method/i }))
    expect(onStudy).toHaveBeenCalled()
    unmount()

    render(<RitualGate onBegin={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /study the method/i })).toBeNull()
  })
})
