const { validateComponent } = require('../src/validators/adminValidator');
const { validateCompraInput } = require('../src/validators/componentesValidator');

describe('Validators', () => {
  test('validateComponent rejects invalid component payloads', () => {
    const invalid = validateComponent({ nombre: '', descripcion: '', categoria: '' });
    expect(invalid.error).toBeDefined();
  });

  test('validateComponent accepts a valid component payload', () => {
    const result = validateComponent({
      nombre: 'SSD Test',
      descripcion: 'Descripción válida',
      categoria: 'Almacenamiento',
      precio: 100,
      stock: 5,
      imagen: 'https://example.com/ssd.jpg',
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      nombre: 'SSD Test',
      categoria: 'Almacenamiento',
      precio: 100,
      stock: 5,
    });
  });

  test('validateCompraInput normalizes values of compra', () => {
    const result = validateCompraInput({
      id: '2',
      cantidad: '3',
      cliente: 'Usuario',
      estacion: 'Bayóvar',
    });
    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      id: 2,
      cantidad: 3,
      cliente: 'Usuario',
      estacion: 'Bayóvar',
    });
  });
});
