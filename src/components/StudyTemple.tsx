import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'

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
  padding: 'clamp(20px, 4vmin, 48px)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  overflow: 'auto',
}

const frameStyle: CSSProperties = {
  width: '100%',
  maxWidth: 'clamp(320px, 72vmin, 900px)',
  marginTop: 'clamp(24px, 6vmin, 80px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(16px, 2.4vmin, 28px)',
  border: `1px solid rgba(255,255,255,0.12)`,
  padding: 'clamp(24px, 4vmin, 56px)',
  boxSizing: 'border-box',
  backgroundColor: 'rgba(255,255,255,0.015)',
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
  letterSpacing: '0.28em',
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

const paragraphStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(13px, 1.7vmin, 16px)',
  lineHeight: 1.7,
  letterSpacing: '0.04em',
  color: 'rgba(255,255,255,0.78)',
  margin: 0,
}

const footerStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
  marginTop: 'clamp(12px, 2vmin, 24px)',
}

export type StudyTempleProps = {
  active: boolean
}

export function StudyTemple({ active }: StudyTempleProps) {
  return (
    <div style={rootStyle}>
      <motion.article
        style={frameStyle}
        initial={false}
        animate={active ? 'visible' : 'hidden'}
        variants={{
          hidden: { opacity: 0, y: 8 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <p style={eyebrowStyle}>§ Study</p>
        <h1 style={titleStyle}>The Manual</h1>
        <div style={dividerStyle} />
        <p style={paragraphStyle}>
          This chamber will house the full historical and philosophical manual
          of the Abulafian method — the doctrine of the permutation of letters
          (tzeruf ha-otiot), the logic of the Ohr ha-Sekhel correspondences,
          and the precise instructions governing the somatic metronome. The
          complete text is being prepared and will be installed in a later
          phase. For now, return to the ritual chamber and continue the
          practice.
        </p>
        <p style={footerStyle}>Placeholder · Phase 5A</p>
      </motion.article>
    </div>
  )
}

export default StudyTemple

