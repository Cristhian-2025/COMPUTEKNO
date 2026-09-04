const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  JWT_SECRET,
  ADMIN_TOKEN_EXPIRES,
} = require('../config/env');

function createToken(username) {
  return jwt.sign({ username }, JWT_SECRET, {
    expiresIn: ADMIN_TOKEN_EXPIRES,
  });
}

function isValidToken(token) {
  if (!token || !JWT_SECRET) {
    return false;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.username === ADMIN_USERNAME;
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const token = req.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';

  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Sesión de administrador no válida o vencida.' });
  }

  next();
}

function verifyAdminCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return false;
  }

  const expectedUsername = Buffer.from(ADMIN_USERNAME, 'utf-8');
  const expectedPassword = Buffer.from(ADMIN_PASSWORD, 'utf-8');
  const receivedUsername = Buffer.from(username, 'utf-8');
  const receivedPassword = Buffer.from(password, 'utf-8');

  const usernamesMatch =
    receivedUsername.length === expectedUsername.length &&
    crypto.timingSafeEqual(receivedUsername, expectedUsername);
  const passwordsMatch =
    receivedPassword.length === expectedPassword.length &&
    crypto.timingSafeEqual(receivedPassword, expectedPassword);

  return usernamesMatch && passwordsMatch;
}

module.exports = {
  createToken,
  isValidToken,
  requireAdmin,
  verifyAdminCredentials,
};
