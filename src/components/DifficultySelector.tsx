import type { Difficulty } from '../types'
import { DIFFICULTY_LABELS } from '../types'

interface DifficultySelectorProps {
  current: Difficulty
  onChange: (d: Difficulty) => void
  /** When true, the selector is hidden but reserves its space in the layout */
  hidden?: boolean
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

const DIFFICULTY_DESC: Record<Difficulty, string> = {
  easy: 'Rádiové megahity',
  medium: 'Známe klubové tracky',
  hard: 'Underground & vzácne kúsky',
}

export default function DifficultySelector({ current, onChange, hidden = false }: DifficultySelectorProps) {
  return (
    <fieldset aria-hidden={hidden} style={{ visibility: hidden ? 'hidden' : 'visible' }}>
      <legend className="sr-only">Obtiažnosť</legend>
      <div className="grid grid-cols-3 gap-2">
        {DIFFICULTIES.map((d) => {
          const isActive = current === d
          return (
            <button
              key={d}
              onClick={() => !hidden && onChange(d)}
              disabled={hidden}
              tabIndex={hidden ? -1 : undefined}
              aria-pressed={isActive}
              title={hidden ? undefined : DIFFICULTY_DESC[d]}
              className={[
                'flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-vice-hotpink to-vice-purple border-vice-pink text-white shadow-neon-pink scale-[1.02]'
                  : 'bg-vice-card/70 border-vice-border text-purple-300 hover:border-vice-cyan hover:text-vice-cyan',
              ].join(' ')}
            >
              <span>{DIFFICULTY_LABELS[d]}</span>
              <span className="text-[10px] font-medium opacity-80 hidden sm:block normal-case tracking-normal">{DIFFICULTY_DESC[d]}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
