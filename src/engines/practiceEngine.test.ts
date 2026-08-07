import { describe, it, expect } from 'vitest'
import {
  createPracticeSession,
  getPracticePosition,
} from './practiceEngine'

describe('createPracticeSession', () => {
  it('creates a session for YHVH with 24 permutations and 96 total cycles', () => {
    const session = createPracticeSession('YHVH')
    expect(session.input).toBe('YHVH')
    expect(session.totalPermutations).toBe(24)
    expect(session.lettersPerPermutation).toBe(4)
    expect(session.totalCycles).toBe(96)
    expect(session.permutations).toHaveLength(24)
  })

  it('creates a session for AB with 2 permutations and 4 total cycles', () => {
    const session = createPracticeSession('AB')
    expect(session.totalPermutations).toBe(2)
    expect(session.lettersPerPermutation).toBe(2)
    expect(session.totalCycles).toBe(4)
  })

  it('creates a session for a single character with 1 permutation and 1 cycle', () => {
    const session = createPracticeSession('A')
    expect(session.totalPermutations).toBe(1)
    expect(session.lettersPerPermutation).toBe(1)
    expect(session.totalCycles).toBe(1)
  })

  it('creates a session for empty input with 1 permutation and 0 cycles', () => {
    const session = createPracticeSession('')
    expect(session.totalPermutations).toBe(1)
    expect(session.lettersPerPermutation).toBe(0)
    expect(session.totalCycles).toBe(0)
  })
})

describe('getPracticePosition', () => {
  const session = createPracticeSession('YHVH')

  it('starts at permutation 0, letter 0 when cycleCount is 0', () => {
    const pos = getPracticePosition(session, 0)
    expect(pos.permutationIndex).toBe(0)
    expect(pos.letterIndex).toBe(0)
    expect(pos.cycleInSession).toBe(0)
    expect(pos.isComplete).toBe(false)
    expect(pos.currentLetter).not.toBeNull()
    expect(pos.currentLetter!.sourceIndex).toBe(
      session.permutations[0][0].sourceIndex,
    )
  })

  it('advances through letters within a permutation', () => {
    const pos1 = getPracticePosition(session, 1)
    expect(pos1.permutationIndex).toBe(0)
    expect(pos1.letterIndex).toBe(1)

    const pos2 = getPracticePosition(session, 2)
    expect(pos2.permutationIndex).toBe(0)
    expect(pos2.letterIndex).toBe(2)

    const pos3 = getPracticePosition(session, 3)
    expect(pos3.permutationIndex).toBe(0)
    expect(pos3.letterIndex).toBe(3)
  })

  it('advances to the next permutation after all letters', () => {
    const pos = getPracticePosition(session, 4)
    expect(pos.permutationIndex).toBe(1)
    expect(pos.letterIndex).toBe(0)
  })

  it('reaches the last valid position at cycleCount 95', () => {
    const pos = getPracticePosition(session, 95)
    expect(pos.permutationIndex).toBe(23)
    expect(pos.letterIndex).toBe(3)
    expect(pos.isComplete).toBe(false)
    expect(pos.currentLetter).not.toBeNull()
  })

  it('signals completion at cycleCount 96', () => {
    const pos = getPracticePosition(session, 96)
    expect(pos.isComplete).toBe(true)
    expect(pos.currentLetter).toBeNull()
    expect(pos.cycleInSession).toBe(96)
  })

  it('remains complete for cycleCount beyond totalCycles', () => {
    const pos = getPracticePosition(session, 200)
    expect(pos.isComplete).toBe(true)
  })

  it('clamps negative cycleCount to 0', () => {
    const pos = getPracticePosition(session, -5)
    expect(pos.permutationIndex).toBe(0)
    expect(pos.letterIndex).toBe(0)
    expect(pos.isComplete).toBe(false)
  })

  it('returns the correct permutation tokens at each position', () => {
    for (let pIdx = 0; pIdx < session.totalPermutations; pIdx++) {
      for (let lIdx = 0; lIdx < session.lettersPerPermutation; lIdx++) {
        const cycle = pIdx * session.lettersPerPermutation + lIdx
        const pos = getPracticePosition(session, cycle)
        expect(pos.currentPermutation).toBe(session.permutations[pIdx])
        expect(pos.currentLetter).toBe(session.permutations[pIdx][lIdx])
      }
    }
  })

  it('handles empty input — immediately complete', () => {
    const emptySession = createPracticeSession('')
    const pos = getPracticePosition(emptySession, 0)
    expect(pos.isComplete).toBe(true)
    expect(pos.currentLetter).toBeNull()
  })

  it('handles single-character input — completes after 1 cycle', () => {
    const singleSession = createPracticeSession('A')
    const pos0 = getPracticePosition(singleSession, 0)
    expect(pos0.isComplete).toBe(false)
    expect(pos0.currentLetter!.char).toBe('A')

    const pos1 = getPracticePosition(singleSession, 1)
    expect(pos1.isComplete).toBe(true)
  })
})
