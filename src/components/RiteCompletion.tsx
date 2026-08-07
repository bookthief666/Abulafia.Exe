import { ORNAMENT } from '../theme/tokens'
import type { PermutationToken } from '../engines/permutationEngine'

/**
 * The end of the rite.
 *
 * A practitioner who has worked every arrangement of a name has spent an hour
 * or more in the chamber, and the instrument should acknowledge that rather
 * than simply stopping. The name reassembles from its scattered permutations,
 * the work is counted, and the way back out is offered without insisting.
 *
 * Motion here is one-shot and staggered; nothing loops, because the field has
 * stilled. Everything is CSS animation on opacity and transform, so this stays
 * as cheap as the rest of the chamber.
 */

export type RiteCompletionProps = {
  /** The name as it was entered, before permutation. */
  inputWord: string
  totalPermutations: number
  lettersPerPermutation: number
  /** Begin the same rite again from the first arrangement. */
  onBeginAgain: () => void
  /** Leave the chamber. Omitted when there is nowhere to go. */
  onExit?: () => void
  /** The final arrangement worked, shown as the last thing the hand held. */
  finalPermutation?: PermutationToken[]
}

const GATES_PER_LETTER = 5
const SECONDS_PER_GATE = 8

function formatSpan(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes} min`
}

export function RiteCompletion({
  inputWord,
  totalPermutations,
  lettersPerPermutation,
  onBeginAgain,
  onExit,
  finalPermutation = [],
}: RiteCompletionProps) {
  const breaths = totalPermutations * lettersPerPermutation * GATES_PER_LETTER
  const span = formatSpan(breaths * SECONDS_PER_GATE)
  const letters = Array.from(inputWord)

  return (
    <div
      className="absolute inset-0 z-4 flex items-center justify-center px-6"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(5,5,5,0.82) 0%, rgba(5,5,5,0.96) 60%, rgba(2,2,3,0.99) 100%)',
        animation: 'fadeIn 1.6s ease-out both',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-[34rem] flex-col items-center gap-6 text-center">
        <p
          className="font-label latin-caps lux-accent m-0 text-[0.58rem]"
          style={{
            letterSpacing: '0.44em',
            animation: 'fadeInUp 1.2s ease-out 0.4s both',
          }}
        >
          The Rite is Complete
        </p>

        {/* The name reassembles: each letter settles back into its place. */}
        <div
          className="flex items-baseline justify-center"
          aria-label={`The name ${inputWord}, reassembled`}
        >
          {letters.map((char, i) => (
            <span
              key={`${char}-${i}`}
              className="font-operative lux"
              style={{
                fontSize: 'clamp(2.4rem, 11vw, 4rem)',
                letterSpacing: '0.22em',
                animation: `numberSlam 1.1s cubic-bezier(0.16,0.76,0.22,1) ${0.7 + i * 0.16}s both`,
                textShadow: '0 0 34px rgba(0,255,255,0.34)',
              }}
            >
              {char}
            </span>
          ))}
        </div>

        <hr
          className="charge-rule w-56"
          style={{ animation: `fadeIn 1.4s ease-out ${0.9 + letters.length * 0.16}s both` }}
        />

        <p
          className="font-prose lux-dim m-0 max-w-[26rem] text-[clamp(0.9rem,2.3vw,1.02rem)] leading-relaxed"
          style={{ animation: 'fadeInUp 1.2s ease-out 1.5s both' }}
        >
          Every arrangement of{' '}
          <span className="font-operative lux">{inputWord}</span> has been
          sounded through all five gates. The name has been taken apart and
          returned.
        </p>

        <dl
          className="font-numeric lux-dim m-0 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[0.62rem]"
          style={{ letterSpacing: '0.2em', animation: 'fadeInUp 1.2s ease-out 1.8s both' }}
        >
          <div className="flex flex-col items-center gap-1">
            <dt className="opacity-50">permutations</dt>
            <dd className="lux m-0">{totalPermutations.toLocaleString()}</dd>
          </div>
          <div className="flex flex-col items-center gap-1">
            <dt className="opacity-50">breaths</dt>
            <dd className="lux m-0">{breaths.toLocaleString()}</dd>
          </div>
          <div className="flex flex-col items-center gap-1">
            <dt className="opacity-50">span</dt>
            <dd className="lux m-0">{span}</dd>
          </div>
        </dl>

        {finalPermutation.length > 0 && (
          <p
            className="font-numeric lux-dim m-0 text-[0.56rem]"
            style={{ letterSpacing: '0.3em', animation: 'fadeIn 1.2s ease-out 2.1s both' }}
          >
            <span className="opacity-50">last arrangement </span>
            <span className="font-operative lux">
              {finalPermutation.map((t) => t.char).join('')}
            </span>
          </p>
        )}

        <div
          className="mt-2 flex flex-wrap items-center justify-center gap-2"
          style={{ animation: 'fadeInUp 1.2s ease-out 2.3s both' }}
        >
          <button type="button" className="ritual-action lux-accent" onClick={onBeginAgain}>
            ✦ Begin Again ✦
          </button>
          {onExit && (
            <button type="button" className="ritual-action text-[0.6rem]" onClick={onExit}>
              Leave the Chamber
            </button>
          )}
        </div>

        <p
          className="font-display lux-dim m-0 text-sm opacity-40"
          aria-hidden="true"
          style={{ animation: 'fadeIn 1.5s ease-out 2.6s both' }}
        >
          {ORNAMENT}
        </p>
      </div>
    </div>
  )
}

export default RiteCompletion
