/**
 * Custom Error Classes
 * アプリケーション用のカスタムエラークラス
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, originalError = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        originalError: this.originalError
      })
    };
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null, originalError = null) {
    super(message, 400, originalError);
    this.field = field;
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, originalError);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', originalError = null) {
    super(`${resource} not found`, 404, originalError);
    this.resource = resource;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', originalError = null) {
    super(message, 401, originalError);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', originalError = null) {
    super(message, 403, originalError);
  }
}

export class ConflictError extends AppError {
  constructor(message, originalError = null) {
    super(message, 409, originalError);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null, originalError = null) {
    super(message, 429, originalError);
    this.retryAfter = retryAfter;
  }
}

export class WebSocketError extends AppError {
  constructor(message, originalError = null) {
    super(message, 400, originalError);
  }
}

export class CacheError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, originalError);
  }
}

/**
 * Error handler utility functions
 */
export const handleAsyncError = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const isOperationalError = error => {
  if (error instanceof AppError) {
    return true;
  }
  return false;
};

export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  };

  if (error instanceof AppError) {
    errorInfo.statusCode = error.statusCode;
    errorInfo.originalError = error.originalError;
  }

  console.error('Application Error:', errorInfo);
  return errorInfo;
};
