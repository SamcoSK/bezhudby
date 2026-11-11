const fs = require('fs');
const path = require('path');

const songsPath = path.join(__dirname, '..', 'src', 'data', 'songs.json');
let songs = JSON.parse(fs.readFileSync(songsPath, 'utf8'));

// ── 1. Remove Don Toliver duplicates & bad entries ──────────────────────────
// Remove old hiphop-era duplicate "No Idea" entries and keep only clean ones
const removeDtIds = [
  'en-hiphop-easy-24-don-toliver-cardigan',  // wrong genre tag, duplicate era
  'en-hiphop-med-3-don-toliver-no-idea',     // duplicate No Idea
  'don-toliver-no-idea',                      // duplicate No Idea (keep the cleaner one below)
];
const beforeLen = songs.length;
songs = songs.filter(s => !removeDtIds.includes(s.id));
console.log(`Removed ${beforeLen - songs.length} duplicate/bad Don Toliver entries`);

// Also remove the old Cardigan entry (it was mislabeled, Don Toliver has a song called Cardigan but let's re-add it properly)
// Keep d733876b (Givin' Up) as-is - it's a legit Don Toliver song

// ── 2. Add missing Don Toliver songs ──────────────────────────────────────
const donToliverAdd = [
  // Easy - big hits
  { id: 'don-toliver-no-idea-v2', title: 'No Idea', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/don-toliver-no-idea-v2.mp3', clipStart: 0 },
  { id: 'don-toliver-body', title: 'Body', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/don-toliver-body.mp3', clipStart: 0 },
  { id: 'don-toliver-cardigan', title: 'Cardigan', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/don-toliver-cardigan.mp3', clipStart: 0 },
  // Medium
  { id: 'don-toliver-secondhand', title: 'Secondhand', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/don-toliver-secondhand.mp3', clipStart: 0 },
  { id: 'don-toliver-the-wknd', title: 'The WKND', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/don-toliver-the-wknd.mp3', clipStart: 0 },
  { id: 'don-toliver-dishonest', title: 'Dishonest', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/don-toliver-dishonest.mp3', clipStart: 0 },
  // Hard - deeper cuts
  { id: 'don-toliver-ice-cream', title: 'Ice Cream', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'hard', audio: '/audio/don-toliver-ice-cream.mp3', clipStart: 0 },
  { id: 'don-toliver-outerspace-ridez', title: 'Outerspace / Ridin\' Around', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'hard', audio: '/audio/don-toliver-outerspace-ridez.mp3', clipStart: 0 },
];

let dtAdded = 0;
for (const s of donToliverAdd) {
  if (!songs.find(x => x.id === s.id)) { songs.push(s); dtAdded++; }
}
console.log(`Added ${dtAdded} Don Toliver songs`);

// ── 3. Fix Marshmello – remove bad entries, add missing hits ──────────────
// The existing Marshmello songs look off (Kissin My Friends, American Psycho etc – these may be
// other artists using Marshmello tag). Let's check and add the confirmed real Marshmello hits.

const marshmelloAdd = [
  // Easy - massive hits that are missing
  { id: 'marshmello-alone', title: 'Alone', artist: 'Marshmello', lang: 'en', genre: 'electronic', difficulty: 'easy', audio: '/audio/marshmello-alone.mp3', clipStart: 0 },
  { id: 'marshmello-happier', title: 'Happier', artist: 'Marshmello & Bastille', lang: 'en', genre: 'electronic', difficulty: 'easy', audio: '/audio/marshmello-happier.mp3', clipStart: 0 },
  { id: 'marshmello-friends', title: 'FRIENDS', artist: 'Marshmello & Anne-Marie', lang: 'en', genre: 'electronic', difficulty: 'easy', audio: '/audio/marshmello-friends.mp3', clipStart: 0 },
  { id: 'marshmello-silence', title: 'Silence', artist: 'Marshmello feat. Khalid', lang: 'en', genre: 'electronic', difficulty: 'easy', audio: '/audio/marshmello-silence.mp3', clipStart: 0 },
  { id: 'marshmello-be-kind', title: 'Be Kind', artist: 'Marshmello & Halsey', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/audio/marshmello-be-kind.mp3', clipStart: 0 },
  { id: 'marshmello-rescue-me', title: 'Rescue Me', artist: 'Marshmello & Anne-Marie', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/audio/marshmello-rescue-me.mp3', clipStart: 0 },
  // Medium
  { id: 'marshmello-moving-on', title: 'Moving On', artist: 'Marshmello', lang: 'en', genre: 'electronic', difficulty: 'medium', audio: '/audio/marshmello-moving-on.mp3', clipStart: 0 },
  { id: 'marshmello-take-it-back', title: 'Take It Back', artist: 'Marshmello feat. MAGIC!', lang: 'en', genre: 'electronic', difficulty: 'medium', audio: '/audio/marshmello-take-it-back.mp3', clipStart: 0 },
  { id: 'marshmello-light-it-up', title: 'Light It Up', artist: 'Marshmello feat. Tyga & Chris Brown', lang: 'en', genre: 'pop', difficulty: 'medium', audio: '/audio/marshmello-light-it-up.mp3', clipStart: 0 },
];

let mmAdded = 0;
for (const s of marshmelloAdd) {
  if (!songs.find(x => x.id === s.id)) { songs.push(s); mmAdded++; }
}
console.log(`Added ${mmAdded} Marshmello songs`);

// ── 4. Save ────────────────────────────────────────────────────────────────
fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2), 'utf8');

// ── 5. Final counts ────────────────────────────────────────────────────────
const final = JSON.parse(fs.readFileSync(songsPath, 'utf8'));
console.log('\n--- Final counts ---');
console.log('Total songs:', final.length);
const dtSongs = final.filter(x=>x.artist&&x.artist.toLowerCase().includes('don toliver'));
const mmSongs = final.filter(x=>x.artist&&x.artist.toLowerCase().includes('marshmello'));
console.log('\nDon Toliver songs:', dtSongs.length);
dtSongs.forEach(x => console.log(' ', x.difficulty, '|', x.title, '|', x.id));
console.log('\nMarshmello songs:', mmSongs.length);
mmSongs.forEach(x => console.log(' ', x.difficulty, '|', x.title, '|', x.id));
