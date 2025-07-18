/**
 * Test Helpers for ES Modules
 */

import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to create Express mocks
export function createExpressMocks() {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    get: jest.fn(),
    header: jest.fn(),
    ip: '127.0.0.1'
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    on: jest.fn()
  };

  const next = jest.fn();

  return { req, res, next };
}

// Helper to create logger mock
export function createLoggerMock() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    business: jest.fn(),
    security: jest.fn(),
    performance: jest.fn()
  };
}

// Helper to mock modules
export async function mockModule(modulePath, implementation) {
  jest.unstable_mockModule(modulePath, () => implementation);
}

// Helper to reset all mocks
export function resetAllMocks() {
  jest.clearAllMocks();
  jest.resetModules();
}

export { jest };