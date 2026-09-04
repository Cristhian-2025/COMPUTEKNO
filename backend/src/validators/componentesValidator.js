function validateCompraInput(data) {
  const id = Number(data?.id);
  const cantidad = data?.cantidad === undefined ? 1 : Number(data.cantidad);
  const cliente =
    typeof data?.cliente === 'string' && data.cliente.trim() !== ''
      ? data.cliente.trim()
      : 'Cliente web';
  // Estación de recojo (opcional)
  const estacion =
    typeof data?.estacion === 'string' && data.estacion.trim() !== ''
      ? data.estacion.trim().slice(0, 100)
      : null;

  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
    return {
      error: 'El producto y la cantidad deben ser números enteros positivos.',
    };
  }

  return {
    value: {
      id,
      cantidad,
      cliente,
      estacion,
    },
  };
}

module.exports = {
  validateCompraInput,
};
