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
  genre: string
  difficulty: string
  audio: string
  clipStart?: number
}

const songs: Song[] = JSON.parse(readFileSync(songsPath, 'utf8'))

async function searchPreview(song: Song): Promise<string | null> {
  const query = `${song.artist} ${song.title}`
  const countryParam = song.lang === 'sk' ? '&country=SK' : ''
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5${countryParam}`
  
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { results?: Array<{ previewUrl?: string; trackName?: string; artistName?: string }> }
    if (data.results && data.results.length > 0) {
      const match = data.results.find(r => r.previewUrl)
      if (match?.previewUrl) return match.previewUrl
    }
  } catch (err) {
    console.error(`Chyba pri hľadaní ${query}:`, err)
  }

  // Ak nenašlo s country=SK alebo pre konkrétny názov, skúsime len názov a interpreta bez obmedzení
  if (song.lang === 'sk') {
    try {
      const fallbackUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`
      const res = await fetch(fallbackUrl)
      if (res.ok) {
        const data = await res.json() as { results?: Array<{ previewUrl?: string }> }
        const match = data.results?.find(r => r.previewUrl)
        if (match?.previewUrl) return match.previewUrl
      }
    } catch {}
  }

  return null
}

async function run() {
  console.log(`Začínam sťahovanie online ukážok pre všetkých ${songs.length} skladieb naraz...`)
  let found = 0
  let missing = 0

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    process.stdout.write(`[${i + 1}/${songs.length}] ${song.artist} – ${song.title}... `)
    
    const previewUrl = await searchPreview(song)
    if (previewUrl) {
      song.audio = previewUrl
      found++
      console.log(`✅ Nájdené`)
    } else {
      missing++
      console.log(`⚠️ Nenájdené`)
    }
    // Krátka pauza aby sme neprekročili rate limit
    await new Promise(r => setTimeout(r, 200))
  }

  writeFileSync(songsPath, JSON.stringify(songs, null, 2), 'utf8')
  console.log(`\nHotovo!`)
  console.log(`Nájdených online ukážok: ${found}/${songs.length}`)
  if (missing > 0) {
    console.log(`Nenájdených: ${missing}`)
  }
}

run()
