import express from 'express';
import { SongsController } from '../controllers/songs.controller.js';
import { adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', SongsController.getAll);

// Важно: этот роут ДОЛЖЕН быть перед /:id
router.post('/assign-album', SongsController.assignAlbum);
// router.post('/sync-metadata', SongsController.syncMetadata);
router.patch('/:id', SongsController.update);
router.post('/', adminAuth, SongsController.create);
router.put('/:id', adminAuth, SongsController.update);
router.post('/songs/seed', SongsController.seedPlayCounts);
router.delete('/:id', adminAuth, SongsController.delete);
router.patch('/:id/remove-url', adminAuth, SongsController.removeUrl);

export default router;
