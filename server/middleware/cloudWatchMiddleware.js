/**
 * CloudWatch Middleware
 * Express middleware for CloudWatch integration
 */

import { getCloudWatch } from '../services/cloudWatchService.js';
import { createLogger } from '../utils/logger.js';
import { sanitizeRequest, sanitizeError } from '../utils/logSanitizer.js';

const logger = createLogger('CloudWatchMiddleware');

/**
 * Request logging middleware with CloudWatch integration
 */
export function cloudWatchRequestLogger() {
  const cloudWatch = getCloudWatch();

  return (req, res, next) => {
    const startTime = Date.now();

    // Capture response end
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
      const duration = Date.now() - startTime;

      // Log API request to CloudWatch
      cloudWatch.logAPIRequest(req, res, duration).catch(error => {
        logger.error('Failed to log API request to CloudWatch', error);
      });

      // Call original end
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Error logging middleware with CloudWatch integration
 */
export function cloudWatchErrorLogger() {
  const cloudWatch = getCloudWatch();

  return (error, req, res, next) => {
    // Sanitize error and request data before logging
    const sanitizedError = sanitizeError(error);
    const sanitizedRequest = sanitizeRequest(req);

    // Log error to CloudWatch
    cloudWatch
      .logEvent('ERROR', 'Application Error', {
        error: sanitizedError,
        request: sanitizedRequest,
        timestamp: new Date().toISOString()
      })
      .catch(logError => {
        logger.error('Failed to log error to CloudWatch', logError);
      });

    // Send error metric
    cloudWatch
      .sendMetric('ApplicationError', 1, 'Count', {
        errorType: error.name || 'UnknownError',
        endpoint: req.route?.path || req.path
      })
      .catch(metricError => {
        logger.error('Failed to send error metric to CloudWatch', metricError);
      });

    next(error);
  };
}

/**
 * Authentication event logging middleware
 */
export function cloudWatchAuthLogger() {
  const cloudWatch = getCloudWatch();

  return (req, res, next) => {
    // Add auth logging helper to request
    req.logAuth = (type, success, metadata = {}) => {
      cloudWatch
        .logAuthEvent(type, success, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
          ...metadata
        })
        .catch(error => {
          logger.error('Failed to log auth event to CloudWatch', error);
        });
    };

    next();
  };
}

/**
 * Security event logging middleware
 */
export function cloudWatchSecurityLogger() {
  const cloudWatch = getCloudWatch();

  return (req, res, next) => {
    // Add security logging helper to request
    req.logSecurity = (eventType, severity, details = {}) => {
      cloudWatch
        .logSecurityEvent(eventType, severity, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date().toISOString(),
          user: req.user
            ? {
                id: req.user.id,
                email: req.user.email
              }
            : null,
          ...details
        })
        .catch(error => {
          logger.error('Failed to log security event to CloudWatch', error);
        });
    };

    next();
  };
}

/**
 * Business metrics logging middleware
 */
export function cloudWatchBusinessMetrics() {
  const cloudWatch = getCloudWatch();

  return (req, res, next) => {
    // Add business metrics helper to request
    req.logBusinessMetric = (eventType, value = 1, metadata = {}) => {
      cloudWatch
        .logBusinessMetric(eventType, value, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
          user: req.user
            ? {
                id: req.user.id,
                email: req.user.email
              }
            : null,
          ...metadata
        })
        .catch(error => {
          logger.error('Failed to log business metric to CloudWatch', error);
        });
    };

    next();
  };
}

/**
 * Performance monitoring middleware
 */
export function cloudWatchPerformanceMonitor() {
  const cloudWatch = getCloudWatch();

  return (req, res, next) => {
    // Add performance logging helper to request
    req.logPerformance = (operation, duration, success = true, metadata = {}) => {
      cloudWatch
        .logPerformanceMetric(operation, duration, success, {
          endpoint: req.route?.path || req.path,
          method: req.method,
          user: req.user
            ? {
                id: req.user.id
              }
            : null,
          ...metadata
        })
        .catch(error => {
          logger.error('Failed to log performance metric to CloudWatch', error);
        });
    };

    next();
  };
}

/**
 * Rate limiting integration with CloudWatch
 */
export function cloudWatchRateLimitLogger() {
  const cloudWatch = getCloudWatch();

  return (req, res, next) => {
    // Monitor rate limiting events
    const originalRateLimit = res.rateLimit;

    if (originalRateLimit) {
      const { limit, remaining, reset } = originalRateLimit;

      // Log rate limit metrics
      cloudWatch
        .sendMetricsBatch([
          {
            name: 'RateLimitUsage',
            value: limit - remaining,
            dimensions: {
              endpoint: req.route?.path || req.path,
              ip: req.ip
            }
          },
          {
            name: 'RateLimitRemaining',
            value: remaining,
            dimensions: {
              endpoint: req.route?.path || req.path,
              ip: req.ip
            }
          }
        ])
        .catch(error => {
          logger.error('Failed to log rate limit metrics to CloudWatch', error);
        });

      // Log rate limit violations
      if (remaining === 0) {
        cloudWatch
          .logSecurityEvent('RateLimitExceeded', 'medium', {
            ip: req.ip,
            endpoint: req.route?.path || req.path,
            limit,
            reset: new Date(reset).toISOString()
          })
          .catch(error => {
            logger.error('Failed to log rate limit violation to CloudWatch', error);
          });
      }
    }

    next();
  };
}

/**
 * Database operation monitoring middleware
 */
export function cloudWatchDatabaseMonitor() {
  const cloudWatch = getCloudWatch();

  return (req, res, next) => {
    // Add database monitoring helper to request
    req.logDatabaseOperation = (operation, duration, success = true, metadata = {}) => {
      cloudWatch
        .logPerformanceMetric(`Database${operation}`, duration, success, {
          table: metadata.table,
          recordCount: metadata.recordCount,
          user: req.user
            ? {
                id: req.user.id
              }
            : null,
          ...metadata
        })
        .catch(error => {
          logger.error('Failed to log database operation to CloudWatch', error);
        });

      // Send database metrics
      cloudWatch
        .sendMetricsBatch([
          {
            name: 'DatabaseOperation',
            value: 1,
            dimensions: {
              operation,
              table: metadata.table || 'unknown',
              success: success ? 'true' : 'false'
            }
          },
          {
            name: 'DatabaseOperationDuration',
            value: duration,
            unit: 'Milliseconds',
            dimensions: {
              operation,
              table: metadata.table || 'unknown'
            }
          }
        ])
        .catch(error => {
          logger.error('Failed to send database metrics to CloudWatch', error);
        });
    };

    next();
  };
}

/**
 * WebSocket connection monitoring middleware
 */
export function cloudWatchWebSocketMonitor() {
  const cloudWatch = getCloudWatch();

  return (req, res, next) => {
    // Add WebSocket monitoring helper to request
    req.logWebSocketEvent = (eventType, metadata = {}) => {
      cloudWatch
        .logEvent('INFO', `WebSocket ${eventType}`, {
          eventType,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          user: req.user
            ? {
                id: req.user.id
              }
            : null,
          ...metadata
        })
        .catch(error => {
          logger.error('Failed to log WebSocket event to CloudWatch', error);
        });

      cloudWatch
        .sendMetric('WebSocketEvent', 1, 'Count', {
          eventType
        })
        .catch(error => {
          logger.error('Failed to send WebSocket metric to CloudWatch', error);
        });
    };

    next();
  };
}

/**
 * Health check endpoint with CloudWatch integration
 */
export function cloudWatchHealthCheck() {
  const cloudWatch = getCloudWatch();

  return async (req, res) => {
    const healthStatus = cloudWatch.getHealthStatus();

    // Log health check
    cloudWatch
      .logEvent('INFO', 'Health Check', {
        status: healthStatus.status,
        endpoint: '/health'
      })
      .catch(error => {
        logger.error('Failed to log health check to CloudWatch', error);
      });

    // Send health check metric
    cloudWatch
      .sendMetric('HealthCheck', 1, 'Count', {
        status: healthStatus.status
      })
      .catch(error => {
        logger.error('Failed to send health check metric to CloudWatch', error);
      });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cloudWatch: healthStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  };
}
