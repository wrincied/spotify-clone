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

// ───── MOCK CATEGORIES (начальные данные, пишем в JSON если его нет) ─────
const mockCategories = [
  { id: 'cat01', name: 'Pop', color: '#ff4d4d' },
  { id: 'cat02', name: 'Hip-Hop', color: '#4d79ff' },
  { id: 'cat03', name: 'R&B', color: '#a64dff' },
  { id: 'cat04', name: 'Indie', color: '#4dffa6' },
  { id: 'cat05', name: 'Lo-Fi', color: '#ffaa4d' }
];

// ───── JSON HELPERS ─────
const dbPath = (file) => path.join(__dirname, 'db', file);

const loadJsonRaw = (file) =>
  JSON.parse(fs.readFileSync(dbPath(file), 'utf8'));

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

  // Если файла нет — создаём его из mockCategories
  if (!fs.existsSync(dbPath(file))) {
    saveJson(file, mockCategories);
    log('[INIT] categories.json created from mockCategories');
  }

  let categories = loadJsonRaw(file);

  if (!Array.isArray(categories)) {
    categories = [];
  }

  if (ensureIds(categories)) {
    saveJson(file, categories);
    log('[AUTO] Category IDs generated');
  }

  return categories;
};


// ───────────────────────────
// HTML ADMIN (root) — аккуратная тёмная панель
// ───────────────────────────
app.get('/', (req, res) => {
  try {
    const albums = loadAlbums();
    const songs = loadSongs();
    const categories = loadCategories();

    const findSong = (id) =>
      songs.find((s) => String(s.id) === String(id));

    let html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Spotify Clone Backend Admin</title>
  <style>
    :root {
      --bg: #020617;
      --bg-elevated: #050816;
      --bg-soft: #0b1020;
      --border-subtle: #1f2937;
      --accent: #22c55e;
      --accent-soft: rgba(34, 197, 94, 0.12);
      --danger: #ef4444;
      --danger-soft: rgba(239, 68, 68, 0.14);
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --radius-lg: 14px;
      --radius-sm: 8px;
      --shadow-soft: 0 18px 45px rgba(15, 23, 42, 0.85);
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top, #111827 0, #020617 45%, #000000 100%);
      color: var(--text-main);
      min-height: 100vh;
    }

    body {
      display: flex;
      flex-direction: column;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      backdrop-filter: blur(16px);
      background: linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.98));
      border-bottom: 1px solid rgba(148, 163, 184, 0.16);
      padding: 16px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .topbar-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      letter-spacing: 0.03em;
    }

    .topbar-badge {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 3px 7px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      color: var(--text-muted);
    }

    .topbar-nav {
      display: flex;
      gap: 12px;
      font-size: 13px;
    }

    .topbar-link {
      padding: 6px 11px;
      border-radius: 999px;
      color: var(--text-muted);
      text-decoration: none;
      border: 1px solid transparent;
      transition: all 0.18s ease;
    }

    .topbar-link:hover {
      color: var(--text-main);
      border-color: rgba(148, 163, 184, 0.45);
      background: radial-gradient(circle at top, rgba(34, 197, 94, 0.12), transparent 60%);
    }

    main.layout {
      padding: 24px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto 40px auto;
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.4fr);
      gap: 24px;
    }

    @media (max-width: 960px) {
      main.layout {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .section-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .section-sub {
      font-size: 12px;
      color: var(--text-muted);
    }

    .pill {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      color: var(--text-muted);
    }

    .card {
      border-radius: var(--radius-lg);
      background: radial-gradient(circle at top left, rgba(34, 197, 94, 0.08), transparent 55%), var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-soft);
      padding: 16px 16px 14px 16px;
    }

    .card-muted {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(30, 64, 175, 0.5);
    }

    .card-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
    }

    .card-caption {
      font-size: 12px;
      color: var(--text-muted);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 6px;
    }

    label {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    input, textarea {
      border-radius: var(--radius-sm);
      border: 1px solid rgba(55, 65, 81, 0.95);
      background: rgba(15, 23, 42, 0.95);
      color: var(--text-main);
      font-size: 13px;
      padding: 7px 9px;
      outline: none;
      transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
    }

    input::placeholder, textarea::placeholder {
      color: rgba(156, 163, 175, 0.8);
    }

    input:focus, textarea:focus {
      border-color: rgba(34, 197, 94, 0.8);
      box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.5);
      background: #020617;
    }

    textarea {
      resize: vertical;
      min-height: 58px;
      max-height: 180px;
    }

    .field-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .field-row > * {
      flex: 1;
    }

    .color-picker-input {
      padding: 0;
      width: 38px;
      min-width: 38px;
      max-width: 38px;
      height: 32px;
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.65);
      background: transparent;
    }

    .btn {
      cursor: pointer;
      border-radius: 999px;
      border: 1px solid transparent;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      background: var(--accent);
      color: #020617;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.16s ease, transform 0.06s ease, box-shadow 0.16s ease, border-color 0.16s ease;
      box-shadow: 0 10px 25px rgba(34, 197, 94, 0.45);
    }

    .btn:hover {
      background: #16a34a;
      box-shadow: 0 18px 35px rgba(22, 163, 74, 0.55);
      transform: translateY(-1px);
    }

    .btn:active {
      transform: translateY(0);
      box-shadow: 0 6px 16px rgba(22, 163, 74, 0.5);
    }

    .btn-secondary {
      background: rgba(15, 23, 42, 0.9);
      color: var(--text-main);
      border-color: rgba(148, 163, 184, 0.5);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.6);
    }

    .btn-secondary:hover {
      background: rgba(15, 23, 42, 1);
      border-color: rgba(148, 163, 184, 0.9);
    }

    .btn-danger {
      background: var(--danger-soft);
      color: #fecaca;
      border-color: rgba(248, 113, 113, 0.6);
      box-shadow: 0 8px 20px rgba(127, 29, 29, 0.7);
    }

    .btn-danger:hover {
      background: rgba(127, 29, 29, 0.85);
      color: #fee2e2;
    }

    .grid-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }

    .item-card {
      border-radius: var(--radius-lg);
      background: var(--bg-soft);
      border: 1px solid rgba(55, 65, 81, 0.9);
      padding: 10px 11px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item-row {
      display: flex;
      gap: 10px;
    }

    .thumb {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      object-fit: cover;
      background: #020617;
      border: 1px solid rgba(31, 41, 55, 0.9);
    }

    .item-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-title {
      font-size: 13px;
      font-weight: 500;
    }

    .item-meta {
      font-size: 11px;
      color: var(--text-muted);
    }

    .badge-id {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.5);
      color: var(--text-muted);
      display: inline-block;
      margin-top: 2px;
    }

    .tag {
      font-size: 11px;
      border-radius: 999px;
      padding: 2px 7px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(55, 65, 81, 0.9);
      color: var(--text-muted);
      display: inline-block;
    }

    .item-actions {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }

    .item-actions .btn {
      flex: 1;
      padding-inline: 10px;
      font-size: 10px;
      letter-spacing: 0.09em;
      text-transform: uppercase;
    }

    .song-list {
      margin-top: 4px;
      padding-left: 12px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .song-list li {
      margin-bottom: 2px;
    }

    .cat-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(55, 65, 81, 0.95);
      font-size: 11px;
      color: var(--text-muted);
    }

    .cat-swatch {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.95);
      box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.7);
    }

    .logs-card {
      margin-top: 10px;
      font-size: 11px;
      color: var(--text-muted);
      background: rgba(2, 6, 23, 0.9);
      border-radius: var(--radius-lg);
      border: 1px solid rgba(31, 41, 55, 0.9);
      padding: 10px 12px;
      max-height: 180px;
      overflow: auto;
    }

    .logs-card pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-title">
      <span>Spotify Clone Backend</span>
      <span class="topbar-badge">Admin</span>
    </div>
    <nav class="topbar-nav">
      <a href="#forms" class="topbar-link">Forms</a>
      <a href="#albums" class="topbar-link">Albums</a>
      <a href="#songs" class="topbar-link">Songs</a>
      <a href="#categories" class="topbar-link">Categories</a>
      <a href="#logs" class="topbar-link">Logs</a>
    </nav>
  </header>

  <main class="layout">

    <!-- ЛЕВАЯ КОЛОНКА: формы -->
    <section class="column" id="forms">
      <div class="section-title-row">
        <div>
          <div class="section-title">Create & Edit</div>
          <div class="section-sub">Управление сущностями: песни, альбомы и категории</div>
        </div>
      </div>

      <!-- SONG FORM -->
      <article class="card card-muted">
        <div class="card-header">
          <div>
            <div class="card-title">Create song</div>
            <div class="card-caption">Быстрое добавление трека с базовыми полями</div>
          </div>
          <span class="pill">Song</span>
        </div>

        <form id="create-song-form">
          <label>
            Title
            <input name="title" required placeholder="Song title" />
          </label>
          <label>
            Description
            <input name="description" placeholder="Optional description" />
          </label>
          <label>
            Thumbnail URL
            <input name="thumbnail" placeholder="https://…" />
          </label>
          <button type="submit" class="btn">
            <span>Create song</span>
          </button>
        </form>
      </article>

      <!-- ALBUM FORM -->
      <article class="card card-muted">
        <div class="card-header">
          <div>
            <div class="card-title">Create album</div>
            <div class="card-caption">Связывает существующие песни в альбом</div>
          </div>
          <span class="pill">Album</span>
        </div>

        <form id="create-album-form">
          <label>
            Title
            <input name="title" required placeholder="Album title" />
          </label>
          <label>
            Description
            <input name="description" placeholder="Album description" />
          </label>
          <label>
            Cover URL
            <input name="cover" placeholder="https://…" />
          </label>
          <label>
            Song IDs (comma-separated)
            <input name="songs" placeholder="id1,id2,id3" />
          </label>
          <button type="submit" class="btn">
            <span>Create album</span>
          </button>
        </form>
      </article>

      <!-- CATEGORY FORM -->
      <article class="card card-muted">
        <div class="card-header">
          <div>
            <div class="card-title">Create category</div>
            <div class="card-caption">Категории для группировки альбомов, треков, плейлистов</div>
          </div>
          <span class="pill">Category</span>
        </div>

        <form id="create-category-form">
          <label>
            Name
            <input name="name" required placeholder="Chill, Focus, Workout…" />
          </label>
          <label>
            Color
            <div class="field-row">
              <input
                id="category-color-hex"
                name="color"
                placeholder="#22c55e"
                value="#22c55e"
              />
              <input
                id="category-color-picker"
                type="color"
                class="color-picker-input"
                value="#22c55e"
              />
            </div>
          </label>
          <button type="submit" class="btn">
            <span>Create category</span>
          </button>
        </form>
      </article>
    </section>

    <!-- ПРАВАЯ КОЛОНКА: списки -->
    <section class="column">

      <!-- ALBUMS -->
      <section id="albums">
        <div class="section-title-row">
          <div>
            <div class="section-title">Albums</div>
            <div class="section-sub">С существующими треками по ID</div>
          </div>
          <span class="pill">${albums.length} total</span>
        </div>

        <div class="grid-list">
    `;

    // альбомы
    albums.forEach((album) => {
      const cover = album.cover && album.cover.trim()
        ? album.cover.trim()
        : DEFAULT_IMAGE;

      html += `
          <article class="item-card">
            <div class="item-row">
              <img src="${cover}" class="thumb" onerror="this.src='${DEFAULT_IMAGE}'" />
              <div class="item-main">
                <div class="item-title">${album.title || DEFAULT_TITLE}</div>
                <div class="item-meta">${album.description || DEFAULT_DES}</div>
                <span class="badge-id">ID: ${album.id}</span>
              </div>
            </div>
            <ul class="song-list">
              ${(album.songs || [])
                .map((sid) => {
                  const s = findSong(sid);
                  if (!s) return `<li>Missing song: ${sid}</li>`;
                  return `<li>${s.title} <span style="opacity:.7">(${s.id})</span></li>`;
                })
                .join('')}
            </ul>
            <div class="item-actions">
              <button class="btn btn-secondary" onclick="editAlbum('${album.id}')">Edit</button>
              <button class="btn btn-danger" onclick="deleteAlbum('${album.id}')">Delete</button>
            </div>
          </article>
      `;
    });

    html += `
        </div>
      </section>

      <!-- SONGS -->
      <section id="songs" style="margin-top:20px;">
        <div class="section-title-row">
          <div>
            <div class="section-title">Songs</div>
            <div class="section-sub">Все треки из базы</div>
          </div>
          <span class="pill">${songs.length} total</span>
        </div>

        <div class="grid-list">
    `;

    songs.forEach((s) => {
      const thumb = s.thumbnail && s.thumbnail.trim()
        ? s.thumbnail.trim()
        : DEFAULT_IMAGE;
      html += `
          <article class="item-card">
            <div class="item-row">
              <img src="${thumb}" class="thumb" onerror="this.src='${DEFAULT_IMAGE}'" />
              <div class="item-main">
                <div class="item-title">${s.title}</div>
                <div class="item-meta">${s.description || DEFAULT_DES}</div>
                <span class="badge-id">ID: ${s.id}</span>
              </div>
            </div>
            <div class="item-actions">
              <button class="btn btn-secondary" onclick="editSong('${s.id}')">Edit</button>
              <button class="btn btn-danger" onclick="deleteSong('${s.id}')">Delete</button>
            </div>
          </article>
      `;
    });

    html += `
        </div>
      </section>

      <!-- CATEGORIES -->
      <section id="categories" style="margin-top:20px;">
        <div class="section-title-row">
          <div>
            <div class="section-title">Categories</div>
            <div class="section-sub">Список категорий из categories.json</div>
          </div>
          <span class="pill">${categories.length} total</span>
        </div>

        <div class="grid-list">
    `;

    categories.forEach((c) => {
      const color = c.color || '#22c55e';
      html += `
          <article class="item-card">
            <div class="item-row">
              <div class="item-main">
                <div class="item-title">${c.name}</div>
                <div class="item-meta">
                  <span class="cat-chip">
                    <span class="cat-swatch" style="background:${color};"></span>
                    <span>${color}</span>
                  </span>
                </div>
                <span class="badge-id">ID: ${c.id}</span>
              </div>
            </div>
            <div class="item-actions">
              <button class="btn btn-secondary" onclick="editCategory('${c.id}')">Edit</button>
              <button class="btn btn-danger" onclick="deleteCategory('${c.id}')">Delete</button>
            </div>
          </article>
      `;
    });

    html += `
        </div>
      </section>

      <!-- LOGS -->
      <section id="logs">
        <div class="section-title-row" style="margin-top:20px;">
          <div>
            <div class="section-title">Logs</div>
            <div class="section-sub">Последние события сервера</div>
          </div>
        </div>
        <div class="logs-card">
          <pre>${logs.join('\n')}</pre>
        </div>
      </section>

    </section>
  </main>

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

    // SYNC COLOR PICKER <-> HEX INPUT
    (function initCategoryColorSync() {
      const hexInput = document.getElementById('category-color-hex');
      const picker = document.getElementById('category-color-picker');
      if (!hexInput || !picker) return;

      picker.addEventListener('input', (e) => {
        hexInput.value = e.target.value;
      });

      hexInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
        if (hexRegex.test(value)) {
          picker.value = value;
        }
      });
    })();

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

    // Создание категории
    document.getElementById('create-category-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const name = form.name.value;
      const color = form.color.value || '#22c55e';
      await api('/api/categories', 'POST', { name, color });
      location.reload();
    });

    // SONG actions
    async function deleteSong(id) {
      if (!confirm('Delete song ' + id + '?')) return;
      await api('/api/songs/' + id, 'DELETE');
      location.reload();
    }

    async function editSong(id) {
      const current = await api('/api/songs/' + id, 'GET');
      const song = current.data || current;
      const title = prompt('New title (leave empty to keep)', song.title || '');
      const description = prompt('New description (leave empty to keep)', song.description || '');
      const thumbnail = prompt('New thumbnail URL (leave empty to keep)', song.thumbnail || '');
      await api('/api/songs/' + id, 'PUT', { title, description, thumbnail });
      location.reload();
    }

    // ALBUM actions
    async function deleteAlbum(id) {
      if (!confirm('Delete album ' + id + '?')) return;
      await api('/api/albums/' + id, 'DELETE');
      location.reload();
    }

    async function editAlbum(id) {
      const current = await api('/api/albums/' + id, 'GET');
      const album = current.data || current;
      const title = prompt('New album title (leave empty to keep)', album.title || '');
      const description = prompt('New description (leave empty to keep)', album.description || '');
      const cover = prompt('New cover URL (leave empty to keep)', album.cover || '');
      const songsStr = prompt(
        'New song IDs comma-separated (leave empty to keep)',
        (album.songs || []).map(s => s.id || s).join(',')
      );
      const body = { title, description, cover };
      if (songsStr && songsStr.trim().length > 0) {
        body.songs = songsStr.split(',').map(s => s.trim()).filter(Boolean);
      }
      await api('/api/albums/' + id, 'PUT', body);
      location.reload();
    }

    // CATEGORY actions
    async function deleteCategory(id) {
      if (!confirm('Delete category ' + id + '?')) return;
      await api('/api/categories/' + id, 'DELETE');
      location.reload();
    }

    async function editCategory(id) {
      const current = await api('/api/categories/' + id, 'GET');
      const cat = current.data || current;
      const name = prompt('New category name (leave empty to keep)', cat.name || '');
      const color = prompt('New HEX color (leave empty to keep)', cat.color || '#22c55e');
      await api('/api/categories/' + id, 'PUT', { name, color });
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

// ───────────────────────────
// API: CATEGORIES (JSON + CRUD)
// ───────────────────────────
app.get('/api/categories', (req, res) => {
  try {
    const categories = loadCategories();
    res.json({ error: false, data: categories });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

app.get('/api/categories/:id', (req, res) => {
  try {
    const categories = loadCategories();
    const cat = categories.find((c) => String(c.id) === req.params.id);
    if (!cat) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }
    res.json({ error: false, data: cat });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const categories = loadCategories();
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: true, message: 'Category name is required' });
    }

    const newCategory = {
      id: generateId(),
      name: name.trim(),
      color: (color || '#22c55e').trim()
    };

    categories.push(newCategory);
    saveJson('categories.json', categories);
    log(`[API] Created new category: ${newCategory.id}`);

    res.json({ error: false, data: newCategory });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const categories = loadCategories();
    const idx = categories.findIndex((c) => String(c.id) === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }

    const { name, color } = req.body;
    if (name && name.trim()) categories[idx].name = name.trim();
    if (color && color.trim()) categories[idx].color = color.trim();

    saveJson('categories.json', categories);
    log(`[API] Updated category: ${categories[idx].id}`);

    res.json({ error: false, data: categories[idx] });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    const categories = loadCategories();
    const idx = categories.findIndex((c) => String(c.id) === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }

    const [removed] = categories.splice(idx, 1);
    saveJson('categories.json', categories);
    log(`[API] Deleted category: ${removed.id}`);

    res.json({ error: false, data: removed });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ───────────────────────────
// API: SEARCH (альбомы + треки + категории из JSON)
// ───────────────────────────
app.get('/api/search', (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    const songs = loadSongs();
    const albumsRaw = loadAlbums();
    const categories = loadCategories();

    // обогащаем альбомы объектами песен, как в /api/albums
    const albums = albumsRaw.map((album) => {
      const cover =
        album.cover && album.cover.trim()
          ? album.cover.trim()
          : DEFAULT_IMAGE;

      const songObjects = (album.songs || [])
        .map((sid) => {
          const s = songs.find((song) => String(song.id) === String(sid));
          if (!s) return null;
          if (!s.thumbnail || !s.thumbnail.trim()) {
            s.thumbnail = cover;
          }
          return s;
        })
        .filter(Boolean);

      return { ...album, cover, songs: songObjects };
    });

    const allTracks = albums.flatMap((album) =>
      (album.songs || []).map((song) => ({
        ...song,
        albumId: album.id,
        cover: album.cover || DEFAULT_IMAGE
      }))
    );

    // пустой запрос — вернуть всё
    if (!q) {
      return res.json({
        error: false,
        data: {
          albums,
          tracks: allTracks,
          categories
        }
      });
    }

    const albumsMatched = albums.filter(
      (a) =>
        (a.title || '').toString().toLowerCase().includes(q) ||
        (a.description || '').toString().toLowerCase().includes(q)
    );

    const tracksMatched = allTracks.filter(
      (t) =>
        (t.title || '').toString().toLowerCase().includes(q) ||
        (t.artist || '').toString().toLowerCase().includes(q)
    );

    const categoriesMatched = categories.filter((c) =>
      (c.name || '').toString().toLowerCase().includes(q)
    );

    res.json({
      error: false,
      data: {
        albums: albumsMatched,
        tracks: tracksMatched.slice(0, 50),
        categories: categoriesMatched
      }
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ───────────────────────────
// API: SONGS
// ───────────────────────────

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

// удалить песню
app.delete('/api/songs/:id', (req, res) => {
  try {
    const songs = loadSongs();
    const albums = loadAlbums();
    const id = req.params.id;

    const idx = songs.findIndex((s) => String(s.id) === id);
    if (idx === -1) return res.status(404).json({ error: true, message: 'Song not found' });

    const [removed] = songs.splice(idx, 1);
    saveJson('songs.json', songs);

    // убрать песню из альбомов
    albums.forEach(album => {
      album.songs = (album.songs || []).filter(sid => String(sid) !== id);
    });
    saveJson('albums.json', albums);

    log(`[API] Deleted song: ${removed.id}`);
    res.json({ error: false, data: removed });

  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ───────────────────────────
// API: ALBUMS
// ───────────────────────────

// все альбомы
app.get('/api/albums', (req, res) => {
  try {
    const albums = loadAlbums();
    const songs = loadSongs();

    const result = albums.map(album => {
      const cover =
        album.cover && album.cover.trim()
          ? album.cover.trim()
          : DEFAULT_IMAGE;

      const songObjects = (album.songs || [])
        .map(sid => {
          const s = songs.find(s => String(s.id) === String(sid));
          if (!s) return null;
          if (!s.thumbnail || !s.thumbnail.trim()) {
            s.thumbnail = cover;
          }
          return s;
        })
        .filter(Boolean);

      return { ...album, songs: songObjects };
    });

    res.json({ error: false, data: result });

  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// один альбом
app.get('/api/albums/:id', (req, res) => {
  try {
    const albums = loadAlbums();
    const songs = loadSongs();

    const album = albums.find(a => String(a.id) === req.params.id);
    if (!album) {
      return res.status(404).json({ error: true, message: 'Album not found' });
    }

    const cover = album.cover?.trim() || DEFAULT_IMAGE;

    const songObjects = (album.songs || [])
      .map(sid => {
        const s = songs.find(s => String(s.id) === String(sid));
        if (!s) return null;
        if (!s.thumbnail?.trim()) s.thumbnail = cover;
        return s;
      })
      .filter(Boolean);

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
      songs: songs.map(s => String(s).trim())
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
    const album = albums.find(a => String(a.id) === req.params.id);
    if (!album) return res.status(404).json({ error: true, message: 'Album not found' });

    const { title, description, cover, songs } = req.body;

    if (title?.trim()) album.title = title.trim();
    if (description !== undefined) album.description = (description || '').trim();
    if (cover !== undefined) album.cover = (cover || '').trim();
    if (Array.isArray(songs)) {
      album.songs = songs.map(s => String(s).trim());
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
    const idx = albums.findIndex(a => String(a.id) === req.params.id);

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
