import express from 'express';
import { SongsController } from '../controllers/songs.controller.js';
import { adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Публичный доступ
router.get('/', SongsController.getAll);

// Только для администратора [cite: 2025-12-14]
router.post('/', adminAuth, SongsController.create);
router.put('/:id', adminAuth, SongsController.update);
router.delete('/:id', adminAuth, SongsController.delete);

export default router;
