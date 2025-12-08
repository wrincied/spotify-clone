import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { parseFile } from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_IMAGE =
    'https://placehold.co/150/222/fff?text=No+Image';

const app = express();
app.use(cors());
app.use(express.json());

app.use(
    '/public',
    express.static(path.join(__dirname, 'public')),
);

let logs = [];
const log = (msg) => {
    const time = new Date().toISOString();
    const entry = `[${time}] ${msg}`;
    console.log(entry);
    logs.push(entry);
};

// ───── JSON HELPERS ─────
const dbPath = (file) => path.join(__dirname, 'db', file);

if (!fs.existsSync(path.join(__dirname, 'db'))) {
    fs.mkdirSync(path.join(__dirname, 'db'));
}

const loadJsonRaw = (file) => {
    if (!fs.existsSync(dbPath(file))) return [];
    try {
        const data = fs.readFileSync(dbPath(file), 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        log(`[ERROR] Failed to read ${file}: ${e.message}`);
        return [];
    }
};

const saveJson = (file, data) => {
    fs.writeFileSync(
        dbPath(file),
        JSON.stringify(data, null, 2),
        'utf8',
    );
};

const generateId = () =>
    crypto.randomBytes(8).toString('hex');

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
        const cleanPath = relativeUrl.startsWith('/')
            ? relativeUrl.slice(1)
            : relativeUrl;
        const filePath = path.join(__dirname, cleanPath);
        if (fs.existsSync(filePath)) {
            const metadata = await parseFile(filePath);
            return Math.round(
                metadata.format.duration || 0,
            );
        }
        return 0;
    } catch (error) {
        return 0;
    }
}

// Загрузчики
const loadSongs = () => {
    const songs = loadJsonRaw('songs.json');
    if (ensureIds(songs)) saveJson('songs.json', songs);
    return songs;
};

const loadAlbums = () => {
    const albums = loadJsonRaw('albums.json');
    if (ensureIds(albums)) saveJson('albums.json', albums);
    return albums;
};

const loadCategories = () => {
    const file = 'categories.json';
    if (!fs.existsSync(dbPath(file))) {
        saveJson(file, []);
        log('[INIT] categories.json created (empty)');
    }
    let categories = loadJsonRaw(file);
    if (!Array.isArray(categories)) categories = [];
    if (ensureIds(categories)) saveJson(file, categories);
    return categories;
};

// ───────────────────────────
// HTML ADMIN UI
// ───────────────────────────
app.get('/', (req, res) => {
    try {
        const albums = loadAlbums();
        const songs = loadSongs();
        const categories = loadCategories();

        const albumOptions = albums
            .map(
                (a) =>
                    `<option value="${a.id}">${a.title}</option>`,
            )
            .join('');
        const categoryOptions = categories
            .map(
                (c) =>
                    `<option value="${c.id}">${c.name}</option>`,
            )
            .join('');

        res.setHeader(
            'Content-Type',
            'text/html; charset=utf-8',
        );

        let html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spotify Admin Panel</title>
  <link rel="shortcut icon" href="/public/logo.png" type="image/png">
  <style>
    :root {
      --bg: #09090b; --bg-card: #18181b; --border: #27272a; --text: #f4f4f5;
      --text-muted: #a1a1aa; --accent: #22c55e; --danger: #ef4444;
    }
    * { box-sizing: border-box; }
    body { 
      margin: 0; padding: 0; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg); color: var(--text); font-size: 14px;
    }
    
    .topbar {
      position: sticky; top: 0; z-index: 50;
      background: rgba(9, 9, 11, 0.8); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border); padding: 16px 24px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.1rem; }
    .brand img { height: 24px; width: 24px; object-fit: contain; }
    .refresh-btn { color: var(--text-muted); text-decoration: none; }
    .refresh-btn:hover { color: var(--accent); }

    main {
      max-width: 1400px; margin: 0 auto; padding: 24px;
      display: grid; grid-template-columns: 350px 1fr; gap: 24px;
    }
    @media (max-width: 900px) { main { grid-template-columns: 1fr; } }

    .forms-col { display: flex; flex-direction: column; gap: 20px; }
    
    .card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 12px; padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .card-header { 
      display: flex; justify-content: space-between; align-items: center; 
      margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border);
    }
    .card-title { font-weight: 600; font-size: 1rem; }
    .badge { font-size: 0.75rem; background: var(--border); padding: 2px 8px; border-radius: 99px; color: var(--text-muted); }

    label { display: block; margin-bottom: 6px; font-size: 0.8rem; color: var(--text-muted); }
    input, select {
      width: 100%; background: #09090b; border: 1px solid var(--border);
      color: var(--text); padding: 10px; border-radius: 6px; margin-bottom: 12px;
      outline: none;
    }
    input:focus, select:focus { border-color: var(--accent); }

    .btn {
      width: 100%; background: var(--text); color: var(--bg); border: none;
      padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;
    }
    .btn:hover { opacity: 0.9; }
    
    .data-col { display: flex; flex-direction: column; gap: 24px; }
    .list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    
    .item-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 8px; padding: 12px; display: flex; gap: 12px;
    }
    .item-thumb {
      width: 60px; height: 60px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: #333;
    }
    .item-color {
      width: 60px; height: 60px; border-radius: 6px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: rgba(255,255,255,0.7);
    }
    .item-content { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
    .item-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
    .item-actions { display: flex; flex-direction: column; gap: 4px; justify-content: center; }
    
    .btn-sm {
      padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; border: 1px solid var(--border);
      background: transparent; color: var(--text-muted); cursor: pointer;
    }
    .btn-sm:hover { color: var(--text); border-color: var(--text-muted); }
    .btn-sm.danger:hover { color: var(--danger); border-color: var(--danger); }

    .logs { background: #000; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.75rem; color: #33ff00; max-height: 200px; overflow-y: auto; }

    /* MODAL */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
      display: none; align-items: center; justify-content: center;
    }
    .modal-overlay.open { display: flex; }
    .modal {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 12px; width: 450px; max-width: 90%; padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .modal h2 { margin-top: 0; margin-bottom: 20px; font-size: 1.25rem; }
    .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
    .btn-cancel { background: transparent; border: 1px solid var(--border); color: var(--text); }
  </style>
</head>
<body>

  <header class="topbar">
    <div class="brand">
      <img src="/public/logo.png" alt="Logo">
      <span>Spotify Admin</span>
    </div>
    <a href="/" class="refresh-btn">Refresh Data</a>
  </header>

  <main>
    <section class="forms-col">
      <div class="card">
        <div class="card-header"><span class="card-title">Add Song</span><span class="badge">MP3</span></div>
        <form id="create-song-form">
          <label>Title</label> <input name="title" required placeholder="Track Name" />
          <label>MP3 Path</label> <input name="url" placeholder="public/music/track.mp3" />
          <label>Cover URL</label> <input name="thumbnail" placeholder="https://..." />
          <label>Artist</label> <input name="description" placeholder="Artist name" />
          <label>Category</label>
          <select name="categoryId"><option value="">-- None --</option>${categoryOptions}</select>
          <label>Album</label>
          <select name="albumId"><option value="">-- None --</option>${albumOptions}</select>
          <button type="submit" class="btn">Create Song</button>
        </form>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Add Album</span><span class="badge">Collection</span></div>
        <form id="create-album-form">
          <label>Title</label> <input name="title" required />
          <label>Cover URL</label> <input name="cover" />
          <label>Description</label> <input name="description" placeholder="EP • 2024" />
          <label>Category</label>
          <select name="categoryId"><option value="">-- None --</option>${categoryOptions}</select>
          <button type="submit" class="btn">Create Album</button>
        </form>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Add Category</span><span class="badge">Genre</span></div>
        <form id="create-category-form">
          <label>Name</label> <input name="name" required />
          <label>Color</label> <input name="color" type="color" value="#22c55e" style="height:40px;padding:2px;" />
          <button type="submit" class="btn">Create Category</button>
        </form>
      </div>
    </section>

    <section class="data-col">
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">Categories</span>
          <span class="badge">${categories.length} total</span>
        </div>
        <div class="list-grid">
          ${categories
              .map(
                  (c) => `
            <div class="item-card">
              <div class="item-color" style="background-color: ${c.color}">ID</div>
              <div class="item-content">
                <div class="item-title">${c.name}</div>
                <div class="item-meta">${c.color}</div>
              </div>
              <div class="item-actions">
                <button class="btn-sm" onclick="openEditCategoryModal('${c.id}')">EDIT</button>
                <button class="btn-sm danger" onclick="deleteCategory('${c.id}')">DEL</button>
              </div>
            </div>
          `,
              )
              .join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Songs</span><span class="badge">${songs.length} total</span></div>
        <div class="list-grid">
          ${songs
              .map(
                  (s) => `
            <div class="item-card">
              <img src="${s.thumbnail || DEFAULT_IMAGE}" class="item-thumb" onerror="this.src='${DEFAULT_IMAGE}'">
              <div class="item-content">
                <div class="item-title">${s.title}</div>
                <div class="item-meta">${s.description || 'Unknown'}</div>
              </div>
              <div class="item-actions">
                <button class="btn-sm" onclick="openEditSongModal('${s.id}')">EDIT</button>
                <button class="btn-sm danger" onclick="deleteSong('${s.id}')">DEL</button>
              </div>
            </div>
          `,
              )
              .join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Albums</span><span class="badge">${albums.length} total</span></div>
        <div class="list-grid">
          ${albums
              .map(
                  (a) => `
            <div class="item-card">
              <img src="${a.cover || DEFAULT_IMAGE}" class="item-thumb" onerror="this.src='${DEFAULT_IMAGE}'">
              <div class="item-content">
                <div class="item-title">${a.title}</div>
                <div class="item-meta">${(a.songs || []).length} tracks</div>
              </div>
              <div class="item-actions">
                <button class="btn-sm" onclick="openEditAlbumModal('${a.id}')">EDIT</button>
                <button class="btn-sm danger" onclick="deleteAlbum('${a.id}')">DEL</button>
              </div>
            </div>
          `,
              )
              .join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Logs</span></div>
        <div class="logs">${logs.slice(-10).join('<br>')}</div>
      </div>
    </section>
  </main>

  <div id="edit-song-modal" class="modal-overlay">
    <div class="modal">
      <h2>Edit Song</h2>
      <form id="edit-song-form">
        <input type="hidden" name="id">
        <label>Title</label> <input name="title" required />
        <label>Artist</label> <input name="description" />
        <label>Cover URL</label> <input name="thumbnail" />
        <label>MP3 Path</label> <input name="url" />
        <label>Category</label>
        <select name="categoryId"><option value="">-- None --</option>${categoryOptions}</select>
        <div class="modal-actions">
          <button type="button" class="btn btn-cancel" onclick="closeModal('edit-song-modal')">Cancel</button>
          <button type="submit" class="btn">Save</button>
        </div>
      </form>
    </div>
  </div>

  <div id="edit-album-modal" class="modal-overlay">
    <div class="modal">
      <h2>Edit Album</h2>
      <form id="edit-album-form">
        <input type="hidden" name="id">
        <label>Title</label> <input name="title" required />
        <label>Description</label> <input name="description" />
        <label>Cover URL</label> <input name="cover" />
        <label>Category</label>
        <select name="categoryId"><option value="">-- None --</option>${categoryOptions}</select>
        <div class="modal-actions">
          <button type="button" class="btn btn-cancel" onclick="closeModal('edit-album-modal')">Cancel</button>
          <button type="submit" class="btn">Save</button>
        </div>
      </form>
    </div>
  </div>

  <div id="edit-category-modal" class="modal-overlay">
    <div class="modal">
      <h2>Edit Category</h2>
      <form id="edit-category-form">
        <input type="hidden" name="id">
        <label>Name</label> <input name="name" required />
        <label>Color</label> <input name="color" type="color" style="height:40px;" />
        <div class="modal-actions">
          <button type="button" class="btn btn-cancel" onclick="closeModal('edit-category-modal')">Cancel</button>
          <button type="submit" class="btn">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const API = '/api';
    async function api(url, method = 'GET', body) {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      const data = await res.json();
      if (data.error) { alert(data.message); throw new Error(data.message); }
      return data;
    }

    // HANDLERS
    document.getElementById('create-song-form').addEventListener('submit', async (e) => {
      e.preventDefault(); await api(API + '/songs', 'POST', Object.fromEntries(new FormData(e.target))); location.reload();
    });
    document.getElementById('create-album-form').addEventListener('submit', async (e) => {
      e.preventDefault(); await api(API + '/albums', 'POST', Object.fromEntries(new FormData(e.target))); location.reload();
    });
    document.getElementById('create-category-form').addEventListener('submit', async (e) => {
      e.preventDefault(); await api(API + '/categories', 'POST', Object.fromEntries(new FormData(e.target))); location.reload();
    });

    // DELETE
    async function deleteSong(id) { if(confirm('Delete song?')) { await api(API + '/songs/'+id, 'DELETE'); location.reload(); } }
    async function deleteAlbum(id) { if(confirm('Delete album?')) { await api(API + '/albums/'+id, 'DELETE'); location.reload(); } }
    
    // DELETE CATEGORY
    async function deleteCategory(id) { 
        if(confirm('Delete category? It will be removed from all linked songs/albums.')) { 
            await api(API + '/categories/'+id, 'DELETE'); 
            location.reload(); 
        } 
    }

    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    // EDIT SONG
    async function openEditSongModal(id) {
      const data = await api(API + '/songs');
      const song = data.data.find(s => s.id === id);
      if(!song) return;
      const form = document.getElementById('edit-song-form');
      form.id.value = song.id;
      form.title.value = song.title;
      form.description.value = song.description || '';
      form.thumbnail.value = song.thumbnail || '';
      form.url.value = song.url || '';
      form.categoryId.value = (song.categories && song.categories.length) ? song.categories[0] : '';
      document.getElementById('edit-song-modal').classList.add('open');
    }
    document.getElementById('edit-song-form').addEventListener('submit', async (e) => {
      e.preventDefault(); const data = Object.fromEntries(new FormData(e.target)); await api(API + '/songs/'+data.id, 'PUT', data); location.reload();
    });

    // EDIT ALBUM
    async function openEditAlbumModal(id) {
      const data = await api(API + '/albums/'+id);
      const album = data.data;
      if(!album) return;
      const form = document.getElementById('edit-album-form');
      form.id.value = album.id;
      form.title.value = album.title;
      form.description.value = album.description || '';
      form.cover.value = album.cover || '';
      // Для альбомов API возвращает populated categories, нам нужно вытащить ID
      const catId = (album.categories && album.categories.length) ? album.categories[0].id : '';
      form.categoryId.value = catId;
      document.getElementById('edit-album-modal').classList.add('open');
    }
    document.getElementById('edit-album-form').addEventListener('submit', async (e) => {
      e.preventDefault(); const data = Object.fromEntries(new FormData(e.target)); await api(API + '/albums/'+data.id, 'PUT', data); location.reload();
    });

    // EDIT CATEGORY (НОВАЯ ФУНКЦИЯ)
    async function openEditCategoryModal(id) {
        const data = await api(API + '/categories');
        const cat = data.data.find(c => c.id === id);
        if(!cat) return;
        const form = document.getElementById('edit-category-form');
        form.id.value = cat.id;
        form.name.value = cat.name;
        form.color.value = cat.color;
        document.getElementById('edit-category-modal').classList.add('open');
    }
    document.getElementById('edit-category-form').addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const data = Object.fromEntries(new FormData(e.target)); 
        await api(API + '/categories/'+data.id, 'PUT', data); 
        location.reload();
    });

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

// --- CATEGORIES ROUTES ---
app.get('/api/categories', (req, res) =>
    res.json({ error: false, data: loadCategories() }),
);

app.post('/api/categories', (req, res) => {
    try {
        const cats = loadCategories();
        const { name, color } = req.body;
        const newItem = {
            id: generateId(),
            name,
            color: color || '#22c55e',
        };
        cats.push(newItem);
        saveJson('categories.json', cats);
        res.json({ error: false, data: newItem });
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message,
        });
    }
});

app.put('/api/categories/:id', (req, res) => {
    try {
        const cats = loadCategories();
        const cat = cats.find(
            (c) => c.id === req.params.id,
        );
        if (!cat)
            return res
                .status(404)
                .json({
                    error: true,
                    message: 'Category not found',
                });

        if (req.body.name) cat.name = req.body.name;
        if (req.body.color) cat.color = req.body.color;

        saveJson('categories.json', cats);
        res.json({ error: false, data: cat });
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message,
        });
    }
});

app.delete('/api/categories/:id', (req, res) => {
    try {
        const cats = loadCategories();
        const idx = cats.findIndex(
            (c) => c.id === req.params.id,
        );
        if (idx === -1)
            return res.status(404).json({ error: true });

        // Удаляем категорию из списка
        cats.splice(idx, 1);
        saveJson('categories.json', cats);

        // ОЧИСТКА: Удаляем ID категории из всех альбомов и песен
        const albums = loadAlbums();
        let albumsChanged = false;
        albums.forEach((a) => {
            if (
                a.categories &&
                a.categories.includes(req.params.id)
            ) {
                a.categories = a.categories.filter(
                    (id) => id !== req.params.id,
                );
                albumsChanged = true;
            }
        });
        if (albumsChanged) saveJson('albums.json', albums);

        const songs = loadSongs();
        let songsChanged = false;
        songs.forEach((s) => {
            if (
                s.categories &&
                s.categories.includes(req.params.id)
            ) {
                s.categories = s.categories.filter(
                    (id) => id !== req.params.id,
                );
                songsChanged = true;
            }
        });
        if (songsChanged) saveJson('songs.json', songs);

        res.json({ error: false });
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message,
        });
    }
});

// --- SEARCH ---
app.get('/api/search', (req, res) => {
    const q = (req.query.q || '').toString().toLowerCase();
    const songs = loadSongs();
    const albums = loadAlbums();
    const cats = loadCategories();

    const richAlbums = albums.map((a) => ({
        ...a,
        categories: (a.categories || [])
            .map((cid) => cats.find((c) => c.id === cid))
            .filter(Boolean),
        songs: (a.songs || [])
            .map((id) => {
                const s = songs.find((x) => x.id === id);
                return s
                    ? {
                          ...s,
                          thumbnail: s.thumbnail || a.cover,
                      }
                    : null;
            })
            .filter(Boolean),
    }));

    const allTracks = richAlbums.flatMap((a) =>
        a.songs.map((s) => ({ ...s, albumId: a.id })),
    );

    if (!q)
        return res.json({
            error: false,
            data: {
                albums: richAlbums,
                tracks: allTracks,
                categories: cats,
            },
        });

    const fAlbums = richAlbums.filter((a) =>
        a.title.toLowerCase().includes(q),
    );
    const fTracks = allTracks.filter(
        (t) =>
            t.title.toLowerCase().includes(q) ||
            t.artist?.toLowerCase().includes(q),
    );
    const fCats = cats.filter((c) =>
        c.name.toLowerCase().includes(q),
    );

    res.json({
        error: false,
        data: {
            albums: fAlbums,
            tracks: fTracks,
            categories: fCats,
        },
    });
});

// --- SONGS ---
app.get('/api/songs', (req, res) =>
    res.json({ error: false, data: loadSongs() }),
);

app.post('/api/songs', async (req, res) => {
    try {
        const songs = loadSongs();
        const {
            title,
            description,
            thumbnail,
            url,
            albumId,
            categoryId,
        } = req.body;
        const duration = await getAudioDuration(url);

        const newSong = {
            id: generateId(),
            title,
            description,
            thumbnail,
            url,
            duration,
            categories: categoryId ? [categoryId] : [],
        };

        songs.push(newSong);
        saveJson('songs.json', songs);

        if (albumId) {
            const albums = loadAlbums();
            const album = albums.find(
                (a) => a.id === albumId,
            );
            if (album) {
                album.songs = album.songs || [];
                album.songs.push(newSong.id);
                saveJson('albums.json', albums);
            }
        }
        if (categoryId) {
            const categories = loadCategories();
            const category = categories.find(
                (c) => c.id === categoryId,
            );
            if (category) {
                category.songs = category.songs || [];
                category.songs.push(newSong.id);
                saveJson('categories.json', categories);
            }
        }
        res.json({ error: false, data: newSong });
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message,
        });
    }
});

app.put('/api/songs/:id', async (req, res) => {
    try {
        const songs = loadSongs();
        const song = songs.find(
            (s) => s.id === req.params.id,
        );
        if (!song)
            return res
                .status(404)
                .json({
                    error: true,
                    message: 'Not found',
                });

        const {
            title,
            description,
            thumbnail,
            url,
            categoryId,
        } = req.body;
        if (title) song.title = title;
        if (description) song.description = description;
        if (thumbnail) song.thumbnail = thumbnail;
        if (categoryId) song.categories = [categoryId];

        if (url && url !== song.url) {
            song.url = url;
            song.duration = await getAudioDuration(url);
        }
        saveJson('songs.json', songs);
        res.json({ error: false, data: song });
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message,
        });
    }
});

app.delete('/api/songs/:id', (req, res) => {
    const songs = loadSongs();
    const idx = songs.findIndex(
        (s) => s.id === req.params.id,
    );
    if (idx === -1)
        return res.status(404).json({ error: true });
    songs.splice(idx, 1);

    const albums = loadAlbums();
    albums.forEach((a) => {
        a.songs = (a.songs || []).filter(
            (sid) => sid !== req.params.id,
        );
    });
    saveJson('albums.json', albums);

    const categories = loadCategories();
    categories.forEach((c) => {
        c.songs = (c.songs || []).filter(
            (sid) => sid !== req.params.id,
        );
    });
    saveJson('categories.json', categories);

    saveJson('songs.json', songs);
    res.json({ error: false });
});

// --- ALBUMS ---
app.get('/api/albums', (req, res) => {
    const albums = loadAlbums();
    const songs = loadSongs();
    const categories = loadCategories();
    const data = albums.map((a) => ({
        ...a,
        categories: (a.categories || [])
            .map((cid) =>
                categories.find((c) => c.id === cid),
            )
            .filter(Boolean),
        songs: (a.songs || [])
            .map((id) => songs.find((s) => s.id === id))
            .filter(Boolean),
    }));
    res.json({ error: false, data });
});

app.get('/api/albums/:id', (req, res) => {
    const albums = loadAlbums();
    const songs = loadSongs();
    const categories = loadCategories();
    const a = albums.find((x) => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: true });

    const enriched = {
        ...a,
        categories: (a.categories || [])
            .map((cid) =>
                categories.find((c) => c.id === cid),
            )
            .filter(Boolean),
        songs: (a.songs || [])
            .map((id) => {
                const s = songs.find((x) => x.id === id);
                return s
                    ? {
                          ...s,
                          thumbnail: s.thumbnail || a.cover,
                      }
                    : null;
            })
            .filter(Boolean),
    };
    res.json({ error: false, data: enriched });
});

app.post('/api/albums', (req, res) => {
    const albums = loadAlbums();
    const { title, description, cover, songs, categoryId } =
        req.body;
    const newAlbum = {
        id: generateId(),
        title,
        description,
        cover,
        songs: songs
            ? songs.split(',').map((s) => s.trim())
            : [],
        categories: categoryId ? [categoryId] : [],
    };
    albums.push(newAlbum);
    saveJson('albums.json', albums);

    if (categoryId) {
        const categories = loadCategories();
        const category = categories.find(
            (c) => c.id === categoryId,
        );
        if (category) {
            category.albums = category.albums || [];
            category.albums.push(newAlbum.id);
            saveJson('categories.json', categories);
        }
    }
    res.json({ error: false, data: newAlbum });
});

app.put('/api/albums/:id', (req, res) => {
    const albums = loadAlbums();
    const a = albums.find((x) => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: true });
    Object.assign(a, req.body);
    if (req.body.categoryId) {
        a.categories = [req.body.categoryId];
    }
    saveJson('albums.json', albums);
    res.json({ error: false, data: a });
});

app.delete('/api/albums/:id', (req, res) => {
    const albums = loadAlbums();
    const idx = albums.findIndex(
        (x) => x.id === req.params.id,
    );
    if (idx !== -1) albums.splice(idx, 1);

    const categories = loadCategories();
    categories.forEach((c) => {
        c.albums = (c.albums || []).filter(
            (aid) => aid !== req.params.id,
        );
    });
    saveJson('categories.json', categories);

    saveJson('albums.json', albums);
    res.json({ error: false });
});

app.listen(3000, () => log('SERVER RUNNING ON PORT 3000'));
