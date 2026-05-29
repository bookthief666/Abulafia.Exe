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
  border: '1px solid rgba(255,255,255,0.08)',
  padding: 'clamp(24px, 4vmin, 56px)',
  boxSizing: 'border-box',
  backgroundColor: 'rgba(255,255,255,0.01)',
}

const eyebrowStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.5em',
  textTransform: 'uppercase',
  color: CYAN,
  opacity: 0.6,
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

const sectionTitleStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(13px, 1.8vmin, 17px)',
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: CYAN,
  margin: 0,
  opacity: 0.8,
}

const paragraphStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(12px, 1.6vmin, 15px)',
  lineHeight: 1.8,
  letterSpacing: '0.04em',
  color: 'rgba(255,255,255,0.72)',
  margin: 0,
}

const listStyle: CSSProperties = {
  ...paragraphStyle,
  paddingLeft: 'clamp(16px, 2vmin, 24px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const correspondenceStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(11px, 1.5vmin, 14px)',
  lineHeight: 1.9,
  letterSpacing: '0.06em',
  color: 'rgba(255,255,255,0.65)',
  margin: 0,
  paddingLeft: 'clamp(12px, 2vmin, 20px)',
  borderLeft: '1px solid rgba(0,255,255,0.15)',
}

const accentSpanColor = CYAN

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

        <h2 style={sectionTitleStyle}>I. The Method</h2>
        <p style={paragraphStyle}>
          Abulafia.exe implements the technique of{' '}
          <span style={{ color: accentSpanColor }}>tzeruf ha-otiot</span>{' '}
          (permutation of letters), the central practice of Abraham Abulafia's
          Ecstatic Kabbalah (Kabbalah Nevuit). The practitioner takes a sacred
          word — canonically the Tetragrammaton{' '}
          <span style={{ color: accentSpanColor }}>YHVH</span> — and
          systematically permutes its letters while chanting each letter through
          a cycle of five vowels coordinated with directed breath and spatial
          orientation.
        </p>
        <p style={paragraphStyle}>
          The purpose is not relaxation or devotion but cognitive disassembly:
          the exhaustive permutation of linguistic matter strips language of
          semantic content and forces consciousness into a non-discursive
          noetic state. The practice is structurally rigorous and
          physiologically demanding.
        </p>

        <div style={dividerStyle} />

        <h2 style={sectionTitleStyle}>II. The Permutation Engine (Miktav)</h2>
        <p style={paragraphStyle}>
          Given an input word of N letters, the engine generates all N!
          (factorial) permutations using Heap's algorithm. Each character is
          treated as <span style={{ color: accentSpanColor }}>positionally
          distinct</span> — for YHVH, the two H letters (H₁ at position 1
          and H₂ at position 3) are tracked separately, producing exactly 24
          permutations even though only 12 render as unique strings. This is
          the <em>positional soul axiom</em>: each letter carries the memory
          of its original position.
        </p>

        <div style={dividerStyle} />

        <h2 style={sectionTitleStyle}>III. The Breath Metronome (Mivta)</h2>
        <p style={paragraphStyle}>
          For each letter of each permutation, the practitioner cycles through
          five vowel-direction pairs. Each pair follows a rigid breath cycle:
        </p>
        <div style={listStyle}>
          <span>4-second <span style={{ color: accentSpanColor }}>inhale</span> — preparation, gathering, contraction</span>
          <span>4-second <span style={{ color: accentSpanColor }}>exhale</span> — chanting the letter with the active vowel, release</span>
        </div>
        <p style={paragraphStyle}>
          The five vowels and their somatic correspondences, drawn from the
          operational logic of the{' '}
          <span style={{ color: accentSpanColor }}>Ohr ha-Sekhel</span>{' '}
          (Light of the Intellect):
        </p>
        <div style={correspondenceStyle}>
          <span style={{ color: accentSpanColor }}>HOLAM</span> (O) → upward · Y-axis +1<br />
          <span style={{ color: accentSpanColor }}>QAMATZ</span> (A) → rightward · X-axis +1<br />
          <span style={{ color: accentSpanColor }}>HIRIQ</span> (I) → downward · Y-axis −1<br />
          <span style={{ color: accentSpanColor }}>TZERE</span> (E) → leftward · X-axis −1<br />
          <span style={{ color: accentSpanColor }}>QUBUTS</span> (U) → forward · Z-axis +1
        </div>
        <p style={paragraphStyle}>
          Each direction corresponds to a spatial orientation of the head and
          attention during the exhale phase. The practitioner physically
          directs awareness in the indicated direction while chanting.
        </p>

        <div style={dividerStyle} />

        <h2 style={sectionTitleStyle}>IV. The Practice Sequence</h2>
        <p style={paragraphStyle}>
          For YHVH (4 letters, 24 permutations):
        </p>
        <div style={listStyle}>
          <span>Each letter is chanted through 5 vowel cycles = 5 × 8 seconds = 40 seconds per letter</span>
          <span>Each permutation has 4 letters = 4 × 40 seconds = 160 seconds per permutation</span>
          <span>24 permutations × 160 seconds = 3,840 seconds ≈ 64 minutes total</span>
          <span>Total breath cycles: 24 × 4 × 5 = 480</span>
        </div>
        <p style={paragraphStyle}>
          The instrument tracks your position through the full sequence:
          which permutation (1–24), which letter within it (1–4), and which
          vowel-direction pair (1–5). The practice auto-advances through
          each layer as breath cycles complete.
        </p>

        <div style={dividerStyle} />

        <h2 style={sectionTitleStyle}>V. Reading the Chamber</h2>
        <p style={paragraphStyle}>
          The ritual chamber displays the operative state through three layers:
        </p>
        <div style={listStyle}>
          <span><span style={{ color: accentSpanColor }}>Central bindu</span> — the letter being chanted (large) with the vowel glyph below</span>
          <span><span style={{ color: accentSpanColor }}>Inner ring</span> — the current permutation's letters, with the active letter highlighted</span>
          <span><span style={{ color: accentSpanColor }}>Outer ring</span> — the permutation letters repeated around the clockface</span>
          <span><span style={{ color: accentSpanColor }}>Breath geometry</span> — the octagonal frame and rings contract on inhale and expand on exhale</span>
          <span><span style={{ color: accentSpanColor }}>Direction markers</span> — cardinal ticks light cyan in the active direction</span>
        </div>
        <p style={paragraphStyle}>
          The bottom strip shows the active direction and vowel. Telemetry
          displays your permutation progress, letter position, current
          permutation string, and total cycle count.
        </p>

        <div style={{ ...dividerStyle, opacity: 0.25 }} />
        <p style={{
          ...paragraphStyle,
          fontSize: '10px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase' as const,
          opacity: 0.35,
          textAlign: 'center' as const,
        }}>
          Abulafia.exe · Cognitive Disassembly Engine
        </p>
      </motion.article>
    </div>
  )
}

export default StudyTemple
