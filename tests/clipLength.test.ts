import { describe, it, expect } from 'vitest'
import { getClipDuration } from '../src/utils/songPicker'
import { CLIP_DURATIONS, MAX_ATTEMPTS } from '../src/types'

describe('CLIP_DURATIONS', () => {
  it('has correct values', () => {
    expect(CLIP_DURATIONS).toEqual([1, 2, 3, 5, 7, 10])
  })

  it('has exactly MAX_ATTEMPTS entries', () => {
    expect(CLIP_DURATIONS.length).toBe(MAX_ATTEMPTS)
    expect(MAX_ATTEMPTS).toBe(6)
  })

  it('maximum is 10 seconds', () => {
    expect(CLIP_DURATIONS[CLIP_DURATIONS.length - 1]).toBe(10)
  })

  it('is strictly increasing', () => {
    for (let i = 1; i < CLIP_DURATIONS.length; i++) {
      expect(CLIP_DURATIONS[i]).toBeGreaterThan(CLIP_DURATIONS[i - 1])
    }
  })
})

describe('getClipDuration', () => {
  it('returns correct duration for each attempt 0–5', () => {
    expect(getClipDuration(0)).toBe(1)
    expect(getClipDuration(1)).toBe(2)
    expect(getClipDuration(2)).toBe(3)
    expect(getClipDuration(3)).toBe(5)
    expect(getClipDuration(4)).toBe(7)
    expect(getClipDuration(5)).toBe(10)
  })

  it('clamps negative attempt to 0', () => {
    expect(getClipDuration(-1)).toBe(1)
    expect(getClipDuration(-99)).toBe(1)
  })

  it('clamps out-of-range attempt to max (10 s)', () => {
    expect(getClipDuration(6)).toBe(10)
    expect(getClipDuration(100)).toBe(10)
  })

  it('never exceeds 10 seconds', () => {
    for (let i = 0; i < 20; i++) {
      expect(getClipDuration(i)).toBeLessThanOrEqual(10)
    }
  })
})
