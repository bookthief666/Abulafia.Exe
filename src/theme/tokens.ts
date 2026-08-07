/**
 * ABULAFIA.EXE — shared design tokens.
 *
 * The house style is shared with `monas-hieroglyphica` and `liber-333-grimoire`:
 * near-black ground with radial depth, luminous body type, tracked small-caps
 * labels, blackletter display, mono reserved for numerals, and a single ritual
 * accent. Abulafia's accent is CYAN — that is what distinguishes it from the
 * warm gold of Monas and the crimson of Liber.
 *
 * Anything a stylesheet can express lives in `ritual.css` as a CSS variable.
 * These constants exist for the values that inline SVG attributes and canvas
 * drawing calls need in JS.
 */

export const VOID = '#050505'
export const VOID_LIFT = '#0a0a12'
export const VOID_DEEP = '#020203'

export const LUX = '#F2F4FA'
export const LUX_DIM = '#9AA0B4'

export const ACCENT = '#00FFFF'
export const ACCENT_SOFT = '#7FFFFF'
export const ACCENT_DEEP = '#00D8D8'

/** Hairline colour used wherever a rule is genuinely structural. */
export const LINE = 'rgba(210,225,240,0.18)'

/**
 * The type ladder. Blackletter is chrome only.
 *
 * IMPORTANT: `OPERATIVE` is the face used for the permutation letters
 * themselves — the centre bindu and the ring glyphs. It must stay a clean
 * Roman capital. Fraktur renders Y / V / H near-identically, and the practice
 * depends on the practitioner knowing exactly which letter is being chanted.
 */
export const FONT_DISPLAY = "'UnifrakturCook', 'UnifrakturMaguntia', cursive"
export const FONT_LABEL = "'Cinzel', serif"
export const FONT_PROSE = "'IM Fell English', Georgia, serif"
export const FONT_NUMERIC = "'JetBrains Mono', ui-monospace, monospace"
export const FONT_MARGINALIA = "'Petit Formal Script', cursive"
export const FONT_OPERATIVE = "'Cinzel', serif"

/**
 * Unicode glyph vocabulary shared across the three apps. Rendered in `serif`.
 * Used for ambient marginalia and mode marks — never as arbitrary decoration
 * detached from the current operation.
 */
export const PLANETARY_GLYPHS = ['☉', '☽', '☿', '♀', '♂', '♃', '♄'] as const
export const ELEMENTAL_GLYPHS = ['🜂', '🜄', '🜁', '🜃'] as const
export const RITUAL_MARKS = ['✦', '✧', '△', '□', '◯', '✚', '✶', '∴', '∵'] as const

/** The ornament divider used by both reference apps. */
export const ORNAMENT = '✦ ❧ ✦'
