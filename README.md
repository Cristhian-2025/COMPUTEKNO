# COMPUTEKNO

Repositorio del proyecto COMPUTEKNO con backend de Express + MySQL y frontend estático.

## Estructura

- `backend/`: servidor Node.js con Express y MySQL.
- `frontend/`: sitio estático con HTML, CSS y JavaScript para tienda y administración.

## Mejores prácticas aplicadas

- Configuración de entorno centralizada con validación.
- Separación entre la aplicación (`src/app.js`) y el arranque del servidor (`src/index.js`).
- Control de errores unificado con middleware de Express.
- Autenticación de administrador basada en JWT.
- Lógica de negocios delegada a servicios y controladores.
- Infraestructura de pruebas con Jest.
- Configuraciones de ESLint y Prettier para calidad de código.
- Frontend estático con configuración externa y rutas de API centralizadas.

## Backend

### Requisitos

- Node.js 18+ (o compatible)
- MySQL 8+ en ejecución

### Variables de entorno

Copia `backend/.env.example` a `backend/.env` y edita los valores:

- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `ALLOWED_ORIGIN`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `ADMIN_TOKEN_EXPIRES`

### Comandos

Desde `COMPUTEKNO-PROYECTO/backend`:

```bash
npm install
npm run dev
npm test
npm run lint
npm run format
```

## Frontend

### Uso local

Desde `COMPUTEKNO-PROYECTO/frontend`:

```bash
npm install
npm run start
npm run lint
npm run format
```

Abre `http://127.0.0.1:5500` en el navegador.

## Notas de escalabilidad

- El backend usa `helmet`, `morgan` y un limitador de tasas.
- El esquema de base de datos está preparado para normalización de categorías y clientes.
- El frontend usa una configuración central (`frontend/config.js`) para aislar la URL de la API.
- El proyecto incluye pruebas automáticas para evitar regresiones.
