const { createToken, isValidToken } = require('../src/middleware/adminAuth');
const { ADMIN_USERNAME } = require('../src/config/env');

describe('Admin auth utilities', () => {
  test('createToken and isValidToken produce valid tokens', () => {
    const token = createToken(ADMIN_USERNAME);
    expect(typeof token).toBe('string');
    expect(isValidToken(token)).toBe(true);
  });

  test('invalid token is rejected', () => {
    expect(isValidToken('not-a-real-token')).toBe(false);
  });
});
