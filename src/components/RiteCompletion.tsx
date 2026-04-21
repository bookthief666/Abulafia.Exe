import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { CompletionSnapshot } from '../session/ritualSession'

const BLACK = '#050505'
const WHITE = '#FFFFFF'
const CYAN = '#00FFFF'
const MONO =
  "ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace"

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(20px, 4vmin, 48px)',
  // 85% backdrop so the frozen chamber stays faintly visible behind.
  backgroundColor: 'rgba(5,5,5,0.85)',
  backdropFilter: 'blur(2px)',
  zIndex: 5,
  boxSizing: 'border-box',
  overflow: 'auto',
  animation: 'riteCompletionFadeIn 320ms ease-out',
}

const frameStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: 'clamp(320px, 64vmin, 680px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(18px, 2.6vmin, 30px)',
  border: `1px solid rgba(255,255,255,0.18)`,
  padding: 'clamp(28px, 4.4vmin, 56px)',
  boxSizing: 'border-box',
  backgroundColor: BLACK,
}

const cornerMarkStyle: CSSProperties = {
  position: 'absolute',
  width: '10px',
  height: '10px',
  borderColor: CYAN,
  opacity: 0.6,
}

const eyebrowStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.5em',
  textTransform: 'uppercase',
  color: CYAN,
  opacity: 0.75,
  margin: 0,
}

const titleStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(22px, 4.4vmin, 40px)',
  fontWeight: 500,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: WHITE,
  margin: 0,
}

const dividerStyle: CSSProperties = {
  width: '100%',
  height: '1px',
  background: `linear-gradient(to right, ${CYAN}, rgba(0,255,255,0) 70%)`,
  opacity: 0.55,
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, auto) minmax(0, 1fr)',
  columnGap: 'clamp(16px, 3vmin, 32px)',
  rowGap: '14px',
}

const labelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
  alignSelf: 'center',
}

const valueStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(14px, 2.4vmin, 20px)',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: WHITE,
  wordBreak: 'break-all',
}

const actionsRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  marginTop: '8px',
}

const buttonStyle: CSSProperties = {
  flex: '1 1 160px',
  background: 'transparent',
  color: WHITE,
  border: `1px solid ${CYAN}`,
  padding: '14px 20px',
  fontFamily: MONO,
  fontSize: '11px',
  letterSpacing: '0.44em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  border: `1px solid rgba(255,255,255,0.35)`,
  color: 'rgba(255,255,255,0.82)',
}

export type RiteCompletionProps = {
  snapshot: CompletionSnapshot
  onReinvoke: () => void
  onRepeat: () => void
  onStay: () => void
}

export function RiteCompletion({
  snapshot,
  onReinvoke,
  onRepeat,
  onStay,
}: RiteCompletionProps) {
  const firstButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    firstButtonRef.current?.focus()
  }, [])

  return (
    <>
      <style>{`
        @keyframes riteCompletionFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rite-completion-title"
        style={overlayStyle}
        data-testid="rite-completion"
      >
        <div style={frameStyle}>
          <div
            aria-hidden="true"
            style={{
              ...cornerMarkStyle,
              top: -1,
              left: -1,
              borderTop: `1px solid ${CYAN}`,
              borderLeft: `1px solid ${CYAN}`,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              ...cornerMarkStyle,
              top: -1,
              right: -1,
              borderTop: `1px solid ${CYAN}`,
              borderRight: `1px solid ${CYAN}`,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              ...cornerMarkStyle,
              bottom: -1,
              left: -1,
              borderBottom: `1px solid ${CYAN}`,
              borderLeft: `1px solid ${CYAN}`,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              ...cornerMarkStyle,
              bottom: -1,
              right: -1,
              borderBottom: `1px solid ${CYAN}`,
              borderRight: `1px solid ${CYAN}`,
            }}
          />

          <p style={eyebrowStyle}>§ Completion</p>
          <h2 id="rite-completion-title" style={titleStyle}>
            Rite Sealed
          </h2>
          <div style={dividerStyle} />

          <div style={gridStyle}>
            <span style={labelStyle}>Root</span>
            <span style={valueStyle} data-testid="rite-completion-root">
              {snapshot.root}
            </span>

            <span style={labelStyle}>Permutations</span>
            <span
              style={valueStyle}
              data-testid="rite-completion-total"
            >
              {snapshot.totalPermutations}
            </span>

            <span style={labelStyle}>Repetitions</span>
            <span
              style={valueStyle}
              data-testid="rite-completion-reps"
            >
              {snapshot.repetitionCount}
            </span>

            <span style={labelStyle}>Final Permutation</span>
            <span
              style={valueStyle}
              data-testid="rite-completion-final"
            >
              {snapshot.finalPermutation}
            </span>
          </div>

          <div style={dividerStyle} />

          <div style={actionsRowStyle}>
            <button
              ref={firstButtonRef}
              type="button"
              style={buttonStyle}
              onClick={onRepeat}
            >
              Repeat Session
            </button>
            <button
              type="button"
              style={buttonStyle}
              onClick={onReinvoke}
            >
              Reinvoke
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={onStay}
            >
              Stay in Chamber
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default RiteCompletion
