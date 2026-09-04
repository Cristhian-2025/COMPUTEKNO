const express = require('express');
const serviciosController = require('../controllers/serviciosController');

const router = express.Router();

router.get('/servicios', serviciosController.getServicios);
router.get('/servicios/:id', serviciosController.getServicioById);

module.exports = router;
