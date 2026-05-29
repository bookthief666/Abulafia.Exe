import { useState } from 'react'
import type { CSSProperties } from 'react'
const BLACK = '#050505'
const WHITE = '#FFFFFF'
const CYAN = '#00FFFF'
const MONO =
  "ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace"

const rootStyle: CSSProperties = {
  backgroundColor: BLACK,
  color: WHITE,
  fontFamily: MONO,
  minHeight: '100dvh',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
}

const frameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'clamp(16px, 3vmin, 32px)',
  padding: 'clamp(24px, 5vmin, 64px)',
  maxWidth: 'clamp(300px, 60vmin, 480px)',
  width: '100%',
  boxSizing: 'border-box',
}

const titleStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(20px, 4vmin, 36px)',
  fontWeight: 500,
  letterSpacing: '0.36em',
  textTransform: 'uppercase',
  color: WHITE,
  margin: 0,
  textAlign: 'center',
}

const subtitleStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.5em',
  textTransform: 'uppercase',
  color: CYAN,
  opacity: 0.6,
  margin: 0,
}

const inputStyle: CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: `1px solid rgba(255,255,255,0.35)`,
  color: WHITE,
  fontFamily: MONO,
  fontSize: 'clamp(28px, 6vmin, 56px)',
  fontWeight: 500,
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  textAlign: 'center',
  padding: 'clamp(8px, 1.5vmin, 16px) 0',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const statsStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '11px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: WHITE,
  opacity: 0.4,
  textAlign: 'center',
}

const warningStyle: CSSProperties = {
  ...statsStyle,
  color: CYAN,
  opacity: 0.7,
}

const beginButtonStyle: CSSProperties = {
  backgroundColor: 'transparent',
  border: `1px solid ${WHITE}`,
  color: WHITE,
  fontFamily: MONO,
  fontSize: '13px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  padding: 'clamp(12px, 2vmin, 18px) clamp(32px, 6vmin, 64px)',
  cursor: 'pointer',
  transition: 'border-color 200ms ease-out, color 200ms ease-out',
}

const beginButtonDisabledStyle: CSSProperties = {
  ...beginButtonStyle,
  opacity: 0.25,
  cursor: 'not-allowed',
}

function factorial(n: number): number {
  let f = 1
  for (let i = 2; i <= n; i++) f *= i
  return f
}

export type RitualGateProps = {
  onBegin: (word: string) => void
}

export function RitualGate({ onBegin }: RitualGateProps) {
  const [word, setWord] = useState('YHVH')

  const trimmed = word.replace(/\s/g, '').toUpperCase()
  const len = trimmed.length
  const permCount = len > 0 ? factorial(len) : 0
  const totalCycles = permCount * len
  const tooLong = len > 7

  const handleSubmit = () => {
    if (len > 0 && !tooLong) {
      onBegin(trimmed)
    }
  }

  return (
    <div style={rootStyle}>
      <div style={frameStyle}>
        <h1 style={titleStyle}>Abulafia.exe</h1>
        <p style={subtitleStyle}>Tzeruf Ha-Otiot</p>

        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          style={inputStyle}
          placeholder="YHVH"
          maxLength={8}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          aria-label="Word to permute"
        />

        {len > 0 && !tooLong && (
          <div style={statsStyle}>
            {len} letters · {permCount} permutations · {totalCycles} breath cycles
          </div>
        )}

        {tooLong && (
          <div style={warningStyle}>
            7 letters max ({factorial(8).toLocaleString()} permutations would be impractical)
          </div>
        )}

        <button
          type="button"
          style={len > 0 && !tooLong ? beginButtonStyle : beginButtonDisabledStyle}
          disabled={len === 0 || tooLong}
          onClick={handleSubmit}
        >
          Begin
        </button>
      </div>
    </div>
  )
}

export default RitualGate
