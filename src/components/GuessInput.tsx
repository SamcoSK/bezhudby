import { useCallback, useEffect, useRef, useState } from 'react'
import type { Song } from '../types'
import { CLIP_DURATIONS, MAX_ATTEMPTS } from '../types'
import { songMatchesQuery } from '../utils/normalize'

// Pre-compute skip bonus labels (how many extra seconds each skip unlocks)
const SKIP_BONUS: Record<number, number> = {}
for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
  SKIP_BONUS[i] = CLIP_DURATIONS[i + 1] - CLIP_DURATIONS[i]
}

interface GuessInputProps {
  songs: Song[]
  disabled: boolean
  onGuess: (songId: string) => void
  onSkip: () => void
  currentAttempt: number
  maxAttempts: number
}

export function formatSongDisplay(song: Song): string {
  const performer = song.performer ? ` (${song.performer})` : ''
  return `${song.title} – ${song.artist}${performer}`
}

export default function GuessInput({
  songs,
  disabled,
  onGuess,
  onSkip,
  currentAttempt,
  maxAttempts,
}: GuessInputProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Song[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Filter suggestions on query change
  useEffect(() => {
    if (!query.trim() || selectedSong) {
      setSuggestions([])
      setActiveIdx(-1)
      return
    }
    const filtered = songs.filter((s) => songMatchesQuery(s, query)).slice(0, 10)
    setSuggestions(filtered)
    setActiveIdx(-1)
  }, [query, songs, selectedSong])

  const selectSong = useCallback((song: Song) => {
    setSelectedSong(song)
    setQuery(formatSongDisplay(song))
    setSuggestions([])
    setActiveIdx(-1)
    inputRef.current?.focus()
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedSong(null)
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(() => {
    if (!selectedSong) return
    onGuess(selectedSong.id)
    setQuery('')
    setSelectedSong(null)
    setSuggestions([])
  }, [selectedSong, onGuess])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        selectSong(suggestions[activeIdx])
      } else if (selectedSong) {
        handleSubmit()
      }
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setActiveIdx(-1)
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLLIElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIdx])

  const isOpen = suggestions.length > 0
  const listId = 'guess-suggestions'

  return (
    <div className="flex flex-col gap-3">
      {/* ── Input + submit ───────────────────────────────────────────────── */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setSelectedSong(null)
                setQuery(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Hľadaj pieseň alebo interpreta…"
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeIdx >= 0 ? `suggestion-${activeIdx}` : undefined}
              className={[
                'w-full px-4 py-3 rounded-xl border text-sm font-medium',
                'bg-purple-50/70 dark:bg-vice-card/90 text-slate-900 dark:text-white placeholder-purple-400 dark:placeholder-purple-300/40',
                'border-purple-200 dark:border-vice-border focus:border-vice-pink dark:focus:border-vice-cyan focus:ring-2 focus:ring-vice-pink/30 dark:focus:ring-vice-cyan/50',
                'disabled:opacity-40 disabled:pointer-events-none transition-all shadow-inner',
                selectedSong ? 'pr-10' : '',
              ].join(' ')}
            />
            {/* Clear button */}
            {selectedSong && (
              <button
                onClick={clearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 dark:text-purple-300 hover:text-vice-pink transition-colors"
                aria-label="Zrušiť výber"
                tabIndex={0}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedSong || disabled}
            className="btn-primary shrink-0"
            aria-label="Potvrdiť tip"
          >
            Tipnúť
          </button>
        </div>

        {/* ── Autocomplete dropdown ─────────────────────────────────────── */}
        {isOpen && (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label="Návrhy piesní"
            className={[
              'absolute z-20 left-0 right-0 mt-2',
              'bg-white dark:bg-vice-card/95 backdrop-blur-xl',
              'border border-purple-200 dark:border-vice-pink/40',
              'rounded-xl shadow-xl dark:shadow-neon-pink overflow-auto max-h-56',
              'animate-slide-up divide-y divide-purple-100 dark:divide-purple-900/30',
            ].join(' ')}
          >
            {suggestions.map((song, idx) => (
              <li
                key={song.id}
                id={`suggestion-${idx}`}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseDown={(e) => {
                  e.preventDefault() // prevent blur before click
                  selectSong(song)
                }}
                className={[
                  'px-4 py-2.5 cursor-pointer text-sm transition-colors',
                  idx === activeIdx
                    ? 'bg-purple-100 dark:bg-vice-pink/30 text-purple-900 dark:text-vice-cyan font-bold shadow-inner'
                    : 'text-slate-800 dark:text-purple-100 hover:bg-purple-50 dark:hover:bg-vice-pink/20 hover:text-purple-900 dark:hover:text-white',
                ].join(' ')}
              >
                <span className="font-bold text-slate-900 dark:text-white">{song.title}</span>
                <span className="text-purple-700/80 dark:text-purple-300/70">
                  {' '}– {song.artist}{song.performer ? ` (${song.performer})` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Skip button ──────────────────────────────────────────────────── */}
      <button
        onClick={onSkip}
        disabled={disabled}
        className="btn-secondary text-sm"
        aria-label={
          currentAttempt < maxAttempts - 1
            ? `Preskočiť a odomknúť dlhší úryvok`
            : 'Vzdať sa (posledný pokus)'
        }
      >
        {currentAttempt < maxAttempts - 1
          ? `Preskočiť (+${SKIP_BONUS[currentAttempt] ?? 0} s)`
          : 'Vzdať sa'}
      </button>

      {/* ── Attempt counter ───────────────────────────────────────────────── */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        Pokus {currentAttempt + 1} z {maxAttempts}
      </p>
    </div>
  )
}
