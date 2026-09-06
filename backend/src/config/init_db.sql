-- ======================================================
-- Script SQL para SUNETYA - Base de Datos MySQL
-- Crea tablas: servicios y componentes
-- e inserta los datos del catálogo actual
-- ======================================================

USE computekno_db;

-- ======================================================
-- TABLA: servicios
-- ======================================================
DROP TABLE IF EXISTS servicios;

CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos de servicios
INSERT INTO servicios (nombre, descripcion, precio, categoria) VALUES
('Instalación de Windows', 'Instalación profesional de Windows con licencia', 150.00, 'Sistemas y Software'),
('Instalación de Office', 'Instalación y activación de Microsoft Office', 120.00, 'Sistemas y Software'),
('Recuperación de sistemas', 'Recuperación de sistemas Windows dañados', 200.00, 'Sistemas y Software'),
('Clonación de S.O', 'Clonación completa del sistema operativo', 180.00, 'Sistemas y Software'),
('Mantenimiento de PC', 'Mantenimiento preventivo de computadoras', 100.00, 'Soporte Técnico'),
('Soporte remoto', 'Asistencia técnica remota por sesión', 80.00, 'Soporte Técnico'),
('Desarrollo web profesional', 'Desarrollo de sistemas web a medida', 5000.00, 'Sistemas Web'),
('Recarga de tinta', 'Recarga de cartuchos de tinta Epson, HP, Canon', 50.00, 'Impresoras'),
('Configuración de routers', 'Configuración e instalación de routers', 120.00, 'Configuración de redes');


-- ======================================================
-- TABLA: componentes
-- ======================================================
DROP TABLE IF EXISTS componentes;

CREATE TABLE componentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    imagen VARCHAR(500) DEFAULT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos de componentes
INSERT INTO componentes (nombre, descripcion, precio, categoria, stock, imagen) VALUES
('SSD Kingston NV2 1TB NVMe PCIe 4.0',
 'Velocidad de lectura hasta 3500 MB/s. Ideal para repotenciar tu laptop o PC de escritorio.',
 290.00, 'Almacenamiento', 10,
 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=400&q=80'),

('SSD Crucial BX500 480GB SATA III',
 'Formato de 2.5". Excelente opción para laptops y PCs antiguas con discos mecánicos.',
 165.00, 'Almacenamiento', 10,
 'https://images.unsplash.com/photo-1709660850064-0ec82e1a6b5d?auto=format&fit=crop&w=400&q=80'),

('Memoria RAM Corsair Vengeance LPX 16GB DDR4 3200MHz',
 'Disipador de aluminio de bajo perfil. Rendimiento optimizado para PCs con Intel o AMD Ryzen.',
 220.00, 'Memoria RAM', 10,
 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=400&q=80'),

('Memoria RAM Kingston Fury Impact 8GB DDR4 3200MHz (Laptop)',
 'Formato SO-DIMM. Mejora el rendimiento multitarea y de navegación en tu laptop.',
 125.00, 'Memoria RAM', 3,
 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=400&q=80'),

('Procesador AMD Ryzen 5 5600X',
 '6 núcleos y 12 hilos, frecuencia máxima de 4.6GHz. Incluye disipador Wraith Stealth.',
 680.00, 'Procesadores', 10,
 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80'),

('Procesador Intel Core i5-12400F',
 'Socket LGA1700, 6 núcleos y 12 hilos, 2.50GHz base (hasta 4.40GHz). Gran rendimiento gaming.',
 620.00, 'Procesadores', 3,
 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80'),

('Cargador Universal para Laptop 90W',
 'Incluye 10 puntas intercambiables compatibles con HP, Lenovo, Dell, Asus, Toshiba y más.',
 85.00, 'Laptops y Repuestos', 10,
 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=400&q=80'),

('Cooler para CPU Deepcool AG400 ARGB',
 'Disipador por aire de 120mm con iluminación ARGB. Silencioso y con gran disipación de calor.',
 110.00, 'Laptops y Repuestos', 10,
 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80');


-- ======================================================
-- Verificar datos insertados
-- ======================================================
SELECT 'SERVICIOS' AS tabla, COUNT(*) AS total FROM servicios
UNION ALL
SELECT 'COMPONENTES' AS tabla, COUNT(*) AS total FROM componentes;
