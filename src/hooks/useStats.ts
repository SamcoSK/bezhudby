/**
 * useStats hook – reads/writes stats from Firestore for logged-in users only.
 * Guests (non-logged-in users) do NOT have statistics stored.
 * Any existing localStorage guest stats are automatically removed.
 */
import { useCallback, useEffect, useRef } from 'react'
import type { User } from 'firebase/auth'
import type { AllStats, StatsCategory, DifficultyStats, GuessDistribution } from '../types'
import { removeItem, STORAGE_KEYS } from '../utils/storage'
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
  // In-memory cache for logged-in user
  const cloudStatsCache = useRef<AllStats | null>(null)
  const loadedForUid = useRef<string | null>(null)

  // Ensure any legacy guest statistics in localStorage are immediately purged
  useEffect(() => {
    if (!user) {
      removeItem(STORAGE_KEYS.STATS)
    }
  }, [user])

  // ── Read stats ────────────────────────────────────────────────────────────
  const getStats = useCallback((): AllStats => {
    if (user) {
      return cloudStatsCache.current ?? DEFAULT_STATS
    }
    // Guests do NOT have statistics
    return DEFAULT_STATS
  }, [user])

  // ── Load cloud stats (call once after login) ──────────────────────────────
  const ensureCloudLoaded = useCallback(async (): Promise<AllStats> => {
    if (!user) return DEFAULT_STATS
    if (loadedForUid.current === user.uid && cloudStatsCache.current) {
      return cloudStatsCache.current
    }
    const remote = await loadUserStats(user.uid)
    const stats = remote ?? DEFAULT_STATS
    cloudStatsCache.current = stats
    loadedForUid.current = user.uid
    return stats
  }, [user])

  // ── Sync to cloud (called after round) ───────────────────────────────────
  const syncToCloud = useCallback((stats: AllStats) => {
    if (!user) return
    cloudStatsCache.current = stats
    saveUserStats(user.uid, stats)
  }, [user])

  // ── Record result ─────────────────────────────────────────────────────────
  const recordResult = useCallback(async (
    category: StatsCategory,
    won: boolean,
    attemptNumber?: number,
  ): Promise<void> => {
    // Only record statistics if the user is signed in!
    if (!user) {
      removeItem(STORAGE_KEYS.STATS)
      return
    }

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
    cloudStatsCache.current = stats
    syncToCloud(stats)
  }, [ensureCloudLoaded, syncToCloud, user])

  // ── Reset stats ───────────────────────────────────────────────────────────
  const resetStats = useCallback(async (): Promise<void> => {
    const fresh = { ...DEFAULT_STATS }
    if (user) {
      cloudStatsCache.current = fresh
      syncToCloud(fresh)
    } else {
      removeItem(STORAGE_KEYS.STATS)
    }
  }, [user, syncToCloud])

  return { getStats, recordResult, resetStats, syncToCloud }
}
