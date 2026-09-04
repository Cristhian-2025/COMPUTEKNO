const express = require('express');
const componentesController = require('../controllers/componentesController');

const router = express.Router();

router.get('/componentes', componentesController.listComponentes);
router.get('/estaciones', componentesController.listEstaciones);
router.post('/componentes/comprar', componentesController.comprarComponente);

module.exports = router;
