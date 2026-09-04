const { validateComponent } = require('../validators/adminValidator');
const adminService = require('../services/adminService');

async function loginAdmin(req, res) {
  const result = await adminService.loginAdmin(req.body.username, req.body.password);
  return res.status(result.status).json(result.payload);
}

async function listAdminComponents(req, res) {
  try {
    const rows = await adminService.listAdminComponents();
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar componentes de administración:', error);
    return res.status(500).json({ error: 'No fue posible obtener los componentes.' });
  }
}

async function listVentas(req, res) {
  try {
    const rows = await adminService.listVentas();
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar ventas confirmadas:', error);
    return res.status(500).json({ error: 'No fue posible obtener el historial de ventas.' });
  }
}

async function listSolicitudes(req, res) {
  try {
    const rows = await adminService.listSolicitudes();
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar solicitudes pendientes:', error);
    return res.status(500).json({ error: 'No fue posible obtener las solicitudes pendientes.' });
  }
}

async function listEntregadas(req, res) {
  try {
    const rows = await adminService.listEntregadas();
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar ventas entregadas:', error);
    return res.status(500).json({ error: 'No fue posible obtener las ventas entregadas.' });
  }
}

async function listCanceladas(req, res) {
  try {
    const rows = await adminService.listCanceladas();
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar ventas canceladas:', error);
    return res.status(500).json({ error: 'No fue posible obtener las ventas canceladas.' });
  }
}

async function createComponent(req, res) {
  const validation = validateComponent(req.body);

  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const created = await adminService.createComponent(validation.value);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Error al crear componente:', error);
    return res.status(500).json({ error: 'No fue posible crear el componente.' });
  }
}

async function updateComponent(req, res) {
  const id = Number(req.params.id);
  const validation = validateComponent(req.body);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Id de componente inválido.' });
  }

  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const result = await adminService.updateComponent(id, validation.value);

    if (result.notFound) {
      return res.status(404).json({ error: 'Componente no encontrado.' });
    }

    return res.json({ mensaje: 'Componente actualizado.' });
  } catch (error) {
    console.error('Error al actualizar componente:', error);
    return res.status(500).json({ error: 'No fue posible actualizar el componente.' });
  }
}

async function updateStock(req, res) {
  const id = Number(req.params.id);
  const stock = Number(req.body.stock);

  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ error: 'El id y el stock deben ser valores válidos.' });
  }

  try {
    const result = await adminService.updateStock(id, stock);

    if (result.notFound) {
      return res.status(404).json({ error: 'Componente no encontrado.' });
    }

    return res.json({ mensaje: 'Stock actualizado.', stock: result.stock });
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    return res.status(500).json({ error: 'No fue posible actualizar el stock.' });
  }
}

async function confirmSale(req, res) {
  const id = Number(req.params.id);
  const cantidad = Number(req.body.cantidad);
  const cliente =
    typeof req.body.cliente === 'string' && req.body.cliente.trim() !== ''
      ? req.body.cliente.trim()
      : 'Cliente web';

  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
    return res.status(400).json({ error: 'El id y la cantidad deben ser valores válidos.' });
  }

  try {
    const result = await adminService.confirmSale(id, cantidad, cliente);

    if (result.notFound) {
      return res.status(404).json({ error: 'Componente no encontrado.' });
    }

    if (result.conflict) {
      return res.status(409).json({
        error: 'No hay suficientes unidades disponibles para confirmar la venta.',
        stockDisponible: result.stockDisponible,
      });
    }

    return res.json({
      mensaje: 'Venta confirmada y stock actualizado en la base de datos.',
      stock: result.stock,
    });
  } catch (error) {
    console.error('Error al confirmar la venta:', error);
    return res.status(500).json({ error: 'No fue posible confirmar la venta.' });
  }
}

async function confirmSolicitud(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'La solicitud es inválida.' });
  }

  try {
    const result = await adminService.confirmSolicitud(id);

    if (result.notFound) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya fue aprobada.' });
    }

    if (result.conflict) {
      return res.status(409).json({
        error: 'No hay suficientes unidades disponibles para confirmar la solicitud.',
        stockDisponible: result.stockDisponible,
      });
    }

    return res.json({
      mensaje: 'Solicitud aprobada. El producto queda pendiente de entrega.',
      stock: result.stock,
      estado: result.estado,
    });
  } catch (error) {
    console.error('Error al confirmar la solicitud:', error);
    return res.status(500).json({ error: 'No fue posible confirmar la solicitud.' });
  }
}

async function markVentaDelivered(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'La venta es inválida.' });
  }

  try {
    const result = await adminService.markVentaDelivered(id);

    if (result.notFound) {
      return res.status(404).json({ error: 'Venta no encontrada o ya fue entregada.' });
    }

    return res.json({
      mensaje: 'Producto marcado como entregado.',
      estado: result.estado,
    });
  } catch (error) {
    console.error('Error al marcar la venta como entregada:', error);
    return res.status(500).json({ error: 'No fue posible marcar el producto como entregado.' });
  }
}

async function cancelSolicitud(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'La solicitud es inválida.' });
  }

  try {
    const result = await adminService.cancelSolicitud(id);

    if (result.notFound) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya fue procesada.' });
    }

    return res.json({
      mensaje: 'Solicitud cancelada.',
      estado: result.estado,
    });
  } catch (error) {
    console.error('Error al cancelar la solicitud:', error);
    return res.status(500).json({ error: 'No fue posible cancelar la solicitud.' });
  }
}

async function cancelVenta(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'La venta es inválida.' });
  }

  try {
    const result = await adminService.cancelVenta(id);

    if (result.notFound) {
      return res.status(404).json({ error: 'Venta no encontrada o ya fue procesada.' });
    }

    return res.json({
      mensaje: 'Venta cancelada y stock restaurado.',
      estado: result.estado,
      stock: result.stock,
    });
  } catch (error) {
    console.error('Error al cancelar la venta:', error);
    return res.status(500).json({ error: 'No fue posible cancelar la venta.' });
  }
}

async function changeComponentState(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0 || typeof req.body.activo !== 'boolean') {
    return res.status(400).json({ error: 'El id y el estado del componente son obligatorios.' });
  }

  try {
    const result = await adminService.changeComponentState(id, req.body.activo);

    if (result.notFound) {
      return res.status(404).json({ error: 'Componente no encontrado.' });
    }

    return res.json({ mensaje: result.statusMessage });
  } catch (error) {
    console.error('Error al cambiar estado de componente:', error);
    return res.status(500).json({ error: 'No fue posible cambiar el estado del componente.' });
  }
}

module.exports = {
  loginAdmin,
  listAdminComponents,
  listVentas,
  listSolicitudes,
  listEntregadas,
  listCanceladas,
  createComponent,
  updateComponent,
  updateStock,
  confirmSale,
  confirmSolicitud,
  markVentaDelivered,
  cancelSolicitud,
  cancelVenta,
  changeComponentState,
};
