import express from 'express';
import { ArtistsController } from '../controllers/artists.controller.js';
import { adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Публичный доступ
router.get('/', ArtistsController.getAll);
router.get('/:id', ArtistsController.getOne);

// Только для администратора
router.post('/', adminAuth, ArtistsController.create);
router.put('/:id', adminAuth, ArtistsController.update);
router.delete('/:id', adminAuth, ArtistsController.delete);

export default router;
