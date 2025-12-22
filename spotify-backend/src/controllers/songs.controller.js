import { loadJson, saveJson, generateId } from '../utils/db.js';

export const SongsController = {
  // Получение всех песен
  getAll: (req, res) => {
    const data = loadJson('songs.json');
    res.json({ error: false, data: data || [] });
  },

  // Создание песни
  create: (req, res) => {
    const songs = loadJson('songs.json');
    const albums = loadJson('albums.json'); // 1. Загружаем альбомы для синхронизации

    const newSong = {
      id: generateId(),
      title: req.body.title || 'New Track',
      url: req.body.url || '',
      thumbnail: req.body.thumbnail || '',
      artistId: req.body.artistId || '',
      categoryId: req.body.categoryId || '',
      duration: req.body.duration || 0,
      artist: req.body.artist || req.body.description || 'Unknown Artist',
      albumId: req.body.albumId || null,
      description: req.body.description || '',
    };

    // 2. Если указан альбом, добавляем ID песни в этот альбом 
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
  },

  // Генерация прослушиваний (Seed)
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

      res.json({
        error: false,
        message: `Database updated. Assigned play counts to ${updatedCount} songs.`,
      });
    } catch (e) {
      res.status(500).json({ error: true, message: e.message });
    }
  },

  // Обновление песни
  update: (req, res) => {
    const { id } = req.params;
    const songs = loadJson('songs.json');
    const albums = loadJson('albums.json'); // Загружаем альбомы
    const index = songs.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: true, message: 'Song not found' });
    }

    // Логика синхронизации альбомов при изменении albumId 
    const oldAlbumId = songs[index].albumId;
    const newAlbumId = req.body.albumId;

    // Если albumId пришел в запросе и он отличается от старого
    if (newAlbumId !== undefined && oldAlbumId !== newAlbumId) {
      // А. Удаляем из старого альбома
      if (oldAlbumId) {
        const oldAlbIdx = albums.findIndex((a) => a.id === oldAlbumId);
        if (oldAlbIdx !== -1 && albums[oldAlbIdx].songs) {
          albums[oldAlbIdx].songs = albums[oldAlbIdx].songs.filter(
            (sid) => sid !== id,
          );
        }
      }

      // Б. Добавляем в новый альбом (если это не сброс альбома)
      if (newAlbumId) {
        const newAlbIdx = albums.findIndex((a) => a.id === newAlbumId);
        if (newAlbIdx !== -1) {
          if (!albums[newAlbIdx].songs) albums[newAlbIdx].songs = [];
          // Проверяем дубликаты на всякий случай
          if (!albums[newAlbIdx].songs.includes(id)) {
            albums[newAlbIdx].songs.push(id);
          }
        }
      }
      // Сохраняем изменения в альбомах
      saveJson('albums.json', albums);
    }

    // Подготовка полей песни
    const updatedFields = { ...req.body };
    if (req.body.name) updatedFields.title = req.body.name;

    songs[index] = {
      ...songs[index],
      ...updatedFields,
    };

    saveJson('songs.json', songs);
    res.json({ error: false, data: songs[index] });
  },

  // МАССОВОЕ ПРИСВОЕНИЕ АЛЬБОМА
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

    // 1. Обновляем песни в songs.json
    const updatedSongs = songs.map((song) => {
      if (songIds.includes(song.id)) {
        updatedCount++;
        return { ...song, albumId: albumId };
      }
      return song;
    });

    if (updatedCount > 0) {
      saveJson('songs.json', updatedSongs);

      // 2. Обновляем целевой альбом в albums.json 
      const albumIndex = albums.findIndex((a) => a.id === albumId);
      if (albumIndex !== -1) {
        if (!albums[albumIndex].songs) albums[albumIndex].songs = [];
        // Добавляем ID песен, избегая дубликатов
        const newIds = songIds.filter(
          (id) => !albums[albumIndex].songs.includes(id),
        );
        albums[albumIndex].songs.push(...newIds);
        saveJson('albums.json', albums);
      }
    }

    res.json({
      error: false,
      message: `Successfully updated ${updatedCount} songs and synced album.`,
      data: { albumId, updatedCount },
    });
  },

  // Удаление песни
  delete: (req, res) => {
    const { id } = req.params;
    const songs = loadJson('songs.json');
    const albums = loadJson('albums.json');

    // 1. Очищаем удаляемую песню из всех альбомов 
    let albumsChanged = false;
    const updatedAlbums = albums.map((album) => {
      if (album.songs && album.songs.includes(id)) {
        albumsChanged = true;
        return {
          ...album,
          songs: album.songs.filter((sid) => sid !== id),
        };
      }
      return album;
    });

    if (albumsChanged) {
      saveJson('albums.json', updatedAlbums);
    }

    // 2. Удаляем саму песню
    const filtered = songs.filter((s) => s.id !== id);
    saveJson('songs.json', filtered);
    res.json({ error: false, message: 'Song deleted and removed from albums' });
  },

  // Удаление только ссылки на файл (url)
  removeUrl: (req, res) => {
    const { id } = req.params;
    const songs = loadJson('songs.json');
    const index = songs.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: true, message: 'Song not found' });
    }

    songs[index].url = '';
    saveJson('songs.json', songs);
    res.json({
      error: false,
      message: 'Track URL has been cleared',
      data: songs[index],
    });
  },
};
