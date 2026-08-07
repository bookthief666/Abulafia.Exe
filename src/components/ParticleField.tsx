import { useEffect, useRef } from 'react'
import type { BreathPhase } from '../engines/metronomeEngine'

/**
 * The chamber's single canvas layer: drifting motes linked by constellation
 * threads, in the shared idiom of the sibling apps.
 *
 * Performance discipline, because this must hold up on a Galaxy Fold:
 *  - one canvas, no filters, no shadows on the link pass
 *  - particle count scales with viewport area and is hard-capped
 *  - DPR capped at 2
 *  - constellation search runs over a bounded neighbour window, not all pairs
 *  - the whole loop is skipped under `prefers-reduced-motion`
 *
 * Breath enters through a ref rather than a prop-driven effect, so the RAF loop
 * is never town down and rebuilt mid-cycle — and so React never re-renders on
 * account of the animation.
 */

const MAX_PARTICLES = 90
const LINK_DISTANCE = 120
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE
const SPRING = 0.014
const DAMPING = 0.86

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  tx: number
  ty: number
  size: number
  seed: number
  bright: boolean
}

export type ParticleFieldProps = {
  phase: BreathPhase
  /** Normalised progress through the current phase, 0..1. */
  progress: number
}

export function ParticleField({ phase, progress }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const breathRef = useRef({ phase, progress })
  useEffect(() => {
    breathRef.current = { phase, progress }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const context = canvas.getContext('2d')
    if (!context) return

    let width = 0
    let height = 0
    let dpr = 1
    let particles: Particle[] = []
    let frame = 0
    let time = 0

    const seedParticle = (): Particle => {
      const x = Math.random() * width
      const y = Math.random() * height
      return {
        x,
        y,
        vx: 0,
        vy: 0,
        tx: x,
        ty: y,
        size: Math.random() * 1.6 + 0.4,
        seed: Math.random() * Math.PI * 2,
        bright: Math.random() > 0.78,
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const target = Math.min(
        MAX_PARTICLES,
        Math.max(28, Math.floor((width * height) / 16000)),
      )
      particles = Array.from({ length: target }, seedParticle)
    }

    resize()

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(resize)
        : null
    observer?.observe(canvas)

    const render = () => {
      frame = requestAnimationFrame(render)
      time += 1

      const { phase: breathPhase, progress: breathProgress } = breathRef.current
      const p = Math.max(0, Math.min(1, breathProgress))

      // The field gathers and dims on the inhale, radiates on the exhale.
      const intensity =
        breathPhase === 'inhale' ? 0.35 - 0.15 * p : 0.4 + 0.6 * p
      // Motes are drawn inward as the breath is gathered, released as it goes.
      const spread = breathPhase === 'inhale' ? 0.88 - 0.08 * p : 0.8 + 0.22 * p

      // Full clear each frame. A partial-alpha wipe would smear the
      // constellation threads into geometric streaks — the exact
      // "attention-fragmenting motion" the doctrine forbids.
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      const cx = width / 2
      const cy = height / 2

      for (const particle of particles) {
        // Slow wander, plus a gentle pull toward a breath-scaled position.
        const driftX = Math.sin(time * 0.004 + particle.seed) * 0.05
        const driftY = Math.cos(time * 0.0033 + particle.seed * 0.7) * 0.05

        const homeX = cx + (particle.tx - cx) * spread
        const homeY = cy + (particle.ty - cy) * spread

        particle.vx += (homeX - particle.x) * SPRING + driftX
        particle.vy += (homeY - particle.y) * SPRING + driftY
        particle.vx *= DAMPING
        particle.vy *= DAMPING
        particle.x += particle.vx
        particle.y += particle.vy

        const pulse = 0.65 + Math.sin(time * 0.02 + particle.seed) * 0.35
        const alpha = (particle.bright ? 0.5 : 0.26) * intensity * pulse
        const radius = particle.size * (0.8 + pulse * 0.5)

        // Cyan for the bright motes, near-white for the rest — the accent
        // never becomes a second hue.
        context.beginPath()
        context.fillStyle = particle.bright
          ? `rgba(0,255,255,${alpha.toFixed(3)})`
          : `rgba(226,236,248,${(alpha * 0.8).toFixed(3)})`
        context.arc(particle.x, particle.y, radius, 0, Math.PI * 2)
        context.fill()
      }

      // Constellation threads. Bounded neighbour window keeps this O(n·k).
      context.lineWidth = 0.5
      const linkAlphaBase = 0.16 * intensity
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        const limit = Math.min(particles.length, i + 9)
        for (let j = i + 1; j < limit; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distSq = dx * dx + dy * dy
          if (distSq > LINK_DISTANCE_SQ) continue
          const alpha = (1 - distSq / LINK_DISTANCE_SQ) * linkAlphaBase
          context.beginPath()
          context.strokeStyle = `rgba(150,205,225,${alpha.toFixed(3)})`
          context.moveTo(a.x, a.y)
          context.lineTo(b.x, b.y)
          context.stroke()
        }
      }
    }

    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [])

  // Fixed and full-bleed: a bounded canvas would clip the field into a
  // visible rectangle against the surrounding chamber.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    />
  )
}

export default ParticleField
