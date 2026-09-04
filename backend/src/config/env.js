const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const requiredVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'JWT_SECRET',
  'ALLOWED_ORIGIN',
];

const missing = requiredVars.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
}

const env = {
  PORT: Number(process.env.PORT) || 3000,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_TOKEN_EXPIRES: process.env.ADMIN_TOKEN_EXPIRES || '8h',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

module.exports = env;
