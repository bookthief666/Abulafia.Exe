import { describe, it, expect } from 'vitest'
import {
  createDefaultConfig,
  createInitialMetronomeState,
  advanceMetronome,
  type MetronomeState,
} from '../engines/metronomeEngine'
import {
  createInitialRuntimeState,
  startRuntime,
  pauseRuntime,
  resetRuntime,
  tickRuntime,
  type MetronomeRuntimeState,
} from './metronomeRuntime'

describe('Metronome Runtime Adapter', () => {
  it('createInitialRuntimeState returns not-running, null baseline, fresh metronome', () => {
    const s = createInitialRuntimeState()
    expect(s).toEqual({
      running: false,
      lastNowMs: null,
      metronome: createInitialMetronomeState(),
    })
  })

  it('startRuntime sets running=true and seeds lastNowMs without advancing metronome', () => {
    const s0 = createInitialRuntimeState()
    const s1 = startRuntime(s0, 1234)
    expect(s1.running).toBe(true)
    expect(s1.lastNowMs).toBe(1234)
    expect(s1.metronome).toEqual(createInitialMetronomeState())
  })

  it('pauseRuntime preserves metronome state and clears timestamp', () => {
    const cfg = createDefaultConfig()
    const seededMetronome = advanceMetronome(createInitialMetronomeState(), 2500, cfg)
    const running: MetronomeRuntimeState = {
      running: true,
      lastNowMs: 5000,
      metronome: seededMetronome,
    }
    const paused = pauseRuntime(running)
    expect(paused.running).toBe(false)
    expect(paused.lastNowMs).toBeNull()
    expect(paused.metronome).toEqual(seededMetronome)
  })

  it('resetRuntime returns the same result as createInitialRuntimeState', () => {
    expect(resetRuntime()).toEqual(createInitialRuntimeState())
  })

  it('tickRuntime does nothing when paused (even when time has elapsed)', () => {
    const cfg = createDefaultConfig()
    const paused: MetronomeRuntimeState = {
      running: false,
      lastNowMs: null,
      metronome: createInitialMetronomeState(),
    }
    const after = tickRuntime(paused, 999999, cfg)
    expect(after).toEqual(paused)
  })

  it('first tick with null baseline only seeds lastNowMs; metronome untouched', () => {
    const cfg = createDefaultConfig()
    const seedable: MetronomeRuntimeState = {
      running: true,
      lastNowMs: null,
      metronome: createInitialMetronomeState(),
    }
    const after = tickRuntime(seedable, 10_000, cfg)
    expect(after.running).toBe(true)
    expect(after.lastNowMs).toBe(10_000)
    expect(after.metronome).toEqual(createInitialMetronomeState())
  })

  it('subsequent tick delegates deltaMs to advanceMetronome', () => {
    const cfg = createDefaultConfig()
    const seeded: MetronomeRuntimeState = {
      running: true,
      lastNowMs: 1000,
      metronome: createInitialMetronomeState(),
    }
    const after = tickRuntime(seeded, 2500, cfg)
    expect(after.lastNowMs).toBe(2500)
    expect(after.metronome).toEqual(
      advanceMetronome(createInitialMetronomeState(), 1500, cfg),
    )
  })

  it('negative delta clamps to 0 and does not throw', () => {
    const cfg = createDefaultConfig()
    const seeded: MetronomeRuntimeState = {
      running: true,
      lastNowMs: 5000,
      metronome: createInitialMetronomeState(),
    }
    const after = tickRuntime(seeded, 4000, cfg)
    expect(after.lastNowMs).toBe(4000)
    expect(after.metronome).toEqual(createInitialMetronomeState())
  })

  it('large positive delta delegates correctly to advanceMetronome (84500ms = 2 cycles + mid-exhale)', () => {
    const cfg = createDefaultConfig()
    const seeded: MetronomeRuntimeState = {
      running: true,
      lastNowMs: 0,
      metronome: createInitialMetronomeState(),
    }
    const after = tickRuntime(seeded, 84_500, cfg)
    expect(after.lastNowMs).toBe(84_500)
    const expected: MetronomeState = {
      phase: 'exhale',
      phaseElapsedMs: 500,
      activeIndex: 0,
      cycleCount: 2,
    }
    expect(after.metronome).toEqual(expected)
  })

  it('invalid nowMs throws from startRuntime', () => {
    const s0 = createInitialRuntimeState()
    expect(() => startRuntime(s0, Number.NaN)).toThrow(/nowMs/)
    expect(() => startRuntime(s0, Number.POSITIVE_INFINITY)).toThrow(/nowMs/)
    expect(() => startRuntime(s0, Number.NEGATIVE_INFINITY)).toThrow(/nowMs/)
  })

  it('invalid nowMs throws from tickRuntime', () => {
    const cfg = createDefaultConfig()
    const seeded: MetronomeRuntimeState = {
      running: true,
      lastNowMs: 1000,
      metronome: createInitialMetronomeState(),
    }
    expect(() => tickRuntime(seeded, Number.NaN, cfg)).toThrow(/nowMs/)
    expect(() => tickRuntime(seeded, Number.POSITIVE_INFINITY, cfg)).toThrow(/nowMs/)
    expect(() => tickRuntime(seeded, Number.NEGATIVE_INFINITY, cfg)).toThrow(/nowMs/)
  })

  it('adapter does not mutate input state objects', () => {
    const cfg = createDefaultConfig()
    const original: MetronomeRuntimeState = {
      running: true,
      lastNowMs: 1000,
      metronome: createInitialMetronomeState(),
    }
    const snapshot = JSON.parse(JSON.stringify(original)) as MetronomeRuntimeState

    startRuntime(original, 9999)
    expect(original).toEqual(snapshot)
    expect(original.metronome).toEqual(snapshot.metronome)

    pauseRuntime(original)
    expect(original).toEqual(snapshot)
    expect(original.metronome).toEqual(snapshot.metronome)

    tickRuntime(original, 2500, cfg)
    expect(original).toEqual(snapshot)
    expect(original.metronome).toEqual(snapshot.metronome)

    const initial = createInitialRuntimeState()
    const initialSnapshot = JSON.parse(JSON.stringify(initial)) as MetronomeRuntimeState
    tickRuntime(initial, 2500, cfg)
    expect(initial).toEqual(initialSnapshot)
  })
})

