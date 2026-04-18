import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createDefaultConfig,
  getActiveStep,
  getPhaseProgress,
  type MetronomeConfig,
  type MetronomeState,
  type VowelStep,
} from '../engines/metronomeEngine'
import {
  createInitialRuntimeState,
  pauseRuntime,
  startRuntime,
  tickRuntime,
  type MetronomeRuntimeState,
} from '../adapters/metronomeRuntime'

export type UseMivtaOptions = {
  config?: MetronomeConfig
  autoStart?: boolean
  now?: () => number
  scheduleFrame?: (cb: FrameRequestCallback) => number
  cancelFrame?: (id: number) => void
}

export type UseMivtaResult = {
  runtime: MetronomeRuntimeState
  metronome: MetronomeState
  activeStep: VowelStep
  progress: number
  running: boolean
  start: () => void
  pause: () => void
  reset: () => void
  tick: (nowMs: number) => void
}

const defaultNow = (): number => performance.now()
const defaultScheduleFrame = (cb: FrameRequestCallback): number =>
  requestAnimationFrame(cb)
const defaultCancelFrame = (id: number): void => cancelAnimationFrame(id)

export function useMivta(options: UseMivtaOptions = {}): UseMivtaResult {
  const { config, autoStart = false, now, scheduleFrame, cancelFrame } = options

  const resolvedConfig = useMemo(
    () => config ?? createDefaultConfig(),
    [config],
  )

  const nowRef = useRef<() => number>(now ?? defaultNow)
  const scheduleFrameRef = useRef<(cb: FrameRequestCallback) => number>(
    scheduleFrame ?? defaultScheduleFrame,
  )
  const cancelFrameRef = useRef<(id: number) => void>(
    cancelFrame ?? defaultCancelFrame,
  )

  useEffect(() => {
    nowRef.current = now ?? defaultNow
  }, [now])
  useEffect(() => {
    scheduleFrameRef.current = scheduleFrame ?? defaultScheduleFrame
  }, [scheduleFrame])
  useEffect(() => {
    cancelFrameRef.current = cancelFrame ?? defaultCancelFrame
  }, [cancelFrame])

  const [runtime, setRuntime] = useState<MetronomeRuntimeState>(
    createInitialRuntimeState,
  )

  const frameIdRef = useRef<number | null>(null)

  const cancelPending = useCallback(() => {
    if (frameIdRef.current !== null) {
      cancelFrameRef.current(frameIdRef.current)
      frameIdRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setRuntime((prev) => {
      if (prev.running) return prev
      return startRuntime(prev, nowRef.current())
    })
  }, [])

  const pause = useCallback(() => {
    cancelPending()
    setRuntime((prev) => pauseRuntime(prev))
  }, [cancelPending])

  const reset = useCallback(() => {
    cancelPending()
    setRuntime(createInitialRuntimeState())
  }, [cancelPending])

  const tick = useCallback(
    (nowMs: number) => {
      setRuntime((prev) => tickRuntime(prev, nowMs, resolvedConfig))
    },
    [resolvedConfig],
  )

  useEffect(() => {
    if (autoStart) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!runtime.running) return
    const loop: FrameRequestCallback = (ts) => {
      frameIdRef.current = null
      const nowMs =
        typeof ts === 'number' && Number.isFinite(ts) ? ts : nowRef.current()
      setRuntime((prev) => tickRuntime(prev, nowMs, resolvedConfig))
      frameIdRef.current = scheduleFrameRef.current(loop)
    }
    frameIdRef.current = scheduleFrameRef.current(loop)
    return () => {
      cancelPending()
    }
  }, [runtime.running, resolvedConfig, cancelPending])

  const activeStep = getActiveStep(runtime.metronome, resolvedConfig)
  const progress = getPhaseProgress(runtime.metronome, resolvedConfig)

  return {
    runtime,
    metronome: runtime.metronome,
    activeStep,
    progress,
    running: runtime.running,
    start,
    pause,
    reset,
    tick,
  }
}

