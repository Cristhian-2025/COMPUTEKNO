const express = require('express');
const serviciosRoutes = require('./servicios');
const componentesRoutes = require('./componentes');
const adminRoutes = require('./admin');

const router = express.Router();

router.use('/', serviciosRoutes);
router.use('/', componentesRoutes);
router.use('/', adminRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
