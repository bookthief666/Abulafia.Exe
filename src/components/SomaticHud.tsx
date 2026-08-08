import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { usePractice, type UsePracticeOptions } from '../hooks/usePractice'
import { useAudio } from '../hooks/useAudio'
import { pulseField, resetField, setFieldState } from './fieldSignal'
import { RiteCompletion } from './RiteCompletion'
import { renderPermutation } from '../engines/permutationEngine'
import type { BreathPhase, Direction, Vowel } from '../engines/metronomeEngine'
import { ACCENT, FONT_OPERATIVE, LUX } from '../theme/tokens'
import {
  CARDINALS,
  DIRECTION_CUE,
  VOWEL_GLYPH,
  activeRingIndex,
  cardinalAngle,
  cardinalUnit,
  directionStretch,
  directionTranslate,
  octagonPoints,
  polarPoint,
  syllableFor,
  type Cardinal,
} from './chamberGeometry'

const DIRECTIONS: readonly Direction[] = ['up', 'right', 'down', 'left', 'forward']
const VOWELS: readonly Vowel[] = ['holam', 'qamatz', 'hiriq', 'tzere', 'qubuts']

const OUTER_RING_COUNT = 12
const INNER_RING_R = 22
const OUTER_RING_R = 36

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export type SomaticHudProps = {
  inputWord?: string
  onExit?: () => void
  /**
   * Clock and frame-scheduling overrides, forwarded to `usePractice`.
   *
   * The metronome layer is deliberately clock-agnostic — see `useMivta` — and
   * this keeps that seam reachable from the outside, so a test can drive the
   * breath to an exact phase instead of waiting eight seconds for it.
   */
  clock?: Pick<UsePracticeOptions, 'now' | 'scheduleFrame' | 'cancelFrame'>
}

export function SomaticHud({
  inputWord = 'YHVH',
  onExit,
  clock,
}: SomaticHudProps) {
  const practice = usePractice({ initialInput: inputWord, ...clock })
  const {
    running,
    runtime,
    activeStep,
    progress,
    start,
    pause,
    reset,
    currentPermutation,
    currentLetter,
    letterIndex,
    lettersInPermutation,
    permutationIndex,
    totalPermutations,
    isComplete,
  } = practice

  const audio = useAudio()
  const [showDev, setShowDev] = useState(false)

  const phase = runtime.metronome.phase
  const phaseText = isComplete ? 'Complete' : phase === 'inhale' ? 'Inhale' : 'Exhale'
  const p = Math.max(0, Math.min(1, progress))
  const direction = activeStep.direction
  const vowel = activeStep.vowel
  const vowelGlyph = VOWEL_GLYPH[vowel]

  const activeLetter = currentLetter?.char ?? ''
  const permString = renderPermutation(currentPermutation)
  const innerRingCount = currentPermutation.length || 1

  /** The literal thing to chant: letter fused with its vowel. */
  const syllable = syllableFor(activeLetter, vowel)

  const { dx, dy } = directionTranslate(direction)
  const { sx, sy } = directionStretch(direction)
  const forwardScale = direction === 'forward' ? 1.25 : 1

  // ── Phase-flip punctuation ──────────────────────────────────────────────
  // A counter, not a boolean: it keys the shockwave so each flip mounts a
  // fresh element and replays the animation from zero.
  const prevPhaseRef = useRef<BreathPhase>(phase)
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [snap, setSnap] = useState(false)
  const [flipCount, setFlipCount] = useState(0)

  useEffect(() => {
    if (phase !== prevPhaseRef.current) {
      prevPhaseRef.current = phase
      setFlipCount((n) => n + 1)
      if (phase === 'exhale') {
        audio.strikeBell()
        // Let the turn of the breath move the room, not just the ring drawn
        // over it.
        pulseField()
      }
      if (snapTimeoutRef.current != null) clearTimeout(snapTimeoutRef.current)
      setSnap(true)
      snapTimeoutRef.current = setTimeout(() => {
        setSnap(false)
        snapTimeoutRef.current = null
      }, 120)
    }
    return () => {
      if (snapTimeoutRef.current != null) {
        clearTimeout(snapTimeoutRef.current)
        snapTimeoutRef.current = null
      }
    }
  }, [phase, audio])

  // Feed the audio graph. Cheap enough to do every frame; a no-op when muted.
  useEffect(() => {
    audio.setBreath(phase, p, vowel)
  }, [audio, phase, p, vowel])

  // Publish the rite to the atmosphere. The field renders above this component
  // in the tree and reads the signal inside its own animation loop, so nothing
  // here causes a re-render. Leaving the chamber returns the field to rest.
  useEffect(() => {
    setFieldState({
      mode: 'ritual',
      phase,
      progress: p,
      direction,
      permutationIndex,
      isComplete,
    })
  }, [phase, p, direction, permutationIndex, isComplete])

  useEffect(() => resetField, [])

  // The rite ends itself. Leaving the metronome running past the final
  // arrangement would keep the clock advancing behind a chamber that has
  // nothing left to show.
  useEffect(() => {
    if (isComplete && running) pause()
  }, [isComplete, running, pause])

  const handleBeginAgain = () => {
    reset()
    start()
  }

  // ── Ignition ────────────────────────────────────────────────────────────
  const [ignited, setIgnited] = useState(false)
  const [reduced] = useState(prefersReducedMotion)
  useEffect(() => {
    const t = setTimeout(() => setIgnited(true), reduced ? 200 : 2200)
    return () => clearTimeout(t)
  }, [reduced])
  const igniteDuration = reduced ? 0.2 : 1.1
  const igniteStagger = reduced ? 0 : 0.09

  // ── Breath-driven geometry (RAF float; never Framer-interpolated) ───────
  const frameStroke = phase === 'inhale' ? 0.6 + 1.8 * p : 1.2 + 0.9 * p
  const breathScale = phase === 'inhale' ? 1 - 0.07 * p : 0.93 + 0.15 * p

  const glow =
    phase === 'exhale'
      ? `drop-shadow(0 0 ${1 + 3 * p}vmin rgba(0,255,255,${(0.18 + 0.42 * p).toFixed(3)}))`
      : 'drop-shadow(0 0 0 rgba(0,0,0,0))'

  const frameStrokeRendered = frameStroke + (snap ? 0.6 : 0)
  const ringOpacityRendered = snap ? 1 : 0.6

  const cycleT = phase === 'inhale' ? 0.5 * p : 0.5 + 0.5 * p
  const ringAngleA = 360 * cycleT
  const ringAngleB = -360 * cycleT

  const orbitOuterR = phase === 'inhale' ? 38 - 4 * p : 34 + 4 * p
  const orbitInnerR = phase === 'inhale' ? 26 - 3 * p : 23 + 3 * p

  const dashA =
    phase === 'inhale'
      ? `${(6 - 4 * p).toFixed(2)} ${(3 - 1.5 * p).toFixed(2)}`
      : `${(2 + 4 * p).toFixed(2)} ${(1.5 + 1.5 * p).toFixed(2)}`
  const dashB =
    phase === 'inhale'
      ? `${(3 - 2 * p).toFixed(2)} ${(2 - 1 * p).toFixed(2)}`
      : `${(1 + 2 * p).toFixed(2)} ${(1 + 1 * p).toFixed(2)}`

  const octR = phase === 'inhale' ? 45 - 3 * p : 42 + 3 * p

  const markerIntensity =
    direction === 'forward' ? 0 : phase === 'exhale' ? 0.5 + 0.5 * p : 0.55

  const binduAuraOpacity = direction === 'forward' ? 0.6 + 0.4 * p : 0.25
  const binduFontSize = direction === 'forward' ? 32 : 28

  /** Field gathers and dims on the inhale, radiates on the exhale. */
  const fieldOpacity = phase === 'inhale' ? 0.35 + 0.25 * p : 0.55 + 0.4 * p

  const activeAngle = cardinalAngle(direction)
  const outerActiveIdx = activeRingIndex(OUTER_RING_COUNT, activeAngle)

  // ── Exhale echoes — the chant made visible ──────────────────────────────
  // Concentric ghosts of the operative letter, expanding as it is sounded.
  const echoes =
    phase === 'exhale' && activeLetter && !isComplete
      ? [0, 1, 2].map((i) => {
          const stagger = i * 0.22
          const local = Math.max(0, Math.min(1, (p - stagger) / (1 - stagger || 1)))
          return { scale: 1 + local * 0.9, opacity: (1 - local) * 0.3 }
        })
      : []

  // ── Directional thrust ──────────────────────────────────────────────────
  // On the exhale the core throws a lance along the active cardinal; 'forward'
  // converges inward instead, so the Z axis reads as implosion.
  const thrust = phase === 'exhale' ? p : 0
  const lance =
    direction !== 'forward' && thrust > 0
      ? (() => {
          const { ux, uy } = cardinalUnit(direction as Cardinal)
          const inner = 12
          const reach = inner + 34 * thrust
          return {
            x1: 50 + ux * inner,
            y1: 50 + uy * inner,
            x2: 50 + ux * reach,
            y2: 50 + uy * reach,
            opacity: (1 - thrust) * 0.85,
            width: 0.6 + 1.6 * (1 - thrust),
          }
        })()
      : null

  const controlLabel = running ? 'Pause' : 'Begin'

  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden"
      style={{
        padding: 'clamp(12px, 2vmin, 28px)',
        // Clear the fixed mode-nav so the phase label never collides with it
        // on narrow viewports.
        paddingTop: 'calc(var(--safe-top) + 2.75rem)',
        gap: 'clamp(10px, 1.8vmin, 22px)',
      }}
    >
      {/* ── Top: phase and progress ─────────────────────────────────────── */}
      <section className="relative z-3 flex flex-col gap-3">
        <div
          role="heading"
          aria-level={1}
          className="font-label latin-caps lux m-0 text-center"
          style={{
            fontSize: 'clamp(1.1rem, 3.4vmin, 2rem)',
            letterSpacing: '0.5em',
            textIndent: '0.5em',
            opacity: phase === 'exhale' ? 0.55 + 0.45 * p : 0.4,
          }}
        >
          {phaseText}
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(p * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${phaseText} progress`}
          className="relative h-px w-full"
          style={{ background: 'rgba(210,225,240,0.14)' }}
        >
          <div
            className="h-px"
            style={{
              width: `${p * 100}%`,
              background: `linear-gradient(90deg, rgba(0,255,255,0.25), ${ACCENT})`,
              boxShadow: phase === 'exhale' ? `0 0 8px rgba(0,255,255,${0.3 + 0.4 * p})` : 'none',
            }}
          />
        </div>
      </section>

      {/* ── Centre: the ritual core ─────────────────────────────────────── */}
      <section className="relative z-1 flex min-h-0 flex-1 items-center justify-center isolate">
        {/* Phase-flip shockwave. Keyed so each flip replays from zero. */}
        {!reduced && flipCount > 0 && (
          <div
            key={flipCount}
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full"
            style={{
              left: '50%',
              top: '50%',
              width: '46vmin',
              height: '46vmin',
              border: `1px solid ${ACCENT}`,
              animation: 'shockwaveExpand 1.2s ease-out forwards',
              zIndex: 0,
            }}
          />
        )}

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '92vmin',
            height: '92vmin',
            background:
              'radial-gradient(closest-side, rgba(0,255,255,0.16), rgba(0,255,255,0.04) 55%, rgba(0,255,255,0) 72%)',
            filter: 'blur(2vmin)',
            mixBlendMode: 'screen',
            zIndex: 0,
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-1 flex items-center justify-center">
          <div
            style={{
              transform: `translate(${dx}, ${dy}) scale(${sx}, ${sy})`,
              transition: 'transform 200ms ease-out',
              willChange: 'transform',
            }}
          >
            <div
              style={{
                transform: `scale(${forwardScale})`,
                transformOrigin: '50% 50%',
                transition: 'transform 200ms ease-out',
              }}
            >
              <div style={{ transform: `scale(${breathScale})`, transformOrigin: '50% 50%' }}>
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label={`Ritual core: letter ${activeLetter}, vowel ${vowel}, direction ${direction}, phase ${phase}`}
                  className="block"
                  style={{
                    // vmin alone pins the core to the narrow edge, which
                    // strands it in dead space on tall phones. Bounding by
                    // width and height separately fills either proportion.
                    width: 'min(86vw, 62vh)',
                    height: 'min(86vw, 62vh)',
                    filter: glow,
                  }}
                >
                  {/* Ambient pulse behind the bindu — breath-independent. */}
                  <motion.circle
                    cx={50}
                    cy={50}
                    fill={ACCENT}
                    initial={{ r: 14, opacity: 0.06 }}
                    animate={{ opacity: [0.04, 0.11, 0.04], r: [13, 16, 13] }}
                    transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* Segmented outer ring. */}
                  <motion.polygon
                    points={octagonPoints(octR + 3)}
                    fill="none"
                    stroke={LUX}
                    strokeWidth={0.4}
                    strokeDasharray="0.5 3"
                    vectorEffect="non-scaling-stroke"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.32 }}
                    transition={{ duration: igniteDuration, delay: igniteStagger * 3 }}
                  />

                  {/* Ignition stroke — a fixed-radius ghost that draws itself
                      once. It must be a separate element from the live frame:
                      `pathLength` is implemented with stroke-dash offsets, and
                      those go stale against a `points` value that the breath
                      rewrites every frame, shattering the octagon into arcs. */}
                  {!ignited && (
                    <motion.polygon
                      points={octagonPoints(45)}
                      fill="none"
                      stroke={LUX}
                      strokeWidth={1.2}
                      vectorEffect="non-scaling-stroke"
                      initial={{ pathLength: 0, opacity: 0.9 }}
                      animate={{ pathLength: 1, opacity: 0.9 }}
                      transition={{ duration: reduced ? 0.2 : 1.5, ease: 'easeOut' }}
                    />
                  )}

                  {/* Containment frame — breath-driven, never path-animated. */}
                  <polygon
                    points={octagonPoints(octR)}
                    fill="none"
                    stroke={LUX}
                    strokeWidth={frameStrokeRendered}
                    vectorEffect="non-scaling-stroke"
                    opacity={ignited ? 1 : 0}
                    style={{ transition: 'opacity 700ms ease-out' }}
                  />

                  {/* Cardinal markers — the active one burns cyan. */}
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: igniteDuration, delay: igniteStagger * 4 }}
                  >
                    {CARDINALS.map((c) => {
                      const { ux, uy } = cardinalUnit(c)
                      const x1 = 50 + ux * octR
                      const y1 = 50 + uy * octR
                      const x2 = 50 + ux * (octR + 4)
                      const y2 = 50 + uy * (octR + 4)
                      const active = c === direction
                      const color = active ? ACCENT : LUX
                      return (
                        <g key={c} opacity={active ? markerIntensity : 0.35}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={color}
                            strokeWidth={0.8}
                            vectorEffect="non-scaling-stroke"
                          />
                          <rect
                            x={x2 - 0.9}
                            y={y2 - 0.9}
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
                  </motion.g>

                  {/* Directional lance — thrust along the active cardinal. */}
                  {lance && (
                    <line
                      x1={lance.x1}
                      y1={lance.y1}
                      x2={lance.x2}
                      y2={lance.y2}
                      stroke={ACCENT}
                      strokeWidth={lance.width}
                      strokeLinecap="round"
                      opacity={lance.opacity}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {/* Outer orbital trace. */}
                  <g transform={`rotate(${ringAngleA} 50 50)`}>
                    <circle
                      cx={50}
                      cy={50}
                      r={orbitOuterR}
                      fill="none"
                      stroke={LUX}
                      strokeWidth={0.5}
                      strokeDasharray={dashA}
                      vectorEffect="non-scaling-stroke"
                      opacity={ringOpacityRendered}
                    />
                  </g>

                  {/* Outer letter ring — permutation letters at 12 stations. */}
                  <motion.g
                    key={`outer-${permutationIndex}`}
                    transform={`rotate(${ringAngleA} 50 50)`}
                    initial={{ opacity: 0, scale: 1.25 }}
                    animate={{ opacity: fieldOpacity, scale: 1 }}
                    style={{ transformOrigin: '50px 50px' }}
                    transition={{ duration: igniteDuration, delay: igniteStagger * 5 }}
                  >
                    {Array.from({ length: OUTER_RING_COUNT }).map((_, i) => {
                      const a = -Math.PI / 2 + (i * 2 * Math.PI) / OUTER_RING_COUNT
                      const pt = polarPoint(50, 50, OUTER_RING_R, a)
                      const letter =
                        currentPermutation.length > 0
                          ? currentPermutation[i % currentPermutation.length].char
                          : ''
                      const isActive = i === outerActiveIdx
                      return (
                        <text
                          key={`outer-${i}`}
                          x={pt.x}
                          y={pt.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isActive ? ACCENT : LUX}
                          fontFamily={FONT_OPERATIVE}
                          fontSize={3.6}
                          letterSpacing="0.08em"
                          opacity={isActive ? 1 : 0.5}
                        >
                          {letter}
                        </text>
                      )
                    })}
                  </motion.g>

                  {/* Inner orbital trace. */}
                  <g transform={`rotate(${ringAngleB} 50 50)`}>
                    <circle
                      cx={50}
                      cy={50}
                      r={orbitInnerR}
                      fill="none"
                      stroke={LUX}
                      strokeWidth={0.7}
                      strokeDasharray={dashB}
                      vectorEffect="non-scaling-stroke"
                      opacity={0.5 + (snap ? 0.5 : 0)}
                    />
                  </g>

                  {/* Inner letter ring — this permutation, active letter lit. */}
                  <motion.g
                    key={`inner-${permutationIndex}`}
                    transform={`rotate(${ringAngleB} 50 50)`}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: fieldOpacity, scale: 1 }}
                    style={{ transformOrigin: '50px 50px' }}
                    transition={{ duration: igniteDuration, delay: igniteStagger * 6 }}
                  >
                    {currentPermutation.map((token, i) => {
                      const a = -Math.PI / 2 + (i * 2 * Math.PI) / innerRingCount
                      const pt = polarPoint(50, 50, INNER_RING_R, a)
                      const isActive = i === letterIndex && !isComplete
                      return (
                        <text
                          key={`inner-${i}-${token.sourceIndex}`}
                          x={pt.x}
                          y={pt.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isActive ? ACCENT : LUX}
                          fontFamily={FONT_OPERATIVE}
                          fontSize={5}
                          letterSpacing="0.08em"
                          opacity={isActive ? 1 : 0.42}
                        >
                          {token.char}
                        </text>
                      )
                    })}
                  </motion.g>

                  {/* Bindu aura. */}
                  <circle
                    cx={50}
                    cy={50}
                    r={9}
                    fill="none"
                    stroke={LUX}
                    strokeWidth={0.3}
                    vectorEffect="non-scaling-stroke"
                    opacity={binduAuraOpacity}
                  />

                  {/* Exhale echoes — the chant expanding outward. */}
                  {echoes.map((echo, i) => (
                    <text
                      key={`echo-${i}`}
                      x={50}
                      y={48}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={ACCENT}
                      fontFamily={FONT_OPERATIVE}
                      fontSize={binduFontSize}
                      letterSpacing="0.08em"
                      opacity={echo.opacity}
                      style={{ transformOrigin: '50px 48px', transform: `scale(${echo.scale})` }}
                    >
                      {activeLetter}
                    </text>
                  ))}

                  {/* The operative letter. */}
                  <motion.text
                    x={50}
                    y={48}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={LUX}
                    fontFamily={FONT_OPERATIVE}
                    fontSize={binduFontSize}
                    letterSpacing="0.08em"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: igniteDuration, delay: igniteStagger * 7 }}
                  >
                    {isComplete ? '✦' : activeLetter}
                  </motion.text>

                  {/* Vowel mark beneath the letter. */}
                  {!isComplete && activeLetter && (
                    <text
                      x={50}
                      y={58}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={ACCENT}
                      fontFamily={FONT_OPERATIVE}
                      fontSize={7}
                      letterSpacing="0.12em"
                      opacity={ignited ? 0.72 : 0}
                      style={{ transition: 'opacity 600ms ease-out' }}
                    >
                      {vowelGlyph}
                    </text>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Veil so the HUD dissolves into the chamber rather than sitting on it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-2"
        style={{
          height: '30vh',
          background:
            'linear-gradient(to bottom, rgba(5,5,5,0) 0%, rgba(5,5,5,0.55) 55%, rgba(5,5,5,0.88) 100%)',
        }}
      />

      {/* ── Bottom: instruction and controls ────────────────────────────── */}
      <section className="relative z-3 flex flex-col items-center gap-3">
        {/* The imperative. This is what a newcomer reads and obeys. */}
        {!isComplete && syllable && (
          <p
            className="font-label latin-caps m-0 text-center"
            style={{
              fontSize: 'clamp(0.72rem, 2vmin, 0.95rem)',
              letterSpacing: '0.26em',
              color: phase === 'exhale' ? ACCENT : 'rgba(242,244,250,0.55)',
              textShadow:
                phase === 'exhale'
                  ? `0 0 18px rgba(0,255,255,${(0.3 + 0.4 * p).toFixed(2)})`
                  : 'none',
              transition: 'color 300ms ease-out',
            }}
          >
            {phase === 'inhale' ? (
              <>Gather · then intone &ldquo;{syllable}&rdquo;</>
            ) : (
              <>
                Intone &ldquo;{syllable}&rdquo; · {DIRECTION_CUE[direction]}
              </>
            )}
          </p>
        )}

        <hr className="star-rule w-full max-w-[42rem] opacity-40" />

        {/* Position within the rite. */}
        <div
          className="font-numeric lux-dim flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[0.6rem]"
          style={{ letterSpacing: '0.22em' }}
          role="group"
          aria-label="Position"
        >
          <span
            aria-label={`Permutation ${permutationIndex + 1} of ${totalPermutations}`}
          >
            <span aria-hidden="true" className="opacity-50">
              perm{' '}
            </span>
            {permutationIndex + 1}/{totalPermutations}
          </span>
          <span
            aria-label={
              isComplete
                ? 'All letters worked'
                : `Letter ${letterIndex + 1} of ${lettersInPermutation}`
            }
          >
            <span aria-hidden="true" className="opacity-50">
              letter{' '}
            </span>
            {isComplete ? '—' : `${letterIndex + 1}/${lettersInPermutation}`}
          </span>
          <span className="font-operative" style={{ letterSpacing: '0.3em' }}>
            {permString}
          </span>
        </div>

        {/* Direction and vowel strips — faint ritual marks, not a dashboard. */}
        <div className="flex w-full max-w-[42rem] flex-col gap-1">
          <div className="grid grid-cols-5 gap-2">
            {DIRECTIONS.map((d) => (
              <span
                key={d}
                className="font-label latin-caps text-center text-[0.55rem]"
                style={{
                  letterSpacing: '0.18em',
                  color: d === direction ? ACCENT : 'rgba(242,244,250,0.9)',
                  opacity: d === direction ? 1 : 0.22,
                  transition: 'opacity 200ms ease-out, color 200ms ease-out',
                }}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {VOWELS.map((v) => (
              <span
                key={v}
                className="font-label latin-caps text-center text-[0.55rem]"
                style={{
                  letterSpacing: '0.18em',
                  color: v === vowel ? ACCENT : 'rgba(242,244,250,0.9)',
                  opacity: v === vowel ? 1 : 0.22,
                  transition: 'opacity 200ms ease-out, color 200ms ease-out',
                }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Primary controls. */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          <button
            type="button"
            className="ritual-action lux-accent"
            onClick={running ? pause : start}
          >
            {controlLabel}
          </button>
          {onExit && (
            <button type="button" className="ritual-action" onClick={onExit}>
              Exit
            </button>
          )}
          <button
            type="button"
            className="ritual-action"
            onClick={audio.toggle}
            aria-pressed={audio.enabled}
            disabled={audio.unavailable}
            title={audio.unavailable ? 'Audio unavailable on this device' : undefined}
          >
            {audio.enabled ? 'Sound On' : 'Sound Off'}
          </button>
          <button
            type="button"
            className="ritual-action text-[0.55rem]"
            onClick={() => setShowDev((v) => !v)}
            aria-expanded={showDev}
          >
            {showDev ? '− Dev' : '+ Dev'}
          </button>
        </div>

        {/* Dev layer — subordinate and collapsed by default. */}
        {showDev && (
          <div
            className="flex flex-wrap items-center justify-center gap-1"
            style={{ animation: 'fadeIn 300ms ease-out' }}
          >
            <button type="button" className="ritual-action text-[0.55rem]" onClick={reset}>
              Reset
            </button>
            <span
              className="font-numeric lux-dim text-[0.55rem]"
              style={{ letterSpacing: '0.2em' }}
            >
              cycle {runtime.metronome.cycleCount} · {Math.round(runtime.metronome.phaseElapsedMs)}ms
            </span>
          </div>
        )}
      </section>

      {isComplete && (
        <RiteCompletion
          inputWord={inputWord}
          totalPermutations={totalPermutations}
          lettersPerPermutation={lettersInPermutation}
          finalPermutation={currentPermutation}
          onBeginAgain={handleBeginAgain}
          onExit={onExit}
        />
      )}
    </div>
  )
}

export default SomaticHud
