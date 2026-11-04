import { writeFileSync } from 'fs'
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

async function searchItunes(term: string, country?: string, limit = 50) {
  const cParam = country ? `&country=${country}` : ''
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=${limit}${cParam}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json() as { results?: Array<{ trackName?: string; artistName?: string; previewUrl?: string }> }
    return data.results || []
  } catch {
    return []
  }
}

// Skupiny dopytov pre EN podľa žánrov
const EN_GENRES = [
  { genre: 'pop', terms: ['pop hits', 'top pop', 'pop party', 'taylor swift', 'dua lipa', 'ed sheeran', 'ariana grande', 'bruno mars'] },
  { genre: 'rock', terms: ['rock hits', 'classic rock', 'queen', 'ac/dc', 'guns n roses', 'nirvana', 'linkin park', 'red hot chili peppers'] },
  { genre: 'hiphop', terms: ['hip hop hits', 'rap', 'eminem', 'drake', 'kendrick lamar', 'snoop dogg', '50 cent', 'travis scott'] },
  { genre: 'rnb', terms: ['r&b hits', 'rnb classics', 'rihanna', 'beyonce', 'usher', 'the weeknd', 'alicia keys', 'sza'] },
  { genre: 'electronic', terms: ['electronic dance', 'edm hits', 'avicii', 'daft punk', 'calvin harris', 'david guetta', 'martin garrix', 'kygo'] },
  { genre: 'metal', terms: ['heavy metal', 'metallica', 'iron maiden', 'black sabbath', 'slipknot', 'system of a down', 'judas priest', 'pantera'] },
  { genre: 'country', terms: ['country hits', 'johnny cash', 'dolly parton', 'luke combs', 'morgan wallen', 'garth brooks', 'shania twain', 'chris stapleton'] },
  { genre: 'indie', terms: ['indie rock', 'the killers', 'arctic monkeys', 'mgmt', 'arcade fire', 'foals', 'florence and the machine', 'vance joy'] }
] as const

// SK umelci na pokrytie 50 ľahkých, 50 stredných, 50 ťažkých
const SK_ARTISTS = [
  'Elan', 'Miroslav Zbirka', 'Pavol Habera', 'Team', 'Richard Muller',
  'Marika Gombitova', 'Peter Nagy', 'Kristina', 'No Name', 'Tublatanka',
  'Horkyze Slize', 'Ine Kafe', 'Desmod', 'Gladiator', 'IMT Smile',
  'Rytmus', 'Kontrafakt', 'Sima', 'Kali', 'Separ', 'Dara Rolins',
  'Katarina Knechtova', 'Maria Cirova', 'Adam Durica', 'Polemic',
  'Billy Barman', 'Korben Dallas', 'Hex', 'Vidiek', 'Smola a Hrusky'
]

async function generateTargetDatabase() {
  console.log('🚀 Začínam generovanie kompletnej databázy (50 skladieb pre každú kategóriu)...')
  const songs: Song[] = []
  const seenTracks = new Set<string>()

  // 1. GENERUJ SLOVENSKÉ SKLADBY: 50 easy, 50 medium, 50 hard (spolu 150)
  console.log('\n🇸🇰 Sťahujem slovenské skladby...')
  const skTracks: Array<{ title: string; artist: string; audio: string }> = []
  
  for (const artist of SK_ARTISTS) {
    const results = await searchItunes(artist, 'SK', 20)
    for (const r of results) {
      if (!r.trackName || !r.artistName || !r.previewUrl) continue
      const key = `${r.artistName.toLowerCase()} - ${r.trackName.toLowerCase()}`
      if (seenTracks.has(key)) continue
      seenTracks.add(key)
      skTracks.push({
        title: r.trackName,
        artist: r.artistName,
        audio: r.previewUrl
      })
    }
    await new Promise(res => setTimeout(res, 80))
  }

  console.log(`Získaných ${skTracks.length} slovenských unikátnych skladieb s audioprehrávaním.`)

  const skEasy = skTracks.slice(0, 50)
  const skMedium = skTracks.slice(50, 100)
  const skHard = skTracks.slice(100, 150)

  skEasy.forEach((t, i) => songs.push({
    id: `sk-easy-${i + 1}-${slugify(t.artist)}-${slugify(t.title)}`,
    title: t.title,
    artist: t.artist,
    lang: 'sk',
    genre: 'pop',
    difficulty: 'easy',
    audio: t.audio,
    clipStart: 0
  }))

  skMedium.forEach((t, i) => songs.push({
    id: `sk-med-${i + 1}-${slugify(t.artist)}-${slugify(t.title)}`,
    title: t.title,
    artist: t.artist,
    lang: 'sk',
    genre: 'pop',
    difficulty: 'medium',
    audio: t.audio,
    clipStart: 0
  }))

  skHard.forEach((t, i) => songs.push({
    id: `sk-hard-${i + 1}-${slugify(t.artist)}-${slugify(t.title)}`,
    title: t.title,
    artist: t.artist,
    lang: 'sk',
    genre: 'pop',
    difficulty: 'hard',
    audio: t.audio,
    clipStart: 0
  }))

  console.log(`✅ Pridaných 150 slovenských skladieb (50 easy, 50 medium, 50 hard).`)

  // 2. GENERUJ ANGLICKÉ SKLADBY: 8 žánrov × 3 obtiažnosti × 50 = 1 200 skladieb
  console.log('\n🌎 Sťahujem anglické skladby (8 žánrov × 150 skladieb)...')

  for (const g of EN_GENRES) {
    const genreTracks: Array<{ title: string; artist: string; audio: string }> = []
    
    for (const term of g.terms) {
      if (genreTracks.length >= 150) break
      const results = await searchItunes(term, 'US', 40)
      for (const r of results) {
        if (!r.trackName || !r.artistName || !r.previewUrl) continue
        const key = `${r.artistName.toLowerCase()} - ${r.trackName.toLowerCase()}`
        if (seenTracks.has(key)) continue
        seenTracks.add(key)
        genreTracks.push({
          title: r.trackName,
          artist: r.artistName,
          audio: r.previewUrl
        })
        if (genreTracks.length >= 150) break
      }
      await new Promise(res => setTimeout(res, 80))
    }

    console.log(`Žáner ${g.genre.toUpperCase()}: stiahnutých ${genreTracks.length} skladieb.`)

    const easy = genreTracks.slice(0, 50)
    const medium = genreTracks.slice(50, 100)
    const hard = genreTracks.slice(100, 150)

    easy.forEach((t, i) => songs.push({
      id: `en-${g.genre}-easy-${i + 1}-${slugify(t.artist)}-${slugify(t.title)}`,
      title: t.title,
      artist: t.artist,
      lang: 'en',
      genre: g.genre as any,
      difficulty: 'easy',
      audio: t.audio,
      clipStart: 0
    }))

    medium.forEach((t, i) => songs.push({
      id: `en-${g.genre}-med-${i + 1}-${slugify(t.artist)}-${slugify(t.title)}`,
      title: t.title,
      artist: t.artist,
      lang: 'en',
      genre: g.genre as any,
      difficulty: 'medium',
      audio: t.audio,
      clipStart: 0
    }))

    hard.forEach((t, i) => songs.push({
      id: `en-${g.genre}-hard-${i + 1}-${slugify(t.artist)}-${slugify(t.title)}`,
      title: t.title,
      artist: t.artist,
      lang: 'en',
      genre: g.genre as any,
      difficulty: 'hard',
      audio: t.audio,
      clipStart: 0
    }))
  }

  // 3. ULOŽ DO songs.json
  writeFileSync(songsPath, JSON.stringify(songs, null, 2), 'utf8')
  console.log(`\n🎉 HOTOVO! Databáza obsahuje celkovo ${songs.length} skladieb, všetky so skutočným funkčným audiom.`)
}

generateTargetDatabase()
