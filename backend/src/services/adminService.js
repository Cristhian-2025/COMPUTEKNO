const { pool } = require('../config/db');
const { getOrCreateCliente, getOrCreateCategoria } = require('../lib/dbHelpers');
const { createToken, verifyAdminCredentials } = require('../middleware/adminAuth');

async function loginAdmin(username, password) {
  if (!verifyAdminCredentials(username, password)) {
    return {
      status: 401,
      payload: { error: 'Usuario o contraseña incorrectos.' },
    };
  }

  return {
    status: 200,
    payload: {
      token: createToken(username),
      expiresIn: process.env.ADMIN_TOKEN_EXPIRES || '8h',
    },
  };
}

async function listAdminComponents() {
  const [rows] = await pool.execute(
    'SELECT id, nombre, descripcion, precio, categoria, stock, imagen, activo FROM componentes ORDER BY activo DESC, categoria, nombre',
  );

  return rows;
}

async function listVentas() {
  const [rows] = await pool.execute(
    `SELECT id, componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, estacion_recojo, cliente_id, estacion_id, created_at
     FROM ventas
     ORDER BY created_at DESC LIMIT 50`,
  );

  return rows;
}

async function listSolicitudes() {
  const [rows] = await pool.execute(
    `SELECT id, componente_id, nombre_componente, cantidad, cliente, estacion_recojo, cliente_id, estacion_id, estado, created_at
     FROM solicitudes_compras
     WHERE estado = 'pendiente'
     ORDER BY created_at DESC`,
  );

  return rows;
}

async function listEntregadas() {
  const [rows] = await pool.execute(
    `SELECT id, componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, estacion_recojo, cliente_id, estacion_id, entregado_at
     FROM ventas_entregadas
     ORDER BY entregado_at DESC LIMIT 100`,
  );

  return rows;
}

async function listCanceladas() {
  const [rows] = await pool.execute(
    `SELECT id, componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, estacion_recojo, cliente_id, estacion_id, cancelado_at
     FROM ventas_canceladas
     ORDER BY cancelado_at DESC LIMIT 100`,
  );

  return rows;
}

async function createComponent(data) {
  const categoriaId = await getOrCreateCategoria(pool, data.categoria, 'componente');

  const [result] = await pool.execute(
    'INSERT INTO componentes (nombre, descripcion, precio, categoria, categoria_id, stock, imagen, activo) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
    [
      data.nombre,
      data.descripcion,
      data.precio,
      data.categoria,
      categoriaId,
      data.stock,
      data.imagen,
    ],
  );

  const [rows] = await pool.execute(
    'SELECT id, nombre, descripcion, precio, categoria, stock, imagen, activo FROM componentes WHERE id = ?',
    [result.insertId],
  );

  return rows[0];
}

async function updateComponent(id, data) {
  const categoriaId = await getOrCreateCategoria(pool, data.categoria, 'componente');

  const [result] = await pool.execute(
    'UPDATE componentes SET nombre = ?, descripcion = ?, precio = ?, categoria = ?, categoria_id = ?, stock = ?, imagen = ? WHERE id = ?',
    [
      data.nombre,
      data.descripcion,
      data.precio,
      data.categoria,
      categoriaId,
      data.stock,
      data.imagen,
      id,
    ],
  );

  if (result.affectedRows === 0) {
    return { notFound: true };
  }

  return { ok: true };
}

async function updateStock(id, stock) {
  const [result] = await pool.execute('UPDATE componentes SET stock = ? WHERE id = ?', [stock, id]);

  if (result.affectedRows === 0) {
    return { notFound: true };
  }

  return { ok: true, stock };
}

async function confirmSale(id, cantidad, cliente) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [componentes] = await connection.execute(
      'SELECT id, nombre, descripcion, precio, categoria, stock, activo FROM componentes WHERE id = ? FOR UPDATE',
      [id],
    );

    if (componentes.length === 0 || !componentes[0].activo) {
      await connection.rollback();
      return { notFound: true };
    }

    if (componentes[0].stock < cantidad) {
      await connection.rollback();
      return {
        conflict: true,
        stockDisponible: componentes[0].stock,
      };
    }

    const [updateResult] = await connection.execute(
      `UPDATE componentes
       SET stock = stock - ?
       WHERE id = ? AND activo = TRUE AND stock >= ?`,
      [cantidad, id, cantidad],
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return {
        conflict: true,
        stockDisponible: componentes[0].stock,
      };
    }

    const precioUnitario = Number(componentes[0].precio);
    const total = precioUnitario * cantidad;
    const clienteId = await getOrCreateCliente(connection, cliente);

    await connection.execute(
      `INSERT INTO ventas (componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, cliente_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, componentes[0].nombre, cantidad, precioUnitario, total, cliente, clienteId],
    );

    await connection.commit();

    const [rows] = await connection.execute(
      'SELECT id, nombre, stock FROM componentes WHERE id = ?',
      [id],
    );

    return {
      ok: true,
      stock: rows[0].stock,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function confirmSolicitud(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [solicitud] = await connection.execute(
      `SELECT id, componente_id, nombre_componente, cantidad, cliente, estacion_recojo, cliente_id, estacion_id, estado FROM solicitudes_compras
       WHERE id = ? AND estado = 'pendiente' FOR UPDATE`,
      [id],
    );

    if (solicitud.length === 0) {
      await connection.rollback();
      return { notFound: true };
    }

    const [componentes] = await connection.execute(
      'SELECT id, nombre, precio, stock, activo FROM componentes WHERE id = ? FOR UPDATE',
      [solicitud[0].componente_id],
    );

    if (componentes.length === 0 || !componentes[0].activo) {
      await connection.rollback();
      return { notFound: true };
    }

    if (componentes[0].stock < solicitud[0].cantidad) {
      await connection.rollback();
      return {
        conflict: true,
        stockDisponible: componentes[0].stock,
      };
    }

    const [updateResult] = await connection.execute(
      `UPDATE componentes
       SET stock = stock - ?
       WHERE id = ? AND activo = TRUE AND stock >= ?`,
      [solicitud[0].cantidad, solicitud[0].componente_id, solicitud[0].cantidad],
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return {
        conflict: true,
        stockDisponible: componentes[0].stock,
      };
    }

    const total = Number(componentes[0].precio) * solicitud[0].cantidad;

    await connection.execute(
      `INSERT INTO ventas (componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, estacion_recojo, cliente_id, estacion_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        solicitud[0].componente_id,
        solicitud[0].nombre_componente,
        solicitud[0].cantidad,
        componentes[0].precio,
        total,
        solicitud[0].cliente,
        solicitud[0].estacion_recojo || null,
        solicitud[0].cliente_id || null,
        solicitud[0].estacion_id || null,
      ],
    );

    // El registro se MUEVE de "pendiente" (solicitudes_compras) a "confirmada" (ventas)
    await connection.execute('DELETE FROM solicitudes_compras WHERE id = ?', [id]);

    await connection.commit();

    const [rows] = await connection.execute(
      'SELECT id, nombre, stock FROM componentes WHERE id = ?',
      [solicitud[0].componente_id],
    );

    return {
      ok: true,
      stock: rows[0].stock,
      estado: 'confirmada',
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function markVentaDelivered(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ventas] = await connection.execute(
      `SELECT id, componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, estacion_recojo, cliente_id, estacion_id
       FROM ventas WHERE id = ? FOR UPDATE`,
      [id],
    );

    if (ventas.length === 0) {
      await connection.rollback();
      return { notFound: true };
    }

    // Mover de "confirmada" (ventas) a "entregada" (ventas_entregadas)
    await connection.execute(
      `INSERT INTO ventas_entregadas (componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, estacion_recojo, cliente_id, estacion_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ventas[0].componente_id,
        ventas[0].nombre_componente,
        ventas[0].cantidad,
        ventas[0].precio_unitario,
        ventas[0].total,
        ventas[0].cliente,
        ventas[0].estacion_recojo || null,
        ventas[0].cliente_id || null,
        ventas[0].estacion_id || null,
      ],
    );

    await connection.execute('DELETE FROM ventas WHERE id = ?', [id]);

    await connection.commit();

    return { ok: true, estado: 'entregado' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cancelSolicitud(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [solicitud] = await connection.execute(
      `SELECT id, componente_id, nombre_componente, cantidad, cliente, estacion_recojo, cliente_id, estacion_id, estado
       FROM solicitudes_compras WHERE id = ? AND estado = 'pendiente' FOR UPDATE`,
      [id],
    );

    if (solicitud.length === 0) {
      await connection.rollback();
      return { notFound: true };
    }

    // Mover de "pendiente" (solicitudes_compras) a "cancelada" (ventas_canceladas)
    await connection.execute(
      `INSERT INTO ventas_canceladas (componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, estacion_recojo, cliente_id, estacion_id)
       VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?)`,
      [
        solicitud[0].componente_id,
        solicitud[0].nombre_componente,
        solicitud[0].cantidad,
        solicitud[0].cliente,
        solicitud[0].estacion_recojo || null,
        solicitud[0].cliente_id || null,
        solicitud[0].estacion_id || null,
      ],
    );

    await connection.execute('DELETE FROM solicitudes_compras WHERE id = ?', [id]);

    await connection.commit();

    return { ok: true, estado: 'cancelado' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cancelVenta(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ventas] = await connection.execute(
      `SELECT id, componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, estacion_recojo, cliente_id, estacion_id
       FROM ventas WHERE id = ? FOR UPDATE`,
      [id],
    );

    if (ventas.length === 0) {
      await connection.rollback();
      return { notFound: true };
    }

    // Devolver el stock al componente (la venta se cancela)
    await connection.execute('UPDATE componentes SET stock = stock + ? WHERE id = ?', [
      ventas[0].cantidad,
      ventas[0].componente_id,
    ]);

    // Mover de "confirmada" (ventas) a "cancelada" (ventas_canceladas)
    await connection.execute(
      `INSERT INTO ventas_canceladas (componente_id, nombre_componente, cantidad, precio_unitario, total, cliente, estacion_recojo, cliente_id, estacion_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ventas[0].componente_id,
        ventas[0].nombre_componente,
        ventas[0].cantidad,
        ventas[0].precio_unitario,
        ventas[0].total,
        ventas[0].cliente,
        ventas[0].estacion_recojo || null,
        ventas[0].cliente_id || null,
        ventas[0].estacion_id || null,
      ],
    );

    await connection.execute('DELETE FROM ventas WHERE id = ?', [id]);

    await connection.commit();

    const [rows] = await connection.execute('SELECT stock FROM componentes WHERE id = ?', [
      ventas[0].componente_id,
    ]);

    return { ok: true, estado: 'cancelado', stock: rows[0].stock };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function changeComponentState(id, activo) {
  const [result] = await pool.execute('UPDATE componentes SET activo = ? WHERE id = ?', [
    activo,
    id,
  ]);

  if (result.affectedRows === 0) {
    return { notFound: true };
  }

  return {
    ok: true,
    statusMessage: activo ? 'Componente activado.' : 'Componente desactivado.',
  };
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
