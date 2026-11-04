import { useEffect, useState } from 'react'
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage'
import GameScreen from './GameScreen'

export default function App() {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = getItem<boolean | null>(STORAGE_KEYS.DARK_MODE, null)
    if (stored !== null) return stored
    return true // Default dark / night mode for Vice City
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    setItem(STORAGE_KEYS.DARK_MODE, dark)
  }, [dark])

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-vice-pink/30 bg-white/90 dark:bg-vice-dark/90 backdrop-blur-md sticky top-0 z-30 shadow-sm transition-colors">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo with Vice City styling */}
          <div className="flex items-center gap-2 select-none">
            <span className="text-2xl text-vice-cyan" aria-hidden="true">🌴</span>
            <span className="text-2xl font-black italic tracking-wider font-display vice-gradient-text drop-shadow-[0_2px_10px_rgba(255,0,127,0.4)]">
              Bezhudby
            </span>
          </div>

          {/* Day / Night Mode toggle with clear status text */}
          <button
            onClick={() => setDark((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-vice-pink/40 bg-vice-card/10 dark:bg-vice-card/80 text-xs font-black uppercase tracking-wider text-vice-pink dark:text-vice-cyan hover:scale-105 transition-all shadow-sm focus:outline-none"
            aria-label={dark ? 'Prepnúť na svetlý režim (Deň)' : 'Prepnúť na tmavý režim (Noc)'}
            title={dark ? 'Prepnúť na Deň' : 'Prepnúť na Noc'}
          >
            <span className="text-sm">{dark ? '🌙' : '☀️'}</span>
            <span>{dark ? 'Režim: Noc' : 'Režim: Deň'}</span>
          </button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <GameScreen />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="text-center text-xs text-purple-700/60 dark:text-purple-400/60 py-4 font-semibold tracking-wider uppercase">
        Bezhudby 2026
      </footer>
    </div>
  )
}
