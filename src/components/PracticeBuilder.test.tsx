// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PracticeBuilder } from './PracticeBuilder'
import { formatDuration } from './formatDuration'

afterEach(() => {
  cleanup()
})

function setup(
  props: Partial<Parameters<typeof PracticeBuilder>[0]> = {},
) {
  const onInvoke = vi.fn()
  render(<PracticeBuilder onInvoke={onInvoke} {...props} />)
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

  it('rejects digits and symbols at the correct length with the exact alphabet copy', () => {
    const { onInvoke } = setup()
    fireEvent.change(rootInput(), { target: { value: 'Y1V' } })
    submit()
    expect(screen.getByText('Only letters A-Z are permitted.')).toBeTruthy()
    expect(onInvoke).not.toHaveBeenCalled()

    fireEvent.change(rootInput(), { target: { value: 'Y-V' } })
    submit()
    expect(screen.getByText('Only letters A-Z are permitted.')).toBeTruthy()
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

describe('PracticeBuilder — live preview', () => {
  it('hides the preview until the root validates', () => {
    setup()
    expect(screen.queryByTestId('ritual-preview')).toBeNull()
    fireEvent.change(rootInput(), { target: { value: 'yh' } })
    expect(screen.queryByTestId('ritual-preview')).toBeNull()
  })

  it('shows normalized root, total permutations, duration, and 6 chips for a 3-letter root', () => {
    setup()
    fireEvent.change(rootInput(), { target: { value: 'yhv' } })
    fireEvent.change(repsInput(), { target: { value: '1' } })

    expect(screen.getByTestId('ritual-preview')).toBeTruthy()
    expect(screen.getByTestId('preview-normalized').textContent).toBe('YHV')
    expect(screen.getByTestId('preview-total').textContent).toBe('6')
    // 6 permutations × 1 rep × 8s = 48s → 0:48
    expect(screen.getByTestId('preview-duration').textContent).toBe('0:48')
    expect(screen.getAllByTestId('preview-chip')).toHaveLength(6)
  })

  it('recomputes duration when repetition count changes', () => {
    setup()
    fireEvent.change(rootInput(), { target: { value: 'yhv' } })
    fireEvent.change(repsInput(), { target: { value: '3' } })
    // 6 × 3 × 8 = 144s → 2:24
    expect(screen.getByTestId('preview-duration').textContent).toBe('2:24')

    fireEvent.change(repsInput(), { target: { value: '13' } })
    // 6 × 13 × 8 = 624s → 10:24
    expect(screen.getByTestId('preview-duration').textContent).toBe('10:24')
  })

  it('renders prefilled initial values and shows preview on mount', () => {
    setup({ initialRoot: 'YHV', initialRepetitionCount: 2 })
    expect(
      (screen.getByLabelText(/Root · 3 letters/i) as HTMLInputElement).value,
    ).toBe('YHV')
    expect(
      (screen.getByLabelText(/Repetitions · full loops/i) as HTMLInputElement)
        .value,
    ).toBe('2')
    expect(screen.getByTestId('preview-total').textContent).toBe('6')
    expect(screen.getByTestId('preview-duration').textContent).toBe('1:36')
  })
})

describe('formatDuration', () => {
  it('formats sub-minute durations as M:SS', () => {
    expect(formatDuration(48)).toBe('0:48')
    expect(formatDuration(8)).toBe('0:08')
  })

  it('formats minute-aligned durations with padded seconds', () => {
    expect(formatDuration(60)).toBe('1:00')
    expect(formatDuration(144)).toBe('2:24')
  })

  it('renders ten-minute and longer durations without leading zero on minutes', () => {
    expect(formatDuration(600)).toBe('10:00')
    expect(formatDuration(624)).toBe('10:24')
    expect(formatDuration(3600)).toBe('60:00')
  })

  it('floors fractional seconds and clamps negatives', () => {
    expect(formatDuration(48.9)).toBe('0:48')
    expect(formatDuration(-5)).toBe('0:00')
  })
})
