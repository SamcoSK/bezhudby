// ─────────────────────────────────────────────
// Core domain types for Bezhudby
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

/** Type of Slovak song: modern (2010+), OG classic (pre-2010), or folk (ľudová) */
export type SkType = 'modern' | 'og' | 'folk'

export interface Song {
  id: string
  title: string
  /** For folk songs, set artist to "ľudová pieseň" */
  artist: string
  lang: Lang
  /** Only used for English songs */
  genre?: Genre
  /** Only used for English songs */
  difficulty?: Difficulty
  /** Slovak songs only: "modern" | "og" | "folk" */
  skType?: SkType
  /**
   * For folk songs: optional performer name (e.g. choir or ensemble).
   * Display as "(Performer)" in the guess list.
   */
  performer?: string
  /** Optional verification/TODO note */
  comment?: string
  /** URL or path relative to public/, e.g. /audio/shape-of-you.mp3 */
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
  /** true = SK mode (skTypes active), false = EN mode (genres + difficulty active) */
  skMode: boolean
  /** Active SK types (only when skMode === true) */
  skTypes: SkType[]
  /** Active EN genres (only when skMode === false) */
  genres: Genre[]
  /** Active EN difficulty (only when skMode === false) */
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

/**
 * Stats are stored per category:
 *  - 'sk'    = all Slovak songs combined
 *  - 'easy'  = EN easy
 *  - 'medium'= EN medium
 *  - 'hard'  = EN hard
 */
export type StatsCategory = Difficulty | 'sk'
export type AllStats = Record<StatsCategory, DifficultyStats>

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

export const SK_TYPE_LABELS: Record<SkType, string> = {
  modern: 'Moderné',
  og: 'OG',
  folk: 'Ľudovky',
}

export const ALL_SK_TYPES: SkType[] = ['modern', 'og', 'folk']

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Ľahká',
  medium: 'Stredná',
  hard: 'Ťažká',
}

/** Clip durations in seconds for each attempt (index = attempt number 0–5) */
export const CLIP_DURATIONS = [1, 2, 3, 5, 7, 10] as const

export const MAX_ATTEMPTS = CLIP_DURATIONS.length // 6
