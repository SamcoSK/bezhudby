import { describe, it, expect } from 'vitest'
import { filterEnSongs, filterSkSongs, filterSongs, ShuffleBag } from '../src/utils/songPicker'
import type { Song } from '../src/types'

// ── Minimal mock songs ────────────────────────────────────────────────────────

const mockSongs: Song[] = [
  // EN songs
  { id: 'shape-of-you', title: 'Shape of You', artist: 'Ed Sheeran', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/audio/a.mp3' },
  { id: 'bohemian', title: 'Bohemian Rhapsody', artist: 'Queen', lang: 'en', genre: 'rock', difficulty: 'easy', audio: '/audio/b.mp3' },
  { id: 'dont-start-now', title: "Don't Start Now", artist: 'Dua Lipa', lang: 'en', genre: 'pop', difficulty: 'medium', audio: '/audio/c.mp3' },
  { id: 'alright', title: 'Alright', artist: 'Kendrick Lamar', lang: 'en', genre: 'hiphop', difficulty: 'medium', audio: '/audio/d.mp3' },
  { id: 'hallowed', title: 'Hallowed Be Thy Name', artist: 'Iron Maiden', lang: 'en', genre: 'metal', difficulty: 'hard', audio: '/audio/e.mp3' },
  // SK songs
  { id: 'amnestia', title: 'Amnestia na neveru', artist: 'Elán', lang: 'sk', genre: 'pop', difficulty: 'easy', skType: 'og', audio: '/audio/f.mp3' },
  { id: 'horehronie', title: 'Horehronie', artist: 'Kristína', lang: 'sk', genre: 'pop', difficulty: 'easy', skType: 'og', audio: '/audio/g.mp3' },
  { id: 'vyznanie', title: 'Vyznanie', artist: 'Marika Gombitová', lang: 'sk', genre: 'pop', difficulty: 'medium', skType: 'og', audio: '/audio/h.mp3' },
  { id: 'modern-sk-1', title: 'Nová pieseň', artist: 'Separ', lang: 'sk', genre: 'hiphop', difficulty: 'easy', skType: 'modern', audio: '/audio/i.mp3' },
  { id: 'folk-1', title: 'Tancuj, tancuj', artist: 'ľudová pieseň', lang: 'sk', skType: 'folk', genre: 'pop', difficulty: 'easy', audio: 'fallback' },
]

// ── filterEnSongs ─────────────────────────────────────────────────────────────

describe('filterEnSongs', () => {
  it('filters easy pop songs', () => {
    const result = filterEnSongs(mockSongs, ['pop'], 'easy')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('shape-of-you')
  })

  it('filters all genres', () => {
    const result = filterEnSongs(mockSongs, ['pop', 'rock', 'hiphop', 'rnb', 'electronic', 'metal', 'country', 'indie'], 'easy')
    expect(result).toHaveLength(2)
    expect(result.map((s) => s.id)).toContain('shape-of-you')
    expect(result.map((s) => s.id)).toContain('bohemian')
  })

  it('filters medium multiple genres', () => {
    const result = filterEnSongs(mockSongs, ['pop', 'hiphop'], 'medium')
    expect(result).toHaveLength(2)
    const ids = result.map((s) => s.id)
    expect(ids).toContain('dont-start-now')
    expect(ids).toContain('alright')
  })

  it('excludes SK songs', () => {
    const result = filterEnSongs(mockSongs, ['pop'], 'easy')
    expect(result.every((s) => s.lang === 'en')).toBe(true)
  })

  it('excludes fallback audio', () => {
    const withFallback: Song[] = [
      ...mockSongs,
      { id: 'fallback-en', title: 'Fallback', artist: 'Test', lang: 'en', genre: 'pop', difficulty: 'easy', audio: 'fallback' },
    ]
    const result = filterEnSongs(withFallback, ['pop'], 'easy')
    expect(result.find((s) => s.id === 'fallback-en')).toBeUndefined()
  })
})

// ── filterSkSongs ─────────────────────────────────────────────────────────────

describe('filterSkSongs', () => {
  it('returns all SK types when all selected', () => {
    const result = filterSkSongs(mockSongs, ['modern', 'og', 'folk'])
    // folk-1 has fallback audio, so it's excluded
    expect(result.every((s) => s.lang === 'sk')).toBe(true)
    // Should have amnestia, horehronie, vyznanie (og) + modern-sk-1 (modern)
    // folk-1 is excluded because audio = 'fallback'
    expect(result.map((s) => s.id)).toContain('amnestia')
    expect(result.map((s) => s.id)).toContain('modern-sk-1')
    expect(result.map((s) => s.id)).not.toContain('folk-1') // fallback
  })

  it('filters by skType og only', () => {
    const result = filterSkSongs(mockSongs, ['og'])
    expect(result.every((s) => s.skType === 'og')).toBe(true)
    expect(result.length).toBe(3) // amnestia, horehronie, vyznanie
  })

  it('filters by skType modern only', () => {
    const result = filterSkSongs(mockSongs, ['modern'])
    expect(result.every((s) => s.skType === 'modern')).toBe(true)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('modern-sk-1')
  })

  it('excludes folk songs with fallback audio', () => {
    const result = filterSkSongs(mockSongs, ['folk'])
    expect(result).toHaveLength(0) // folk-1 has fallback audio
  })

  it('returns empty array for empty skTypes', () => {
    const result = filterSkSongs(mockSongs, [])
    expect(result).toHaveLength(0)
  })

  it('excludes EN songs', () => {
    const result = filterSkSongs(mockSongs, ['modern', 'og', 'folk'])
    expect(result.every((s) => s.lang === 'sk')).toBe(true)
  })
})

// ── Last-active skType guard ──────────────────────────────────────────────────

describe('SK type last-active guard', () => {
  it('prevents deactivating the last active skType', () => {
    // Simulate the guard logic from GameScreen
    const handleSkTypeToggle = (current: string[], t: string): string[] => {
      const next = current.includes(t) ? current.filter((x) => x !== t) : [...current, t]
      if (next.length === 0) return current // keep at least one
      return next
    }

    // Deactivating when only one left → stays the same
    expect(handleSkTypeToggle(['og'], 'og')).toEqual(['og'])
    // Deactivating when two left → allowed
    expect(handleSkTypeToggle(['og', 'modern'], 'og')).toEqual(['modern'])
    // Activating → always allowed
    expect(handleSkTypeToggle(['og'], 'modern')).toEqual(['og', 'modern'])
  })
})

// ── filterSongs (legacy) ──────────────────────────────────────────────────────

describe('filterSongs (legacy)', () => {
  it('delegates SK to filterSkSongs with all types', () => {
    const result = filterSongs(mockSongs, 'sk', [], 'easy')
    expect(result.every((s) => s.lang === 'sk')).toBe(true)
  })

  it('delegates EN to filterEnSongs', () => {
    const result = filterSongs(mockSongs, 'en', ['pop'], 'easy')
    expect(result.every((s) => s.lang === 'en')).toBe(true)
  })
})

// ── ShuffleBag ────────────────────────────────────────────────────────────────

describe('ShuffleBag', () => {
  const pool = mockSongs.filter((s) => s.lang === 'en') // 5 EN songs

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
    for (let i = 0; i < pool.length; i++) bag.pick()
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
    for (let i = 0; i < pool.length; i++) bag.pick()
    const newPool = mockSongs.filter((s) => s.lang === 'sk' && s.skType === 'og')
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
    for (const id of pool.map((s) => s.id)) {
      expect(counts[id]).toBe(CYCLES)
    }
  })

  it('anti-clustering: across many picks, consecutive same-artist pairs are rare', () => {
    // 2 songs from each of 3 artists = 6 songs, 3 equal groups = easy to interleave
    const multiArtistPool: Song[] = [
      { id: 'a1', title: 'A1', artist: 'ArtistA', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/a1.mp3' },
      { id: 'a2', title: 'A2', artist: 'ArtistA', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/a2.mp3' },
      { id: 'b1', title: 'B1', artist: 'ArtistB', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/b1.mp3' },
      { id: 'b2', title: 'B2', artist: 'ArtistB', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/b2.mp3' },
      { id: 'c1', title: 'C1', artist: 'ArtistC', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/c1.mp3' },
      { id: 'c2', title: 'C2', artist: 'ArtistC', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/c2.mp3' },
    ]
    const bag = new ShuffleBag(multiArtistPool)
    const picked: Song[] = []
    // Pick 3 full cycles = 18 songs
    for (let i = 0; i < multiArtistPool.length * 3; i++) {
      picked.push(bag.pick()!)
    }
    // Count back-to-back same-artist occurrences
    let consecutive = 0
    for (let i = 1; i < picked.length; i++) {
      if (picked[i].artist === picked[i - 1].artist) consecutive++
    }
    // With balanced groups and interleaving, same-artist back-to-back should be very rare
    // Allow at most 3 out of 17 possible consecutive pairs
    expect(consecutive).toBeLessThanOrEqual(3)
  })
})
