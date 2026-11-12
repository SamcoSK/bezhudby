import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const songsPath = path.join(ROOT, 'src/data/songs.json')

function makeId(artist, title) {
  return createHash('md5').update(`${artist}-${title}`).digest('hex').slice(0, 8)
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function searchItunes(term, country = 'SK', limit = 20) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=song&limit=${limit}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch (e) {
    console.error(`Error searching iTunes for "${term}":`, e.message)
    return []
  }
}

// Foreign/junk artists that should NEVER be in lang === 'sk'
const JUNK_ARTISTS = [
  'Nightwish', 'Mucha', 'Sergei Barracuda', 'Knyazev (RU)', 'Beyoncé', 'Black Sabbath',
  'Black Label Society', 'Black Pistol Fire', 'Cigarettes After Sex', 'Duke Ellington',
  'Ella Eyre', 'G-Eazy', 'Lana Del Rey', 'Macky Gee', 'Milky Chance', 'Ozzy Osbourne',
  'PARTYNEXTDOOR', 'Red Hot Chili Peppers', 'The White Stripes', 'White Zombie',
  'Willy William', 'ZZ Top', 'Berlin Philharmonic', 'Leonard Bernstein', 'Bi-2',
  'Białas', 'Đorđe Balašević', 'James Judd', 'Martin Phipps', 'Philharmonia Orchestra',
  'Rinaldo Alessandrini', 'Sylvia McNair', 'The One World Ensemble', 'The Saturdays',
  'Banx & Ranx', 'Indila', 'Ivan Zak', 'MEJAŠI', 'Srebrna Krila', 'Panos Mouzourakis',
  'Daniel Boyacioglu', 'Huda Hussain', 'Alok, Kickbait & Ceres', 'Giles Appleton',
  'Amco', 'AK', 'ARTHUR', 'Basta Fix', 'Cavalier', 'Chaozz', 'Decky', 'Devito',
  'Dollar Prync', 'Elevenhill', 'Exact', 'Fúzy Múzy', 'Grey256', 'J.A.R.', 'Jakub Smolík',
  'Miky Mora', 'Nik Tendo', 'Pastor', 'Paulie Garand', 'Prago Union', 'Rest',
  'Roman Holy', 'STEIN27', 'SpecialBeatz', 'VR/NOBODY', 'Vasya Oblomov', 'Yzomandias'
]

async function run() {
  console.log('Loading songs.json…')
  const allSongs = JSON.parse(fs.readFileSync(songsPath, 'utf-8'))
  const enSongs = allSongs.filter(s => s.lang !== 'sk')
  let skSongs = allSongs.filter(s => s.lang === 'sk')

  console.log(`Starting with: ${enSongs.length} EN songs, ${skSongs.length} SK songs`)

  // 1. Remove junk non-Slovak songs
  skSongs = skSongs.filter(s => {
    const artist = (s.artist || '').toLowerCase()
    return !JUNK_ARTISTS.some(j => artist.includes(j.toLowerCase()))
  })
  console.log(`After removing non-Slovak songs: ${skSongs.length} SK songs`)

  // 2. Fetch new classic OG songs from iTunes
  const OG_SEARCHES = [
    { artistName: 'Tublatanka', query: 'Tublatanka' },
    { artistName: 'Peter Nagy', query: 'Peter Nagy' },
    { artistName: 'Iné Kafe', query: 'Ine Kafe' },
    { artistName: 'No Name', query: 'No Name' },
    { artistName: 'Team', query: 'Team' },
    { artistName: 'Polemic', query: 'Polemic' },
    { artistName: 'Vidiek', query: 'Vidiek' },
    { artistName: 'Modus', query: 'Modus' },
    { artistName: 'Marika Gombitová', query: 'Marika Gombitova' }
  ]

  const existingTitles = new Set(skSongs.map(s => `${(s.artist || '').toLowerCase()} - ${(s.title || '').toLowerCase()}`))

  console.log('\nFetching classic OG songs from iTunes…')
  for (const item of OG_SEARCHES) {
    const results = await searchItunes(item.query, 'SK', 12)
    let added = 0
    for (const r of results) {
      if (!r.trackName || !r.previewUrl) continue
      // Ensure the artist matches roughly
      if (!r.artistName.toLowerCase().includes(item.artistName.toLowerCase())) continue
      const key = `${r.artistName.toLowerCase()} - ${r.trackName.toLowerCase()}`
      if (existingTitles.has(key)) continue
      existingTitles.add(key)

      skSongs.push({
        id: makeId(r.artistName, r.trackName),
        title: r.trackName,
        artist: r.artistName,
        lang: 'sk',
        skType: 'og',
        audio: r.previewUrl,
        clipStart: 0
      })
      added++
    }
    console.log(`  + Added ${added} songs for ${item.artistName}`)
    await new Promise(r => setTimeout(r, 80))
  }

  // 3. Fetch folk songs (Kandráčovci, SĽUK) from iTunes
  console.log('\nFetching folk songs (Kandráčovci, SĽUK) from iTunes…')
  const FOLK_SEARCHES = [
    { artistName: 'Kandráčovci', query: 'Kandracovci', limit: 25 },
    { artistName: 'SĽUK', query: 'SLUK', limit: 15 }
  ]

  for (const item of FOLK_SEARCHES) {
    const results = await searchItunes(item.query, 'SK', item.limit)
    let added = 0
    for (const r of results) {
      if (!r.trackName || !r.previewUrl) continue
      const key = `${r.artistName.toLowerCase()} - ${r.trackName.toLowerCase()}`
      if (existingTitles.has(key)) continue
      existingTitles.add(key)

      skSongs.push({
        id: makeId(r.artistName, r.trackName),
        title: r.trackName,
        artist: r.artistName,
        lang: 'sk',
        skType: 'folk',
        audio: r.previewUrl,
        clipStart: 0
      })
      added++
    }
    console.log(`  + Added ${added} songs for ${item.artistName}`)
    await new Promise(r => setTimeout(r, 80))
  }

  // 4. Update the 5 traditional fallback folk songs with real iTunes previews
  console.log('\nUpdating traditional folk songs with valid audio previews…')
  const traditionalFolkFixes = [
    {
      titleMatch: 'Tancuj, tancuj, vykrúcaj',
      query: 'Tancuj, tancuj, vykrúcaj Bystrik',
      fallbackQuery: 'Tancuj, tancuj, vykrúcaj'
    },
    {
      titleMatch: 'Kopala studienku',
      query: 'Kopala studienku Diabolske husle',
      fallbackQuery: 'Kopala studienku'
    },
    {
      titleMatch: 'Hej, Slováci',
      query: 'Hej, Slovaci',
      fallbackQuery: 'Hej Slovaci'
    },
    {
      titleMatch: 'Aká si mi krásna',
      query: 'Aka si mi krasna Lucnica',
      fallbackQuery: 'Aka si mi krasna'
    },
    {
      titleMatch: 'Pod tým naším oknom',
      query: 'A ja taka dzivocka', // replace missing song with another iconic traditional folk song
      newTitle: 'A ja taká dzivočka',
      newArtist: 'ľudová pieseň'
    }
  ]

  for (const fix of traditionalFolkFixes) {
    const song = skSongs.find(s => (s.title || '').includes(fix.titleMatch))
    if (song) {
      const results = await searchItunes(fix.query, 'SK', 3)
      const hit = results.find(r => r.previewUrl) || (await searchItunes(fix.fallbackQuery || fix.query, 'SK', 5)).find(r => r.previewUrl)
      if (hit && hit.previewUrl) {
        song.audio = hit.previewUrl
        song.skType = 'folk'
        if (fix.newTitle) song.title = fix.newTitle
        if (fix.newArtist) song.artist = fix.newArtist
        delete song.comment
        console.log(`  ✓ Updated ${song.title} -> audio found (${hit.artistName} - ${hit.trackName})`)
      }
    }
  }

  // 5. Categorize each song into modern / og / folk
  function classifySkSong(song) {
    const a = (song.artist || '').toLowerCase()
    const t = (song.title || '').toLowerCase()

    // ── FOLK ──
    if (
      a.includes('kollár') ||
      a.includes('senzus') ||
      a.includes('kandráč') ||
      a.includes('štec') ||
      a.includes('lúcn') ||
      a.includes('lúčn') ||
      a.includes('sľuk') ||
      a.includes('sluk') ||
      a.includes('bystrina') ||
      a.includes('ľudov') ||
      a.includes('čardáš') ||
      a.includes('hreha') ||
      a.includes('koňare') ||
      song.skType === 'folk'
    ) {
      return 'folk'
    }

    // ── MODERN OVERRIDES (newer tracks or collabs by artists who also have older music) ──
    // Modern collabs / tracks:
    if (
      a.includes('majself') ||
      a.includes('sima') ||
      a.includes('separ') ||
      a.includes('gleb') ||
      a.includes('samey') ||
      a.includes('pil c') ||
      a.includes('kali') ||
      a.includes('saul') ||
      a.includes('wen') ||
      a.includes('porsche boy') ||
      a.includes('luca brassi') ||
      a.includes('flexking') ||
      a.includes('alan murin') ||
      a.includes('yael') ||
      a.includes('nerieš') ||
      a.includes('neries') ||
      a.includes('dalyb') ||
      a.includes('zayo') ||
      a.includes('dame') ||
      a.includes('smart') ||
      a.includes('celeste buckingham') ||
      a.includes('emma drobn') ||
      a.includes('ego') ||
      a.includes('majk spirit') ||
      a.includes('momo') ||
      a.includes('laris diam') ||
      a.includes('maria cirova') ||
      a.includes('mária čírová') ||
      a.includes('zuzana smatanova') ||
      a.includes('zuzana smatanová') ||
      a.includes('peter bic') ||
      a.includes('peter bič') ||
      a.includes('kristina') ||
      a.includes('kristína') ||
      a.includes('korben dallas') ||
      a.includes('billy barman') ||
      a.includes('fallgrapp') ||
      a.includes('sám sebou') ||
      a.includes('bystrik') ||
      a.includes('bystrík')
    ) {
      return 'modern'
    }

    // ── OG CLASSIC LEGENDS (pre-2010) ──
    if (
      a.includes('elán') ||
      a.includes('žbirka') ||
      a.includes('richard müller') ||
      a.includes('richard muller') ||
      a.includes('banket') ||
      a.includes('pavol habera') ||
      a.includes('team') ||
      a.includes('tublatanka') ||
      a.includes('peter nagy') ||
      a.includes('modus') ||
      a.includes('gombitov') ||
      a.includes('iné kafe') ||
      a.includes('ine kafe') ||
      a.includes('no name') ||
      a.includes('vidiek') ||
      a.includes('polemic') ||
      a.includes('lojzo') ||
      a.includes('grigorov')
    ) {
      return 'og'
    }

    // Desmod classic (without modern features)
    if (a === 'desmod') {
      return 'og'
    }

    // Horkýže Slíže classic
    if (a.includes('horkýže slíže') || a.includes('horkyze slize')) {
      return 'og'
    }

    // Hex classic (exclude modern single)
    if (a === 'hex' && !t.includes('kde je tu láska')) {
      return 'og'
    }

    // IMT Smile classic
    if (a === 'i.m.t. smile' || a === 'imt smile') {
      return 'og'
    }

    // Pre-2010 Kontrafakt classics ONLY:
    const ogKfTitles = [
      'dáva mi', 'dava mi', 'e.r.a.', 'moji ľudia', 'moji ludia',
      'bozk na rozlucku', 'bozk na rozlúčku', 'pravda bolí', 'život je boj',
      'nelutujem ani sekundu', 'poebsa', 'prvý koncert', 'prvy koncert',
      'odviati vetrom', 'čistá duša', 'cista dusa', 'o5 s5'
    ]
    if (a.includes('kontrafakt') && ogKfTitles.some(k => t.includes(k))) {
      return 'og'
    }

    // Pre-2010 Vec classics ONLY:
    if (a === 'vec' && (t.includes('dobre rano') || t.includes('dobré ráno') || t.includes('turista') || t.includes('calexity'))) {
      return 'og'
    }

    // Default to modern
    return 'modern'
  }

  // Apply classification
  let modernCount = 0, ogCount = 0, folkCount = 0
  skSongs.forEach(song => {
    song.skType = classifySkSong(song)
    if (song.skType === 'folk') folkCount++
    else if (song.skType === 'og') ogCount++
    else modernCount++
  })

  console.log(`\nFinal SK Counts:`)
  console.log(`  Modern: ${modernCount}`)
  console.log(`  OG:     ${ogCount}`)
  console.log(`  Folk:   ${folkCount}`)
  console.log(`  Total SK: ${skSongs.length}`)

  // Write merged output
  const finalSongs = [...enSongs, ...skSongs]
  fs.writeFileSync(songsPath, JSON.stringify(finalSongs, null, 2), 'utf-8')
  console.log(`\n✓ Written to ${songsPath} (Total songs: ${finalSongs.length})`)
}

run().catch(console.error)
