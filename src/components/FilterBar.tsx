import type { Genre, Filters } from '../types'
import { ALL_GENRES, GENRE_LABELS } from '../types'

interface FilterBarProps {
  filters: Filters
  onLangChange: (l: 'sk' | 'en') => void
  onGenreToggle: (g: Genre) => void
  onGenreSelectAll: () => void
}

export default function FilterBar({
  filters,
  onLangChange,
  onGenreToggle,
  onGenreSelectAll,
}: FilterBarProps) {
  const isSk = filters.lang === 'sk'

  const handleSkToggle = () => {
    onLangChange(isSk ? 'en' : 'sk')
  }

  const isAllGenres = filters.genres.length === ALL_GENRES.length

  return (
    <section aria-label="Filtre">
      {/* ── SK toggle + genre chips ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Slovak toggle chip */}
        <button
          onClick={handleSkToggle}
          className={`chip ${isSk ? 'chip-active' : 'chip-inactive'}`}
          aria-pressed={isSk}
          aria-label="Len slovenské skladby"
        >
          🇸🇰 Len slovenské
        </button>

        {/* Divider */}
        <span className="text-slate-300 dark:text-slate-700 select-none" aria-hidden="true">|</span>

        {/* Genre chips – visually disabled when SK mode is on */}
        {ALL_GENRES.map((genre) => {
          const active = !isSk && filters.genres.includes(genre)
          return (
            <button
              key={genre}
              onClick={() => !isSk && onGenreToggle(genre)}
              disabled={isSk}
              className={`chip ${active ? 'chip-active' : 'chip-inactive'} ${isSk ? 'chip-disabled' : ''}`}
              aria-pressed={active}
              aria-label={`Žáner: ${GENRE_LABELS[genre]}`}
            >
              {GENRE_LABELS[genre]}
            </button>
          )
        })}

        {/* Select all genres shortcut */}
        {!isSk && !isAllGenres && (
          <button
            onClick={onGenreSelectAll}
            className="chip chip-inactive text-xs"
            aria-label="Vybrať všetky žánre"
          >
            Všetky
          </button>
        )}
      </div>
    </section>
  )
}
