const fs = require('fs');
const path = require('path');

const songsPath = path.join(__dirname, '..', 'src', 'data', 'songs.json');
let songs = JSON.parse(fs.readFileSync(songsPath, 'utf8'));

// 1. Rename all indie→rap
let indieCount = 0;
songs = songs.map(s => {
  if (s.genre === 'indie') { indieCount++; return { ...s, genre: 'rap' }; }
  return s;
});
console.log(`Renamed ${indieCount} indie→rap`);

// 2. Pumped Up Kicks – Foster the People: hiphop→pop
songs = songs.map(s => {
  if (s.id === '06ee8e23') { console.log('Fixed Pumped Up Kicks genre'); return { ...s, genre: 'pop' }; }
  return s;
});

// 3. Remove Beach House by Carly Rae Jepsen (id: 67fba070)
const beforeLen = songs.length;
songs = songs.filter(s => s.id !== '67fba070');
if (songs.length < beforeLen) console.log('Removed Beach House (Carly Rae Jepsen)');

// 4. Add Call Me Maybe – Carly Rae Jepsen
if (!songs.find(s => s.id === 'call-me-maybe-cjepsen')) {
  songs.push({ id: 'call-me-maybe-cjepsen', title: 'Call Me Maybe', artist: 'Carly Rae Jepsen', lang: 'en', genre: 'pop', difficulty: 'easy', audio: '/audio/call-me-maybe-cjepsen.mp3', clipStart: 0 });
  console.log('Added Call Me Maybe');
}

// 5. Add Marshmello songs (need total 12+, currently 11)
const marshmelloNew = [
  { id: 'marshmello-keep-it-mello', title: 'Keep It Mello', artist: 'Marshmello feat. Omar LinX', lang: 'en', genre: 'electronic', difficulty: 'hard', audio: '/audio/marshmello-keep-it-mello.mp3', clipStart: 0 },
  { id: 'marshmello-blocks', title: 'Blocks', artist: 'Marshmello', lang: 'en', genre: 'electronic', difficulty: 'hard', audio: '/audio/marshmello-blocks.mp3', clipStart: 0 },
  { id: 'marshmello-flashback', title: 'Flashback', artist: 'Marshmello', lang: 'en', genre: 'electronic', difficulty: 'hard', audio: '/audio/marshmello-flashback.mp3', clipStart: 0 },
  { id: 'marshmello-ritual', title: 'Ritual', artist: 'Marshmello feat. Wrabel', lang: 'en', genre: 'electronic', difficulty: 'medium', audio: '/audio/marshmello-ritual.mp3', clipStart: 0 },
  { id: 'marshmello-here-with-me', title: 'Here With Me', artist: 'Marshmello & CHVRCHES', lang: 'en', genre: 'electronic', difficulty: 'medium', audio: '/audio/marshmello-here-with-me.mp3', clipStart: 0 },
];
let marshmelloAdded = 0;
for (const s of marshmelloNew) {
  if (!songs.find(x => x.id === s.id)) { songs.push(s); marshmelloAdded++; }
}
console.log(`Added ${marshmelloAdded} Marshmello songs`);

// 6. Add Don Toliver songs (12+ needed)
const donToliverNew = [
  { id: 'don-toliver-no-idea', title: 'No Idea', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/don-toliver-no-idea.mp3', clipStart: 0 },
  { id: 'don-toliver-way-big', title: 'Way Big', artist: 'Don Toliver feat. Travis Scott', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/don-toliver-way-big.mp3', clipStart: 0 },
  { id: 'don-toliver-cant-feel-legs', title: "Can't Feel My Legs", artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/don-toliver-cant-feel-legs.mp3', clipStart: 0 },
  { id: 'don-toliver-company', title: 'Company', artist: 'Don Toliver feat. Drake & Lil Durk', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/don-toliver-company.mp3', clipStart: 0 },
  { id: 'don-toliver-drugs-melodies', title: 'Drugs N Hella Melodies', artist: 'Don Toliver feat. SoFaygo', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/don-toliver-drugs-melodies.mp3', clipStart: 0 },
  { id: 'don-toliver-what-you-need', title: 'What You Need', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/don-toliver-what-you-need.mp3', clipStart: 0 },
  { id: 'don-toliver-after-party', title: 'After Party', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/don-toliver-after-party.mp3', clipStart: 0 },
  { id: 'don-toliver-do-it-right', title: 'Do It Right', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/don-toliver-do-it-right.mp3', clipStart: 0 },
  { id: 'don-toliver-aeternidad', title: 'AETERNIDAD', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/don-toliver-aeternidad.mp3', clipStart: 0 },
  { id: 'don-toliver-roger-that', title: 'Roger That', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/don-toliver-roger-that.mp3', clipStart: 0 },
  { id: 'don-toliver-swear', title: 'Swear', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/don-toliver-swear.mp3', clipStart: 0 },
  { id: 'don-toliver-coming-2-america', title: 'Coming 2 America', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'hard', audio: '/audio/don-toliver-coming-2-america.mp3', clipStart: 0 },
  { id: 'don-toliver-big-conspiracy', title: 'BIG Conspiracy', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'hard', audio: '/audio/don-toliver-big-conspiracy.mp3', clipStart: 0 },
  { id: 'don-toliver-alone', title: 'Alone', artist: 'Don Toliver', lang: 'en', genre: 'rap', difficulty: 'hard', audio: '/audio/don-toliver-alone.mp3', clipStart: 0 },
];
let donToliverAdded = 0;
for (const s of donToliverNew) {
  if (!songs.find(x => x.id === s.id)) { songs.push(s); donToliverAdded++; }
}
console.log(`Added ${donToliverAdded} Don Toliver songs`);

// 7. Add Juice WRLD songs (12+ needed)
const juiceWrldNew = [
  { id: 'juice-wrld-lucid-dreams', title: 'Lucid Dreams', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/juice-wrld-lucid-dreams.mp3', clipStart: 0 },
  { id: 'juice-wrld-all-girls-same', title: 'All Girls Are the Same', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/juice-wrld-all-girls-same.mp3', clipStart: 0 },
  { id: 'juice-wrld-robbery', title: 'Robbery', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/juice-wrld-robbery.mp3', clipStart: 0 },
  { id: 'juice-wrld-black-white', title: 'Black & White', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/juice-wrld-black-white.mp3', clipStart: 0 },
  { id: 'juice-wrld-righteous', title: 'Righteous', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/juice-wrld-righteous.mp3', clipStart: 0 },
  { id: 'juice-wrld-come-and-go', title: 'Come & Go', artist: 'Juice WRLD & Marshmello', lang: 'en', genre: 'rap', difficulty: 'easy', audio: '/audio/juice-wrld-come-and-go.mp3', clipStart: 0 },
  { id: 'juice-wrld-wishing-well', title: 'Wishing Well', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/juice-wrld-wishing-well.mp3', clipStart: 0 },
  { id: 'juice-wrld-smile', title: 'Smile', artist: 'Juice WRLD feat. The Weeknd', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/juice-wrld-smile.mp3', clipStart: 0 },
  { id: 'juice-wrld-conversations', title: 'Conversations', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/juice-wrld-conversations.mp3', clipStart: 0 },
  { id: 'juice-wrld-already-dead', title: 'Already Dead', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/juice-wrld-already-dead.mp3', clipStart: 0 },
  { id: 'juice-wrld-lean-wit-me', title: 'Lean Wit Me', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/juice-wrld-lean-wit-me.mp3', clipStart: 0 },
  { id: 'juice-wrld-fast', title: 'Fast', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'medium', audio: '/audio/juice-wrld-fast.mp3', clipStart: 0 },
  { id: 'juice-wrld-armed-dangerous', title: 'Armed & Dangerous', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'hard', audio: '/audio/juice-wrld-armed-dangerous.mp3', clipStart: 0 },
  { id: 'juice-wrld-no-good', title: 'No Good', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'hard', audio: '/audio/juice-wrld-no-good.mp3', clipStart: 0 },
  { id: 'juice-wrld-maze', title: 'Maze', artist: 'Juice WRLD', lang: 'en', genre: 'rap', difficulty: 'hard', audio: '/audio/juice-wrld-maze.mp3', clipStart: 0 },
];
let juiceAdded = 0;
for (const s of juiceWrldNew) {
  if (!songs.find(x => x.id === s.id)) { songs.push(s); juiceAdded++; }
}
console.log(`Added ${juiceAdded} Juice WRLD songs`);

// 8. Add Verkkars TODO
if (!songs.find(s => s.id === 'todo-verkkars')) {
  songs.push({ id: 'todo-verkkars', title: 'TODO', artist: 'The Verkkars', lang: 'en', genre: 'pop', difficulty: 'easy', audio: 'fallback', todo: true, comment: 'overiť názov interpreta', clipStart: 0 });
  console.log('Added Verkkars TODO');
}

// 9. Add Y Que Fue TODO
if (!songs.find(s => s.id === 'todo-y-que-fue')) {
  songs.push({ id: 'todo-y-que-fue', title: 'Y Que Fue', artist: '', lang: 'en', genre: 'pop', difficulty: 'easy', audio: 'fallback', todo: true, comment: 'overiť interpreta', clipStart: 0 });
  console.log('Added Y Que Fue TODO');
}

fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2), 'utf8');
console.log('Done! Total songs:', songs.length);

// Print final counts
const final = JSON.parse(fs.readFileSync(songsPath, 'utf8'));
console.log('--- Final counts ---');
console.log('indie songs remaining:', final.filter(x=>x.genre==='indie').length);
console.log('rap songs:', final.filter(x=>x.genre==='rap').length);
console.log('Marshmello:', final.filter(x=>x.artist&&x.artist.toLowerCase().includes('marshmello')).length);
console.log('Don Toliver:', final.filter(x=>x.artist&&x.artist.toLowerCase().includes('don toliver')).length);
console.log('Juice WRLD:', final.filter(x=>x.artist&&x.artist.toLowerCase().includes('juice wrld')).length);
console.log('Carly Rae Jepsen:', final.filter(x=>x.artist&&x.artist.toLowerCase().includes('carly rae jepsen')).length);
