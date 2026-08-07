import type { PermutationToken } from './permutationEngine'
import { generatePermutations } from './permutationEngine'

export type PracticeSession = {
  input: string
  permutations: PermutationToken[][]
  totalPermutations: number
  lettersPerPermutation: number
  totalCycles: number
}

export type PracticePosition = {
  permutationIndex: number
  letterIndex: number
  currentPermutation: PermutationToken[]
  currentLetter: PermutationToken | null
  cycleInSession: number
  isComplete: boolean
}

export function createPracticeSession(input: string): PracticeSession {
  const permutations = generatePermutations(input)
  const lettersPerPermutation = input.length
  return {
    input,
    permutations,
    totalPermutations: permutations.length,
    lettersPerPermutation,
    totalCycles: permutations.length * lettersPerPermutation,
  }
}

export function getPracticePosition(
  session: PracticeSession,
  cycleCount: number,
): PracticePosition {
  const cycle = Math.max(0, Math.floor(cycleCount))

  if (session.totalCycles === 0 || cycle >= session.totalCycles) {
    return {
      permutationIndex: session.totalPermutations - 1,
      letterIndex: Math.max(0, session.lettersPerPermutation - 1),
      currentPermutation:
        session.permutations[session.totalPermutations - 1] ?? [],
      currentLetter: null,
      cycleInSession: session.totalCycles,
      isComplete: true,
    }
  }

  const permutationIndex = Math.floor(cycle / session.lettersPerPermutation)
  const letterIndex = cycle % session.lettersPerPermutation
  const currentPermutation = session.permutations[permutationIndex]
  const currentLetter = currentPermutation[letterIndex]

  return {
    permutationIndex,
    letterIndex,
    currentPermutation,
    currentLetter,
    cycleInSession: cycle,
    isComplete: false,
  }
}
