import { loadJson, saveJson, generateId } from '../utils/db.js';

export const ArtistsController = {
  getAll: (req, res) => {
    res.json({ error: false, data: loadJson('artists.json') });
  },

  getOne: (req, res) => {
    const artists = loadJson('artists.json');
    const artist = artists.find((a) => a.id === req.params.id);
    if (!artist) return res.status(404).json({ error: true });
    res.json({ error: false, data: artist });
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
