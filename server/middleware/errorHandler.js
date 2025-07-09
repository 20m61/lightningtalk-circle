/**
 * Error handling middleware for Lightning Talk application
 * Supports both database and file-based storage errors
 */

import { logger } from './logger.js';

export const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  const errorContext = {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };

  logger.error('Request error:', errorContext);

  // File system errors
  if (err.code === 'ENOENT') {
    const message = 'Resource not found or file does not exist';
    error = { message, status: 404 };
  }

  if (err.code === 'EACCES' || err.code === 'EPERM') {
    const message = 'Permission denied';
    error = { message, status: 403 };
  }

  if (err.code === 'ENOSPC') {
    const message = 'Insufficient storage space';
    error = { message, status: 507 };
  }

  if (err.code === 'EMFILE' || err.code === 'ENFILE') {
    const message = 'Too many open files';
    error = { message, status: 503 };
  }

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'Invalid JSON format';
    error = { message, status: 400 };
  }

  // File-based database validation errors
  if (err.name === 'ValidationError' || err.name === 'DatabaseValidationError') {
    const message = Array.isArray(err.message) ? err.message : [err.message];
    error = { message: message.join(', '), status: 400 };
  }

  // File-based database constraint errors
  if (err.name === 'ConstraintError' || err.name === 'DatabaseConstraintError') {
    const message = 'Data constraint violation (duplicate or invalid data)';
    error = { message, status: 409 };
  }

  // File-based database not found errors
  if (err.name === 'NotFoundError' || err.name === 'DatabaseNotFoundError') {
    const message = 'Resource not found';
    error = { message, status: 404 };
  }

  // Rate limiting errors
  if (err.name === 'RateLimitError') {
    const message = 'Too many requests, please try again later';
    error = { message, status: 429 };
  }

  // Authentication errors
  if (err.name === 'AuthenticationError' || err.name === 'UnauthorizedError') {
    const message = 'Authentication required';
    error = { message, status: 401 };
  }

  if (err.name === 'AuthorizationError' || err.name === 'ForbiddenError') {
    const message = 'Insufficient permissions';
    error = { message, status: 403 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, status: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    error = { message, status: 401 };
  }

  // Express validator errors
  if (err.name === 'ValidationError' && err.array) {
    const message = err
      .array()
      .map(e => e.msg)
      .join(', ');
    error = { message, status: 400 };
  }

  // Email service errors
  if (err.name === 'EmailError') {
    const message = 'Failed to send email';
    error = { message, status: 502 };
  }

  // GitHub API errors
  if (err.name === 'GitHubError' || err.status) {
    const message = err.message || 'External service error';
    error = { message, status: err.status || 502 };
  }

  // Legacy Mongoose errors (for migration compatibility)
  if (err.name === 'CastError') {
    const message = 'Invalid resource identifier';
    error = { message, status: 400 };
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, status: 409 };
  }

  if (err.name === 'MongooseValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message: message.join(', '), status: 400 };
  }

  // Default to 500 server error
  const statusCode = error.status || 500;
  const message = error.message || 'Internal Server Error';

  // Create error response
  const errorResponse = {
    success: false,
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  };

  // Add additional info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.name = err.name;
    errorResponse.error.details = err;
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.error.requestId = req.id;
  }

  // Set appropriate headers
  res.set({
    'Content-Type': 'application/json',
    'X-Error-Timestamp': errorResponse.error.timestamp
  });

  // Log severe errors differently
  if (statusCode >= 500) {
    logger.error('Server error:', {
      ...errorContext,
      statusCode,
      errorResponse
    });
  } else {
    logger.warn('Client error:', {
      ...errorContext,
      statusCode,
      message
    });
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, _next) => {
  const message = `Route ${req.originalUrl} not found`;

  logger.warn('Route not found:', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    success: false,
    error: {
      message,
      status: 404,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error classes for better error handling
 */
export class DatabaseError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'DatabaseError';
    this.status = status;
  }
}

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found', status = 404) {
    super(message);
    this.name = 'NotFoundError';
    this.status = status;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required', status = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.status = status;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions', status = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
  }
}
