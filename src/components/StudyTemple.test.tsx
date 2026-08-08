// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { StudyTemple } from './StudyTemple'
import { createDefaultSequence } from '../engines/metronomeEngine'
import { VOWEL_GLYPH } from './chamberGeometry'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('StudyTemple', () => {
  it('names the practice', () => {
    render(<StudyTemple active />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Tzeruf Ha-Otiot',
    )
  })

  it('teaches both engines', () => {
    render(<StudyTemple active />)
    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent ?? '')

    expect(headings.some((h) => h.includes('Miktav'))).toBe(true)
    expect(headings.some((h) => h.includes('Mivta'))).toBe(true)
  })

  it('states the positional-souls axiom rather than glossing it', () => {
    render(<StudyTemple active />)
    // The whole point of the engine: YHVH is 24 arrangements, not 12.
    expect(screen.getByText(/not twelve/i)).toBeTruthy()
    expect(screen.getByText('24')).toBeTruthy()
  })

  it('documents every gate the metronome actually walks', () => {
    render(<StudyTemple active />)
    // The manual must not drift from the engine's own sequence.
    for (const step of createDefaultSequence()) {
      expect(screen.getByText(step.vowel)).toBeTruthy()
      expect(screen.getByText(step.direction)).toBeTruthy()
    }
  })

  it('gives each vowel the same sound the chamber sounds', () => {
    render(<StudyTemple active />)
    for (const step of createDefaultSequence()) {
      const row = screen.getByText(step.vowel).parentElement
      expect(row?.textContent).toContain(VOWEL_GLYPH[step.vowel])
    }
  })

  it('marks the correspondence as an application-layer scheme, not history', () => {
    render(<StudyTemple active />)
    expect(screen.getByText(/not a claim about historical practice/i)).toBeTruthy()
  })

  it('tells the reader what to expect before they commit an hour', () => {
    render(<StudyTemple active />)
    expect(screen.getByText(/four hundred and eighty breath cycles/i)).toBeTruthy()
  })

  it('fades out when it is not the active mode', () => {
    const { container, rerender } = render(<StudyTemple active />)
    const article = container.querySelector('article') as HTMLElement
    expect(article.style.opacity).toBe('1')

    rerender(<StudyTemple active={false} />)
    expect(article.style.opacity).toBe('0')
  })
})
