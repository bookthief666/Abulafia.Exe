import { useState } from 'react'
import { ORNAMENT } from '../theme/tokens'

function factorial(n: number): number {
  let f = 1
  for (let i = 2; i <= n; i++) f *= i
  return f
}

const MAX_LETTERS = 7

/** Five vowel gates per letter; each gate is one inhale and one exhale. */
const GATES_PER_LETTER = 5
const SECONDS_PER_GATE = 8

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes} min`
}

export type RitualGateProps = {
  onBegin: (word: string) => void
  onStudy?: () => void
}

export function RitualGate({ onBegin, onStudy }: RitualGateProps) {
  const [word, setWord] = useState('YHVH')

  const trimmed = word.replace(/\s/g, '').toUpperCase()
  const len = trimmed.length
  const permCount = len > 0 ? factorial(len) : 0
  const totalBreaths = permCount * len * GATES_PER_LETTER
  const estimate = formatDuration(totalBreaths * SECONDS_PER_GATE)
  const tooLong = len > MAX_LETTERS
  const ready = len > 0 && !tooLong

  const handleSubmit = () => {
    if (ready) onBegin(trimmed)
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 py-10">
      <div
        className="flex w-full max-w-[34rem] flex-col items-center gap-6 text-center"
        style={{ animation: 'fadeIn 1.6s ease-out' }}
      >
        <p
          className="font-label latin-caps lux-accent text-[0.62rem]"
          style={{ letterSpacing: '0.42em', animation: 'fadeInUp 1s ease-out both' }}
        >
          Tzeruf Ha-Otiot
        </p>

        <h1
          className="font-display charged m-0 text-[clamp(2.6rem,10vw,4.75rem)] leading-[1.05]"
          style={{ animation: 'fadeInUp 1s ease-out 0.15s both' }}
        >
          Abulafia.exe
        </h1>

        <hr className="star-rule w-56" />

        <p
          className="font-prose lux-dim m-0 max-w-[30rem] text-[clamp(0.9rem,2.4vw,1.05rem)] leading-relaxed"
          style={{ animation: 'fadeInUp 1s ease-out 0.3s both' }}
        >
          Enter a name. The engine shatters it into every arrangement of its
          letters, and you breathe each letter through five gates of vowel and
          direction — one inhale to gather, one exhale to sound it.
        </p>

        <div
          className="mt-2 w-full"
          style={{ animation: 'fadeInUp 1s ease-out 0.45s both' }}
        >
          <label
            htmlFor="ritual-word"
            className="font-label latin-caps lux-dim block text-[0.58rem]"
            style={{ letterSpacing: '0.4em' }}
          >
            The Name
          </label>
          <input
            id="ritual-word"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            className="font-operative lux mt-3 w-full border-0 bg-transparent text-center text-[clamp(2rem,9vw,3.25rem)] uppercase outline-none"
            style={{ letterSpacing: '0.34em', textIndent: '0.34em' }}
            placeholder="YHVH"
            maxLength={MAX_LETTERS + 1}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          <hr className="charge-rule mt-1 w-full" style={{ opacity: ready ? 0.9 : 0.3 }} />
        </div>

        {ready && (
          <p className="font-numeric lux-dim m-0 text-[0.68rem]" style={{ letterSpacing: '0.2em' }}>
            {permCount.toLocaleString()} permutations ·{' '}
            {totalBreaths.toLocaleString()} breaths · {estimate} unbroken
          </p>
        )}

        {tooLong && (
          <p className="font-numeric lux-accent m-0 text-[0.68rem]" style={{ letterSpacing: '0.2em' }}>
            {MAX_LETTERS} letters maximum — {factorial(8).toLocaleString()} permutations
            would exceed a practicable rite
          </p>
        )}

        <div
          className="mt-2 flex flex-col items-center gap-1"
          style={{ animation: 'fadeInUp 1s ease-out 0.6s both' }}
        >
          <button
            type="button"
            className="ritual-action lux-accent text-[0.82rem]"
            style={{ letterSpacing: '0.3em', opacity: ready ? 1 : 0.3 }}
            disabled={!ready}
            onClick={handleSubmit}
          >
            ✦ Begin the Rite ✦
          </button>

          {onStudy && (
            <button type="button" className="ritual-action text-[0.62rem]" onClick={onStudy}>
              Study the Method
            </button>
          )}
        </div>

        <p className="font-display lux-dim m-0 text-sm opacity-40" aria-hidden="true">
          {ORNAMENT}
        </p>
      </div>
    </div>
  )
}

export default RitualGate
