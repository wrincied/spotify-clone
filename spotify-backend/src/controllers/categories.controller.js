import { loadJson, saveJson, generateId } from '../utils/db.js';

export const CategoriesController = {
  getAll: (req, res) => {
    res.json({ error: false, data: loadJson('categories.json') });
  },

  create: (req, res) => {
    const cats = loadJson('categories.json');
    const newCat = { id: generateId(), ...req.body };
    cats.push(newCat);
    saveJson('categories.json', cats);
    res.status(201).json({ error: false, data: newCat });
  },

  /**
   * Добавлен отсутствующий метод update
   */
  update: (req, res) => {
    try {
      const cats = loadJson('categories.json');
      const index = cats.findIndex(c => c.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ error: true, message: 'Category not found' });
      }

      // Обновляем данные категории, сохраняя существующий ID
      cats[index] = { ...cats[index], ...req.body, id: req.params.id };
      
      saveJson('categories.json', cats);
      res.json({ error: false, data: cats[index] });
    } catch (e) {
      res.status(500).json({ error: true, message: e.message });
    }
  },

  delete: (req, res) => {
    const cats = loadJson('categories.json');
    const filtered = cats.filter(c => c.id !== req.params.id);
    saveJson('categories.json', filtered);
    res.json({ error: false });
  }
};