# ABULAFIA.EXE | Architectural Specification & System Law

## System Objective
A high-performance cognitive disassembly engine based on 13th-century Ecstatic Kabbalah. The application dismantles semantic language into mathematical permutations to facilitate non-discursive noetic states. It is an instrument of structural rigor, not a meditation app.

## Core Logic 1: The Permutation Engine (Miktav)
- Algorithm: Exhaustive permutation of positionally distinct character tokens via Heap’s algorithm (n! permutations). Output order is not lexicographic.
- CRITICAL MATHEMATICAL AXIOM: The algorithm MUST treat identical characters as positionally distinct. If the input is 'YHVH' (יהוה), it must process as 'Y-H1-V-H2' and output exactly 24 distinct arrays. Do not use standard Set() deduplication that would reduce the count to 12.
- All logic must be self-verifying via strict unit tests.

## Core Logic 2: The Somatic Metronome (Mivta)
- The UI must enforce a rigid physiological pace. Do not allow the user to click through rapidly.
- Metronome Timing: 4-second Inhale (preparation) -> 4-second Exhale (chanting the vowel/letter pair).
- Canonical vowel vocabulary (application-layer identifiers — the engine, tests, and UI must all use these exact spellings): `holam`, `qamatz`, `hiriq`, `tzere`, `qubuts`. Do not introduce alternate transliterations (e.g. "Shurek", "Hirik", "Kamatz", "Holem") in code or tests.
- Canonical direction vocabulary: `up`, `right`, `down`, `left`, `forward`.
- Engine Purity: `metronomeEngine` must remain pure and clock-agnostic. Wall-clock integration (e.g. `performance.now`, RAF, `setInterval`) lives only in `src/adapters/*`, which must never mutate input state and must be covered by unit tests.
- Somatic Mapping (application-layer operational mapping inspired by Ohr ha-Sekhel; not a historical directional claim):
  - `holam` (u)  -> Y-Axis: +1 | direction `up`      (Visual cue: Upward Arrow)
  - `qubuts` (o) -> Z-Axis: +1 | direction `forward` (Visual cue: Forward/Inward Arrow)
  - `hiriq` (i)  -> Y-Axis: -1 | direction `down`    (Visual cue: Downward Arrow)
  - `tzere` (e)  -> X-Axis: -1 | direction `left`    (Visual cue: Leftward Arrow)
  - `qamatz` (a) -> X-Axis: +1 | direction `right`   (Visual cue: Rightward Arrow)

## Visual Architecture & Aesthetic (Mahshav)
- UI Rule: Absolute austerity. Monochromatic high-contrast (Deep Black background #050505, Pure White active elements #FFFFFF).
- BANNED ELEMENTS: No "mystical" fonts, no faux-parchment textures, no esoteric symbols (e.g., Tree of Life, pentagrams), no soft pastel gradients.
- Typography: Use a highly legible, modern block Sans-Serif or technical Hebrew font. The interface should resemble a high-end terminal or precision instrument.

