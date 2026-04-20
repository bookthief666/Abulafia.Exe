import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useMivta } from '../hooks/useMivta'
import type {
  BreathPhase,
  Direction,
  Vowel,
} from '../engines/metronomeEngine'

const BLACK = '#050505'
const WHITE = '#FFFFFF'
const CYAN = '#00FFFF'
const DIM_OPACITY = 0.35
const MONO =
  "ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace"

const DIRECTIONS: readonly Direction[] = [
  'up',
  'right',
  'down',
  'left',
  'forward',
]
const VOWELS: readonly Vowel[] = [
  'holam',
  'qamatz',
  'hiriq',
  'tzere',
  'qubuts',
]

// Standard Hebrew / Abulafian operational phonetic mapping.
const VOWEL_GLYPH: Record<Vowel, string> = {
  holam: 'O',
  qamatz: 'A',
  hiriq: 'I',
  tzere: 'E',
  qubuts: 'U',
}

// Tetragrammaton fragment set — repeated 3× around the outer ring (12 glyphs).
const TETRAGRAMMATON: readonly string[] = ['Y', 'H', 'V', 'H']

const INNER_RING_COUNT = 8
const OUTER_RING_COUNT = 12
const INNER_RING_R = 22
const OUTER_RING_R = 36

// Eight vertices around (50,50) at radius r, pointy-top (angle starts at -π/2).
function octagonPoints(r: number): string {
  const cx = 50
  const cy = 50
  const pts: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 4
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    pts.push(`${x.toFixed(3)},${y.toFixed(3)}`)
  }
  return pts.join(' ')
}

function polarPoint(
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  }
}

// Cardinal direction → SVG angle (radians), with screen-y pointing down.
// Forward has no cardinal angle; it lives at the center.
function cardinalAngle(d: Direction): number | null {
  switch (d) {
    case 'up':
      return -Math.PI / 2
    case 'right':
      return 0
    case 'down':
      return Math.PI / 2
    case 'left':
      return Math.PI
    case 'forward':
    default:
      return null
  }
}

// Given a ring of N evenly spaced glyphs starting at -π/2, returns the index
// closest to the target angle — or -1 if there is no active cardinal.
function activeRingIndex(count: number, targetAngle: number | null): number {
  if (targetAngle === null) return -1
  let best = 0
  let bestDelta = Infinity
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / count
    // Normalize angular distance to [0, π].
    let delta = Math.abs(((a - targetAngle) % (2 * Math.PI)) + 2 * Math.PI) %
      (2 * Math.PI)
    if (delta > Math.PI) delta = 2 * Math.PI - delta
    if (delta < bestDelta) {
      bestDelta = delta
      best = i
    }
  }
  return best
}

const hudStyle: CSSProperties = {
  backgroundColor: BLACK,
  color: WHITE,
  fontFamily: MONO,
  minHeight: '100dvh',
  width: '100%',
  boxSizing: 'border-box',
  padding: 'clamp(12px, 2vmin, 28px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(12px, 2vmin, 24px)',
  overflow: 'hidden',
  position: 'relative',
}

const topZoneStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(8px, 1.2vmin, 14px)',
  flex: '0 0 auto',
  position: 'relative',
  zIndex: 3,
}

const phaseLabelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(28px, 6vmin, 64px)',
  fontWeight: 500,
  letterSpacing: '0.32em',
  color: WHITE,
  textAlign: 'center',
  margin: 0,
  padding: 0,
  textTransform: 'uppercase',
}

const permutationHeaderStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(22px, 4.6vmin, 48px)',
  fontWeight: 500,
  letterSpacing: '0.42em',
  color: WHITE,
  textAlign: 'center',
  margin: 0,
  padding: 0,
  textTransform: 'uppercase',
  textIndent: '0.42em',
}

const permutationEyebrowStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.5em',
  textTransform: 'uppercase',
  color: CYAN,
  opacity: 0.75,
  margin: 0,
  textAlign: 'center',
}

const progressTrackStyle: CSSProperties = {
  width: '100%',
  height: '1px',
  backgroundColor: 'rgba(255,255,255,0.22)',
  position: 'relative',
}

const progressFillStyle = (p: number): CSSProperties => ({
  width: `${Math.max(0, Math.min(1, p)) * 100}%`,
  height: '1px',
  backgroundColor: WHITE,
})

const centerZoneStyle: CSSProperties = {
  flex: '1 1 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 0,
  position: 'relative',
  isolation: 'isolate',
  zIndex: 1,
}

// Static radial vignette — pure CSS background, no motion, no filter.
// Sits behind the halos and SVG, deepens the periphery of the chamber.
const vignetteStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(ellipse at center, rgba(0,255,255,0.035) 0%, rgba(5,5,5,0) 40%, rgba(5,5,5,0.55) 85%, rgba(0,0,0,0.85) 100%)',
  pointerEvents: 'none',
  zIndex: 0,
}

// Bottom veil — a soft gradient fade over the HUD area so controls and
// telemetry dissolve into the chamber instead of sitting in a panel.
// Positioned absolute within hudStyle's relative root (not fixed).
const bottomVeilStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '28vh',
  pointerEvents: 'none',
  background:
    'linear-gradient(to bottom, rgba(5,5,5,0) 0%, rgba(5,5,5,0.55) 55%, rgba(5,5,5,0.85) 100%)',
  zIndex: 2,
}

// Ambient atmospheric halos — decorative-only, out of phase with breath.
// They sit behind the SVG and are deliberately pointer-inert.
const haloOuterStyle: CSSProperties = {
  position: 'absolute',
  width: '92vmin',
  height: '92vmin',
  borderRadius: '50%',
  background:
    'radial-gradient(closest-side, rgba(0,255,255,0.18), rgba(0,255,255,0.05) 55%, rgba(0,255,255,0) 72%)',
  pointerEvents: 'none',
  zIndex: 0,
  filter: 'blur(2vmin)',
  mixBlendMode: 'screen',
}

const haloInnerStyle: CSSProperties = {
  position: 'absolute',
  width: '56vmin',
  height: '56vmin',
  borderRadius: '50%',
  background:
    'radial-gradient(closest-side, rgba(255,255,255,0.09), rgba(0,255,255,0.06) 45%, rgba(0,255,255,0) 75%)',
  pointerEvents: 'none',
  zIndex: 0,
  filter: 'blur(1vmin)',
  mixBlendMode: 'screen',
}

const floatWrapperStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  willChange: 'transform',
}

const directionWrapperStyle = (
  dx: string,
  dy: string,
  sx: number,
  sy: number,
): CSSProperties => ({
  transform: `translate(${dx}, ${dy}) scale(${sx}, ${sy})`,
  transition: 'transform 200ms ease-out',
  willChange: 'transform',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const forwardScalerStyle = (scale: number): CSSProperties => ({
  transform: `scale(${scale})`,
  transformOrigin: '50% 50%',
  transition: 'transform 200ms ease-out',
})

const snapScalerStyle = (active: boolean): CSSProperties => ({
  transform: `scale(${active ? 1.04 : 1})`,
  transformOrigin: '50% 50%',
  transition: 'transform 100ms ease-out',
})

const breathScalerStyle = (scale: number): CSSProperties => ({
  transform: `scale(${scale})`,
  transformOrigin: '50% 50%',
  willChange: 'transform',
})

const coreStyle: CSSProperties = {
  width: '65vmin',
  height: '65vmin',
  display: 'block',
}

const bottomZoneStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(8px, 1.2vmin, 14px)',
  flex: '0 0 auto',
  position: 'relative',
  zIndex: 3,
}

const stripLabelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  opacity: 0.3,
  textTransform: 'uppercase',
  color: WHITE,
}

const stripStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '8px',
}

const cellBaseStyle: CSSProperties = {
  padding: '6px 4px',
  textAlign: 'center',
  fontFamily: MONO,
  fontSize: '12px',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  boxSizing: 'border-box',
  transition: 'color 120ms ease-out, opacity 120ms ease-out',
}

const activeCellStyle: CSSProperties = {
  ...cellBaseStyle,
  color: CYAN,
  opacity: 1,
  borderBottom: `1px solid ${CYAN}`,
}

const inactiveCellStyle: CSSProperties = {
  ...cellBaseStyle,
  color: WHITE,
  opacity: 0.25,
  borderBottom: '1px solid transparent',
}

const controlsRowStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'center',
  opacity: 0.5,
}

const devButtonStyle: CSSProperties = {
  backgroundColor: 'transparent',
  color: WHITE,
  border: '1px solid transparent',
  padding: '8px 14px',
  fontFamily: MONO,
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  opacity: 0.7,
}

const devButtonDisabledStyle: CSSProperties = {
  ...devButtonStyle,
  opacity: 0.3,
  cursor: 'not-allowed',
}

const telemetryStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '8px',
  paddingTop: '8px',
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  opacity: 0.32,
}

const telemetryCellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
}

const telemetryKeyStyle: CSSProperties = {
  opacity: 0.5,
}

const telemetryValueStyle: CSSProperties = {
  color: WHITE,
  fontVariantNumeric: 'tabular-nums',
}

function directionTranslate(d: Direction): { dx: string; dy: string } {
  switch (d) {
    case 'up':
      return { dx: '0', dy: '-5vmin' }
    case 'down':
      return { dx: '0', dy: '5vmin' }
    case 'left':
      return { dx: '-5vmin', dy: '0' }
    case 'right':
      return { dx: '5vmin', dy: '0' }
    case 'forward':
    default:
      return { dx: '0', dy: '0' }
  }
}

function directionStretch(d: Direction): { sx: number; sy: number } {
  switch (d) {
    case 'up':
    case 'down':
      return { sx: 0.96, sy: 1.06 }
    case 'left':
    case 'right':
      return { sx: 1.06, sy: 0.96 }
    case 'forward':
    default:
      return { sx: 1, sy: 1 }
  }
}

// Cardinal marker geometry inside the 100x100 viewBox. Each marker is a tick
// pointing radially outward from (50,50), capped by a small square node.
type Cardinal = 'up' | 'right' | 'down' | 'left'
const CARDINALS: readonly Cardinal[] = ['up', 'right', 'down', 'left']

function cardinalMarker(
  c: Cardinal,
  baseR: number,
): { x1: number; y1: number; x2: number; y2: number; nx: number; ny: number } {
  const tickLen = 4
  const cx = 50
  const cy = 50
  let ux = 0
  let uy = 0
  switch (c) {
    case 'up':
      ux = 0
      uy = -1
      break
    case 'right':
      ux = 1
      uy = 0
      break
    case 'down':
      ux = 0
      uy = 1
      break
    case 'left':
      ux = -1
      uy = 0
      break
  }
  const x1 = cx + ux * baseR
  const y1 = cy + uy * baseR
  const x2 = cx + ux * (baseR + tickLen)
  const y2 = cy + uy * (baseR + tickLen)
  return { x1, y1, x2, y2, nx: x2, ny: y2 }
}

export type SomaticHudProps = {
  permutation?: string
  permutationIndex?: number
  permutationTotal?: number
  loopsCompleted?: number
  repetitionCount?: number
  onBreathCycle?: () => void
}

export function SomaticHud({
  permutation,
  permutationIndex,
  permutationTotal,
  loopsCompleted,
  repetitionCount,
  onBreathCycle,
}: SomaticHudProps = {}) {
  const { running, runtime, activeStep, progress, start, pause, reset, tick } =
    useMivta()
  const tickCounterRef = useRef<number | null>(null)

  const handleTick = () => {
    const baseline = runtime.lastNowMs ?? 0
    const current = tickCounterRef.current ?? baseline
    tickCounterRef.current = Math.max(current, baseline) + 1000
    tick(tickCounterRef.current)
  }

  // Stable ref for the breath-cycle callback so the phase-edge effect below
  // never sees a stale closure when the parent re-creates the function.
  const onBreathCycleRef = useRef<(() => void) | undefined>(onBreathCycle)
  useEffect(() => {
    onBreathCycleRef.current = onBreathCycle
  }, [onBreathCycle])

  const phase = runtime.metronome.phase
  const phaseText = phase === 'inhale' ? 'INHALE' : 'EXHALE'
  const p = Math.max(0, Math.min(1, progress))
  const direction = activeStep.direction
  const vowel = activeStep.vowel
  const glyph = VOWEL_GLYPH[vowel]

  const { dx, dy } = directionTranslate(direction)
  const { sx, sy } = directionStretch(direction)
  const forwardScale = direction === 'forward' ? 1.25 : 1

  // Phase-flip punctuation (~100ms). Purely a local UI concern.
  const prevPhaseRef = useRef<BreathPhase>(phase)
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [snap, setSnap] = useState(false)

  useEffect(() => {
    if (phase !== prevPhaseRef.current) {
      const prev = prevPhaseRef.current
      prevPhaseRef.current = phase
      if (prev === 'exhale' && phase === 'inhale') {
        onBreathCycleRef.current?.()
      }
      if (snapTimeoutRef.current != null) {
        clearTimeout(snapTimeoutRef.current)
      }
      setSnap(true)
      snapTimeoutRef.current = setTimeout(() => {
        setSnap(false)
        snapTimeoutRef.current = null
      }, 100)
    }
    return () => {
      if (snapTimeoutRef.current != null) {
        clearTimeout(snapTimeoutRef.current)
        snapTimeoutRef.current = null
      }
    }
  }, [phase])

  // Breath-responsive frame geometry (SVG viewBox 0 0 100 100).
  // Inhale: frame contracts toward the center; stroke gathers force.
  // Exhale: frame releases outward; stroke intensifies (restrained) as it blooms.
  let frameStroke: number
  if (phase === 'inhale') {
    frameStroke = 0.6 + 1.8 * p
  } else {
    frameStroke = 1.2 + 0.9 * p
  }

  // Core scale — progress-driven, no CSS transition.
  // Inhale contracts 1.00 -> 0.93 (deeper tension).
  // Exhale blooms 0.93 -> 1.08 (more dramatic emanation).
  const breathScale =
    phase === 'inhale' ? 1 - 0.07 * p : 0.93 + 0.15 * p

  // Cyan glow intensifies only on exhale (restrained release).
  const glow =
    phase === 'exhale'
      ? `drop-shadow(0 0 ${1 + 3 * p}vmin rgba(0,255,255,${(
          0.18 +
          0.42 * p
        ).toFixed(3)}))`
      : 'drop-shadow(0 0 0 rgba(0,0,0,0))'

  // Snap-only attribute overrides (discrete, applied to SVG attrs).
  const frameStrokeRendered = frameStroke + (snap ? 0.6 : 0)
  const ringOpacityRendered = snap ? 1 : 0.6

  // Continuous 0..1 across a full inhale+exhale cycle — drives orbital rotation
  // across the phase boundary without a discontinuity in direction.
  const cycleT = phase === 'inhale' ? 0.5 * p : 0.5 + 0.5 * p
  const ringAngleA = 360 * cycleT
  const ringAngleB = -360 * cycleT

  // Orbital radii: tighten on inhale, expand on exhale.
  const orbitOuterR = phase === 'inhale' ? 38 - 4 * p : 34 + 4 * p
  const orbitInnerR = phase === 'inhale' ? 26 - 3 * p : 23 + 3 * p

  // Dash arrays: compress on inhale, bloom on exhale.
  const dashA =
    phase === 'inhale'
      ? `${(6 - 4 * p).toFixed(2)} ${(3 - 1.5 * p).toFixed(2)}`
      : `${(2 + 4 * p).toFixed(2)} ${(1.5 + 1.5 * p).toFixed(2)}`
  const dashB =
    phase === 'inhale'
      ? `${(3 - 2 * p).toFixed(2)} ${(2 - 1 * p).toFixed(2)}`
      : `${(1 + 2 * p).toFixed(2)} ${(1 + 1 * p).toFixed(2)}`

  // Containment octagon radius — breathes with phase.
  const octR = phase === 'inhale' ? 45 - 3 * p : 42 + 3 * p

  // Cyan intensity for the active directional marker — burns brighter on exhale.
  const markerIntensity =
    direction === 'forward'
      ? 0
      : phase === 'exhale'
        ? 0.5 + 0.5 * p
        : 0.55

  // Bindu (center) emphasis when direction === 'forward'.
  const binduAuraOpacity =
    direction === 'forward' ? 0.6 + 0.4 * p : 0.25
  const binduFontSize = direction === 'forward' ? 32 : 28
  const binduEchoOpacity = phase === 'exhale' ? 0.18 + 0.25 * p : 0

  // Letter-field opacity envelope: gathers on inhale, radiates on exhale.
  const fieldOpacity =
    phase === 'inhale' ? 0.35 + 0.25 * p : 0.55 + 0.4 * p

  // Which ring index is aligned with the current cardinal direction?
  const activeAngle = cardinalAngle(direction)
  const innerActiveIdx = activeRingIndex(INNER_RING_COUNT, activeAngle)
  const outerActiveIdx = activeRingIndex(OUTER_RING_COUNT, activeAngle)

  return (
    <div style={hudStyle}>
      <section style={topZoneStyle}>
        {permutation ? (
          <>
            <p style={permutationEyebrowStyle}>§ Permutation</p>
            <div
              role="heading"
              aria-level={1}
              style={permutationHeaderStyle}
              data-testid="permutation-header"
            >
              {permutation}
            </div>
          </>
        ) : null}
        <div role="heading" aria-level={2} style={phaseLabelStyle}>
          {phaseText}
        </div>
        <div
          style={progressTrackStyle}
          role="progressbar"
          aria-valuenow={Math.round(p * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${phaseText} progress`}
        >
          <div style={progressFillStyle(p)} />
        </div>
      </section>

      <section style={centerZoneStyle}>
        <div aria-hidden="true" style={vignetteStyle} />
        <motion.div
          aria-hidden="true"
          style={haloOuterStyle}
          animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          style={haloInnerStyle}
          animate={{ scale: [1.04, 0.96, 1.04], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={floatWrapperStyle}
          animate={{ y: [0, -1.5, 0, 1.5, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        >
        <div style={directionWrapperStyle(dx, dy, sx, sy)}>
          <div style={forwardScalerStyle(forwardScale)}>
            <div style={snapScalerStyle(snap)}>
              <div style={breathScalerStyle(breathScale)}>
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label={`Ritual core: vowel ${vowel}, direction ${direction}, phase ${phase}`}
                  style={{ ...coreStyle, filter: glow }}
                >
                  {/* Ambient luminous pulse behind the bindu — atmospheric
                      secondary motion, independent of the breath metronome. */}
                  <motion.circle
                    cx={50}
                    cy={50}
                    r={14}
                    fill={CYAN}
                    opacity={0.06}
                    animate={{ opacity: [0.04, 0.11, 0.04], r: [13, 16, 13] }}
                    transition={{
                      duration: 5.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />

                  {/* Segmented outer ring — structural texture. */}
                  <polygon
                    points={octagonPoints(octR + 3)}
                    fill="none"
                    stroke={WHITE}
                    strokeWidth={0.4}
                    strokeDasharray="0.5 3"
                    vectorEffect="non-scaling-stroke"
                    opacity={0.35}
                  />

                  {/* Containment frame — primary octagon. */}
                  <polygon
                    points={octagonPoints(octR)}
                    fill="none"
                    stroke={WHITE}
                    strokeWidth={frameStrokeRendered}
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Cardinal directional markers — one lights CYAN when active. */}
                  <g>
                    {CARDINALS.map((c) => {
                      const m = cardinalMarker(c, octR)
                      const active = c === direction
                      const color = active ? CYAN : WHITE
                      const opacity = active ? markerIntensity : DIM_OPACITY
                      return (
                        <g key={c} opacity={opacity}>
                          <line
                            x1={m.x1}
                            y1={m.y1}
                            x2={m.x2}
                            y2={m.y2}
                            stroke={color}
                            strokeWidth={0.8}
                            vectorEffect="non-scaling-stroke"
                          />
                          <rect
                            x={m.nx - 0.9}
                            y={m.ny - 0.9}
                            width={1.8}
                            height={1.8}
                            fill={color}
                            stroke={color}
                            strokeWidth={0.3}
                            vectorEffect="non-scaling-stroke"
                          />
                        </g>
                      )
                    })}
                  </g>

                  {/* Outer orbital trace — dashed, rotating clockwise with the cycle. */}
                  <g transform={`rotate(${ringAngleA} 50 50)`}>
                    <circle
                      cx={50}
                      cy={50}
                      r={orbitOuterR}
                      fill="none"
                      stroke={WHITE}
                      strokeWidth={0.5}
                      strokeDasharray={dashA}
                      vectorEffect="non-scaling-stroke"
                      opacity={ringOpacityRendered}
                    />
                  </g>

                  {/* Outer letter ring — YHVH × 3, 12 glyphs at clockface positions.
                      Rotates clockwise with the cycle, locked to the outer orbital trace. */}
                  <g transform={`rotate(${ringAngleA} 50 50)`} opacity={fieldOpacity}>
                    {Array.from({ length: OUTER_RING_COUNT }).map((_, i) => {
                      const a = -Math.PI / 2 + (i * 2 * Math.PI) / OUTER_RING_COUNT
                      const pt = polarPoint(50, 50, OUTER_RING_R, a)
                      const letter = TETRAGRAMMATON[i % TETRAGRAMMATON.length]
                      const isActive = i === outerActiveIdx
                      return (
                        <text
                          key={`outer-${i}`}
                          x={pt.x}
                          y={pt.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isActive ? CYAN : WHITE}
                          fontFamily={MONO}
                          fontSize={3.6}
                          fontWeight={500}
                          letterSpacing="0.08em"
                          opacity={isActive ? 1 : 0.55}
                        >
                          {letter}
                        </text>
                      )
                    })}
                  </g>

                  {/* Inner orbital trace — dashed, counter-rotating. */}
                  <g transform={`rotate(${ringAngleB} 50 50)`}>
                    <circle
                      cx={50}
                      cy={50}
                      r={orbitInnerR}
                      fill="none"
                      stroke={WHITE}
                      strokeWidth={0.7}
                      strokeDasharray={dashB}
                      vectorEffect="non-scaling-stroke"
                      opacity={0.5 + (snap ? 0.5 : 0)}
                    />
                  </g>

                  {/* Inner letter ring — active vowel glyph × 8 at octagonal positions.
                      Counter-rotates, locked to the inner orbital trace. */}
                  <g transform={`rotate(${ringAngleB} 50 50)`} opacity={fieldOpacity}>
                    {Array.from({ length: INNER_RING_COUNT }).map((_, i) => {
                      const a = -Math.PI / 2 + (i * 2 * Math.PI) / INNER_RING_COUNT
                      const pt = polarPoint(50, 50, INNER_RING_R, a)
                      const isActive = i === innerActiveIdx
                      return (
                        <text
                          key={`inner-${i}`}
                          x={pt.x}
                          y={pt.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isActive ? CYAN : WHITE}
                          fontFamily={MONO}
                          fontSize={4.5}
                          fontWeight={500}
                          letterSpacing="0.08em"
                          opacity={isActive ? 1 : 0.5}
                        >
                          {glyph}
                        </text>
                      )
                    })}
                  </g>

                  {/* Bindu aura — faint halo that swells when direction === 'forward'. */}
                  <circle
                    cx={50}
                    cy={50}
                    r={9}
                    fill="none"
                    stroke={WHITE}
                    strokeWidth={0.3}
                    vectorEffect="non-scaling-stroke"
                    opacity={binduAuraOpacity}
                  />

                  {/* Bindu echo — offset cyan duplicate, exhale-only drop-shadow without filters. */}
                  {phase === 'exhale' && (
                    <text
                      x={50.6}
                      y={50.6}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={CYAN}
                      fontFamily={MONO}
                      fontSize={binduFontSize}
                      fontWeight={500}
                      letterSpacing="0.08em"
                      opacity={binduEchoOpacity}
                    >
                      {glyph}
                    </text>
                  )}

                  {/* Bindu sigil — the operative center. */}
                  <text
                    x={50}
                    y={50}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={WHITE}
                    fontFamily={MONO}
                    fontSize={binduFontSize}
                    fontWeight={500}
                    letterSpacing="0.08em"
                  >
                    {glyph}
                  </text>

                  {/* Permutation plinth — the chant letters rendered inside
                      the ritual core, below the bindu. Minimal: a tight row
                      of tokens, white, monospace; gathers on inhale and
                      radiates on exhale via fieldOpacity. Present only when
                      a ritual has been invoked. */}
                  {permutation ? (
                    <g
                      opacity={fieldOpacity}
                      data-testid="permutation-plinth"
                    >
                      <line
                        x1={50 - 3 * permutation.length}
                        y1={72}
                        x2={50 + 3 * permutation.length}
                        y2={72}
                        stroke={WHITE}
                        strokeWidth={0.3}
                        vectorEffect="non-scaling-stroke"
                        opacity={0.35}
                      />
                      {Array.from(permutation).map((ch, i) => {
                        const step = 6
                        const offset = (i - (permutation.length - 1) / 2) * step
                        return (
                          <text
                            key={`perm-${i}-${ch}`}
                            x={50 + offset}
                            y={78}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={WHITE}
                            fontFamily={MONO}
                            fontSize={4.2}
                            fontWeight={500}
                            letterSpacing="0.12em"
                            opacity={0.85}
                          >
                            {ch}
                          </text>
                        )
                      })}
                    </g>
                  ) : null}
                </svg>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </section>

      <div aria-hidden="true" style={bottomVeilStyle} />

      <section style={bottomZoneStyle}>
        <div style={stripLabelStyle}>Direction</div>
        <div style={stripStyle}>
          {DIRECTIONS.map((d) => (
            <div
              key={d}
              style={d === direction ? activeCellStyle : inactiveCellStyle}
            >
              {d}
            </div>
          ))}
        </div>

        <div style={stripLabelStyle}>Vowel</div>
        <div style={stripStyle}>
          {VOWELS.map((v) => (
            <div
              key={v}
              style={v === vowel ? activeCellStyle : inactiveCellStyle}
            >
              {v}
            </div>
          ))}
        </div>

        <div style={controlsRowStyle}>
          <button type="button" style={devButtonStyle} onClick={start}>
            Start
          </button>
          <button type="button" style={devButtonStyle} onClick={pause}>
            Pause
          </button>
          <button type="button" style={devButtonStyle} onClick={reset}>
            Reset
          </button>
          <button
            type="button"
            style={running ? devButtonStyle : devButtonDisabledStyle}
            onClick={handleTick}
            disabled={!running}
            title="Running-only: advances runtime by 1000ms via hook tick()"
          >
            Tick +1000ms
          </button>
        </div>

        <div style={telemetryStyle} aria-label="Telemetry">
          <div style={telemetryCellStyle}>
            <span style={telemetryKeyStyle}>cycle</span>
            <span style={telemetryValueStyle}>
              {runtime.metronome.cycleCount}
            </span>
          </div>
          <div style={telemetryCellStyle}>
            <span style={telemetryKeyStyle}>index</span>
            <span style={telemetryValueStyle}>
              {runtime.metronome.activeIndex}
            </span>
          </div>
          <div style={telemetryCellStyle}>
            <span style={telemetryKeyStyle}>elapsed ms</span>
            <span style={telemetryValueStyle}>
              {Math.round(runtime.metronome.phaseElapsedMs)}
            </span>
          </div>
          {permutationTotal && permutationTotal > 0 ? (
            <div style={telemetryCellStyle} data-testid="permutation-telemetry">
              <span style={telemetryKeyStyle}>permutation</span>
              <span style={telemetryValueStyle}>
                {(permutationIndex ?? 0) + 1} / {permutationTotal}
              </span>
            </div>
          ) : null}
          {typeof repetitionCount === 'number' && repetitionCount > 0 ? (
            <div style={telemetryCellStyle}>
              <span style={telemetryKeyStyle}>loop</span>
              <span style={telemetryValueStyle}>
                {(loopsCompleted ?? 0)} / {repetitionCount}
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default SomaticHud

