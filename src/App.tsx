import { useEffect, useRef, useState } from 'react'
import { SomaticHud } from './components/SomaticHud'
import { RitualGate } from './components/RitualGate'
import { StudyTemple } from './components/StudyTemple'
import { ParticleField } from './components/ParticleField'

type AppMode = 'gate' | 'ritual' | 'study'

/** How long a mode takes to dissolve into the next. */
const CROSSFADE_MS = 320

function App() {
  const [mode, setMode] = useState<AppMode>('gate')
  const [inputWord, setInputWord] = useState('YHVH')

  // Crossfade between modes so the app reads as one continuous space rather
  // than three pages. Only the opacity of the mounted mode is animated: the
  // outgoing mode is unmounted, never merely hidden, because a SomaticHud left
  // mounted behind a hidden layer would keep its metronome running unseen.
  const [visible, setVisible] = useState(true)
  const pendingRef = useRef<AppMode | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = (next: AppMode) => {
    if (next === mode) return
    pendingRef.current = next
    setVisible(false)
    if (timerRef.current != null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const target = pendingRef.current
      pendingRef.current = null
      timerRef.current = null
      if (target) setMode(target)
      setVisible(true)
    }, CROSSFADE_MS)
  }

  useEffect(
    () => () => {
      if (timerRef.current != null) clearTimeout(timerRef.current)
    },
    [],
  )

  const handleBegin = (word: string) => {
    setInputWord(word)
    goTo('ritual')
  }

  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Atmosphere. Pointer-inert, behind everything. The particle field runs
          in every mode — the gate and the manual are quieter than the chamber,
          but they are not dead. */}
      <div aria-hidden="true" className="starfield-layer" />
      <ParticleField />
      <div aria-hidden="true" className="grain-layer" />
      <div aria-hidden="true" className="vignette-layer" />

      {mode !== 'gate' && (
        <nav
          className="fixed z-100 flex gap-1"
          style={{
            top: 'calc(var(--safe-top) + clamp(6px, 1.5vmin, 14px))',
            right: 'clamp(6px, 1.5vmin, 14px)',
          }}
        >
          <button
            type="button"
            className="ritual-action text-[0.58rem]"
            onClick={() => goTo('gate')}
          >
            Gate
          </button>
          <button
            type="button"
            className="ritual-action text-[0.58rem]"
            style={mode === 'study' ? { opacity: 1 } : undefined}
            onClick={() => goTo(mode === 'study' ? 'ritual' : 'study')}
          >
            {mode === 'study' ? 'Ritual' : 'Study'}
          </button>
        </nav>
      )}

      <div
        className="relative z-1"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${CROSSFADE_MS}ms ease-out`,
        }}
      >
        {mode === 'gate' && (
          <RitualGate onBegin={handleBegin} onStudy={() => goTo('study')} />
        )}
        {mode === 'ritual' && (
          <SomaticHud
            key={inputWord}
            inputWord={inputWord}
            onExit={() => goTo('gate')}
          />
        )}
        {mode === 'study' && <StudyTemple active={true} />}
      </div>
    </div>
  )
}

export default App
