import { CLIP_DURATIONS } from '../types'

interface AudioPlayerProps {
  attempt: number
  isPlaying: boolean
  isFallback: boolean
  disabled: boolean
  onPlay: () => void
}

const MAX_DURATION = CLIP_DURATIONS[CLIP_DURATIONS.length - 1] // 10 s

export default function AudioPlayer({
  attempt,
  isPlaying,
  isFallback,
  disabled,
  onPlay,
}: AudioPlayerProps) {
  const currentDuration = CLIP_DURATIONS[Math.min(attempt, CLIP_DURATIONS.length - 1)]
  const nextAttempt = Math.min(attempt + 1, CLIP_DURATIONS.length - 1)
  const nextDuration = CLIP_DURATIONS[nextAttempt]
  const skipBonus = nextDuration - currentDuration

  return (
    <div className="flex flex-col gap-3">
      {/* ── Fallback notice ──────────────────────────────────────────────── */}
      {isFallback && (
        <p className="text-xs text-vice-yellow bg-vice-yellow/10 border border-vice-yellow/30 rounded-lg px-3 py-2 font-semibold">
          ⚠️ Hrá sa záložný tón (ukážka nebola dostupná v online streamovacích serveroch).
        </p>
      )}

      {/* ── Play button ──────────────────────────────────────────────────── */}
      <button
        onClick={onPlay}
        disabled={disabled || isPlaying}
        className={[
          'btn-primary w-full text-base py-3.5 gap-3 font-display tracking-wider',
          isPlaying ? 'opacity-90 ring-2 ring-vice-cyan' : '',
        ].join(' ')}
        aria-label={
          isPlaying
            ? `Prehrávam ${currentDuration} sekúnd`
            : `Prehrať ${currentDuration} sekúnd`
        }
      >
        {isPlaying ? (
          <>
            <span className="inline-block w-5 h-5 relative" aria-hidden="true">
              <span className="absolute inset-0 flex items-end justify-around gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="w-1 bg-vice-cyan rounded-full animate-pulse-soft"
                    style={{
                      height: `${30 + i * 22}%`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </span>
            </span>
            <span className="text-vice-cyan font-black drop-shadow-[0_0_8px_#00f0ff]">ON AIR… ({currentDuration} s)</span>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-lg">▶</span>
            <span>Prehrať úryvok ({currentDuration} s)</span>
          </>
        )}
      </button>

      {/* ── Progress / segment bar ───────────────────────────────────────── */}
      <div
        className="flex gap-1.5 items-stretch p-1.5 rounded-xl bg-purple-100/70 dark:bg-vice-dark/80 border border-purple-200 dark:border-vice-border/60 shadow-inner"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={MAX_DURATION}
        aria-valuenow={currentDuration}
        aria-label={`Odomknuté: ${currentDuration} z ${MAX_DURATION} sekúnd`}
      >
        {CLIP_DURATIONS.map((dur, idx) => {
          const isUnlocked = idx <= attempt
          const isCurrent = idx === Math.min(attempt, CLIP_DURATIONS.length - 1)
          const segWidth = ((dur - (CLIP_DURATIONS[idx - 1] ?? 0)) / MAX_DURATION) * 100

          return (
            <div
              key={dur}
              className={[
                'rounded-lg transition-all duration-300 relative overflow-hidden',
                isUnlocked
                  ? isCurrent
                    ? 'bg-gradient-to-r from-vice-hotpink to-vice-cyan shadow-neon-pink'
                    : 'bg-vice-hotpink/80 dark:bg-vice-hotpink/60'
                  : 'bg-purple-200/50 dark:bg-purple-950/40 border border-purple-300/40 dark:border-purple-900/30',
                isPlaying && isCurrent ? 'progress-playing' : '',
              ].join(' ')}
              style={{ flex: `${segWidth} 0 0`, height: '10px' }}
              title={`${dur} s`}
            />
          )
        })}
      </div>

      {/* ── Duration label ───────────────────────────────────────────────── */}
      <div className="flex justify-between text-xs text-purple-700/70 dark:text-purple-300/60 font-semibold px-0.5">
        <span>0 s</span>
        {attempt < CLIP_DURATIONS.length - 1 && (
          <span className="text-purple-900 dark:text-vice-cyan font-bold dark:drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]">
            +{skipBonus} s pri preskočení
          </span>
        )}
        <span>{MAX_DURATION} s</span>
      </div>
    </div>
  )
}
