/**
 * useStats hook – reads/writes stats from Firestore (logged-in) or localStorage (guest).
 * Firestore writes happen only after a round ends (called from GameScreen).
 */
import { useCallback, useRef } from 'react'
import type { User } from 'firebase/auth'
import type { AllStats, StatsCategory, DifficultyStats, GuessDistribution } from '../types'
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage'
import { loadUserStats, saveUserStats } from '../lib/firestore'

const DEFAULT_DIFFICULTY_STATS: DifficultyStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  bestStreak: 0,
  distribution: {},
}

export const DEFAULT_STATS: AllStats = {
  sk:     { ...DEFAULT_DIFFICULTY_STATS, distribution: {} as GuessDistribution },
  easy:   { ...DEFAULT_DIFFICULTY_STATS, distribution: {} as GuessDistribution },
  medium: { ...DEFAULT_DIFFICULTY_STATS, distribution: {} as GuessDistribution },
  hard:   { ...DEFAULT_DIFFICULTY_STATS, distribution: {} as GuessDistribution },
}

export interface UseStatsReturn {
  getStats: () => AllStats
  recordResult: (category: StatsCategory, won: boolean, attemptNumber?: number) => Promise<void>
  resetStats: () => Promise<void>
  /** Call after a round ends to sync to Firestore (no-op for guests) */
  syncToCloud: (stats: AllStats) => void
}

export function useStats(user: User | null): UseStatsReturn {
  // In-memory cache for logged-in user (avoid extra Firestore reads during same session)
  const cloudStatsCache = useRef<AllStats | null>(null)
  // Track whether we've loaded cloud stats for this user
  const loadedForUid = useRef<string | null>(null)

  // ── Read stats ────────────────────────────────────────────────────────────
  const getStats = useCallback((): AllStats => {
    if (user) {
      // Return cached cloud stats (may be null before first load; fall back to localStorage)
      return cloudStatsCache.current ?? getLocalStats()
    }
    return getLocalStats()
  }, [user])

  const getLocalStats = (): AllStats => {
    const stored = getItem<AllStats>(STORAGE_KEYS.STATS, DEFAULT_STATS)
    if (!stored.sk) stored.sk = { ...DEFAULT_DIFFICULTY_STATS, distribution: {} }
    return stored
  }

  // ── Load cloud stats (call once after login) ──────────────────────────────
  const ensureCloudLoaded = useCallback(async (): Promise<AllStats> => {
    if (!user) return getLocalStats()
    if (loadedForUid.current === user.uid && cloudStatsCache.current) {
      return cloudStatsCache.current
    }
    const remote = await loadUserStats(user.uid)
    const stats = remote ?? getLocalStats()
    cloudStatsCache.current = stats
    loadedForUid.current = user.uid
    return stats
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // ── Sync to cloud (called after round) ───────────────────────────────────
  const syncToCloud = useCallback((stats: AllStats) => {
    if (!user) return
    cloudStatsCache.current = stats
    // Fire-and-forget – errors are swallowed in saveUserStats
    saveUserStats(user.uid, stats)
  }, [user])

  // ── Record result ─────────────────────────────────────────────────────────
  const recordResult = useCallback(async (
    category: StatsCategory,
    won: boolean,
    attemptNumber?: number,
  ): Promise<void> => {
    const stats = await ensureCloudLoaded()
    const ds = stats[category] ?? { ...DEFAULT_DIFFICULTY_STATS }

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

    stats[category] = ds

    if (user) {
      cloudStatsCache.current = stats
      syncToCloud(stats)
    } else {
      setItem(STORAGE_KEYS.STATS, stats)
    }
  }, [ensureCloudLoaded, syncToCloud, user])

  // ── Reset stats ───────────────────────────────────────────────────────────
  const resetStats = useCallback(async (): Promise<void> => {
    const fresh = { ...DEFAULT_STATS }
    if (user) {
      cloudStatsCache.current = fresh
      syncToCloud(fresh)
    } else {
      setItem(STORAGE_KEYS.STATS, fresh)
    }
  }, [user, syncToCloud])

  return { getStats, recordResult, resetStats, syncToCloud }
}
