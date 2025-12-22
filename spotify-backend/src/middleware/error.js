export const errorHandler = (err, req, res, next) => {
  console.error(`[INTERNAL ERROR] ${err.stack}`);

  // Не отдаем внутреннее состояние сервера наружу [cite: 2025-12-14]
  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred' 
      : err.message
  });
};