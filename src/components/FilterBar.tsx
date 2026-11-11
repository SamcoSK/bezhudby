import type { Genre, SkType, Filters } from '../types'
import { ALL_GENRES, GENRE_LABELS, ALL_SK_TYPES, SK_TYPE_LABELS } from '../types'

interface FilterBarProps {
  filters: Filters
  onSkModeChange: (on: boolean) => void
  onSkTypeToggle: (t: SkType) => void
  onGenreToggle: (g: Genre) => void
  onGenreSelectAll: () => void
}

export default function FilterBar({
  filters,
  onSkModeChange,
  onSkTypeToggle,
  onGenreToggle,
  onGenreSelectAll,
}: FilterBarProps) {
  const { skMode, skTypes, genres } = filters

  const isAllGenres = genres.length === ALL_GENRES.length

  const handleSkTypeToggle = (t: SkType) => {
    // Cannot deactivate the last active skType
    if (skTypes.includes(t) && skTypes.length === 1) return
    onSkTypeToggle(t)
  }

  return (
    <section aria-label="Filtre">
      {/* ── Row 1: SK toggle + genre chips ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Slovak mode toggle chip */}
        <button
          onClick={() => onSkModeChange(!skMode)}
          className={`chip ${skMode ? 'chip-active' : 'chip-inactive'}`}
          aria-pressed={skMode}
          aria-label="Len slovenské skladby"
        >
          🇸🇰 Len slovenské
        </button>

        {/* Divider */}
        <span className="text-slate-300 dark:text-slate-700 select-none" aria-hidden="true">|</span>

        {/* Genre chips – visually disabled when SK mode is on */}
        {ALL_GENRES.map((genre) => {
          const active = !skMode && genres.includes(genre)
          return (
            <button
              key={genre}
              onClick={() => !skMode && onGenreToggle(genre)}
              disabled={skMode}
              className={`chip ${active ? 'chip-active' : 'chip-inactive'} ${skMode ? 'chip-disabled' : ''}`}
              aria-pressed={active}
              aria-label={`Žáner: ${GENRE_LABELS[genre]}`}
            >
              {GENRE_LABELS[genre]}
            </button>
          )
        })}

        {/* Select all genres shortcut */}
        {!skMode && !isAllGenres && (
          <button
            onClick={onGenreSelectAll}
            className="chip chip-inactive text-xs"
            aria-label="Vybrať všetky žánre"
          >
            Všetky
          </button>
        )}
      </div>

      {/* ── Row 2: SK type chips (only visible in SK mode) ─────────────────── */}
      {skMode && (
        <div className="flex flex-wrap gap-2 items-center mt-2" role="group" aria-label="Typ slovenských skladieb">
          <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider mr-1">Typ:</span>
          {ALL_SK_TYPES.map((t) => {
            const active = skTypes.includes(t)
            const isLast = skTypes.length === 1 && active
            return (
              <button
                key={t}
                onClick={() => handleSkTypeToggle(t)}
                disabled={isLast}
                className={`chip ${active ? 'chip-active' : 'chip-inactive'} ${isLast ? 'opacity-60 cursor-not-allowed' : ''}`}
                aria-pressed={active}
                aria-label={`Typ: ${SK_TYPE_LABELS[t]}${isLast ? ' (posledný aktívny, nedá sa vypnúť)' : ''}`}
                title={isLast ? 'Aspoň jeden typ musí ostať aktívny' : undefined}
              >
                {SK_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
