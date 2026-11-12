import { useEffect, useState } from 'react'
import { getItem, setItem, removeItem, STORAGE_KEYS } from '../utils/storage'
import { AuthProvider, useAuthContext } from '../lib/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'
import { hasMigrated, migrateLocalStats, markMigrated } from '../lib/firestore'
import { DEFAULT_STATS } from '../hooks/useStats'
import { getItem as getLocalStats } from '../utils/storage'
import GameScreen from './GameScreen'
import AuthModal from './AuthModal'
import UserMenu from './UserMenu'
import MigrationDialog from './MigrationDialog'
import StatsModal from './StatsModal'
import { useStats } from '../hooks/useStats'
import type { AllStats } from '../types'

// ── Inner app (needs AuthContext) ─────────────────────────────────────────────
function AppInner() {
  const { user, loading } = useAuthContext()
  const { getStats, resetStats } = useStats(user)

  const [dark, setDark] = useState<boolean>(() => {
    const stored = getItem<boolean | null>(STORAGE_KEYS.DARK_MODE, null)
    if (stored !== null) return stored
    return true
  })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showMigration, setShowMigration] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    setItem(STORAGE_KEYS.DARK_MODE, dark)
  }, [dark])

  // ── Always clear guest stats from localStorage for non-logged-in visitors ──
  useEffect(() => {
    if (!user) {
      removeItem(STORAGE_KEYS.STATS)
    }
  }, [user])

  // ── Migration: show dialog on first login ────────────────────────────────
  useEffect(() => {
    if (!user || !isFirebaseConfigured) return
    let cancelled = false
    ;(async () => {
      const migrated = await hasMigrated(user.uid)
      if (cancelled) return
      if (!migrated) {
        // Check if guest has any stats worth migrating
        const local = getLocalStats<AllStats>(STORAGE_KEYS.STATS, DEFAULT_STATS)
        const hasStats = Object.values(local).some((s) => s.played > 0)
        if (hasStats) {
          setShowMigration(true)
        } else {
          // No local stats – just mark migrated silently
          await markMigrated(user.uid)
        }
      }
    })()
    return () => { cancelled = true }
  }, [user])

  const handleMigrateYes = async () => {
    if (!user) return
    const local = getLocalStats<AllStats>(STORAGE_KEYS.STATS, DEFAULT_STATS)
    await migrateLocalStats(user.uid, local)
    setShowMigration(false)
  }

  const handleMigrateNo = async () => {
    if (!user) return
    await markMigrated(user.uid)
    setShowMigration(false)
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-vice-pink/30 bg-white/90 dark:bg-vice-dark/90 backdrop-blur-md sticky top-0 z-30 shadow-sm transition-colors">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 select-none shrink-0">
            <span className="text-2xl text-vice-cyan" aria-hidden="true">🌴</span>
            <span className="text-2xl font-black italic tracking-wider font-display vice-gradient-text drop-shadow-[0_2px_10px_rgba(255,0,127,0.4)]">
              Bezhudby
            </span>
          </div>

          {/* Right side: dark mode + auth */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-vice-pink/40 bg-vice-card/10 dark:bg-vice-card/80 text-xs font-black uppercase tracking-wider text-vice-pink dark:text-vice-cyan hover:scale-105 transition-all shadow-sm focus:outline-none"
              aria-label={dark ? 'Prepnúť na svetlý režim (Deň)' : 'Prepnúť na tmavý režim (Noc)'}
              title={dark ? 'Prepnúť na Deň' : 'Prepnúť na Noc'}
            >
              <span className="text-sm">{dark ? '🌙' : '☀️'}</span>
              <span className="hidden sm:inline">{dark ? 'Noc' : 'Deň'}</span>
            </button>

            {/* Auth: loading skeleton → user menu → sign-in button */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-purple-200 dark:bg-vice-card animate-pulse" aria-label="Načítava sa…" />
            ) : user ? (
              <UserMenu user={user} onShowStats={() => setShowStatsModal(true)} />
            ) : isFirebaseConfigured ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-primary !px-3 !py-1.5 text-xs"
                aria-label="Prihlásiť sa"
              >
                Prihlásiť sa
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <GameScreen />
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="text-center text-xs text-purple-700/60 dark:text-purple-400/60 py-4 font-semibold tracking-wider uppercase">
        Bezhudby 2026
      </footer>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {showStatsModal && (
        <StatsModal
          stats={getStats()}
          currentCategory="sk"
          onClose={() => setShowStatsModal(false)}
          onReset={() => { void resetStats(); setShowStatsModal(false) }}
          isGuest={!user}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      )}

      {showMigration && (
        <MigrationDialog onYes={handleMigrateYes} onNo={handleMigrateNo} />
      )}
    </div>
  )
}

// ── Root with AuthProvider ────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
