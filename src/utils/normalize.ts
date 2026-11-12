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
  song: { title?: string; artist?: string },
  query: string,
): boolean {
  if (!query.trim()) return false
  if (!song.title && !song.artist) return false
  const q = normalizeText(query)
  return (
    normalizeText(song.title || '').includes(q) ||
    normalizeText(song.artist || '').includes(q)
  )
}

/**
 * Returns true if two strings are equal after normalization.
 * Used to verify an exact match for a guess.
 */
export function normalizedEquals(a: string, b: string): boolean {
  return normalizeText(a) === normalizeText(b)
}

/**
 * Checks whether two songs share the same author/artist.
 * Returns true if:
 * - Artists match exactly (case/diacritics insensitive)
 * - Or they share any collaborator/band member in multi-artist credits (e.g. "Separ & Peter Pann" vs "Separ")
 * - For folk songs ("ľudová pieseň"), checks performers if available
 */
export function isArtistMatch(
  artistA: string,
  artistB: string,
  performerA?: string,
  performerB?: string,
): boolean {
  if (!artistA || !artistB) return false

  const normA = normalizeText(artistA)
  const normB = normalizeText(artistB)

  // Direct exact match
  if (normA === normB) {
    if (normA === 'ludova piesen' || normA === 'ludovka') {
      if (performerA && performerB) {
        return normalizeText(performerA) === normalizeText(performerB)
      }
    }
    return true
  }

  // Check performer match for folk songs
  if (performerA && performerB) {
    if (normalizeText(performerA) === normalizeText(performerB)) {
      return true
    }
  }

  // Tokenize artists by separators (&, feat, ft, commas, and, a)
  const splitTokens = (str: string): string[] =>
    str
      .split(/(?:,|\/|&|\+|\bfeat\.?|\bft\.?|\bvs\.?|\band\b|\ba\b)/i)
      .map((s) => normalizeText(s).trim())
      .filter((s) => s.length >= 2)

  const tokensA = splitTokens(artistA)
  const tokensB = splitTokens(artistB)

  return tokensA.some((a) =>
    tokensB.some(
      (b) =>
        a === b ||
        (a.length >= 4 && b.includes(a)) ||
        (b.length >= 4 && a.includes(b)),
    ),
  )
}
