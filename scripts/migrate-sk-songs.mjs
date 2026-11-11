/**
 * migrate-sk-songs.mjs
 * --------------------
 * Migrates existing Slovak songs in songs.json:
 *   - Adds `skType` field based on artist/era heuristic:
 *       "og"  = artists known from pre-2010 era (Elán, Žbirka, Müller, No Name, Tublatanka…)
 *       "modern" = everything else (default for newer artists)
 *   - Removes `difficulty` from SK songs (SK songs no longer use difficulty)
 *   - Adds sample folk songs with skType: "folk"
 *
 * Usage: node scripts/migrate-sk-songs.mjs
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

// Known OG Slovak artists (classic era, pre-2010 peak)
const OG_ARTISTS = new Set([
  'elán', 'richard müller', 'miroslav žbirka', 'marika gombitová', 'peter lipa',
  'tublatanka', 'hex', 'para', 'imt smile', 'no name', 'team', 'polemic',
  'metalinda', 'horkýže slíže', 'desmod', 'vec', 'fobia', 'support lesbiens',
  'miro jaroš', 'čechomor', 'hraj', 'trosky', 'kollárovci', 'jelen',
  'peter bič project', 'majk spirit', 'rytmus', 'ego', 'kontrafakt',
  'mucha', 'kristína', 'dara rolins', 'mária čírová', 'zuzana smatanová',
  'rebeka rašilová', 'celeste buckingham', 'žbirka', 'peter bič',
])

// Sample folk songs – at minimum 2 entries
const FOLK_SONGS = [
  {
    id: makeId('ľudová pieseň', 'Tancuj, tancuj, vykrúcaj'),
    title: 'Tancuj, tancuj, vykrúcaj',
    artist: 'ľudová pieseň',
    performer: 'Lúčnica',
    lang: 'sk',
    skType: 'folk',
    comment: 'overiť názov a interpreta',
    audio: 'fallback',
    clipStart: 0,
  },
  {
    id: makeId('ľudová pieseň', 'Kopala studienku'),
    title: 'Kopala studienku',
    artist: 'ľudová pieseň',
    performer: 'SĽUK',
    lang: 'sk',
    skType: 'folk',
    comment: 'overiť názov a interpreta',
    audio: 'fallback',
    clipStart: 0,
  },
  {
    id: makeId('ľudová pieseň', 'Hej, Slováci'),
    title: 'Hej, Slováci',
    artist: 'ľudová pieseň',
    lang: 'sk',
    skType: 'folk',
    comment: 'overiť názov a interpreta',
    audio: 'fallback',
    clipStart: 0,
  },
  {
    id: makeId('ľudová pieseň', 'Aká si mi krásna'),
    title: 'Aká si mi krásna',
    artist: 'ľudová pieseň',
    lang: 'sk',
    skType: 'folk',
    audio: 'fallback',
    clipStart: 0,
  },
  {
    id: makeId('ľudová pieseň', 'Pod tým naším oknom'),
    title: 'Pod tým naším oknom',
    artist: 'ľudová pieseň',
    lang: 'sk',
    skType: 'folk',
    audio: 'fallback',
    clipStart: 0,
  },
]

// Sample modern empty entries with TODO
const MODERN_TODO_SAMPLES = [
  {
    id: 'sk-modern-todo-1',
    title: '',
    artist: '',
    lang: 'sk',
    skType: 'modern',
    comment: 'overiť názov a interpreta',
    todo: true,
    audio: 'fallback',
    clipStart: 0,
  },
  {
    id: 'sk-modern-todo-2',
    title: '',
    artist: '',
    lang: 'sk',
    skType: 'modern',
    comment: 'overiť názov a interpreta',
    todo: true,
    audio: 'fallback',
    clipStart: 0,
  },
]

function assignSkType(song) {
  if (song.skType === 'folk') return 'folk'
  const artistLower = (song.artist || '').toLowerCase()
  for (const ogArtist of OG_ARTISTS) {
    if (artistLower.includes(ogArtist)) return 'og'
  }
  return 'modern'
}

async function main() {
  console.log('Loading songs.json…')
  const songs = JSON.parse(fs.readFileSync(songsPath, 'utf-8'))
  console.log(`  Total songs: ${songs.length}`)

  const skSongs = songs.filter(s => s.lang === 'sk')
  const enSongs = songs.filter(s => s.lang !== 'sk')
  console.log(`  SK: ${skSongs.length}, EN: ${enSongs.length}`)

  let modernCount = 0, ogCount = 0
  const migratedSk = skSongs.map(song => {
    const skType = assignSkType(song)
    if (skType === 'og') ogCount++
    else modernCount++

    // Remove difficulty, add skType, remove genre (not required for SK)
    const { difficulty: _d, genre: _g, ...rest } = song
    return { ...rest, skType }
  })

  console.log(`  Assigned: modern=${modernCount}, og=${ogCount}`)

  // Tag first 2 OG songs with comment
  let taggedOg = 0
  for (const song of migratedSk) {
    if (song.skType === 'og' && taggedOg < 2) {
      song.comment = 'overiť názov a interpreta'
      taggedOg++
    }
  }

  // Check for existing folk songs & update performer/comment
  const existingFolkIds = new Set(songs.filter(s => s.skType === 'folk').map(s => s.id))
  for (const song of migratedSk) {
    if (song.skType === 'folk') {
      const match = FOLK_SONGS.find(f => f.id === song.id)
      if (match) {
        if (match.performer) song.performer = match.performer
        song.comment = 'overiť názov a interpreta'
      }
    }
  }
  const newFolk = FOLK_SONGS.filter(f => !existingFolkIds.has(f.id))
  console.log(`  Adding ${newFolk.length} folk sample songs`)

  const existingIds = new Set([...songs.map(s => s.id), ...migratedSk.map(s => s.id), ...newFolk.map(s => s.id)])
  const newModern = MODERN_TODO_SAMPLES.filter(m => !existingIds.has(m.id))
  console.log(`  Adding ${newModern.length} modern TODO sample songs`)

  const result = [...enSongs, ...migratedSk, ...newFolk, ...newModern]

  fs.writeFileSync(songsPath, JSON.stringify(result, null, 2))
  console.log(`\n✓ Done! Total songs: ${result.length}`)

  // Summary
  const skResult = result.filter(s => s.lang === 'sk')
  const byType = {}
  skResult.forEach(s => { byType[s.skType] = (byType[s.skType] || 0) + 1 })
  console.log('\nSK by skType:')
  for (const [t, c] of Object.entries(byType)) console.log(`  ${t}: ${c}`)
}

main().catch(console.error)
