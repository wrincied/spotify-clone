import { loadJson, saveJson, generateId } from '../utils/db.js';

export const ArtistsController = {
  getAll: (req, res) => {
    res.json({ error: false, data: loadJson('artists.json') });
  },

  getOne: (req, res) => {
    const artists = loadJson('artists.json');
    const artist = artists.find((a) => String(a.id) === String(req.params.id)); // Приведение к строке [cite: 2025-12-14]

    if (!artist) {
      return res.status(404).json({ error: true, message: 'Artist not found' });
    }

    const allSongs = loadJson('songs.json');

    // Фильтруем песни. Проверяем и artistId, и просто текстовое имя для надежности
    const artistTracks = allSongs.filter(
      (s) =>
        String(s.artistId) === String(artist.id) ||
        s.artist?.toLowerCase() === artist.name?.toLowerCase(),
    );

    const topTracks = artistTracks.slice(0, 10).map((song) => {
      return {
        ...song,
        // Если значения нет, генерируем от 500 тыс. до 5 млн. [cite: 2025-12-14]
        playCount:
          song.playCount ||
          Math.floor(Math.random() * (5000000 - 500000 + 1)) + 500000,
      };
    });

    res.json({
      error: false,
      data: {
        ...artist,
        topTracks: topTracks,
      },
    });
  },

  create: (req, res) => {
    const artists = loadJson('artists.json');
    const newArtist = { id: generateId(), ...req.body, followers: 0 };
    artists.push(newArtist);
    saveJson('artists.json', artists);
    res.status(201).json({ error: false, data: newArtist });
  },

  delete: (req, res) => {
    const artists = loadJson('artists.json');
    const filtered = artists.filter((a) => a.id !== req.params.id);
    saveJson('artists.json', filtered);
    res.json({ error: false });
  },
  update: (req, res) => {
    const { id } = req.params;
    const artists = loadJson('artists.json');
    const index = artists.findIndex((a) => a.id === id);
    if (index === -1) return res.status(404).json({ error: true });

    artists[index] = { ...artists[index], ...req.body };
    saveJson('artists.json', artists);
    res.json({ error: false, data: artists[index] });
  },
};
