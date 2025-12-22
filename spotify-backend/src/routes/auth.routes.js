import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
// Добавляем отсутствующий импорт 
// Убедитесь, что имя файла совпадает с тем, что в папке middleware
import { adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

/**
 * Маршрут проверки сессии.
 * Сначала выполняется adminAuth (проверка куки),
 * затем getMe (возврат статуса).
 */
router.get('/me', adminAuth, AuthController.getMe);

export default router;
