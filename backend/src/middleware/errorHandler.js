function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500;
  const message = err.publicMessage || err.message || 'Error interno del servidor';

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
