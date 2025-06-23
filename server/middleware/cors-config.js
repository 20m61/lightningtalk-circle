/**
 * Enhanced CORS Configuration for Lightning Talk Circle
 * Environment-specific security policies
 */

import cors from 'cors';

// Environment-specific CORS configuration
const corsConfigurations = {
  development: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With', 'Accept'],
    maxAge: 86400 // 24 hours
  },

  staging: {
    origin: ['https://staging.xn--6wym69a.com', 'https://staging-api.xn--6wym69a.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With', 'Accept'],
    maxAge: 3600 // 1 hour
  },

  production: {
    origin: [
      'https://xn--6wym69a.com',
      'https://www.xn--6wym69a.com',
      'https://発表.com',
      'https://www.発表.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With', 'Accept'],
    maxAge: 3600, // 1 hour
    optionsSuccessStatus: 200
  }
};

/**
 * Create CORS middleware based on environment
 */
export const createCorsMiddleware = (environment = process.env.NODE_ENV || 'development') => {
  const config = corsConfigurations[environment] || corsConfigurations.development;

  return cors({
    ...config,
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) in development
      if (!origin && environment === 'development') {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (config.origin.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('CORS: Blocked request from origin:', origin, {
          environment,
          allowedOrigins: config.origin,
          timestamp: new Date().toISOString()
        });

        callback(new Error('Not allowed by CORS policy'));
      }
    }
  });
};

/**
 * Dynamic CORS configuration for API endpoints
 */
export const apiCorsMiddleware = (req, res, next) => {
  const environment = process.env.NODE_ENV || 'development';
  const corsMiddleware = createCorsMiddleware(environment);

  // Apply CORS
  corsMiddleware(req, res, err => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'CORS policy violation',
        origin: req.get('Origin'),
        timestamp: new Date().toISOString()
      });
    }
    next();
  });
};

/**
 * Preflight handling for complex requests
 */
export const handlePreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    const environment = process.env.NODE_ENV || 'development';
    const config = corsConfigurations[environment];

    res.header('Access-Control-Allow-Origin', req.get('Origin'));
    res.header('Access-Control-Allow-Methods', config.methods.join(', '));
    res.header('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', config.maxAge.toString());

    return res.sendStatus(200);
  }
  next();
};

/**
 * WordPress-specific CORS configuration
 */
export const wordpressCorsMiddleware = cors({
  origin: [
    'https://xn--6wym69a.com',
    'https://www.xn--6wym69a.com',
    /^https:\/\/.*\.xn--6wym69a\.com$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-WP-Nonce', 'X-Requested-With']
});

/**
 * Admin panel CORS configuration (stricter)
 */
export const adminCorsMiddleware = cors({
  origin: (origin, callback) => {
    const adminOrigins = ['https://admin.xn--6wym69a.com', 'https://dashboard.xn--6wym69a.com'];

    if (process.env.NODE_ENV === 'development') {
      adminOrigins.push('http://localhost:3000', 'http://localhost:8080');
    }

    if (!origin || adminOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('Admin CORS: Blocked request from origin:', origin);
      callback(new Error('Admin access denied'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Token']
});

/**
 * Security headers for CORS responses
 */
export const corsSecurityHeaders = (req, res, next) => {
  // Vary header for caching
  res.vary('Origin');

  // Additional security headers
  if (req.get('Origin')) {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
  }

  next();
};

/**
 * CORS error handler
 */
export const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    console.error('CORS Error:', {
      origin: req.get('Origin'),
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    return res.status(403).json({
      success: false,
      message: 'Cross-origin request blocked',
      code: 'CORS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  next(err);
};

export default {
  createCorsMiddleware,
  apiCorsMiddleware,
  handlePreflight,
  wordpressCorsMiddleware,
  adminCorsMiddleware,
  corsSecurityHeaders,
  corsErrorHandler
};
