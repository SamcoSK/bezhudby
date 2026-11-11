const fs = require('fs');
const path = require('path');

const songsPath = path.join(__dirname, '..', 'src', 'data', 'songs.json');
const songs = JSON.parse(fs.readFileSync(songsPath, 'utf8'));

async function searchPreview(artist, title) {
  const cleanArtist = artist.split(/ feat\.| & |, /i)[0].trim();
  const cleanTitle = title.replace(/\s*\(.*?\)\s*/g, '').trim();

  const queries = [
    `${artist} ${title}`,
    `${cleanArtist} ${cleanTitle}`,
    `${cleanTitle} ${cleanArtist}`,
    `${cleanArtist} ${title}`,
  ];

  for (const q of queries) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=5`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const found = data.results.find((r) => r.previewUrl);
        if (found && found.previewUrl) return found.previewUrl;
      }
    } catch (e) {
      // ignore & try next
    }
  }
  return null;
}

async function main() {
  const targetSongs = songs.filter((s) => s.audio && s.audio.startsWith('/audio/'));
  console.log(`Found ${targetSongs.length} songs with /audio/ paths to update with iTunes previews...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetSongs.length; i++) {
    const s = targetSongs[i];
    process.stdout.write(`[${i + 1}/${targetSongs.length}] ${s.artist} - ${s.title}... `);
    const previewUrl = await searchPreview(s.artist, s.title);
    if (previewUrl) {
      s.audio = previewUrl;
      successCount++;
      console.log('✅ OK');
    } else {
      failCount++;
      console.log('❌ Failed to find on iTunes');
    }
    // Rate limit delay (150ms)
    await new Promise((r) => setTimeout(r, 150));
  }

  fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2), 'utf8');
  console.log(`\nFinished! Successfully updated: ${successCount}/${targetSongs.length}`);
  if (failCount > 0) {
    console.log(`Failed: ${failCount}`);
  }
}

main().catch(console.error);
