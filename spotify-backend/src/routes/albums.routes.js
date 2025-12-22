import express from 'express';
import { AlbumsController } from '../controllers/albums.controller.js';
import { adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Публичный доступ
router.get('/', AlbumsController.getAll);
router.get('/:id', AlbumsController.getOne);

// Только для администратора
router.post('/', adminAuth, AlbumsController.create);
router.put('/:id', adminAuth, AlbumsController.update);
router.delete('/:id', adminAuth, AlbumsController.delete);

export default router;
