// server.js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { parseFile } from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DEFAULTS
const DEFAULT_IMAGE = 'https://placehold.co/150/222/fff?text=No+Image';

const app = express();
app.use(cors());
app.use(express.json());

// Раздача статики (mp3)
app.use('/public', express.static(path.join(__dirname, 'public')));

let logs = [];
const log = (msg) => {
  const time = new Date().toISOString();
  const entry = `[${time}] ${msg}`;
  console.log(entry);
  logs.push(entry);
};

// ───── MOCK CATEGORIES ─────
const mockCategories = [
  { id: 'cat01', name: 'Pop', color: '#ff4d4d' },
  { id: 'cat02', name: 'Hip-Hop', color: '#4d79ff' },
  { id: 'cat03', name: 'R&B', color: '#a64dff' },
  { id: 'cat04', name: 'Indie', color: '#4dffa6' },
  { id: 'cat05', name: 'Lo-Fi', color: '#ffaa4d' }
];

// ───── JSON HELPERS ─────
const dbPath = (file) => path.join(__dirname, 'db', file);

if (!fs.existsSync(path.join(__dirname, 'db'))) {
    fs.mkdirSync(path.join(__dirname, 'db'));
}

const loadJsonRaw = (file) => {
  if (!fs.existsSync(dbPath(file))) return [];
  return JSON.parse(fs.readFileSync(dbPath(file), 'utf8'));
};

const saveJson = (file, data) => {
  fs.writeFileSync(dbPath(file), JSON.stringify(data, null, 2), 'utf8');
};

const generateId = () => crypto.randomBytes(8).toString('hex');

const ensureIds = (items) => {
  let updated = false;
  items.forEach((item) => {
    if (!item.id || String(item.id).trim() === '') {
      item.id = generateId();
      updated = true;
    }
  });
  return updated;
};

// Расчет длительности
async function getAudioDuration(relativeUrl) {
    if (!relativeUrl) return 0;
    try {
        const cleanPath = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;
        const filePath = path.join(__dirname, cleanPath);
        
        if (fs.existsSync(filePath)) {
            const metadata = await parseFile(filePath);
            const duration = Math.round(metadata.format.duration || 0);
            log(`[AUDIO] Calculated duration for ${cleanPath}: ${duration}s`);
            return duration;
        } else {
            log(`[AUDIO] File not found: ${filePath}`);
            return 0;
        }
    } catch (error) {
        log(`[AUDIO] Error parsing file: ${error.message}`);
        return 0;
    }
}

const loadSongs = () => {
  const songs = loadJsonRaw('songs.json');
  if (ensureIds(songs)) {
    saveJson('songs.json', songs);
    log('[AUTO] Song IDs generated');
  }
  return songs;
};

const loadAlbums = () => {
  const albums = loadJsonRaw('albums.json');
  if (ensureIds(albums)) {
    saveJson('albums.json', albums);
    log('[AUTO] Album IDs generated');
  }
  return albums;
};

const loadCategories = () => {
  const file = 'categories.json';
  if (!fs.existsSync(dbPath(file))) {
    saveJson(file, mockCategories);
    log('[INIT] categories.json created from mockCategories');
  }
  let categories = loadJsonRaw(file);
  if (!Array.isArray(categories)) categories = [];
  if (ensureIds(categories)) {
    saveJson(file, categories);
    log('[AUTO] Category IDs generated');
  }
  return categories;
};


// ───────────────────────────
// HTML ADMIN (root)
// ───────────────────────────
app.get('/', (req, res) => {
  try {
    const albums = loadAlbums();
    const songs = loadSongs();
    
    // <--- 1. Генерируем опции для выпадающего списка альбомов
    const albumOptions = albums.map(a => `<option value="${a.id}">${a.title}</option>`).join('');

    let html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Admin Spotify</title>
  <link rel="shortcut icon" href="/public/logo.png" type="image/png">
  <style>
    :root { --bg: #020617; --bg-el: #050816; --bg-soft: #0b1020; --border: #1f2937; --accent: #22c55e; --text: #f9fafb; --muted: #9ca3af; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); }
    .topbar { position: sticky; top: 0; z-index: 20; background: rgba(2,6,23,0.95); border-bottom: 1px solid rgba(148,163,184,0.16); padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(10px); }
    main { padding: 24px; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; }
    @media (max-width: 960px) { main { grid-template-columns: 1fr; } }
    .card { background: var(--bg-el); border: 1px solid var(--border); border-radius: 14px; padding: 20px; margin-bottom: 20px; }
    .card-title { font-weight: 600; margin-bottom: 15px; color: var(--accent); }
    input, textarea, select { width: 100%; background: var(--bg-soft); border: 1px solid var(--border); color: white; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; font-family: inherit; }
    label { font-size: 0.8rem; color: var(--muted); display: block; margin-bottom: 4px; }
    .btn { background: var(--accent); color: black; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; text-transform: uppercase; font-size: 0.75rem; }
    .btn:hover { filter: brightness(1.1); }
    .btn-danger { background: #ef4444; color: white; }
    .btn-secondary { background: #334155; color: white; }
    .list-item { background: var(--bg-soft); border: 1px solid var(--border); padding: 10px; border-radius: 8px; display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
    .thumb { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; background: #333; }
    .info { flex: 1; }
    .info h4 { margin: 0 0 4px 0; font-size: 0.95rem; }
    .info p { margin: 0; font-size: 0.8rem; color: var(--muted); }
    .actions { display: flex; gap: 5px; }
    pre { font-size: 0.75rem; color: #888; white-space: pre-wrap; margin: 0; }
  </style>
</head>
<body>
  <header class="topbar">
    <div style="font-weight:700;">Spotify Backend v2.1</div>
    <nav style="display:flex; gap:15px; font-size:0.9rem;">
      <a href="/" style="color:var(--text); text-decoration:none;">Refresh</a>
    </nav>
  </header>

  <main>
    <section>
      <div class="card">
        <div class="card-title">Create Song</div>
        <form id="create-song-form">
          <label>Title</label>
          <input name="title" required placeholder="Track Name" />
          
          <label>MP3 Path (e.g. public/music/song.mp3)</label>
          <input name="url" placeholder="public/music/..." />

          <label>Thumbnail URL</label>
          <input name="thumbnail" placeholder="https://..." />
          
          <label>Description (Artist)</label>
          <input name="description" placeholder="Artist name" />

          <label>Add to Album (Optional)</label>
          <select name="albumId">
             <option value="">-- Select Album --</option>
             ${albumOptions}
          </select>

          <button type="submit" class="btn">Add Song</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title">Create Album</div>
        <form id="create-album-form">
          <label>Title</label>
          <input name="title" required placeholder="Album Name" />
          <label>Cover URL</label>
          <input name="cover" placeholder="https://..." />
          <label>Description</label>
          <input name="description" placeholder="EP • Artist • Year" />
          <label>Song IDs (comma separated)</label>
          <input name="songs" placeholder="id1, id2..." />
          <button type="submit" class="btn">Create Album</button>
        </form>
      </div>

       <div class="card">
        <div class="card-title">Create Category</div>
        <form id="create-category-form">
          <label>Name</label>
          <input name="name" required placeholder="Name" />
          <label>Color</label>
          <input name="color" type="color" value="#22c55e" style="height:40px; padding:2px;" />
          <button type="submit" class="btn">Create Category</button>
        </form>
      </div>
    </section>

    <section>
      <div class="card">
        <div class="card-title">Songs (${songs.length})</div>
        <div>
          ${songs.map(s => `
            <div class="list-item">
              <img src="${s.thumbnail || DEFAULT_IMAGE}" class="thumb" onerror="this.src='${DEFAULT_IMAGE}'">
              <div class="info">
                <h4>${s.title}</h4>
                <p>${s.description || ''}</p>
                <p style="font-size:0.7rem;">ID: ${s.id} | ${s.duration || 0}s</p>
              </div>
              <div class="actions">
                <button class="btn btn-secondary" onclick="editSong('${s.id}')">E</button>
                <button class="btn btn-danger" onclick="deleteSong('${s.id}')">X</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
       <div class="card" id="logs">
         <div class="card-title">Server Logs</div>
         <pre>${logs.slice(-10).join('\n')}</pre>
      </div>
    </section>
  </main>

  <script>
    async function api(url, method = 'GET', body) {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      const data = await res.json();
      if (data.error) { alert(data.message); throw new Error(data.message); }
      return data;
    }

    // CREATE SONG + ADD TO ALBUM
    document.getElementById('create-song-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      await api('/api/songs', 'POST', { 
          title: f.title.value, 
          description: f.description.value, 
          thumbnail: f.thumbnail.value,
          url: f.url.value,
          albumId: f.albumId.value // Передаем ID выбранного альбома
      });
      location.reload();
    });

    document.getElementById('create-album-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const songs = f.songs.value.split(',').map(s => s.trim()).filter(Boolean);
      await api('/api/albums', 'POST', { 
          title: f.title.value, 
          description: f.description.value, 
          cover: f.cover.value, 
          songs 
      });
      location.reload();
    });

    document.getElementById('create-category-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      await api('/api/categories', 'POST', { name: f.name.value, color: f.color.value });
      location.reload();
    });

    async function deleteSong(id) { if(confirm('Del?')) { await api('/api/songs/'+id, 'DELETE'); location.reload(); } }
    async function editSong(id) {
       const title = prompt('New Title:');
       const url = prompt('New MP3 Path:');
       if(title) await api('/api/songs/'+id, 'PUT', { title, url });
       location.reload();
    }
  </script>
</body>
</html>`;
    res.send(html);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ───────────────────────────
// API ROUTES
// ───────────────────────────

// CATEGORIES
app.get('/api/categories', (req, res) => res.json({ error: false, data: loadCategories() }));
app.post('/api/categories', (req, res) => {
    try {
        const cats = loadCategories();
        const { name, color } = req.body;
        const newItem = { id: generateId(), name, color: color || '#22c55e' };
        cats.push(newItem);
        saveJson('categories.json', cats);
        res.json({ error: false, data: newItem });
    } catch(e) { res.status(500).json({error:true, message:e.message}); }
});

// SEARCH
app.get('/api/search', (req, res) => {
    const q = (req.query.q || '').toString().toLowerCase();
    const songs = loadSongs();
    const albums = loadAlbums();
    const cats = loadCategories();
    
    const richAlbums = albums.map(a => ({
        ...a,
        songs: (a.songs || []).map(id => {
            const s = songs.find(x => x.id === id);
            return s ? { ...s, thumbnail: s.thumbnail || a.cover } : null;
        }).filter(Boolean)
    }));
    
    const allTracks = richAlbums.flatMap(a => a.songs.map(s => ({ ...s, albumId: a.id })));

    if(!q) return res.json({ error:false, data: { albums: richAlbums, tracks: allTracks, categories: cats }});

    const fAlbums = richAlbums.filter(a => a.title.toLowerCase().includes(q));
    const fTracks = allTracks.filter(t => t.title.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q));
    const fCats = cats.filter(c => c.name.toLowerCase().includes(q));

    res.json({ error: false, data: { albums: fAlbums, tracks: fTracks, categories: fCats } });
});

// SONGS
app.get('/api/songs', (req, res) => res.json({ error: false, data: loadSongs() }));

// POST SONG (Logic Updated)
app.post('/api/songs', async (req, res) => {
    try {
        const songs = loadSongs();
        const { title, description, thumbnail, url, albumId } = req.body; // Получаем albumId
        
        const duration = await getAudioDuration(url);

        const newSong = {
            id: generateId(),
            title,
            description,
            thumbnail,
            url,
            duration
        };
        
        songs.push(newSong);
        saveJson('songs.json', songs);
        log(`[API] Created song ${newSong.id}`);

        // 3. Если передан albumId, добавляем песню в альбом
        if (albumId) {
            const albums = loadAlbums();
            const album = albums.find(a => a.id === albumId);
            if (album) {
                album.songs = album.songs || [];
                album.songs.push(newSong.id);
                saveJson('albums.json', albums);
                log(`[API] Added song ${newSong.id} to album ${album.title}`);
            }
        }

        res.json({ error: false, data: newSong });
    } catch(e) { res.status(500).json({error:true, message:e.message}); }
});

// PUT SONG
app.put('/api/songs/:id', async (req, res) => {
    try {
        const songs = loadSongs();
        const song = songs.find(s => s.id === req.params.id);
        if(!song) return res.status(404).json({error:true, message:'Not found'});
        
        const { title, description, thumbnail, url } = req.body;
        if(title) song.title = title;
        if(description) song.description = description;
        if(thumbnail) song.thumbnail = thumbnail;
        
        if(url && url !== song.url) {
            song.url = url;
            song.duration = await getAudioDuration(url);
        }

        saveJson('songs.json', songs);
        res.json({ error: false, data: song });
    } catch(e) { res.status(500).json({error:true, message:e.message}); }
});

app.delete('/api/songs/:id', (req, res) => {
    const songs = loadSongs();
    const idx = songs.findIndex(s => s.id === req.params.id);
    if(idx === -1) return res.status(404).json({error:true});
    songs.splice(idx, 1);
    saveJson('songs.json', songs);
    res.json({error:false});
});

// ALBUMS
app.get('/api/albums', (req, res) => {
    const albums = loadAlbums();
    const songs = loadSongs();
    const data = albums.map(a => ({
        ...a,
        songs: (a.songs||[]).map(id => songs.find(s=>s.id === id)).filter(Boolean)
    }));
    res.json({error:false, data});
});

app.get('/api/albums/:id', (req, res) => {
    const albums = loadAlbums();
    const songs = loadSongs();
    const a = albums.find(x => x.id === req.params.id);
    if(!a) return res.status(404).json({error:true});
    
    const enriched = {
        ...a,
        songs: (a.songs||[]).map(id => {
             const s = songs.find(x => x.id === id);
             return s ? { ...s, thumbnail: s.thumbnail || a.cover } : null;
        }).filter(Boolean)
    };
    res.json({error:false, data: enriched});
});

app.post('/api/albums', (req, res) => {
    const albums = loadAlbums();
    const { title, description, cover, songs } = req.body;
    const newAlbum = { id: generateId(), title, description, cover, songs: songs || [] };
    albums.push(newAlbum);
    saveJson('albums.json', albums);
    res.json({error:false, data: newAlbum});
});

app.put('/api/albums/:id', (req, res) => {
    const albums = loadAlbums();
    const a = albums.find(x => x.id === req.params.id);
    if(!a) return res.status(404).json({error:true});
    Object.assign(a, req.body);
    saveJson('albums.json', albums);
    res.json({error:false, data: a});
});

app.delete('/api/albums/:id', (req, res) => {
    const albums = loadAlbums();
    const idx = albums.findIndex(x => x.id === req.params.id);
    if(idx !== -1) albums.splice(idx, 1);
    saveJson('albums.json', albums);
    res.json({error:false});
});

app.listen(3000, () => log('SERVER RUNNING ON PORT 3000'));