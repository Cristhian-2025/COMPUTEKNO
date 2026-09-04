const API_URL = window.COMPUTEKNO_CONFIG?.API_URL || 'http://127.0.0.1:3000';
const tokenKey = 'computekno_admin_token';
const state = { componentes: [], ventas: [], solicitudes: [], entregadas: [], canceladas: [] };

const loginView = document.getElementById('loginView');
const adminView = document.getElementById('adminView');
const loginForm = document.getElementById('loginForm');
const productForm = document.getElementById('productForm');
const adminCatalog = document.getElementById('adminCatalog');
const requestsList = document.getElementById('requestsList');
const salesList = document.getElementById('salesList');
const deliveredList = document.getElementById('deliveredList');
const cancelledList = document.getElementById('cancelledList');

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character],
  );
}

function setMessage(id, message = '', isError = false) {
  const element = document.getElementById(id);
  element.textContent = message;
  element.classList.toggle('error', isError);
  element.classList.toggle('success', Boolean(message) && !isError);
}

function getToken() {
  return localStorage.getItem(tokenKey);
}

function showAdmin() {
  loginView.hidden = true;
  adminView.hidden = false;
}

function logout(showMessage = false) {
  localStorage.removeItem(tokenKey);
  adminView.hidden = true;
  loginView.hidden = false;
  loginForm.reset();
  if (showMessage) {
    setMessage('loginMessage', 'Tu sesión venció. Ingresa nuevamente.', true);
  }
}

async function api(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    logout(true);
  }
  if (!response.ok) {
    throw new Error(data.error || 'No fue posible completar la operación.');
  }
  return data;
}

function resetProductForm() {
  productForm.reset();
  delete productForm.dataset.id;
  document.getElementById('productFormTitle').textContent = 'Agregar producto';
  document.getElementById('cancelEditButton').hidden = true;
  setMessage('productMessage');
}

function renderCatalog() {
  if (!state.componentes.length) {
    adminCatalog.innerHTML = '<p class="empty-state">Aún no hay productos registrados.</p>';
    return;
  }

  adminCatalog.innerHTML = state.componentes
    .map((component) => {
      const active = Boolean(component.activo);
      const stockClass =
        component.stock === 0 ? 'stock-out' : component.stock <= 3 ? 'stock-few' : 'stock-in';
      return `
      <article class="admin-product ${active ? '' : 'is-inactive'}">
        <div class="product-summary">
          <span class="status ${active ? 'active' : 'inactive'}">${active ? 'Activo' : 'Desactivado'}</span>
          <h3>${escapeHtml(component.nombre)}</h3>
          <p>${escapeHtml(component.categoria)} · S/ ${Number(component.precio).toFixed(2)}</p>
        </div>
        <div class="stock-control">
          <label>Stock<input type="number" min="0" step="1" value="${component.stock}" data-stock-input="${component.id}"></label>
          <button class="secondary-btn save-stock" type="button" data-id="${component.id}">Guardar</button>
        </div>
        <div class="stock-control sale-control">
          <label>Cantidad<input type="number" min="1" step="1" value="1" data-venta-input="${component.id}"></label>
          <label>Cliente<input type="text" placeholder="Cliente web" data-venta-cliente="${component.id}"></label>
          <button class="primary-btn confirm-sale" type="button" data-id="${component.id}">Confirmar venta</button>
        </div>
        <p class="stock-label ${stockClass}"><i class="fa-solid fa-boxes-stacked"></i> ${component.stock} unidades</p>
        <div class="product-actions">
          <button class="secondary-btn edit-product" type="button" data-id="${component.id}"><i class="fa-solid fa-pen"></i> Editar</button>
          <button class="${active ? 'danger-btn' : 'primary-btn'} toggle-product" type="button" data-id="${component.id}" data-active="${active}">${active ? 'Desactivar' : 'Activar'}</button>
        </div>
      </article>`;
    })
    .join('');

  document
    .querySelectorAll('.save-stock')
    .forEach((button) => button.addEventListener('click', saveStock));
  document
    .querySelectorAll('.confirm-sale')
    .forEach((button) => button.addEventListener('click', confirmarVenta));
  document
    .querySelectorAll('.edit-product')
    .forEach((button) => button.addEventListener('click', editProduct));
  document
    .querySelectorAll('.toggle-product')
    .forEach((button) => button.addEventListener('click', toggleProduct));
}

async function loadComponents() {
  setMessage('catalogMessage', 'Cargando catálogo...');
  try {
    state.componentes = await api('/api/admin/componentes');
    renderCatalog();
    setMessage('catalogMessage');
  } catch (error) {
    setMessage('catalogMessage', error.message, true);
  }
}

async function loadSalesHistory() {
  try {
    state.ventas = await api('/api/admin/ventas');
    renderSalesHistory();
  } catch (error) {
    if (salesList) {
      salesList.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    }
  }
}

async function loadRequests() {
  try {
    state.solicitudes = await api('/api/admin/solicitudes');
    renderRequests();
  } catch (error) {
    if (requestsList) {
      requestsList.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    }
  }
}

async function loadEntregadas() {
  try {
    state.entregadas = await api('/api/admin/entregadas');
    renderEntregadas();
  } catch (error) {
    if (deliveredList) {
      deliveredList.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    }
  }
}

async function loadCanceladas() {
  try {
    state.canceladas = await api('/api/admin/canceladas');
    renderCanceladas();
  } catch (error) {
    if (cancelledList) {
      cancelledList.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    }
  }
}

function renderRequests() {
  if (!requestsList) {
    return;
  }

  if (!state.solicitudes.length) {
    requestsList.innerHTML = '<p class="empty-state">No hay solicitudes pendientes.</p>';
    return;
  }

  requestsList.innerHTML = state.solicitudes
    .map((solicitud) => {
      const fecha = new Date(solicitud.created_at).toLocaleString('es-PE');
      const estacion = solicitud.estacion_recojo
        ? `<div class="sale-meta">🚆 Recojo: ${escapeHtml(solicitud.estacion_recojo)}</div>`
        : '';

      return `
      <article class="sale-item">
        <strong>${escapeHtml(solicitud.nombre_componente)} · ${solicitud.cantidad} unidad(es)</strong>
        <div class="sale-meta">Cliente: ${escapeHtml(solicitud.cliente || 'Cliente web')} · ${fecha}</div>
        <div class="sale-meta">Estado: Pendiente de aprobación</div>
        ${estacion}
        <div class="request-actions">
          <button class="primary-btn approve-request" type="button" data-id="${solicitud.id}">Aprobar</button>
          <button class="danger-btn cancel-request" type="button" data-id="${solicitud.id}">Cancelar</button>
        </div>
      </article>`;
    })
    .join('');

  document
    .querySelectorAll('.approve-request')
    .forEach((button) => button.addEventListener('click', confirmarSolicitud));
  document
    .querySelectorAll('.cancel-request')
    .forEach((button) => button.addEventListener('click', cancelarSolicitud));
}

function renderSalesHistory() {
  if (!salesList) {
    return;
  }

  if (!state.ventas.length) {
    salesList.innerHTML = '<p class="empty-state">No hay ventas confirmadas todavía.</p>';
    return;
  }

  salesList.innerHTML = state.ventas
    .map((venta) => {
      const fecha = new Date(venta.created_at).toLocaleString('es-PE');
      const total = Number(venta.total || 0).toFixed(2);
      const estacion = venta.estacion_recojo
        ? `<div class="sale-meta">🚆 Recojo: ${escapeHtml(venta.estacion_recojo)}</div>`
        : '';
      return `
      <article class="sale-item">
        <strong>${escapeHtml(venta.nombre_componente)} · ${venta.cantidad} unidad(es)</strong>
        <div class="sale-meta">Cliente: ${escapeHtml(venta.cliente || 'Cliente web')} · Total: S/ ${total} · ${fecha}</div>
        ${estacion}
        <div class="request-actions">
          <button class="secondary-btn deliver-sale" type="button" data-id="${venta.id}">Entregar</button>
          <button class="danger-btn cancel-sale" type="button" data-id="${venta.id}">Cancelar</button>
        </div>
      </article>`;
    })
    .join('');

  document
    .querySelectorAll('.deliver-sale')
    .forEach((button) => button.addEventListener('click', entregarVenta));
  document
    .querySelectorAll('.cancel-sale')
    .forEach((button) => button.addEventListener('click', cancelarVenta));
}

function renderEntregadas() {
  if (!deliveredList) {
    return;
  }

  if (!state.entregadas.length) {
    deliveredList.innerHTML = '<p class="empty-state">Aún no hay ventas entregadas.</p>';
    return;
  }

  deliveredList.innerHTML = state.entregadas
    .map((venta) => {
      const fecha = new Date(venta.entregado_at || venta.created_at).toLocaleString('es-PE');
      const total = Number(venta.total || 0).toFixed(2);
      const estacion = venta.estacion_recojo
        ? `<div class="sale-meta">🚆 Recojo: ${escapeHtml(venta.estacion_recojo)}</div>`
        : '';
      return `
      <article class="sale-item">
        <strong>${escapeHtml(venta.nombre_componente)} · ${venta.cantidad} unidad(es)</strong>
        <div class="sale-meta">Cliente: ${escapeHtml(venta.cliente || 'Cliente web')} · Total: S/ ${total} · Entregado: ${fecha}</div>
        ${estacion}
      </article>`;
    })
    .join('');
}

function renderCanceladas() {
  if (!cancelledList) {
    return;
  }

  if (!state.canceladas.length) {
    cancelledList.innerHTML = '<p class="empty-state">Aún no hay ventas canceladas.</p>';
    return;
  }

  cancelledList.innerHTML = state.canceladas
    .map((venta) => {
      const fecha = new Date(venta.cancelado_at || venta.created_at).toLocaleString('es-PE');
      const estacion = venta.estacion_recojo
        ? `<div class="sale-meta">🚆 Recojo: ${escapeHtml(venta.estacion_recojo)}</div>`
        : '';
      return `
      <article class="sale-item">
        <strong>${escapeHtml(venta.nombre_componente)} · ${venta.cantidad} unidad(es)</strong>
        <div class="sale-meta">Cliente: ${escapeHtml(venta.cliente || 'Cliente web')} · Cancelado: ${fecha}</div>
        ${estacion}
      </article>`;
    })
    .join('');
}

async function saveStock(event) {
  const id = Number(event.currentTarget.dataset.id);
  const input = document.querySelector(`[data-stock-input="${id}"]`);
  const nextStock = Number(input.value);

  if (!Number.isInteger(nextStock) || nextStock < 0) {
    setMessage('catalogMessage', 'El stock debe ser un número entero mayor o igual a cero.', true);
    return;
  }

  try {
    await api(`/api/admin/componentes/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: nextStock }),
    });

    state.componentes = state.componentes.map((component) =>
      component.id === id ? { ...component, stock: nextStock } : component,
    );

    renderCatalog();
    setMessage('catalogMessage', 'Stock actualizado.');
    await loadComponents();
  } catch (error) {
    setMessage('catalogMessage', error.message, true);
  }
}

async function confirmarVenta(event) {
  const id = Number(event.currentTarget.dataset.id);
  const inputCantidad = document.querySelector(`[data-venta-input="${id}"]`);
  const inputCliente = document.querySelector(`[data-venta-cliente="${id}"]`);
  const cantidad = Number(inputCantidad.value);
  const cliente = String(inputCliente?.value || '').trim() || 'Cliente web';

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    setMessage('catalogMessage', 'La cantidad de venta debe ser un entero positivo.', true);
    return;
  }

  const component = state.componentes.find((item) => item.id === id);
  if (!component) {
    return;
  }

  if (
    !confirm(`¿Confirmas la venta de ${cantidad} unidad(es) del producto "${component.nombre}"?`)
  ) {
    return;
  }

  try {
    const resultado = await api(`/api/admin/componentes/${id}/venta`, {
      method: 'POST',
      body: JSON.stringify({ cantidad, cliente }),
    });

    state.componentes = state.componentes.map((item) =>
      item.id === id ? { ...item, stock: resultado.stock } : item,
    );

    localStorage.setItem(
      'computekno:stock-sync',
      JSON.stringify({
        id,
        stock: resultado.stock,
        updatedAt: Date.now(),
      }),
    );

    renderCatalog();
    setMessage('catalogMessage', resultado.mensaje || 'Venta confirmada.');
    await loadComponents();
    await loadRequests();
    await loadSalesHistory();
  } catch (error) {
    setMessage('catalogMessage', error.message, true);
  }
}

async function confirmarSolicitud(event) {
  const id = Number(event.currentTarget.dataset.id);

  if (!confirm('¿Confirmas esta solicitud pendiente y descuenta el stock correspondiente?')) {
    return;
  }

  try {
    const resultado = await api(`/api/admin/solicitudes/${id}/confirmar`, { method: 'POST' });
    localStorage.setItem(
      'computekno:stock-sync',
      JSON.stringify({
        id,
        stock: resultado.stock,
        updatedAt: Date.now(),
      }),
    );

    setMessage('catalogMessage', resultado.mensaje || 'Solicitud aprobada.');
    await loadComponents();
    await loadRequests();
    await loadSalesHistory();
  } catch (error) {
    setMessage('catalogMessage', error.message, true);
  }
}

async function entregarVenta(event) {
  const id = Number(event.currentTarget.dataset.id);

  if (!confirm('¿Confirmas que esta venta fue entregada al cliente?')) {
    return;
  }

  try {
    const resultado = await api(`/api/admin/ventas/${id}/entregar`, { method: 'POST' });
    setMessage('catalogMessage', resultado.mensaje || 'Producto entregado.');
    await loadSalesHistory();
    await loadEntregadas();
  } catch (error) {
    setMessage('catalogMessage', error.message, true);
  }
}

async function cancelarSolicitud(event) {
  const id = Number(event.currentTarget.dataset.id);

  if (!confirm('¿Deseas CANCELAR esta solicitud pendiente?')) {
    return;
  }

  try {
    const resultado = await api(`/api/admin/solicitudes/${id}/cancelar`, { method: 'POST' });
    setMessage('catalogMessage', resultado.mensaje || 'Solicitud cancelada.');
    await loadRequests();
    await loadCanceladas();
  } catch (error) {
    setMessage('catalogMessage', error.message, true);
  }
}

async function cancelarVenta(event) {
  const id = Number(event.currentTarget.dataset.id);

  if (!confirm('¿Deseas CANCELAR esta venta? El stock se devolverá al producto.')) {
    return;
  }

  try {
    const resultado = await api(`/api/admin/ventas/${id}/cancelar`, { method: 'POST' });
    setMessage('catalogMessage', resultado.mensaje || 'Venta cancelada.');
    await loadComponents();
    await loadSalesHistory();
    await loadCanceladas();
  } catch (error) {
    setMessage('catalogMessage', error.message, true);
  }
}

function editProduct(event) {
  const id = Number(event.currentTarget.dataset.id);
  const component = state.componentes.find((item) => item.id === id);
  if (!component) {
    return;
  }
  for (const field of ['nombre', 'categoria', 'precio', 'stock', 'imagen', 'descripcion']) {
    productForm.elements[field].value = component[field] ?? '';
  }
  productForm.dataset.id = id;
  document.getElementById('productFormTitle').textContent = `Editar: ${component.nombre}`;
  document.getElementById('cancelEditButton').hidden = false;
  productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function toggleProduct(event) {
  const id = Number(event.currentTarget.dataset.id);
  const active = event.currentTarget.dataset.active === 'true';
  const action = active ? 'desactivar' : 'activar';
  if (!confirm(`¿Deseas ${action} este producto?`)) {
    return;
  }
  try {
    await api(`/api/admin/componentes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: !active }),
    });
    setMessage('catalogMessage', `Producto ${active ? 'desactivado' : 'activado'}.`);
    await loadComponents();
    await loadSalesHistory();
  } catch (error) {
    setMessage('catalogMessage', error.message, true);
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('loginMessage');
  const form = new FormData(loginForm);
  try {
    const result = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: form.get('username'), password: form.get('password') }),
    });
    localStorage.setItem(tokenKey, result.token);
    showAdmin();
    loadComponents();
    loadRequests();
    loadSalesHistory();
    loadEntregadas();
    loadCanceladas();
  } catch (error) {
    setMessage('loginMessage', error.message, true);
  }
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(productForm);
  const body = Object.fromEntries(form.entries());
  body.precio = Number(body.precio);
  body.stock = Number(body.stock);
  const editingId = productForm.dataset.id;

  try {
    await api(editingId ? `/api/admin/componentes/${editingId}` : '/api/admin/componentes', {
      method: editingId ? 'PUT' : 'POST',
      body: JSON.stringify(body),
    });
    setMessage('productMessage', editingId ? 'Producto actualizado.' : 'Producto agregado.');
    resetProductForm();
    await loadComponents();
    await loadSalesHistory();
  } catch (error) {
    setMessage('productMessage', error.message, true);
  }
});

document.getElementById('cancelEditButton').addEventListener('click', resetProductForm);
document.getElementById('refreshButton').addEventListener('click', async () => {
  await loadComponents();
  await loadRequests();
  await loadSalesHistory();
  await loadEntregadas();
  await loadCanceladas();
});
document.getElementById('logoutButton').addEventListener('click', () => logout());

if (getToken()) {
  showAdmin();
  loadComponents();
  loadRequests();
  loadSalesHistory();
  loadEntregadas();
  loadCanceladas();
}
