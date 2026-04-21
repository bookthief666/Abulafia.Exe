import { useCallback, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  ROOT_LENGTH,
  buildPermutationStrings,
  validateRoot,
} from '../session/ritualSession'
import { formatDuration } from './formatDuration'

const SECONDS_PER_PERMUTATION = 8

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
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
}

const frameStyle: CSSProperties = {
  width: '100%',
  maxWidth: 'clamp(320px, 64vmin, 720px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(18px, 2.6vmin, 30px)',
  border: `1px solid rgba(255,255,255,0.14)`,
  padding: 'clamp(28px, 4.4vmin, 60px)',
  boxSizing: 'border-box',
  backgroundColor: 'rgba(255,255,255,0.02)',
  position: 'relative',
}

const cornerMarkStyle: CSSProperties = {
  position: 'absolute',
  width: '10px',
  height: '10px',
  borderColor: CYAN,
  opacity: 0.6,
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

const fieldGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const labelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
}

const inputBaseStyle: CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  color: WHITE,
  fontFamily: MONO,
  fontSize: 'clamp(18px, 3vmin, 28px)',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  border: 'none',
  borderBottom: `1px solid rgba(255,255,255,0.22)`,
  outline: 'none',
  padding: '10px 2px',
  width: '100%',
  caretColor: CYAN,
}

const inputFocusStyle: CSSProperties = {
  borderBottom: `1px solid ${CYAN}`,
}

const inputErrorStyle: CSSProperties = {
  borderBottom: `1px solid ${CYAN}`,
  color: CYAN,
}

const errorStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '11px',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: CYAN,
  opacity: 0.85,
  minHeight: '14px',
}

const hintStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
  minHeight: '12px',
}

const actionsRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  marginTop: '8px',
}

const invokeButtonStyle: CSSProperties = {
  background: 'transparent',
  color: WHITE,
  border: `1px solid ${CYAN}`,
  padding: '14px 32px',
  fontFamily: MONO,
  fontSize: '12px',
  letterSpacing: '0.5em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const footerStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.32)',
}

const errorCopy: Record<
  'empty' | 'length' | 'whitespace' | 'alphabet',
  string
> = {
  empty: 'Inscribe three letters',
  length: `Root must be exactly ${ROOT_LENGTH} letters`,
  whitespace: 'Whitespace is not permitted',
  alphabet: 'Only letters A-Z are permitted.',
}

const previewFrameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  padding: '18px 20px',
  border: '1px solid rgba(255,255,255,0.12)',
  backgroundColor: 'rgba(255,255,255,0.015)',
}

const previewGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, auto) minmax(0, 1fr)',
  columnGap: 'clamp(14px, 2.8vmin, 28px)',
  rowGap: '10px',
}

const previewLabelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.5)',
  alignSelf: 'center',
}

const previewValueStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 'clamp(13px, 2.2vmin, 18px)',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: WHITE,
  wordBreak: 'break-all',
}

const permutationListStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '4px',
}

const permutationChipStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: '12px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.88)',
  padding: '6px 10px',
  border: '1px solid rgba(255,255,255,0.16)',
}

export type PracticeBuilderProps = {
  onInvoke: (root: string, repetitionCount: number) => void
  initialRoot?: string
  initialRepetitionCount?: number
}

export function PracticeBuilder({
  onInvoke,
  initialRoot = '',
  initialRepetitionCount = 1,
}: PracticeBuilderProps) {
  const [rootRaw, setRootRaw] = useState<string>(initialRoot)
  const [repetitionsRaw, setRepetitionsRaw] = useState<string>(
    String(initialRepetitionCount),
  )
  const [attempted, setAttempted] = useState<boolean>(false)
  const [rootFocused, setRootFocused] = useState<boolean>(false)
  const [repsFocused, setRepsFocused] = useState<boolean>(false)

  const rootValidation = useMemo(() => validateRoot(rootRaw), [rootRaw])
  const repsValid = useMemo(() => {
    const parsed = Number(repetitionsRaw)
    return Number.isInteger(parsed) && parsed >= 1
  }, [repetitionsRaw])

  const previewPermutations = useMemo(
    () =>
      rootValidation.ok ? buildPermutationStrings(rootValidation.value) : [],
    [rootValidation],
  )
  const previewReps = useMemo(() => {
    if (!repsValid) return null
    return Number(repetitionsRaw)
  }, [repsValid, repetitionsRaw])
  const previewDurationSeconds =
    previewReps !== null
      ? previewPermutations.length * previewReps * SECONDS_PER_PERMUTATION
      : null

  const rootError = attempted && !rootValidation.ok
    ? errorCopy[rootValidation.reason]
    : ''
  const repsError = attempted && !repsValid
    ? 'Repetitions must be a positive integer'
    : ''

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setAttempted(true)
      if (!rootValidation.ok || !repsValid) return
      const parsed = Number(repetitionsRaw)
      onInvoke(rootValidation.value, parsed)
    },
    [onInvoke, rootValidation, repsValid, repetitionsRaw],
  )

  const rootInputStyle: CSSProperties = {
    ...inputBaseStyle,
    ...(rootError ? inputErrorStyle : rootFocused ? inputFocusStyle : {}),
  }
  const repsInputStyle: CSSProperties = {
    ...inputBaseStyle,
    ...(repsError ? inputErrorStyle : repsFocused ? inputFocusStyle : {}),
  }

  return (
    <div style={rootStyle}>
      <motion.form
        style={frameStyle}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        noValidate
      >
        <div
          aria-hidden="true"
          style={{ ...cornerMarkStyle, top: -1, left: -1, borderTop: `1px solid ${CYAN}`, borderLeft: `1px solid ${CYAN}` }}
        />
        <div
          aria-hidden="true"
          style={{ ...cornerMarkStyle, top: -1, right: -1, borderTop: `1px solid ${CYAN}`, borderRight: `1px solid ${CYAN}` }}
        />
        <div
          aria-hidden="true"
          style={{ ...cornerMarkStyle, bottom: -1, left: -1, borderBottom: `1px solid ${CYAN}`, borderLeft: `1px solid ${CYAN}` }}
        />
        <div
          aria-hidden="true"
          style={{ ...cornerMarkStyle, bottom: -1, right: -1, borderBottom: `1px solid ${CYAN}`, borderRight: `1px solid ${CYAN}` }}
        />

        <p style={eyebrowStyle}>§ Invocation</p>
        <h1 style={titleStyle}>Inscribe the Root</h1>
        <div style={dividerStyle} />

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="pb-root">
            Root · 3 letters
          </label>
          <input
            id="pb-root"
            name="root"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            value={rootRaw}
            onChange={(e) => setRootRaw(e.target.value)}
            onFocus={() => setRootFocused(true)}
            onBlur={() => setRootFocused(false)}
            style={rootInputStyle}
            aria-invalid={rootError.length > 0}
            aria-describedby="pb-root-error"
          />
          <span id="pb-root-error" role="alert" style={errorStyle}>
            {rootError || '\u00A0'}
          </span>
          <span style={hintStyle}>
            Accepted: three non-space characters. Normalized to uppercase on invoke.
          </span>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="pb-reps">
            Repetitions · full loops
          </label>
          <input
            id="pb-reps"
            name="repetitions"
            type="number"
            min={1}
            step={1}
            value={repetitionsRaw}
            onChange={(e) => setRepetitionsRaw(e.target.value)}
            onFocus={() => setRepsFocused(true)}
            onBlur={() => setRepsFocused(false)}
            style={repsInputStyle}
            aria-invalid={repsError.length > 0}
            aria-describedby="pb-reps-error"
          />
          <span id="pb-reps-error" role="alert" style={errorStyle}>
            {repsError || '\u00A0'}
          </span>
          <span style={hintStyle}>
            Each loop walks every permutation once. Advance is breath-bound.
          </span>
        </div>

        {rootValidation.ok ? (
          <section
            style={previewFrameStyle}
            aria-label="Ritual preview"
            data-testid="ritual-preview"
          >
            <p style={eyebrowStyle}>§ Preview</p>
            <div style={previewGridStyle}>
              <span style={previewLabelStyle}>Normalized</span>
              <span
                style={previewValueStyle}
                data-testid="preview-normalized"
              >
                {rootValidation.value}
              </span>
              <span style={previewLabelStyle}>Permutations</span>
              <span
                style={previewValueStyle}
                data-testid="preview-total"
              >
                {previewPermutations.length}
              </span>
              <span style={previewLabelStyle}>Duration</span>
              <span
                style={previewValueStyle}
                data-testid="preview-duration"
              >
                {previewDurationSeconds !== null
                  ? formatDuration(previewDurationSeconds)
                  : '—'}
              </span>
            </div>
            <ul style={permutationListStyle} data-testid="preview-list">
              {previewPermutations.map((perm, idx) => (
                <li
                  key={`${perm}-${idx}`}
                  style={permutationChipStyle}
                  data-testid="preview-chip"
                >
                  {perm}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div style={dividerStyle} />

        <div style={actionsRowStyle}>
          <span style={footerStyle}>ABULAFIA · Invocation</span>
          <button type="submit" style={invokeButtonStyle}>
            Invoke
          </button>
        </div>
      </motion.form>
    </div>
  )
}

export default PracticeBuilder
