/**
 * Mock for bcryptjs module
 */

const bcrypt = {
  genSalt: jest.fn(async rounds => 'mock-salt'),
  hash: jest.fn(async (password, salt) => `hashed-${password}`),
  compare: jest.fn(async (password, hash) => password === 'correct-password')
};

// Export both default and named exports
export default bcrypt;
export { bcrypt };
