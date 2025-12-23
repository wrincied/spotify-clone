import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Настройка окружения для ES Modules (создаем __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Инициализация переменных окружения (сразу после __dirname)
dotenv.config({ path: path.join(__dirname, '.env') });

// 3. Импорт внутренних модулей
import { requestLogger } from './src/middleware/logger.js';
import { errorHandler } from './src/middleware/error.js';
import authRoutes from './src/routes/auth.routes.js';
import songRoutes from './src/routes/songs.routes.js';
import artistRoutes from './src/routes/artists.routes.js';
import albumRoutes from './src/routes/albums.routes.js';
import categoryRoutes from './src/routes/categories.routes.js';

// 4. Инициализация приложения
const app = express();

// ВАЖНО: Trust Proxy должен быть первым для Render/Heroku/Nginx
app.set('trust proxy', true);

// 5. Конфигурация источников (Origins)
const defaultOrigins = [
  'https://clone-spotify-dbe3f.web.app', // Production
  'http://localhost:4200', // Angular Dev
  'http://localhost:4000', // SSR / Node
];

// Добавляем CLIENT_URL из .env, убирая дубликаты
const allowedOrigins = [
  ...new Set([
    ...defaultOrigins,
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ]),
];

// Проверка наличия критических переменных
if (!process.env.ADMIN_PASSWORD_HASH) {
  console.warn(
    `[WARNING] .env might be missing or empty at: ${path.join(__dirname, '.env')}`,
  );
} else {
  console.log('[INFO] Environment variables loaded.');
}

// 6. Подключение Middleware (порядок важен!)

// А. Логирование (видит реальный IP благодаря trust proxy)
app.use(requestLogger);

// Б. Тестовый эндпоинт для проверки IP (полезно для отладки на Render)
app.get('/api/check-source', (req, res) => {
  const clientIp = req.ip;
  console.log(`[DEBUG] Check-source request from: ${clientIp}`);
  res.json({ ip: clientIp, forwarded: req.headers['x-forwarded-for'] });
});

// В. CORS (Безопасность)
app.use(
  cors({
    origin: function (origin, callback) {
      // Разрешаем запросы без origin (например, Postman, серверные curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`[CORS Blocked] Origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Г. Парсеры тела запроса и кук
app.use(express.json());
app.use(cookieParser());

// Д. Раздача статических файлов
app.use('/public', express.static(path.join(__dirname, 'public')));

// 7. Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/categories', categoryRoutes);

// 8. Глобальная обработка ошибок (всегда в конце)
app.use(errorHandler);

// 9. Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[INFO] Server running on port ${PORT}`);
  console.log(`[INFO] Allowed Origins: ${allowedOrigins.join(', ')}`);
});
