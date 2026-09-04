function validateComponent(data) {
  const nombre = String(data?.nombre || '').trim();
  const descripcion = String(data?.descripcion || '').trim();
  const categoria = String(data?.categoria || '').trim();
  const imagen = String(data?.imagen || '').trim() || null;
  const precio = Number(data?.precio);
  const stock = Number(data?.stock);

  if (
    !nombre ||
    !descripcion ||
    !categoria ||
    nombre.length > 255 ||
    categoria.length > 100 ||
    descripcion.length > 10000
  ) {
    return { error: 'Completa nombre, descripción y categoría con valores válidos.' };
  }

  if (!Number.isFinite(precio) || precio < 0) {
    return { error: 'El precio debe ser un número igual o mayor que cero.' };
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return { error: 'El stock debe ser un número entero igual o mayor que cero.' };
  }

  if (imagen && imagen.length > 500) {
    return { error: 'La URL de imagen es demasiado larga.' };
  }

  return {
    value: {
      nombre,
      descripcion,
      categoria,
      imagen,
      precio,
      stock,
    },
  };
}

module.exports = {
  validateComponent,
};
