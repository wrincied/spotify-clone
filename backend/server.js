// server.js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DEFAULTS
const DEFAULT_IMAGE = 'https://placehold.co/150/222/fff?text=No+Image';
const DEFAULT_TITLE = 'N/A';
const DEFAULT_DES = 'N/A';

const app = express();
app.use(cors());
app.use(express.json());

let logs = [];
const log = (msg) => {
  const time = new Date().toISOString();
  const entry = `[${time}] ${msg}`;
  console.log(entry);
  logs.push(entry);
};

// ───── Вспомогательные функции работы с JSON ─────

const dbPath = (file) => path.join(__dirname, 'db', file);

const loadJsonRaw = (file) =>
  JSON.parse(fs.readFileSync(dbPath(file), 'utf8'));

const saveJson = (file, data) => {
  fs.writeFileSync(dbPath(file), JSON.stringify(data, null, 2), 'utf8');
};

// генератор ID
const generateId = () => crypto.randomBytes(8).toString('hex');

// гарантируем наличие id
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

// ───── HTML-АДМИНКА (root) ─────

app.get('/', (req, res) => {
  try {
    const albums = loadAlbums();
    const songs = loadSongs();

    const findSong = (id) =>
      songs.find((s) => String(s.id) === String(id));

    let html = `
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Spotify Clone Backend Admin</title>
      <style>
        body { font-family: system-ui, Arial; background:#111; color:#eee; padding:20px; }
        h1 { color:#0f0; }
        h2 { margin-top:30px; }
        .flex { display:flex; gap:20px; flex-wrap:wrap; }
        .album, .song {
          border:1px solid #333;
          padding:10px;
          margin:10px 0;
          border-radius:8px;
          background:#181818;
          max-width:420px;
        }
        img { width:80px; height:80px; object-fit:cover; border-radius:6px; vertical-align:middle; }
        .row { display:flex; align-items:flex-start; gap:10px; }
        .error { color:#f33; font-weight:bold; }
        button {
          cursor:pointer;
          border:none;
          border-radius:4px;
          padding:4px 8px;
          margin-right:4px;
          font-size:12px;
        }
        .btn-danger { background:#b31b1b; color:#fff; }
        .btn-edit { background:#2b6cb0; color:#fff; }
        .btn-create { background:#38a169; color:#fff; margin-top:4px; }
        input, textarea {
          width:100%;
          padding:4px 6px;
          border-radius:4px;
          border:1px solid #444;
          background:#151515;
          color:#eee;
          font-size:13px;
        }
        label { font-size:12px; color:#ccc; }
        form { border:1px solid #333; padding:10px; border-radius:8px; background:#141414; margin-bottom:20px; max-width:420px;}
        small { color:#888; }
        ul { margin:4px 0 0 0; padding-left:16px; }
      </style>
    </head>
    <body>
      <h1>Backend Admin</h1>

      <h2>Create Song</h2>
      <form id="create-song-form">
        <label>Title<br><input name="title" required /></label><br><br>
        <label>Description<br><input name="description" /></label><br><br>
        <label>Thumbnail URL<br><input name="thumbnail" /></label><br><br>
        <button type="submit" class="btn-create">Create Song</button>
      </form>

      <h2>Create Album</h2>
      <form id="create-album-form">
        <label>Title<br><input name="title" required /></label><br><br>
        <label>Description<br><input name="description" /></label><br><br>
        <label>Cover URL<br><input name="cover" /></label><br><br>
        <label>Song IDs (comma-separated)<br>
          <input name="songs" />
          <small>Например: song1,song2,song3 (ID из списка Songs)</small>
        </label><br><br>
        <button type="submit" class="btn-create">Create Album</button>
      </form>

      <h2>Albums</h2>
      <div class="flex">
    `;

    // рендер альбомов
    albums.forEach((album) => {
      const cover = album.cover && album.cover.trim()
        ? album.cover.trim()
        : DEFAULT_IMAGE;

      html += `
        <div class="album">
          <div class="row">
            <img src="${cover}" onerror="this.src='${DEFAULT_IMAGE}'" />
            <div>
              <b>${album.title || DEFAULT_TITLE}</b><br>
              <small>ID: ${album.id}</small><br>
              <small>${album.description || DEFAULT_DES}</small><br><br>
              <button class="btn-edit" onclick="editAlbum('${album.id}')">Edit</button>
              <button class="btn-danger" onclick="deleteAlbum('${album.id}')">Delete</button>
            </div>
          </div>
          <p><b>Songs:</b></p>
      `;

      if (!Array.isArray(album.songs) || album.songs.length === 0) {
        html += `<p class="error">No songs in album</p>`;
      } else {
        html += `<ul>`;
        album.songs.forEach((sid) => {
          const s = findSong(sid);
          if (!s) {
            html += `<li class="error">Missing song: ${sid}</li>`;
            return;
          }
          const thumb = s.thumbnail && s.thumbnail.trim()
            ? s.thumbnail.trim()
            : cover;
          html += `
            <li>
              <img src="${thumb}" onerror="this.src='${DEFAULT_IMAGE}'" />
              <b>${s.title}</b> (ID: ${s.id})
              <button class="btn-edit" onclick="editSong('${s.id}')">Edit</button>
              <button class="btn-danger" onclick="deleteSong('${s.id}')">Delete</button>
            </li>
          `;
        });
        html += `</ul>`;
      }

      html += `</div>`;
    });

    // список всех песен
    html += `
      </div>
      <h2>All Songs</h2>
      <div class="flex">
    `;

    songs.forEach((s) => {
      const thumb = s.thumbnail && s.thumbnail.trim()
        ? s.thumbnail.trim()
        : DEFAULT_IMAGE;
      html += `
        <div class="song">
          <div class="row">
            <img src="${thumb}" onerror="this.src='${DEFAULT_IMAGE}'" />
            <div>
              <b>${s.title}</b><br>
              <small>ID: ${s.id}</small><br>
              <small>${s.description || DEFAULT_DES}</small><br><br>
              <button class="btn-edit" onclick="editSong('${s.id}')">Edit</button>
              <button class="btn-danger" onclick="deleteSong('${s.id}')">Delete</button>
            </div>
          </div>
        </div>
      `;
    });

    html += `
      </div>

      <h2>Logs</h2>
      <pre>${logs.join('\n')}</pre>

      <script>
        async function api(url, method = 'GET', body) {
          const opts = { method, headers: { 'Content-Type': 'application/json' } };
          if (body) opts.body = JSON.stringify(body);
          const res = await fetch(url, opts);
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) {
            alert('Error: ' + (data.message || res.statusText));
            throw new Error(data.message || res.statusText);
          }
          return data;
        }

        // Создание песни
        document.getElementById('create-song-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const form = e.target;
          const title = form.title.value;
          const description = form.description.value;
          const thumbnail = form.thumbnail.value;
          await api('/api/songs', 'POST', { title, description, thumbnail });
          location.reload();
        });

        // Создание альбома
        document.getElementById('create-album-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const form = e.target;
          const title = form.title.value;
          const description = form.description.value;
          const cover = form.cover.value;
          const songsStr = form.songs.value;
          const songs = songsStr
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          if (songs.length === 0) {
            alert('Укажи хотя бы один ID песни');
            return;
          }
          await api('/api/albums', 'POST', { title, description, cover, songs });
          location.reload();
        });

        async function deleteSong(id) {
          if (!confirm('Delete song ' + id + '?')) return;
          await api('/api/songs/' + id, 'DELETE');
          location.reload();
        }

        async function deleteAlbum(id) {
          if (!confirm('Delete album ' + id + '?')) return;
          await api('/api/albums/' + id, 'DELETE');
          location.reload();
        }

        async function editSong(id) {
          const title = prompt('New title (leave empty to keep)', '');
          const description = prompt('New description (leave empty to keep)', '');
          const thumbnail = prompt('New thumbnail URL (leave empty to keep)', '');
          await api('/api/songs/' + id, 'PUT', { title, description, thumbnail });
          location.reload();
        }

        async function editAlbum(id) {
          const title = prompt('New album title (leave empty to keep)', '');
          const description = prompt('New description (leave empty to keep)', '');
          const cover = prompt('New cover URL (leave empty to keep)', '');
          const songsStr = prompt('New song IDs comma-separated (leave empty to keep)', '');
          const body = { title, description, cover };
          if (songsStr && songsStr.trim().length > 0) {
            body.songs = songsStr.split(',').map(s => s.trim()).filter(Boolean);
          }
          await api('/api/albums/' + id, 'PUT', body);
          location.reload();
        }
      </script>
    </body>
    </html>
    `;

    res.send(html);
  } catch (e) {
    res.status(500).send(`
      <h1>Error loading data</h1>
      <pre>${e.message}</pre>
    `);
  }
});

// ───── API: SONGS ─────

// все песни
app.get('/api/songs', (req, res) => {
  try {
    const songs = loadSongs();
    res.json({ error: false, data: songs });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// одна песня
app.get('/api/songs/:id', (req, res) => {
  try {
    const songs = loadSongs();
    const song = songs.find((s) => String(s.id) === req.params.id);
    if (!song) return res.status(404).json({ error: true, message: 'Song not found' });
    res.json({ error: false, data: song });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// создать песню
app.post('/api/songs', (req, res) => {
  try {
    const songs = loadSongs();
    const { title, description, thumbnail } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: true, message: 'Song title is required' });
    }
    const newSong = {
      id: generateId(),
      title: title.trim(),
      description: (description || '').trim(),
      thumbnail: (thumbnail || '').trim()
    };
    songs.push(newSong);
    saveJson('songs.json', songs);
    log(`[API] Created new song: ${newSong.id}`);
    res.json({ error: false, data: newSong });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// обновить песню
app.put('/api/songs/:id', (req, res) => {
  try {
    const songs = loadSongs();
    const song = songs.find((s) => String(s.id) === req.params.id);
    if (!song) return res.status(404).json({ error: true, message: 'Song not found' });

    const { title, description, thumbnail } = req.body;

    if (title && title.trim()) song.title = title.trim();
    if (description !== undefined) song.description = (description || '').trim();
    if (thumbnail !== undefined) song.thumbnail = (thumbnail || '').trim();

    saveJson('songs.json', songs);
    log(`[API] Updated song: ${song.id}`);
    res.json({ error: false, data: song });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// удалить песню (и убрать из альбомов)
app.delete('/api/songs/:id', (req, res) => {
  try {
    const songs = loadSongs();
    const albums = loadAlbums();
    const id = req.params.id;

    const idx = songs.findIndex((s) => String(s.id) === id);
    if (idx === -1) return res.status(404).json({ error: true, message: 'Song not found' });

    const [removed] = songs.splice(idx, 1);
    saveJson('songs.json', songs);

    // убираем id из альбомов
    let changedAlbums = false;
    albums.forEach((album) => {
      if (Array.isArray(album.songs)) {
        const before = album.songs.length;
        album.songs = album.songs.filter((sid) => String(sid) !== id);
        if (album.songs.length !== before) changedAlbums = true;
      }
    });
    if (changedAlbums) {
      saveJson('albums.json', albums);
    }

    log(`[API] Deleted song: ${removed.id}`);
    res.json({ error: false, data: removed });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ───── API: ALBUMS ─────

// все альбомы
app.get('/api/albums', (req, res) => {
  try {
    const albums = loadAlbums();
    res.json({ error: false, data: albums });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// один альбом + объекты песен + автоподстановка обложки
app.get('/api/albums/:id', (req, res) => {
  try {
    const albums = loadAlbums();
    const songs = loadSongs();

    const album = albums.find((a) => String(a.id) === req.params.id);
    if (!album) {
      return res.status(404).json({ error: true, message: 'Album not found' });
    }

    const albumCover = album.cover && album.cover.trim()
      ? album.cover.trim()
      : DEFAULT_IMAGE;

    let updated = false;

    const songObjects = (album.songs || [])
      .map((sid) => {
        const song = songs.find((s) => String(s.id) === String(sid));
        if (!song) return null;
        const thumb = song.thumbnail && song.thumbnail.trim();
        if (!thumb) {
          song.thumbnail = albumCover;
          updated = true;
        }
        return song;
      })
      .filter(Boolean);

    if (updated) {
      saveJson('songs.json', songs);
      log(`[AUTO] Updated song thumbnails for album: ${album.id}`);
    }

    res.json({ error: false, data: { ...album, songs: songObjects } });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// создать альбом
app.post('/api/albums', (req, res) => {
  try {
    const albums = loadAlbums();
    const { title, description, cover, songs } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: true, message: 'Album title is required' });
    }
    if (!Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({ error: true, message: 'Album must contain at least one song ID' });
    }

    const newAlbum = {
      id: generateId(),
      title: title.trim(),
      description: (description || '').trim(),
      cover: (cover || '').trim(),
      songs: songs.map((s) => String(s).trim())
    };

    albums.push(newAlbum);
    saveJson('albums.json', albums);

    log(`[API] Created new album: ${newAlbum.id}`);
    res.json({ error: false, data: newAlbum });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// обновить альбом
app.put('/api/albums/:id', (req, res) => {
  try {
    const albums = loadAlbums();
    const album = albums.find((a) => String(a.id) === req.params.id);
    if (!album) return res.status(404).json({ error: true, message: 'Album not found' });

    const { title, description, cover, songs } = req.body;

    if (title && title.trim()) album.title = title.trim();
    if (description !== undefined) album.description = (description || '').trim();
    if (cover !== undefined) album.cover = (cover || '').trim();
    if (Array.isArray(songs)) {
      album.songs = songs.map((s) => String(s).trim());
    }

    saveJson('albums.json', albums);
    log(`[API] Updated album: ${album.id}`);
    res.json({ error: false, data: album });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// удалить альбом
app.delete('/api/albums/:id', (req, res) => {
  try {
    const albums = loadAlbums();
    const id = req.params.id;
    const idx = albums.findIndex((a) => String(a.id) === id);
    if (idx === -1) {
      return res.status(404).json({ error: true, message: 'Album not found' });
    }
    const [removed] = albums.splice(idx, 1);
    saveJson('albums.json', albums);
    log(`[API] Deleted album: ${removed.id}`);
    res.json({ error: false, data: removed });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ───── ERROR HANDLER ─────
app.use((err, req, res, next) => {
  log(`[SERVER ERROR] ${err.message}`);
  res.status(500).json({ error: true, message: err.message });
});

// ───── START ─────
app.listen(3000, () => log('[SERVER] running on http://localhost:3000'));
