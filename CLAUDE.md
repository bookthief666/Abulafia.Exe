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

### Core Principle
ABULAFIA.EXE is not a generic dashboard and not a decorative fantasy interface. It is a living ritual instrument. The logic must remain exact, but the presentation should make practice feel charged, rewarding, and sensorially legible.

## Visual Doctrine — Ritual Chamber

ABULAFIA.EXE is a living operative instrument. It must preserve mathematical rigor while making the practice feel charged, luminous, and repeatable.

### Core Rules
- The interface should feel enchanted, intelligent, and sensorially alive.
- Breath, direction, vowel, and letter-state must be emotionally legible.
- Visual delight is allowed but with an attempt to also maintain and reinforce the operation.

### Aesthetic Direction & Colors
- **Base:** Deep black (`#050505`) base. Pure White (`#FFFFFF`) structural lines and type.
- **Color Doctrine:** The app should utilize a rich, luminous atmosphere. However, multi-color systems (such as assigning specific colors to vowels or directions) should be implemented and tied to a specific, researched esoteric correspondence framework. 
- **Until a correspondence framework is established:** Default to monochrome dominance with ONE restrained global ritual accent (e.g., Electric Cyan or Solar Saffron) for active states.
- Layered gradients, glow (`drop-shadow`), subtle particles, motion fields, and floating text are highly encouraged to create an enchanted space.

### Fluid Geometry & Motion Physics
- The layout must remain universally fluid across tall, square, and wide viewports. Use `minHeight: 100dvh` and `vmin`-based spatial scaling. 
- The SVG `viewBox` is the absolute geometric law of the Ritual Core.
- **The Spanda (Pulse) Law:** Motion must be breath-bound and instant. Do NOT apply generic CSS transitions to values driven continuously by the `requestAnimationFrame` progress float.

### Product Structure
- **Ritual Mode:** The immersive operational chamber.
- **Study Mode:** The extensive explanatory knowledge space.
- **Dev Layer:** Hidden or highly subordinate telemetry/diagnostics only.

### Non-Negotiable Principle
The app should avoid ever simplifying the actual permutation practice in order to make the visuals impressive. The visuals exist to intensify comprehension, timing, focus, and return behavior and to enchant the user. 

### Aesthetic Direction
- Base: deep black / near-black field.
- Foreground: high-contrast light typography and structural lines.
- Accent: one restrained ritual accent color may be introduced where it improves focus, phase clarity, or reward feedback.
- Motion should feel deliberate, breath-bound, and meaningful — not busy, random, or gamey for its own sake.
- The interface should feel like a premium occult instrument with arcade-grade feedback discipline.

### Allowed Visual Techniques
- Focused glow used sparingly on active ritual elements.
- Radial gradients or soft light only when tied to state, breath, or activation.
- Scale, opacity, displacement, and subtle transitions to express inhale/exhale and directional force.
- Layered depth where it improves ritual presence.
- Strong active/inactive contrast for current vowel, direction, and step.
- A central ritual object or glyph that visibly responds to state.

### Forbidden Visual Mistakes
- No cluttered fantasy ornament.
- No faux parchment, fake antique paper, or cosplay grimoire textures.
- No arbitrary decorative occult symbols that are not functionally tied to the current operation.
- No rainbow palettes, noisy particle spam, or attention-fragmenting motion.
- No corporate dashboard blandness.
- No sterile debug-console dominance in the main user-facing experience.

### Interface Hierarchy
The app should gradually organize into three strata:

1. Ritual Core
   - The central living object or glyph field.
   - Reacts to breath, direction, vowel, and eventually permutation state.
   - This is the emotional and attentional center of the interface.

2. Somatic HUD
   - Shows phase, progress, active vowel, active direction, and minimal operational state.
   - Supports the Ritual Core rather than dominating the screen.

3. Dev Layer
   - Manual tick controls, raw counters, and engineering instrumentation.
   - Must be visually subordinate, collapsible, or clearly separated from the main ritual experience.

### Breath Dramaturgy
- Inhale should feel preparatory, contractive, gathering, latent, or charging.
- Exhale should feel expressive, projective, radiant, released, or active.
- Direction should be felt spatially, not just read as text.
- Vowel changes should feel like mode shifts, not mere labels.

### Product Goal
The interface should make disciplined practice feel compelling enough to repeat. The user should want to continue because the system makes each cycle feel consequential, not because of empty gamification.
