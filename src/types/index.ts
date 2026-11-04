// ─────────────────────────────────────────────
// Core domain types for Nápev
// ─────────────────────────────────────────────

export type Lang = 'sk' | 'en'

export type Genre =
  | 'pop'
  | 'rock'
  | 'hiphop'
  | 'rnb'
  | 'electronic'
  | 'metal'
  | 'country'
  | 'indie'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Song {
  id: string
  title: string
  artist: string
  lang: Lang
  genre: Genre
  difficulty: Difficulty
  /** Path relative to public/, e.g. /audio/shape-of-you.mp3 */
  audio: string
  /** Start offset in seconds for the clip (default: 0) */
  clipStart?: number
}

// ─────────────────────────────────────────────
// Game state types
// ─────────────────────────────────────────────

export type GuessStatus = 'correct' | 'wrong' | 'skipped'

export interface GuessEntry {
  attempt: number
  status: GuessStatus
  /** The text the player typed/selected (empty string for skipped) */
  value: string
  /** Clip duration played for this attempt (seconds) */
  clipDuration: number
}

export type GamePhase =
  | 'idle'      // between songs / initial
  | 'playing'   // active guessing
  | 'won'       // correct guess
  | 'lost'      // used all 6 attempts

export interface GameState {
  currentSong: Song | null
  guesses: GuessEntry[]
  attempt: number          // 0-based, 0–5
  phase: GamePhase
  isPlaying: boolean
}

// ─────────────────────────────────────────────
// Filter / settings types
// ─────────────────────────────────────────────

export interface Filters {
  lang: 'sk' | 'en'
  genres: Genre[]          // only used when lang === 'en'
  difficulty: Difficulty
}

// ─────────────────────────────────────────────
// Statistics types
// ─────────────────────────────────────────────

/** Distribution of which attempt number (1-6) the song was guessed on */
export type GuessDistribution = Record<number, number> // key = attempt (1–6)

export interface DifficultyStats {
  played: number
  won: number
  currentStreak: number
  bestStreak: number
  distribution: GuessDistribution
}

export type AllStats = Record<Difficulty, DifficultyStats>

// ─────────────────────────────────────────────
// Genre display info
// ─────────────────────────────────────────────

export const GENRE_LABELS: Record<Genre, string> = {
  pop: 'Pop',
  rock: 'Rock',
  hiphop: 'Hip-hop',
  rnb: 'R&B',
  electronic: 'Elektronika',
  metal: 'Metal',
  country: 'Country',
  indie: 'Indie',
}

export const ALL_GENRES: Genre[] = [
  'pop', 'rock', 'hiphop', 'rnb', 'electronic', 'metal', 'country', 'indie',
]

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Ľahká',
  medium: 'Stredná',
  hard: 'Ťažká',
}

/** Clip durations in seconds for each attempt (index = attempt number 0–5) */
export const CLIP_DURATIONS = [1, 2, 3, 5, 7, 10] as const

export const MAX_ATTEMPTS = CLIP_DURATIONS.length // 6
