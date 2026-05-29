import { useState } from 'react'
import type { CSSProperties } from 'react'
import { SomaticHud } from './components/SomaticHud'
import { RitualGate } from './components/RitualGate'

type AppMode = 'gate' | 'ritual'

const appStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#050505',
  overflow: 'auto',
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
      {mode === 'gate' && <RitualGate onBegin={handleBegin} />}
      {mode === 'ritual' && (
        <SomaticHud key={inputWord} inputWord={inputWord} onExit={handleExit} />
      )}
    </div>
  )
}

export default App
