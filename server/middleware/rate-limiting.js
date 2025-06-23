/**
 * Advanced Rate Limiting Configuration
 * Comprehensive rate limiting for all API endpoints
 */

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Store for tracking failed attempts and suspicious activity
const attemptStore = new Map();
const suspiciousIPs = new Set();

/**
 * Custom key generator for more granular rate limiting
 */
const customKeyGenerator = req => {
  // Combine IP with user agent for better fingerprinting
  const userAgent = req.get('User-Agent') || 'unknown';
  const forwarded = req.get('X-Forwarded-For') || req.ip;
  return `${forwarded}-${userAgent.substring(0, 50)}`;
};

/**
 * Enhanced handler with security logging and adaptive measures
 */
const createSecurityHandler = endpoint => {
  return (req, res) => {
    const key = customKeyGenerator(req);
    const now = Date.now();

    // Track failed attempts
    if (!attemptStore.has(key)) {
      attemptStore.set(key, { count: 0, firstAttempt: now, lastAttempt: now });
    }

    const attempts = attemptStore.get(key);
    attempts.count++;
    attempts.lastAttempt = now;

    // Mark as suspicious after multiple rate limit hits
    if (attempts.count > 5) {
      suspiciousIPs.add(req.ip);
      console.error('Suspicious activity detected:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint,
        attempts: attempts.count,
        timeSpan: now - attempts.firstAttempt,
        timestamp: new Date().toISOString()
      });
    }

    // Clean old entries (older than 1 hour)
    if (now - attempts.firstAttempt > 3600000) {
      attemptStore.delete(key);
    }

    // Log rate limit hit
    console.warn('Rate limit exceeded:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint,
      method: req.method,
      url: req.originalUrl,
      totalAttempts: attempts.count,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      endpoint,
      retryAfter: 3600,
      timestamp: new Date().toISOString()
    });
  };
};

/**
 * Progressive delay for repeated requests
 */
const createSlowDown = (delayAfter, delayMs) => {
  return slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter,
    delayMs,
    maxDelayMs: 20000, // Max 20 second delay
    keyGenerator: customKeyGenerator,
    skip: req => {
      // Skip delay for health checks
      return req.url.includes('/health');
    }
  });
};

/**
 * Endpoint-specific rate limiters
 */
export const endpointLimiters = {
  // Authentication endpoints (very strict)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    keyGenerator: customKeyGenerator,
    handler: createSecurityHandler('auth'),
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Registration endpoints
  registration: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    keyGenerator: customKeyGenerator,
    handler: createSecurityHandler('registration'),
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Email endpoints
  email: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    keyGenerator: customKeyGenerator,
    handler: createSecurityHandler('email'),
    standardHeaders: true,
    legacyHeaders: false
  }),

  // File upload endpoints
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    keyGenerator: customKeyGenerator,
    handler: createSecurityHandler('upload'),
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Search endpoints
  search: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100,
    keyGenerator: customKeyGenerator,
    handler: createSecurityHandler('search'),
    standardHeaders: true,
    legacyHeaders: false
  }),

  // API creation endpoints (POST/PUT/DELETE)
  creation: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    keyGenerator: customKeyGenerator,
    handler: createSecurityHandler('creation'),
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Admin endpoints
  admin: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50,
    keyGenerator: customKeyGenerator,
    handler: createSecurityHandler('admin'),
    standardHeaders: true,
    legacyHeaders: false
  }),

  // WordPress integration endpoints
  wordpress: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    keyGenerator: customKeyGenerator,
    handler: createSecurityHandler('wordpress'),
    standardHeaders: true,
    legacyHeaders: false
  }),

  // General API endpoints
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    keyGenerator: customKeyGenerator,
    handler: createSecurityHandler('api'),
    standardHeaders: true,
    legacyHeaders: false
  })
};

/**
 * Progressive slow-down middleware
 */
export const progressiveSlowDown = {
  // Slow down after 20 requests
  light: createSlowDown(20, 500),

  // Slow down after 10 requests
  medium: createSlowDown(10, 1000),

  // Slow down after 5 requests
  heavy: createSlowDown(5, 2000)
};

/**
 * Adaptive rate limiting based on request patterns
 */
export const adaptiveRateLimit = (req, res, next) => {
  const { ip } = req;
  const key = customKeyGenerator(req);

  // Check if IP is marked as suspicious
  if (suspiciousIPs.has(ip)) {
    // Apply stricter limits for suspicious IPs
    const strictLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Very low limit
      keyGenerator: () => key,
      handler: createSecurityHandler('suspicious'),
      standardHeaders: true,
      legacyHeaders: false
    });

    return strictLimiter(req, res, next);
  }

  next();
};

/**
 * DDoS protection middleware
 */
export const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Allow up to 200 requests per minute per IP
  keyGenerator: req => req.ip,
  handler: (req, res) => {
    console.error('Potential DDoS attack detected:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests - potential DDoS detected',
      timestamp: new Date().toISOString()
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Conditional rate limiting based on request type
 */
export const conditionalRateLimit = (req, res, next) => {
  const { method } = req;
  const { path } = req;

  // Apply different limits based on operation type
  if (method === 'GET' && path.includes('/health')) {
    // No limits for health checks
    return next();
  }

  if (method === 'POST' && path.includes('/register')) {
    return endpointLimiters.registration(req, res, next);
  }

  if (method === 'POST' && path.includes('/email')) {
    return endpointLimiters.email(req, res, next);
  }

  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    return endpointLimiters.creation(req, res, next);
  }

  // Default to general API limits
  return endpointLimiters.api(req, res, next);
};

/**
 * Rate limit monitoring and reporting
 */
export const rateLimitMonitor = {
  getStats: () => {
    return {
      totalAttempts: attemptStore.size,
      suspiciousIPs: suspiciousIPs.size,
      suspiciousIPsList: Array.from(suspiciousIPs),
      recentAttempts: Array.from(attemptStore.entries())
        .filter(([_, data]) => Date.now() - data.lastAttempt < 3600000)
        .map(([key, data]) => ({
          key: key.substring(0, 50),
          attempts: data.count,
          timeSpan: Date.now() - data.firstAttempt
        })),
      timestamp: new Date().toISOString()
    };
  },

  clearSuspicious: () => {
    suspiciousIPs.clear();
    console.log('Suspicious IPs list cleared');
  },

  addToSuspicious: ip => {
    suspiciousIPs.add(ip);
    console.warn('IP added to suspicious list:', ip);
  }
};

/**
 * Cleanup middleware to prevent memory leaks
 */
export const cleanupRateLimit = () => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  // Clean old attempt records
  for (const [key, data] of attemptStore.entries()) {
    if (data.lastAttempt < oneHourAgo) {
      attemptStore.delete(key);
    }
  }

  console.log('Rate limit cleanup completed');
};

// Run cleanup every 30 minutes
setInterval(cleanupRateLimit, 30 * 60 * 1000);

export default {
  endpointLimiters,
  progressiveSlowDown,
  adaptiveRateLimit,
  ddosProtection,
  conditionalRateLimit,
  rateLimitMonitor,
  cleanupRateLimit
};
