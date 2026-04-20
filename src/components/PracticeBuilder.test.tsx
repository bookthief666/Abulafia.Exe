// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PracticeBuilder } from './PracticeBuilder'

afterEach(() => {
  cleanup()
})

function setup() {
  const onInvoke = vi.fn()
  render(<PracticeBuilder onInvoke={onInvoke} />)
  return { onInvoke }
}

function rootInput() {
  return screen.getByLabelText(/Root · 3 letters/i) as HTMLInputElement
}
function repsInput() {
  return screen.getByLabelText(/Repetitions · full loops/i) as HTMLInputElement
}
function submit() {
  fireEvent.click(screen.getByRole('button', { name: /invoke/i }))
}

describe('PracticeBuilder', () => {
  it('renders invocation eyebrow and title', () => {
    setup()
    expect(screen.getByText(/§ Invocation/i)).toBeTruthy()
    expect(screen.getByText(/Inscribe the Root/i)).toBeTruthy()
  })

  it('does not surface errors before the first submit attempt', () => {
    setup()
    expect(
      screen.queryByText(/Inscribe three letters/i),
    ).toBeNull()
  })

  it('rejects empty root on submit', () => {
    const { onInvoke } = setup()
    submit()
    expect(screen.getByText(/Inscribe three letters/i)).toBeTruthy()
    expect(onInvoke).not.toHaveBeenCalled()
  })

  it('rejects root with whitespace', () => {
    const { onInvoke } = setup()
    fireEvent.change(rootInput(), { target: { value: 'Y H' } })
    submit()
    expect(screen.getByText(/whitespace is not permitted/i)).toBeTruthy()
    expect(onInvoke).not.toHaveBeenCalled()
  })

  it('rejects root shorter than 3 without padding', () => {
    const { onInvoke } = setup()
    fireEvent.change(rootInput(), { target: { value: 'YH' } })
    submit()
    expect(screen.getByText(/exactly 3 letters/i)).toBeTruthy()
    expect(onInvoke).not.toHaveBeenCalled()
  })

  it('rejects root longer than 3 without truncating', () => {
    const { onInvoke } = setup()
    fireEvent.change(rootInput(), { target: { value: 'YHVH' } })
    submit()
    expect(screen.getByText(/exactly 3 letters/i)).toBeTruthy()
    expect(onInvoke).not.toHaveBeenCalled()
  })

  it('rejects non-positive repetitions', () => {
    const { onInvoke } = setup()
    fireEvent.change(rootInput(), { target: { value: 'yhv' } })
    fireEvent.change(repsInput(), { target: { value: '0' } })
    submit()
    expect(screen.getByText(/positive integer/i)).toBeTruthy()
    expect(onInvoke).not.toHaveBeenCalled()
  })

  it('invokes with normalized uppercase root and integer repetitions', () => {
    const { onInvoke } = setup()
    fireEvent.change(rootInput(), { target: { value: 'yhv' } })
    fireEvent.change(repsInput(), { target: { value: '3' } })
    submit()
    expect(onInvoke).toHaveBeenCalledTimes(1)
    expect(onInvoke).toHaveBeenCalledWith('YHV', 3)
  })
})
