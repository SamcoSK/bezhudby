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

### 1. Pridaj záznam do `src/data/songs.json`

Stačí zadať názov a interpreta:

```jsonc
{
  "id": "moja-nova-pisen",
  "title": "Názov Piesne",
  "artist": "Interpret",
  "lang": "sk",                     // "sk" alebo "en"
  "genre": "pop",                   // pop | rock | hiphop | rnb | electronic | metal | country | indie
  "difficulty": "easy",             // easy | medium | hard
  "audio": "",                      // môžeš nechať prázdne alebo uviesť odkaz
  "clipStart": 0                    // od ktorej sekundy 30s ukážky začať
}
```

### 2. Spusti automatické načítanie online odkazov

```bash
npm run fetch-previews
```

Skript automaticky nájde a doplní priamu URL adresu 30s ukážky pre každú skladbu.

### 3. Skontroluj integritu

```bash
npm run validate
```

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
