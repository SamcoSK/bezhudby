import { useEffect, useRef } from 'react'
import type { Song, GuessEntry } from '../types'

interface ResultModalProps {
  song: Song
  guesses: GuessEntry[]
  won: boolean
  isPlaying: boolean
  onPlayFull: () => void
  onNextSong: () => void
}

export default function ResultModal({
  song,
  guesses,
  won,
  isPlaying,
  onPlayFull,
  onNextSong,
}: ResultModalProps) {
  const nextBtnRef = useRef<HTMLButtonElement>(null)

  // Auto-focus the Next button for keyboard users
  useEffect(() => {
    nextBtnRef.current?.focus()
  }, [])

  // Handle Escape → next song
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onNextSong()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNextSong])

  const attemptNumber = guesses.findIndex((g) => g.status === 'correct') + 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onNextSong}
      />

      {/* Panel */}
      <div className="relative card w-full max-w-sm p-6 flex flex-col gap-5 animate-slide-up border-vice-pink/50 shadow-neon-pink">
        {/* Result header */}
        <div className="text-center">
          <div className="text-5xl mb-2 drop-shadow-[0_0_12px_rgba(255,0,127,0.5)]" aria-hidden="true">
            {won ? '🌴' : '💥'}
          </div>
          <h2 id="result-title" className="text-2xl font-black font-display vice-gradient-text uppercase tracking-wide">
            {won ? 'ZÁSAH DO ČIERNEHO!' : 'MISIA ZLYHALA'}
          </h2>
          {won && attemptNumber > 0 && (
            <p className="text-sm font-bold text-purple-700 dark:text-vice-cyan mt-1 drop-shadow-sm">
              Uhádnuté na {attemptNumber}. pokus!
            </p>
          )}
        </div>

        {/* Song info */}
        <div className="bg-purple-50/80 dark:bg-vice-card/90 border border-purple-200 dark:border-vice-border rounded-xl p-4 text-center shadow-inner">
          <p className="text-xl font-black text-slate-900 dark:text-white font-display tracking-wide">{song.title}</p>
          <p className="text-sm font-bold text-purple-700 dark:text-vice-cyan">
            {song.artist}{song.performer ? ` (${song.performer})` : ''}
          </p>
        </div>

        {/* Result summary chips */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          {guesses.map((g, i) => (
            <span
              key={i}
              className={[
                'w-7 h-7 rounded flex items-center justify-center text-sm font-bold',
                g.status === 'correct'
                  ? 'bg-accent-400/30 text-accent-600 dark:text-accent-400'
                  : g.status === 'partial'
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-400/50'
                  : g.status === 'wrong'
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400',
              ].join(' ')}
              aria-label={
                g.status === 'correct'
                  ? 'Správne'
                  : g.status === 'partial'
                  ? 'Správny autor'
                  : g.status === 'wrong'
                  ? 'Nesprávne'
                  : 'Preskočené'
              }
            >
              {g.status === 'correct' ? '✓' : g.status === 'partial' ? '🎯' : g.status === 'wrong' ? '✗' : '—'}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onPlayFull}
            disabled={isPlaying}
            className="btn-secondary text-sm"
            aria-label="Prehrať celých 10 sekúnd"
          >
            {isPlaying ? '♪ Prehrávam…' : '▶ Prehrať celý úryvok (10 s)'}
          </button>

          <button
            ref={nextBtnRef}
            onClick={onNextSong}
            className="btn-primary text-sm"
            aria-label="Prejsť na ďalšiu pieseň"
          >
            Ďalšia pieseň →
          </button>
        </div>
      </div>
    </div>
  )
}
