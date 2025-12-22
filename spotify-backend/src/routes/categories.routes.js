import express from 'express';
import { CategoriesController } from '../controllers/categories.controller.js';
import { adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * ПУБЛИЧНЫЕ МАРШРУТЫ
 * Доступны всем пользователям для отображения жанров
 */
router.get('/', CategoriesController.getAll);

/**
 * ЗАЩИЩЕННЫЕ МАРШРУТЫ (ADMIN ONLY) 
 * Требуют наличия валидной HttpOnly куки admin_token
 */
router.post('/', adminAuth, CategoriesController.create);

// Метод PUT для обновления цвета или названия категории
router.put('/:id', adminAuth, CategoriesController.update);

router.delete('/:id', adminAuth, CategoriesController.delete);

export default router;