import { useRef } from 'react'
import type { CSSProperties } from 'react'
import { useMivta } from '../hooks/useMivta'
import type { Direction, Vowel } from '../engines/metronomeEngine'

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
}

const topZoneStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(8px, 1.2vmin, 14px)',
  flex: '0 0 auto',
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
}

const directionWrapperStyle = (dx: string, dy: string): CSSProperties => ({
  transform: `translate(${dx}, ${dy})`,
  transition: 'transform 200ms ease-out',
  willChange: 'transform',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const forwardScalerStyle = (scale: number): CSSProperties => ({
  transform: `scale(${scale})`,
  transformOrigin: '50% 50%',
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
}

const stripLabelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  opacity: 0.5,
  textTransform: 'uppercase',
  color: WHITE,
}

const stripStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '8px',
}

const cellBaseStyle: CSSProperties = {
  border: `1px solid ${WHITE}`,
  padding: '10px 6px',
  textAlign: 'center',
  fontFamily: MONO,
  fontSize: '12px',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  boxSizing: 'border-box',
}

const activeCellStyle: CSSProperties = {
  ...cellBaseStyle,
  backgroundColor: CYAN,
  borderColor: CYAN,
  color: BLACK,
}

const inactiveCellStyle: CSSProperties = {
  ...cellBaseStyle,
  backgroundColor: BLACK,
  color: WHITE,
  opacity: DIM_OPACITY,
}

const controlsRowStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'center',
}

const devButtonStyle: CSSProperties = {
  backgroundColor: BLACK,
  color: WHITE,
  border: `1px solid ${WHITE}`,
  padding: '8px 14px',
  fontFamily: MONO,
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const devButtonDisabledStyle: CSSProperties = {
  ...devButtonStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
}

const telemetryStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',
  borderTop: '1px solid rgba(255,255,255,0.22)',
  paddingTop: '8px',
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  opacity: 0.75,
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

export function SomaticHud() {
  const { running, runtime, activeStep, progress, start, pause, reset, tick } =
    useMivta()
  const tickCounterRef = useRef<number | null>(null)

  const handleTick = () => {
    const baseline = runtime.lastNowMs ?? 0
    const current = tickCounterRef.current ?? baseline
    tickCounterRef.current = Math.max(current, baseline) + 1000
    tick(tickCounterRef.current)
  }

  const phase = runtime.metronome.phase
  const phaseText = phase === 'inhale' ? 'INHALE' : 'EXHALE'
  const p = Math.max(0, Math.min(1, progress))
  const direction = activeStep.direction
  const vowel = activeStep.vowel

  const { dx, dy } = directionTranslate(direction)
  const forwardScale = direction === 'forward' ? 1.25 : 1

  // Breath-responsive frame geometry (SVG viewBox 0 0 100 100).
  // Inhale: frame contracts toward the center; stroke thickens (gathering force).
  // Exhale: frame releases outward; stroke relaxes (releasing force).
  let frameInset: number
  let frameStroke: number
  if (phase === 'inhale') {
    frameInset = 5 + 15 * p
    frameStroke = 0.6 + 1.8 * p
  } else {
    frameInset = 20 - 15 * p
    frameStroke = 2.4 - 1.6 * p
  }
  const frameSize = 100 - 2 * frameInset

  // Inner ring — counter-pulse, keeps the Bindu legible.
  const ringR = phase === 'inhale' ? 34 - 8 * p : 26 + 8 * p
  const ringStroke = phase === 'inhale' ? 0.4 + 0.8 * p : 1.2 - 0.6 * p

  // Cyan glow intensifies only on exhale (release).
  const glow =
    phase === 'exhale'
      ? `drop-shadow(0 0 ${1 + 3 * p}vmin rgba(0,255,255,${(
          0.18 +
          0.42 * p
        ).toFixed(3)}))`
      : 'drop-shadow(0 0 0 rgba(0,0,0,0))'

  return (
    <div style={hudStyle}>
      <section style={topZoneStyle}>
        <div role="heading" aria-level={1} style={phaseLabelStyle}>
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
        <div style={directionWrapperStyle(dx, dy)}>
          <div style={forwardScalerStyle(forwardScale)}>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`Ritual core: vowel ${vowel}, direction ${direction}, phase ${phase}`}
              style={{ ...coreStyle, filter: glow }}
            >
              <rect
                x={frameInset}
                y={frameInset}
                width={frameSize}
                height={frameSize}
                fill="none"
                stroke={WHITE}
                strokeWidth={frameStroke}
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={50}
                cy={50}
                r={ringR}
                fill="none"
                stroke={WHITE}
                strokeWidth={ringStroke}
                vectorEffect="non-scaling-stroke"
                opacity={0.6}
              />
              <text
                x={50}
                y={50}
                textAnchor="middle"
                dominantBaseline="central"
                fill={WHITE}
                fontFamily={MONO}
                fontSize={11}
                fontWeight={500}
              >
                {vowel.toUpperCase()}
              </text>
            </svg>
          </div>
        </div>
      </section>

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
        </div>
      </section>
    </div>
  )
}

export default SomaticHud
	
	
	

