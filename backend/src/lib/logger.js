const { NODE_ENV } = require('../config/env');

function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

function info(message) {
  if (NODE_ENV !== 'test') {
    console.info(formatMessage('INFO', message));
  }
}

function warn(message) {
  if (NODE_ENV !== 'test') {
    console.warn(formatMessage('WARN', message));
  }
}

function error(message) {
  if (NODE_ENV !== 'test') {
    console.error(formatMessage('ERROR', message));
  }
}

module.exports = {
  info,
  warn,
  error,
};
