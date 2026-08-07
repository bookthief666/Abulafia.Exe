// @vitest-environment happy-dom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { RiteCompletion } from './RiteCompletion'
import { generatePermutations } from '../engines/permutationEngine'

afterEach(() => {
  document.body.innerHTML = ''
})

function renderRite(overrides: Partial<Parameters<typeof RiteCompletion>[0]> = {}) {
  const onBeginAgain = vi.fn()
  const props = {
    inputWord: 'YHVH',
    totalPermutations: 24,
    lettersPerPermutation: 4,
    onBeginAgain,
    ...overrides,
  }
  render(<RiteCompletion {...props} />)
  return { onBeginAgain, props }
}

describe('RiteCompletion', () => {
  it('announces the ending politely to assistive technology', () => {
    renderRite()
    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(status.textContent).toContain('The Rite is Complete')
  })

  it('reassembles the name from its letters', () => {
    renderRite()
    // Each letter is its own element so it can settle back into place
    // independently, so assert on the composed label rather than the nodes.
    expect(screen.getByLabelText('The name YHVH, reassembled')).toBeTruthy()
  })

  it('keeps repeated letters distinct when reassembling', () => {
    // YHVH has two Hs. Both must be rendered; a keyed collapse would drop one.
    renderRite()
    const assembled = screen.getByLabelText('The name YHVH, reassembled')
    expect(assembled.textContent).toBe('YHVH')
    expect(assembled.children).toHaveLength(4)
  })

  it('counts the work that was done', () => {
    renderRite()
    // 24 permutations x 4 letters x 5 gates = 480 breaths.
    expect(screen.getByText('24')).toBeTruthy()
    expect(screen.getByText('480')).toBeTruthy()
    // 480 breaths x 8s = 3840s.
    expect(screen.getByText('1h 4m')).toBeTruthy()
  })

  it('reports a short rite in minutes rather than hours', () => {
    renderRite({ inputWord: 'ABC', totalPermutations: 6, lettersPerPermutation: 3 })
    // 6 x 3 x 5 = 90 breaths x 8s = 720s = 12 min.
    expect(screen.getByText('90')).toBeTruthy()
    expect(screen.getByText('12 min')).toBeTruthy()
  })

  it('shows the last arrangement worked when one is given', () => {
    const final = generatePermutations('YHVH')[23]
    renderRite({ finalPermutation: final })
    const expected = final.map((t) => t.char).join('')
    expect(screen.getByText(expected)).toBeTruthy()
  })

  it('omits the last arrangement when there is none to show', () => {
    renderRite()
    expect(screen.queryByText(/last arrangement/i)).toBeNull()
  })

  it('offers to begin the rite again', () => {
    const { onBeginAgain } = renderRite()
    fireEvent.click(screen.getByRole('button', { name: /begin again/i }))
    expect(onBeginAgain).toHaveBeenCalledTimes(1)
  })

  it('offers the way out only when there is somewhere to go', () => {
    const onExit = vi.fn()
    const { unmount } = render(
      <RiteCompletion
        inputWord="YHVH"
        totalPermutations={24}
        lettersPerPermutation={4}
        onBeginAgain={vi.fn()}
        onExit={onExit}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /leave the chamber/i }))
    expect(onExit).toHaveBeenCalled()
    unmount()

    renderRite()
    expect(screen.queryByRole('button', { name: /leave the chamber/i })).toBeNull()
  })
})
