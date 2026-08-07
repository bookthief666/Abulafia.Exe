import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createAudioRuntime,
  type AudioRuntime,
  type CreateAudioRuntimeOptions,
} from '../adapters/audioRuntime'
import type { BreathPhase, Vowel } from '../engines/metronomeEngine'

export type UseAudioOptions = CreateAudioRuntimeOptions

export type UseAudioResult = {
  /** Whether sound is currently engaged. Always starts false. */
  enabled: boolean
  /** True when the platform gave us no audio graph at all. */
  unavailable: boolean
  toggle: () => void
  /** Feed breath state to the graph. A no-op while disabled. */
  setBreath: (phase: BreathPhase, progress: number, vowel: Vowel) => void
  /** Strike the transition bell. A no-op while disabled. */
  strikeBell: () => void
}

/**
 * Binds the audio adapter to component lifecycle.
 *
 * Sound is off until the practitioner asks for it: browsers refuse to start an
 * AudioContext without a user gesture, and the chamber's default is silence.
 * The graph is therefore constructed lazily inside `toggle` — which only ever
 * runs from a click — and torn down when disabled or unmounted.
 */
export function useAudio(options: UseAudioOptions = {}): UseAudioResult {
  const [enabled, setEnabled] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const runtimeRef = useRef<AudioRuntime | null>(null)

  // Keep the latest factory without making `toggle` depend on a fresh object
  // identity every render. Synced in an effect, never written during render.
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  const toggle = useCallback(() => {
    setEnabled((wasEnabled) => {
      if (wasEnabled) {
        runtimeRef.current?.dispose()
        runtimeRef.current = null
        return false
      }

      const runtime = createAudioRuntime(optionsRef.current)
      if (!runtime) {
        setUnavailable(true)
        return false
      }
      runtimeRef.current = runtime
      return true
    })
  }, [])

  useEffect(() => {
    return () => {
      runtimeRef.current?.dispose()
      runtimeRef.current = null
    }
  }, [])

  const setBreath = useCallback(
    (phase: BreathPhase, progress: number, vowel: Vowel) => {
      runtimeRef.current?.setBreath(phase, progress, vowel)
    },
    [],
  )

  const strikeBell = useCallback(() => {
    runtimeRef.current?.strikeBell()
  }, [])

  return { enabled, unavailable, toggle, setBreath, strikeBell }
}
