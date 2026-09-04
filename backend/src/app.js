const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const apiLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const { ALLOWED_ORIGIN, NODE_ENV } = require('./config/env');

const app = express();

const allowedOrigins = (ALLOWED_ORIGIN || 'http://127.0.0.1:5500')
  .split(',')
  .map((origin) => origin.trim());

app.use(helmet());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  }),
);

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Servidor COMPUTEKNO activo',
    version: '1.0.0',
    status: 'OK',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

app.use(errorHandler);

module.exports = app;
