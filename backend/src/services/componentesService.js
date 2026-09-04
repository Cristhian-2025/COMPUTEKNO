const { pool } = require('../config/db');
const { getOrCreateCliente, getOrCreateEstacion } = require('../lib/dbHelpers');

async function listComponentes(categoria) {
  let query =
    'SELECT id, nombre, descripcion, precio, categoria, categoria_id, stock, imagen FROM componentes WHERE activo = TRUE';
  const params = [];

  if (categoria && categoria.trim() !== '' && categoria.toLowerCase() !== 'todos') {
    query += ' AND LOWER(categoria) = ?';
    params.push(categoria.toLowerCase());
  }

  query += ' ORDER BY categoria, nombre';

  const [rows] = await pool.execute(query, params);
  return rows;
}

// Lista de estaciones de recojo activas (para el frontend)
async function listEstaciones() {
  const [rows] = await pool.execute(
    'SELECT id, nombre FROM estaciones_recojo WHERE activo = TRUE ORDER BY nombre',
  );
  return rows;
}

async function registrarSolicitudCompra({ id, cantidad, cliente, estacion }) {
  const [productos] = await pool.execute(
    'SELECT id, nombre, stock, activo FROM componentes WHERE id = ?',
    [id],
  );

  if (productos.length === 0 || !productos[0].activo) {
    return { notFound: true };
  }

  if (productos[0].stock < cantidad) {
    return {
      insufficientStock: true,
      stockDisponible: productos[0].stock,
    };
  }

  // Referencias normalizadas (clientes y estaciones)
  const clienteId = await getOrCreateCliente(pool, cliente);
  const estacionId = estacion ? await getOrCreateEstacion(pool, estacion) : null;

  await pool.execute(
    `INSERT INTO solicitudes_compras (componente_id, nombre_componente, cantidad, cliente, estacion_recojo, cliente_id, estacion_id, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
    [id, productos[0].nombre, cantidad, cliente, estacion || null, clienteId, estacionId],
  );

  return {
    componente: {
      id: productos[0].id,
      nombre: productos[0].nombre,
      stock: productos[0].stock,
    },
  };
}

module.exports = {
  listComponentes,
  listEstaciones,
  registrarSolicitudCompra,
};
