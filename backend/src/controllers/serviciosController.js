const serviciosService = require('../services/serviciosService');

async function getServicios(req, res) {
  try {
    const { busqueda } = req.query;
    const servicios = await serviciosService.getServicios(busqueda);
    return res.json(servicios);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getServicioById(req, res) {
  try {
    const { id } = req.params;
    const servicio = await serviciosService.getServicioById(Number(id));

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    return res.json(servicio);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getServicios,
  getServicioById,
};
