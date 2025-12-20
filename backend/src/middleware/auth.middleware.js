import jwt from 'jsonwebtoken';

export const adminAuth = (req, res, next) => {
  const token = req.cookies.admin_token;
  const jwtSecret = process.env.JWT_SECRET;

  // 1. Проверка наличия токена
  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Unauthorized: No session found',
    });
  }

  // 2. Проверка конфигурации сервера (защита от падения)
  if (!jwtSecret) {
    console.error('[AUTH MIDDLEWARE] Critical: JWT_SECRET is not defined');
    return res.status(500).json({
      error: true,
      message: 'Internal server configuration error',
    });
  }

  try {
    // 3. Верификация токена
    const decoded = jwt.verify(token, jwtSecret);

    // 4. Дополнительная проверка роли (если зашита в токен)
    if (decoded.role !== 'admin') {
      console.warn(`[AUTH] Access denied for non-admin role: ${decoded.role}`);
      return res.status(403).json({
        error: true,
        message: 'Forbidden: Admin access required',
      });
    }

    // Сохраняем данные в req.admin для использования в контроллерах
    req.admin = decoded;
    next();
  } catch (err) {
    // Ошибки истечения срока (TokenExpiredError) или подделки
    console.error('[AUTH] Token verification failed:', err.message);
    return res.status(401).json({
      error: true,
      message: 'Unauthorized: Session invalid or expired',
    });
  }
};
