// Helpers para tablas de referencia (clientes, categorías, estaciones).
// Aceptan pool o connection (mysql2), ya que se usan dentro y fuera de transacciones.

const CLIENTE_ANONIMO = 'Cliente web';

// Devuelve el id del cliente, creándolo si no existe.
// Si el nombre es vacío o "Cliente web", devuelve null (cliente anónimo).
async function getOrCreateCliente(db, nombre, telefono) {
  const name = typeof nombre === 'string' ? nombre.trim() : '';
  if (!name || name.toLowerCase() === CLIENTE_ANONIMO.toLowerCase()) {
    return null;
  }

  const [rows] = await db.execute('SELECT id FROM clientes WHERE nombre = ? LIMIT 1', [name]);
  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await db.execute('INSERT INTO clientes (nombre, telefono) VALUES (?, ?)', [
    name,
    telefono || null,
  ]);
  return result.insertId;
}

// Devuelve el id de la categoría, creándola si no existe.
async function getOrCreateCategoria(db, nombre, tipo = 'componente') {
  const name = typeof nombre === 'string' ? nombre.trim() : '';
  if (!name) {
    return null;
  }

  const [rows] = await db.execute(
    'SELECT id FROM categorias WHERE nombre = ? AND tipo = ? LIMIT 1',
    [name, tipo],
  );
  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await db.execute('INSERT INTO categorias (nombre, tipo) VALUES (?, ?)', [
    name,
    tipo,
  ]);
  return result.insertId;
}

// Devuelve el id de la estación de recojo, creándola si no existe.
// Si no hay estación, devuelve null.
async function getOrCreateEstacion(db, nombre) {
  const name = typeof nombre === 'string' ? nombre.trim() : '';
  if (!name) {
    return null;
  }

  const [rows] = await db.execute('SELECT id FROM estaciones_recojo WHERE nombre = ? LIMIT 1', [
    name,
  ]);
  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await db.execute('INSERT INTO estaciones_recojo (nombre) VALUES (?)', [name]);
  return result.insertId;
}

module.exports = {
  getOrCreateCliente,
  getOrCreateCategoria,
  getOrCreateEstacion,
};
