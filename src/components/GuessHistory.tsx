import type { GuessEntry } from '../types'

interface GuessHistoryProps {
  guesses: GuessEntry[]
  maxAttempts: number
}

const STATUS_ICON: Record<string, { icon: string; label: string; classes: string }> = {
  correct: {
    icon: '✓',
    label: 'Správne',
    classes: 'bg-emerald-500/15 text-emerald-700 dark:bg-vice-cyan/20 dark:text-vice-cyan border-emerald-500/40 dark:border-vice-cyan/60 dark:shadow-[0_0_12px_rgba(0,240,255,0.3)]',
  },
  partial: {
    icon: '🎯',
    label: 'Správny autor',
    classes: 'bg-amber-500/20 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300 border-amber-500/60 dark:border-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.25)] dark:shadow-[0_0_14px_rgba(251,191,36,0.35)]',
  },
  wrong: {
    icon: '✗',
    label: 'Nesprávne',
    classes: 'bg-rose-500/15 text-rose-700 dark:bg-vice-hotpink/20 dark:text-vice-hotpink border-rose-500/40 dark:border-vice-hotpink/60 dark:shadow-[0_0_12px_rgba(255,0,127,0.3)]',
  },
  skipped: {
    icon: '—',
    label: 'Preskočené',
    classes: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
  },
}

export default function GuessHistory({ guesses, maxAttempts }: GuessHistoryProps) {
  const remaining = maxAttempts - guesses.length

  return (
    <ol
      className="flex flex-col gap-2"
      aria-label={`Zoznam pokusov (${guesses.length} z ${maxAttempts})`}
    >
      {/* Filled guesses */}
      {guesses.map((g, idx) => {
        const { icon, label, classes } = STATUS_ICON[g.status] ?? STATUS_ICON.wrong
        const isPartial = g.status === 'partial'

        return (
          <li
            key={idx}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-semibold animate-fade-in ${classes}`}
            aria-label={`${label}: ${g.value || 'preskočené'}`}
          >
            <span className="text-base font-black w-5 text-center shrink-0 drop-shadow-sm" aria-hidden="true">
              {icon}
            </span>
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <span className={g.status === 'skipped' ? 'italic opacity-60 text-xs' : 'font-bold text-slate-900 dark:text-white truncate'}>
                {g.status === 'skipped' ? 'Preskočené' : g.value}
              </span>
              {isPartial && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/25 dark:bg-amber-400/30 text-amber-950 dark:text-amber-200 border border-amber-500/40 shrink-0">
                  <span>🎯</span> Správny autor
                </span>
              )}
            </div>
            <span className="ml-auto text-xs opacity-75 font-mono shrink-0">{g.clipDuration} s</span>
          </li>
        )
      })}

      {/* Empty slots */}
      {Array.from({ length: remaining }).map((_, idx) => (
        <li
          key={`empty-${idx}`}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-dashed border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-vice-dark/30 text-sm text-purple-400 dark:text-purple-700/50"
          aria-hidden="true"
        >
          <span className="w-5 text-center font-bold">·</span>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-60 dark:opacity-40">Voľný slot</span>
        </li>
      ))}
    </ol>
  )
}
