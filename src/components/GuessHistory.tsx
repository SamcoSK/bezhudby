import type { GuessEntry } from '../types'

interface GuessHistoryProps {
  guesses: GuessEntry[]
  maxAttempts: number
}

const STATUS_ICON: Record<string, { icon: string; label: string; classes: string }> = {
  correct: {
    icon: '✓',
    label: 'Správne',
    classes: 'bg-vice-cyan/20 text-vice-cyan border-vice-cyan/60 shadow-[0_0_12px_rgba(0,240,255,0.3)]',
  },
  wrong: {
    icon: '✗',
    label: 'Nesprávne',
    classes: 'bg-vice-hotpink/20 text-vice-hotpink border-vice-hotpink/60 shadow-[0_0_12px_rgba(255,0,127,0.3)]',
  },
  skipped: {
    icon: '—',
    label: 'Preskočené',
    classes: 'bg-purple-950/40 text-purple-400 border-purple-800/40',
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
        const { icon, label, classes } = STATUS_ICON[g.status]
        return (
          <li
            key={idx}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-semibold animate-fade-in ${classes}`}
            aria-label={`${label}: ${g.value || 'preskočené'}`}
          >
            <span className="text-base font-black w-5 text-center shrink-0 drop-shadow-sm" aria-hidden="true">
              {icon}
            </span>
            <span className={g.status === 'skipped' ? 'italic opacity-60 text-xs' : 'font-bold text-white'}>
              {g.status === 'skipped' ? 'Preskočené' : g.value}
            </span>
            <span className="ml-auto text-xs opacity-75 font-mono shrink-0">{g.clipDuration} s</span>
          </li>
        )
      })}

      {/* Empty slots */}
      {Array.from({ length: remaining }).map((_, idx) => (
        <li
          key={`empty-${idx}`}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-dashed border-purple-900/40 bg-vice-dark/30 text-sm text-purple-700/50"
          aria-hidden="true"
        >
          <span className="w-5 text-center font-bold">·</span>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-40">Voľný slot</span>
        </li>
      ))}
    </ol>
  )
}
