// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { usePractice, type UsePracticeOptions } from './usePractice'
import { createDefaultConfig } from '../engines/metronomeEngine'

type ScheduleFrame = (cb: FrameRequestCallback) => number
type CancelFrame = (id: number) => void

function makeFrameHarness() {
  const pending: Array<{ id: number; cb: FrameRequestCallback }> = []
  let nextId = 1
  const scheduleFrame = vi.fn<ScheduleFrame>((cb) => {
    const id = nextId++
    pending.push({ id, cb })
    return id
  })
  const cancelFrame = vi.fn<CancelFrame>((id) => {
    const idx = pending.findIndex((p) => p.id === id)
    if (idx >= 0) pending.splice(idx, 1)
  })
  const drain = (ts: number) => {
    const queued = pending.splice(0, pending.length)
    for (const { cb } of queued) cb(ts)
  }
  return { scheduleFrame, cancelFrame, pending, drain }
}

function render(options: UsePracticeOptions = {}) {
  return renderHook(
    (props: UsePracticeOptions) => usePractice(props),
    { initialProps: options },
  )
}

describe('usePractice', () => {
  it('initializes with YHVH by default', () => {
    const { result } = render({ now: () => 0 })
    expect(result.current.inputWord).toBe('YHVH')
    expect(result.current.totalPermutations).toBe(24)
    expect(result.current.lettersInPermutation).toBe(4)
    expect(result.current.permutationIndex).toBe(0)
    expect(result.current.letterIndex).toBe(0)
    expect(result.current.isComplete).toBe(false)
    expect(result.current.currentLetter).not.toBeNull()
  })

  it('accepts a custom initial input', () => {
    const { result } = render({ initialInput: 'AB', now: () => 0 })
    expect(result.current.inputWord).toBe('AB')
    expect(result.current.totalPermutations).toBe(2)
    expect(result.current.lettersInPermutation).toBe(2)
  })

  it('exposes metronome state at initial position', () => {
    const { result } = render({ now: () => 0 })
    expect(result.current.phase).toBe('inhale')
    expect(result.current.progress).toBe(0)
    expect(result.current.running).toBe(false)
    expect(result.current.activeStep.vowel).toBe('holam')
    expect(result.current.activeStep.direction).toBe('up')
  })

  it('advances to next letter after a full 5-vowel cycle', () => {
    const harness = makeFrameHarness()
    const cfg = createDefaultConfig()
    const cycleDuration =
      (cfg.inhaleMs + cfg.exhaleMs) * cfg.sequence.length

    const { result } = render({
      now: () => 0,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })

    act(() => result.current.start())

    // Drain through one complete 5-vowel cycle (40,000ms at default 4s+4s × 5 steps).
    act(() => harness.drain(cycleDuration + 1))

    expect(result.current.permutationIndex).toBe(0)
    expect(result.current.letterIndex).toBe(1)
    expect(result.current.isComplete).toBe(false)
  })

  it('advances to next permutation after all letters in one permutation', () => {
    const harness = makeFrameHarness()
    const cfg = createDefaultConfig()
    const cycleDuration =
      (cfg.inhaleMs + cfg.exhaleMs) * cfg.sequence.length
    const lettersPerPerm = 4

    const { result } = render({
      now: () => 0,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })

    act(() => result.current.start())

    // Drain through 4 complete vowel cycles (one per letter of YHVH).
    for (let i = 1; i <= lettersPerPerm; i++) {
      act(() => harness.drain(cycleDuration * i + 1))
    }

    expect(result.current.permutationIndex).toBe(1)
    expect(result.current.letterIndex).toBe(0)
    expect(result.current.isComplete).toBe(false)
  })

  it('setInput resets the metronome and changes the word', () => {
    const { result } = render({ now: () => 0 })

    act(() => result.current.setInput('AB'))

    expect(result.current.inputWord).toBe('AB')
    expect(result.current.totalPermutations).toBe(2)
    expect(result.current.lettersInPermutation).toBe(2)
    expect(result.current.permutationIndex).toBe(0)
    expect(result.current.letterIndex).toBe(0)
    expect(result.current.running).toBe(false)
  })

  it('reset returns to initial position without changing input', () => {
    const harness = makeFrameHarness()
    const cfg = createDefaultConfig()
    const cycleDuration =
      (cfg.inhaleMs + cfg.exhaleMs) * cfg.sequence.length

    const { result } = render({
      now: () => 0,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })

    act(() => result.current.start())
    act(() => harness.drain(cycleDuration + 1))

    expect(result.current.letterIndex).toBe(1)

    act(() => result.current.reset())

    expect(result.current.inputWord).toBe('YHVH')
    expect(result.current.permutationIndex).toBe(0)
    expect(result.current.letterIndex).toBe(0)
    expect(result.current.running).toBe(false)
  })

  it('currentPermutation contains the correct tokens for the active permutation', () => {
    const { result } = render({ now: () => 0 })
    const perm = result.current.currentPermutation
    expect(perm).toHaveLength(4)
    expect(perm.map((t) => t.char).join('')).toHaveLength(4)
    expect(result.current.currentLetter).toBe(perm[0])
  })
})
