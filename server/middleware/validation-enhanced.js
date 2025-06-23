/**
 * Enhanced Validation Middleware for Lightning Talk Event Management
 * Uses express-validator for comprehensive input validation with security features
 */

import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

/**
 * Enhanced validation middleware with detailed error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    // Log validation failures for security monitoring
    console.warn('Validation failed:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  }

  next();
};

/**
 * Sanitize and normalize input data
 */
export const sanitizeInput = (req, res, next) => {
  // Remove null byte characters (security)
  const removeNullBytes = obj => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = removeNullBytes(obj[key]);
      });
    }
    return obj;
  };

  req.body = removeNullBytes(req.body);
  req.query = removeNullBytes(req.query);
  req.params = removeNullBytes(req.params);

  next();
};

/**
 * Check content type for JSON endpoints
 */
export const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.is('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type must be application/json',
        received: req.get('Content-Type'),
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
};

/**
 * Validate file upload constraints
 */
export const validateFileUpload = (req, res, next) => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.jpg,.jpeg,.png,.pdf,.doc,.docx').split(
    ','
  );

  if (req.file) {
    // Check file size
    if (req.file.size > maxSize) {
      return res.status(413).json({
        success: false,
        message: `File size exceeds maximum limit of ${maxSize} bytes`,
        timestamp: new Date().toISOString()
      });
    }

    // Check file type
    const fileExt = `.${req.file.originalname.split('.').pop().toLowerCase()}`;
    if (!allowedTypes.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: `File type ${fileExt} is not allowed`,
        allowedTypes,
        timestamp: new Date().toISOString()
      });
    }

    // Check for malicious file patterns
    const suspiciousPatterns = [
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /\.exe$/i,
      /\.sh$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(req.file.originalname))) {
      return res.status(400).json({
        success: false,
        message: 'File type is not allowed for security reasons',
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
};

/**
 * Create rate limiter with custom options
 */
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000) || 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn('Rate limit exceeded:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString()
      });

      res.status(429).json(options.message);
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Specific rate limiters for different endpoints
 */
export const rateLimiters = {
  // General API rate limiting
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      message: 'Too many API requests from this IP',
      retryAfter: 900
    }
  }),

  // Registration endpoints (stricter)
  registration: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
      success: false,
      message: 'Too many registration attempts from this IP',
      retryAfter: 3600
    }
  }),

  // Email sending (very strict)
  email: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
      success: false,
      message: 'Too many email requests from this IP',
      retryAfter: 3600
    }
  }),

  // Admin endpoints
  admin: createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50,
    message: {
      success: false,
      message: 'Too many admin requests from this IP',
      retryAfter: 600
    }
  })
};

/**
 * Validate API key for protected endpoints
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key') || req.query.apiKey;
  const validApiKeys = (process.env.API_KEYS || '').split(',').filter(key => key.length > 0);

  if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/protected')) {
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!validApiKeys.includes(apiKey)) {
      console.warn('Invalid API key attempt:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        apiKey: `${apiKey?.substring(0, 8)}...`,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        success: false,
        message: 'Invalid API key',
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Remove server signature
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });

  next();
};

/**
 * Request logging middleware for security monitoring
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log suspicious activity
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // Javascript protocol
    /data:/i // Data URI scheme
  ];

  const requestString = `${req.method} ${req.url} ${JSON.stringify(req.body)}`;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));

  if (isSuspicious) {
    console.warn('Suspicious request detected:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }

  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      // Log slow requests
      console.warn('Slow request:', {
        method: req.method,
        url: req.originalUrl,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

export default {
  validateRequest,
  sanitizeInput,
  validateContentType,
  validateFileUpload,
  createRateLimiter,
  rateLimiters,
  validateApiKey,
  securityHeaders,
  requestLogger
};
