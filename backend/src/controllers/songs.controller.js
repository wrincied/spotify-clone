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
    // Гарантируем структуру объекта для фронтенда
    const newSong = {
      id: generateId(),
      title: req.body.title || 'New Track',
      url: req.body.url || '',
      thumbnail: req.body.thumbnail || '',
      artistId: req.body.artistId || '',
      categoryId: req.body.categoryId || '',
      duration: req.body.duration || 0,
      artist: req.body.description || 'Unknown Artist',
    };
    songs.push(newSong);
    saveJson('songs.json', songs);
    res.status(201).json({ error: false, data: newSong });
  },

  // ОБНОВЛЕНИЕ ПЕСНИ (Добавлено)
  update: (req, res) => {
    const { id } = req.params;
    const songs = loadJson('songs.json');
    const index = songs.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: true, message: 'Song not found' });
    }

    // Мержим старые данные с новыми из req.body
    songs[index] = {
      ...songs[index],
      ...req.body,
      // Маппинг: если фронт прислал 'name', пишем в 'title'
      title: req.body.name || req.body.title || songs[index].title,
      artist: req.body.description || songs[index].artist,
    };

    saveJson('songs.json', songs);
    res.json({ error: false, data: songs[index] });
  },

  // Удаление
  delete: (req, res) => {
    const songs = loadJson('songs.json');
    const filtered = songs.filter((s) => s.id !== req.params.id);
    saveJson('songs.json', filtered);
    res.json({ error: false, message: 'Song deleted' });
  },
};
