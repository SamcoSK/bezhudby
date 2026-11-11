import { useCallback, useEffect, useRef, useState } from 'react'
import type { Song, GameState, GuessEntry, Filters, Difficulty, Genre, SkType } from '../types'
import { MAX_ATTEMPTS, CLIP_DURATIONS, ALL_GENRES, ALL_SK_TYPES } from '../types'
import { filterEnSongs, filterSkSongs, ShuffleBag, getClipDuration } from '../utils/songPicker'
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage'
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
  const [filters, setFilters] = useState<Filters>(() =>
    getItem<Filters>(STORAGE_KEYS.FILTERS, DEFAULT_FILTERS),
  )

  // Persist filters
  useEffect(() => {
    setItem(STORAGE_KEYS.FILTERS, filters)
  }, [filters])

  // ── Song pool ─────────────────────────────────────────────────────────────
  const filteredSongs: Song[] = filters.skMode
    ? filterSkSongs(allSongs, filters.skTypes)
    : filterEnSongs(allSongs, filters.genres, filters.difficulty)

  // All songs for the current mode (for guess input – not filtered by skType/genre/difficulty)
  const allSongsForMode: Song[] = filters.skMode
    ? allSongs.filter((s) => s.lang === 'sk')
    : allSongs.filter((s) => s.lang === 'en')

  const bagRef = useRef<ShuffleBag>(new ShuffleBag(filteredSongs))

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
  const startNewGame = useCallback((pool: Song[]) => {
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
  }, [audio])

  // Track previous filter key to detect changes
  const prevFilterKeyRef = useRef<string>('')
  const filterKey = filters.skMode
    ? `sk|${filters.skTypes.slice().sort().join(',')}`
    : `en|${filters.genres.slice().sort().join(',')}|${filters.difficulty}`

  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return
    prevFilterKeyRef.current = filterKey
    startNewGame(filteredSongs)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  // Initial game start
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    startNewGame(filteredSongs)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    // Make sure bag pool is aligned with current filteredSongs
    if (bagRef.current.size !== filteredSongs.length) {
      bagRef.current.reset(filteredSongs)
    }
    const song = bagRef.current.pick(gameState.currentSong?.id)
    setGameState({
      currentSong: song ?? null,
      guesses: [],
      attempt: 0,
      phase: song ? 'playing' : 'idle',
      isPlaying: false,
    })
  }, [audio, filteredSongs, gameState.currentSong?.id])

  // ── Filter setters ────────────────────────────────────────────────────────

  const setSkMode = useCallback((on: boolean) => {
    setFilters((prev) => ({ ...prev, skMode: on }))
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
