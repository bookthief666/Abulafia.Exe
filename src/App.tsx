import { useState } from 'react'
import { SomaticHud } from './components/SomaticHud'
import { RitualGate } from './components/RitualGate'
import { StudyTemple } from './components/StudyTemple'

type AppMode = 'gate' | 'ritual' | 'study'

function App() {
  const [mode, setMode] = useState<AppMode>('gate')
  const [inputWord, setInputWord] = useState('YHVH')

  const handleBegin = (word: string) => {
    setInputWord(word)
    setMode('ritual')
  }

  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Atmosphere. Pointer-inert, behind everything, cheap: two static
          layers plus one slow-drifting starfield. */}
      <div aria-hidden="true" className="starfield-layer" />
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
            onClick={() => setMode('gate')}
          >
            Gate
          </button>
          <button
            type="button"
            className="ritual-action text-[0.58rem]"
            style={mode === 'study' ? { opacity: 1 } : undefined}
            onClick={() => setMode(mode === 'study' ? 'ritual' : 'study')}
          >
            {mode === 'study' ? 'Ritual' : 'Study'}
          </button>
        </nav>
      )}

      <div className="relative z-1">
        {mode === 'gate' && (
          <RitualGate onBegin={handleBegin} onStudy={() => setMode('study')} />
        )}
        {mode === 'ritual' && (
          <SomaticHud
            key={inputWord}
            inputWord={inputWord}
            onExit={() => setMode('gate')}
          />
        )}
        {mode === 'study' && <StudyTemple active={true} />}
      </div>
    </div>
  )
}

export default App
