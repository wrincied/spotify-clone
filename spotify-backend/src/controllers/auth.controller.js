import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const AuthController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body; // Добавили username
      const adminUsername = process.env.ADMIN_USERNAME; // Должно быть в .env
      const adminHash = process.env.ADMIN_PASSWORD_HASH;
      const jwtSecret = process.env.JWT_SECRET;

      // 1. Валидация входных данных
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: true, message: 'Username and password are required' });
      }

      // 2. Проверка конфигурации сервера
      if (!adminUsername || !adminHash || !jwtSecret) {
        console.error(
          '[AUTH] Critical: Missing environment variables (USER, HASH or SECRET)',
        );
        return res
          .status(500)
          .json({ error: true, message: 'Server configuration error' });
      }

      // 3. Проверка логина и пароля
      // Сначала проверяем логин (строгое соответствие)
      const isUsernameValid = username === adminUsername;

      // Затем проверяем пароль через bcrypt
      const isPasswordValid = await bcrypt.compare(password, adminHash);

      // Если хотя бы одно поле неверно — выдаем общую ошибку 401
      if (!isUsernameValid || !isPasswordValid) {
        console.warn(
          `[AUTH] Failed login attempt for user: "${username}" at ${new Date().toISOString()}`,
        );
        return res
          .status(401)
          .json({ error: true, message: 'Invalid username or password' });
      }

      // 4. Генерация JWT (добавляем username в токен)
      const token = jwt.sign(
        { username: adminUsername, role: 'admin' },
        jwtSecret,
        { expiresIn: '24h' },
      );

      // 5. Установка HttpOnly куки
      res.cookie('admin_token', token, {
        httpOnly: true,
        // Изменяем на 'none', чтобы разрешить передачу между разными доменами
        sameSite: 'none',
        maxAge: 86400000,
        // Обязательно true, так как sameSite: 'none' работает ТОЛЬКО с HTTPS 
        secure: true,
        path: '/',
      });

      console.log(`[AUTH] Admin "${adminUsername}" logged in successfully`);
      return res.json({ error: false, isAdmin: true });
    } catch (error) {
      console.error(
        '[AUTH] Internal server error during login:',
        error.message,
      );
      return res
        .status(500)
        .json({ error: true, message: 'Internal server error' });
    }
  },

  logout: (req, res) => {
    res.clearCookie('admin_token', { path: '/' });
    res.json({ error: false, message: 'Logged out successfully' });
  },

  getMe: (req, res) => {
    res.json({
      error: false,
      isAdmin: true,
      username: req.admin?.username || 'admin', // Если middleware прокидывает данные из JWT
      checkTime: new Date().toISOString(),
    });
  },
};
