import type { Difficulty } from '../types'
import { DIFFICULTY_LABELS } from '../types'

interface DifficultySelectorProps {
  current: Difficulty
  onChange: (d: Difficulty) => void
  /** When true, locked to easy with medium/hard disabled & greyed out (Slovak mode) */
  isSkMode?: boolean
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

const DIFFICULTY_DESC: Record<Difficulty, string> = {
  easy: 'Rádiové megahity',
  medium: 'Známe klubové tracky',
  hard: 'Underground & vzácne kúsky',
}

export default function DifficultySelector({
  current,
  onChange,
  isSkMode = false,
}: DifficultySelectorProps) {
  // In Slovak mode, "Ľahká" is permanently active
  const activeDifficulty = isSkMode ? 'easy' : current

  return (
    <fieldset aria-label="Obtiažnosť">
      <legend className="sr-only">Obtiažnosť</legend>
      <div className="grid grid-cols-3 gap-2">
        {DIFFICULTIES.map((d) => {
          const isActive = activeDifficulty === d
          const isDisabled = isSkMode && d !== 'easy'
          const isLocked = isSkMode && d === 'easy'

          return (
            <button
              key={d}
              onClick={() => {
                if (isSkMode) return
                onChange(d)
              }}
              disabled={isDisabled}
              aria-pressed={isActive}
              aria-disabled={isDisabled || isLocked}
              title={
                isDisabled
                  ? 'V slovenskom režime je dostupná len ľahká obtiažnosť'
                  : DIFFICULTY_DESC[d]
              }
              className={[
                'flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 select-none',
                isDisabled
                  ? 'opacity-40 bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : isActive
                  ? 'bg-gradient-to-r from-vice-hotpink to-vice-purple border-vice-pink text-white shadow-neon-pink scale-[1.02]'
                  : 'bg-white/90 dark:bg-vice-card/70 border-purple-200 dark:border-vice-border text-purple-800 dark:text-purple-300 hover:border-vice-pink dark:hover:border-vice-cyan hover:text-vice-hotpink dark:hover:text-vice-cyan shadow-sm',
              ].join(' ')}
            >
              <span>{DIFFICULTY_LABELS[d]}</span>
              <span className="text-[10px] font-medium opacity-80 hidden sm:block normal-case tracking-normal">
                {isDisabled ? 'Nedostupné pre SK' : DIFFICULTY_DESC[d]}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
