const { pool } = require('../config/db');

async function getServicios(busqueda) {
  let query =
    'SELECT id, nombre, descripcion, precio, categoria FROM servicios WHERE activo = TRUE';
  const params = [];

  if (busqueda && busqueda.trim() !== '') {
    query += ' AND (LOWER(nombre) LIKE ? OR LOWER(descripcion) LIKE ? OR LOWER(categoria) LIKE ?)';
    const termino = `%${busqueda.toLowerCase()}%`;
    params.push(termino, termino, termino);
  }

  query += ' ORDER BY categoria, nombre';

  const [rows] = await pool.execute(query, params);
  return rows;
}

async function getServicioById(id) {
  const [rows] = await pool.execute(
    'SELECT id, nombre, descripcion, precio, categoria FROM servicios WHERE id = ? AND activo = TRUE',
    [id],
  );

  return rows[0] || null;
}

module.exports = {
  getServicios,
  getServicioById,
};
