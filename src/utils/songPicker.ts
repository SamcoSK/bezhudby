import type { Song, Lang, Genre, Difficulty, SkType } from '../types'
import { CLIP_DURATIONS, ALL_GENRES, ALL_SK_TYPES } from '../types'

// ─────────────────────────────────────────────
// Filter helpers
// ─────────────────────────────────────────────

/**
 * Returns EN songs matching the given genres and difficulty.
 */
export function filterEnSongs(
  songs: Song[],
  genres: Genre[] = ALL_GENRES,
  difficulty: Difficulty = 'easy',
): Song[] {
  if (!genres || genres.length === 0) return []
  return songs.filter((s) => {
    if (!s.title || !s.artist) return false
    if (!s.audio || s.audio.includes('fallback')) return false
    if (s.lang !== 'en') return false
    if (s.difficulty !== difficulty) return false
    if (s.genre && !genres.includes(s.genre)) return false
    return true
  })
}

/**
 * Returns SK songs matching the given skTypes.
 */
export function filterSkSongs(
  songs: Song[],
  skTypes: SkType[] = ALL_SK_TYPES,
): Song[] {
  if (!skTypes || skTypes.length === 0) return []
  return songs.filter((s) => {
    if (!s.title || !s.artist) return false
    if (!s.audio || s.audio.includes('fallback')) return false
    if (s.lang !== 'sk') return false
    if (!skTypes.includes(s.skType ?? 'modern')) return false
    return true
  })
}

/**
 * Legacy unified filter – kept for backward compat with tests.
 * @deprecated Use filterEnSongs / filterSkSongs directly.
 */
export function filterSongs(
  songs: Song[],
  lang: Lang,
  genres: Genre[],
  difficulty: Difficulty,
): Song[] {
  if (lang === 'sk') {
    return filterSkSongs(songs, ['modern', 'og', 'folk'])
  }
  return filterEnSongs(songs, genres, difficulty)
}

// ─────────────────────────────────────────────
// Clip duration helpers
// ─────────────────────────────────────────────

/**
 * Returns the clip duration in seconds for a given attempt index (0-based).
 * Attempt 0 → 1 s, attempt 5 → 10 s.
 */
export function getClipDuration(attempt: number): number {
  const idx = Math.max(0, Math.min(attempt, CLIP_DURATIONS.length - 1))
  return CLIP_DURATIONS[idx]
}

// ─────────────────────────────────────────────
// Shuffle bag – plays each song once before repeating
// ─────────────────────────────────────────────

/**
 * ShuffleBag ensures every song in the pool is played before any repeats.
 * When the pool is exhausted it refills and reshuffles automatically.
 *
 * Songs are interleaved so the same artist never plays back-to-back.
 *
 * Usage:
 *   const bag = new ShuffleBag(songs)
 *   const song = bag.pick()   // never undefined if pool is non-empty
 */
export class ShuffleBag {
  private pool: Song[]
  private remaining: Song[]

  constructor(pool: Song[]) {
    this.pool = [...pool]
    this.remaining = this.interleaveByArtist(this.shuffle([...pool]))
  }

  /** Update the pool (e.g. when filters change). Resets the bag. */
  reset(pool: Song[]): void {
    this.pool = [...pool]
    this.remaining = this.interleaveByArtist(this.shuffle([...pool]))
  }

  /** Pick the next song. Returns undefined if pool is empty. */
  pick(currentSongId?: string): Song | undefined {
    if (this.pool.length === 0) return undefined
    if (this.remaining.length === 0) {
      this.remaining = this.interleaveByArtist(this.shuffle([...this.pool]))
    }

    // Pop candidate; if same artist as current song, try to swap with a different artist
    let candidate = this.remaining.pop()!
    if (this.pool.length > 1 && currentSongId) {
      const currentSong = this.pool.find((s) => s.id === currentSongId)
      if (currentSong && candidate.artist === currentSong.artist && this.remaining.length > 0) {
        // Find a song from a different artist to swap with (search from end)
        let swapIdx = -1
        for (let i = this.remaining.length - 1; i >= 0; i--) {
          if (this.remaining[i].artist !== currentSong.artist) { swapIdx = i; break }
        }
        if (swapIdx !== -1) {
          const temp = this.remaining[swapIdx]
          this.remaining[swapIdx] = candidate
          candidate = temp
        }
      }
    }
    return candidate
  }

  get size(): number {
    return this.pool.length
  }

  /**
   * Interleave songs from the same artist so they're spread out evenly.
   * Uses a round-robin over artist groups after shuffling within each group.
   * Returns the array in "pop from end" order (last element = first to play).
   */
  private interleaveByArtist(songs: Song[]): Song[] {
    // Group by artist
    const groups = new Map<string, Song[]>()
    for (const s of songs) {
      const key = s.artist.toLowerCase()
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(s)
    }

    // Shuffle the order of artist groups themselves
    const artistKeys = this.shuffle([...groups.keys()])
    const queues = artistKeys.map((k) => groups.get(k)!)

    // Round-robin: take one song per artist group at a time
    const result: Song[] = []
    let anyLeft = true
    while (anyLeft) {
      anyLeft = false
      for (const q of queues) {
        if (q.length > 0) {
          result.push(q.pop()!)
          anyLeft = true
        }
      }
    }

    // Result is in play order; reverse so we can use .pop() efficiently
    return result.reverse()
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
}
