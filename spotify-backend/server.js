import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Инициализация окружения
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
const allowedOrigins = [
  'https://clone-spotify-dbe3f.web.app', // Боевой сайт
  'http://localhost:4200', // Локальная разработка
  'http://localhost:4000', // SSR локально
];
dotenv.config({ path: path.join(__dirname, '.env') });
// 4. Глобальные настройки и безопасность 

// ОТЛАДКА: Проверьте это в консоли после запуска 
if (!process.env.ADMIN_PASSWORD_HASH) {
  console.error(
    `[CRITICAL] .env file not found or empty at: ${path.join(__dirname, '.env')}`,
  );
} else {
  console.log('[INFO] Environment variables loaded successfully.');
}
// Добавляем URL из переменных окружения (Render), если он задан и уникален
if (
  process.env.CLIENT_URL &&
  !allowedOrigins.includes(process.env.CLIENT_URL)
) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(requestLogger);

// 2. Подключение Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // А. Разрешаем запросы без 'Origin'
      // (например, мобильные приложения, Postman или запросы сервер-сервер)
      if (!origin) return callback(null, true);

      // Б. Проверяем, входит ли источник в наш белый список
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // В. Если чужак — блокируем и пишем в лог сервера (увидишь в логах Render)
        console.error(`[CORS Blocked] Request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Разрешаем куки и заголовки авторизации
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Явно разрешаем методы
    allowedHeaders: ['Content-Type', 'Authorization'], // Явно разрешаем заголовки
  }),
);
app.use(express.json());
app.use(cookieParser());

// 5. Раздача статики
app.use('/public', express.static(path.join(__dirname, 'public')));

// 6. Регистрация API маршрутов 
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/categories', categoryRoutes); // Добавлено 

// 7. Обработка ошибок 
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[INFO] Spotify Clone Backend modularized successfully.`);
  console.log(`[INFO] Server running at http://localhost:${PORT}`);
});
