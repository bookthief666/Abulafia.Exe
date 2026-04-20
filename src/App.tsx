import { useCallback, useState } from 'react'
import type { CSSProperties } from 'react'
import { SomaticHud } from './components/SomaticHud'
import { StudyTemple } from './components/StudyTemple'
import { PracticeBuilder } from './components/PracticeBuilder'
import {
  advancePermutation,
  commitInvocation,
  createInitialSession,
  type RitualSession,
} from './session/ritualSession'

type Mode = 'ritual' | 'study'

const BLACK = '#050505'
const CYAN = '#00FFFF'
const MONO =
  "ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace"

const appStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: BLACK,
  overflow: 'auto',
}

const modeBarStyle: CSSProperties = {
  position: 'fixed',
  top: 'clamp(12px, 2vmin, 24px)',
  right: 'clamp(12px, 2vmin, 24px)',
  display: 'flex',
  gap: '6px',
  padding: '4px',
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  border: '1px solid rgba(255,255,255,0.14)',
  backgroundColor: 'rgba(5,5,5,0.72)',
  backdropFilter: 'blur(4px)',
  zIndex: 10,
}

const modeButtonStyle = (active: boolean): CSSProperties => ({
  background: 'transparent',
  border: '1px solid transparent',
  color: active ? CYAN : 'rgba(255,255,255,0.5)',
  borderBottom: active ? `1px solid ${CYAN}` : '1px solid transparent',
  padding: '6px 14px',
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  cursor: 'pointer',
})

// State-preserving mode shell: both layers stay mounted; only the active
// one is visible. This keeps the RitualSession + useMivta runtime intact
// when the practitioner switches to Study and back.
const layerStyle = (visible: boolean): CSSProperties => ({
  display: visible ? 'block' : 'none',
  width: '100%',
  minHeight: '100dvh',
})

function App() {
  const [mode, setMode] = useState<Mode>('ritual')
  const [session, setSession] = useState<RitualSession>(createInitialSession)

  const handleInvoke = useCallback(
    (root: string, repetitionCount: number) => {
      setSession(commitInvocation(root, repetitionCount))
    },
    [],
  )

  // Functional update — never reads a stale session closure. The child
  // SomaticHud calls this on every exhale->inhale edge.
  const handleBreathCycle = useCallback(() => {
    setSession((prev) => advancePermutation(prev))
  }, [])

  const currentPermutation =
    session.invoked && session.permutations.length > 0
      ? session.permutations[session.permutationIndex]
      : undefined

  return (
    <div style={appStyle}>
      <nav style={modeBarStyle} aria-label="Mode">
        <button
          type="button"
          style={modeButtonStyle(mode === 'ritual')}
          aria-pressed={mode === 'ritual'}
          onClick={() => setMode('ritual')}
        >
          Ritual
        </button>
        <button
          type="button"
          style={modeButtonStyle(mode === 'study')}
          aria-pressed={mode === 'study'}
          onClick={() => setMode('study')}
        >
          Study
        </button>
      </nav>

      <div style={layerStyle(mode === 'ritual')} aria-hidden={mode !== 'ritual'}>
        {session.invoked ? (
          <SomaticHud
            permutation={currentPermutation}
            permutationIndex={session.permutationIndex}
            permutationTotal={session.permutations.length}
            loopsCompleted={session.loopsCompleted}
            repetitionCount={session.repetitionCount}
            onBreathCycle={handleBreathCycle}
          />
        ) : (
          <PracticeBuilder onInvoke={handleInvoke} />
        )}
      </div>

      <div style={layerStyle(mode === 'study')} aria-hidden={mode !== 'study'}>
        <StudyTemple active={mode === 'study'} />
      </div>
    </div>
  )
}

export default App
