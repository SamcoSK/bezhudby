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
  const skMode = Boolean(filters?.skMode)
  const skTypes = Array.isArray(filters?.skTypes) && filters.skTypes.length > 0 ? filters.skTypes : ALL_SK_TYPES
  const genres = Array.isArray(filters?.genres) && filters.genres.length > 0 ? filters.genres : ALL_GENRES

  const isAllGenres = genres.length === ALL_GENRES.length

  const handleSkTypeToggle = (t: SkType) => {
    // Cannot deactivate the last active skType
    if (skTypes.includes(t) && skTypes.length === 1) return
    onSkTypeToggle(t)
  }

  return (
    <section aria-label="Filtre" className="flex flex-col gap-3">
      {/* ── Row 1: Slovenské / Zahraničné toggle ─────────────────────────────── */}
      <div className="flex gap-2" role="group" aria-label="Jazyk skladieb">
        <button
          onClick={() => onSkModeChange(true)}
          className={`chip flex-1 justify-center ${skMode ? 'chip-active' : 'chip-inactive'}`}
          aria-pressed={skMode}
        >
          🇸🇰 Slovenské
        </button>
        <button
          onClick={() => onSkModeChange(false)}
          className={`chip flex-1 justify-center ${!skMode ? 'chip-active' : 'chip-inactive'}`}
          aria-pressed={!skMode}
        >
          🌍 Zahraničné
        </button>
      </div>

      {/* ── Row 2: Žáner chips (Slovak types OR English genres) ──────────────── */}
      <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Žáner">
        <span className="text-xs text-purple-700 dark:text-purple-400 font-semibold uppercase tracking-wider mr-1">Žáner:</span>

        {skMode ? (
          /* Slovak type chips */
          ALL_SK_TYPES.map((t) => {
            const active = skTypes.includes(t)
            const isLast = skTypes.length === 1 && active
            return (
              <button
                key={t}
                onClick={() => handleSkTypeToggle(t)}
                disabled={isLast}
                className={`chip ${active ? 'chip-active' : 'chip-inactive'} ${isLast ? 'opacity-60 cursor-not-allowed' : ''}`}
                aria-pressed={active}
                aria-label={`${SK_TYPE_LABELS[t]}${isLast ? ' (posledný aktívny, nedá sa vypnúť)' : ''}`}
                title={isLast ? 'Aspoň jeden typ musí ostať aktívny' : undefined}
              >
                {SK_TYPE_LABELS[t]}
              </button>
            )
          })
        ) : (
          /* English genre chips */
          <>
            {ALL_GENRES.map((genre) => {
              const active = genres.includes(genre)
              return (
                <button
                  key={genre}
                  onClick={() => onGenreToggle(genre)}
                  className={`chip ${active ? 'chip-active' : 'chip-inactive'}`}
                  aria-pressed={active}
                  aria-label={`Žáner: ${GENRE_LABELS[genre]}`}
                >
                  {GENRE_LABELS[genre]}
                </button>
              )
            })}
            {/* Select all genres shortcut */}
            {!isAllGenres && (
              <button
                onClick={onGenreSelectAll}
                className="chip chip-inactive text-xs"
                aria-label="Vybrať všetky žánre"
              >
                Všetky
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
