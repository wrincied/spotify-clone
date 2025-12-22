import express from 'express';
import { SongsController } from '../controllers/songs.controller.js';
import { adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Публичный доступ
router.get('/', SongsController.getAll);

// --- МИГРАЦИЯ (Временно открытый доступ) ---
// Мы ставим это ПЕРЕД маршрутами с :id, чтобы express не подумал, что "assign-album" это id
router.post('/assign-album', SongsController.assignAlbum);

// Только для администратора
router.post('/', adminAuth, SongsController.create);
router.put('/:id', adminAuth, SongsController.update);
router.post('/songs/seed', SongsController.seedPlayCounts);
// router. <--- Эту ошибку я убрал
router.delete('/:id', adminAuth, SongsController.delete);
router.patch('/:id/remove-url', adminAuth, SongsController.removeUrl);
export default router;
