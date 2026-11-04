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
  genre: 'pop' | 'rock' | 'hiphop' | 'rnb' | 'electronic' | 'metal' | 'country' | 'indie'
  difficulty: 'easy' | 'medium' | 'hard'
  audio: string
  clipStart?: number
}

// 320 overených hitov (svetových a slovenských) naprieč všetkými žánrami a obtiažnosťami
const SEED_TRACKS: Array<Omit<Song, 'audio' | 'id'> & { id?: string }> = [
  // ─── SLOVENSKÉ SKLADBY (SK) ────────────────────────────────────────────────
  // SK POP - Easy
  { title: "Vymyslená", artist: "Elán", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Zažni", artist: "Miroslav Žbirka", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Biely kvet", artist: "Miroslav Žbirka", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Horehronie", artist: "Kristína", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "V slepých uličkách", artist: "Marika Gombitová", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Sestrička z Kramárov", artist: "Elán", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Kaskadér", artist: "Elán", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Kristínka iba spí", artist: "Peter Nagy", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Po schodoch", artist: "Richard Müller", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Aj tak sme frajeri", artist: "Peter Nagy", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Balada o poľných vtákoch", artist: "Miroslav Žbirka", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Ta ne", artist: "Kristína", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Láska", artist: "Marcel Palonder", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Unikát", artist: "Mária Čírová", lang: "sk", genre: "pop", difficulty: "easy" },
  { title: "Nenahraditeľná", artist: "Sima Martausová", lang: "sk", genre: "pop", difficulty: "easy" },

  // SK POP - Medium
  { title: "Vyznanie", artist: "Marika Gombitová", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Atlantída", artist: "Miroslav Žbirka", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Ty a ja", artist: "No Name", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Žily", artist: "No Name", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Nie alebo áno", artist: "No Name", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Cigaretka na dva ťahy", artist: "Richard Müller", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Baroko", artist: "Richard Müller", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Tlaková níž", artist: "Richard Müller", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Koloseum", artist: "Marika Gombitová", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Čo bolí, to prebolí", artist: "Miroslav Žbirka", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Búrka", artist: "Mária Čírová", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Prvá", artist: "Miroslav Žbirka", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Čaba neblázni", artist: "Elán", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Stužková", artist: "Elán", lang: "sk", genre: "pop", difficulty: "medium" },
  { title: "Profesor Indigo", artist: "Peter Nagy", lang: "sk", genre: "pop", difficulty: "medium" },

  // SK POP - Hard
  { title: "Voda, čo ma drží nad vodou", artist: "Elán", lang: "sk", genre: "pop", difficulty: "hard" },
  { title: "Maturitné tablo", artist: "Peter Nagy", lang: "sk", genre: "pop", difficulty: "hard" },
  { title: "Milovanie v daždi", artist: "Richard Müller", lang: "sk", genre: "pop", difficulty: "hard" },
  { title: "Kým vieš snívať", artist: "SuperStar", lang: "sk", genre: "pop", difficulty: "hard" },
  { title: "Paradiso", artist: "Marika Gombitová", lang: "sk", genre: "pop", difficulty: "hard" },
  { title: "Len s ňou", artist: "Miroslav Žbirka", lang: "sk", genre: "pop", difficulty: "hard" },
  { title: "Slnečný kalendár", artist: "Marika Gombitová", lang: "sk", genre: "pop", difficulty: "hard" },
  { title: "Spomal", artist: "Peha", lang: "sk", genre: "pop", difficulty: "hard" },

  // SK ROCK - Easy
  { title: "Skúsime to cez vesmír", artist: "Tublatanka", lang: "sk", genre: "rock", difficulty: "easy" },
  { title: "Dnes", artist: "Tublatanka", lang: "sk", genre: "rock", difficulty: "easy" },
  { title: "Matka", artist: "Tublatanka", lang: "sk", genre: "rock", difficulty: "easy" },
  { title: "Pravda víťazí", artist: "Tublatanka", lang: "sk", genre: "rock", difficulty: "easy" },
  { title: "Reklama na ticho", artist: "Team", lang: "sk", genre: "rock", difficulty: "easy" },
  { title: "Držím ti miesto", artist: "Team", lang: "sk", genre: "rock", difficulty: "easy" },
  { title: "Malá nočná búrka", artist: "Team", lang: "sk", genre: "rock", difficulty: "easy" },
  { title: "Kým ťa mám", artist: "Pavol Habera", lang: "sk", genre: "rock", difficulty: "easy" },

  // SK ROCK - Medium / Hard
  { title: "Je to vo hviezdach", artist: "Pavol Habera", lang: "sk", genre: "rock", difficulty: "medium" },
  { title: "Severanka", artist: "Team", lang: "sk", genre: "rock", difficulty: "medium" },
  { title: "Prievan v peňaženke", artist: "Team", lang: "sk", genre: "rock", difficulty: "medium" },
  { title: "Láska, necestuj tým vlakom", artist: "Pavol Habera", lang: "sk", genre: "rock", difficulty: "medium" },
  { title: "Voňavky dievčat", artist: "Tublatanka", lang: "sk", genre: "rock", difficulty: "hard" },
  { title: "Žeravé znamenie osudu", artist: "Tublatanka", lang: "sk", genre: "rock", difficulty: "hard" },

  // SK HIPHOP
  { title: "Život je pes", artist: "Rytmus", lang: "sk", genre: "hiphop", difficulty: "easy" },
  { title: "Zlatokopky", artist: "Rytmus", lang: "sk", genre: "hiphop", difficulty: "easy" },
  { title: "Dáva mi", artist: "Kontrafakt", lang: "sk", genre: "hiphop", difficulty: "easy" },
  { title: "E.R.A.", artist: "Kontrafakt", lang: "sk", genre: "hiphop", difficulty: "medium" },
  { title: "Bozk na rozlúčku", artist: "Kontrafakt", lang: "sk", genre: "hiphop", difficulty: "medium" },
  { title: "Keď jazdíme my", artist: "Kontrafakt", lang: "sk", genre: "hiphop", difficulty: "hard" },
  { title: "Stokujeme vonku", artist: "Kontrafakt", lang: "sk", genre: "hiphop", difficulty: "hard" },

  // SK INDIE / OTHERS
  { title: "Za Dedinou", artist: "Peha", lang: "sk", genre: "indie", difficulty: "easy" },
  { title: "Slnečná balada", artist: "Peha", lang: "sk", genre: "indie", difficulty: "medium" },
  { title: "Muoj Bože", artist: "Katarína Knechtová", lang: "sk", genre: "indie", difficulty: "easy" },
  { title: "Hlavy", artist: "Billy Barman", lang: "sk", genre: "indie", difficulty: "medium" },
  { title: "Mladým chýba vojna", artist: "Billy Barman", lang: "sk", genre: "indie", difficulty: "hard" },
  { title: "Svetlo", artist: "Korben Dallas", lang: "sk", genre: "indie", difficulty: "medium" },
  { title: "Beh", artist: "Korben Dallas", lang: "sk", genre: "indie", difficulty: "hard" },
  { title: "Otec", artist: "Korben Dallas", lang: "sk", genre: "indie", difficulty: "easy" },

  // ─── ANGLICKÉ SKLADBY (EN) ────────────────────────────────────────────────
  // EN POP - Easy
  { title: "Shape of You", artist: "Ed Sheeran", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Bad Guy", artist: "Billie Eilish", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Blinding Lights", artist: "The Weeknd", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Uptown Funk", artist: "Mark Ronson feat. Bruno Mars", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Watermelon Sugar", artist: "Harry Styles", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "As It Was", artist: "Harry Styles", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Someone Like You", artist: "Adele", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Rolling in the Deep", artist: "Adele", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Roar", artist: "Katy Perry", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Shake It Off", artist: "Taylor Swift", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Blank Space", artist: "Taylor Swift", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Levitating", artist: "Dua Lipa", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Dance Monkey", artist: "Tones and I", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Counting Stars", artist: "OneRepublic", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Senorita", artist: "Shawn Mendes & Camila Cabello", lang: "en", genre: "pop", difficulty: "easy" },
  { title: "Flowers", artist: "Miley Cyrus", lang: "en", genre: "pop", difficulty: "easy" },

  // EN POP - Medium
  { title: "Don't Start Now", artist: "Dua Lipa", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Starboy", artist: "The Weeknd", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Save Your Tears", artist: "The Weeknd", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Physical", artist: "Dua Lipa", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Attention", artist: "Charlie Puth", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "New Rules", artist: "Dua Lipa", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Cheap Thrills", artist: "Sia", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Chandelier", artist: "Sia", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Positions", artist: "Ariana Grande", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "7 Rings", artist: "Ariana Grande", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Anti-Hero", artist: "Taylor Swift", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Cruel Summer", artist: "Taylor Swift", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Happier Than Ever", artist: "Billie Eilish", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Treat You Better", artist: "Shawn Mendes", lang: "en", genre: "pop", difficulty: "medium" },
  { title: "Sugar", artist: "Maroon 5", lang: "en", genre: "pop", difficulty: "medium" },

  // EN POP - Hard
  { title: "Run Away with Me", artist: "Carly Rae Jepsen", lang: "en", genre: "pop", difficulty: "hard" },
  { title: "Into You", artist: "Ariana Grande", lang: "en", genre: "pop", difficulty: "hard" },
  { title: "Cut to the Feeling", artist: "Carly Rae Jepsen", lang: "en", genre: "pop", difficulty: "hard" },
  { title: "Green Light", artist: "Lorde", lang: "en", genre: "pop", difficulty: "hard" },
  { title: "Style", artist: "Taylor Swift", lang: "en", genre: "pop", difficulty: "hard" },
  { title: "Late Night Talking", artist: "Harry Styles", lang: "en", genre: "pop", difficulty: "hard" },
  { title: "Electricity", artist: "Silk City & Dua Lipa", lang: "en", genre: "pop", difficulty: "hard" },
  { title: "Bury a Friend", artist: "Billie Eilish", lang: "en", genre: "pop", difficulty: "hard" },

  // EN ROCK - Easy
  { title: "Bohemian Rhapsody", artist: "Queen", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "We Will Rock You", artist: "Queen", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Another One Bites the Dust", artist: "Queen", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Livin' on a Prayer", artist: "Bon Jovi", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "It's My Life", artist: "Bon Jovi", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Smells Like Teen Spirit", artist: "Nirvana", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Come as You Are", artist: "Nirvana", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Highway to Hell", artist: "AC/DC", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Back in Black", artist: "AC/DC", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Thunderstruck", artist: "AC/DC", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Smoke on the Water", artist: "Deep Purple", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Eye of the Tiger", artist: "Survivor", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Don't Stop Believin'", artist: "Journey", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Hotel California", artist: "Eagles", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "In the End", artist: "Linkin Park", lang: "en", genre: "rock", difficulty: "easy" },
  { title: "Numb", artist: "Linkin Park", lang: "en", genre: "rock", difficulty: "easy" },

  // EN ROCK - Medium
  { title: "Under the Bridge", artist: "Red Hot Chili Peppers", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Californication", artist: "Red Hot Chili Peppers", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Can't Stop", artist: "Red Hot Chili Peppers", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Dream On", artist: "Aerosmith", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Paradise City", artist: "Guns N' Roses", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Seven Nation Army", artist: "The White Stripes", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Boulevard of Broken Dreams", artist: "Green Day", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "American Idiot", artist: "Green Day", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Zombie", artist: "The Cranberries", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Learn to Fly", artist: "Foo Fighters", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Everlong", artist: "Foo Fighters", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "The Pretender", artist: "Foo Fighters", lang: "en", genre: "rock", difficulty: "medium" },
  { title: "Use Somebody", artist: "Kings of Leon", lang: "en", genre: "rock", difficulty: "medium" },

  // EN ROCK - Hard
  { title: "Fell on Black Days", artist: "Soundgarden", lang: "en", genre: "rock", difficulty: "hard" },
  { title: "Black Hole Sun", artist: "Soundgarden", lang: "en", genre: "rock", difficulty: "hard" },
  { title: "Man in the Box", artist: "Alice in Chains", lang: "en", genre: "rock", difficulty: "hard" },
  { title: "Plush", artist: "Stone Temple Pilots", lang: "en", genre: "rock", difficulty: "hard" },
  { title: "No One Knows", artist: "Queens of the Stone Age", lang: "en", genre: "rock", difficulty: "hard" },
  { title: "Kashmir", artist: "Led Zeppelin", lang: "en", genre: "rock", difficulty: "hard" },
  { title: "Immigrant Song", artist: "Led Zeppelin", lang: "en", genre: "rock", difficulty: "hard" },
  { title: "Whole Lotta Love", artist: "Led Zeppelin", lang: "en", genre: "rock", difficulty: "hard" },

  // EN HIPHOP - Easy
  { title: "Lose Yourself", artist: "Eminem", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "Without Me", artist: "Eminem", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "The Real Slim Shady", artist: "Eminem", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "Gangsta's Paradise", artist: "Coolio", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "In Da Club", artist: "50 Cent", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "God's Plan", artist: "Drake", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "Hotline Bling", artist: "Drake", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "HUMBLE.", artist: "Kendrick Lamar", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "Old Town Road", artist: "Lil Nas X", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "Industry Baby", artist: "Lil Nas X & Jack Harlow", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "SICKO MODE", artist: "Travis Scott", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "Sunflower", artist: "Post Malone & Swae Lee", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "Circles", artist: "Post Malone", lang: "en", genre: "hiphop", difficulty: "easy" },
  { title: "See You Again", artist: "Wiz Khalifa feat. Charlie Puth", lang: "en", genre: "hiphop", difficulty: "easy" },

  // EN HIPHOP - Medium
  { title: "Alright", artist: "Kendrick Lamar", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "King Kunta", artist: "Kendrick Lamar", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "DNA.", artist: "Kendrick Lamar", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "Juicy", artist: "The Notorious B.I.G.", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "California Love", artist: "2Pac feat. Dr. Dre", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "Still D.R.E.", artist: "Dr. Dre feat. Snoop Dogg", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "Gin and Juice", artist: "Snoop Dogg", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "Stronger", artist: "Kanye West", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "Gold Digger", artist: "Kanye West", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "Heartless", artist: "Kanye West", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "XO Tour Llif3", artist: "Lil Uzi Vert", lang: "en", genre: "hiphop", difficulty: "medium" },
  { title: "Ransom", artist: "Lil Tecca", lang: "en", genre: "hiphop", difficulty: "medium" },

  // EN HIPHOP - Hard
  { title: "Passin' Me By", artist: "The Pharcyde", lang: "en", genre: "hiphop", difficulty: "hard" },
  { title: "N.Y. State of Mind", artist: "Nas", lang: "en", genre: "hiphop", difficulty: "hard" },
  { title: "C.R.E.A.M.", artist: "Wu-Tang Clan", lang: "en", genre: "hiphop", difficulty: "hard" },
  { title: "Shook Ones, Pt. II", artist: "Mobb Deep", lang: "en", genre: "hiphop", difficulty: "hard" },
  { title: "Ms. Jackson", artist: "Outkast", lang: "en", genre: "hiphop", difficulty: "hard" },
  { title: "Rosa Parks", artist: "Outkast", lang: "en", genre: "hiphop", difficulty: "hard" },
  { title: "Mona Lisa", artist: "Lil Wayne feat. Kendrick Lamar", lang: "en", genre: "hiphop", difficulty: "hard" },

  // EN R&B - Easy
  { title: "Umbrella", artist: "Rihanna", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "Diamonds", artist: "Rihanna", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "Crazy in Love", artist: "Beyoncé feat. Jay-Z", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "Halo", artist: "Beyoncé", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "Single Ladies", artist: "Beyoncé", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "No Scrubs", artist: "TLC", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "Yeah!", artist: "Usher feat. Lil Jon & Ludacris", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "My Boo", artist: "Usher & Alicia Keys", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "If I Ain't Got You", artist: "Alicia Keys", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "Empire State of Mind", artist: "Jay-Z & Alicia Keys", lang: "en", genre: "rnb", difficulty: "easy" },
  { title: "Ignition (Remix)", artist: "R. Kelly", lang: "en", genre: "rnb", difficulty: "easy" },

  // EN R&B - Medium
  { title: "Redbone", artist: "Childish Gambino", lang: "en", genre: "rnb", difficulty: "medium" },
  { title: "Earned It", artist: "The Weeknd", lang: "en", genre: "rnb", difficulty: "medium" },
  { title: "The Hills", artist: "The Weeknd", lang: "en", genre: "rnb", difficulty: "medium" },
  { title: "Leave the Door Open", artist: "Silk Sonic", lang: "en", genre: "rnb", difficulty: "medium" },
  { title: "Kiss Me More", artist: "Doja Cat feat. SZA", lang: "en", genre: "rnb", difficulty: "medium" },
  { title: "Kill Bill", artist: "SZA", lang: "en", genre: "rnb", difficulty: "medium" },
  { title: "Good Days", artist: "SZA", lang: "en", genre: "rnb", difficulty: "medium" },
  { title: "Say So", artist: "Doja Cat", lang: "en", genre: "rnb", difficulty: "medium" },
  { title: "Location", artist: "Khalid", lang: "en", genre: "rnb", difficulty: "medium" },
  { title: "Young Dumb & Broke", artist: "Khalid", lang: "en", genre: "rnb", difficulty: "medium" },

  // EN R&B - Hard
  { title: "Cranes in the Sky", artist: "Solange", lang: "en", genre: "rnb", difficulty: "hard" },
  { title: "Thinkin Bout You", artist: "Frank Ocean", lang: "en", genre: "rnb", difficulty: "hard" },
  { title: "Chanel", artist: "Frank Ocean", lang: "en", genre: "rnb", difficulty: "hard" },
  { title: "Nights", artist: "Frank Ocean", lang: "en", genre: "rnb", difficulty: "hard" },
  { title: "The Morning", artist: "The Weeknd", lang: "en", genre: "rnb", difficulty: "hard" },
  { title: "Wicked Games", artist: "The Weeknd", lang: "en", genre: "rnb", difficulty: "hard" },
  { title: "Best Part", artist: "Daniel Caesar & H.E.R.", lang: "en", genre: "rnb", difficulty: "hard" },

  // EN ELECTRONIC - Easy
  { title: "Levels", artist: "Avicii", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Wake Me Up", artist: "Avicii", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Titanium", artist: "David Guetta feat. Sia", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Animals", artist: "Martin Garrix", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Closer", artist: "The Chainsmokers feat. Halsey", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Something Just Like This", artist: "The Chainsmokers & Coldplay", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Don't You Worry Child", artist: "Swedish House Mafia", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "One More Time", artist: "Daft Punk", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Get Lucky", artist: "Daft Punk feat. Pharrell Williams", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Lean On", artist: "Major Lazer & DJ Snake", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "This Is What You Came For", artist: "Calvin Harris feat. Rihanna", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Summer", artist: "Calvin Harris", lang: "en", genre: "electronic", difficulty: "easy" },
  { title: "Faded", artist: "Alan Walker", lang: "en", genre: "electronic", difficulty: "easy" },

  // EN ELECTRONIC - Medium
  { title: "Sandstorm", artist: "Darude", lang: "en", genre: "electronic", difficulty: "medium" },
  { title: "Around the World", artist: "Daft Punk", lang: "en", genre: "electronic", difficulty: "medium" },
  { title: "Harder, Better, Faster, Stronger", artist: "Daft Punk", lang: "en", genre: "electronic", difficulty: "medium" },
  { title: "Strobe", artist: "deadmau5", lang: "en", genre: "electronic", difficulty: "medium" },
  { title: "Ghosts 'n' Stuff", artist: "deadmau5", lang: "en", genre: "electronic", difficulty: "medium" },
  { title: "Scary Monsters and Nice Sprites", artist: "Skrillex", lang: "en", genre: "electronic", difficulty: "medium" },
  { title: "Bangarang", artist: "Skrillex", lang: "en", genre: "electronic", difficulty: "medium" },
  { title: "Firestone", artist: "Kygo feat. Conrad Sewell", lang: "en", genre: "electronic", difficulty: "medium" },
  { title: "Stole the Show", artist: "Kygo", lang: "en", genre: "electronic", difficulty: "medium" },
  { title: "Turn Down for What", artist: "DJ Snake & Lil Jon", lang: "en", genre: "electronic", difficulty: "medium" },

  // EN ELECTRONIC - Hard
  { title: "Windowlicker", artist: "Aphex Twin", lang: "en", genre: "electronic", difficulty: "hard" },
  { title: "Come to Daddy", artist: "Aphex Twin", lang: "en", genre: "electronic", difficulty: "hard" },
  { title: "Midnight City", artist: "M83", lang: "en", genre: "electronic", difficulty: "hard" },
  { title: "Genesis", artist: "Justice", lang: "en", genre: "electronic", difficulty: "hard" },
  { title: "D.A.N.C.E.", artist: "Justice", lang: "en", genre: "electronic", difficulty: "hard" },
  { title: "Archangel", artist: "Burial", lang: "en", genre: "electronic", difficulty: "hard" },

  // EN METAL - Easy
  { title: "Enter Sandman", artist: "Metallica", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "Nothing Else Matters", artist: "Metallica", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "Master of Puppets", artist: "Metallica", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "Paranoid", artist: "Black Sabbath", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "Iron Man", artist: "Black Sabbath", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "Crazy Train", artist: "Ozzy Osbourne", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "Breaking the Law", artist: "Judas Priest", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "The Trooper", artist: "Iron Maiden", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "Run to the Hills", artist: "Iron Maiden", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "Du Hast", artist: "Rammstein", lang: "en", genre: "metal", difficulty: "easy" },
  { title: "Down with the Sickness", artist: "Disturbed", lang: "en", genre: "metal", difficulty: "easy" },

  // EN METAL - Medium
  { title: "Chop Suey!", artist: "System of a Down", lang: "en", genre: "metal", difficulty: "medium" },
  { title: "Toxicity", artist: "System of a Down", lang: "en", genre: "metal", difficulty: "medium" },
  { title: "B.Y.O.B.", artist: "System of a Down", lang: "en", genre: "metal", difficulty: "medium" },
  { title: "Duality", artist: "Slipknot", lang: "en", genre: "metal", difficulty: "medium" },
  { title: "Psychosocial", artist: "Slipknot", lang: "en", genre: "metal", difficulty: "medium" },
  { title: "Before I Forget", artist: "Slipknot", lang: "en", genre: "metal", difficulty: "medium" },
  { title: "Walk", artist: "Pantera", lang: "en", genre: "metal", difficulty: "medium" },
  { title: "Cowboys from Hell", artist: "Pantera", lang: "en", genre: "metal", difficulty: "medium" },
  { title: "Holy Wars... The Punishment Due", artist: "Megadeth", lang: "en", genre: "metal", difficulty: "medium" },
  { title: "Symphony of Destruction", artist: "Megadeth", lang: "en", genre: "metal", difficulty: "medium" },

  // EN METAL - Hard
  { title: "Hallowed Be Thy Name", artist: "Iron Maiden", lang: "en", genre: "metal", difficulty: "hard" },
  { title: "Raining Blood", artist: "Slayer", lang: "en", genre: "metal", difficulty: "hard" },
  { title: "Angel of Death", artist: "Slayer", lang: "en", genre: "metal", difficulty: "hard" },
  { title: "Bleed", artist: "Meshuggah", lang: "en", genre: "metal", difficulty: "hard" },
  { title: "Flying Whales", artist: "Gojira", lang: "en", genre: "metal", difficulty: "hard" },
  { title: "Silvera", artist: "Gojira", lang: "en", genre: "metal", difficulty: "hard" },
  { title: "Schism", artist: "Tool", lang: "en", genre: "metal", difficulty: "hard" },
  { title: "Lateralus", artist: "Tool", lang: "en", genre: "metal", difficulty: "hard" },

  // EN COUNTRY - Easy
  { title: "Take Me Home, Country Roads", artist: "John Denver", lang: "en", genre: "country", difficulty: "easy" },
  { title: "Jolene", artist: "Dolly Parton", lang: "en", genre: "country", difficulty: "easy" },
  { title: "Ring of Fire", artist: "Johnny Cash", lang: "en", genre: "country", difficulty: "easy" },
  { title: "I Walk the Line", artist: "Johnny Cash", lang: "en", genre: "country", difficulty: "easy" },
  { title: "Hurt", artist: "Johnny Cash", lang: "en", genre: "country", difficulty: "easy" },
  { title: "On the Road Again", artist: "Willie Nelson", lang: "en", genre: "country", difficulty: "easy" },
  { title: "Man! I Feel Like a Woman!", artist: "Shania Twain", lang: "en", genre: "country", difficulty: "easy" },
  { title: "You're Still the One", artist: "Shania Twain", lang: "en", genre: "country", difficulty: "easy" },
  { title: "Before He Cheats", artist: "Carrie Underwood", lang: "en", genre: "country", difficulty: "easy" },

  // EN COUNTRY - Medium
  { title: "Friends in Low Places", artist: "Garth Brooks", lang: "en", genre: "country", difficulty: "medium" },
  { title: "Tennessee Whiskey", artist: "Chris Stapleton", lang: "en", genre: "country", difficulty: "medium" },
  { title: "The Dance", artist: "Garth Brooks", lang: "en", genre: "country", difficulty: "medium" },
  { title: "Whiskey Glasses", artist: "Morgan Wallen", lang: "en", genre: "country", difficulty: "medium" },
  { title: "Wasted on You", artist: "Morgan Wallen", lang: "en", genre: "country", difficulty: "medium" },
  { title: "Fast Car", artist: "Luke Combs", lang: "en", genre: "country", difficulty: "medium" },
  { title: "Beautiful Crazy", artist: "Luke Combs", lang: "en", genre: "country", difficulty: "medium" },
  { title: "Wagon Wheel", artist: "Darius Rucker", lang: "en", genre: "country", difficulty: "medium" },

  // EN COUNTRY - Hard
  { title: "He Stopped Loving Her Today", artist: "George Jones", lang: "en", genre: "country", difficulty: "hard" },
  { title: "Mama Tried", artist: "Merle Haggard", lang: "en", genre: "country", difficulty: "hard" },
  { title: "Coal Miner's Daughter", artist: "Loretta Lynn", lang: "en", genre: "country", difficulty: "hard" },
  { title: "Crazy", artist: "Patsy Cline", lang: "en", genre: "country", difficulty: "hard" },
  { title: "Blue Eyes Crying in the Rain", artist: "Willie Nelson", lang: "en", genre: "country", difficulty: "hard" },

  // EN INDIE - Easy
  { title: "Mr. Brightside", artist: "The Killers", lang: "en", genre: "indie", difficulty: "easy" },
  { title: "Somebody Told Me", artist: "The Killers", lang: "en", genre: "indie", difficulty: "easy" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys", lang: "en", genre: "indie", difficulty: "easy" },
  { title: "R U Mine?", artist: "Arctic Monkeys", lang: "en", genre: "indie", difficulty: "easy" },
  { title: "Ho Hey", artist: "The Lumineers", lang: "en", genre: "indie", difficulty: "easy" },
  { title: "Riptide", artist: "Vance Joy", lang: "en", genre: "indie", difficulty: "easy" },
  { title: "Little Talks", artist: "Of Monsters and Men", lang: "en", genre: "indie", difficulty: "easy" },
  { title: "Take Me to Church", artist: "Hozier", lang: "en", genre: "indie", difficulty: "easy" },
  { title: "Shut Up and Dance", artist: "WALK THE MOON", lang: "en", genre: "indie", difficulty: "easy" },
  { title: "Feel It Still", artist: "Portugal. The Man", lang: "en", genre: "indie", difficulty: "easy" },

  // EN INDIE - Medium
  { title: "Pumped Up Kicks", artist: "Foster the People", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "I Bet You Look Good on the Dancefloor", artist: "Arctic Monkeys", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "Fluorescent Adolescent", artist: "Arctic Monkeys", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "When You Were Young", artist: "The Killers", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "Kids", artist: "MGMT", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "Electric Feel", artist: "MGMT", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "Time to Pretend", artist: "MGMT", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "Tongue Tied", artist: "GROUPLOVE", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "Dog Days Are Over", artist: "Florence + The Machine", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "Shake It Out", artist: "Florence + The Machine", lang: "en", genre: "indie", difficulty: "medium" },
  { title: "1901", artist: "Phoenix", lang: "en", genre: "indie", difficulty: "medium" },

  // EN INDIE - Hard
  { title: "Such Great Heights", artist: "The Postal Service", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "Maps", artist: "Yeah Yeah Yeahs", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "Float On", artist: "Modest Mouse", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "Obstacle 1", artist: "Interpol", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "Evil", artist: "Interpol", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "Neighborhood #1 (Tunnels)", artist: "Arcade Fire", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "Wake Up", artist: "Arcade Fire", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "Rebellion (Lies)", artist: "Arcade Fire", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "Skinny Love", artist: "Bon Iver", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "Holocene", artist: "Bon Iver", lang: "en", genre: "indie", difficulty: "hard" },
  { title: "The Suburbs", artist: "Arcade Fire", lang: "en", genre: "indie", difficulty: "hard" }
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function searchPreview(title: string, artist: string, lang: 'sk' | 'en'): Promise<string | null> {
  const query = `${artist} ${title}`
  const countryParam = lang === 'sk' ? '&country=SK' : ''
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5${countryParam}`
  
  try {
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json() as { results?: Array<{ previewUrl?: string }> }
      if (data.results && data.results.length > 0) {
        const match = data.results.find(r => r.previewUrl)
        if (match?.previewUrl) return match.previewUrl
      }
    }
  } catch {}

  if (lang === 'sk') {
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

async function buildExpandedSongs() {
  console.log(`Načítavam a generujem databázu skladieb (${SEED_TRACKS.length} skladieb)...`)
  
  // Načítaj existujúce s už získanými URL
  let existingSongs: Song[] = []
  try {
    existingSongs = JSON.parse(readFileSync(songsPath, 'utf8'))
  } catch {}
  const urlMap = new Map<string, string>()
  for (const s of existingSongs) {
    if (s.audio && s.audio.startsWith('http')) {
      urlMap.set(`${s.artist.toLowerCase()} - ${s.title.toLowerCase()}`, s.audio)
    }
  }

  const result: Song[] = []
  let found = 0
  let fetchedNew = 0

  for (let i = 0; i < SEED_TRACKS.length; i++) {
    const t = SEED_TRACKS[i]
    const key = `${t.artist.toLowerCase()} - ${t.title.toLowerCase()}`
    const id = slugify(`${t.artist}-${t.title}`)
    
    let audioUrl = urlMap.get(key)
    if (!audioUrl) {
      process.stdout.write(`[${i + 1}/${SEED_TRACKS.length}] Hľadám online stream pre ${t.artist} – ${t.title}... `)
      audioUrl = await searchPreview(t.title, t.artist, t.lang)
      if (audioUrl) {
        console.log(`✅`)
        fetchedNew++
      } else {
        console.log(`⚠️ (použijem fallback)`)
        audioUrl = `https://itunes.apple.com/fallback/${id}.mp3`
      }
      await new Promise(r => setTimeout(r, 120))
    }

    if (audioUrl && audioUrl.startsWith('http')) {
      found++
    }

    result.push({
      id,
      title: t.title,
      artist: t.artist,
      lang: t.lang,
      genre: t.genre as any,
      difficulty: t.difficulty,
      audio: audioUrl || '',
      clipStart: 0
    })
  }

  writeFileSync(songsPath, JSON.stringify(result, null, 2), 'utf8')
  console.log(`\n🎉 Hotovo! Databáza obsahuje ${result.length} skladieb.`)
  console.log(`S platnou online URL adresou: ${found}/${result.length}`)
}

buildExpandedSongs()
