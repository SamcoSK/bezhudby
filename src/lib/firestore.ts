/**
 * Firestore helpers for reading/writing user stats and filters.
 * All writes happen after a round ends (not during gameplay).
 * Offline resilience: Firestore SDK queues writes automatically when offline.
 */
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { AllStats, Filters, DifficultyStats, StatsCategory } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserDocument {
  stats: AllStats
  filters?: Partial<Filters>
  migrated?: boolean
  updatedAt?: unknown // serverTimestamp()
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function userRef(uid: string) {
  if (!db) throw new Error('Firestore nie je nakonfigurovaný.')
  return doc(db, 'users', uid)
}

// ─── Load / Save stats ───────────────────────────────────────────────────────

export async function loadUserStats(uid: string): Promise<AllStats | null> {
  try {
    const snap = await getDoc(userRef(uid))
    if (!snap.exists()) return null
    const data = snap.data() as UserDocument
    return data.stats ?? null
  } catch {
    return null
  }
}

export async function saveUserStats(uid: string, stats: AllStats): Promise<void> {
  try {
    await setDoc(userRef(uid), { stats, updatedAt: serverTimestamp() }, { merge: true })
  } catch {
    // Silently fail – Firestore will retry when back online
  }
}

// ─── Load / Save filters ─────────────────────────────────────────────────────

export async function loadUserFilters(uid: string): Promise<Partial<Filters> | null> {
  try {
    const snap = await getDoc(userRef(uid))
    if (!snap.exists()) return null
    const data = snap.data() as UserDocument
    return data.filters ?? null
  } catch {
    return null
  }
}

export async function saveUserFilters(uid: string, filters: Partial<Filters>): Promise<void> {
  try {
    await setDoc(userRef(uid), { filters, updatedAt: serverTimestamp() }, { merge: true })
  } catch {
    // Silently fail
  }
}

// ─── Migration flag ───────────────────────────────────────────────────────────

export async function hasMigrated(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(userRef(uid))
    if (!snap.exists()) return false
    return Boolean((snap.data() as UserDocument).migrated)
  } catch {
    return false
  }
}

export async function markMigrated(uid: string): Promise<void> {
  try {
    await setDoc(userRef(uid), { migrated: true }, { merge: true })
  } catch {
    // ignore
  }
}

// ─── Stats merge (local → Firestore) ─────────────────────────────────────────

function mergeCategory(local: DifficultyStats, remote: DifficultyStats): DifficultyStats {
  const distribution: Record<number, number> = { ...remote.distribution }
  for (const [k, v] of Object.entries(local.distribution)) {
    const key = Number(k)
    distribution[key] = (distribution[key] ?? 0) + v
  }
  return {
    played:        local.played + remote.played,
    won:           local.won + remote.won,
    currentStreak: Math.max(local.currentStreak, remote.currentStreak),
    bestStreak:    Math.max(local.bestStreak, remote.bestStreak),
    distribution,
  }
}

export function mergeStats(local: AllStats, remote: AllStats): AllStats {
  const categories: StatsCategory[] = ['sk', 'easy', 'medium', 'hard']
  const merged: Partial<AllStats> = {}
  for (const cat of categories) {
    merged[cat] = mergeCategory(local[cat], remote[cat])
  }
  return merged as AllStats
}

export async function migrateLocalStats(uid: string, localStats: AllStats): Promise<void> {
  try {
    const snap = await getDoc(userRef(uid))
    const existing: AllStats | null = snap.exists()
      ? ((snap.data() as UserDocument).stats ?? null)
      : null

    const merged = existing ? mergeStats(localStats, existing) : localStats
    await setDoc(
      userRef(uid),
      { stats: merged, migrated: true, updatedAt: serverTimestamp() },
      { merge: true },
    )
  } catch {
    // Silently fail – migration can be retried next session
  }
}

// ─── Delete user data ─────────────────────────────────────────────────────────

export async function deleteUserData(uid: string): Promise<void> {
  try {
    await deleteDoc(userRef(uid))
  } catch {
    // ignore – best-effort cleanup
  }
}
