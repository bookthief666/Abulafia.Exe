// @vitest-environment happy-dom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useAudio } from './useAudio'
import type { AudioContextLike } from '../adapters/audioRuntime'

/**
 * A minimal stub graph. The adapter's own suite covers the audio maths; these
 * tests are about lifecycle — that nothing is built until asked, and that
 * everything is released when the chamber is left.
 */
function makeStubContext() {
  const node = () => ({ connect: () => {}, disconnect: () => {} })
  const param = () => ({ value: 0, setTargetAtTime: () => {} })
  const ctx = {
    currentTime: 0,
    state: 'running',
    destination: node(),
    closed: 0,
    created: 0,
    createOscillator() {
      ctx.created += 1
      return { ...node(), type: 'sine', frequency: param(), start: () => {}, stop: () => {} }
    },
    createGain: () => ({ ...node(), gain: param() }),
    createBiquadFilter: () => ({ ...node(), type: 'lowpass', frequency: param() }),
    resume: async () => {},
    close: async () => {
      ctx.closed += 1
    },
  }
  return ctx
}

function renderAudio(createContext?: () => AudioContextLike) {
  const ctx = makeStubContext()
  const result = renderHook(() =>
    useAudio({
      createContext: createContext ?? (() => ctx as unknown as AudioContextLike),
    }),
  )
  return { ctx, ...result }
}

describe('useAudio', () => {
  it('starts silent and builds nothing', () => {
    const { ctx, result } = renderAudio()
    expect(result.current.enabled).toBe(false)
    expect(ctx.created).toBe(0)
  })

  it('builds the graph only when sound is asked for', () => {
    const { ctx, result } = renderAudio()
    act(() => result.current.toggle())

    expect(result.current.enabled).toBe(true)
    // The tone and the drone.
    expect(ctx.created).toBe(2)
  })

  it('releases the graph when silenced again', () => {
    const { ctx, result } = renderAudio()
    act(() => result.current.toggle())
    act(() => result.current.toggle())

    expect(result.current.enabled).toBe(false)
    expect(ctx.closed).toBe(1)
  })

  it('ignores breath while silent, so nothing is built behind the scenes', () => {
    const { ctx, result } = renderAudio()
    act(() => {
      result.current.setBreath('exhale', 0.5, 'holam')
      result.current.strikeBell()
    })
    expect(ctx.created).toBe(0)
  })

  it('rings the bell only once engaged', () => {
    const { ctx, result } = renderAudio()
    act(() => result.current.toggle())
    const before = ctx.created
    act(() => result.current.strikeBell())
    expect(ctx.created).toBe(before + 1)
  })

  it('reports the platform having no audio, and stays silent', () => {
    const { result } = renderAudio(() => {
      throw new Error('no Web Audio here')
    })

    act(() => result.current.toggle())
    expect(result.current.enabled).toBe(false)
    expect(result.current.unavailable).toBe(true)
  })

  it('does not throw when driven on a platform without audio', () => {
    const { result } = renderAudio(() => {
      throw new Error('no Web Audio here')
    })
    act(() => result.current.toggle())

    expect(() =>
      act(() => {
        result.current.setBreath('exhale', 0.5, 'holam')
        result.current.strikeBell()
      }),
    ).not.toThrow()
  })

  it('releases the graph when the chamber unmounts', () => {
    const { ctx, result, unmount } = renderAudio()
    act(() => result.current.toggle())
    expect(ctx.closed).toBe(0)

    unmount()
    expect(ctx.closed).toBe(1)
  })

  it('keeps a stable identity for the breath and bell callbacks', () => {
    const { result, rerender } = renderAudio()
    const first = result.current.setBreath
    const bell = result.current.strikeBell
    rerender()
    // SomaticHud feeds breath from an effect keyed on these; a new identity
    // every render would re-run that effect needlessly.
    expect(result.current.setBreath).toBe(first)
    expect(result.current.strikeBell).toBe(bell)
  })
})
