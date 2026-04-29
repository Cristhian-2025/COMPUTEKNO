// --- Menú Hamburguesa ---
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", mobileMenu);

function mobileMenu() {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
}

// Cerrar el menú al hacer click en un enlace
const navLink = document.querySelectorAll(".nav-links li a");

navLink.forEach(n => n.addEventListener("click", closeMenu));

function closeMenu() {
    hamburger.classList.remove("active");
    navLinks.classList.remove("active");
}

// --- Animación al Scroll (Fade-in) ---
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
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
    
    sections.forEach(section => {
        // No aplicamos fade in al hero si ya está en pantalla inicialmente, 
        // pero para mantenerlo simple aplicamos a todo section
        if(section.id !== 'inicio') {
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
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        header.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        header.style.boxShadow = 'none';
        header.style.background = 'rgba(255, 255, 255, 0.9)';
    }
});
