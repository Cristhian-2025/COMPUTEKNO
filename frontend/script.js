/* exported solicitarServicio */
// Función para abrir WhatsApp desde las tarjetas de servicio
function solicitarServicio(nombreServicio) {
  // Número corporativo de SUNETYA
  const telefono = '51901348331';

  const mensaje = `Hola SUNETYA, me interesa el servicio de: *${nombreServicio}*. ¿Podrían darme más información?`;
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, '_blank');
}

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
