const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/admin/login', adminController.loginAdmin);
router.get('/admin/componentes', requireAdmin, adminController.listAdminComponents);
router.get('/admin/ventas', requireAdmin, adminController.listVentas);
router.get('/admin/solicitudes', requireAdmin, adminController.listSolicitudes);
router.get('/admin/entregadas', requireAdmin, adminController.listEntregadas);
router.get('/admin/canceladas', requireAdmin, adminController.listCanceladas);
router.post('/admin/componentes', requireAdmin, adminController.createComponent);
router.put('/admin/componentes/:id', requireAdmin, adminController.updateComponent);
router.patch('/admin/componentes/:id/stock', requireAdmin, adminController.updateStock);
router.post('/admin/componentes/:id/venta', requireAdmin, adminController.confirmSale);
router.post('/admin/solicitudes/:id/confirmar', requireAdmin, adminController.confirmSolicitud);
router.post('/admin/solicitudes/:id/cancelar', requireAdmin, adminController.cancelSolicitud);
router.post('/admin/ventas/:id/entregar', requireAdmin, adminController.markVentaDelivered);
router.post('/admin/ventas/:id/cancelar', requireAdmin, adminController.cancelVenta);
router.patch('/admin/componentes/:id/estado', requireAdmin, adminController.changeComponentState);

module.exports = router;
