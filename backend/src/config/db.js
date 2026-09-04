const mysql = require('mysql2/promise');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('./env');

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Agrega una columna a una tabla solo si no existe todavía (para BD existentes)
async function ensureColumn(table, column, definition) {
  const [cols] = await pool.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  if (cols.length === 0) {
    await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

// Agrega un índice a una columna si no existe todavía
async function ensureIndex(table, column) {
  const indexName = `idx_${table}_${column}`;
  const [idx] = await pool.execute(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? AND INDEX_NAME = ?`,
    [table, column, indexName],
  );
  if (idx.length === 0) {
    try {
      await pool.execute(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (\`${column}\`)`);
    } catch (e) {
      console.warn(`No se pudo agregar índice ${indexName}:`, e.message);
    }
  }
}

// Crea las categorías a partir de las que ya existen en servicios y componentes
async function seedCategorias() {
  const [count] = await pool.execute('SELECT COUNT(*) AS total FROM categorias');
  if (Number(count[0].total) > 0) {
    return;
  }

  const [serv] = await pool.execute(
    'SELECT DISTINCT categoria FROM servicios WHERE categoria IS NOT NULL AND categoria <> ""',
  );
  const [comp] = await pool.execute(
    'SELECT DISTINCT categoria FROM componentes WHERE categoria IS NOT NULL AND categoria <> ""',
  );
  const nombres = new Set();
  serv.forEach((r) => nombres.add(JSON.stringify({ nombre: r.categoria, tipo: 'servicio' })));
  comp.forEach((r) => nombres.add(JSON.stringify({ nombre: r.categoria, tipo: 'componente' })));

  for (const json of nombres) {
    const { nombre, tipo } = JSON.parse(json);
    await pool.execute(
      'INSERT INTO categorias (nombre, tipo) VALUES (?, ?) ON DUPLICATE KEY UPDATE nombre = nombre',
      [nombre, tipo],
    );
  }
}

// Vincula los registros existentes con su categoría correspondiente
async function backfillCategoriaIds() {
  await pool.execute(
    `UPDATE componentes c
     LEFT JOIN categorias cat ON cat.nombre = c.categoria AND cat.tipo = 'componente'
     SET c.categoria_id = cat.id
     WHERE c.categoria_id IS NULL`,
  );
  await pool.execute(
    `UPDATE servicios s
     LEFT JOIN categorias cat ON cat.nombre = s.categoria AND cat.tipo = 'servicio'
     SET s.categoria_id = cat.id
     WHERE s.categoria_id IS NULL`,
  );
}

// Crea las estaciones de recojo (Línea 1 del Metro de Lima)
async function seedEstaciones() {
  const [count] = await pool.execute('SELECT COUNT(*) AS total FROM estaciones_recojo');
  if (Number(count[0].total) > 0) {
    return;
  }

  const estaciones = [
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

  for (const nombre of estaciones) {
    await pool.execute(
      'INSERT INTO estaciones_recojo (nombre) VALUES (?) ON DUPLICATE KEY UPDATE nombre = nombre',
      [nombre],
    );
  }
}

async function initializeDatabase() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS servicios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS componentes (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        componente_id INT NOT NULL,
        nombre_componente VARCHAR(255) NOT NULL,
        cantidad INT UNSIGNED NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        cliente VARCHAR(255) NOT NULL DEFAULT 'Cliente web',
        estacion_recojo VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (componente_id) REFERENCES componentes(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de ventas ENTREGADAS (se mueven aquí al marcar entregado)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ventas_entregadas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        componente_id INT NOT NULL,
        nombre_componente VARCHAR(255) NOT NULL,
        cantidad INT UNSIGNED NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        cliente VARCHAR(255) NOT NULL DEFAULT 'Cliente web',
        estacion_recojo VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        entregado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (componente_id) REFERENCES componentes(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de ventas CANCELADAS (se mueven aquí al cancelar)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ventas_canceladas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        componente_id INT NOT NULL,
        nombre_componente VARCHAR(255) NOT NULL,
        cantidad INT UNSIGNED NOT NULL,
        precio_unitario DECIMAL(10,2) DEFAULT NULL,
        total DECIMAL(10,2) DEFAULT NULL,
        cliente VARCHAR(255) NOT NULL DEFAULT 'Cliente web',
        estacion_recojo VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cancelado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (componente_id) REFERENCES componentes(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============ TABLAS DE REFERENCIA (normalización) ============

    // CLIENTES: evita repetir el texto "Cliente web" en cada venta
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        telefono VARCHAR(30) DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_clientes_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // CATEGORIAS: categorías limpias y gestionables
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        tipo ENUM('servicio','componente') NOT NULL DEFAULT 'componente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_categorias_nombre_tipo (nombre, tipo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ESTACIONES_RECOJO: lista de estaciones gestionable (ya no en el código)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS estaciones_recojo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_estaciones_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS solicitudes_compras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        componente_id INT NOT NULL,
        nombre_componente VARCHAR(255) NOT NULL,
        cantidad INT UNSIGNED NOT NULL,
        cliente VARCHAR(255) NOT NULL DEFAULT 'Cliente web',
        estacion_recojo VARCHAR(100) DEFAULT NULL,
        estado ENUM('pendiente', 'confirmada', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (componente_id) REFERENCES componentes(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      ALTER TABLE solicitudes_compras
      MODIFY estado ENUM('pendiente', 'confirmada', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente'
    `);

    // Asegurar la columna estacion_recojo en bases de datos existentes
    await ensureColumn('solicitudes_compras', 'estacion_recojo', 'VARCHAR(100) DEFAULT NULL');
    await ensureColumn('ventas', 'estacion_recojo', 'VARCHAR(100) DEFAULT NULL');

    // Asegurar columnas de referencia (FK) en tablas de ventas
    await ensureColumn('solicitudes_compras', 'cliente_id', 'INT NULL');
    await ensureColumn('solicitudes_compras', 'estacion_id', 'INT NULL');
    await ensureColumn('ventas', 'cliente_id', 'INT NULL');
    await ensureColumn('ventas', 'estacion_id', 'INT NULL');
    await ensureColumn('ventas_entregadas', 'cliente_id', 'INT NULL');
    await ensureColumn('ventas_entregadas', 'estacion_id', 'INT NULL');
    await ensureColumn('ventas_canceladas', 'cliente_id', 'INT NULL');
    await ensureColumn('ventas_canceladas', 'estacion_id', 'INT NULL');
    await ensureColumn('servicios', 'categoria_id', 'INT NULL');
    await ensureColumn('componentes', 'categoria_id', 'INT NULL');

    // Índices para búsquedas rápidas
    await ensureIndex('solicitudes_compras', 'cliente_id');
    await ensureIndex('solicitudes_compras', 'estacion_id');
    await ensureIndex('ventas', 'cliente_id');
    await ensureIndex('ventas', 'estacion_id');
    await ensureIndex('ventas_entregadas', 'cliente_id');
    await ensureIndex('ventas_entregadas', 'estacion_id');
    await ensureIndex('ventas_canceladas', 'cliente_id');
    await ensureIndex('ventas_canceladas', 'estacion_id');
    await ensureIndex('servicios', 'categoria_id');
    await ensureIndex('componentes', 'categoria_id');

    // Semilla de categorías (a partir de las categorías existentes)
    await seedCategorias();
    // Vincular los registros existentes con su categoría
    await backfillCategoriaIds();
    // Semilla de estaciones de recojo (Línea 1 del Metro de Lima)
    await seedEstaciones();

    const [serviciosCount] = await pool.execute('SELECT COUNT(*) AS total FROM servicios');
    if (Number(serviciosCount[0].total) === 0) {
      await pool.execute(`
        INSERT INTO servicios (nombre, descripcion, precio, categoria) VALUES
        ('Instalación de Windows', 'Instalación profesional de Windows con licencia', 150.00, 'Sistemas y Software'),
        ('Instalación de Office', 'Instalación y activación de Microsoft Office', 120.00, 'Sistemas y Software'),
        ('Recuperación de sistemas', 'Recuperación de sistemas Windows dañados', 200.00, 'Sistemas y Software'),
        ('Clonación de S.O', 'Clonación completa del sistema operativo', 180.00, 'Sistemas y Software'),
        ('Mantenimiento de PC', 'Mantenimiento preventivo de computadoras', 100.00, 'Soporte Técnico'),
        ('Soporte remoto', 'Asistencia técnica remota por sesión', 80.00, 'Soporte Técnico'),
        ('Desarrollo web profesional', 'Desarrollo de sistemas web a medida', 5000.00, 'Sistemas Web'),
        ('Recarga de tinta', 'Recarga de cartuchos de tinta Epson, HP, Canon', 50.00, 'Impresoras'),
        ('Configuración de routers', 'Configuración e instalación de routers', 120.00, 'Configuración de redes')
      `);
    }

    const [componentesCount] = await pool.execute('SELECT COUNT(*) AS total FROM componentes');
    if (Number(componentesCount[0].total) === 0) {
      await pool.execute(`
        INSERT INTO componentes (nombre, descripcion, precio, categoria, stock, imagen) VALUES
        ('SSD Kingston NV2 1TB NVMe PCIe 4.0', 'Velocidad de lectura hasta 3500 MB/s. Ideal para repotenciar tu laptop o PC de escritorio.', 290.00, 'Almacenamiento', 10, 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=400&q=80'),
        ('SSD Crucial BX500 480GB SATA III', 'Formato de 2.5". Excelente opción para laptops y PCs antiguas con discos mecánicos.', 165.00, 'Almacenamiento', 10, 'https://images.unsplash.com/photo-1709660850064-0ec82e1a6b5d?auto=format&fit=crop&w=400&q=80'),
        ('Memoria RAM Corsair Vengeance LPX 16GB DDR4 3200MHz', 'Disipador de aluminio de bajo perfil. Rendimiento optimizado para PCs con Intel o AMD Ryzen.', 220.00, 'Memoria RAM', 10, 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=400&q=80'),
        ('Memoria RAM Kingston Fury Impact 8GB DDR4 3200MHz (Laptop)', 'Formato SO-DIMM. Mejora el rendimiento multitarea y de navegación en tu laptop.', 125.00, 'Memoria RAM', 3, 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=400&q=80'),
        ('Procesador AMD Ryzen 5 5600X', '6 núcleos y 12 hilos, frecuencia máxima de 4.6GHz. Incluye disipador Wraith Stealth.', 680.00, 'Procesadores', 10, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80'),
        ('Procesador Intel Core i5-12400F', 'Socket LGA1700, 6 núcleos y 12 hilos, 2.50GHz base (hasta 4.40GHz). Gran rendimiento gaming.', 620.00, 'Procesadores', 3, 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80'),
        ('Cargador Universal para Laptop 90W', 'Incluye 10 puntas intercambiables compatibles con HP, Lenovo, Dell, Asus, Toshiba y más.', 85.00, 'Laptops y Repuestos', 10, 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=400&q=80'),
        ('Cooler para CPU Deepcool AG400 ARGB', 'Disipador por aire de 120mm con iluminación ARGB. Silencioso y con gran disipación de calor.', 110.00, 'Laptops y Repuestos', 10, 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80')
      `);
    }
  } catch (error) {
    console.error('No fue posible inicializar la base de datos:', error.message);
  }
}

// Exportamos una promesa para que el servidor espere a que la BD esté lista
const dbInitPromise = initializeDatabase();

pool
  .getConnection()
  .then((conn) => {
    console.log('✓ Conexión a MySQL establecida correctamente');
    console.log(`✓ Base de datos: ${DB_NAME}`);
    console.log(`✓ Usuario: ${DB_USER}`);
    conn.release();
  })
  .catch((err) => {
    console.error('✗ Error al conectar a MySQL:', err.message);
    console.error('  Asegúrate de que:');
    console.error('  1. MySQL Server está corriendo');
    console.error('  2. Las credenciales en .env son correctas');
    console.error(`  3. La base de datos ${DB_NAME} existe`);
  });

module.exports = {
  pool,
  initializeDatabase: () => dbInitPromise,
};
