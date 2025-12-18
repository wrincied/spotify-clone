import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { parseFile } from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_IMAGE = 'https://placehold.co/150/222/fff?text=No+Image';

// ─────────────────────────────────────────────────────────────
// 1. DATA SEEDING (ИСПОЛЬЗУЕТСЯ, ЕСЛИ JSON ФАЙЛЫ ОТСУТСТВУЮТ)
// ─────────────────────────────────────────────────────────────
const PYRO_ID = 'artist-pyrokinesis';

const DEFAULT_ARTISTS = [
  {
    id: PYRO_ID,
    name: 'Pyrokinesis',
    avatar: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
    bio: 'Тёмная сторона, концептуальные альбомы и метафизика.',
    followers: 450000,
  },
];

const DEFAULT_SONGS = [
  {
    id: 'c0deebdbd4ee0b7f',
    title: 'похвала бичам',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 165,
    description: 'pyrokinesis',
  },
  {
    id: '8a1b7c368eb64d63',
    title: 'молчаливое согласие небес',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 135,
    description: 'pyrokinesis',
  },
  {
    id: '9382fdab10e50305',
    title: 'моя великая вина',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: '036616b3a3327e69',
    title: 'её влюбленные глаза',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: '4ee0d581bb510851',
    title: 'дъявол в деталях',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: '73f0e423c8418c24',
    title: 'мы попадем с тобою в ад',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: 'd8ddf4bc87e22e35',
    title: 'трупный синод',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: '3b50e3517fa1710b',
    title: 'mea maxima culpa',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: '413594f59a7ba47f',
    title: 'день рождение наоборот',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: 'cd327883247ada89',
    title: '50 на 50',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: 'b5a634e5698717de',
    title: 'точки мои опор',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: '751f704869fcffcb',
    title: 'клятвы',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: 'e459473310262ad6',
    title: 'яблоки в карамели',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: '63734c671d7c876e',
    title: 'тёмная сторона Бога',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: '2aa7d8aa946d7b0f',
    title: 'Апокалипсис Андрея',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: 'b4cc806a5a2300a6',
    title: 'трансгрессивный переход',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
  {
    id: '4de17e76e31be25f',
    title: 'сшитые имена',
    artist: 'pyrokinesis',
    artistId: PYRO_ID,
    thumbnail:
      'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    url: '',
    duration: 0,
    description: 'pyrokinesis',
  },
];

const DEFAULT_ALBUMS = [
  {
    id: '50570ce85ebefea3',
    title: 'mea maxima culpa',
    description: 'pyrokinesis',
    cover: 'https://i.scdn.co/image/ab67616d00001e02591ce0ce2088d7e40e96b846',
    artistId: PYRO_ID,
    songs: DEFAULT_SONGS.map((s) => s.id),
  },
];

const DEFAULT_CATEGORIES = [
  {
    id: '2d801e0bdb229643',
    name: 'Pop',
    color: '#148a08',
    description: "Today's biggest hits.",
    songs: [],
    albums: [],
  },
  {
    id: 'f631627b8d99fb49',
    name: 'Hip-Hop',
    color: '#bc2677',
    description: 'Modern rap.',
    songs: [],
    albums: [],
  },
  {
    id: '28abc4331a0b3993',
    name: 'Rock',
    color: '#e1132f',
    description: 'Rock anthems.',
    songs: [],
    albums: [],
  },
  {
    id: '702e7774a663b0b7',
    name: 'Workout',
    color: '#535353',
    description: 'High-energy music.',
    songs: [],
    albums: [],
  },
  {
    id: '704d6dce2bb5de72',
    name: 'Chill',
    color: '#af4f04',
    description: 'Relaxing music.',
    songs: [],
    albums: [],
  },
  {
    id: '73e2c2b3ec0458ab',
    name: 'Indie',
    color: '#ba5d07',
    description: 'Alternative sounds.',
    songs: [],
    albums: [],
  },
];

// ─────────────────────────────────────────────────────────────
// 2. SERVER CONFIGURATION
// ─────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ВАЖНО: Открываем папку public для доступа из браузера
// Теперь файлы доступны по адресу http://localhost:3000/public/...
app.use('/public', express.static(path.join(__dirname, 'public')));

let logs = [];
const log = (msg) => {
  const time = new Date().toISOString();
  const entry = `[${time}] ${msg}`;
  console.log(entry);
  logs.push(entry);
};

const dbPath = (file) => path.join(__dirname, 'db', file);

// Создаем папку db, если нет
if (!fs.existsSync(path.join(__dirname, 'db'))) {
  fs.mkdirSync(path.join(__dirname, 'db'));
}

const saveJson = (file, data) => {
  fs.writeFileSync(dbPath(file), JSON.stringify(data, null, 2), 'utf8');
};

const generateId = () => crypto.randomBytes(8).toString('hex');

// ЗАГРУЗЧИК ДАННЫХ:
// 1. Если файл есть на диске -> читаем его (сохраняя твои данные).
// 2. Если файла нет -> создаем новый из DEFAULT_...
const loadJsonWithDefaults = (file, defaults) => {
  if (fs.existsSync(dbPath(file))) {
    try {
      const data = fs.readFileSync(dbPath(file), 'utf8');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      log(`[ERROR] Failed to read ${file}: ${e.message}. Using defaults.`);
      return defaults;
    }
  } else {
    saveJson(file, defaults);
    log(`[INIT] Created ${file} with default data`);
    return defaults;
  }
};

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

// Функция расчета длительности
async function getAudioDuration(relativeUrl) {
  if (!relativeUrl || relativeUrl.trim() === '') return 0;

  try {
    // Удаляем начальный слэш, если он есть (чтобы путь был корректным)
    const cleanPath = relativeUrl.startsWith('/')
      ? relativeUrl.slice(1)
      : relativeUrl;

    // Формируем полный путь на сервере
    const filePath = path.join(__dirname, cleanPath);

    // Проверяем, существует ли файл физически
    if (fs.existsSync(filePath)) {
      const metadata = await parseFile(filePath);
      return Math.round(metadata.format.duration || 0);
    } else {
      // Логируем ошибку, чтобы ты видел, где сервер ищет файл
      log(`[WARN] File not found: ${filePath}`);
      return 0;
    }
  } catch (error) {
    log(`[ERROR] Duration calc error for ${relativeUrl}: ${error.message}`);
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────
// 3. LOAD DATA & REFRESH LOGIC
// ─────────────────────────────────────────────────────────────

// Загружаем данные
const artists = loadJsonWithDefaults('artists.json', DEFAULT_ARTISTS);
const categories = loadJsonWithDefaults('categories.json', DEFAULT_CATEGORIES);
const albums = loadJsonWithDefaults('albums.json', DEFAULT_ALBUMS);
let songs = loadJsonWithDefaults('songs.json', DEFAULT_SONGS);

// Проверяем ID
if (ensureIds(artists)) saveJson('artists.json', artists);
if (ensureIds(categories)) saveJson('categories.json', categories);
if (ensureIds(albums)) saveJson('albums.json', albums);
if (ensureIds(songs)) saveJson('songs.json', songs);

// ⚡ ФУНКЦИЯ ОБНОВЛЕНИЯ ДЛИТЕЛЬНОСТИ ПРИ СТАРТЕ
async function refreshDurations() {
  log('[STARTUP] Checking song durations...');
  let changed = false;
  let updatedCount = 0;

  for (const song of songs) {
    // Пропускаем, если URL пустой
    if (song.url && song.url.trim() !== '') {
      const oldDur = song.duration;
      // Пробуем рассчитать длительность
      const newDur = await getAudioDuration(song.url);

      // Если рассчитали успешно и она отличается от текущей
      if (newDur > 0 && newDur !== oldDur) {
        song.duration = newDur;
        changed = true;
        updatedCount++;
      }
    }
  }

  if (changed) {
    saveJson('songs.json', songs);
    log(`[STARTUP] Updated durations for ${updatedCount} songs. Saved to DB.`);
  } else {
    log('[STARTUP] Durations are up to date.');
  }
}

// ─────────────────────────────────────────────────────────────
// 4. HTML ADMIN UI
// ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  try {
    // Reload data for UI
    const currentAlbums = loadJsonWithDefaults('albums.json', []);
    const currentSongs = loadJsonWithDefaults('songs.json', []);
    const currentCats = loadJsonWithDefaults('categories.json', []);
    const currentArtists = loadJsonWithDefaults('artists.json', []);

    const albumOptions = currentAlbums
      .map((a) => `<option value="${a.id}">${a.title}</option>`)
      .join('');
    const categoryOptions = currentCats
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join('');
    const artistOptions = currentArtists
      .map((a) => `<option value="${a.id}">${a.name}</option>`)
      .join('');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    let html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spotify Admin Panel</title>
  <link rel="shortcut icon" href="/public/logo.png" type="image/png">
  <style>
    :root { --bg: #09090b; --bg-card: #18181b; --border: #27272a; --text: #f4f4f5; --text-muted: #a1a1aa; --accent: #22c55e; --danger: #ef4444; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); font-size: 14px; }
    .topbar { position: sticky; top: 0; z-index: 50; background: rgba(9, 9, 11, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.1rem; }
    .brand img { height: 24px; width: 24px; object-fit: contain; }
    .refresh-btn { color: var(--text-muted); text-decoration: none; }
    .refresh-btn:hover { color: var(--accent); }
    main { max-width: 1400px; margin: 0 auto; padding: 24px; display: grid; grid-template-columns: 350px 1fr; gap: 24px; }
    @media (max-width: 900px) { main { grid-template-columns: 1fr; } }
    .forms-col { display: flex; flex-direction: column; gap: 20px; }
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .card-title { font-weight: 600; font-size: 1rem; }
    .badge { font-size: 0.75rem; background: var(--border); padding: 2px 8px; border-radius: 99px; color: var(--text-muted); }
    label { display: block; margin-bottom: 6px; font-size: 0.8rem; color: var(--text-muted); }
    input, select, textarea { width: 100%; background: #09090b; border: 1px solid var(--border); color: var(--text); padding: 10px; border-radius: 6px; margin-bottom: 12px; outline: none; font-family: inherit; }
    input:focus, select:focus { border-color: var(--accent); }
    .btn { width: 100%; background: var(--text); color: var(--bg); border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn:hover { opacity: 0.9; }
    .data-col { display: flex; flex-direction: column; gap: 24px; }
    .list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .item-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; gap: 12px; }
    .item-thumb { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: #333; }
    .item-color { width: 60px; height: 60px; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: rgba(255,255,255,0.7); }
    .item-content { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
    .item-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
    .item-actions { display: flex; flex-direction: column; gap: 4px; justify-content: center; }
    .btn-sm { padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; border: 1px solid var(--border); background: transparent; color: var(--text-muted); cursor: pointer; }
    .btn-sm:hover { color: var(--text); border-color: var(--text-muted); }
    .btn-sm.danger:hover { color: var(--danger); border-color: var(--danger); }
    .logs { background: #000; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.75rem; color: #33ff00; max-height: 200px; overflow-y: auto; }
    .modal-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; }
    .modal-overlay.open { display: flex; }
    .modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; width: 450px; max-width: 90%; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .modal h2 { margin-top: 0; margin-bottom: 20px; font-size: 1.25rem; }
    .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
    .btn-cancel { background: transparent; border: 1px solid var(--border); color: var(--text); }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand"><img src="/public/logo.png" alt="Logo"><span>Spotify Admin</span></div>
    <a href="/" class="refresh-btn">Refresh Data</a>
  </header>
  <main>
    <section class="forms-col">
      <div class="card">
        <div class="card-header"><span class="card-title">Add Artist</span><span class="badge">Person</span></div>
        <form id="create-artist-form">
          <label>Name</label> <input name="name" required placeholder="Artist Name" />
          <label>Avatar URL</label> <input name="avatar" placeholder="https://..." />
          <label>Bio</label> <input name="bio" placeholder="Short biography" />
          <button type="submit" class="btn">Create Artist</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Add Song</span><span class="badge">MP3</span></div>
        <form id="create-song-form">
          <label>Title</label> <input name="title" required placeholder="Track Name" />
          <label>MP3 Path</label> <input name="url" placeholder="public/music/track.mp3" />
          <label>Cover URL</label> <input name="thumbnail" placeholder="https://..." />
          <label>Artist</label> <select name="artistId"><option value="">-- No Artist Link --</option>${artistOptions}</select>
          <label>Artist Name</label> <input name="description" placeholder="Artist name text" />
          <label>Category</label> <select name="categoryId"><option value="">-- None --</option>${categoryOptions}</select>
          <label>Album</label> <select name="albumId"><option value="">-- None --</option>${albumOptions}</select>
          <button type="submit" class="btn">Create Song</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Add Album</span><span class="badge">Collection</span></div>
        <form id="create-album-form">
          <label>Title</label> <input name="title" required />
          <label>Cover URL</label> <input name="cover" />
          <label>Artist</label> <select name="artistId"><option value="">-- No Artist Link --</option>${artistOptions}</select>
          <label>Description</label> <input name="description" placeholder="EP • 2024" />
          <label>Category</label> <select name="categoryId"><option value="">-- None --</option>${categoryOptions}</select>
          <button type="submit" class="btn">Create Album</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Add Category</span><span class="badge">Genre</span></div>
        <form id="create-category-form">
          <label>Name</label> <input name="name" required />
          <label>Color</label> <input name="color" type="color" value="#22c55e" style="height:40px;padding:2px;" />
          <label>Description</label> <input name="description" placeholder="Optional description" />
          <button type="submit" class="btn">Create Category</button>
        </form>
      </div>
    </section>
    <section class="data-col">
      <div class="card">
        <div class="card-header"><span class="card-title">Artists</span><span class="badge">${currentArtists.length} total</span></div>
        <div class="list-grid">
          ${currentArtists.map((a) => `<div class="item-card"><img src="${a.avatar || DEFAULT_IMAGE}" class="item-thumb" style="border-radius:50%" onerror="this.src='${DEFAULT_IMAGE}'"><div class="item-content"><div class="item-title">${a.name}</div><div class="item-meta">${a.followers || 0} followers</div></div><div class="item-actions"><button class="btn-sm" onclick="openEditArtistModal('${a.id}')">EDIT</button><button class="btn-sm danger" onclick="deleteArtist('${a.id}')">DEL</button></div></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Categories</span><span class="badge">${currentCats.length} total</span></div>
        <div class="list-grid">
          ${currentCats.map((c) => `<div class="item-card"><div class="item-color" style="background-color: ${c.color}">ID</div><div class="item-content"><div class="item-title">${c.name}</div><div class="item-meta">${c.description || c.color}</div></div><div class="item-actions"><button class="btn-sm" onclick="openEditCategoryModal('${c.id}')">EDIT</button><button class="btn-sm danger" onclick="deleteCategory('${c.id}')">DEL</button></div></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Songs</span><span class="badge">${currentSongs.length} total</span></div>
        <div class="list-grid">
          ${currentSongs.map((s) => `<div class="item-card"><img src="${s.thumbnail || DEFAULT_IMAGE}" class="item-thumb" onerror="this.src='${DEFAULT_IMAGE}'"><div class="item-content"><div class="item-title">${s.title}</div><div class="item-meta">${s.artist}<br><small>Dur: ${s.duration}s | ${s.url ? 'Has URL' : 'No URL'}</small></div></div><div class="item-actions"><button class="btn-sm" onclick="openEditSongModal('${s.id}')">EDIT</button><button class="btn-sm danger" onclick="deleteSong('${s.id}')">DEL</button></div></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Albums</span><span class="badge">${currentAlbums.length} total</span></div>
        <div class="list-grid">
          ${currentAlbums.map((a) => `<div class="item-card"><img src="${a.cover || DEFAULT_IMAGE}" class="item-thumb" onerror="this.src='${DEFAULT_IMAGE}'"><div class="item-content"><div class="item-title">${a.title}</div><div class="item-meta">${(a.songs || []).length} tracks</div></div><div class="item-actions"><button class="btn-sm" onclick="openEditAlbumModal('${a.id}')">EDIT</button><button class="btn-sm danger" onclick="deleteAlbum('${a.id}')">DEL</button></div></div>`).join('')}
        </div>
      </div>
      <div class="card"><div class="card-header"><span class="card-title">Logs</span></div><div class="logs">${logs.slice(-10).join('<br>')}</div></div>
    </section>
  </main>
  <div id="edit-artist-modal" class="modal-overlay"><div class="modal"><h2>Edit Artist</h2><form id="edit-artist-form"><input type="hidden" name="id"><label>Name</label><input name="name" required /><label>Avatar</label><input name="avatar" /><label>Bio</label><input name="bio" /><div class="modal-actions"><button type="button" class="btn btn-cancel" onclick="closeModal('edit-artist-modal')">Cancel</button><button type="submit" class="btn">Save</button></div></form></div></div>
  <div id="edit-song-modal" class="modal-overlay"><div class="modal"><h2>Edit Song</h2><form id="edit-song-form"><input type="hidden" name="id"><label>Title</label><input name="title" required /><label>Artist Link</label><select name="artistId"><option value="">-- None --</option>${artistOptions}</select><label>Artist Text</label><input name="description" /><label>Cover URL</label><input name="thumbnail" /><label>MP3 Path</label><input name="url" /><label>Category</label><select name="categoryId"><option value="">-- None --</option>${categoryOptions}</select><div class="modal-actions"><button type="button" class="btn btn-cancel" onclick="closeModal('edit-song-modal')">Cancel</button><button type="submit" class="btn">Save</button></div></form></div></div>
  <div id="edit-album-modal" class="modal-overlay"><div class="modal"><h2>Edit Album</h2><form id="edit-album-form"><input type="hidden" name="id"><label>Title</label><input name="title" required /><label>Description</label><input name="description" /><label>Artist Link</label><select name="artistId"><option value="">-- None --</option>${artistOptions}</select><label>Cover URL</label><input name="cover" /><label>Category</label><select name="categoryId"><option value="">-- None --</option>${categoryOptions}</select><div class="modal-actions"><button type="button" class="btn btn-cancel" onclick="closeModal('edit-album-modal')">Cancel</button><button type="submit" class="btn">Save</button></div></form></div></div>
  <div id="edit-category-modal" class="modal-overlay"><div class="modal"><h2>Edit Category</h2><form id="edit-category-form"><input type="hidden" name="id"><label>Name</label><input name="name" required /><label>Color</label><input name="color" type="color" style="height:40px;" /><label>Description</label><input name="description" /><div class="modal-actions"><button type="button" class="btn btn-cancel" onclick="closeModal('edit-category-modal')">Cancel</button><button type="submit" class="btn">Save</button></div></form></div></div>
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
    document.getElementById('create-artist-form').addEventListener('submit', async (e) => { e.preventDefault(); await api(API + '/artists', 'POST', Object.fromEntries(new FormData(e.target))); location.reload(); });
    document.getElementById('create-song-form').addEventListener('submit', async (e) => { e.preventDefault(); await api(API + '/songs', 'POST', Object.fromEntries(new FormData(e.target))); location.reload(); });
    document.getElementById('create-album-form').addEventListener('submit', async (e) => { e.preventDefault(); await api(API + '/albums', 'POST', Object.fromEntries(new FormData(e.target))); location.reload(); });
    document.getElementById('create-category-form').addEventListener('submit', async (e) => { e.preventDefault(); await api(API + '/categories', 'POST', Object.fromEntries(new FormData(e.target))); location.reload(); });
    async function deleteSong(id) { if(confirm('Delete song?')) { await api(API + '/songs/'+id, 'DELETE'); location.reload(); } }
    async function deleteAlbum(id) { if(confirm('Delete album?')) { await api(API + '/albums/'+id, 'DELETE'); location.reload(); } }
    async function deleteCategory(id) { if(confirm('Delete category?')) { await api(API + '/categories/'+id, 'DELETE'); location.reload(); } }
    async function deleteArtist(id) { if(confirm('Delete artist?')) { await api(API + '/artists/'+id, 'DELETE'); location.reload(); } }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }
    async function openEditArtistModal(id) { const data = await api(API + '/artists/'+id); const item = data.data; if(!item) return; const f=document.getElementById('edit-artist-form'); f.id.value=item.id; f.name.value=item.name; f.avatar.value=item.avatar||''; f.bio.value=item.bio||''; document.getElementById('edit-artist-modal').classList.add('open'); }
    document.getElementById('edit-artist-form').addEventListener('submit', async (e) => { e.preventDefault(); const d=Object.fromEntries(new FormData(e.target)); await api(API + '/artists/'+d.id, 'PUT', d); location.reload(); });
    async function openEditSongModal(id) { const data = await api(API + '/songs'); const item = data.data.find(s=>s.id===id); if(!item) return; const f=document.getElementById('edit-song-form'); f.id.value=item.id; f.title.value=item.title; f.description.value=item.description||''; f.thumbnail.value=item.thumbnail||''; f.url.value=item.url||''; f.categoryId.value=(item.categories&&item.categories[0])||''; f.artistId.value=item.artistId||''; document.getElementById('edit-song-modal').classList.add('open'); }
    document.getElementById('edit-song-form').addEventListener('submit', async (e) => { e.preventDefault(); const d=Object.fromEntries(new FormData(e.target)); await api(API + '/songs/'+d.id, 'PUT', d); location.reload(); });
    async function openEditAlbumModal(id) { const data = await api(API + '/albums/'+id); const item = data.data; if(!item) return; const f=document.getElementById('edit-album-form'); f.id.value=item.id; f.title.value=item.title; f.description.value=item.description||''; f.cover.value=item.cover||''; f.artistId.value=item.artistId||''; f.categoryId.value=(item.categories&&item.categories[0]&&item.categories[0].id)||''; document.getElementById('edit-album-modal').classList.add('open'); }
    document.getElementById('edit-album-form').addEventListener('submit', async (e) => { e.preventDefault(); const d=Object.fromEntries(new FormData(e.target)); await api(API + '/albums/'+d.id, 'PUT', d); location.reload(); });
    async function openEditCategoryModal(id) { const data = await api(API + '/categories'); const item = data.data.find(c=>c.id===id); if(!item) return; const f=document.getElementById('edit-category-form'); f.id.value=item.id; f.name.value=item.name; f.description.value=item.description||''; f.color.value=item.color; document.getElementById('edit-category-modal').classList.add('open'); }
    document.getElementById('edit-category-form').addEventListener('submit', async (e) => { e.preventDefault(); const d=Object.fromEntries(new FormData(e.target)); await api(API + '/categories/'+d.id, 'PUT', d); location.reload(); });
  </script>
</body>
</html>`;
    res.send(html);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ─────────────────────────────────────────────────────────────
// 5. API ROUTES
// ─────────────────────────────────────────────────────────────

// ARTISTS
app.get('/api/artists', (req, res) =>
  res.json({ error: false, data: loadJsonWithDefaults('artists.json', []) }),
);
app.get('/api/artists/:id', (req, res) => {
  const allArtists = loadJsonWithDefaults('artists.json', []);
  const artist = allArtists.find((a) => a.id === req.params.id);
  if (!artist)
    return res.status(404).json({ error: true, message: 'Artist not found' });

  const allSongs = loadJsonWithDefaults('songs.json', []);
  const allAlbums = loadJsonWithDefaults('albums.json', []);

  // Top Tracks (limit 10)
  const topTracks = allSongs
    .filter((s) => s.artistId === artist.id)
    .slice(0, 10);
  // Albums (add thumbnail field)
  const artistAlbums = allAlbums
    .filter((a) => a.artistId === artist.id)
    .map((a) => ({ ...a, thumbnail: a.cover, songs: [] }));

  const responseData = { ...artist, topTracks, albums: artistAlbums };
  res.json({ error: false, data: responseData });
});
app.get('/api/artists/:id/top-tracks', (req, res) => {
  const allSongs = loadJsonWithDefaults('songs.json', []);
  const tracks = allSongs.filter((s) => s.artistId === req.params.id);
  res.json(tracks);
});
app.get('/api/artists/:id/albums', (req, res) => {
  const allAlbums = loadJsonWithDefaults('albums.json', []);
  const artistAlbums = allAlbums.filter((a) => a.artistId === req.params.id);
  res.json(artistAlbums);
});
app.post('/api/artists', (req, res) => {
  try {
    const allArtists = loadJsonWithDefaults('artists.json', []);
    const newItem = { id: generateId(), ...req.body, followers: 0 };
    allArtists.push(newItem);
    saveJson('artists.json', allArtists);
    res.json({ error: false, data: newItem });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});
app.put('/api/artists/:id', (req, res) => {
  try {
    const allArtists = loadJsonWithDefaults('artists.json', []);
    const artist = allArtists.find((a) => a.id === req.params.id);
    if (!artist) return res.status(404).json({ error: true });
    Object.assign(artist, req.body);
    saveJson('artists.json', allArtists);
    res.json({ error: false, data: artist });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});
app.delete('/api/artists/:id', (req, res) => {
  try {
    const allArtists = loadJsonWithDefaults('artists.json', []);
    const idx = allArtists.findIndex((a) => a.id === req.params.id);
    if (idx !== -1) {
      allArtists.splice(idx, 1);
      saveJson('artists.json', allArtists);

      // Unlink from songs
      const allSongs = loadJsonWithDefaults('songs.json', []);
      let sCh = false;
      allSongs.forEach((s) => {
        if (s.artistId === req.params.id) {
          s.artistId = null;
          sCh = true;
        }
      });
      if (sCh) saveJson('songs.json', allSongs);

      // Unlink from albums
      const allAlbums = loadJsonWithDefaults('albums.json', []);
      let aCh = false;
      allAlbums.forEach((a) => {
        if (a.artistId === req.params.id) {
          a.artistId = null;
          aCh = true;
        }
      });
      if (aCh) saveJson('albums.json', allAlbums);
    }
    res.json({ error: false });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});

// CATEGORIES
app.get('/api/categories', (req, res) =>
  res.json({ error: false, data: loadJsonWithDefaults('categories.json', []) }),
);
app.post('/api/categories', (req, res) => {
  try {
    const cats = loadJsonWithDefaults('categories.json', []);
    const newItem = {
      id: generateId(),
      name: req.body.name,
      color: req.body.color || '#22c55e',
      description: req.body.description || '',
    };
    cats.push(newItem);
    saveJson('categories.json', cats);
    res.json({ error: false, data: newItem });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});
app.put('/api/categories/:id', (req, res) => {
  try {
    const cats = loadJsonWithDefaults('categories.json', []);
    const cat = cats.find((c) => c.id === req.params.id);
    if (!cat)
      return res.status(404).json({ error: true, message: 'Not found' });
    Object.assign(cat, req.body);
    saveJson('categories.json', cats);
    res.json({ error: false, data: cat });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});
app.delete('/api/categories/:id', (req, res) => {
  try {
    const cats = loadJsonWithDefaults('categories.json', []);
    const idx = cats.findIndex((c) => c.id === req.params.id);
    if (idx !== -1) {
      cats.splice(idx, 1);
      saveJson('categories.json', cats);
    }
    res.json({ error: false });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});

// SEARCH
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  const allSongs = loadJsonWithDefaults('songs.json', []);
  const allAlbums = loadJsonWithDefaults('albums.json', []);
  const allCats = loadJsonWithDefaults('categories.json', []);
  const allArtists = loadJsonWithDefaults('artists.json', []);

  const richAlbums = allAlbums.map((a) => ({
    ...a,
    categories: (a.categories || [])
      .map((cid) => allCats.find((c) => c.id === cid))
      .filter(Boolean),
    songs: (a.songs || [])
      .map((id) => {
        const s = allSongs.find((x) => x.id === id);
        return s ? { ...s, thumbnail: s.thumbnail || a.cover } : null;
      })
      .filter(Boolean),
  }));

  const allTracks = richAlbums.flatMap((a) =>
    a.songs.map((s) => ({ ...s, albumId: a.id })),
  );

  if (!q) {
    return res.json({
      error: false,
      data: {
        albums: richAlbums,
        tracks: allTracks,
        categories: allCats,
        artists: allArtists,
      },
    });
  }

  const fAlbums = richAlbums.filter((a) => a.title.toLowerCase().includes(q));
  const fTracks = allTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      (t.artist && t.artist.toLowerCase().includes(q)),
  );
  const fCats = allCats.filter((c) => c.name.toLowerCase().includes(q));
  const fArtists = allArtists.filter((a) => a.name.toLowerCase().includes(q));

  res.json({
    error: false,
    data: {
      albums: fAlbums,
      tracks: fTracks,
      categories: fCats,
      artists: fArtists,
    },
  });
});

// SONGS
app.get('/api/songs', (req, res) =>
  res.json({ error: false, data: loadJsonWithDefaults('songs.json', []) }),
);
app.post('/api/songs', async (req, res) => {
  try {
    const allSongs = loadJsonWithDefaults('songs.json', []);
    const {
      title,
      description,
      thumbnail,
      url,
      albumId,
      categoryId,
      artistId,
    } = req.body;
    const duration = await getAudioDuration(url);

    // Auto-fill artist name
    let artistName = description;
    if (artistId) {
      const allArtists = loadJsonWithDefaults('artists.json', []);
      const a = allArtists.find((ar) => ar.id === artistId);
      if (a) artistName = a.name;
    }

    const newSong = {
      id: generateId(),
      title,
      description: artistName,
      artist: artistName,
      artistId,
      thumbnail,
      url,
      duration,
      categories: categoryId ? [categoryId] : [],
    };
    allSongs.push(newSong);
    saveJson('songs.json', allSongs);

    if (albumId) {
      const allAlbums = loadJsonWithDefaults('albums.json', []);
      const album = allAlbums.find((a) => a.id === albumId);
      if (album) {
        album.songs = album.songs || [];
        album.songs.push(newSong.id);
        saveJson('albums.json', allAlbums);
      }
    }
    res.json({ error: false, data: newSong });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});
app.put('/api/songs/:id', async (req, res) => {
  try {
    const allSongs = loadJsonWithDefaults('songs.json', []);
    const song = allSongs.find((s) => s.id === req.params.id);
    if (!song)
      return res.status(404).json({ error: true, message: 'Not found' });

    Object.assign(song, req.body);
    if (req.body.categoryId) song.categories = [req.body.categoryId];

    // Recalculate duration if URL changed
    if (req.body.url && req.body.url !== song.url) {
      song.duration = await getAudioDuration(req.body.url);
    }
    saveJson('songs.json', allSongs);
    res.json({ error: false, data: song });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});
app.delete('/api/songs/:id', (req, res) => {
  const allSongs = loadJsonWithDefaults('songs.json', []);
  const idx = allSongs.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: true });
  allSongs.splice(idx, 1);
  saveJson('songs.json', allSongs);
  res.json({ error: false });
});

// ALBUMS
app.get('/api/albums', (req, res) => {
  const allAlbums = loadJsonWithDefaults('albums.json', []);
  const allSongs = loadJsonWithDefaults('songs.json', []);
  const allCats = loadJsonWithDefaults('categories.json', []);
  const data = allAlbums.map((a) => ({
    ...a,
    thumbnail: a.cover, // Add thumbnail field for front-end
    categories: (a.categories || [])
      .map((cid) => allCats.find((c) => c.id === cid))
      .filter(Boolean),
    songs: (a.songs || [])
      .map((id) => allSongs.find((s) => s.id === id))
      .filter(Boolean),
  }));
  res.json({ error: false, data });
});
app.get('/api/albums/:id', (req, res) => {
  const allAlbums = loadJsonWithDefaults('albums.json', []);
  const allSongs = loadJsonWithDefaults('songs.json', []);
  const allCats = loadJsonWithDefaults('categories.json', []);
  const a = allAlbums.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: true });

  const enriched = {
    ...a,
    thumbnail: a.cover,
    categories: (a.categories || [])
      .map((cid) => allCats.find((c) => c.id === cid))
      .filter(Boolean),
    songs: (a.songs || [])
      .map((id) => {
        const s = allSongs.find((x) => x.id === id);
        return s ? { ...s, thumbnail: s.thumbnail || a.cover } : null;
      })
      .filter(Boolean),
  };
  res.json({ error: false, data: enriched });
});
app.post('/api/albums', (req, res) => {
  const allAlbums = loadJsonWithDefaults('albums.json', []);
  const { title, description, cover, songs, categoryId, artistId } = req.body;
  const newAlbum = {
    id: generateId(),
    title,
    description,
    cover,
    artistId,
    songs: songs ? songs.split(',').map((s) => s.trim()) : [],
    categories: categoryId ? [categoryId] : [],
  };
  allAlbums.push(newAlbum);
  saveJson('albums.json', allAlbums);
  res.json({ error: false, data: newAlbum });
});
app.put('/api/albums/:id', (req, res) => {
  const allAlbums = loadJsonWithDefaults('albums.json', []);
  const a = allAlbums.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: true });
  Object.assign(a, req.body);
  if (req.body.categoryId) a.categories = [req.body.categoryId];
  saveJson('albums.json', allAlbums);
  res.json({ error: false, data: a });
});
app.delete('/api/albums/:id', (req, res) => {
  const allAlbums = loadJsonWithDefaults('albums.json', []);
  const idx = allAlbums.findIndex((x) => x.id === req.params.id);
  if (idx !== -1) allAlbums.splice(idx, 1);
  saveJson('albums.json', allAlbums);
  res.json({ error: false });
});

// ─────────────────────────────────────────────────────────────
// START SERVER + REFRESH DURATIONS
// ─────────────────────────────────────────────────────────────
app.listen(3000, async () => {
  log('SERVER RUNNING ON PORT 3000');
  // Refresh durations on startup
  await refreshDurations();
});
