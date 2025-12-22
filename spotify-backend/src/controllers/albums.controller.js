import { loadJson, saveJson, generateId } from '../utils/db.js';

export const AlbumsController = {
  getAll: (req, res) => {
    res.json({ error: false, data: loadJson('albums.json') });
  },
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

      // Обновляем альбом, сохраняя существующий ID
      albums[index] = {
        ...albums[index],
        ...req.body,
        id, // гарантируем, что ID не изменится [cite: 2025-12-14]
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
  getOne: (req, res) => {
    try {
      const albums = loadJson('albums.json');
      const allSongs = loadJson('songs.json'); // Загружаем все песни для поиска

      const album = albums.find((a) => a.id === req.params.id);

      if (!album) {
        return res
          .status(404)
          .json({ error: true, message: 'Album not found' });
      }

      // Если в альбоме есть массив ID песен, превращаем его в массив объектов
      const populatedSongs = (album.songs || [])
        .map((songId) => {
          const originalSong = allSongs.find((s) => s.id === songId);
          if (!originalSong) return null;

          // Возвращаем объект песни, дополненный данными альбома
          return {
            ...originalSong,
            artist: album.description || originalSong.artist, // Берем имя артиста из альбома
            artistId: album.artistId,
            thumbnail: album.cover || originalSong.thumbnail, // Обложка альбома для всех его песен
            albumId: album.id, // Гарантируем привязку к альбому для навигации в плеере
          };
        })
        .filter(Boolean); // Очищаем от null, если песня была удалена из songs.json

      // Формируем финальный ответ
      const result = {
        ...album,
        songs: populatedSongs,
      };

      res.json({ error: false, data: result });
    } catch (e) {
      res.status(500).json({ error: true, message: e.message });
    }
  },

  create: (req, res) => {
    const albums = loadJson('albums.json');
    const newAlbum = { id: generateId(), ...req.body };
    albums.push(newAlbum);
    saveJson('albums.json', albums);
    res.status(201).json({ error: false, data: newAlbum });
  },
  delete: (req, res) => {
    try {
      const albums = loadJson('albums.json');
      const filtered = albums.filter((a) => a.id !== req.params.id);

      saveJson('albums.json', filtered);
      res.json({ error: false, message: 'Album deleted successfully' });
    } catch (e) {
      res.status(500).json({ error: true, message: e.message });
    }
  },
};
