import { useEffect, useRef, useState } from 'react'
import { useGame } from '../hooks/useGame'
import { useStats } from '../hooks/useStats'
import { ALL_GENRES } from '../types'
import type { Genre } from '../types'
import FilterBar from './FilterBar'
import DifficultySelector from './DifficultySelector'
import AudioPlayer from './AudioPlayer'
import GuessInput from './GuessInput'
import GuessHistory from './GuessHistory'
import ResultModal from './ResultModal'
import StatsModal from './StatsModal'

export default function GameScreen() {
  const { gameState, filters, filteredSongs, allSongsForLang, audio, actions } = useGame()
  const { getStats, recordResult, resetStats } = useStats()
  const [showStats, setShowStats] = useState(false)

  const { currentSong, guesses, attempt, phase, isPlaying } = gameState
  const isEnded = phase === 'won' || phase === 'lost'

  // ── Record stats when a game ends ─────────────────────────────────────────
  // useRef persists the flag across renders without triggering re-renders
  const recordedRef = useRef(false)
  useEffect(() => {
    if (!isEnded) {
      recordedRef.current = false // reset flag for new game
      return
    }
    if (recordedRef.current) return
    recordedRef.current = true
    const won = phase === 'won'
    const correctGuess = guesses.find((g) => g.status === 'correct')
    const attemptNumber = correctGuess ? guesses.indexOf(correctGuess) + 1 : undefined
    recordResult(filters.difficulty, won, attemptNumber)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnded])

  // ── Genre toggle helpers ───────────────────────────────────────────────────
  const handleGenreToggle = (g: Genre) => {
    const current = filters.genres
    const next = current.includes(g)
      ? current.filter((x) => x !== g)
      : [...current, g]
    // Always keep at least one genre active
    if (next.length === 0) return
    actions.setGenres(next)
  }

  const handleGenreSelectAll = () => {
    actions.setGenres([...ALL_GENRES])
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  const isEmpty = filteredSongs.length === 0

  return (
    <div className="flex flex-col gap-6">
      {/* ── Settings row ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xs font-black text-vice-cyan uppercase tracking-widest font-display drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            🌴 VÝBER STANICE & OBTIAŽNOSTI
          </h1>
          <button
            onClick={() => setShowStats(true)}
            className="btn-secondary !px-3 !py-1.5 text-xs font-black gap-1.5"
            aria-label="Zobraziť štatistiky"
          >
            📊 SKÓRE
          </button>
        </div>

        <DifficultySelector
          current={filters.difficulty}
          onChange={actions.setDifficulty}
        />

        <FilterBar
          filters={filters}
          onLangChange={actions.setLang}
          onGenreToggle={handleGenreToggle}
          onGenreSelectAll={handleGenreSelectAll}
        />
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <hr className="border-vice-border/50" />

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {isEmpty ? (
        <div className="card p-8 text-center flex flex-col gap-3">
          <div className="text-4xl" aria-hidden="true">📻</div>
          <p className="font-bold text-white font-display uppercase tracking-wide">
            Pre tento výber zatiaľ nie sú skladby.
          </p>
          <p className="text-xs text-purple-300">
            Skús inú obtiažnosť alebo žáner.
          </p>
        </div>
      ) : (
        <>
          {/* ── Game area ─────────────────────────────────────────────────── */}
          <div className="card p-5 sm:p-6 flex flex-col gap-5 border-vice-pink/30 shadow-neon-pink/30">
          {/* Audio player */}
            <AudioPlayer
              attempt={attempt}
              isPlaying={isPlaying}
              isFallback={audio.isFallback}
              disabled={!currentSong || isEnded}
              onPlay={actions.playClip}
            />

            {/* Guess history */}
            <GuessHistory guesses={guesses} maxAttempts={6} />

            {/* Guess input (only shown while playing) */}
            {phase === 'playing' && currentSong && (
              <GuessInput
                songs={allSongsForLang}
                disabled={false}
                onGuess={actions.submitGuess}
                onSkip={actions.skipAttempt}
                currentAttempt={attempt}
                maxAttempts={6}
              />
            )}
          </div>
        </>
      )}

      {/* ── Result modal ──────────────────────────────────────────────────── */}
      {isEnded && currentSong && (
        <ResultModal
          song={currentSong}
          guesses={guesses}
          won={phase === 'won'}
          isPlaying={isPlaying}
          onPlayFull={actions.playFull}
          onNextSong={actions.nextSong}
        />
      )}

      {/* ── Stats modal ───────────────────────────────────────────────────── */}
      {showStats && (
        <StatsModal
          stats={getStats()}
          currentDifficulty={filters.difficulty}
          onClose={() => setShowStats(false)}
          onReset={() => { resetStats(); setShowStats(false) }}
        />
      )}
    </div>
  )
}
