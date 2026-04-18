import { useRef } from 'react'
import type { CSSProperties } from 'react'
import { useMivta } from '../hooks/useMivta'
import type { Direction, Vowel } from '../engines/metronomeEngine'

const BLACK = '#050505'
const WHITE = '#FFFFFF'
const DIM_OPACITY = 0.4
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
  minHeight: '100vh',
  boxSizing: 'border-box',
  padding: '48px 48px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '48px',
}

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const phaseLabelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '44px',
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
  height: '14px',
  border: `1px solid ${WHITE}`,
  boxSizing: 'border-box',
  backgroundColor: BLACK,
}

const progressFillStyle = (p: number): CSSProperties => ({
  width: `${Math.max(0, Math.min(1, p)) * 100}%`,
  height: '100%',
  backgroundColor: WHITE,
})

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
  gap: '12px',
}

const cellBaseStyle: CSSProperties = {
  border: `1px solid ${WHITE}`,
  padding: '18px 8px',
  textAlign: 'center',
  fontFamily: MONO,
  fontSize: '14px',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  boxSizing: 'border-box',
}

const activeCellStyle: CSSProperties = {
  ...cellBaseStyle,
  backgroundColor: WHITE,
  color: BLACK,
}

const inactiveCellStyle: CSSProperties = {
  ...cellBaseStyle,
  backgroundColor: BLACK,
  color: WHITE,
  opacity: DIM_OPACITY,
}

const devToolsWrapperStyle: CSSProperties = {
  marginTop: 'auto',
  paddingTop: '24px',
  borderTop: `1px solid ${WHITE}`,
  opacity: 0.55,
}

const devToolsHeaderStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  marginBottom: '12px',
  color: WHITE,
}

const devToolsRowStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
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

  const phaseText = runtime.metronome.phase === 'inhale' ? 'INHALE' : 'EXHALE'

  return (
    <div style={hudStyle}>
      <section style={sectionStyle}>
        <div role="heading" aria-level={1} style={phaseLabelStyle}>
          {phaseText}
        </div>
        <div
          style={progressTrackStyle}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${phaseText} progress`}
        >
          <div style={progressFillStyle(progress)} />
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={stripLabelStyle}>Direction</div>
        <div style={stripStyle}>
          {DIRECTIONS.map((d) => (
            <div
              key={d}
              style={
                d === activeStep.direction ? activeCellStyle : inactiveCellStyle
              }
            >
              {d}
            </div>
          ))}
        </div>
        <div style={{ ...stripLabelStyle, marginTop: '8px' }}>Vowel</div>
        <div style={stripStyle}>
          {VOWELS.map((v) => (
            <div
              key={v}
              style={
                v === activeStep.vowel ? activeCellStyle : inactiveCellStyle
              }
            >
              {v}
            </div>
          ))}
        </div>
      </section>

      <footer style={devToolsWrapperStyle}>
        <div style={devToolsHeaderStyle}>Dev Tools</div>
        <div style={devToolsRowStyle}>
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
      </footer>
    </div>
  )
}

export default SomaticHud

