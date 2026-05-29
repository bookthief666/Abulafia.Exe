import { useState } from 'react'
import type { CSSProperties } from 'react'
import { SomaticHud } from './components/SomaticHud'
import { RitualGate } from './components/RitualGate'
import { StudyTemple } from './components/StudyTemple'

type AppMode = 'gate' | 'ritual' | 'study'

const MONO =
  "ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace"

const appStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#050505',
  overflow: 'auto',
}

const navStyle: CSSProperties = {
  position: 'fixed',
  top: 'clamp(8px, 1.5vmin, 16px)',
  right: 'clamp(8px, 1.5vmin, 16px)',
  zIndex: 100,
  display: 'flex',
  gap: '12px',
  fontFamily: MONO,
  fontSize: '9px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
}

const navButtonStyle: CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  color: 'rgba(255,255,255,0.35)',
  fontFamily: MONO,
  fontSize: '9px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: '6px 8px',
}

function App() {
  const [mode, setMode] = useState<AppMode>('gate')
  const [inputWord, setInputWord] = useState('YHVH')

  const handleBegin = (word: string) => {
    setInputWord(word)
    setMode('ritual')
  }

  const handleExit = () => {
    setMode('gate')
  }

  return (
    <div style={appStyle}>
      {mode !== 'gate' && (
        <nav style={navStyle}>
          {mode === 'study' && (
            <button
              type="button"
              style={navButtonStyle}
              onClick={() => setMode('gate')}
            >
              Gate
            </button>
          )}
          {mode === 'ritual' && (
            <button
              type="button"
              style={navButtonStyle}
              onClick={() => setMode('study')}
            >
              Study
            </button>
          )}
          {mode === 'study' && (
            <button
              type="button"
              style={navButtonStyle}
              onClick={() => setMode('ritual')}
            >
              Ritual
            </button>
          )}
        </nav>
      )}

      {mode === 'gate' && (
        <RitualGate onBegin={handleBegin} onStudy={() => setMode('study')} />
      )}
      {mode === 'ritual' && (
        <SomaticHud key={inputWord} inputWord={inputWord} onExit={handleExit} />
      )}
      {mode === 'study' && <StudyTemple active={true} />}
    </div>
  )
}

export default App
