import type { Song, Lang, Genre, Difficulty } from '../types'
import { CLIP_DURATIONS } from '../types'

// ─────────────────────────────────────────────
// Filter helpers
// ─────────────────────────────────────────────

/**
 * Returns songs matching the given language, genres (for EN), and difficulty.
 */
export function filterSongs(
  songs: Song[],
  lang: Lang,
  genres: Genre[],
  difficulty: Difficulty,
): Song[] {
  return songs.filter((s) => {
    // Exclude songs without real playable audio
    if (!s.audio || s.audio.includes('fallback')) return false
    if (s.difficulty !== difficulty) return false
    if (s.lang !== lang) return false
    if (lang === 'en' && genres.length > 0 && !genres.includes(s.genre)) return false
    return true
  })
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
 * Usage:
 *   const bag = new ShuffleBag(songs)
 *   const song = bag.pick()   // never undefined if pool is non-empty
 */
export class ShuffleBag {
  private pool: Song[]
  private remaining: Song[]

  constructor(pool: Song[]) {
    this.pool = [...pool]
    this.remaining = this.shuffle([...pool])
  }

  /** Update the pool (e.g. when filters change). Resets the bag. */
  reset(pool: Song[]): void {
    this.pool = [...pool]
    this.remaining = this.shuffle([...pool])
  }

  /** Pick the next song. Returns undefined if pool is empty. */
  pick(currentSongId?: string): Song | undefined {
    if (this.pool.length === 0) return undefined
    if (this.remaining.length === 0) {
      this.remaining = this.shuffle([...this.pool])
      // If pool has more than 1 song and the last popped would be the same song, swap it
      if (this.pool.length > 1 && currentSongId && this.remaining[this.remaining.length - 1]?.id === currentSongId) {
        const swapIdx = Math.floor(Math.random() * (this.remaining.length - 1))
        const temp = this.remaining[swapIdx]
        this.remaining[swapIdx] = this.remaining[this.remaining.length - 1]
        this.remaining[this.remaining.length - 1] = temp
      }
    }
    return this.remaining.pop()
  }

  get size(): number {
    return this.pool.length
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
}
