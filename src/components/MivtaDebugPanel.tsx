import { useRef } from 'react'
import type { CSSProperties } from 'react'
import { useMivta } from '../hooks/useMivta'

const containerStyle: CSSProperties = {
  backgroundColor: '#050505',
  color: '#FFFFFF',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '14px',
  lineHeight: '1.4',
  padding: '24px',
  minHeight: '100vh',
  boxSizing: 'border-box',
  textAlign: 'left',
}

const headingStyle: CSSProperties = {
  color: '#FFFFFF',
  fontFamily: 'inherit',
  fontSize: '16px',
  fontWeight: 500,
  letterSpacing: '0.1em',
  margin: '0 0 16px 0',
  textTransform: 'uppercase',
}

const sectionStyle: CSSProperties = {
  border: '1px solid #FFFFFF',
  padding: '16px',
  marginBottom: '16px',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '4px 0',
  borderBottom: '1px solid #222222',
}

const labelStyle: CSSProperties = {
  color: '#FFFFFF',
  opacity: 0.7,
}

const valueStyle: CSSProperties = {
  color: '#FFFFFF',
}

const controlsStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
}

const buttonStyle: CSSProperties = {
  backgroundColor: '#050505',
  color: '#FFFFFF',
  border: '1px solid #FFFFFF',
  padding: '8px 16px',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  cursor: 'pointer',
}

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  )
}

export function MivtaDebugPanel() {
  const { running, runtime, activeStep, progress, start, pause, reset, tick } =
    useMivta()
  const tickCounterRef = useRef<number | null>(null)

  const handleTick = () => {
    const baseline = runtime.lastNowMs ?? 0
    const current = tickCounterRef.current ?? baseline
    tickCounterRef.current = Math.max(current, baseline) + 1000
    tick(tickCounterRef.current)
  }

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Mivta Debug Surface</h1>
      <div style={sectionStyle}>
        <Row label="running" value={String(running)} />
        <Row label="runtime.phase" value={runtime.metronome.phase} />
        <Row
          label="runtime.phaseElapsedMs"
          value={runtime.metronome.phaseElapsedMs.toFixed(2)}
        />
        <Row
          label="runtime.activeIndex"
          value={String(runtime.metronome.activeIndex)}
        />
        <Row
          label="runtime.cycleCount"
          value={String(runtime.metronome.cycleCount)}
        />
        <Row label="activeStep.vowel" value={activeStep.vowel} />
        <Row label="activeStep.direction" value={activeStep.direction} />
        <Row label="progress" value={progress.toFixed(4)} />
      </div>
      <div style={controlsStyle}>
        <button type="button" style={buttonStyle} onClick={start}>
          Start
        </button>
        <button type="button" style={buttonStyle} onClick={pause}>
          Pause
        </button>
        <button type="button" style={buttonStyle} onClick={reset}>
          Reset
        </button>
        <button
          type="button"
          style={running ? buttonStyle : disabledButtonStyle}
          onClick={handleTick}
          disabled={!running}
          title="Running-only: advances runtime by 1000ms via hook tick()"
        >
          Tick +1000ms (running only)
        </button>
      </div>
    </div>
  )
}

export default MivtaDebugPanel

