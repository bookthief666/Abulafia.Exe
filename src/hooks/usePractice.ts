import { useMemo, useState } from 'react'
import { useMivta, type UseMivtaOptions } from './useMivta'
import {
  createPracticeSession,
  getPracticePosition,
  type PracticeSession,
  type PracticePosition,
} from '../engines/practiceEngine'
import type { PermutationToken } from '../engines/permutationEngine'
import type {
  BreathPhase,
  MetronomeConfig,
  VowelStep,
} from '../engines/metronomeEngine'
import type { MetronomeRuntimeState } from '../adapters/metronomeRuntime'

export type UsePracticeOptions = Omit<UseMivtaOptions, 'config'> & {
  config?: MetronomeConfig
  initialInput?: string
}

export type UsePracticeResult = {
  // Practice state
  inputWord: string
  session: PracticeSession
  position: PracticePosition
  permutationIndex: number
  totalPermutations: number
  currentPermutation: PermutationToken[]
  currentLetter: PermutationToken | null
  letterIndex: number
  lettersInPermutation: number
  isComplete: boolean

  // Metronome state (pass-through)
  runtime: MetronomeRuntimeState
  phase: BreathPhase
  progress: number
  activeStep: VowelStep
  running: boolean

  // Controls
  start: () => void
  pause: () => void
  reset: () => void
  tick: (nowMs: number) => void
  setInput: (word: string) => void
}

export function usePractice(
  options: UsePracticeOptions = {},
): UsePracticeResult {
  const { initialInput = 'YHVH', ...mivtaOptions } = options
  const [inputWord, setInputWord] = useState(initialInput)

  const session = useMemo(
    () => createPracticeSession(inputWord),
    [inputWord],
  )

  const mivta = useMivta(mivtaOptions)
  const { runtime, activeStep, progress, running, start, pause, tick } = mivta

  const position = useMemo(
    () => getPracticePosition(session, runtime.metronome.cycleCount),
    [session, runtime.metronome.cycleCount],
  )

  const setInput = (word: string) => {
    mivta.reset()
    setInputWord(word)
  }

  const reset = () => {
    mivta.reset()
  }

  return {
    inputWord,
    session,
    position,
    permutationIndex: position.permutationIndex,
    totalPermutations: session.totalPermutations,
    currentPermutation: position.currentPermutation,
    currentLetter: position.currentLetter,
    letterIndex: position.letterIndex,
    lettersInPermutation: session.lettersPerPermutation,
    isComplete: position.isComplete,

    runtime,
    phase: runtime.metronome.phase,
    progress,
    activeStep,
    running,

    start,
    pause,
    reset,
    tick,
    setInput,
  }
}
