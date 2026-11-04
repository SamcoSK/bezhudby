import { useCallback } from 'react'
import type { AllStats, Difficulty, DifficultyStats, GuessDistribution } from '../types'
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage'

const DEFAULT_DIFFICULTY_STATS: DifficultyStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  bestStreak: 0,
  distribution: {},
}

const DEFAULT_STATS: AllStats = {
  easy: { ...DEFAULT_DIFFICULTY_STATS, distribution: {} as GuessDistribution },
  medium: { ...DEFAULT_DIFFICULTY_STATS, distribution: {} as GuessDistribution },
  hard: { ...DEFAULT_DIFFICULTY_STATS, distribution: {} as GuessDistribution },
}

export interface UseStatsReturn {
  getStats: () => AllStats
  recordResult: (difficulty: Difficulty, won: boolean, attemptNumber?: number) => void
  resetStats: () => void
}

export function useStats(): UseStatsReturn {
  const getStats = useCallback((): AllStats => {
    return getItem<AllStats>(STORAGE_KEYS.STATS, DEFAULT_STATS)
  }, [])

  /**
   * Record a game result.
   * @param difficulty  The difficulty the game was played on
   * @param won         Whether the player guessed correctly
   * @param attemptNumber  1-based attempt on which they guessed (undefined if lost)
   */
  const recordResult = useCallback((
    difficulty: Difficulty,
    won: boolean,
    attemptNumber?: number,
  ) => {
    const stats = getStats()
    const ds = stats[difficulty] ?? { ...DEFAULT_DIFFICULTY_STATS }

    ds.played += 1

    if (won) {
      ds.won += 1
      ds.currentStreak += 1
      if (ds.currentStreak > ds.bestStreak) ds.bestStreak = ds.currentStreak
      if (attemptNumber !== undefined) {
        ds.distribution[attemptNumber] = (ds.distribution[attemptNumber] ?? 0) + 1
      }
    } else {
      ds.currentStreak = 0
    }

    stats[difficulty] = ds
    setItem(STORAGE_KEYS.STATS, stats)
  }, [getStats])

  const resetStats = useCallback(() => {
    setItem(STORAGE_KEYS.STATS, DEFAULT_STATS)
  }, [])

  return { getStats, recordResult, resetStats }
}
