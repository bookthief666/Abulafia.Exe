import { useEffect, useRef } from 'react'
import { drainFieldPulses, getFieldState } from './fieldSignal'
import { cardinalUnit, type Cardinal } from './chamberGeometry'

/**
 * The atmosphere: drifting motes linked by constellation threads, filling the
 * whole app rather than just the chamber.
 *
 * The field is bound to the operation at every point — it leans along the
 * active direction, snaps at the turn of the breath, flares when the rite
 * moves to a new arrangement, and stills when the rite ends. Nothing here is
 * random motion for its own sake; that is the difference between a motion
 * field and the particle spam the doctrine forbids.
 *
 * Performance discipline, because this must hold on a Galaxy Fold in both
 * postures:
 *  - one canvas, no filters, no shadows
 *  - links come from a uniform-grid spatial hash, so cost is O(n) not O(n²)
 *  - DPR capped at 2; density scales with viewport area and is hard-capped
 *  - `prefers-reduced-motion` skips the loop entirely
 *  - `data-effects="low"` thins the field and drops streaks
 *
 * State arrives through the module-scoped `fieldSignal` rather than props, so
 * the loop is never torn down mid-cycle and React never re-renders because of
 * the animation.
 */

const MAX_PARTICLES = 220
const LINK_DISTANCE = 116
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE
const SPRING = 0.014
const BASE_DAMPING = 0.9

/** How far a mote's streak trails behind it, per unit of velocity. */
const STREAK = 3.2

/** Milliseconds a permutation flare takes to decay. */
const FLARE_MS = 1500

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  /** Home position — the point the mote is sprung toward. */
  hx: number
  hy: number
  size: number
  seed: number
  bright: boolean
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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

    const lowEffects = () =>
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-effects') === 'low'

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let time = 0

    // Spatial hash, rebuilt each frame. Cells hold indices into `particles`.
    let cols = 0
    let rows = 0
    let cells: number[][] = []

    // Decaying markers for the two one-shot events.
    let flare = 0
    let lastPermutation = -1

    const seedParticle = (): Particle => {
      const x = Math.random() * width
      const y = Math.random() * height
      return {
        x,
        y,
        vx: 0,
        vy: 0,
        hx: x,
        hy: y,
        size: Math.random() * 1.7 + 0.5,
        seed: Math.random() * Math.PI * 2,
        bright: Math.random() > 0.74,
      }
    }

    const resize = () => {
      // Measure the viewport, not the element. The canvas is position:fixed and
      // always fills the screen, and its own box reports 0x0 if this runs
      // before first layout — which silently leaves the backing buffer at a
      // couple of pixels and the whole field invisible.
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width || window.innerWidth || 1)
      height = Math.max(1, rect.height || window.innerHeight || 1)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const ceiling = lowEffects() ? 70 : MAX_PARTICLES
      const target = Math.min(
        ceiling,
        Math.max(30, Math.floor((width * height) / 7000)),
      )
      particles = Array.from({ length: target }, seedParticle)

      cols = Math.max(1, Math.ceil(width / LINK_DISTANCE))
      rows = Math.max(1, Math.ceil(height / LINK_DISTANCE))
      cells = Array.from({ length: cols * rows }, () => [])
    }

    resize()

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    observer?.observe(canvas)
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)

    // Density is chosen at seed time, so a runtime change to the effects tier
    // has to re-seed or the setting would only take hold on the next resize.
    const effectsWatcher =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(resize)
        : null
    effectsWatcher?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-effects'],
    })

    let lastTs = 0

    const render = (ts: number) => {
      frame = requestAnimationFrame(render)
      const dt = lastTs === 0 ? 16 : Math.min(64, ts - lastTs)
      lastTs = ts
      time += 1

      const field = getFieldState()
      const ritual = field.mode === 'ritual' ? field : null
      const p = ritual ? Math.max(0, Math.min(1, ritual.progress)) : 0
      const exhaling = ritual?.phase === 'exhale'
      const complete = ritual?.isComplete ?? false

      // ── Envelopes ──────────────────────────────────────────────────────
      // Outside the rite the field simply breathes on its own, slowly, so the
      // gate and the manual are alive without competing for attention.
      let intensity: number
      if (!ritual) {
        intensity = 0.42 + 0.06 * Math.sin(time * 0.006)
      } else if (complete) {
        intensity = 0.3
      } else {
        // The inhale dims and gathers; the exhale opens and radiates. The
        // floor stays well clear of zero so the inhale reads as darkening
        // rather than as the field switching off.
        intensity = exhaling ? 0.55 + 0.65 * p : 0.5 - 0.18 * p
      }

      // Permutation turnover: a flare that gathers and brightens, then decays.
      if (ritual && ritual.permutationIndex !== lastPermutation) {
        if (lastPermutation !== -1) flare = FLARE_MS
        lastPermutation = ritual.permutationIndex
      }
      if (!ritual) lastPermutation = -1
      if (flare > 0) flare = Math.max(0, flare - dt)
      const flareT = flare / FLARE_MS
      intensity += flareT * 0.5

      // Motes are drawn inward as breath is gathered, released as it goes.
      let spread = 1
      if (ritual && !complete) spread = exhaling ? 0.84 + 0.2 * p : 0.92 - 0.1 * p
      spread -= flareT * 0.12

      // Completion: raise damping so the field slows and settles.
      const damping = complete ? 0.8 : BASE_DAMPING

      // ── Directional lean ───────────────────────────────────────────────
      // On the exhale the whole room leans the way the head turns, so the
      // somatic mapping is felt in the space and not only at the core.
      let leanX = 0
      let leanY = 0
      let converge = 0
      if (ritual && exhaling && !complete) {
        if (ritual.direction === 'forward') {
          converge = 0.5 * p
        } else {
          const { ux, uy } = cardinalUnit(ritual.direction as Cardinal)
          leanX = ux * 0.42 * p
          leanY = uy * 0.42 * p
        }
      }

      // ── Phase-flip impulse ─────────────────────────────────────────────
      const pulses = drainFieldPulses()
      const cx = width / 2
      const cy = height / 2
      if (pulses > 0 && !complete) {
        const strength = Math.min(3, pulses) * 1.9
        for (const particle of particles) {
          const dx = particle.x - cx
          const dy = particle.y - cy
          const dist = Math.hypot(dx, dy) || 1
          particle.vx += (dx / dist) * strength
          particle.vy += (dy / dist) * strength
        }
      }

      // Full clear. A partial-alpha wipe would smear the constellation into
      // geometric streaks; motion is expressed per-particle instead.
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      for (const cell of cells) cell.length = 0

      const streaks = !lowEffects()

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]

        const driftX = Math.sin(time * 0.004 + particle.seed) * 0.05
        const driftY = Math.cos(time * 0.0033 + particle.seed * 0.7) * 0.05

        const homeX = cx + (particle.hx - cx) * spread
        const homeY = cy + (particle.hy - cy) * spread

        particle.vx += (homeX - particle.x) * SPRING + driftX + leanX
        particle.vy += (homeY - particle.y) * SPRING + driftY + leanY

        if (converge > 0) {
          const dx = cx - particle.x
          const dy = cy - particle.y
          const dist = Math.hypot(dx, dy) || 1
          particle.vx += (dx / dist) * converge
          particle.vy += (dy / dist) * converge
        }

        particle.vx *= damping
        particle.vy *= damping
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap, so a leaning field never strands motes off one edge.
        if (particle.x < -20) particle.x = width + 20
        else if (particle.x > width + 20) particle.x = -20
        if (particle.y < -20) particle.y = height + 20
        else if (particle.y > height + 20) particle.y = -20

        const pulse = 0.65 + Math.sin(time * 0.02 + particle.seed) * 0.35
        const alpha = (particle.bright ? 0.62 : 0.34) * intensity * pulse
        const radius = particle.size * (0.8 + pulse * 0.5)

        // Cyan for the bright motes, near-white for the rest. The accent never
        // becomes a second hue.
        const colour = particle.bright ? '0,255,255' : '226,236,248'

        // The streak elongates exactly when a mote is moving fast — during the
        // directional lean and the phase impulse — and vanishes when still.
        if (streaks) {
          const speed = Math.hypot(particle.vx, particle.vy)
          if (speed > 0.35) {
            context.beginPath()
            context.strokeStyle = `rgba(${colour},${(alpha * 0.5).toFixed(3)})`
            context.lineWidth = radius * 0.9
            context.lineCap = 'round'
            context.moveTo(
              particle.x - particle.vx * STREAK,
              particle.y - particle.vy * STREAK,
            )
            context.lineTo(particle.x, particle.y)
            context.stroke()
          }
        }

        context.beginPath()
        context.fillStyle = `rgba(${colour},${alpha.toFixed(3)})`
        context.arc(particle.x, particle.y, radius, 0, Math.PI * 2)
        context.fill()

        // File into the spatial hash for the link pass.
        const col = Math.min(cols - 1, Math.max(0, Math.floor(particle.x / LINK_DISTANCE)))
        const row = Math.min(rows - 1, Math.max(0, Math.floor(particle.y / LINK_DISTANCE)))
        cells[row * cols + col].push(i)
      }

      // ── Constellation threads ──────────────────────────────────────────
      // Genuine proximity, via the hash: each mote tests only its own cell and
      // the four already-visited neighbours, so every pair is considered once.
      context.lineWidth = 0.55
      const linkAlphaBase = 0.22 * intensity
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const bucket = cells[row * cols + col]
          if (bucket.length === 0) continue

          for (let n = 0; n < 5; n++) {
            // Own cell, then E, SW, S, SE — the half-neighbourhood.
            const nc = col + [0, 1, -1, 0, 1][n]
            const nr = row + [0, 0, 1, 1, 1][n]
            if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue
            const other = cells[nr * cols + nc]
            if (other.length === 0) continue

            for (let bi = 0; bi < bucket.length; bi++) {
              const a = particles[bucket[bi]]
              // Within the same cell, only look forward to avoid pairing twice.
              const start = n === 0 ? bi + 1 : 0
              for (let oi = start; oi < other.length; oi++) {
                const b = particles[other[oi]]
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
        }
      }
    }

    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      effectsWatcher?.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
    }
  }, [])

  // Fixed and full-bleed: a bounded canvas would clip the field into a visible
  // rectangle against the surrounding space.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="particle-field pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    />
  )
}

export default ParticleField
