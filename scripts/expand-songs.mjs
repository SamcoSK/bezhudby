/**
 * expand-songs.mjs
 * Fetches additional songs from iTunes API to bring each genre/difficulty to 100 songs.
 * Also re-assigns difficulty based on popularity (position in iTunes results = popularity rank).
 *
 * Run with: node scripts/expand-songs.mjs
 * Requires network access (BypassSandbox: true)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const songsPath = path.join(__dirname, '..', 'src', 'data', 'songs.json')

function makeId(artist, title) {
  return createHash('md5').update(`${artist}-${title}`).digest('hex').slice(0, 8)
}

async function fetchItunes(term, limit = 200, country = 'US', mediaType = 'music') {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=${mediaType}&limit=${limit}&country=${country}&lang=en_us`
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = await r.json()
    return data.results || []
  } catch (e) {
    console.error(`  ✗ fetch failed for "${term}": ${e.message}`)
    return []
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function assignDifficulty(idx, total) {
  // iTunes returns by relevance/popularity: index 0 = most popular
  // Top 40% = easy, next 30% = medium, bottom 30% = hard
  const pct = idx / total
  if (pct < 0.4) return 'easy'
  if (pct < 0.7) return 'medium'
  return 'hard'
}

// ─── Genre query map ───────────────────────────────────────────────────────────
const genreQueries = {
  pop: [
    'taylor swift hits',
    'ed sheeran top songs',
    'ariana grande hits',
    'billie eilish popular',
    'harry styles hits',
    'dua lipa top songs',
    'the weeknd hits',
    'olivia rodrigo popular',
    'post malone top songs',
    'charlie puth hits',
    'shawn mendes popular',
    'selena gomez top',
    'justin bieber hits',
    'katy perry popular',
    'lady gaga hits',
    'pop hits 2023',
    'pop hits 2024',
    'best pop songs 2022',
    'bruno mars top songs',
    'sia popular songs',
  ],
  rock: [
    'queen greatest hits',
    'ac dc top songs',
    'nirvana popular',
    'foo fighters hits',
    'green day popular',
    'linkin park top songs',
    'red hot chili peppers hits',
    'imagine dragons popular',
    'arctic monkeys top',
    'the killers hits',
    'twenty one pilots popular',
    'muse top songs',
    'radiohead popular',
    'pearl jam hits',
    'metallica top songs',
    'blink 182 popular',
    'oasis hits',
    'U2 top songs',
    'coldplay hits',
    'classic rock hits',
  ],
  hiphop: [
    'drake top songs',
    'kendrick lamar hits',
    'eminem popular',
    'jay z top songs',
    'kanye west hits',
    'lil wayne popular',
    'travis scott top',
    'j cole hits',
    'nicki minaj popular',
    'cardi b top songs',
    'future hits',
    'lil baby popular',
    'young thug top',
    '21 savage hits',
    'asap rocky popular',
    'chance the rapper',
    'macklemore hits',
    'hip hop hits 2023',
    'hip hop hits 2024',
    'best rap songs 2022',
  ],
  rnb: [
    'beyonce top songs',
    'rihanna hits',
    'usher popular',
    'alicia keys top',
    'john legend hits',
    'frank ocean popular',
    'sza top songs',
    'h.e.r. hits',
    'giveon popular',
    'daniel caesar top',
    'ella mai hits',
    'jhene aiko popular',
    'summer walker top',
    'ari lennox hits',
    'brent faiyaz popular',
    'ty dolla sign',
    'rnb hits 2023',
    'rnb hits 2024',
    'best rnb 2022',
    'neo soul hits',
  ],
  electronic: [
    'daft punk top songs',
    'calvin harris hits',
    'martin garrix popular',
    'avicii top songs',
    'deadmau5 hits',
    'skrillex popular',
    'tiesto top songs',
    'david guetta hits',
    'marshmello popular',
    'alan walker top',
    'kygo hits',
    'zedd popular',
    'flume top songs',
    'disclosure hits',
    'odesza popular',
    'electronic dance hits 2023',
    'edm hits 2024',
    'best electronic 2022',
    'aphex twin popular',
    'boards of canada',
  ],
  metal: [
    'metallica top songs',
    'iron maiden hits',
    'black sabbath popular',
    'megadeth top songs',
    'slayer hits',
    'pantera popular',
    'tool top songs',
    'system of a down hits',
    'disturbed popular',
    'five finger death punch top',
    'avenged sevenfold hits',
    'slipknot popular',
    'rammstein top songs',
    'korn hits',
    'breaking benjamin popular',
    'godsmack top songs',
    'alice in chains hits',
    'soundgarden popular',
    'metal hits classic',
    'heavy metal top songs',
  ],
  country: [
    'luke combs hits',
    'morgan wallen top songs',
    'zach bryan popular',
    'tyler childers hits',
    'kacey musgraves top',
    'dolly parton hits',
    'johnny cash popular',
    'garth brooks top songs',
    'carrie underwood hits',
    'blake shelton popular',
    'kane brown top songs',
    'tim mcgraw hits',
    'keith urban popular',
    'miranda lambert top',
    'chris stapleton hits',
    'brad paisley popular',
    'florida georgia line',
    'country hits 2023',
    'country hits 2024',
    'best country songs 2022',
  ],
  indie: [
    'arctic monkeys top songs',
    'tame impala hits',
    'the strokes popular',
    'vampire weekend top',
    'mgmt hits',
    'arcade fire popular',
    'foals top songs',
    'the national hits',
    'bon iver popular',
    'sufjan stevens top',
    'beach house hits',
    'alt j popular',
    'glass animals top',
    'phoebe bridgers hits',
    'rex orange county popular',
    'clairo top songs',
    'indie hits 2023',
    'indie hits 2024',
    'best indie songs 2022',
    'alex g popular',
  ],
}

// ─── SK artists ───────────────────────────────────────────────────────────────
const skArtists = [
  'Separ', 'Gleb', 'Samey', 'Sima Martausová', 'Kali', 'Pil C', 'Vec',
  'Majk Spirit', 'Rytmus', 'Ego', 'Kontrafakt', 'Momo', 'Papylot',
  'Laris Diam', 'Zayo', 'Izzy, Black', 'Rebeka Rašilová',
  'Desmod', 'No Name', 'Polemic', 'Metalinda', 'Horkýže Slíže',
  'Elán', 'Richard Müller', 'Miroslav Žbirka', 'Peter Lipa',
  'Tublatanka', 'Hex', 'Para', 'IMT Smile',
  'Jakub Rychlý', 'Martin Harich', 'Tomáš Sloboda', 'Celeste Buckingham',
  'Dara Rolins', 'Kristína', 'Mária Čírová', 'Zuzana Smatanová',
  'Jelen', 'Peter Bič Project', 'Kollárovci',
  'Trosky', 'Hraj', 'Čechomor', 'Mucha',
  'Miro Jaroš', 'Fobia', 'Support Lesbiens',
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading existing songs.json...')
  const existing = JSON.parse(fs.readFileSync(songsPath, 'utf-8'))
  console.log(`  Existing songs: ${existing.length}`)

  // Build lookup of existing audio URLs to avoid duplicates
  const existingAudioUrls = new Set(existing.map((s) => s.audio).filter(Boolean))
  const existingKeys = new Set(existing.map((s) => `${s.artist.toLowerCase()}-${s.title.toLowerCase()}`))

  const newSongs = []

  function tryAdd(artist, title, audio, lang, genre, difficulty) {
    if (!audio || audio.includes('fallback')) return false
    const key = `${artist.toLowerCase()}-${title.toLowerCase()}`
    if (existingKeys.has(key) || existingAudioUrls.has(audio)) return false
    existingKeys.add(key)
    existingAudioUrls.add(audio)
    newSongs.push({
      id: makeId(artist, title),
      title,
      artist,
      genre,
      difficulty,
      lang,
      audio,
    })
    return true
  }

  // Count current songs per genre-difficulty to know how many more we need
  const currentCounts = {}
  for (const genre of Object.keys(genreQueries)) {
    for (const diff of ['easy', 'medium', 'hard']) {
      const k = `${genre}-${diff}`
      currentCounts[k] = existing.filter(
        (s) => s.lang === 'en' && s.genre === genre && s.difficulty === diff,
      ).length
    }
  }
  console.log('Current EN counts per genre-difficulty:')
  for (const [k, v] of Object.entries(currentCounts)) {
    if (v < 100) console.log(`  ${k}: ${v}/100 → need ${100 - v} more`)
  }

  // ─── Fetch EN songs ──────────────────────────────────────────────────────────
  const TARGET = 100
  for (const [genre, queries] of Object.entries(genreQueries)) {
    console.log(`\n── Fetching EN ${genre} ──`)
    // Collect from all queries first; we'll assign difficulty by global rank
    const collected = []

    for (const q of queries) {
      const results = await fetchItunes(q, 50)
      let added = 0
      for (const r of results) {
        if (!r.previewUrl) continue
        const key = `${(r.artistName || '').toLowerCase()}-${(r.trackName || '').toLowerCase()}`
        if (existingKeys.has(key) || existingAudioUrls.has(r.previewUrl)) continue
        collected.push({
          artist: r.artistName,
          title: r.trackName,
          audio: r.previewUrl,
          releaseDate: r.releaseDate,
        })
        existingKeys.add(key)
        existingAudioUrls.add(r.previewUrl)
        added++
      }
      console.log(`  "${q}": +${added}`)
      await sleep(500) // Rate limit
    }

    // Sort by releaseDate desc (newer first) to mix in recency
    collected.sort((a, b) => {
      const ya = a.releaseDate ? new Date(a.releaseDate).getFullYear() : 2000
      const yb = b.releaseDate ? new Date(b.releaseDate).getFullYear() : 2000
      return yb - ya
    })

    // Assign difficulty: top 40% = easy, next 30% = medium, bottom 30% = hard
    const total = collected.length
    for (let i = 0; i < total; i++) {
      const diff = assignDifficulty(i, total)
      const c = collected[i]
      newSongs.push({
        id: makeId(c.artist, c.title),
        title: c.title,
        artist: c.artist,
        genre,
        difficulty: diff,
        lang: 'en',
        audio: c.audio,
      })
    }
    console.log(`  → Collected ${total} new for ${genre}`)
  }

  // ─── Fetch SK songs ──────────────────────────────────────────────────────────
  const skEasyTarget = 100
  const skMedTarget = 100
  const skHardTarget = 100
  const currentSkEasy = existing.filter((s) => s.lang === 'sk' && s.difficulty === 'easy').length
  const currentSkMed = existing.filter((s) => s.lang === 'sk' && s.difficulty === 'medium').length
  const currentSkHard = existing.filter((s) => s.lang === 'sk' && s.difficulty === 'hard').length
  console.log(`\nCurrent SK: easy=${currentSkEasy}, medium=${currentSkMed}, hard=${currentSkHard}`)
  console.log(`\n── Fetching SK songs ──`)

  const skCollected = []
  for (const artist of skArtists) {
    const results = await fetchItunes(artist, 30, 'SK')
    let added = 0
    for (const r of results) {
      if (!r.previewUrl) continue
      const key = `${(r.artistName || '').toLowerCase()}-${(r.trackName || '').toLowerCase()}`
      if (existingKeys.has(key) || existingAudioUrls.has(r.previewUrl)) continue
      skCollected.push({
        artist: r.artistName,
        title: r.trackName,
        audio: r.previewUrl,
        releaseDate: r.releaseDate,
      })
      existingKeys.add(key)
      existingAudioUrls.add(r.previewUrl)
      added++
    }
    console.log(`  SK "${artist}": +${added}`)
    await sleep(400)
  }

  // Also search popular SK terms
  const skTerms = ['slovenská hudba', 'slovenský rap', 'slovenský pop', 'slovak pop hits', 'slovak rap hits', 'slovak music top']
  for (const term of skTerms) {
    const results = await fetchItunes(term, 50, 'SK')
    let added = 0
    for (const r of results) {
      if (!r.previewUrl) continue
      const key = `${(r.artistName || '').toLowerCase()}-${(r.trackName || '').toLowerCase()}`
      if (existingKeys.has(key) || existingAudioUrls.has(r.previewUrl)) continue
      skCollected.push({
        artist: r.artistName,
        title: r.trackName,
        audio: r.previewUrl,
        releaseDate: r.releaseDate,
      })
      existingKeys.add(key)
      existingAudioUrls.add(r.previewUrl)
      added++
    }
    console.log(`  SK term "${term}": +${added}`)
    await sleep(500)
  }

  // Sort by recency desc and assign difficulty
  skCollected.sort((a, b) => {
    const ya = a.releaseDate ? new Date(a.releaseDate).getFullYear() : 2000
    const yb = b.releaseDate ? new Date(b.releaseDate).getFullYear() : 2000
    return yb - ya
  })

  const totalSk = skCollected.length
  for (let i = 0; i < totalSk; i++) {
    const diff = assignDifficulty(i, totalSk)
    const c = skCollected[i]
    newSongs.push({
      id: makeId(c.artist, c.title),
      title: c.title,
      artist: c.artist,
      genre: 'pop',
      difficulty: diff,
      lang: 'sk',
      audio: c.audio,
    })
  }
  console.log(`  → Collected ${totalSk} new SK songs`)

  // ─── Write merged result ────────────────────────────────────────────────────
  console.log(`\nNew songs collected: ${newSongs.length}`)
  const allSongs = [...existing, ...newSongs]

  // Deduplicate by audio URL one final time
  const seenUrls = new Set()
  const deduped = allSongs.filter((s) => {
    if (!s.audio || seenUrls.has(s.audio)) return false
    seenUrls.add(s.audio)
    return true
  })

  console.log(`Total after dedup: ${deduped.length}`)
  fs.writeFileSync(songsPath, JSON.stringify(deduped, null, 2))
  console.log('✓ songs.json updated!')

  // Print summary
  const byGenreDiff = {}
  deduped.filter((s) => s.lang === 'en').forEach((s) => {
    const k = `${s.genre}-${s.difficulty}`
    byGenreDiff[k] = (byGenreDiff[k] || 0) + 1
  })
  console.log('\nFinal EN counts:')
  for (const [k, v] of Object.entries(byGenreDiff).sort()) {
    const status = v >= 100 ? '✓' : '✗'
    console.log(`  ${status} ${k}: ${v}`)
  }

  const skByDiff = {}
  deduped.filter((s) => s.lang === 'sk').forEach((s) => {
    skByDiff[s.difficulty] = (skByDiff[s.difficulty] || 0) + 1
  })
  console.log('\nFinal SK counts:')
  for (const [k, v] of Object.entries(skByDiff)) {
    console.log(`  ${k}: ${v}`)
  }
}

main().catch(console.error)
