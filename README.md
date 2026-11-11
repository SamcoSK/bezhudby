# Bezhudby 🎵

Webová hra na hádanie slovenských a anglických piesní z krátkych úryvkov.

Každý pokus odomkne dlhší úryvok (1 → 2 → 3 → 5 → 7 → 10 sekúnd). Máš 6 pokusov.

> **Online ukážky**: Aplikácia prehráva oficiálne 30-sekundové audio ukážky priamo z verejného Apple iTunes API / CDN. Nie je potrebné sťahovať žiadne skladby do počítača.

---

## Technológie

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** (svetlý/tmavý režim)
- **Web Audio API** (presné orezanie úryvkov, fade-out, dekódovanie online streamu)
- **Vitest** (testy)
- Bez backendu – 100% statická aplikácia (GitHub Pages / Netlify / Vercel)

---

## Lokálne spustenie

```bash
# 1. Nainštaluj závislosti
npm install

# 2. Spusti vývojový server
npm run dev
# → http://localhost:5173

# 3. Spusti testy
npm test

# 4. Validuj songs.json
npm run validate

# 5. Aktualizuj online audio ukážky pre všetky skladby v songs.json
npm run fetch-previews

# 6. Zostav produkčný build
npm run build
```

---

## Ako pridať novú skladbu (bez sťahovania audia)

### 1. Slovenská skladba (do `src/data/songs.json`)

Slovenské skladby **nemajú** pole `difficulty` (majú jednu spoločnú obtiažnosť) a žáner sa nevyžaduje. Povinné je pole `skType`:

```jsonc
// Moderná slovenská skladba (od cca 2010):
{
  "id": "sk-modern-priklad",
  "title": "Názov Piesne",
  "artist": "Interpret",
  "lang": "sk",
  "skType": "modern",               // "modern" | "og" | "folk"
  "audio": "",                      // doplní sa cez npm run fetch-previews
  "clipStart": 0
}

// OG slovenská klasika (cca 1970 – 2009):
{
  "id": "sk-og-priklad",
  "title": "Voda čo ma drží nad vodou",
  "artist": "Elán",
  "lang": "sk",
  "skType": "og",
  "audio": "",
  "clipStart": 0
}

// Ľudová pieseň:
{
  "id": "sk-folk-priklad",
  "title": "Tancuj, tancuj, vykrúcaj",
  "artist": "ľudová pieseň",        // pri ľudovkách vždy "ľudová pieseň"
  "performer": "Lúčnica",           // voliteľné: názov zboru / súboru (zobrazí sa v zátvorke)
  "lang": "sk",
  "skType": "folk",
  "audio": "fallback",              // odporúčame vlastnú nahrávku v public/audio/
  "clipStart": 0
}
```

### 2. Anglická skladba (do `src/data/songs.json`)

Pre anglické skladby sú povinné polia `genre` a `difficulty`:

```jsonc
{
  "id": "en-priklad",
  "title": "Shape of You",
  "artist": "Ed Sheeran",
  "lang": "en",
  "genre": "pop",                   // pop | rock | hiphop | rnb | electronic | metal | country | rap
  "difficulty": "easy",             // easy | medium | hard
  "audio": "",                      // doplní sa cez npm run fetch-previews
  "clipStart": 0
}
```

### 3. Spusti automatické načítanie online odkazov

```bash
npm run fetch-previews
```

Skript automaticky nájde a doplní priamu URL adresu 30s ukážky pre každú skladbu.

### 4. Skontroluj integritu

```bash
npm run validate
```

---

## Audio a autorské práva

- **Web Audio API**: Presné prehrávanie úsekov úryvkov (1, 2, 3, 5, 7, 10 sekúnd) pomocou `AudioBufferSourceNode.start(offset, duration)` s jemným lineárnym fade-outom na konci. Prehrávanie sa spúšťa výlučne na základe akcie používateľa.
- **Vývojový záložný režim (Fallback)**: Ak audio súbor nie je dostupný alebo offline, prehráva sa krátky syntetizovaný tón generovaný pomocou Web Audio `OscillatorNode`, aby bola aplikácia plne testovateľná aj bez stiahnutých médií.
- **Ľudové piesne a práva**: Samotné melódie a texty tradičných slovenských ľudoviek sú voľné diela (public domain), no **konkrétne zvukové nahrávky majú vlastné autorské a susediace práva**. V produkčnom nasadení odporúčame použiť výhradne vlastné nahrávky, licencované nahrávky alebo nahrávky s výslovným povolením interpretov/vydavateľov.
- **Bez neoprávneného obsahu**: V repozitári sa nenachádzajú žiadne chránené MP3 súbory, celé texty piesní ani grafické obaly albumov.

---

## Štruktúra projektu

```
bezhudby/
├── src/
│   ├── data/songs.json     # databáza skladieb s online audio URL
│   ├── components/         # React komponenty (App, GameScreen, AudioPlayer...)
│   ├── hooks/              # useGame, useAudio, useStats
│   ├── utils/              # normalize, songPicker, storage
│   └── types/index.ts      # TypeScript typy
├── scripts/
│   ├── fetch-online-previews.ts # automatický vyhľadávač iTunes ukážok
│   └── validate-songs.ts        # CLI validátor
└── tests/                  # Vitest unit testy
```

---

## Licencia

MIT
