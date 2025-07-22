/**
 * Log Data Sanitization Utilities
 * Provides functions to sanitize and filter sensitive data before logging
 */

// Sensitive field patterns to filter
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'ssn',
  'api_key',
  'private_key',
  'access_token',
  'refresh_token',
  'client_secret'
];

// PII patterns
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
  ssn: /\d{3}-\d{2}-\d{4}/g,
  creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
  ipv4: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g,
  ipv6: /([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g
};

/**
 * Deep clone an object to avoid modifying the original
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  if (obj instanceof RegExp) {
    return new RegExp(obj);
  }

  const clonedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(fieldName) {
  const lowerFieldName = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(sensitive => lowerFieldName.includes(sensitive));
}

/**
 * Mask sensitive string values
 */
function maskValue(value, showFirst = 0, showLast = 0) {
  if (typeof value !== 'string' || value.length <= showFirst + showLast) {
    return '[REDACTED]';
  }

  const first = value.substring(0, showFirst);
  const last = value.substring(value.length - showLast);
  const masked = '*'.repeat(Math.max(0, value.length - showFirst - showLast));

  return `${first}${masked}${last}`;
}

/**
 * Mask PII in string values
 */
function maskPII(str) {
  if (typeof str !== 'string') {
    return str;
  }

  let masked = str;

  // Mask emails (keep domain)
  masked = masked.replace(PII_PATTERNS.email, match => {
    const [local, domain] = match.split('@');
    return `${maskValue(local, 1, 0)}@${domain}`;
  });

  // Mask phone numbers
  masked = masked.replace(PII_PATTERNS.phone, '[PHONE]');

  // Mask SSN
  masked = masked.replace(PII_PATTERNS.ssn, '[SSN]');

  // Mask credit cards
  masked = masked.replace(PII_PATTERNS.creditCard, match => {
    const cleaned = match.replace(/[\s-]/g, '');
    return maskValue(cleaned, 0, 4);
  });

  // Mask IP addresses (keep first octet for v4)
  masked = masked.replace(PII_PATTERNS.ipv4, match => {
    const parts = match.split('.');
    return `${parts[0]}.xxx.xxx.xxx`;
  });

  masked = masked.replace(PII_PATTERNS.ipv6, '[IPv6]');

  return masked;
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj, options = {}) {
  const {
    maskSensitive = true,
    maskPIIData = true,
    maxDepth = 10,
    maxArrayLength = 100,
    maxStringLength = 1000
  } = options;

  function sanitize(data, depth = 0) {
    if (depth > maxDepth) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    if (data === null || data === undefined) {
      return data;
    }

    // Handle strings
    if (typeof data === 'string') {
      let sanitized = data;

      // Truncate long strings
      if (sanitized.length > maxStringLength) {
        sanitized = `${sanitized.substring(0, maxStringLength)}...[TRUNCATED]`;
      }

      // Mask PII
      if (maskPIIData) {
        sanitized = maskPII(sanitized);
      }

      return sanitized;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      const truncated = data.length > maxArrayLength;
      const items = truncated ? data.slice(0, maxArrayLength) : data;

      const sanitized = items.map(item => sanitize(item, depth + 1));

      if (truncated) {
        sanitized.push(`[${data.length - maxArrayLength} MORE ITEMS]`);
      }

      return sanitized;
    }

    // Handle objects
    if (typeof data === 'object') {
      const sanitized = {};

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Check if field is sensitive
          if (maskSensitive && isSensitiveField(key)) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = sanitize(data[key], depth + 1);
          }
        }
      }

      return sanitized;
    }

    // Return primitives as-is
    return data;
  }

  return sanitize(deepClone(obj));
}

/**
 * Sanitize HTTP headers
 */
export function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    // Completely remove sensitive headers
    if (
      lowerKey.includes('authorization') ||
      lowerKey.includes('cookie') ||
      lowerKey.includes('x-api-key')
    ) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = maskPII(String(value));
    }
  }

  return sanitized;
}

/**
 * Sanitize request object for logging
 */
export function sanitizeRequest(req, options = {}) {
  if (!req || typeof req !== 'object') {
    return {};
  }

  return {
    method: req.method,
    url: req.url,
    path: req.path,
    params: sanitizeObject(req.params, options),
    query: sanitizeObject(req.query, options),
    headers: sanitizeHeaders(req.headers),
    body: sanitizeObject(req.body, options),
    ip: req.ip ? maskPII(req.ip) : undefined,
    userAgent: req.get ? req.get('user-agent') : undefined,
    user: req.user
      ? {
        id: req.user.id,
        email: req.user.email ? maskPII(req.user.email) : undefined,
        role: req.user.role
      }
      : undefined
  };
}

/**
 * Sanitize error object for logging
 */
export function sanitizeError(error, options = {}) {
  if (!error) {
    return {};
  }

  const sanitized = {
    name: error.name,
    message: maskPII(error.message),
    code: error.code,
    statusCode: error.statusCode
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    sanitized.stack = error.stack;
  }

  // Sanitize any additional properties
  if (error.details) {
    sanitized.details = sanitizeObject(error.details, options);
  }

  return sanitized;
}

/**
 * Sanitize any data for logging
 */
export function sanitizeData(data, options = {}) {
  return sanitizeObject(data, options);
}

// Export main function as default
export default sanitizeObject;
