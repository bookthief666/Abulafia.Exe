# ABULAFIA.EXE

A cognitive disassembly engine built on the ecstatic Kabbalah of Abraham
Abulafia (1240–c.1291).

Enter a name. The engine shatters it into every arrangement of its letters, and
walks you through each one on the breath — every letter sounded through five
gates of vowel and direction, four seconds gathering, four seconds sounding. For
`YHVH` that is 24 arrangements, 480 breaths, a little over an hour of unbroken
work.

It is an instrument of structural rigour, not a meditation app. It does not
shorten the practice to make it comfortable.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

| Command | |
|---|---|
| `npm run dev` | dev server with HMR |
| `npm run build` | typecheck, then production build |
| `npm test` | full suite, once |
| `npm run test:watch` | suite in watch mode |
| `npm run lint` | eslint |

Nothing is fetched at runtime — the six typefaces are vendored under
`public/fonts`, and there is no backend. It installs to a phone home screen as a
PWA and runs offline.

## Architecture

The rule that shapes the codebase: **pure logic knows nothing about time, the
DOM, or React.** Wall-clock integration lives only in adapters, and those are
themselves pure functions over an injected clock — which is why the breath can
be driven to an exact instant in a test rather than waited for.

```
engines/     pure, total functions — no clock, no DOM
  permutationEngine   Miktav — Heap's algorithm over positional tokens
  metronomeEngine     Mivta — the breath state machine
  practiceEngine      binds the two: which arrangement, which letter

adapters/    the impure boundary, isolated and injectable
  metronomeRuntime    wall-clock delta -> engine advance
  audioRuntime        Web Audio graph; silent unless asked

hooks/       React integration
  useMivta            requestAnimationFrame loop, injectable clock
  usePractice         useMivta + practiceEngine
  useAudio            lifecycle for the audio adapter

components/  the chamber
  RitualGate          the threshold: name, scope, consent
  SomaticHud          the operative chamber
  RiteCompletion      the close
  StudyTemple         the manual
  ParticleField       the atmosphere, one canvas
  chamberGeometry     pure maths for the core
  fieldSignal         rite -> atmosphere, without re-rendering
```

### The positional-souls axiom

`YHVH` yields **24** arrangements, not 12. The two `H`s are not
interchangeable: each letter is tracked as a distinct positional token, so
identical characters remain separate souls. Collapsing them with a `Set` would
be arithmetically tidier and operatively false, and there are tests whose only
job is to keep that from happening.

### The five gates

An application-layer correspondence after *Ohr ha-Sekhel*, not a historical
claim.

| Vowel | Sound | Direction | Axis |
|---|---|---|---|
| holam | O | up | Y +1 |
| qamatz | A | right | X +1 |
| hiriq | I | down | Y −1 |
| tzere | E | left | X −1 |
| qubuts | U | forward | Z +1 |

### The Spanda law

Anything the breath drives per-frame — scale, stroke weight, orbital angle,
opacity envelopes — is computed directly from the animation-frame float and
written inline. Framer Motion is used only for one-shot ignition and ambient
loops, never to interpolate a value the metronome already owns. An animation
library easing toward a target the engine has already moved past produces
motion that lags the breath, which defeats the instrument.

## Testing

185 tests. The engine, adapter and hook layers are covered exhaustively because
they are where correctness lives; the interface is covered through its
accessible surface — roles, labels and text — rather than its markup.

`SomaticHud` takes an optional `clock` prop that forwards to `usePractice`, so
tests hand-crank animation frames and land on an exact point in the breath:

```tsx
render(<SomaticHud inputWord="YHVH" clock={clock} />)
advanceTo(4000)   // the turn from inhale to exhale
```

## Doctrine

`CLAUDE.md` is the standing specification — the mathematical axioms, the
canonical vocabulary, and the visual law. It governs. The short version:

- Deep black ground, luminous type, one restrained ritual accent (cyan here).
- Blackletter is chrome only. The permutation letters are always set in a clean
  Roman capital, because a practitioner has to know exactly which letter is in
  hand and Fraktur renders `Y`, `V` and `H` near-identically.
- Every effect is bound to the operation — breath, direction, letter,
  arrangement. Motion that is not is decoration, and decoration is noise.
- The visuals exist to intensify the practice. The practice is never simplified
  to flatter the visuals.

## Licence

The six vendored typefaces are under the SIL Open Font License 1.1.
