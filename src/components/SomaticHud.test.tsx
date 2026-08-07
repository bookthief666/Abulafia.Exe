// @vitest-environment happy-dom
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { SomaticHud } from './SomaticHud'

/**
 * A hand-cranked frame scheduler.
 *
 * The chamber's breath is driven by requestAnimationFrame through `useMivta`.
 * Rather than wait eight real seconds for a phase to turn, these tests hold the
 * frame callbacks and release them at chosen timestamps, so any point in the
 * cycle can be reached exactly.
 */
function makeClock() {
  const pending: Array<{ id: number; cb: FrameRequestCallback }> = []
  let nextId = 1

  const scheduleFrame = (cb: FrameRequestCallback) => {
    const id = nextId++
    pending.push({ id, cb })
    return id
  }
  const cancelFrame = (id: number) => {
    const i = pending.findIndex((f) => f.id === id)
    if (i >= 0) pending.splice(i, 1)
  }

  /** Release every queued frame at `ts`, inside React's act(). */
  const advanceTo = (ts: number) => {
    act(() => {
      const due = pending.splice(0, pending.length)
      for (const f of due) f.cb(ts)
    })
  }

  return { clock: { scheduleFrame, cancelFrame, now: () => 0 }, advanceTo }
}

/** Start the rite and settle the clock's baseline frame at t=0. */
function begin(advanceTo: (ts: number) => void) {
  fireEvent.click(screen.getByRole('button', { name: /^begin$/i }))
  advanceTo(0)
}

/** The position readout: which permutation, which letter, which arrangement. */
function position(): HTMLElement {
  return screen.getByRole('group', { name: 'Position' })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('SomaticHud', () => {
  it('opens on an inhale at the first gate of the first permutation', () => {
    const { clock } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Inhale')
    expect(position().textContent).toContain('1/24')
    expect(position().textContent).toContain('1/4')
  })

  it('tells the practitioner what to gather, then what to intone', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)

    // First gate is holam/up, first letter of YHVH is Y, so the syllable is YO.
    expect(screen.getByText(/Gather/).textContent).toContain('YO')

    begin(advanceTo)
    advanceTo(4000) // cross into the exhale

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Exhale')
    const instruction = screen.getByText(/Intone/)
    expect(instruction.textContent).toContain('YO')
    expect(instruction.textContent).toContain('Rising')
  })

  it('walks the five gates in the canonical vowel and direction order', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)

    const expected = [
      { syllable: 'YO', cue: 'Rising' }, // holam / up
      { syllable: 'YA', cue: 'Rightward' }, // qamatz / right
      { syllable: 'YI', cue: 'Descending' }, // hiriq / down
      { syllable: 'YE', cue: 'Leftward' }, // tzere / left
      { syllable: 'YU', cue: 'Inward' }, // qubuts / forward
    ]

    expected.forEach((gate, i) => {
      // Land mid-exhale of gate i: each gate is 4000ms in + 4000ms out.
      advanceTo(i * 8000 + 6000)
      const instruction = screen.getByText(/Intone/)
      expect(instruction.textContent).toContain(gate.syllable)
      expect(instruction.textContent).toContain(gate.cue)
    })
  })

  it('moves to the next letter once all five gates are worked', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)

    expect(position().textContent).toContain('1/4')

    // Five gates x 8000ms completes one letter.
    advanceTo(5 * 8000)
    expect(position().textContent).toContain('2/4')
    // Second letter of YHVH is H, sounded first through holam.
    expect(screen.getByText(/Gather/).textContent).toContain('HO')
  })

  it('moves to the next permutation once all letters are worked', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)

    expect(position().textContent).toContain('1/24')
    // Four letters x five gates x 8000ms completes one permutation.
    advanceTo(4 * 5 * 8000)
    expect(position().textContent).toContain('2/24')
  })

  it('reports the rite complete once every permutation is worked', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)

    // 24 permutations x 4 letters x 5 gates x 8000ms.
    advanceTo(24 * 4 * 5 * 8000)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Complete')
    expect(screen.queryByText(/Intone/)).toBeNull()
  })

  it('closes the rite with the completion overlay', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)
    advanceTo(24 * 4 * 5 * 8000)

    expect(screen.getByRole('status').textContent).toContain('The Rite is Complete')
    expect(screen.getByLabelText('The name YHVH, reassembled')).toBeTruthy()
  })

  it('stops the metronome once the rite is complete', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)
    advanceTo(24 * 4 * 5 * 8000)

    // The rite ends itself; the clock must not keep running behind the overlay.
    expect(screen.getByRole('button', { name: /^begin$/i })).toBeTruthy()
  })

  it('returns to the first arrangement when asked to begin again', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)
    advanceTo(24 * 4 * 5 * 8000)

    fireEvent.click(screen.getByRole('button', { name: /begin again/i }))

    expect(screen.queryByRole('status')).toBeNull()
    expect(position().textContent).toContain('1/24')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Inhale')
    expect(screen.getByRole('button', { name: /^pause$/i })).toBeTruthy()
  })

  it('exposes breath progress to assistive technology', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)

    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('0')

    advanceTo(2000) // halfway through the four-second inhale
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50')
  })

  it('names the letter, vowel, direction and phase on the core', () => {
    const { clock } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)

    const label = screen.getByRole('img').getAttribute('aria-label') ?? ''
    expect(label).toContain('letter Y')
    expect(label).toContain('vowel holam')
    expect(label).toContain('direction up')
    expect(label).toContain('phase inhale')
  })

  it('toggles between beginning and pausing the rite', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)

    expect(screen.getByRole('button', { name: /^begin$/i })).toBeTruthy()
    begin(advanceTo)
    expect(screen.getByRole('button', { name: /^pause$/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /^pause$/i }))
    expect(screen.getByRole('button', { name: /^begin$/i })).toBeTruthy()
  })

  it('holds the breath where it was when paused', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)
    advanceTo(2000)

    fireEvent.click(screen.getByRole('button', { name: /^pause$/i }))
    const held = screen.getByRole('progressbar').getAttribute('aria-valuenow')

    advanceTo(9999)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(held)
  })

  it('keeps the dev layer collapsed until it is asked for', () => {
    const { clock } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)

    expect(screen.queryByRole('button', { name: /reset/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /\+ dev/i }))
    expect(screen.getByRole('button', { name: /reset/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /− dev/i }))
    expect(screen.queryByRole('button', { name: /reset/i })).toBeNull()
  })

  it('returns the rite to its start when reset', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)
    begin(advanceTo)
    advanceTo(5 * 8000)
    expect(position().textContent).toContain('2/4')

    fireEvent.click(screen.getByRole('button', { name: /\+ dev/i }))
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    expect(position().textContent).toContain('1/4')
    expect(position().textContent).toContain('1/24')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Inhale')
  })

  it('starts silent and reports the sound state', () => {
    const { clock } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)

    const toggle = screen.getByRole('button', { name: /sound/i })
    expect(toggle.textContent).toMatch(/sound off/i)
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('degrades gracefully where Web Audio is unavailable', () => {
    // happy-dom provides no AudioContext, so the adapter should decline to
    // build a graph rather than throw when the toggle is pressed.
    const { clock } = makeClock()
    render(<SomaticHud inputWord="YHVH" clock={clock} />)

    const toggle = screen.getByRole('button', { name: /sound/i })
    expect(() => fireEvent.click(toggle)).not.toThrow()
    expect(screen.getByRole('button', { name: /sound/i }).textContent).toMatch(
      /sound off/i,
    )
  })

  it('offers an exit only when there is somewhere to go', () => {
    const onExit = vi.fn()
    const { clock } = makeClock()
    const { unmount } = render(
      <SomaticHud inputWord="YHVH" clock={clock} onExit={onExit} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /exit/i }))
    expect(onExit).toHaveBeenCalled()
    unmount()

    render(<SomaticHud inputWord="YHVH" clock={makeClock().clock} />)
    expect(screen.queryByRole('button', { name: /exit/i })).toBeNull()
  })

  it('works a shorter name through its own permutations', () => {
    const { clock, advanceTo } = makeClock()
    render(<SomaticHud inputWord="ABC" clock={clock} />)

    // 3! = 6 permutations of three letters.
    expect(position().textContent).toContain('1/6')
    expect(position().textContent).toContain('1/3')
    expect(screen.getByText(/Gather/).textContent).toContain('AO')

    begin(advanceTo)
    advanceTo(6 * 3 * 5 * 8000)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Complete')
  })
})
