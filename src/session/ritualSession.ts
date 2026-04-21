import type { BreathPhase } from '../engines/metronomeEngine'
import {
  generatePermutations,
  renderPermutation,
} from '../engines/permutationEngine'

export const ROOT_LENGTH = 3

export type RitualSession = {
  root: string
  permutations: string[]
  repetitionCount: number
  invoked: boolean
  permutationIndex: number
  loopsCompleted: number
}

export type ValidateRootReason = 'empty' | 'length' | 'whitespace' | 'alphabet'

export type ValidateRootResult =
  | { ok: true; value: string }
  | { ok: false; reason: ValidateRootReason }

const LETTERS_ONLY = /^[A-Za-z]+$/

export function createInitialSession(): RitualSession {
  return {
    root: '',
    permutations: [],
    repetitionCount: 1,
    invoked: false,
    permutationIndex: 0,
    loopsCompleted: 0,
  }
}

export function validateRoot(raw: string): ValidateRootResult {
  if (raw.length === 0) {
    return { ok: false, reason: 'empty' }
  }
  if (/\s/.test(raw)) {
    return { ok: false, reason: 'whitespace' }
  }
  if (raw.length !== ROOT_LENGTH) {
    return { ok: false, reason: 'length' }
  }
  if (!LETTERS_ONLY.test(raw)) {
    return { ok: false, reason: 'alphabet' }
  }
  return { ok: true, value: raw.toUpperCase() }
}

export function buildPermutationStrings(normalizedRoot: string): string[] {
  return generatePermutations(normalizedRoot).map(renderPermutation)
}

export function isBreathCycleEdge(
  prev: BreathPhase,
  next: BreathPhase,
): boolean {
  return prev === 'exhale' && next === 'inhale'
}

export function isSessionComplete(session: RitualSession): boolean {
  if (!session.invoked) return false
  if (session.permutations.length === 0) return false
  return session.loopsCompleted >= session.repetitionCount
}

export function advancePermutation(session: RitualSession): RitualSession {
  if (!session.invoked) return session
  if (session.permutations.length === 0) return session
  if (session.loopsCompleted >= session.repetitionCount) return session

  const nextIndex = session.permutationIndex + 1
  if (nextIndex >= session.permutations.length) {
    const nextLoopsCompleted = session.loopsCompleted + 1
    // Terminal completion: freeze on the final permutation so the chamber
    // does not snap back to the first glyph at the moment the rite ends.
    if (nextLoopsCompleted >= session.repetitionCount) {
      return {
        ...session,
        permutationIndex: session.permutations.length - 1,
        loopsCompleted: nextLoopsCompleted,
      }
    }
    return {
      ...session,
      permutationIndex: 0,
      loopsCompleted: nextLoopsCompleted,
    }
  }
  return { ...session, permutationIndex: nextIndex }
}

export function commitInvocation(
  normalizedRoot: string,
  repetitionCount: number,
): RitualSession {
  return {
    root: normalizedRoot,
    permutations: buildPermutationStrings(normalizedRoot),
    repetitionCount,
    invoked: true,
    permutationIndex: 0,
    loopsCompleted: 0,
  }
}

export type CompletionSnapshot = {
  root: string
  permutations: string[]
  repetitionCount: number
  totalPermutations: number
  finalPermutation: string
}

// Returns the same reference when !invoked so React bails out of re-render
// via Object.is — the session machine has no counters to reset anyway.
export function restartSession(session: RitualSession): RitualSession {
  if (!session.invoked) return session
  return {
    ...session,
    permutationIndex: 0,
    loopsCompleted: 0,
  }
}

export function createCompletionSnapshot(
  session: RitualSession,
): CompletionSnapshot | null {
  if (!isSessionComplete(session)) return null
  return {
    root: session.root,
    permutations: session.permutations,
    repetitionCount: session.repetitionCount,
    totalPermutations: session.permutations.length,
    finalPermutation: session.permutations[session.permutationIndex],
  }
}
