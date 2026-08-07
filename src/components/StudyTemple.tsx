import type { ReactNode } from 'react'
import { ORNAMENT } from '../theme/tokens'

const VOWEL_TABLE = [
  { vowel: 'holam', sound: 'O', direction: 'up', axis: 'Y +1' },
  { vowel: 'qamatz', sound: 'A', direction: 'right', axis: 'X +1' },
  { vowel: 'hiriq', sound: 'I', direction: 'down', axis: 'Y −1' },
  { vowel: 'tzere', sound: 'E', direction: 'left', axis: 'X −1' },
  { vowel: 'qubuts', sound: 'U', direction: 'forward', axis: 'Z +1' },
] as const

type SectionProps = {
  kicker: string
  title: string
  children: ReactNode
  delay?: string
}

function Section({ kicker, title, children, delay = '0s' }: SectionProps) {
  return (
    <section className="mb-10" style={{ animation: `fadeInUp 1s ease-out ${delay} both` }}>
      <p
        className="font-label latin-caps lux-accent m-0 text-[0.56rem]"
        style={{ letterSpacing: '0.38em' }}
      >
        {kicker}
      </p>
      <h2 className="font-display lux m-0 mt-2 text-[clamp(1.5rem,4.5vw,2.1rem)] leading-tight">
        {title}
      </h2>
      <hr className="star-rule mt-3 mb-4" />
      <div className="font-prose lux text-[clamp(0.95rem,2.2vw,1.05rem)] leading-[1.75]">
        {children}
      </div>
    </section>
  )
}

export type StudyTempleProps = {
  active: boolean
}

export function StudyTemple({ active }: StudyTempleProps) {
  return (
    <div className="relative flex min-h-[100dvh] w-full justify-center px-5 py-14 sm:px-8">
      <article
        className="w-full max-w-[46rem]"
        style={{ opacity: active ? 1 : 0, transition: 'opacity 500ms ease-out' }}
      >
        <header className="mb-12 text-center" style={{ animation: 'fadeIn 1.2s ease-out' }}>
          <p
            className="font-label latin-caps lux-accent m-0 text-[0.58rem]"
            style={{ letterSpacing: '0.42em' }}
          >
            The Manual
          </p>
          <h1 className="font-display charged m-0 mt-3 text-[clamp(2.1rem,7vw,3.4rem)] leading-[1.05]">
            Tzeruf Ha-Otiot
          </h1>
          <hr className="charge-rule mx-auto mt-4 w-48 opacity-70" />
          <p className="font-marginalia lux-dim m-0 mt-4 text-lg italic">
            The Permutation of Letters
          </p>
        </header>

        <p
          className="font-prose lux drop-cap mb-12 text-[clamp(1rem,2.4vw,1.12rem)] leading-[1.8]"
          style={{ animation: 'fadeInUp 1s ease-out 0.2s both' }}
        >
          Abraham Abulafia, writing in the thirteenth century, held that ordinary
          language binds the mind to meaning, and that meaning binds it to the
          world of things. To loosen that binding he prescribed a discipline:
          take a name, break it into its letters, and turn those letters through
          every arrangement they admit — sounding each one on the breath, with
          the head inclined along a fixed set of directions. This instrument
          performs that discipline exactly, and refuses to simplify it.
        </p>

        <Section kicker="Core Logic I" title="Miktav — The Permutation Engine" delay="0.35s">
          <p className="m-0">
            Given a name of <em>n</em> letters, the engine generates all{' '}
            <span className="font-numeric lux-accent">n!</span> permutations by
            Heap's algorithm. Every letter is treated as{' '}
            <em>positionally distinct</em>: in{' '}
            <span className="font-operative">YHVH</span> the two{' '}
            <span className="font-operative">H</span>s are not interchangeable
            but are tracked as separate souls, so the name yields{' '}
            <span className="font-numeric lux-accent">24</span> arrangements, not
            twelve. Collapsing them would be arithmetically tidier and
            operatively false. The output order is not alphabetical; it is the
            order the algorithm produces, and that order is part of the practice.
          </p>
        </Section>

        <Section kicker="Core Logic II" title="Mivta — The Somatic Metronome" delay="0.45s">
          <p className="m-0">
            Each letter is carried through five gates. A gate is a pairing of one
            vowel with one direction, and it occupies two movements of the
            breath: four seconds of inhalation, in which nothing is sounded and
            the letter is gathered, then four seconds of exhalation, in which the
            letter is intoned with its vowel and the head turns along the
            direction. The pace is enforced. You cannot hurry it, and the
            inability to hurry it is the point.
          </p>
        </Section>

        <Section kicker="Correspondence" title="The Five Gates" delay="0.55s">
          <p className="m-0 mb-5">
            The mapping below follows the operative scheme of{' '}
            <em>Ohr ha-Sekhel</em>. It is an application-layer correspondence
            used by this instrument, not a claim about historical practice.
          </p>

          <div className="grid grid-cols-[1.2fr_0.5fr_1fr_0.7fr] gap-2 pb-2">
            {['Vowel', 'Sound', 'Direction', 'Axis'].map((h) => (
              <span
                key={h}
                className="font-label latin-caps lux-dim text-[0.55rem]"
                style={{ letterSpacing: '0.3em' }}
              >
                {h}
              </span>
            ))}
          </div>

          <ul className="m-0 list-none p-0">
            {VOWEL_TABLE.map((row) => (
              <li key={row.vowel}>
                <hr className="star-rule opacity-25" />
                <div className="grid grid-cols-[1.2fr_0.5fr_1fr_0.7fr] items-baseline gap-2 py-3">
                  <span
                    className="font-label latin-caps lux text-[0.72rem]"
                    style={{ letterSpacing: '0.18em' }}
                  >
                    {row.vowel}
                  </span>
                  <span className="font-operative lux-accent text-lg">{row.sound}</span>
                  <span
                    className="font-label latin-caps lux-dim text-[0.68rem]"
                    style={{ letterSpacing: '0.18em' }}
                  >
                    {row.direction}
                  </span>
                  <span className="font-numeric lux-dim text-[0.68rem]">{row.axis}</span>
                </div>
              </li>
            ))}
          </ul>
          <hr className="star-rule opacity-25" />
        </Section>

        <Section kicker="Practice" title="How to Use the Chamber" delay="0.65s">
          <p className="m-0 mb-4">
            Enter a name at the gate. Four letters produce twenty-four
            permutations and four hundred and eighty breath cycles — roughly an
            hour of unbroken work. Begin with less if you have not done this
            before.
          </p>
          <p className="m-0 mb-4">
            In the chamber, the centre holds the letter you are working. Beneath
            it the instrument names the sound and the direction. On the inhale,
            the field contracts and darkens: gather, and prepare. On the exhale,
            it opens and brightens: sound the letter with its vowel, and let the
            head follow the indicated direction. When five gates are complete the
            next letter takes the centre; when the letters are exhausted the next
            permutation begins.
          </p>
          <p className="m-0">
            Stop when the discipline stops being a discipline. The engine keeps
            its place.
          </p>
        </Section>

        <footer
          className="mt-16 text-center"
          style={{ animation: 'fadeIn 1s ease-out 0.8s both' }}
        >
          <hr className="charge-rule mx-auto mb-4 w-48 opacity-60" />
          <p className="font-display lux-dim m-0 text-sm opacity-50" aria-hidden="true">
            {ORNAMENT}
          </p>
        </footer>
      </article>
    </div>
  )
}

export default StudyTemple
