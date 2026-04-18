import { describe, it, expect } from 'vitest'
import {
  createDefaultSequence,
  createDefaultConfig,
  createInitialMetronomeState,
  advanceMetronome,
  getActiveStep,
  getPhaseProgress,
  type MetronomeConfig,
  type MetronomeState,
} from './metronomeEngine'

describe('Metronome Engine — Mivta', () => {
  // a. default sequence order and length
  it('createDefaultSequence returns the 5-step Ohr ha-Sekhel mapping in order', () => {
    const seq = createDefaultSequence()
    expect(seq).toEqual([
      { vowel: 'holam', direction: 'up' },
      { vowel: 'qamatz', direction: 'right' },
      { vowel: 'hiriq', direction: 'down' },
      { vowel: 'tzere', direction: 'left' },
      { vowel: 'qubuts', direction: 'forward' },
    ])
    expect(seq.length).toBe(5)
  })

  it('createDefaultConfig has 4000ms inhale/exhale and the default sequence', () => {
    const cfg = createDefaultConfig()
    expect(cfg.inhaleMs).toBe(4000)
    expect(cfg.exhaleMs).toBe(4000)
    expect(cfg.sequence).toEqual(createDefaultSequence())
  })

  it('createDefaultConfig returns an independent sequence array (no shared mutation)', () => {
    const a = createDefaultConfig()
    const b = createDefaultConfig()
    expect(a.sequence).not.toBe(b.sequence)
  })

  // b. initial state
  it('createInitialMetronomeState starts at inhale / 0ms / index 0 / cycle 0', () => {
    expect(createInitialMetronomeState()).toEqual({
      phase: 'inhale',
      phaseElapsedMs: 0,
      activeIndex: 0,
      cycleCount: 0,
    })
  })

  // c. partial inhale advance
  it('a partial inhale advance keeps phase=inhale and accumulates elapsed time', () => {
    const cfg = createDefaultConfig()
    const s1 = advanceMetronome(createInitialMetronomeState(), 1500, cfg)
    expect(s1.phase).toBe('inhale')
    expect(s1.phaseElapsedMs).toBe(1500)
    expect(s1.activeIndex).toBe(0)
    expect(s1.cycleCount).toBe(0)
  })

  it('sequential partial inhale advances sum correctly', () => {
    const cfg = createDefaultConfig()
    const s1 = advanceMetronome(createInitialMetronomeState(), 1000, cfg)
    const s2 = advanceMetronome(s1, 1500, cfg)
    expect(s2.phase).toBe('inhale')
    expect(s2.phaseElapsedMs).toBe(2500)
  })

  // d. inhale -> exhale boundary
  it('advancing exactly inhaleMs transitions inhale -> exhale at elapsed 0', () => {
    const cfg = createDefaultConfig()
    const s1 = advanceMetronome(createInitialMetronomeState(), 4000, cfg)
    expect(s1.phase).toBe('exhale')
    expect(s1.phaseElapsedMs).toBe(0)
    expect(s1.activeIndex).toBe(0)
    expect(s1.cycleCount).toBe(0)
  })

  it('advancing just past inhaleMs lands mid-exhale with correct carryover', () => {
    const cfg = createDefaultConfig()
    const s1 = advanceMetronome(createInitialMetronomeState(), 4250, cfg)
    expect(s1.phase).toBe('exhale')
    expect(s1.phaseElapsedMs).toBe(250)
    expect(s1.activeIndex).toBe(0)
  })

  // e. exhale -> next inhale boundary
  it('advancing a full inhale+exhale moves to the next step and resets to inhale', () => {
    const cfg = createDefaultConfig()
    const s1 = advanceMetronome(createInitialMetronomeState(), 8000, cfg)
    expect(s1.phase).toBe('inhale')
    expect(s1.phaseElapsedMs).toBe(0)
    expect(s1.activeIndex).toBe(1)
    expect(s1.cycleCount).toBe(0)
  })

  it('does NOT increment cycleCount on a step advance that is not a wrap', () => {
    const cfg = createDefaultConfig()
    // Advance through 4 steps (indices 0 -> 4) = 4 * 8000 = 32000ms
    const s1 = advanceMetronome(createInitialMetronomeState(), 32000, cfg)
    expect(s1.activeIndex).toBe(4)
    expect(s1.cycleCount).toBe(0)
    expect(s1.phase).toBe('inhale')
    expect(s1.phaseElapsedMs).toBe(0)
  })

  // f. full sequence wrap and cycleCount increment
  it('completing all 5 steps wraps activeIndex to 0 and increments cycleCount', () => {
    const cfg = createDefaultConfig()
    const s1 = advanceMetronome(createInitialMetronomeState(), 5 * 8000, cfg)
    expect(s1.activeIndex).toBe(0)
    expect(s1.cycleCount).toBe(1)
    expect(s1.phase).toBe('inhale')
    expect(s1.phaseElapsedMs).toBe(0)
  })

  // g. large deltaMs crossing multiple boundaries
  it('a very large deltaMs crosses many phase and step boundaries correctly', () => {
    const cfg = createDefaultConfig()
    // 2 full sequence cycles (80000ms) + one inhale (4000ms) + 500ms into exhale = 84500ms
    const s1 = advanceMetronome(createInitialMetronomeState(), 84500, cfg)
    expect(s1.cycleCount).toBe(2)
    expect(s1.activeIndex).toBe(0)
    expect(s1.phase).toBe('exhale')
    expect(s1.phaseElapsedMs).toBe(500)
  })

  it('large delta with step offset still computes correctly', () => {
    const cfg = createDefaultConfig()
    // Start at index 2, mid-exhale (2000ms in).
    const seed: MetronomeState = {
      phase: 'exhale',
      phaseElapsedMs: 2000,
      activeIndex: 2,
      cycleCount: 0,
    }
    // 2000ms to finish exhale -> next inhale at index 3.
    // +8000ms = full step at index 3 -> inhale at index 4.
    // +8000ms = full step at index 4 -> wrap -> inhale at index 0, cycleCount 1.
    // +1234ms into inhale at index 0.
    // Total = 2000 + 8000 + 8000 + 1234 = 19234ms.
    const s1 = advanceMetronome(seed, 19234, cfg)
    expect(s1.activeIndex).toBe(0)
    expect(s1.cycleCount).toBe(1)
    expect(s1.phase).toBe('inhale')
    expect(s1.phaseElapsedMs).toBe(1234)
  })

  it('deltaMs of 0 returns an equivalent state', () => {
    const cfg = createDefaultConfig()
    const s0 = createInitialMetronomeState()
    expect(advanceMetronome(s0, 0, cfg)).toEqual(s0)
  })

  // h. getPhaseProgress normalized behavior
  it('getPhaseProgress returns 0 at the start of a phase', () => {
    const cfg = createDefaultConfig()
    expect(getPhaseProgress(createInitialMetronomeState(), cfg)).toBe(0)
  })

  it('getPhaseProgress returns 0.5 at the midpoint of the inhale phase', () => {
    const cfg = createDefaultConfig()
    const mid: MetronomeState = {
      phase: 'inhale',
      phaseElapsedMs: 2000,
      activeIndex: 0,
      cycleCount: 0,
    }
    expect(getPhaseProgress(mid, cfg)).toBe(0.5)
  })

  it('getPhaseProgress returns 1 when phaseElapsedMs exactly equals the phase duration', () => {
    const cfg = createDefaultConfig()
    const end: MetronomeState = {
      phase: 'exhale',
      phaseElapsedMs: 4000,
      activeIndex: 0,
      cycleCount: 0,
    }
    expect(getPhaseProgress(end, cfg)).toBe(1)
  })

  it('getPhaseProgress respects asymmetric inhale/exhale durations', () => {
    const cfg: MetronomeConfig = {
      inhaleMs: 2000,
      exhaleMs: 6000,
      sequence: createDefaultSequence(),
    }
    const s: MetronomeState = {
      phase: 'exhale',
      phaseElapsedMs: 3000,
      activeIndex: 0,
      cycleCount: 0,
    }
    expect(getPhaseProgress(s, cfg)).toBe(0.5)
  })

  it('getPhaseProgress always returns a value in the closed range [0, 1]', () => {
    const cfg = createDefaultConfig()
    const samples: MetronomeState[] = [
      { phase: 'inhale', phaseElapsedMs: 0, activeIndex: 0, cycleCount: 0 },
      { phase: 'inhale', phaseElapsedMs: 1, activeIndex: 0, cycleCount: 0 },
      { phase: 'inhale', phaseElapsedMs: 3999, activeIndex: 0, cycleCount: 0 },
      { phase: 'exhale', phaseElapsedMs: 0, activeIndex: 0, cycleCount: 0 },
      { phase: 'exhale', phaseElapsedMs: 4000, activeIndex: 0, cycleCount: 0 },
    ]
    for (const s of samples) {
      const p = getPhaseProgress(s, cfg)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  // i. invalid config errors
  it('advanceMetronome throws when inhaleMs <= 0', () => {
    const s0 = createInitialMetronomeState()
    expect(() =>
      advanceMetronome(s0, 100, {
        inhaleMs: 0,
        exhaleMs: 4000,
        sequence: createDefaultSequence(),
      }),
    ).toThrow()
    expect(() =>
      advanceMetronome(s0, 100, {
        inhaleMs: -1,
        exhaleMs: 4000,
        sequence: createDefaultSequence(),
      }),
    ).toThrow()
  })

  it('advanceMetronome throws when exhaleMs <= 0', () => {
    const s0 = createInitialMetronomeState()
    expect(() =>
      advanceMetronome(s0, 100, {
        inhaleMs: 4000,
        exhaleMs: 0,
        sequence: createDefaultSequence(),
      }),
    ).toThrow()
    expect(() =>
      advanceMetronome(s0, 100, {
        inhaleMs: 4000,
        exhaleMs: -500,
        sequence: createDefaultSequence(),
      }),
    ).toThrow()
  })

  it('advanceMetronome throws on an empty sequence', () => {
    const s0 = createInitialMetronomeState()
    expect(() =>
      advanceMetronome(s0, 100, { inhaleMs: 4000, exhaleMs: 4000, sequence: [] }),
    ).toThrow()
  })

  // j. getActiveStep correctness
  it('getActiveStep returns the VowelStep at state.activeIndex for every index', () => {
    const cfg = createDefaultConfig()
    for (let i = 0; i < cfg.sequence.length; i++) {
      const state: MetronomeState = {
        phase: 'inhale',
        phaseElapsedMs: 0,
        activeIndex: i,
        cycleCount: 0,
      }
      expect(getActiveStep(state, cfg)).toEqual(cfg.sequence[i])
    }
  })

  it('getActiveStep returns the currently-active step as the metronome advances', () => {
    const cfg = createDefaultConfig()
    let state = createInitialMetronomeState()
    const expectedVowels: Array<'holam' | 'qamatz' | 'hiriq' | 'tzere' | 'qubuts'> = [
      'holam',
      'qamatz',
      'hiriq',
      'tzere',
      'qubuts',
    ]
    for (let i = 0; i < expectedVowels.length; i++) {
      expect(getActiveStep(state, cfg).vowel).toBe(expectedVowels[i])
      state = advanceMetronome(state, 8000, cfg)
    }
    // After a full cycle the active step is again 'holam' and cycleCount is 1.
    expect(getActiveStep(state, cfg).vowel).toBe('holam')
    expect(state.cycleCount).toBe(1)
  })

  // ──────────────────────────────────────────────────────────────────
  // Phase 2.1 — hardening: runtime state and config validation
  // ──────────────────────────────────────────────────────────────────

  describe('runtime validation', () => {
    const cfg = createDefaultConfig()
    const validState = (): MetronomeState => createInitialMetronomeState()

    // 1. invalid phase string throws
    it('advanceMetronome throws when state.phase is not "inhale" or "exhale"', () => {
      const bad = { ...validState(), phase: 'hold' as unknown as 'inhale' }
      expect(() => advanceMetronome(bad, 100, cfg)).toThrow(/phase/)
    })

    // 2. negative phaseElapsedMs throws
    it('advanceMetronome throws when phaseElapsedMs is negative', () => {
      const bad: MetronomeState = { ...validState(), phaseElapsedMs: -1 }
      expect(() => advanceMetronome(bad, 100, cfg)).toThrow(/phaseElapsedMs/)
    })

    // 3. non-finite phaseElapsedMs throws
    it('advanceMetronome throws when phaseElapsedMs is non-finite', () => {
      const bad: MetronomeState = { ...validState(), phaseElapsedMs: Number.NaN }
      expect(() => advanceMetronome(bad, 100, cfg)).toThrow(/phaseElapsedMs/)
      const bad2: MetronomeState = { ...validState(), phaseElapsedMs: Number.POSITIVE_INFINITY }
      expect(() => advanceMetronome(bad2, 100, cfg)).toThrow(/phaseElapsedMs/)
    })

    // 4. phaseElapsedMs greater than current phase duration throws
    it('advanceMetronome throws when phaseElapsedMs exceeds the current phase duration', () => {
      const bad: MetronomeState = {
        phase: 'inhale',
        phaseElapsedMs: 4001,
        activeIndex: 0,
        cycleCount: 0,
      }
      expect(() => advanceMetronome(bad, 100, cfg)).toThrow(/exceeds/)
      // And the same rule is enforced in getPhaseProgress.
      const overshoot: MetronomeState = {
        phase: 'exhale',
        phaseElapsedMs: 9999,
        activeIndex: 0,
        cycleCount: 0,
      }
      expect(() => getPhaseProgress(overshoot, cfg)).toThrow(/exceeds/)
    })

    // 5. non-integer activeIndex throws
    it('advanceMetronome throws when activeIndex is not an integer', () => {
      const bad: MetronomeState = { ...validState(), activeIndex: 1.5 }
      expect(() => advanceMetronome(bad, 100, cfg)).toThrow(/activeIndex/)
    })

    // 6. out-of-range activeIndex throws
    it('advanceMetronome throws when activeIndex is out of range', () => {
      const tooLow: MetronomeState = { ...validState(), activeIndex: -1 }
      expect(() => advanceMetronome(tooLow, 100, cfg)).toThrow(/activeIndex/)
      const tooHigh: MetronomeState = { ...validState(), activeIndex: cfg.sequence.length }
      expect(() => advanceMetronome(tooHigh, 100, cfg)).toThrow(/activeIndex/)
      // And the same rule is enforced in getActiveStep.
      expect(() => getActiveStep(tooHigh, cfg)).toThrow(/activeIndex/)
    })

    // 7. negative cycleCount throws
    it('advanceMetronome throws when cycleCount is negative', () => {
      const bad: MetronomeState = { ...validState(), cycleCount: -1 }
      expect(() => advanceMetronome(bad, 100, cfg)).toThrow(/cycleCount/)
    })

    // 8. non-integer cycleCount throws
    it('advanceMetronome throws when cycleCount is not an integer', () => {
      const bad: MetronomeState = { ...validState(), cycleCount: 2.5 }
      expect(() => advanceMetronome(bad, 100, cfg)).toThrow(/cycleCount/)
    })

    // 9. invalid vowel in sequence throws
    it('advanceMetronome throws when a sequence step has an invalid vowel', () => {
      const badCfg: MetronomeConfig = {
        inhaleMs: 4000,
        exhaleMs: 4000,
        sequence: [
          { vowel: 'holam', direction: 'up' },
          { vowel: 'shurek' as unknown as 'holam', direction: 'forward' },
        ],
      }
      expect(() => advanceMetronome(validState(), 100, badCfg)).toThrow(/vowel/)
    })

    // 10. invalid direction in sequence throws
    it('advanceMetronome throws when a sequence step has an invalid direction', () => {
      const badCfg: MetronomeConfig = {
        inhaleMs: 4000,
        exhaleMs: 4000,
        sequence: [{ vowel: 'holam', direction: 'nowhere' as unknown as 'up' }],
      }
      expect(() => advanceMetronome(validState(), 100, badCfg)).toThrow(/direction/)
    })

    // Sanity: validation is also enforced in getActiveStep and getPhaseProgress.
    it('getActiveStep validates state and config', () => {
      const bad: MetronomeState = { ...validState(), phase: 'pause' as unknown as 'inhale' }
      expect(() => getActiveStep(bad, cfg)).toThrow(/phase/)
    })

    it('getPhaseProgress validates state and config', () => {
      const bad: MetronomeState = { ...validState(), phaseElapsedMs: Number.NaN }
      expect(() => getPhaseProgress(bad, cfg)).toThrow(/phaseElapsedMs/)
    })
  })
})

