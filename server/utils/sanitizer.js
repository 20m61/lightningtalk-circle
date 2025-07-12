/**
 * HTML Sanitization Utility
 * Provides XSS protection by sanitizing user input
 */

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance with jsdom
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Configure DOMPurify for our use cases
const sanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  FORCE_BODY: true,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  IN_PLACE: false,
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i
};

/**
 * Sanitize HTML content
 * @param {string} dirty - The potentially dangerous HTML string
 * @param {object} options - Optional DOMPurify configuration overrides
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHtml(dirty, options = {}) {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  const config = { ...sanitizeConfig, ...options };
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize plain text (removes all HTML)
 * @param {string} dirty - The potentially dangerous string
 * @returns {string} - Plain text with all HTML removed
 */
export function sanitizeText(dirty) {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // First sanitize to remove dangerous content
  const cleaned = DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });

  // Then decode HTML entities
  const textArea = window.document.createElement('textarea');
  textArea.innerHTML = cleaned;
  return textArea.value;
}

/**
 * Sanitize object recursively
 * @param {object} obj - Object to sanitize
 * @param {function} sanitizer - Sanitization function to apply
 * @returns {object} - Sanitized object
 */
export function sanitizeObject(obj, sanitizer = sanitizeText) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        return sanitizer(item);
      }
      return sanitizeObject(item, sanitizer);
    });
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Middleware to sanitize request body
 * @param {array} fields - Specific fields to sanitize (optional)
 * @param {function} sanitizer - Sanitization function to use
 */
export function sanitizeMiddleware(fields = [], sanitizer = sanitizeText) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    if (fields.length > 0) {
      // Sanitize only specified fields
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizer(req.body[field]);
        }
      });
    } else {
      // Sanitize all string fields
      req.body = sanitizeObject(req.body, sanitizer);
    }

    next();
  };
}

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeObject,
  sanitizeMiddleware
};
