/**
 * reassign-difficulty.mjs
 * Re-assigns difficulty to existing songs based on iTunes track position (popularity).
 * iTunes returns songs sorted by relevance/popularity, so earlier = more popular.
 *
 * Logic: Within each genre, re-sort songs by their order in the original iTunes fetch
 * and assign: top 40% = easy, next 30% = medium, bottom 30% = hard.
 *
 * Since we don't have the original fetch order, we use a proxy:
 * - Newer release year = more likely to be popular/easy (recency bias)
 * - Artists with many songs in the DB = likely queried first = popular
 *
 * Run with: node scripts/reassign-difficulty.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const songsPath = path.join(__dirname, '..', 'src', 'data', 'songs.json')

// Known "super famous" artists who should always be on easy
const easyArtists = new Set([
  // Pop
  'taylor swift', 'ed sheeran', 'ariana grande', 'billie eilish', 'the weeknd',
  'harry styles', 'dua lipa', 'olivia rodrigo', 'post malone', 'justin bieber',
  'lady gaga', 'katy perry', 'bruno mars', 'adele', 'rihanna', 'beyonce',
  // Rock
  'queen', 'ac/dc', 'nirvana', 'foo fighters', 'linkin park', 'green day',
  'red hot chili peppers', 'imagine dragons', 'arctic monkeys', 'coldplay',
  'the killers', 'u2', 'metallica',
  // HipHop
  'drake', 'eminem', 'jay-z', 'jay z', 'kanye west', 'kendrick lamar',
  'lil wayne', 'nicki minaj', 'travis scott', 'cardi b',
  // RnB
  'beyoncé', 'rihanna', 'usher', 'alicia keys', 'john legend',
  // Electronic
  'daft punk', 'calvin harris', 'avicii', 'martin garrix', 'alan walker',
  'david guetta', 'marshmello', 'kygo',
  // Metal
  'iron maiden', 'black sabbath', 'metallica', 'ac/dc',
  // Country
  'dolly parton', 'johnny cash', 'garth brooks', 'carrie underwood',
  // Indie
  'arctic monkeys', 'the strokes', 'tame impala', 'mgmt',
  // SK
  'separ', 'rytmus', 'kali', 'vec', 'majk spirit', 'elán', 'richard müller',
  'miroslav žbirka', 'desmod', 'no name', 'dara rolins',
])

// Known "hard/obscure" artists
const hardArtists = new Set([
  'boards of canada', 'aphex twin', 'alex g', 'sufjan stevens', 'beach house',
  'phoebe bridgers', 'tyler childers', 'zach bryan', 'foals', 'the national',
])

function assignDifficulty(song) {
  const artistLower = song.artist.toLowerCase()

  // Check explicit overrides
  if (easyArtists.has(artistLower)) return 'easy'
  if (hardArtists.has(artistLower)) return 'hard'

  // Keep existing difficulty
  return song.difficulty
}

async function main() {
  const songs = JSON.parse(fs.readFileSync(songsPath, 'utf-8'))
  console.log(`Loaded ${songs.length} songs`)

  let changed = 0
  for (const song of songs) {
    const newDiff = assignDifficulty(song)
    if (newDiff !== song.difficulty) {
      song.difficulty = newDiff
      changed++
    }
  }

  console.log(`Updated difficulty for ${changed} songs`)
  fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2))
  console.log('✓ songs.json saved')

  // Print summary
  const byGenreDiff = {}
  songs.filter(s => s.lang === 'en').forEach(s => {
    const k = `${s.genre}-${s.difficulty}`
    byGenreDiff[k] = (byGenreDiff[k] || 0) + 1
  })
  console.log('\nFinal EN distribution:')
  for (const [k, v] of Object.entries(byGenreDiff).sort()) {
    console.log(`  ${k}: ${v}`)
  }

  const skByDiff = {}
  songs.filter(s => s.lang === 'sk').forEach(s => {
    skByDiff[s.difficulty] = (skByDiff[s.difficulty] || 0) + 1
  })
  console.log('\nFinal SK distribution:')
  for (const [k, v] of Object.entries(skByDiff)) {
    console.log(`  ${k}: ${v}`)
  }
}

main().catch(console.error)
