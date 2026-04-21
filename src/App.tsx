import { useCallback, useState } from 'react'
import type { CSSProperties } from 'react'
import { SomaticHud } from './components/SomaticHud'
import { StudyTemple } from './components/StudyTemple'
import { PracticeBuilder } from './components/PracticeBuilder'
import { RiteCompletion } from './components/RiteCompletion'
import {
  advancePermutation,
  commitInvocation,
  createCompletionSnapshot,
  createInitialSession,
  isSessionComplete,
  restartSession,
  type RitualSession,
} from './session/ritualSession'

type Mode = 'ritual' | 'study'

type LastInvocation = {
  root: string
  repetitionCount: number
}

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

// State-preserving mode shell: both layers stay mounted and crossfade on
// switch. No display:none / visibility:hidden — the inactive layer is
// opacity 0 + pointer-events none so the RitualSession, PracticeBuilder
// form fields, and useMivta runtime all survive a mode change intact.
const layerStyle = (active: boolean): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  width: '100%',
  minHeight: '100dvh',
  opacity: active ? 1 : 0,
  pointerEvents: active ? 'auto' : 'none',
  zIndex: active ? 1 : 0,
  transition: 'opacity 320ms ease-out',
  overflow: 'auto',
}) satisfies CSSProperties

function App() {
  const [mode, setMode] = useState<Mode>('ritual')
  const [session, setSession] = useState<RitualSession>(createInitialSession)
  const [lastInvocation, setLastInvocation] = useState<LastInvocation | null>(
    null,
  )
  const [completionDismissed, setCompletionDismissed] = useState(false)

  const handleInvoke = useCallback(
    (root: string, repetitionCount: number) => {
      setSession(commitInvocation(root, repetitionCount))
      setLastInvocation({ root, repetitionCount })
      setCompletionDismissed(false)
    },
    [],
  )

  // Functional update — never reads a stale session closure. The child
  // SomaticHud calls this on every exhale->inhale edge.
  const handleBreathCycle = useCallback(() => {
    setSession((prev) => advancePermutation(prev))
  }, [])

  const handleRepeat = useCallback(() => {
    setSession((prev) => restartSession(prev))
    setCompletionDismissed(false)
  }, [])

  const handleReinvoke = useCallback(() => {
    setSession(createInitialSession())
    setCompletionDismissed(false)
  }, [])

  const handleStayInChamber = useCallback(() => {
    setCompletionDismissed(true)
  }, [])

  const currentPermutation =
    session.invoked && session.permutations.length > 0
      ? session.permutations[session.permutationIndex]
      : undefined

  const completionSnapshot = isSessionComplete(session)
    ? createCompletionSnapshot(session)
    : null
  const showCompletion = completionSnapshot !== null && !completionDismissed

  const ritualActive = mode === 'ritual'
  const studyActive = mode === 'study'

  return (
    <div style={appStyle}>
      <nav style={modeBarStyle} aria-label="Mode">
        <button
          type="button"
          style={modeButtonStyle(ritualActive)}
          aria-pressed={ritualActive}
          onClick={() => setMode('ritual')}
        >
          Ritual
        </button>
        <button
          type="button"
          style={modeButtonStyle(studyActive)}
          aria-pressed={studyActive}
          onClick={() => setMode('study')}
        >
          Study
        </button>
      </nav>

      <div
        style={layerStyle(ritualActive)}
        inert={!ritualActive}
        data-testid="ritual-layer"
      >
        {session.invoked ? (
          <>
            <SomaticHud
              permutation={currentPermutation}
              permutationIndex={session.permutationIndex}
              permutationTotal={session.permutations.length}
              loopsCompleted={session.loopsCompleted}
              repetitionCount={session.repetitionCount}
              onBreathCycle={handleBreathCycle}
            />
            {showCompletion ? (
              <RiteCompletion
                snapshot={completionSnapshot}
                onReinvoke={handleReinvoke}
                onRepeat={handleRepeat}
                onStay={handleStayInChamber}
              />
            ) : null}
          </>
        ) : (
          <PracticeBuilder
            onInvoke={handleInvoke}
            initialRoot={lastInvocation?.root ?? ''}
            initialRepetitionCount={lastInvocation?.repetitionCount ?? 1}
          />
        )}
      </div>

      <div
        style={layerStyle(studyActive)}
        inert={!studyActive}
        data-testid="study-layer"
      >
        <StudyTemple active={studyActive} />
      </div>
    </div>
  )
}

export default App
