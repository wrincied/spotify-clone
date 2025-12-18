import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Инициализация окружения [cite: 2025-12-14]
dotenv.config();

// 2. Импорт посредников (Middleware)
import { requestLogger } from './src/middleware/logger.js';
import { errorHandler } from './src/middleware/error.js';

// 3. Импорт маршрутов
import authRoutes from './src/routes/auth.routes.js';
import songRoutes from './src/routes/songs.routes.js';
import artistRoutes from './src/routes/artists.routes.js';
import albumRoutes from './src/routes/albums.routes.js';
import categoryRoutes from './src/routes/categories.routes.js'; // Добавлено

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
// 4. Глобальные настройки и безопасность [cite: 2025-12-14]

// ОТЛАДКА: Проверьте это в консоли после запуска [cite: 2025-12-14]
if (!process.env.ADMIN_PASSWORD_HASH) {
  console.error(
    `[CRITICAL] .env file not found or empty at: ${path.join(__dirname, '.env')}`,
  );
} else {
  console.log('[INFO] Environment variables loaded successfully.');
}

app.use(requestLogger);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:4200',
    credentials: true, // Необходимо для передачи HttpOnly Cookies [cite: 2025-12-14]
  }),
);

app.use(express.json());
app.use(cookieParser());

// 5. Раздача статики
app.use('/public', express.static(path.join(__dirname, 'public')));

// 6. Регистрация API маршрутов [cite: 2025-12-18]
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/categories', categoryRoutes); // Добавлено [cite: 2025-12-14]

// 7. Обработка ошибок [cite: 2025-12-14]
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[INFO] Spotify Clone Backend modularized successfully.`);
  console.log(`[INFO] Server running at http://localhost:${PORT}`);
});
