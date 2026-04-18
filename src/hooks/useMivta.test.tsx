// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  advanceMetronome,
  createDefaultConfig,
  createInitialMetronomeState,
  getActiveStep,
  getPhaseProgress,
} from '../engines/metronomeEngine'
import { createInitialRuntimeState } from '../adapters/metronomeRuntime'
import { useMivta, type UseMivtaOptions } from './useMivta'

type ScheduleFrame = (cb: FrameRequestCallback) => number
type CancelFrame = (id: number) => void

type FrameHarness = {
  scheduleFrame: ScheduleFrame & ReturnType<typeof vi.fn>
  cancelFrame: CancelFrame & ReturnType<typeof vi.fn>
  pending: Array<{ id: number; cb: FrameRequestCallback }>
  drain: (ts: number) => void
}

function makeFrameHarness(): FrameHarness {
  const pending: Array<{ id: number; cb: FrameRequestCallback }> = []
  let nextId = 1
  const scheduleFrame = vi.fn<ScheduleFrame>((cb) => {
    const id = nextId++
    pending.push({ id, cb })
    return id
  })
  const cancelFrame = vi.fn<CancelFrame>((id) => {
    const idx = pending.findIndex((p) => p.id === id)
    if (idx >= 0) pending.splice(idx, 1)
  })
  const drain = (ts: number) => {
    const queued = pending.splice(0, pending.length)
    for (const { cb } of queued) cb(ts)
  }
  return { scheduleFrame, cancelFrame, pending, drain }
}

function render(options: UseMivtaOptions = {}) {
  return renderHook((props: UseMivtaOptions) => useMivta(props), {
    initialProps: options,
  })
}

describe('useMivta', () => {
  it('initial hook state mirrors createInitialRuntimeState and defaults', () => {
    const { result } = render({ now: () => 0 })
    const cfg = createDefaultConfig()
    expect(result.current.runtime).toEqual(createInitialRuntimeState())
    expect(result.current.metronome).toEqual(createInitialMetronomeState())
    expect(result.current.running).toBe(false)
    expect(result.current.activeStep).toEqual(
      getActiveStep(createInitialMetronomeState(), cfg),
    )
    expect(result.current.progress).toBe(
      getPhaseProgress(createInitialMetronomeState(), cfg),
    )
  })

  it('start() flips running true, seeds lastNowMs via now(), and does not advance metronome', () => {
    const harness = makeFrameHarness()
    const now = vi.fn(() => 1000)
    const { result } = render({
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    expect(result.current.running).toBe(true)
    expect(result.current.runtime.lastNowMs).toBe(1000)
    expect(result.current.metronome).toEqual(createInitialMetronomeState())
  })

  it('pause() preserves metronome state and cancels any pending frame', () => {
    const harness = makeFrameHarness()
    const now = vi.fn(() => 0)
    const { result } = render({
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    act(() => result.current.tick(2500))
    const seededMetronome = result.current.metronome
    expect(harness.pending.length).toBe(1)
    act(() => result.current.pause())
    expect(result.current.running).toBe(false)
    expect(result.current.runtime.lastNowMs).toBeNull()
    expect(result.current.metronome).toEqual(seededMetronome)
    expect(harness.cancelFrame).toHaveBeenCalled()
    expect(harness.pending.length).toBe(0)
  })

  it('reset() restores initial runtime/metronome and cancels pending frame', () => {
    const harness = makeFrameHarness()
    const now = vi.fn(() => 0)
    const { result } = render({
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    act(() => result.current.tick(5000))
    expect(harness.pending.length).toBe(1)
    act(() => result.current.reset())
    expect(result.current.runtime).toEqual(createInitialRuntimeState())
    expect(result.current.metronome).toEqual(createInitialMetronomeState())
    expect(result.current.running).toBe(false)
    expect(harness.cancelFrame).toHaveBeenCalled()
    expect(harness.pending.length).toBe(0)
  })

  it('manual tick(nowMs) advances deterministically via adapter', () => {
    const cfg = createDefaultConfig()
    const harness = makeFrameHarness()
    const now = vi.fn(() => 0)
    const { result } = render({
      config: cfg,
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    act(() => result.current.tick(1500))
    expect(result.current.runtime.lastNowMs).toBe(1500)
    expect(result.current.metronome).toEqual(
      advanceMetronome(createInitialMetronomeState(), 1500, cfg),
    )
    act(() => result.current.tick(5000))
    expect(result.current.runtime.lastNowMs).toBe(5000)
    expect(result.current.metronome).toEqual(
      advanceMetronome(createInitialMetronomeState(), 5000, cfg),
    )
  })

  it('autoStart triggers start() on mount', () => {
    const harness = makeFrameHarness()
    const now = vi.fn(() => 7777)
    const { result } = render({
      autoStart: true,
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    expect(result.current.running).toBe(true)
    expect(result.current.runtime.lastNowMs).toBe(7777)
    expect(harness.scheduleFrame).toHaveBeenCalledTimes(1)
  })

  it('repeated start() calls do not create duplicate RAF loops', () => {
    const harness = makeFrameHarness()
    const now = vi.fn(() => 0)
    const { result } = render({
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    act(() => result.current.start())
    act(() => result.current.start())
    expect(harness.scheduleFrame).toHaveBeenCalledTimes(1)
    expect(harness.pending.length).toBe(1)
  })

  it('scheduled frame advances runtime when running and re-schedules', () => {
    const cfg = createDefaultConfig()
    const harness = makeFrameHarness()
    const now = vi.fn(() => 0)
    const { result } = render({
      config: cfg,
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    expect(harness.pending.length).toBe(1)
    act(() => harness.drain(3000))
    expect(result.current.runtime.lastNowMs).toBe(3000)
    expect(result.current.metronome).toEqual(
      advanceMetronome(createInitialMetronomeState(), 3000, cfg),
    )
    expect(harness.pending.length).toBe(1)
    act(() => harness.drain(7500))
    expect(result.current.runtime.lastNowMs).toBe(7500)
    expect(result.current.metronome).toEqual(
      advanceMetronome(createInitialMetronomeState(), 7500, cfg),
    )
    expect(harness.pending.length).toBe(1)
  })

  it('paused state does not continue advancing via scheduled frames', () => {
    const cfg = createDefaultConfig()
    const harness = makeFrameHarness()
    const now = vi.fn(() => 0)
    const { result } = render({
      config: cfg,
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    act(() => harness.drain(2000))
    const snapshot = result.current.metronome
    act(() => result.current.pause())
    const scheduledBefore = harness.scheduleFrame.mock.calls.length
    act(() => harness.drain(5000))
    expect(result.current.metronome).toEqual(snapshot)
    expect(harness.scheduleFrame.mock.calls.length).toBe(scheduledBefore)
    expect(harness.pending.length).toBe(0)
  })

  it('activeStep and progress stay in sync with runtime.metronome', () => {
    const cfg = createDefaultConfig()
    const harness = makeFrameHarness()
    const now = vi.fn(() => 0)
    const { result } = render({
      config: cfg,
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    act(() => result.current.tick(cfg.inhaleMs + cfg.exhaleMs + 1000))
    expect(result.current.activeStep).toEqual(
      getActiveStep(result.current.metronome, cfg),
    )
    expect(result.current.progress).toBe(
      getPhaseProgress(result.current.metronome, cfg),
    )
  })

  it('unmount cancels any scheduled frame', () => {
    const harness = makeFrameHarness()
    const now = vi.fn(() => 0)
    const { result, unmount } = render({
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    expect(harness.pending.length).toBe(1)
    unmount()
    expect(harness.cancelFrame).toHaveBeenCalled()
    expect(harness.pending.length).toBe(0)
  })

  it('negative wall-clock deltas are handled through the adapter (clamped to 0)', () => {
    const harness = makeFrameHarness()
    const now = vi.fn(() => 10_000)
    const { result } = render({
      now,
      scheduleFrame: harness.scheduleFrame,
      cancelFrame: harness.cancelFrame,
    })
    act(() => result.current.start())
    expect(result.current.runtime.lastNowMs).toBe(10_000)
    act(() => result.current.tick(5_000))
    expect(result.current.runtime.lastNowMs).toBe(5_000)
    expect(result.current.metronome).toEqual(createInitialMetronomeState())
  })
})

