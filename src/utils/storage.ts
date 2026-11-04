/**
 * Safe localStorage wrapper with try/catch to handle:
 * - Private browsing mode (quota exceeded)
 * - Corrupted stored data
 * - SSR environments
 */

export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Silently fail – storage unavailable (e.g. private mode quota)
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Silently fail
  }
}

// ─────────────────────────────────────────────
// Storage keys used across the app
// ─────────────────────────────────────────────
export const STORAGE_KEYS = {
  FILTERS: 'napev:filters',
  STATS: 'napev:stats',
  DARK_MODE: 'napev:darkMode',
} as const
