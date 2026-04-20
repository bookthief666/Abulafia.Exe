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

export type ValidateRootResult =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'length' | 'whitespace' }

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
    return {
      ...session,
      permutationIndex: 0,
      loopsCompleted: session.loopsCompleted + 1,
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
