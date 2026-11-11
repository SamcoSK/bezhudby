import { useEffect, useRef } from 'react'
import type { AllStats, StatsCategory } from '../types'
import { DIFFICULTY_LABELS } from '../types'

interface StatsModalProps {
  stats: AllStats
  currentCategory: StatsCategory
  onClose: () => void
  onReset: () => void
}

const TABS: { key: StatsCategory; label: string }[] = [
  { key: 'sk',     label: '🇸🇰 Slovenské' },
  { key: 'easy',   label: DIFFICULTY_LABELS.easy },
  { key: 'medium', label: DIFFICULTY_LABELS.medium },
  { key: 'hard',   label: DIFFICULTY_LABELS.hard },
]

export default function StatsModal({
  stats,
  currentCategory,
  onClose,
  onReset,
}: StatsModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeBtnRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const ds = stats[currentCategory]
  const winRate = ds.played > 0 ? Math.round((ds.won / ds.played) * 100) : 0

  // Build distribution bar chart
  const maxDist = Math.max(1, ...Object.values(ds.distribution))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative card w-full max-w-sm p-6 flex flex-col gap-5 animate-slide-up border-vice-cyan/50 shadow-neon-cyan">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="stats-title" className="text-lg font-black font-display vice-gradient-text uppercase tracking-wider">
            📊 SIEŇ SLÁVY (SKÓRE)
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="text-purple-300 hover:text-vice-pink text-xl leading-none transition-colors"
            aria-label="Zavrieť štatistiky"
          >
            ✕
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto" role="tablist">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={key === currentCategory}
              className={[
                'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                key === currentCategory
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-700 dark:text-brand-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
              ].join(' ')}
              // Note: tabs are display-only – the active category comes from the game state
              disabled={key !== currentCategory}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary numbers */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: 'Odohraté', value: ds.played },
            { label: '% výhier', value: `${winRate}%` },
            { label: 'Séria', value: ds.currentStreak },
            { label: 'Rekord', value: ds.bestStreak },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-2xl font-bold text-brand-600 dark:text-brand-300">
                {value}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Distribution chart */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Rozloženie tipov
          </h3>
          {ds.played === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
              Zatiaľ žiadne hry.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const count = ds.distribution[n] ?? 0
                const pct = Math.round((count / maxDist) * 100)
                return (
                  <div key={n} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-slate-500 dark:text-slate-400 shrink-0">{n}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden h-5">
                      <div
                        className="h-full bg-brand-500 dark:bg-brand-400 rounded-full flex items-center pl-2 transition-all duration-500"
                        style={{ width: `${Math.max(pct, count > 0 ? 10 : 0)}%` }}
                      >
                        {count > 0 && (
                          <span className="text-xs text-white font-medium">{count}</span>
                        )}
                      </div>
                    </div>
                    {count === 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 w-4">0</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Reset button */}
        <button
          onClick={() => {
            if (confirm('Naozaj vymazať všetky štatistiky?')) {
              onReset()
              onClose()
            }
          }}
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 self-center transition-colors"
        >
          Vymazať štatistiky
        </button>
      </div>
    </div>
  )
}
