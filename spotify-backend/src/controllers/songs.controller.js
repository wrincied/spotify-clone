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
    const newSong = {
      id: generateId(),
      title: req.body.title || 'New Track',
      url: req.body.url || '',
      thumbnail: req.body.thumbnail || '',
      artistId: req.body.artistId || '',
      categoryId: req.body.categoryId || '',
      duration: req.body.duration || 0,

      // ИСПРАВЛЕНИЕ: Сначала ищем artist, и только как фоллбэк берем description
      artist: req.body.artist || req.body.description || 'Unknown Artist',

      albumId: req.body.albumId || null,

      // Сохраняем description отдельно, если нужно
      description: req.body.description || '',
    };
    songs.push(newSong);
    saveJson('songs.json', songs);
    res.status(201).json({ error: false, data: newSong });
  },
  seedPlayCounts: (req, res) => {
    try {
      const songs = loadJson('songs.json');
      let updatedCount = 0;

      const updatedSongs = songs.map((song) => {
        // Если прослушиваний нет, генерируем и сохраняем навсегда [cite: 2025-12-14]
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
    const index = songs.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: true, message: 'Song not found' });
    }

    // Подготовка обновленных полей
    const updatedFields = { ...req.body };

    // Явная логика для title (поддержка legacy поля name)
    if (req.body.name) updatedFields.title = req.body.name;

    // Явная логика для artist
    // Если прислали artist - берем его. Если нет, оставляем старого.
    // Не перезаписываем артиста описанием, если оно пришло для других целей.
    if (!updatedFields.artist && updatedFields.description) {
      // Оставляем старую логику только для обратной совместимости,
      // но лучше убрать это, если фронт обновлен
      // updatedFields.artist = updatedFields.description;
    }

    songs[index] = {
      ...songs[index],
      ...updatedFields,
    };

    saveJson('songs.json', songs);
    res.json({ error: false, data: songs[index] });
  },

  // МАССОВОЕ ПРИСВОЕНИЕ АЛЬБОМА (Новый метод)
  assignAlbum: (req, res) => {
    // Ожидаем: { songIds: ["id1", "id2"], albumId: "album-geometry" }
    const { songIds, albumId } = req.body;

    if (!Array.isArray(songIds) || !albumId) {
      return res
        .status(400)
        .json({ error: true, message: 'Invalid data format' });
    }

    const songs = loadJson('songs.json');
    let updatedCount = 0;

    // Проходим по всем песням и обновляем только те, чьи ID есть в списке
    const updatedSongs = songs.map((song) => {
      if (songIds.includes(song.id)) {
        updatedCount++;
        return { ...song, albumId: albumId }; // Обновляем поле
      }
      return song; // Остальные не трогаем
    });

    if (updatedCount > 0) {
      saveJson('songs.json', updatedSongs);
    }

    res.json({
      error: false,
      message: `Successfully updated ${updatedCount} songs`,
      data: { albumId, updatedCount },
    });
  },

  // Удаление
  delete: (req, res) => {
    const songs = loadJson('songs.json');
    const filtered = songs.filter((s) => s.id !== req.params.id);
    saveJson('songs.json', filtered);
    res.json({ error: false, message: 'Song deleted' });
  },
};
