#!/usr/bin/env tsx
/**
 * validate-songs.ts
 * -----------------
 * Validates src/data/songs.json:
 *   1. Checks all required fields are present
 *   2. Checks for duplicate IDs
 *   3. Checks existence of audio files in public/audio/
 *   4. Prints summary counts per lang/genre/difficulty combination
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

const REQUIRED_FIELDS = ['id', 'title', 'artist', 'lang', 'genre', 'difficulty', 'audio'] as const
const VALID_LANGS = ['sk', 'en']
const VALID_GENRES = ['pop', 'rock', 'hiphop', 'rnb', 'electronic', 'metal', 'country', 'indie']
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']

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

  // Required fields
  for (const field of REQUIRED_FIELDS) {
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

  // Valid enum values
  if (s.lang && !VALID_LANGS.includes(String(s.lang))) {
    error(`${prefix}: neplatný lang "${s.lang}" (povolené: ${VALID_LANGS.join(', ')})`)
  }
  if (s.genre && !VALID_GENRES.includes(String(s.genre))) {
    error(`${prefix}: neplatný genre "${s.genre}" (povolené: ${VALID_GENRES.join(', ')})`)
  }
  if (s.difficulty && !VALID_DIFFICULTIES.includes(String(s.difficulty))) {
    error(`${prefix}: neplatná difficulty "${s.difficulty}" (povolené: ${VALID_DIFFICULTIES.join(', ')})`)
  }

  // Audio existence (either online URL or local file)
  if (s.audio) {
    const audioStr = String(s.audio)
    if (audioStr.startsWith('http://') || audioStr.startsWith('https://')) {
      // Online audio URL - valid
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
  console.log(`   ℹ️  Upozornenia o chýbajúcich audio súboroch sú normálne`)
  console.log(`      v prostredí bez nahrávok. Pridaj MP3 súbory do public/audio/`)
  console.log()
}

// ── Summary by lang / genre / difficulty ─────────────────────────────────────

type SummaryKey = string
const summary = new Map<SummaryKey, number>()

for (const s of songs) {
  if (!s.lang || !s.genre || !s.difficulty) continue
  const key = `${s.lang}/${s.genre}/${s.difficulty}`
  summary.set(key, (summary.get(key) ?? 0) + 1)
}

console.log('📊 Počty skladieb (jazyk / žáner / obtiažnosť):')
console.log()

for (const lang of VALID_LANGS) {
  console.log(`  ${lang.toUpperCase()}`)
  for (const diff of VALID_DIFFICULTIES) {
    const row: string[] = []
    for (const genre of VALID_GENRES) {
      const count = summary.get(`${lang}/${genre}/${diff}`) ?? 0
      row.push(`${genre}:${count}`)
    }
    const total = VALID_GENRES.reduce((acc, g) => acc + (summary.get(`${lang}/${g}/${diff}`) ?? 0), 0)
    console.log(`    ${diff.padEnd(8)} │ ${row.join('  ')}  │ celkom: ${total}`)
  }
  console.log()
}

// ── Final result ─────────────────────────────────────────────────────────────

if (errors.length === 0) {
  console.log(`✅ Validácia úspešná! ${songs.length} skladieb, ${warnings.length} upozornení.\n`)
  process.exit(0)
} else {
  console.log(`❌ Validácia zlyhala! ${errors.length} chýb.\n`)
  process.exit(1)
}
