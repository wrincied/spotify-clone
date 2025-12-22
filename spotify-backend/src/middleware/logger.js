export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Логируем только общую информацию о запросе
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );

    // Подозрительное поведение: много 401 или 403 ошибок
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(
        `[SECURITY WARNING] Unauthorized access attempt from ${req.ip}`,
      );
    }
  });

  next();
};
