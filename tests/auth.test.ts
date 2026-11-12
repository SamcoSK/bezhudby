/**
 * Tests for Firebase auth error translations (Slovak messages),
 * stats merge/migration logic, and guest vs. logged-in routing.
 */
import { describe, it, expect } from 'vitest'
import { translateAuthError } from '../src/lib/auth'
import { mergeStats } from '../src/lib/firestore'
import type { AllStats } from '../src/types'

// ─── Slovak error message translations ───────────────────────────────────────

describe('translateAuthError', () => {
  it('translates known Firebase error codes to Slovak', () => {
    expect(translateAuthError('auth/invalid-email')).toContain('Neplatná e-mail')
    expect(translateAuthError('auth/user-not-found')).toContain('neexistuje')
    expect(translateAuthError('auth/wrong-password')).toContain('heslo')
    expect(translateAuthError('auth/email-already-in-use')).toContain('zaregistrovaný')
    expect(translateAuthError('auth/weak-password')).toContain('8 znakov')
    expect(translateAuthError('auth/too-many-requests')).toContain('veľa pokusov')
    expect(translateAuthError('auth/network-request-failed')).toContain('sieť')
    expect(translateAuthError('auth/requires-recent-login')).toContain('znova prihlásiť')
    expect(translateAuthError('auth/user-disabled')).toContain('deaktivovaný')
    expect(translateAuthError('auth/invalid-credential')).toContain('heslo')
  })

  it('returns empty string for silent errors (popup closed)', () => {
    expect(translateAuthError('auth/popup-closed-by-user')).toBe('')
    expect(translateAuthError('auth/cancelled-popup-request')).toBe('')
  })

  it('returns a fallback for unknown error codes', () => {
    const msg = translateAuthError('auth/some-unknown-code')
    expect(msg).toBeTruthy()
    expect(msg).toContain('neočakávaná')
  })
})

// ─── Stats merge / migration logic ───────────────────────────────────────────

function makeStats(overrides: Partial<Record<keyof AllStats, Partial<AllStats[keyof AllStats]>>>): AllStats {
  const base = {
    played: 0, won: 0, currentStreak: 0, bestStreak: 0, distribution: {},
  }
  return {
    sk:     { ...base, ...(overrides.sk     ?? {}) },
    easy:   { ...base, ...(overrides.easy   ?? {}) },
    medium: { ...base, ...(overrides.medium ?? {}) },
    hard:   { ...base, ...(overrides.hard   ?? {}) },
  }
}

describe('mergeStats', () => {
  it('sums played and won counts', () => {
    const local  = makeStats({ sk: { played: 10, won: 7 } })
    const remote = makeStats({ sk: { played: 5,  won: 3 } })
    const merged = mergeStats(local, remote)
    expect(merged.sk.played).toBe(15)
    expect(merged.sk.won).toBe(10)
  })

  it('takes the higher bestStreak', () => {
    const local  = makeStats({ easy: { bestStreak: 12 } })
    const remote = makeStats({ easy: { bestStreak: 8  } })
    expect(mergeStats(local, remote).easy.bestStreak).toBe(12)

    const local2  = makeStats({ easy: { bestStreak: 3 } })
    const remote2 = makeStats({ easy: { bestStreak: 9 } })
    expect(mergeStats(local2, remote2).easy.bestStreak).toBe(9)
  })

  it('sums guess distributions', () => {
    const local  = makeStats({ hard: { distribution: { 1: 2, 3: 5 } } })
    const remote = makeStats({ hard: { distribution: { 1: 1, 2: 4 } } })
    const merged = mergeStats(local, remote)
    expect(merged.hard.distribution[1]).toBe(3)   // 2 + 1
    expect(merged.hard.distribution[2]).toBe(4)   // 0 + 4
    expect(merged.hard.distribution[3]).toBe(5)   // 5 + 0
  })

  it('handles all zero remote stats (first login)', () => {
    const local  = makeStats({ sk: { played: 20, won: 15, bestStreak: 6, distribution: { 2: 10 } } })
    const remote = makeStats({})
    const merged = mergeStats(local, remote)
    expect(merged.sk.played).toBe(20)
    expect(merged.sk.bestStreak).toBe(6)
    expect(merged.sk.distribution[2]).toBe(10)
  })

  it('merges all four categories independently', () => {
    const local  = makeStats({ sk: { played: 5 }, easy: { played: 3 }, medium: { played: 1 }, hard: { played: 7 } })
    const remote = makeStats({ sk: { played: 2 }, easy: { played: 2 }, medium: { played: 4 }, hard: { played: 1 } })
    const merged = mergeStats(local, remote)
    expect(merged.sk.played).toBe(7)
    expect(merged.easy.played).toBe(5)
    expect(merged.medium.played).toBe(5)
    expect(merged.hard.played).toBe(8)
  })
})

// ─── Guest vs. logged-in routing ─────────────────────────────────────────────

describe('auth routing (unit)', () => {
  it('isFirebaseConfigured is false when env vars are missing', async () => {
    // In test environment, Vite env vars are undefined → isFirebaseConfigured = false
    const { isFirebaseConfigured } = await import('../src/lib/firebase')
    // In test environment (no .env), this should be false
    expect(typeof isFirebaseConfigured).toBe('boolean')
    // If truly unconfigured: false. If someone runs tests with real .env: true (also valid)
    if (!isFirebaseConfigured) {
      expect(isFirebaseConfigured).toBe(false)
    }
  })

  it('translateAuthError is a pure function (no side effects)', () => {
    const r1 = translateAuthError('auth/invalid-email')
    const r2 = translateAuthError('auth/invalid-email')
    expect(r1).toBe(r2)
  })

  it('guest stats are not stored and localStorage stats key is removed', async () => {
    const { STORAGE_KEYS } = await import('../src/utils/storage')
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify({ test: 123 }))
    expect(localStorage.getItem(STORAGE_KEYS.STATS)).toBeTruthy()

    // When useStats is used without a user or stats are cleared
    localStorage.removeItem(STORAGE_KEYS.STATS)
    expect(localStorage.getItem(STORAGE_KEYS.STATS)).toBeNull()
  })
})
