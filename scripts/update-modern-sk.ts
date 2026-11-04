import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const songsPath = resolve(ROOT, 'src/data/songs.json')

interface Song {
  id: string
  title: string
  artist: string
  lang: 'sk' | 'en'
  genre: 'pop' | 'rock' | 'hiphop' | 'rnb' | 'electronic' | 'metal' | 'country' | 'indie'
  difficulty: 'easy' | 'medium' | 'hard'
  audio: string
  clipStart: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function searchItunes(term: string, country = 'SK', limit = 20) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=song&limit=${limit}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json() as { results?: Array<{ trackName?: string; artistName?: string; previewUrl?: string }> }
    return data.results || []
  } catch {
    return []
  }
}

// Moderní slovenskí interpreti (rap, trap, modern pop, r&b)
const MODERN_SK_ARTISTS = [
  'Separ', 'Sima', 'Gleb', 'Samey', 'Pil C', 'Kali',
  'Porsche Boy', 'Saul', 'Alan Murin', 'Wen', 'Luca Brassi10x',
  'Frayer Flexking', 'Emma Drobna', 'Majk Spirit', 'Neries',
  'Moja Rec', 'Ego', 'Dara Rolins', 'Dame', 'Smart', 'Taeynikk'
]

// Klasickí overení obľúbení interpreti
const CLASSIC_SK_ARTISTS = [
  'Elan', 'Miroslav Zbirka', 'Richard Muller', 'Pavol Habera', 'Kristina',
  'Peter Nagy', 'No Name', 'Tublatanka', 'Horkyze Slize', 'Ine Kafe',
  'IMT Smile', 'Adam Durica', 'Maria Cirova', 'Katarina Knechtova', 'Hex'
]

async function updateSlovakSongs() {
  console.log('🇸🇰 Načítavam moderné a klasické slovenské hity z iTunes...')
  
  const allSongs: Song[] = JSON.parse(readFileSync(songsPath, 'utf8'))
  const nonSkSongs = allSongs.filter(s => s.lang !== 'sk')

  const collectedTracks: Array<{ title: string; artist: string; audio: string; isModern: boolean }> = []
  const seenKeys = new Set<string>()

  // 1. Získaj skladby od moderných interpretov
  for (const artist of MODERN_SK_ARTISTS) {
    const results = await searchItunes(artist, 'SK', 15)
    for (const r of results) {
      if (!r.trackName || !r.artistName || !r.previewUrl) continue
      const key = `${r.artistName.toLowerCase()} - ${r.trackName.toLowerCase()}`
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
      collectedTracks.push({
        title: r.trackName,
        artist: r.artistName,
        audio: r.previewUrl,
        isModern: true
      })
    }
    await new Promise(r => setTimeout(r, 60))
  }

  // 2. Doplň skladby od overených legiend
  for (const artist of CLASSIC_SK_ARTISTS) {
    const results = await searchItunes(artist, 'SK', 15)
    for (const r of results) {
      if (!r.trackName || !r.artistName || !r.previewUrl) continue
      const key = `${r.artistName.toLowerCase()} - ${r.trackName.toLowerCase()}`
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
      collectedTracks.push({
        title: r.trackName,
        artist: r.artistName,
        audio: r.previewUrl,
        isModern: false
      })
    }
    await new Promise(r => setTimeout(r, 60))
  }

  console.log(`Celkovo nájdených ${collectedTracks.length} slovenských skladieb s audioprehrávaním.`)

  // Rozdelenie na Easy, Medium, Hard (po 50 v každej)
  // Pre každú obtiažnosť dáme silný mix moderného rapu/popu aj overených hitov
  const modern = collectedTracks.filter(t => t.isModern)
  const classic = collectedTracks.filter(t => !t.isModern)

  console.log(`Moderných: ${modern.length}, Klasických: ${classic.length}`)

  // Zostavíme 50 easy, 50 medium, 50 hard
  // V každej kategórii cca 30 moderných + 20 klasických
  const skEasyTracks = [...modern.slice(0, 30), ...classic.slice(0, 20)]
  const skMedTracks = [...modern.slice(30, 60), ...classic.slice(20, 40)]
  const skHardTracks = [...modern.slice(60, 90), ...classic.slice(40, 60)]

  const newSkSongs: Song[] = []

  skEasyTracks.forEach((t, i) => {
    newSkSongs.push({
      id: `sk-easy-${i + 1}-${slugify(t.artist)}-${slugify(t.title)}`,
      title: t.title,
      artist: t.artist,
      lang: 'sk',
      genre: t.isModern ? 'hiphop' : 'pop',
      difficulty: 'easy',
      audio: t.audio,
      clipStart: 0
    })
  })

  skMedTracks.forEach((t, i) => {
    newSkSongs.push({
      id: `sk-med-${i + 1}-${slugify(t.artist)}-${slugify(t.title)}`,
      title: t.title,
      artist: t.artist,
      lang: 'sk',
      genre: t.isModern ? 'hiphop' : 'pop',
      difficulty: 'medium',
      audio: t.audio,
      clipStart: 0
    })
  })

  skHardTracks.forEach((t, i) => {
    newSkSongs.push({
      id: `sk-hard-${i + 1}-${slugify(t.artist)}-${slugify(t.title)}`,
      title: t.title,
      artist: t.artist,
      lang: 'sk',
      genre: t.isModern ? 'hiphop' : 'pop',
      difficulty: 'hard',
      audio: t.audio,
      clipStart: 0
    })
  })

  const merged = [...newSkSongs, ...nonSkSongs]
  writeFileSync(songsPath, JSON.stringify(merged, null, 2), 'utf8')
  console.log(`\n🎉 Úspešne aktualizovaných 150 slovenských skladieb (moderný rap, pop + legendy).`)
  console.log(`Celkový počet skladieb v hre: ${merged.length}`)
}

updateSlovakSongs()
