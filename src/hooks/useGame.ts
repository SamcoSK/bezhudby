import { useCallback, useEffect, useRef, useState } from 'react'
import type { Song, GameState, GuessEntry, Filters, Difficulty, Genre } from '../types'
import { MAX_ATTEMPTS, CLIP_DURATIONS, ALL_GENRES } from '../types'
import { filterSongs, ShuffleBag, getClipDuration } from '../utils/songPicker'
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage'
import { useAudio } from './useAudio'
import songsData from '../data/songs.json'
import type { UseAudioReturn } from './useAudio'

const allSongs = songsData as Song[]

// ── Default filter state ──────────────────────────────────────────────────────

const DEFAULT_FILTERS: Filters = {
  lang: 'en',
  genres: [...ALL_GENRES],
  difficulty: 'easy',
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseGameReturn {
  gameState: GameState
  filters: Filters
  filteredSongs: Song[]
  allSongsForLang: Song[]
  audio: UseAudioReturn
  actions: {
    setDifficulty: (d: Difficulty) => void
    setGenres: (g: Genre[]) => void
    setLang: (l: 'sk' | 'en') => void
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
  const filteredSongs = filterSongs(allSongs, filters.lang, filters.genres, filters.difficulty)
  const allSongsForLang = allSongs.filter((s) => s.lang === filters.lang)

  const bagRef = useRef<ShuffleBag>(new ShuffleBag(filteredSongs))

  // ── Audio ──────────────────────────────────────────────────────────────────
  const audio = useAudio()

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
  const filterKey = `${filters.lang}|${filters.genres.slice().sort().join(',')}|${filters.difficulty}`

  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return
    prevFilterKeyRef.current = filterKey
    const pool = filterSongs(allSongs, filters.lang, filters.genres, filters.difficulty)
    startNewGame(pool)
  }, [filterKey, filters, startNewGame])

  // Initial game start
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    const pool = filterSongs(allSongs, filters.lang, filters.genres, filters.difficulty)
    startNewGame(pool)
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
      value: matchedSong ? `${matchedSong.title} – ${matchedSong.artist}` : songId,
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
      // Auto-play the longer clip after a wrong guess
      setTimeout(async () => {
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

    // Auto-play the longer clip
    setTimeout(async () => {
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

  // ── Filter setters (each resets the game) ─────────────────────────────────

  const setDifficulty = useCallback((d: Difficulty) => {
    setFilters((prev) => ({ ...prev, difficulty: d }))
  }, [])

  const setGenres = useCallback((g: Genre[]) => {
    setFilters((prev) => ({ ...prev, genres: g }))
  }, [])

  const setLang = useCallback((l: 'sk' | 'en') => {
    setFilters((prev) => ({ ...prev, lang: l, genres: ALL_GENRES }))
  }, [])

  return {
    gameState,
    filters,
    filteredSongs,
    allSongsForLang,
    audio,
    actions: {
      setDifficulty,
      setGenres,
      setLang,
      playClip,
      playFull,
      submitGuess,
      skipAttempt,
      nextSong,
    },
  }
}
