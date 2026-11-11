#!/usr/bin/env tsx
/**
 * validate-songs.ts
 * -----------------
 * Validates src/data/songs.json:
 *   1. For SK songs: requires skType ("modern"|"og"|"folk"), warns if difficulty present
 *   2. For EN songs: requires difficulty and genre
 *   3. Checks all required base fields (id, title, artist, lang, audio)
 *   4. Checks for duplicate IDs
 *   5. Warns about missing audio files (local paths)
 *   6. Prints summary counts per lang/skType and per genre/difficulty
 *   7. Warns about empty combinations
 *
 * Usage:
 *   npx tsx scripts/validate-songs.ts
 *   npm run validate
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Load songs ───────────────────────────────────────────────────────────────

const songsPath = resolve(ROOT, 'src/data/songs.json')
const songs: Record<string, unknown>[] = JSON.parse(readFileSync(songsPath, 'utf8'))

// ── Constants ────────────────────────────────────────────────────────────────

const BASE_REQUIRED = ['id', 'title', 'artist', 'lang', 'audio'] as const
const VALID_LANGS = ['sk', 'en']
const VALID_GENRES = ['pop', 'rock', 'hiphop', 'rnb', 'electronic', 'metal', 'country', 'indie']
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']
const VALID_SK_TYPES = ['modern', 'og', 'folk']

// ── Helpers ──────────────────────────────────────────────────────────────────

const errors: string[] = []
const warnings: string[] = []

function error(msg: string) { errors.push(`  ❌ ${msg}`) }
function warn(msg: string)  { warnings.push(`  ⚠️  ${msg}`) }

// ── Validation ───────────────────────────────────────────────────────────────

console.log(`\n🎵 Bezhudby – Validácia songs.json`)
console.log(`   Súbor: ${songsPath}`)
console.log(`   Počet záznamov: ${songs.length}\n`)

const seenIds = new Set<string>()

for (let i = 0; i < songs.length; i++) {
  const s = songs[i]
  const prefix = `[${i}] ${String(s.id ?? '(bez id)')}`

  const isPlaceholder = Boolean(s.todo || (typeof s.comment === 'string' && s.comment.includes('overiť názov a interpreta') && (!s.title || !s.artist)))

  // Base required fields
  for (const field of BASE_REQUIRED) {
    if (isPlaceholder && (field === 'title' || field === 'artist')) continue
    if (s[field] === undefined || s[field] === null || s[field] === '') {
      error(`${prefix}: chýba povinné pole "${field}"`)
    }
  }

  // Duplicate IDs
  const id = String(s.id ?? '')
  if (id && seenIds.has(id)) {
    error(`${prefix}: duplicitné id "${id}"`)
  }
  if (id) seenIds.add(id)

  // Valid lang
  if (s.lang && !VALID_LANGS.includes(String(s.lang))) {
    error(`${prefix}: neplatný lang "${s.lang}" (povolené: ${VALID_LANGS.join(', ')})`)
  }

  // ── SK-specific validation ──────────────────────────────────────────────
  if (s.lang === 'sk') {
    // Must have skType
    if (!s.skType || !VALID_SK_TYPES.includes(String(s.skType))) {
      error(`${prefix}: SK pieseň musí mať pole skType (${VALID_SK_TYPES.join('|')})`)
    }
    // Should NOT have difficulty
    if (s.difficulty !== undefined) {
      warn(`${prefix}: SK pieseň má pole difficulty – malo by byť odstránené`)
    }
    // folk songs should have artist = "ľudová pieseň"
    if (s.skType === 'folk' && String(s.artist).toLowerCase() !== 'ľudová pieseň') {
      warn(`${prefix}: ľudovka má iného autora ako "ľudová pieseň" (je: ${s.artist})`)
    }
  }

  // ── EN-specific validation ──────────────────────────────────────────────
  if (s.lang === 'en') {
    // Must have genre
    if (!s.genre || !VALID_GENRES.includes(String(s.genre))) {
      error(`${prefix}: EN pieseň musí mať platný genre (${VALID_GENRES.join('|')})`)
    }
    // Must have difficulty
    if (!s.difficulty || !VALID_DIFFICULTIES.includes(String(s.difficulty))) {
      error(`${prefix}: EN pieseň musí mať platnú difficulty (${VALID_DIFFICULTIES.join('|')})`)
    }
    // Should NOT have skType
    if (s.skType !== undefined) {
      warn(`${prefix}: EN pieseň má pole skType – je zbytočné`)
    }
  }

  // Audio existence (either online URL or local file)
  if (s.audio) {
    const audioStr = String(s.audio)
    if (audioStr === 'fallback') {
      // Known placeholder – used for folk songs without real audio
      // No warning needed; filterSongs already excludes these
    } else if (audioStr.startsWith('http://') || audioStr.startsWith('https://')) {
      // Online audio URL – valid, cannot check existence here
    } else {
      const audioPath = resolve(ROOT, 'public', audioStr.replace(/^\//, ''))
      if (!existsSync(audioPath)) {
        warn(`${prefix}: lokálny audio súbor neexistuje: ${audioPath}`)
      }
    }
  }

  // clipStart sanity
  if (s.clipStart !== undefined && (typeof s.clipStart !== 'number' || s.clipStart < 0)) {
    error(`${prefix}: clipStart musí byť nezáporné číslo`)
  }
}

// ── Print errors & warnings ───────────────────────────────────────────────────

if (errors.length > 0) {
  console.log(`🔴 Chyby (${errors.length}):`)
  errors.forEach((e) => console.log(e))
  console.log()
}

if (warnings.length > 0) {
  console.log(`🟡 Upozornenia (${warnings.length}):`)
  warnings.forEach((w) => console.log(w))
  console.log()
}

// ── Summary: SK by skType ─────────────────────────────────────────────────────

const skSongs = songs.filter((s) => s.lang === 'sk')
const skByType: Record<string, number> = {}
for (const s of skSongs) {
  const t = String(s.skType ?? '(žiadny)')
  skByType[t] = (skByType[t] ?? 0) + 1
}

console.log('📊 Slovenské skladby (podľa skType):')
for (const [t, count] of Object.entries(skByType)) {
  const mark = count > 0 ? '✓' : '✗'
  console.log(`  ${mark} ${t.padEnd(10)} : ${count}`)
}
console.log()

// ── Summary: EN by genre / difficulty ────────────────────────────────────────

const enSongs = songs.filter((s) => s.lang === 'en')
const summary = new Map<string, number>()
for (const s of enSongs) {
  if (!s.genre || !s.difficulty) continue
  const key = `${s.genre}/${s.difficulty}`
  summary.set(key, (summary.get(key) ?? 0) + 1)
}

console.log('📊 Anglické skladby (žáner / obtiažnosť):')
console.log()

const emptyWarnings: string[] = []
for (const diff of VALID_DIFFICULTIES) {
  const row: string[] = []
  for (const genre of VALID_GENRES) {
    const count = summary.get(`${genre}/${diff}`) ?? 0
    row.push(`${genre.substring(0, 4)}:${count}`)
    if (count === 0) emptyWarnings.push(`  ⚠️  Prázdna kombinácia: EN/${genre}/${diff}`)
  }
  const total = VALID_GENRES.reduce((acc, g) => acc + (summary.get(`${g}/${diff}`) ?? 0), 0)
  console.log(`  ${diff.padEnd(8)} │ ${row.join('  ')}  │ celkom: ${total}`)
}

if (emptyWarnings.length > 0) {
  console.log()
  console.log(`🟡 Prázdne kombinácie:`)
  emptyWarnings.forEach((w) => console.log(w))
}

console.log()

// ── Final result ─────────────────────────────────────────────────────────────

if (errors.length === 0) {
  console.log(`✅ Validácia úspešná! ${songs.length} skladieb (SK: ${skSongs.length}, EN: ${enSongs.length}), ${warnings.length} upozornení.\n`)
  process.exit(0)
} else {
  console.log(`❌ Validácia zlyhala! ${errors.length} chýb.\n`)
  process.exit(1)
}
