import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const AuthController = {
  /**
   * Вход в админ-панель [cite: 2025-12-14]
   */
  login: async (req, res) => {
    try {
      const { password } = req.body;
      const adminHash = process.env.ADMIN_PASSWORD_HASH;
      const jwtSecret = process.env.JWT_SECRET;

      // 1. Валидация входных данных [cite: 2025-12-14]
      if (!password) {
        return res
          .status(400)
          .json({ error: true, message: 'Password is required' });
      }

      // 2. Проверка конфигурации сервера [cite: 2025-12-14]
      if (!adminHash || !jwtSecret) {
        console.error(
          '[AUTH] Critical: Missing environment variables (HASH or SECRET)',
        );
        return res
          .status(500)
          .json({ error: true, message: 'Server configuration error' });
      }

      // 3. Безопасное сравнение хешей [cite: 2025-12-14]
      const isValid = await bcrypt.compare(password, adminHash);

      if (!isValid) {
        console.warn(
          `[AUTH] Failed login attempt at ${new Date().toISOString()}`,
        );
        return res
          .status(401)
          .json({ error: true, message: 'Invalid credentials' });
      }

      // 4. Генерация JWT [cite: 2025-12-14]
      const token = jwt.sign(
        { role: 'admin', timestamp: Date.now() },
        jwtSecret,
        { expiresIn: '24h' },
      );

      // 5. Установка HttpOnly куки [cite: 2025-12-14]
      res.cookie('admin_token', token, {
        httpOnly: true, // Защита от XSS
        sameSite: 'lax', // Защита от CSRF
        maxAge: 86400000, // 24 часа
        secure: process.env.NODE_ENV === 'production', // Только HTTPS в проде
        path: '/',
      });

      console.log('[AUTH] Admin logged in successfully');
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

  /**
   * Выход: очистка куки [cite: 2025-12-14]
   */
  logout: (req, res) => {
    res.clearCookie('admin_token', { path: '/' });
    res.json({ error: false, message: 'Logged out successfully' });
  },

  /**
   * Проверка текущего статуса (используется при F5 в Angular) [cite: 2025-12-14]
   */
  getMe: (req, res) => {
    // Если middleware adminAuth пропустил запрос сюда, значит isAdmin гарантированно true [cite: 2025-12-14]
    res.json({
      error: false,
      isAdmin: true,
      checkTime: new Date().toISOString(),
    });
  },
};
