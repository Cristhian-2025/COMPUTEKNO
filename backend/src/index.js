const app = require('./app');
const db = require('./config/db');
const { PORT } = require('./config/env');
const { info, error } = require('./lib/logger');

// Iniciar servidor (espera a que la base de datos esté inicializada)
db.initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      info(`Servidor SUNETYA ejecutándose en puerto ${PORT}`);
      info(`Modo: ${process.env.NODE_ENV || 'development'}`);
      info(`URL: http://localhost:${PORT}`);
      info(`API: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    error(`No se pudo iniciar el servidor por un error de base de datos: ${err.message}`);
    process.exit(1);
  });
