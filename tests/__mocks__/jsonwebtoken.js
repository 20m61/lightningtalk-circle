/**
 * Mock for jsonwebtoken module
 */

const jwt = {
  sign: jest.fn((payload, secret, options) => 'mock-jwt-token'),
  verify: jest.fn((token, secret, callback) => {
    if (token === 'valid-token') {
      callback(null, { id: 'user-123', email: 'test@example.com', role: 'user' });
    } else if (token === 'expired-token') {
      callback(new Error('TokenExpiredError'));
    } else {
      callback(new Error('JsonWebTokenError'));
    }
  })
};

// Export both default and named exports
export default jwt;
export { jwt };
