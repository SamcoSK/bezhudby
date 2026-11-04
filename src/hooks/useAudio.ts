import { useCallback, useRef, useState } from 'react'

/**
 * useAudio – Web Audio API hook for precise clip playback.
 *
 * Features:
 * - Plays audio from `offset` seconds for exactly `duration` seconds
 * - Short fade-out at the end to avoid clicking artifacts
 * - Fallback: if the audio fails to load, generates a synthesized tone
 *   via OscillatorNode so the game can still be played.
 */

const FADE_DURATION = 0.08 // seconds

export interface UseAudioReturn {
  play: (src: string, offset: number, duration: number) => Promise<void>
  stop: () => void
  isPlaying: boolean
  isFallback: boolean
}

export function useAudio(): UseAudioReturn {
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | AudioScheduledSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFallback, setIsFallback] = useState(false)

  // Cache decoded audio buffers by URL
  const bufferCache = useRef<Map<string, AudioBuffer>>(new Map())

  const getContext = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }, [])

  const stop = useCallback(() => {
    try {
      sourceRef.current?.stop()
    } catch {
      // already stopped
    }
    sourceRef.current = null
    gainRef.current = null
    setIsPlaying(false)
  }, [])

  /**
   * Plays a synthesized fallback tone (sine wave at given frequency).
   * ⚠️  FALLBACK – only used when audio file is unavailable.
   */
  const playFallbackTone = useCallback((
    ctx: AudioContext,
    duration: number,
    frequency = 440,
  ) => {
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime + duration - FADE_DURATION)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency
    osc.connect(gain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)

    sourceRef.current = osc
    gainRef.current = gain

    osc.onended = () => {
      setIsPlaying(false)
      sourceRef.current = null
    }
  }, [])

  const play = useCallback(async (
    src: string,
    offset: number,
    duration: number,
  ): Promise<void> => {
    // Stop any currently playing audio
    stop()

    const ctx = getContext()

    // Resume context if suspended (iOS/Safari require user-gesture activation)
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    setIsPlaying(true)

    // ── Load & decode audio buffer ──────────────────────────────────────────
    let buffer: AudioBuffer | null = bufferCache.current.get(src) ?? null

    if (!buffer) {
      try {
        const response = await fetch(src)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const arrayBuffer = await response.arrayBuffer()
        buffer = await ctx.decodeAudioData(arrayBuffer)
        bufferCache.current.set(src, buffer)
        setIsFallback(false)
      } catch {
        // ⚠️  FALLBACK MODE: audio file not found or decode error
        // Plays a synthesized tone instead so gameplay still works.
        // Replace audio files in public/audio/ to disable this fallback.
        console.warn(
          `[Bezhudby] Audio nie je dostupné pre "${src}". ` +
          'Prehrávam záložný tón.',
        )
        setIsFallback(true)
        playFallbackTone(ctx, duration)
        return
      }
    } else {
      setIsFallback(false)
    }

    // ── Precise clip playback ───────────────────────────────────────────────
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(1, ctx.currentTime)
    // Fade out at end
    gain.gain.setValueAtTime(1, ctx.currentTime + duration - FADE_DURATION)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(gain)

    // AudioBufferSourceNode.start(when, offset, duration)
    source.start(ctx.currentTime, offset, duration)

    sourceRef.current = source
    gainRef.current = gain

    source.onended = () => {
      setIsPlaying(false)
      sourceRef.current = null
    }
  }, [stop, getContext, playFallbackTone])

  return { play, stop, isPlaying, isFallback }
}
