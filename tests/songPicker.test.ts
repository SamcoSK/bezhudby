import { describe, it, expect } from 'vitest'
import { filterSongs, ShuffleBag } from '../src/utils/songPicker'
import type { Song } from '../src/types'

// ── Minimal mock songs ────────────────────────────────────────────────────────

const mockSongs: Song[] = [
  { id: 'shape-of-you', title: 'Shape of You', artist: 'Ed Sheeran', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/audio/a.mp3' },
  { id: 'bohemian', title: 'Bohemian Rhapsody', artist: 'Queen', lang: 'en', genre: 'rock', difficulty: 'easy', audio: '/audio/b.mp3' },
  { id: 'dont-start-now', title: "Don't Start Now", artist: 'Dua Lipa', lang: 'en', genre: 'pop', difficulty: 'medium', audio: '/audio/c.mp3' },
  { id: 'alright', title: 'Alright', artist: 'Kendrick Lamar', lang: 'en', genre: 'hiphop', difficulty: 'medium', audio: '/audio/d.mp3' },
  { id: 'hallowed', title: 'Hallowed Be Thy Name', artist: 'Iron Maiden', lang: 'en', genre: 'metal', difficulty: 'hard', audio: '/audio/e.mp3' },
  { id: 'amnestia', title: 'Amnestia na neveru', artist: 'Elán', lang: 'sk', genre: 'pop', difficulty: 'easy', audio: '/audio/f.mp3' },
  { id: 'horehronie', title: 'Horehronie', artist: 'Kristína', lang: 'sk', genre: 'pop', difficulty: 'easy', audio: '/audio/g.mp3' },
  { id: 'vyznanie', title: 'Vyznanie', artist: 'Marika Gombitová', lang: 'sk', genre: 'pop', difficulty: 'medium', audio: '/audio/h.mp3' },
]

// ── filterSongs ───────────────────────────────────────────────────────────────

describe('filterSongs', () => {
  it('filters EN easy pop songs', () => {
    const result = filterSongs(mockSongs, 'en', ['pop'], 'easy')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('shape-of-you')
  })

  it('filters EN easy all genres', () => {
    const result = filterSongs(mockSongs, 'en', ['pop', 'rock', 'hiphop', 'rnb', 'electronic', 'metal', 'country', 'indie'], 'easy')
    expect(result).toHaveLength(2)
    expect(result.map((s) => s.id)).toContain('shape-of-you')
    expect(result.map((s) => s.id)).toContain('bohemian')
  })

  it('filters EN medium multiple genres', () => {
    const result = filterSongs(mockSongs, 'en', ['pop', 'hiphop'], 'medium')
    expect(result).toHaveLength(2)
    const ids = result.map((s) => s.id)
    expect(ids).toContain('dont-start-now')
    expect(ids).toContain('alright')
  })

  it('filters SK easy', () => {
    const result = filterSongs(mockSongs, 'sk', [], 'easy')
    expect(result).toHaveLength(2)
    const ids = result.map((s) => s.id)
    expect(ids).toContain('amnestia')
    expect(ids).toContain('horehronie')
  })

  it('filters SK medium', () => {
    const result = filterSongs(mockSongs, 'sk', [], 'medium')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('vyznanie')
  })

  it('returns empty array for SK hard (no songs)', () => {
    const result = filterSongs(mockSongs, 'sk', [], 'hard')
    expect(result).toHaveLength(0)
  })

  it('returns empty array when no genres match', () => {
    const result = filterSongs(mockSongs, 'en', ['country'], 'easy')
    expect(result).toHaveLength(0)
  })

  it('genre filter is ignored for SK songs', () => {
    // When lang === 'sk', the genres parameter is ignored entirely.
    // SK songs are returned regardless of what genres array contains.
    const resultWithRock = filterSongs(mockSongs, 'sk', ['rock'], 'easy')
    const resultWithEmpty = filterSongs(mockSongs, 'sk', [], 'easy')
    const resultWithAll = filterSongs(mockSongs, 'sk', ['pop', 'rock', 'hiphop'], 'easy')

    // All should return the same SK easy songs (genres don't apply)
    expect(resultWithRock).toHaveLength(2)
    expect(resultWithEmpty).toHaveLength(2)
    expect(resultWithAll).toHaveLength(2)

    // And they should all be the SK songs
    for (const result of [resultWithRock, resultWithEmpty, resultWithAll]) {
      expect(result.every((s) => s.lang === 'sk')).toBe(true)
    }
  })
})

// ── ShuffleBag ────────────────────────────────────────────────────────────────

describe('ShuffleBag', () => {
  const pool = mockSongs.slice(0, 4) // 4 songs

  it('picks songs without repeating until all are exhausted', () => {
    const bag = new ShuffleBag(pool)
    const picked = new Set<string>()
    for (let i = 0; i < pool.length; i++) {
      const song = bag.pick()
      expect(song).toBeDefined()
      expect(picked.has(song!.id)).toBe(false)
      picked.add(song!.id)
    }
    expect(picked.size).toBe(pool.length)
  })

  it('refills after all songs are exhausted', () => {
    const bag = new ShuffleBag(pool)
    // Exhaust first cycle
    for (let i = 0; i < pool.length; i++) bag.pick()
    // Second cycle should still work
    const song = bag.pick()
    expect(song).toBeDefined()
    expect(pool.map((s) => s.id)).toContain(song!.id)
  })

  it('returns undefined for empty pool', () => {
    const bag = new ShuffleBag([])
    expect(bag.pick()).toBeUndefined()
  })

  it('reports correct size', () => {
    const bag = new ShuffleBag(pool)
    expect(bag.size).toBe(pool.length)
  })

  it('resets correctly', () => {
    const bag = new ShuffleBag(pool)
    // Exhaust fully
    for (let i = 0; i < pool.length; i++) bag.pick()
    const newPool = mockSongs.slice(4, 6)
    bag.reset(newPool)
    expect(bag.size).toBe(newPool.length)
    const song = bag.pick()
    expect(song).toBeDefined()
    expect(newPool.map((s) => s.id)).toContain(song!.id)
  })

  it('over many cycles, all songs appear roughly equally', () => {
    const bag = new ShuffleBag(pool)
    const counts: Record<string, number> = {}
    const CYCLES = 10
    for (let i = 0; i < pool.length * CYCLES; i++) {
      const song = bag.pick()!
      counts[song.id] = (counts[song.id] ?? 0) + 1
    }
    // Each song should appear exactly CYCLES times
    for (const id of pool.map((s) => s.id)) {
      expect(counts[id]).toBe(CYCLES)
    }
  })
})
