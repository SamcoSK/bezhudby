import { describe, it, expect } from 'vitest'
import { normalizeText, songMatchesQuery, normalizedEquals } from '../src/utils/normalize'

describe('normalizeText', () => {
  it('removes diacritics', () => {
    expect(normalizeText('Elán')).toBe('elan')
    expect(normalizeText('Kristína')).toBe('kristina')
    expect(normalizeText('Tublatanka')).toBe('tublatanka')
    expect(normalizeText('Miroslav Žbirka')).toBe('miroslav zbirka')
    expect(normalizeText('Marika Gombitová')).toBe('marika gombitova')
    expect(normalizeText('Atlantída')).toBe('atlantida')
    expect(normalizeText('Skúsime to cez vesmír')).toBe('skusime to cez vesmir')
  })

  it('converts to lowercase', () => {
    expect(normalizeText('VYZNANIE')).toBe('vyznanie')
    expect(normalizeText('Shape Of You')).toBe('shape of you')
    expect(normalizeText('ED SHEERAN')).toBe('ed sheeran')
  })

  it('trims whitespace', () => {
    expect(normalizeText('  Elán  ')).toBe('elan')
    expect(normalizeText('\tRihanna\n')).toBe('rihanna')
  })

  it('handles empty string', () => {
    expect(normalizeText('')).toBe('')
  })

  it('handles already-normalized strings', () => {
    expect(normalizeText('elan')).toBe('elan')
    expect(normalizeText('queen')).toBe('queen')
  })
})

describe('songMatchesQuery', () => {
  const song = { title: 'Amnestia na neveru', artist: 'Elán' }

  it('matches by title without diacritics', () => {
    expect(songMatchesQuery(song, 'amnestia')).toBe(true)
    expect(songMatchesQuery(song, 'Amnestia')).toBe(true)
    expect(songMatchesQuery(song, 'neveru')).toBe(true)
  })

  it('matches by artist without diacritics', () => {
    expect(songMatchesQuery(song, 'elan')).toBe(true)
    expect(songMatchesQuery(song, 'Elán')).toBe(true)
    expect(songMatchesQuery(song, 'ELÁN')).toBe(true)
  })

  it('matches partial strings', () => {
    expect(songMatchesQuery(song, 'amn')).toBe(true)
    expect(songMatchesQuery(song, 'ela')).toBe(true)
  })

  it('returns false for non-matching query', () => {
    expect(songMatchesQuery(song, 'beatles')).toBe(false)
    expect(songMatchesQuery(song, 'xyz')).toBe(false)
  })

  it('returns false for empty query', () => {
    expect(songMatchesQuery(song, '')).toBe(false)
    expect(songMatchesQuery(song, '   ')).toBe(false)
  })

  it('works with EN songs and accents', () => {
    const enSong = { title: "Shape of You", artist: 'Ed Sheeran' }
    expect(songMatchesQuery(enSong, 'shape')).toBe(true)
    expect(songMatchesQuery(enSong, 'sheeran')).toBe(true)
    expect(songMatchesQuery(enSong, 'SHEERAN')).toBe(true)
  })

  it('vyznanie matches Vyznanie', () => {
    const s = { title: 'Vyznanie', artist: 'Marika Gombitová' }
    expect(songMatchesQuery(s, 'vyznanie')).toBe(true)
    expect(songMatchesQuery(s, 'gombitova')).toBe(true)
  })
})

describe('normalizedEquals', () => {
  it('returns true for same strings after normalization', () => {
    expect(normalizedEquals('Elán', 'elan')).toBe(true)
    expect(normalizedEquals('QUEEN', 'queen')).toBe(true)
    expect(normalizedEquals('Vyznanie', 'vyznanie')).toBe(true)
  })

  it('returns false for different strings', () => {
    expect(normalizedEquals('Elán', 'eminem')).toBe(false)
  })
})
