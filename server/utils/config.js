/**
 * Configuration Management
 * 環境変数の管理と検証
 */

import { createLogger } from './logger.js';

const logger = createLogger('config');

/**
 * Environment variable validation schema
 */
const configSchema = {
  // Server configuration
  NODE_ENV: {
    required: false,
    default: 'development',
    validate: value => ['development', 'test', 'production'].includes(value)
  },
  PORT: {
    required: false,
    default: '3000',
    validate: value => !isNaN(parseInt(value)) && parseInt(value) > 0
  },

  // Security
  JWT_SECRET: {
    required: true,
    production: true,
    minLength: 32,
    validate: value => value && value.length >= 32
  },
  REFRESH_TOKEN_SECRET: {
    required: false,
    default: null,
    validate: value => !value || value.length >= 32
  },

  // Database
  DATABASE_TYPE: {
    required: false,
    default: 'filesystem',
    validate: value => ['filesystem', 'postgresql', 'dynamodb'].includes(value)
  },

  // GitHub integration
  GITHUB_TOKEN: {
    required: false,
    production: false,
    validate: value => !value || value.startsWith('ghp_') || value.startsWith('github_pat_')
  },
  GITHUB_OWNER: {
    required: false,
    default: null
  },
  GITHUB_REPO: {
    required: false,
    default: null
  },

  // Email service
  EMAIL_SERVICE: {
    required: false,
    default: 'test',
    validate: value => ['gmail', 'smtp', 'test'].includes(value)
  },
  EMAIL_USER: {
    required: false,
    default: null
  },
  EMAIL_PASS: {
    required: false,
    default: null
  },

  // Cache configuration
  CACHE_MAX_SIZE: {
    required: false,
    default: '1000',
    validate: value => !isNaN(parseInt(value)) && parseInt(value) > 0
  },
  CACHE_DEFAULT_TTL: {
    required: false,
    default: '3600000', // 1 hour
    validate: value => !isNaN(parseInt(value)) && parseInt(value) > 0
  },

  // WebSocket configuration
  WS_PING_TIMEOUT: {
    required: false,
    default: '60000',
    validate: value => !isNaN(parseInt(value)) && parseInt(value) > 0
  },
  WS_PING_INTERVAL: {
    required: false,
    default: '25000',
    validate: value => !isNaN(parseInt(value)) && parseInt(value) > 0
  }
};

/**
 * Validate and load configuration
 */
export function loadConfig() {
  const config = {};
  const errors = [];
  const warnings = [];

  // Check each configuration item
  for (const [key, schema] of Object.entries(configSchema)) {
    const value = process.env[key];

    // Check if required
    if (schema.required && !value) {
      errors.push(`Missing required environment variable: ${key}`);
      continue;
    }

    // Check production requirements
    if (schema.production && process.env.NODE_ENV === 'production' && !value) {
      errors.push(`Missing production environment variable: ${key}`);
      continue;
    }

    // Use default if not provided
    const finalValue = value || schema.default;

    // Validate value
    if (finalValue && schema.validate && !schema.validate(finalValue)) {
      errors.push(`Invalid value for ${key}: ${finalValue}`);
      continue;
    }

    // Check minimum length
    if (schema.minLength && finalValue && finalValue.length < schema.minLength) {
      errors.push(`${key} must be at least ${schema.minLength} characters long`);
      continue;
    }

    // Add warnings for missing non-required values
    if (!value && schema.default === null && !schema.required) {
      warnings.push(`Optional environment variable ${key} not set`);
    }

    config[key] = finalValue;
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Configuration warnings:', warnings);
  }

  // Throw errors if any
  if (errors.length > 0) {
    logger.error('Configuration errors:', errors);
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  logger.info('Configuration loaded successfully');
  return config;
}

/**
 * Get typed configuration values
 */
export function getConfig() {
  const config = loadConfig();

  return {
    // Server
    nodeEnv: config.NODE_ENV,
    port: parseInt(config.PORT),

    // Security
    jwtSecret: config.JWT_SECRET,
    refreshTokenSecret: config.REFRESH_TOKEN_SECRET,

    // Database
    databaseType: config.DATABASE_TYPE,

    // GitHub
    github: {
      token: config.GITHUB_TOKEN,
      owner: config.GITHUB_OWNER,
      repo: config.GITHUB_REPO
    },

    // Email
    email: {
      service: config.EMAIL_SERVICE,
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS
    },

    // Cache
    cache: {
      maxSize: parseInt(config.CACHE_MAX_SIZE),
      defaultTTL: parseInt(config.CACHE_DEFAULT_TTL)
    },

    // WebSocket
    websocket: {
      pingTimeout: parseInt(config.WS_PING_TIMEOUT),
      pingInterval: parseInt(config.WS_PING_INTERVAL)
    }
  };
}

/**
 * Validate configuration on startup
 */
export function validateConfig() {
  try {
    loadConfig();
    return true;
  } catch (error) {
    logger.error('Configuration validation failed:', error.message);
    return false;
  }
}

// Validate on module load in production
if (process.env.NODE_ENV === 'production') {
  validateConfig();
}
