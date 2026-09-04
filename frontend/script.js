/* exported solicitarServicio */
// --- BUSCADOR DE SERVICIOS ---
const API_URL = window.COMPUTEKNO_CONFIG?.API_URL || 'http://127.0.0.1:3000';
const IMAGEN_COMPONENTE_POR_DEFECTO = 'assets/26157-MK10212A.jpg';

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character],
  );
}

function formatearDescripcionComponente(descripcion) {
  const texto = String(descripcion || '').trim();
  if (!texto) {
    return 'Información técnica no disponible.';
  }

  const frasesBase = texto
    .replace(/\.\s*$/, '')
    .split(/\.\s+/)
    .map((frase) => escapeHtml(frase.trim()))
    .filter(Boolean);
  const frases = frasesBase
    .map((frase, indice) =>
      indice < frasesBase.length - 1
        ? `${frase} <strong class="description-separator">.</strong>`
        : `${frase}.`,
    )
    .join(' ');

  return frases;
}

// --- CONFIGURACIÓN DE WHATSAPP ---
// Tu número de WhatsApp (solo dígitos, con código de país, sin + ni espacios)
const WHATSAPP_NUMBER = '51901348331';
// Número con formato para mostrar al cliente
const WHATSAPP_NUMBER_DISPLAY = '+51 901 348 331';
// 📌 Imagen real de tu QR + número (guardada en frontend/assets/)
const QR_PAGO_IMAGEN = 'assets/QR DE PAGO.png';

// Componente que el cliente está viendo / queriendo comprar
let productoActual = null;

// Estaciones del Metro de Lima (Línea 1) para el recojo — edita esta lista si lo necesitas
const ESTACIONES = [
  'Bayóvar',
  'Pirámide del Sol',
  'Los Jardines',
  'San Carlos',
  'San Martín',
  'Santa Rosa',
  'Colectora Industrial',
  'El Ángel',
  'Presbítero Maestro',
  'Caja de Agua',
  'Miguel Iglesias',
  'Gamarra',
  '28 de Julio',
  'Nicolás Arriola',
  'La Cultura',
  'San Borja Sur',
  'Angamos',
  'Cabitos',
  'Ayacucho',
  'Jorge Chávez',
  'María Auxiliadora',
  'San Juan',
  'Parque Industrial',
  'Villa El Salvador',
];

// Estación de recojo seleccionada por el cliente (null = sin seleccionar)
let estacionSeleccionada = null;

// Estaciones cargadas desde la BD (lista de respaldo: ESTACIONES)
let estacionesDisponibles = [];

// Carga las estaciones de recojo desde el backend (tabla estaciones_recojo)
async function cargarEstacionesDesdeAPI() {
  try {
    const response = await fetch(`${API_URL}/api/estaciones`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        estacionesDisponibles = data.map((e) => e.nombre);
      }
    }
  } catch (error) {
    console.warn('No se pudieron cargar las estaciones desde el servidor:', error);
  }
}

const inputBusqueda = document.getElementById('inputBusqueda');
const inputBusquedaNavbar = document.getElementById('inputBusquedaNavbar');
const resultadosContainer = document.getElementById('resultadosServicios');
const resultadosNavbar = document.getElementById('resultadosNavbar');

// Función principal de búsqueda
async function buscarServicios(termino, contenedor) {
  // Limpiar resultados si está vacío
  if (!termino || termino.trim() === '') {
    if (contenedor === resultadosNavbar) {
      contenedor.innerHTML = '';
    } else {
      contenedor.innerHTML =
        '<p style="color: #94a3b8; grid-column: 1 / -1; text-align: center; font-size: 1rem;">Escribe para ver los precios y servicios disponibles.</p>';
    }
    return;
  }

  try {
    // Llamada a la API
    const response = await fetch(
      `${API_URL}/api/servicios?busqueda=${encodeURIComponent(termino)}`,
    );

    if (!response.ok) {
      throw new Error('Error en la red');
    }

    const servicios = await response.json();

    // Limpiar contenedor
    contenedor.innerHTML = '';

    // Si no hay resultados
    if (servicios.length === 0) {
      const mensaje =
        contenedor === resultadosNavbar
          ? 'Sin resultados. Intenta con otros términos.'
          : 'No encontramos servicios con ese término. Intenta con "PC", "Laptop" o "Windows".';
      const msgClass = contenedor === resultadosNavbar ? 'navbar-search-empty' : '';
      contenedor.innerHTML = `<p class="${msgClass}" style="${contenedor === resultadosNavbar ? '' : 'color: #94a3b8; grid-column: 1 / -1; text-align: center;'}">${mensaje}</p>`;
      return;
    }

    // Generar tarjetas
    servicios.forEach((serv) => {
      const div = document.createElement('div');
      div.className =
        contenedor === resultadosNavbar ? 'servicio-card navbar-servicio-card' : 'servicio-card';

      div.innerHTML = `
        <div class="servicio-info">
          <h3>${serv.nombre}</h3>
          <p>${serv.descripcion}</p>
        </div>
        <div class="servicio-price">
          <span class="precio-tag">S/ ${serv.precio}</span>
          <button class="btn-solicitar" onclick="solicitarServicio('${serv.nombre}')">
            <span>Solicitar</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
          </button>
        </div>
      `;

      contenedor.appendChild(div);
    });
  } catch (error) {
    console.error('Error al buscar:', error);
    if (contenedor === resultadosNavbar) {
      contenedor.innerHTML =
        '<p class="navbar-search-empty" style="color: #ef4444; font-weight: 600;">Error al conectar con el servidor.</p>';
    } else {
      contenedor.innerHTML =
        '<p style="color: #ef4444; grid-column: 1 / -1; text-align: center; font-weight: 600;">Error al conectar con el servidor.</p>';
    }
  }
}

// Listener con debounce para buscador de servicios
let timeoutId;
if (inputBusqueda) {
  inputBusqueda.addEventListener('input', (e) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => buscarServicios(e.target.value, resultadosContainer), 300);
  });
}

// Listener con debounce para buscador del navbar
let timeoutIdNavbar;
if (inputBusquedaNavbar) {
  inputBusquedaNavbar.addEventListener('input', (e) => {
    clearTimeout(timeoutIdNavbar);
    timeoutIdNavbar = setTimeout(() => buscarServicios(e.target.value, resultadosNavbar), 300);
  });
}

// Función para abrir WhatsApp
function solicitarServicio(nombreServicio) {
  // Número corporativo de COMPUTEKNO
  const telefono = '51901348331';

  const mensaje = `Hola COMPUTEKNO, me interesa el servicio de: *${nombreServicio}*. ¿Podrían darme más información?`;
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, '_blank');
}

// Ocultar resultados al hacer clic fuera de los buscadores
document.addEventListener('click', (e) => {
  if (
    resultadosContainer &&
    !resultadosContainer.contains(e.target) &&
    e.target !== inputBusqueda
  ) {
    resultadosContainer.innerHTML =
      '<p style="color: #94a3b8; grid-column: 1 / -1; text-align: center; font-size: 1rem;">Escribe para ver los precios y servicios disponibles.</p>';
  }
  if (
    resultadosNavbar &&
    !resultadosNavbar.contains(e.target) &&
    e.target !== inputBusquedaNavbar
  ) {
    resultadosNavbar.innerHTML = '';
  }
});

// --- Menú Hamburguesa ---
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', mobileMenu);

function mobileMenu() {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('active');
}

// Cerrar el menú al hacer click en un enlace
const navLink = document.querySelectorAll('.nav-links li a');

navLink.forEach((n) => n.addEventListener('click', closeMenu));

function closeMenu() {
  hamburger.classList.remove('active');
  navLinks.classList.remove('active');
}

// --- Animación al Scroll (Fade-in) ---
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1,
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // Dejar de observar una vez que ya es visible
    }
  });
}, observerOptions);

// Aplicar fade-in a elementos principales
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section');
  const cards = document.querySelectorAll('.service-card');
  const features = document.querySelectorAll('.feature-item');

  sections.forEach((section) => {
    // No aplicamos fade in al hero si ya está en pantalla inicialmente,
    // pero para mantenerlo simple aplicamos a todo section
    if (section.id !== 'inicio') {
      section.classList.add('fade-in');
      observer.observe(section);
    }
  });

  cards.forEach((card, index) => {
    card.classList.add('fade-in');
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
  });

  features.forEach((feature, index) => {
    feature.classList.add('fade-in');
    feature.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(feature);
  });

  // Cargar componentes e inicializar filtros
  cargarComponentes('Todos');
  inicializarFiltros();

});

// --- Cambio de estilo en Navbar al hacer scroll ---
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// --- SECCIÓN DE VENTA DE COMPONENTES ---
const catalogoContainer = document.getElementById('catalogoComponentes');
const filterBtns = document.querySelectorAll('.filter-btn');
let cargaComponentesActual = 0;

// Guarda los componentes por ID para conocer nombre/precio al hacer clic en "Comprar"
const mapaComponentes = {};

async function cargarComponentes(categoria = 'Todos') {
  if (!catalogoContainer) {
    return;
  }

  const requestId = ++cargaComponentesActual;
  const categoriaActiva =
    document.querySelector('.filter-btn.active')?.dataset.category || categoria;

  if (catalogoContainer.dataset.categoria !== categoriaActiva) {
    catalogoContainer.dataset.categoria = categoriaActiva;
  }

  // Mantener el contenido existente visible mientras se refresca la data.
  catalogoContainer.classList.add('is-loading');

  try {
    const response = await fetch(
      `${API_URL}/api/componentes?categoria=${encodeURIComponent(categoriaActiva)}`,
    );
    if (!response.ok) {
      throw new Error('Error al obtener componentes');
    }

    const componentes = await response.json();

    if (requestId !== cargaComponentesActual) {
      return;
    }

    const fragment = document.createDocumentFragment();

    if (componentes.length === 0) {
      const mensaje = document.createElement('p');
      mensaje.className = 'error-catalog';
      mensaje.textContent = 'No se encontraron componentes en esta categoría.';
      fragment.appendChild(mensaje);
      catalogoContainer.replaceChildren(fragment);
      return;
    }

    componentes.forEach((comp) => {
      // Guardar referencia del componente para el flujo de compra
      mapaComponentes[comp.id] = comp;

      const card = document.createElement('div');
      card.className = 'product-card';

      const stockDisponible = Number(comp.stock) > 0;
      const stockClass = stockDisponible
        ? comp.stock <= 3
          ? 'stock-few'
          : 'stock-in'
        : 'stock-out';
      const stockTexto = stockDisponible ? `Disponible: ${comp.stock}` : 'Sin stock';

      card.innerHTML = `
        <div class="product-image-wrapper">
          <img src="${comp.imagen || IMAGEN_COMPONENTE_POR_DEFECTO}" alt="${comp.nombre}" class="product-image" loading="lazy" onerror="this.onerror=null; this.src='${IMAGEN_COMPONENTE_POR_DEFECTO}'">
          <span class="product-badge ${stockClass}">${stockTexto}</span>
        </div>
        <div class="product-info">
          <span class="product-category">${comp.categoria}</span>
          <h3 class="product-title">${comp.nombre}</h3>
          <div class="product-description">
            <span class="product-desc-label">Descripción</span>
            <p class="product-desc">${formatearDescripcionComponente(comp.descripcion)}</p>
          </div>
          <div class="product-secure">
            <div class="secure-title"><i class="fa-solid fa-lock"></i> Compra 100% Segura:</div>
            <ul class="secure-list">
              <li><i class="fa-solid fa-check"></i> Emite <strong>Factura o Boleta Electrónica</strong> (SUNAT).</li>
              <li><i class="fa-solid fa-check"></i> Garantía 1 año.</li>
            </ul>
          </div>
        </div>
        <div class="product-footer">
          <div class="product-price-wrapper">
            <span class="price-label">Precio</span>
            <span class="product-price">S/ ${comp.precio}</span>
            <span class="product-stock ${stockClass}">
              <i class="fa-solid fa-boxes-stacked"></i> ${stockDisponible ? `${comp.stock} unidades disponibles` : 'Sin stock'}
            </span>
          </div>
          <button class="btn-buy" type="button" onclick="comprarComponente(${comp.id})" ${stockDisponible ? '' : 'disabled'}>
            <i class="fa-solid fa-cart-shopping"></i> ${stockDisponible ? 'Comprar' : 'Sin stock'}
          </button>
        </div>
      `;

      fragment.appendChild(card);
    });

    catalogoContainer.replaceChildren(fragment);
  } catch (error) {
    console.error('Error al cargar componentes:', error);
    if (requestId !== cargaComponentesActual) {
      return;
    }

    const mensaje = document.createElement('p');
    mensaje.className = 'error-catalog';
    mensaje.textContent =
      'Error al conectar con el catálogo de componentes. Asegúrate de que el servidor esté activo.';
    catalogoContainer.replaceChildren(mensaje);
  } finally {
    if (requestId === cargaComponentesActual) {
      catalogoContainer.classList.remove('is-loading');
    }
  }
}

async function cargarProductos(categoria = 'Todos') {
  return cargarComponentes(categoria);
}

async function comprarComponente(id) {
  const comp = mapaComponentes[id];
  if (!comp) {
    console.error('Componente no encontrado en el catálogo');
    return;
  }

  // Guardar el producto que el cliente está viendo
  productoActual = comp;

  // Paso 1: selección de estación de recojo (opcional)
  abrirModalEstacion();
}

// Registra la solicitud de forma silenciosa (visible en el panel admin),
// incluyendo la estación de recojo seleccionada.
function registrarSolicitudSilenciosa() {
  const comp = productoActual;
  if (!comp) {
    return;
  }

  fetch(`${API_URL}/api/componentes/comprar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: comp.id,
      cantidad: 1,
      estacion: estacionSeleccionada,
    }),
  }).catch((error) => console.warn('No se pudo registrar la solicitud en el servidor:', error));
}

// --- MODAL DE ESTACIÓN DE RECOJO ---
function abrirModalEstacion() {
  const modal = document.getElementById('modalEstacion');
  const lista = document.getElementById('listaEstaciones');
  const input = document.getElementById('inputBusquedaEstacion');

  // Usar las estaciones de la BD; si no hay, usar la lista de respaldo
  const estaciones = estacionesDisponibles.length ? estacionesDisponibles : ESTACIONES;

  // Renderizar las estaciones
  lista.innerHTML = '';
  estaciones.forEach((estacion) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'station-option' + (estacionSeleccionada === estacion ? ' selected' : '');
    btn.dataset.estacion = estacion;
    btn.innerHTML = `<i class="fa-solid fa-train"></i><span>${estacion}</span><i class="fa-solid fa-check station-check"></i>`;
    btn.addEventListener('click', () => seleccionarEstacion(estacion));
    lista.appendChild(btn);
  });

  if (input) {
    input.value = '';
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function cerrarModalEstacion() {
  const modal = document.getElementById('modalEstacion');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function seleccionarEstacion(estacion) {
  estacionSeleccionada = estacion;
  document.querySelectorAll('.station-option').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.estacion === estacion);
  });
}

// Avanzar al modal de opciones (con o sin estación seleccionada)
function omitirEstacion() {
  cerrarModalEstacion();
  registrarSolicitudSilenciosa();
  abrirModalOpciones(productoActual);
}

function continuarTrasEstacion() {
  omitirEstacion();
}

// Buscador de estaciones
const inputBusquedaEstacion = document.getElementById('inputBusquedaEstacion');
if (inputBusquedaEstacion) {
  inputBusquedaEstacion.addEventListener('input', () => {
    const termino = inputBusquedaEstacion.value.trim().toLowerCase();
    document.querySelectorAll('.station-option').forEach((btn) => {
      btn.style.display = btn.dataset.estacion.toLowerCase().includes(termino) ? '' : 'none';
    });
  });
}

// --- FLUJO WHATSAPP: MODAL DE OPCIONES ---
function abrirModalOpciones(comp) {
  const modal = document.getElementById('modalOpciones');
  const info = document.getElementById('opcionesProductoInfo');
  if (info && comp) {
    info.textContent = `${comp.nombre} — S/ ${comp.precio}`;
  }
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function cerrarModalOpciones() {
  const modal = document.getElementById('modalOpciones');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Opción 1: Pagar → muestra QR + número de celular
function pagarProducto() {
  cerrarModalOpciones();
  abrirModalPago();
}

// Texto de la estación para los mensajes de WhatsApp (si el cliente eligió una)
function textoEstacion() {
  return estacionSeleccionada
    ? ` Retiraré mi producto en la estación *${estacionSeleccionada}*.`
    : '';
}

// --- MODAL DE PAGO (QR + NÚMERO) ---
function abrirModalPago() {
  const modal = document.getElementById('modalPago');
  const img = document.getElementById('qrPagoImagen');
  const info = document.getElementById('productoPagoInfo');
  const estacionInfo = document.getElementById('estacionPagoInfo');
  const btn = document.getElementById('btnWhatsAppPago');

  if (img) {
    img.src = QR_PAGO_IMAGEN;
  }

  if (productoActual && info) {
    info.textContent = `Producto: ${productoActual.nombre} — S/ ${productoActual.precio}`;
  }

  if (estacionInfo) {
    estacionInfo.textContent = estacionSeleccionada
      ? `🚆 Recojo en estación: ${estacionSeleccionada}`
      : '🚆 Sin estación de recojo seleccionada';
  }

  if (btn && productoActual) {
    const mensaje = `¡Hola COMPUTEKNO! 👋 Vengo de su página web.${textoEstacion()}`;
    btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function cerrarModalPago() {
  const modal = document.getElementById('modalPago');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function copiarNumero() {
  if (!navigator.clipboard) {
    return;
  }
  navigator.clipboard.writeText(WHATSAPP_NUMBER_DISPLAY).then(() => {
    const icon = document.querySelector('.btn-copy i');
    if (icon) {
      icon.className = 'fa-solid fa-check';
      setTimeout(() => {
        icon.className = 'fa-solid fa-copy';
      }, 1500);
    }
  });
}

// Opciones que abren WhatsApp con un mensaje prellenado
function consultarProducto() {
  const comp = productoActual;
  const mensaje = comp
    ? `¡Hola COMPUTEKNO! 👋 Vengo de su página web. Quisiera consultar sobre el producto *${comp.nombre}* (S/ ${comp.precio}).${textoEstacion()}`
    : '¡Hola COMPUTEKNO! 👋 Vengo de su página web. Quisiera hacer una consulta.';
  abrirWhatsApp(mensaje);
  cerrarModalOpciones();
}

function servicioTecnico() {
  const comp = productoActual;
  const mensaje = comp
    ? `¡Hola COMPUTEKNO! 👋 Vengo de su página web. Necesito asistencia de servicio técnico para el producto *${comp.nombre}* (S/ ${comp.precio}).${textoEstacion()}`
    : '¡Hola COMPUTEKNO! 👋 Vengo de su página web. Necesito servicio técnico.';
  abrirWhatsApp(mensaje);
  cerrarModalOpciones();
}

function atencionPersonalizada() {
  const comp = productoActual;
  const mensaje = comp
    ? `¡Hola COMPUTEKNO! 👋 Vengo de su página web. Me gustaría recibir atención personalizada sobre el producto *${comp.nombre}* (S/ ${comp.precio}).${textoEstacion()}`
    : '¡Hola COMPUTEKNO! 👋 Vengo de su página web. Me gustaría atención personalizada.';
  abrirWhatsApp(mensaje);
  cerrarModalOpciones();
}

function abrirWhatsApp(mensaje) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

// Cerrar modales al hacer clic fuera o con la tecla ESC
document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (overlay.id === 'modalOpciones') {
        cerrarModalOpciones();
      } else if (overlay.id === 'modalPago') {
        cerrarModalPago();
      } else if (overlay.id === 'modalEstacion') {
        omitirEstacion();
      }
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modalEstacion = document.getElementById('modalEstacion');
    if (modalEstacion && modalEstacion.classList.contains('active')) {
      omitirEstacion();
      return;
    }
    cerrarModalOpciones();
    cerrarModalPago();
  }
});

// Configurar los botones de filtrado
function inicializarFiltros() {
  if (!filterBtns) {
    return;
  }
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Remover clase activa de todos
      filterBtns.forEach((b) => b.classList.remove('active'));
      // Añadir clase activa al botón presionado
      btn.classList.add('active');

      const categoria = btn.getAttribute('data-category');
      cargarComponentes(categoria);
    });
  });
}

// Abrir WhatsApp con mensaje personalizado del componente
function solicitarComponente(nombre, precio) {
  const telefono = '51901348331';
  const mensaje = `Hola COMPUTEKNO, estoy interesado en comprar el componente: *${nombre}* (S/ ${precio}). ¿Cuentan con stock disponible?`;
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

// --- ANIMACIÓN DE CONTADORES (ESTADÍSTICAS) ---
function animarContadores() {
  const counters = document.querySelectorAll('.stat-number');

  counters.forEach((counter) => {
    const target = +counter.getAttribute('data-target');
    const duration = 2000; // 2 segundos
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * target);

      counter.textContent = current.toLocaleString('es-PE');

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target.toLocaleString('es-PE');
      }
    }

    requestAnimationFrame(updateCounter);
  });
}

// Observer para activar contadores solo cuando la sección es visible
let statsAnimated = false;
const statsSection = document.getElementById('estadisticas');

if (statsSection) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsAnimated) {
          statsAnimated = true;
          animarContadores();
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 },
  );

  statsObserver.observe(statsSection);
}

// --- FILTROS DE GALERÍA ---
function inicializarGaleriaFiltros() {
  const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (!galleryFilterBtns.length || !galleryItems.length) {
    return;
  }

  galleryFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Actualizar botón activo
      galleryFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      galleryItems.forEach((item) => {
        if (filterValue === 'all' || item.getAttribute('data-filter') === filterValue) {
          item.classList.remove('hidden');
          item.style.animation = 'fadeInUp 0.5s ease forwards';
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
}

// Inicializar galería en DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  inicializarGaleriaFiltros();

  // Agregar fade-in a las nuevas secciones
  const newSections = document.querySelectorAll('.gallery-section, .testimonials-section');
  newSections.forEach((section) => {
    section.classList.add('fade-in');
    observer.observe(section);
  });

  // Fade-in para tarjetas de testimonios
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  testimonialCards.forEach((card, index) => {
    card.classList.add('fade-in');
    card.style.transitionDelay = `${index * 0.15}s`;
    observer.observe(card);
  });

  // Fade-in para items de galería
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach((item, index) => {
    item.classList.add('fade-in');
    item.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(item);
  });
});

// Keyframe de animación para galería
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

window.solicitarServicio = solicitarServicio;
