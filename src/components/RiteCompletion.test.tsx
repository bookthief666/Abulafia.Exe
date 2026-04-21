// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RiteCompletion } from './RiteCompletion'
import type { CompletionSnapshot } from '../session/ritualSession'

afterEach(() => {
  cleanup()
})

function makeSnapshot(overrides: Partial<CompletionSnapshot> = {}): CompletionSnapshot {
  return {
    root: 'YHV',
    permutations: ['YHV', 'YVH', 'HYV', 'HVY', 'VYH', 'VHY'],
    repetitionCount: 2,
    totalPermutations: 6,
    finalPermutation: 'VHY',
    ...overrides,
  }
}

function renderComponent(overrides: Partial<CompletionSnapshot> = {}) {
  const onReinvoke = vi.fn()
  const onRepeat = vi.fn()
  const onStay = vi.fn()
  render(
    <RiteCompletion
      snapshot={makeSnapshot(overrides)}
      onReinvoke={onReinvoke}
      onRepeat={onRepeat}
      onStay={onStay}
    />,
  )
  return { onReinvoke, onRepeat, onStay }
}

describe('RiteCompletion', () => {
  it('renders root, total permutations, repetition count, and final permutation', () => {
    renderComponent()
    expect(screen.getByTestId('rite-completion-root').textContent).toBe('YHV')
    expect(screen.getByTestId('rite-completion-total').textContent).toBe('6')
    expect(screen.getByTestId('rite-completion-reps').textContent).toBe('2')
    expect(screen.getByTestId('rite-completion-final').textContent).toBe('VHY')
  })

  it('is a labeled modal dialog', () => {
    renderComponent()
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBe('rite-completion-title')
    expect(document.getElementById(labelledBy!)?.textContent).toMatch(/rite sealed/i)
  })

  it('invokes the matching callback exactly once per button', () => {
    const { onReinvoke, onRepeat, onStay } = renderComponent()
    fireEvent.click(screen.getByRole('button', { name: /repeat session/i }))
    fireEvent.click(screen.getByRole('button', { name: /reinvoke/i }))
    fireEvent.click(screen.getByRole('button', { name: /stay in chamber/i }))
    expect(onRepeat).toHaveBeenCalledTimes(1)
    expect(onReinvoke).toHaveBeenCalledTimes(1)
    expect(onStay).toHaveBeenCalledTimes(1)
  })

  it('auto-focuses the first action button on mount', () => {
    renderComponent()
    const repeat = screen.getByRole('button', { name: /repeat session/i })
    expect(document.activeElement).toBe(repeat)
  })
})
