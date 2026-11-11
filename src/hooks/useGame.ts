import { useCallback, useEffect, useRef, useState } from 'react'
import type { Song, GameState, GuessEntry, Filters, Difficulty, Genre, SkType } from '../types'
import { MAX_ATTEMPTS, CLIP_DURATIONS, ALL_GENRES, ALL_SK_TYPES } from '../types'
import { filterEnSongs, filterSkSongs, ShuffleBag, getClipDuration } from '../utils/songPicker'
import { removeItem, STORAGE_KEYS } from '../utils/storage'
import { useAudio } from './useAudio'
import songsData from '../data/songs.json'
import type { UseAudioReturn } from './useAudio'

const allSongs = songsData as Song[]

// ── Default filter state ──────────────────────────────────────────────────────

const DEFAULT_FILTERS: Filters = {
  skMode: false,
  skTypes: [...ALL_SK_TYPES],
  genres: [...ALL_GENRES],
  difficulty: 'easy',
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseGameReturn {
  gameState: GameState
  filters: Filters
  filteredSongs: Song[]
  allSongsForMode: Song[]  // all SK or all EN songs (for guess input)
  audio: UseAudioReturn
  actions: {
    setSkMode: (on: boolean) => void
    setSkTypes: (t: SkType[]) => void
    setDifficulty: (d: Difficulty) => void
    setGenres: (g: Genre[]) => void
    playClip: () => Promise<void>
    playFull: () => Promise<void>
    submitGuess: (songId: string) => void
    skipAttempt: () => void
    nextSong: () => void
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function useGame(): UseGameReturn {
  // ── Filters ───────────────────────────────────────────────────────────────
  // Always start with fresh default filters on every page load/reload.
  // Settings are intentionally not remembered across reloads to avoid any stale/broken states.
  const [filters, setFilters] = useState<Filters>(() => {
    // Actively purge any legacy stored filters from localStorage
    removeItem(STORAGE_KEYS.FILTERS)
    return { ...DEFAULT_FILTERS }
  })

  // ── Song pool ─────────────────────────────────────────────────────────────
  const filteredSongs: Song[] = filters.skMode
    ? filterSkSongs(allSongs, filters.skTypes)
    : filterEnSongs(allSongs, filters.genres, filters.difficulty)

  // All songs for the current mode (for guess input – not filtered by skType/genre/difficulty)
  const allSongsForMode: Song[] = filters.skMode
    ? allSongs.filter((s) => s.lang === 'sk')
    : allSongs.filter((s) => s.lang === 'en')

  const bagRef = useRef<ShuffleBag>(new ShuffleBag(filteredSongs))

  // Always keep a ref to the latest filteredSongs so effects never use stale closures
  const filteredSongsRef = useRef<Song[]>(filteredSongs)
  filteredSongsRef.current = filteredSongs

  // ── Audio ──────────────────────────────────────────────────────────────────
  const audio = useAudio()

  // Guard: holds the timer ID of any pending auto-play so we can cancel it
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Game state ────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>({
    currentSong: null,
    guesses: [],
    attempt: 0,
    phase: 'idle',
    isPlaying: false,
  })

  // Mirror isPlaying from audio into gameState
  useEffect(() => {
    setGameState((prev) => ({ ...prev, isPlaying: audio.isPlaying }))
  }, [audio.isPlaying])

  // ── When filters change – reset bag and start a new game ──────────────────
  // Use a ref so that the filterKey effect always calls the latest version
  // without needing it in the dependency array (avoids stale closure on production builds).
  const startNewGameFn = (pool: Song[]) => {
    audio.stop()
    if (autoPlayTimerRef.current !== null) {
      clearTimeout(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }
    bagRef.current.reset(pool)
    const song = bagRef.current.pick()
    setGameState({
      currentSong: song ?? null,
      guesses: [],
      attempt: 0,
      phase: song ? 'playing' : 'idle',
      isPlaying: false,
    })
  }
  const startNewGameRef = useRef(startNewGameFn)
  startNewGameRef.current = startNewGameFn

  // Single effect handles both initial mount and filter changes.
  // prevFilterKeyRef starts as null so the very first filterKey value always
  // triggers a game start (covers the initial load in production mode).
  const safeSkTypes = Array.isArray(filters.skTypes) && filters.skTypes.length > 0 ? filters.skTypes : ALL_SK_TYPES
  const safeGenres = Array.isArray(filters.genres) && filters.genres.length > 0 ? filters.genres : ALL_GENRES
  const filterKey = filters.skMode
    ? `sk|${safeSkTypes.slice().sort().join(',')}`
    : `en|${safeGenres.slice().sort().join(',')}|${filters.difficulty ?? 'easy'}`

  const prevFilterKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return
    prevFilterKeyRef.current = filterKey
    startNewGameRef.current(filteredSongsRef.current)
  }, [filterKey])

  // ── Actions ───────────────────────────────────────────────────────────────

  const playClip = useCallback(async () => {
    const { currentSong, attempt, phase } = gameState
    if (!currentSong || (phase !== 'playing' && phase !== 'won' && phase !== 'lost')) return
    const offset = currentSong.clipStart ?? 0
    const duration = getClipDuration(attempt)
    await audio.play(currentSong.audio, offset, duration)
  }, [gameState, audio])

  const playFull = useCallback(async () => {
    const { currentSong, phase } = gameState
    if (!currentSong || (phase !== 'won' && phase !== 'lost')) return
    const offset = currentSong.clipStart ?? 0
    await audio.play(currentSong.audio, offset, CLIP_DURATIONS[CLIP_DURATIONS.length - 1])
  }, [gameState, audio])

  const advanceAttempt = useCallback((guessEntry: GuessEntry) => {
    setGameState((prev) => {
      const guesses = [...prev.guesses, guessEntry]
      const nextAttempt = prev.attempt + 1
      const isLost = nextAttempt >= MAX_ATTEMPTS
      return {
        ...prev,
        guesses,
        attempt: isLost ? prev.attempt : nextAttempt,
        phase: isLost ? 'lost' : 'playing',
      }
    })
  }, [])

  const submitGuess = useCallback((songId: string) => {
    const { currentSong, attempt, phase } = gameState
    if (!currentSong || phase !== 'playing') return

    const isCorrect = currentSong.id === songId
    const matchedSong = allSongs.find((s) => s.id === songId)

    const entry: GuessEntry = {
      attempt,
      status: isCorrect ? 'correct' : 'wrong',
      value: matchedSong
        ? `${matchedSong.title} – ${matchedSong.artist}${matchedSong.performer ? ` (${matchedSong.performer})` : ''}`
        : songId,
      clipDuration: getClipDuration(attempt),
    }

    if (isCorrect) {
      setGameState((prev) => ({
        ...prev,
        guesses: [...prev.guesses, entry],
        phase: 'won',
      }))
    } else {
      advanceAttempt(entry)
      // Cancel any pending auto-play before scheduling a new one
      if (autoPlayTimerRef.current !== null) {
        clearTimeout(autoPlayTimerRef.current)
        autoPlayTimerRef.current = null
      }
      audio.stop()
      // Auto-play the longer clip after a wrong guess
      autoPlayTimerRef.current = setTimeout(async () => {
        autoPlayTimerRef.current = null
        const nextAttempt = attempt + 1
        if (nextAttempt < MAX_ATTEMPTS && currentSong) {
          const offset = currentSong.clipStart ?? 0
          const duration = getClipDuration(nextAttempt)
          await audio.play(currentSong.audio, offset, duration)
        }
      }, 300)
    }
  }, [gameState, advanceAttempt, audio])

  const skipAttempt = useCallback(() => {
    const { currentSong, attempt, phase } = gameState
    if (!currentSong || phase !== 'playing') return

    const entry: GuessEntry = {
      attempt,
      status: 'skipped',
      value: '',
      clipDuration: getClipDuration(attempt),
    }

    advanceAttempt(entry)

    // Cancel any pending auto-play before scheduling a new one
    if (autoPlayTimerRef.current !== null) {
      clearTimeout(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }
    audio.stop()
    // Auto-play the longer clip
    autoPlayTimerRef.current = setTimeout(async () => {
      autoPlayTimerRef.current = null
      const nextAttempt = attempt + 1
      if (nextAttempt < MAX_ATTEMPTS && currentSong) {
        const offset = currentSong.clipStart ?? 0
        const duration = getClipDuration(nextAttempt)
        await audio.play(currentSong.audio, offset, duration)
      }
    }, 300)
  }, [gameState, advanceAttempt, audio])

  const nextSong = useCallback(() => {
    audio.stop()
    if (autoPlayTimerRef.current !== null) {
      clearTimeout(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }
    // Always sync bag with latest filteredSongs (catches mode/filter changes)
    bagRef.current.reset(filteredSongsRef.current)
    const song = bagRef.current.pick(gameState.currentSong?.id)
    setGameState({
      currentSong: song ?? null,
      guesses: [],
      attempt: 0,
      phase: song ? 'playing' : 'idle',
      isPlaying: false,
    })
  }, [audio, gameState.currentSong?.id])

  // ── Filter setters ────────────────────────────────────────────────────────

  const setSkMode = useCallback((on: boolean) => {
    setFilters((prev) => ({
      ...prev,
      skMode: on,
      skTypes: Array.isArray(prev.skTypes) && prev.skTypes.length > 0 ? prev.skTypes : [...ALL_SK_TYPES],
    }))
  }, [])

  const setSkTypes = useCallback((t: SkType[]) => {
    setFilters((prev) => ({ ...prev, skTypes: t }))
  }, [])

  const setDifficulty = useCallback((d: Difficulty) => {
    setFilters((prev) => ({ ...prev, difficulty: d }))
  }, [])

  const setGenres = useCallback((g: Genre[]) => {
    setFilters((prev) => ({ ...prev, genres: g }))
  }, [])

  return {
    gameState,
    filters,
    filteredSongs,
    allSongsForMode,
    audio,
    actions: {
      setSkMode,
      setSkTypes,
      setDifficulty,
      setGenres,
      playClip,
      playFull,
      submitGuess,
      skipAttempt,
      nextSong,
    },
  }
}
