const componentesService = require('../services/componentesService');
const { validateCompraInput } = require('../validators/componentesValidator');

async function listComponentes(req, res) {
  try {
    const { categoria } = req.query;
    const rows = await componentesService.listComponentes(categoria);
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener componentes:', error);
    return res.status(500).json({ error: 'No fue posible obtener el catálogo.' });
  }
}

async function listEstaciones(req, res) {
  try {
    const rows = await componentesService.listEstaciones();
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener estaciones:', error);
    return res.status(500).json({ error: 'No fue posible obtener las estaciones de recojo.' });
  }
}

async function comprarComponente(req, res) {
  const validation = validateCompraInput(req.body);

  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const result = await componentesService.registrarSolicitudCompra(validation.value);

    if (result.notFound) {
      return res.status(404).json({ error: 'Componente no encontrado.' });
    }

    if (result.insufficientStock) {
      return res.status(409).json({
        error: 'No hay suficientes unidades disponibles.',
        stockDisponible: result.stockDisponible,
      });
    }

    return res.json({
      mensaje: 'Solicitud de compra registrada. Espera la aprobación del administrador.',
      componente: {
        id: result.componente.id,
        nombre: result.componente.nombre,
        stock: result.componente.stock,
      },
    });
  } catch (error) {
    console.error('Error al registrar la solicitud de compra:', error);
    return res.status(500).json({ error: 'No fue posible registrar la solicitud de compra.' });
  }
}

module.exports = {
  listComponentes,
  listEstaciones,
  comprarComponente,
};
