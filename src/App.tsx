import type { CSSProperties } from 'react'
import { SomaticHud } from './components/SomaticHud'

const appStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#050505',
  overflow: 'auto',
}

function App() {
  return (
    <div style={appStyle}>
      <SomaticHud />
    </div>
  )
}

export default App
	

