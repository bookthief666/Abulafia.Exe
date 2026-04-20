import { describe, expect, it } from 'vitest'
import {
  advancePermutation,
  buildPermutationStrings,
  commitInvocation,
  createInitialSession,
  isBreathCycleEdge,
  isSessionComplete,
  validateRoot,
} from './ritualSession'

describe('validateRoot', () => {
  it('accepts a 3-character uppercase root', () => {
    expect(validateRoot('YHV')).toEqual({ ok: true, value: 'YHV' })
  })

  it('uppercases lowercase input', () => {
    expect(validateRoot('yhv')).toEqual({ ok: true, value: 'YHV' })
  })

  it('rejects empty input', () => {
    expect(validateRoot('')).toEqual({ ok: false, reason: 'empty' })
  })

  it('rejects whitespace before length', () => {
    expect(validateRoot('Y H')).toEqual({ ok: false, reason: 'whitespace' })
    expect(validateRoot('Y\tV')).toEqual({ ok: false, reason: 'whitespace' })
    expect(validateRoot('   ')).toEqual({ ok: false, reason: 'whitespace' })
  })

  it('rejects input shorter than 3 without padding', () => {
    expect(validateRoot('YH')).toEqual({ ok: false, reason: 'length' })
  })

  it('rejects input longer than 3 without truncating', () => {
    expect(validateRoot('YHVH')).toEqual({ ok: false, reason: 'length' })
  })

  it('rejects digits at the correct length', () => {
    expect(validateRoot('Y1V')).toEqual({ ok: false, reason: 'alphabet' })
    expect(validateRoot('123')).toEqual({ ok: false, reason: 'alphabet' })
  })

  it('rejects punctuation and symbols', () => {
    expect(validateRoot('Y-V')).toEqual({ ok: false, reason: 'alphabet' })
    expect(validateRoot('Y.V')).toEqual({ ok: false, reason: 'alphabet' })
    expect(validateRoot('!!!')).toEqual({ ok: false, reason: 'alphabet' })
  })

  it('rejects non-Latin letters', () => {
    expect(validateRoot('יהו')).toEqual({ ok: false, reason: 'alphabet' })
  })
})

describe('buildPermutationStrings', () => {
  it('produces 6 strings for a 3-character root', () => {
    const perms = buildPermutationStrings('YHV')
    expect(perms).toHaveLength(6)
    for (const p of perms) {
      expect(p).toHaveLength(3)
      expect(p.split('').sort().join('')).toBe('HVY')
    }
    expect(new Set(perms).size).toBe(6)
  })

  it('preserves positional distinctness (YHVH yields 24 arrays)', () => {
    const perms = buildPermutationStrings('YHVH')
    expect(perms).toHaveLength(24)
  })
})

describe('isBreathCycleEdge', () => {
  it('is true only on exhale -> inhale', () => {
    expect(isBreathCycleEdge('exhale', 'inhale')).toBe(true)
    expect(isBreathCycleEdge('inhale', 'exhale')).toBe(false)
    expect(isBreathCycleEdge('inhale', 'inhale')).toBe(false)
    expect(isBreathCycleEdge('exhale', 'exhale')).toBe(false)
  })
})

describe('commitInvocation + advancePermutation', () => {
  it('commitInvocation installs permutations and resets counters', () => {
    const s = commitInvocation('YHV', 2)
    expect(s.invoked).toBe(true)
    expect(s.root).toBe('YHV')
    expect(s.permutations).toHaveLength(6)
    expect(s.permutationIndex).toBe(0)
    expect(s.loopsCompleted).toBe(0)
    expect(s.repetitionCount).toBe(2)
  })

  it('advancePermutation walks through the set then bumps loopsCompleted', () => {
    let s = commitInvocation('YHV', 2)
    for (let i = 1; i < 6; i++) {
      s = advancePermutation(s)
      expect(s.permutationIndex).toBe(i)
      expect(s.loopsCompleted).toBe(0)
    }
    s = advancePermutation(s)
    expect(s.permutationIndex).toBe(0)
    expect(s.loopsCompleted).toBe(1)
  })

  it('freezes on the final permutation index when the last loop completes', () => {
    let s = commitInvocation('YHV', 1)
    for (let i = 0; i < 6; i++) s = advancePermutation(s)
    expect(s.loopsCompleted).toBe(1)
    // Final permutation of the set, not a wrap back to index 0.
    expect(s.permutationIndex).toBe(s.permutations.length - 1)
    expect(isSessionComplete(s)).toBe(true)
    const frozen = advancePermutation(s)
    expect(frozen).toEqual(s)
  })

  it('wraps to index 0 on non-terminal loop completions', () => {
    let s = commitInvocation('YHV', 3)
    // 6 advances completes loop 1 of 3 — should wrap to index 0.
    for (let i = 0; i < 6; i++) s = advancePermutation(s)
    expect(s.loopsCompleted).toBe(1)
    expect(s.permutationIndex).toBe(0)
    // 6 more advances completes loop 2 of 3 — still not terminal.
    for (let i = 0; i < 6; i++) s = advancePermutation(s)
    expect(s.loopsCompleted).toBe(2)
    expect(s.permutationIndex).toBe(0)
    // Final loop freezes on the last index.
    for (let i = 0; i < 6; i++) s = advancePermutation(s)
    expect(s.loopsCompleted).toBe(3)
    expect(s.permutationIndex).toBe(s.permutations.length - 1)
    expect(isSessionComplete(s)).toBe(true)
  })

  it('is a no-op before invocation', () => {
    const s = createInitialSession()
    expect(advancePermutation(s)).toEqual(s)
  })
})
