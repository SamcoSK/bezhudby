/**
 * Text normalisation utilities for Bezhudby.
 *
 * Used for case/diacritic-insensitive song searching
 * ("elan" matches "Elán", "vyznanie" matches "Vyznanie").
 */

/**
 * Strips diacritics and converts to lowercase.
 * e.g. "Elán" → "elan", "VYZNANIE" → "vyznanie"
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')                       // decompose combined glyphs
    .replace(/[\u0300-\u036f]/g, '')        // remove diacritic marks
    .toLowerCase()
    .trim()
}

/**
 * Returns true if the song's title or artist contains the query string
 * after both are normalized.
 */
export function songMatchesQuery(
  song: { title: string; artist: string },
  query: string,
): boolean {
  if (!query.trim()) return false
  const q = normalizeText(query)
  return (
    normalizeText(song.title).includes(q) ||
    normalizeText(song.artist).includes(q)
  )
}

/**
 * Returns true if two strings are equal after normalization.
 * Used to verify an exact match for a guess.
 */
export function normalizedEquals(a: string, b: string): boolean {
  return normalizeText(a) === normalizeText(b)
}
