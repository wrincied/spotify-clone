import { loadJson, saveJson, generateId } from '../utils/db.js';

export const AlbumsController = {
  // Получение всех альбомов
  getAll: (req, res) => {
    const albums = loadJson('albums.json');
    // Можно возвращать пустой массив, если файла нет
    res.json({ error: false, data: albums || [] });
  },

  // Создание альбома
  create: (req, res) => {
    const albums = loadJson('albums.json');
    const newAlbum = {
      id: generateId(),
      songs: [], // Инициализируем пустой массив песен сразу 
      ...req.body,
    };
    albums.push(newAlbum);
    saveJson('albums.json', albums);
    res.status(201).json({ error: false, data: newAlbum });
  },

  // Обновление альбома
  update: (req, res) => {
    try {
      const { id } = req.params;
      const albums = loadJson('albums.json');
      const index = albums.findIndex((a) => a.id === id);

      if (index === -1) {
        return res
          .status(404)
          .json({ error: true, message: 'Album not found' });
      }

      // Обновляем поля
      albums[index] = {
        ...albums[index],
        ...req.body,
        id, // ID менять нельзя 
      };

      saveJson('albums.json', albums);
      res.json({
        error: false,
        data: albums[index],
        message: 'Album updated successfully',
      });
    } catch (e) {
      res.status(500).json({ error: true, message: e.message });
    }
  },

  // Получение одного альбома с "развернутыми" песнями
  getOne: (req, res) => {
    try {
      const albums = loadJson('albums.json');
      const allSongs = loadJson('songs.json');

      const album = albums.find((a) => a.id === req.params.id);

      if (!album) {
        return res
          .status(404)
          .json({ error: true, message: 'Album not found' });
      }

      // "Hydration": Наполняем массив ID реальными данными песен 
      const populatedSongs = (album.songs || [])
        .map((songId) => {
          const originalSong = allSongs.find((s) => s.id === songId);
          if (!originalSong) return null;

          // Возвращаем объект песни, переопределяя контекст под альбом
          // Это критично для плеера: обложка и артист берутся из альбома, если играем оттуда
          return {
            ...originalSong,
            artist: album.description || originalSong.artist, // Fallback логика
            artistId: album.artistId || originalSong.artistId,
            thumbnail: album.cover || originalSong.thumbnail, // Обложка альбома приоритетнее
            albumId: album.id,
          };
        })
        .filter(Boolean); // Убираем null (если песня была удалена, но ID остался в альбоме)

      const result = {
        ...album,
        songs: populatedSongs,
      };

      res.json({ error: false, data: result });
    } catch (e) {
      res.status(500).json({ error: true, message: e.message });
    }
  },

  // Удаление альбома (Safe Delete)
  delete: (req, res) => {
    try {
      const { id } = req.params;
      const albums = loadJson('albums.json');
      const songs = loadJson('songs.json');

      // 1. Отвязываем песни от удаляемого альбома 
      let songsChanged = false;
      const updatedSongs = songs.map((s) => {
        if (s.albumId === id) {
          songsChanged = true;
          return { ...s, albumId: null }; // Сбрасываем привязку
        }
        return s;
      });

      if (songsChanged) {
        saveJson('songs.json', updatedSongs);
      }

      // 2. Удаляем сам альбом
      const filteredAlbums = albums.filter((a) => a.id !== id);
      saveJson('albums.json', filteredAlbums);

      res.json({
        error: false,
        message: 'Album deleted and tracks unlinked successfully',
      });
    } catch (e) {
      res.status(500).json({ error: true, message: e.message });
    }
  },
};
