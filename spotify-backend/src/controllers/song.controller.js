import { loadJson, saveJson, generateId } from '../utils/db.js';
import * as mm from 'music-metadata';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; // 1. Импортируем это

// 2. Создаем __dirname вручную для ES Modules [cite: 2025-12-14]
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SongsController = {
  // Получение всех песен
  getAll: (req, res) => {
    try {
      const data = loadJson('songs.json');
      // Сортируем: сначала новые
      const sorted = (data || []).reverse();
      res.json({ error: false, data: sorted });
    } catch (e) {
      res.status(500).json({ error: true, message: 'Db error' });
    }
  },

  // Создание песни (с авто-расчетом длительности)
  create: async (req, res) => {
    try {
      const songs = loadJson('songs.json');
      const albums = loadJson('albums.json');

      let duration = 0;
      let url = '';

      // 1. Если есть файл, читаем его метаданные
      if (req.file) {
        try {
          const metadata = await mm.parseFile(req.file.path);
          duration = Math.round(metadata.format.duration || 0);
          url = `public/music/${req.file.filename}`;
        } catch (err) {
          console.error('[Metadata Error]', err.message);
        }
      } else if (req.body.url) {
        url = req.body.url;
      }

      const newSong = {
        id: generateId(),
        title: req.body.title || req.body.name || 'New Track',
        artist: req.body.artist || 'Unknown Artist',
        albumId: req.body.albumId || null,
        artistId: req.body.artistId || null,
        categoryId: req.body.categoryId || null,
        thumbnail: req.body.thumbnail || '',
        description: req.body.description || '',
        url: url,
        duration: duration,
        playCount: 0,
        createdAt: new Date().toISOString(),
      };

      // 2. Синхронизация с альбомом
      if (newSong.albumId) {
        const albumIndex = albums.findIndex((a) => a.id === newSong.albumId);
        if (albumIndex !== -1) {
          if (!albums[albumIndex].songs) albums[albumIndex].songs = [];
          albums[albumIndex].songs.push(newSong.id);
          saveJson('albums.json', albums);
        }
      }

      songs.push(newSong);
      saveJson('songs.json', songs);

      res.status(201).json({ error: false, data: newSong });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: true, message: e.message });
    }
  },

  // Обновление песни
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const songs = loadJson('songs.json');
      const albums = loadJson('albums.json');

      const index = songs.findIndex((s) => s.id === id);
      if (index === -1) {
        return res.status(404).json({ error: true, message: 'Song not found' });
      }

      const oldSong = songs[index];
      let updatedFields = { ...req.body };

      // 1. Если загружен НОВЫЙ файл — пересчитываем длительность
      if (req.file) {
        try {
          const metadata = await mm.parseFile(req.file.path);
          updatedFields.duration = Math.round(metadata.format.duration || 0);
          updatedFields.url = `public/music/${req.file.filename}`;
        } catch (err) {
          console.error('[Metadata Error]', err.message);
        }
      }

      // 2. Логика переноса между альбомами
      const oldAlbumId = oldSong.albumId;
      const newAlbumId = updatedFields.albumId;

      if (newAlbumId !== undefined && newAlbumId !== oldAlbumId) {
        if (oldAlbumId) {
          const oldAlbIdx = albums.findIndex((a) => a.id === oldAlbumId);
          if (oldAlbIdx !== -1 && albums[oldAlbIdx].songs) {
            albums[oldAlbIdx].songs = albums[oldAlbIdx].songs.filter(
              (sid) => sid !== id,
            );
          }
        }

        if (newAlbumId) {
          const newAlbIdx = albums.findIndex((a) => a.id === newAlbumId);
          if (newAlbIdx !== -1) {
            if (!albums[newAlbIdx].songs) albums[newAlbIdx].songs = [];
            if (!albums[newAlbIdx].songs.includes(id)) {
              albums[newAlbIdx].songs.push(id);
            }
          }
        }
        saveJson('albums.json', albums);
      }

      songs[index] = { ...oldSong, ...updatedFields };
      saveJson('songs.json', songs);

      res.json({ error: false, data: songs[index] });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: true, message: e.message });
    }
  },

  // МАССОВОЕ ПРИСВОЕНИЕ
  assignAlbum: (req, res) => {
    const { songIds, albumId } = req.body;

    if (!Array.isArray(songIds) || !albumId) {
      return res
        .status(400)
        .json({ error: true, message: 'Invalid data format' });
    }

    const songs = loadJson('songs.json');
    const albums = loadJson('albums.json');
    let updatedCount = 0;

    const updatedSongs = songs.map((song) => {
      if (songIds.includes(song.id)) {
        updatedCount++;
        return { ...song, albumId: albumId };
      }
      return song;
    });

    if (updatedCount > 0) {
      saveJson('songs.json', updatedSongs);

      const albumIndex = albums.findIndex((a) => a.id === albumId);
      if (albumIndex !== -1) {
        if (!albums[albumIndex].songs) albums[albumIndex].songs = [];
        const newIds = songIds.filter(
          (id) => !albums[albumIndex].songs.includes(id),
        );
        albums[albumIndex].songs.push(...newIds);
        saveJson('albums.json', albums);
      }
    }

    res.json({
      error: false,
      message: `Updated ${updatedCount} songs.`,
      data: { albumId, updatedCount },
    });
  },

  // Удаление
  delete: (req, res) => {
    const { id } = req.params;
    const songs = loadJson('songs.json');
    const albums = loadJson('albums.json');

    let albumsChanged = false;
    albums.forEach((album) => {
      if (album.songs && album.songs.includes(id)) {
        album.songs = album.songs.filter((sid) => sid !== id);
        albumsChanged = true;
      }
    });

    if (albumsChanged) {
      saveJson('albums.json', albums);
    }

    const newSongs = songs.filter((s) => s.id !== id);
    saveJson('songs.json', newSongs);
    res.json({ error: false, message: 'Song deleted' });
  },

  // Seed (фейковые прослушивания)
  seedPlayCounts: (req, res) => {
    try {
      const songs = loadJson('songs.json');
      let updatedCount = 0;
      const updatedSongs = songs.map((song) => {
        if (!song.playCount) {
          updatedCount++;
          return {
            ...song,
            playCount:
              Math.floor(Math.random() * (5000000 - 10000 + 1)) + 10000,
          };
        }
        return song;
      });
      if (updatedCount > 0) {
        saveJson('songs.json', updatedSongs);
      }
      res.json({ error: false, message: `Updated ${updatedCount} songs.` });
    } catch (e) {
      res.status(500).json({ error: true, message: e.message });
    }
  },

  // СИНХРОНИЗАЦИЯ МЕТАДАННЫХ
  syncMetadata: async (req, res) => {
    // 1. Этот лог должен появиться СРАЗУ при нажатии кнопки
    console.log('>>> [API CALL] syncMetadata triggered');

    try {
      const songs = loadJson('songs.json');
      let updatedCount = 0;

      // Считаем корень проекта относительно контроллера
      const rootPath = path.resolve(__dirname, '../../');
      console.log('>>> [DEBUG] Root project path:', rootPath);

      for (let song of songs) {
        if (song.url && (song.duration === 0 || !song.duration)) {
          console.log(`>>> [PROCESS] Start: ${song.title}`);

          // Нормализуем путь для текущей ОС (Windows/Linux)
          const filePath = path.join(rootPath, ...song.url.split('/'));

          if (fs.existsSync(filePath)) {
            console.log(`>>> [FOUND] File exists at: ${filePath}`);
            try {
              // Добавляем опцию полного сканирования, если заголовок пустой
              const metadata = await mm.parseFile(filePath, { duration: true });

              // Пробуем взять длительность из разных полей
              let duration = metadata.format.duration;

              // Если все еще 0, пробуем рассчитать через размер и битрейт (грубо)
              if (!duration || duration === 0) {
                console.log(
                  `>>> [RETRY] Standard duration failed for ${song.title}, trying estimates...`,
                );
                // В некоторых случаях метаданные лежат глубже
                duration = metadata.common ? duration : 0;
              }

              const finalDuration = Math.round(duration || 0);

              if (finalDuration > 0) {
                song.duration = finalDuration;
                updatedCount++;
                console.log(
                  `>>> [SUCCESS] ${song.title} updated: ${finalDuration}s`,
                );
              } else {
                // Если всё равно 0, значит файл реально не читается как аудио
                console.error(
                  `>>> [FAILED] File ${song.title} is unreadable or empty audio.`,
                );
              }
            } catch (err) {
              console.error(`>>> [METADATA ERROR] ${song.title}:`, err.message);
            }
          } else {
            console.warn(`>>> [NOT FOUND] File missing: ${filePath}`);
          }
        }
      }

      if (updatedCount > 0) {
        saveJson('songs.json', songs);
        console.log(`>>> [DONE] Saved ${updatedCount} songs to database`);
      }

      res.json({ error: false, updatedCount });
    } catch (e) {
      console.error('>>> [CRITICAL] Sync crashed:', e);
      res.status(500).json({ error: true, message: e.message });
    }
  },

  // Очистка URL
  removeUrl: (req, res) => {
    const { id } = req.params;
    const songs = loadJson('songs.json');
    const index = songs.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: true, message: 'Song not found' });
    }

    songs[index].url = '';
    songs[index].duration = 0;
    saveJson('songs.json', songs);

    res.json({
      error: false,
      message: 'Track URL cleared',
      data: songs[index],
    });
  },
};