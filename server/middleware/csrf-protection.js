/**
 * CSRF Protection Middleware
 * Implements token-based CSRF protection
 */

import crypto from 'crypto';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('csrf');

class CSRFService {
  constructor() {
    this.tokens = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000); // 10 minutes
  }

  // Generate CSRF token
  generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();

    this.tokens.set(token, {
      sessionId,
      timestamp,
      used: false
    });

    logger.debug('CSRF token generated', { sessionId, token: token.substring(0, 8) + '...' });
    return token;
  }

  // Validate CSRF token
  validateToken(token, sessionId) {
    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      logger.warn('CSRF token not found', { token: token?.substring(0, 8) + '...' });
      return false;
    }

    if (tokenData.used) {
      logger.warn('CSRF token already used', { token: token.substring(0, 8) + '...' });
      return false;
    }

    if (tokenData.sessionId !== sessionId) {
      logger.warn('CSRF token session mismatch', {
        expected: sessionId,
        actual: tokenData.sessionId
      });
      return false;
    }

    // Check if token is expired (1 hour)
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (Date.now() - tokenData.timestamp > maxAge) {
      logger.warn('CSRF token expired', { token: token.substring(0, 8) + '...' });
      this.tokens.delete(token);
      return false;
    }

    // Mark token as used (one-time use)
    tokenData.used = true;
    logger.debug('CSRF token validated successfully', { sessionId });
    return true;
  }

  // Middleware to add CSRF token to session
  addToken() {
    return (req, res, next) => {
      // Get or create session ID
      const sessionId = req.sessionID || req.session?.id || req.ip + ':' + req.get('User-Agent');

      // Generate token
      const csrfToken = this.generateToken(sessionId);

      // Add to response locals for templates
      res.locals.csrfToken = csrfToken;

      // Add to response header
      res.set('X-CSRF-Token', csrfToken);

      // Store session ID for validation
      req.csrfSessionId = sessionId;

      next();
    };
  }

  // Middleware to validate CSRF token
  validateCSRFToken() {
    return (req, res, next) => {
      // Skip validation for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Skip validation for API endpoints with proper authentication
      if (req.path.startsWith('/api/') && req.user && req.user.verified) {
        return next();
      }

      const sessionId =
        req.csrfSessionId ||
        req.sessionID ||
        req.session?.id ||
        req.ip + ':' + req.get('User-Agent');

      // Get token from multiple sources
      const token =
        req.body._csrf ||
        req.query._csrf ||
        req.get('X-CSRF-Token') ||
        (req.get('X-Requested-With') === 'XMLHttpRequest' && req.get('X-CSRF-Token'));

      if (!token) {
        logger.warn('CSRF token missing', {
          method: req.method,
          path: req.path,
          ip: req.ip
        });
        return res.status(403).json({
          error: 'CSRF token missing',
          code: 'CSRF_MISSING'
        });
      }

      if (!this.validateToken(token, sessionId)) {
        logger.warn('CSRF token validation failed', {
          method: req.method,
          path: req.path,
          ip: req.ip,
          token: token.substring(0, 8) + '...'
        });
        return res.status(403).json({
          error: 'CSRF token invalid',
          code: 'CSRF_INVALID'
        });
      }

      next();
    };
  }

  // Get token for client-side usage
  getToken(req) {
    return res.locals.csrfToken || req.csrfToken;
  }

  // Cleanup expired tokens
  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    let cleanedCount = 0;

    for (const [token, data] of this.tokens.entries()) {
      if (now - data.timestamp > maxAge || data.used) {
        this.tokens.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('CSRF tokens cleaned up', {
        cleanedCount,
        remainingCount: this.tokens.size
      });
    }
  }

  // Get stats
  getStats() {
    const now = Date.now();
    const activeTokens = Array.from(this.tokens.values()).filter(
      token => !token.used && now - token.timestamp < 60 * 60 * 1000
    ).length;

    return {
      totalTokens: this.tokens.size,
      activeTokens,
      usedTokens: this.tokens.size - activeTokens
    };
  }

  // Destroy cleanup interval
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance

// Helper function to add CSRF token to forms
const addCSRFToForm = (formHTML, token) => {
  const hiddenInput = `<input type="hidden" name="_csrf" value="${token}">`;
  return formHTML.replace(/<form[^>]*>/i, match => match + hiddenInput);
};

export const csrfService = new CSRFService();
export const addToken = csrfService.addToken.bind(csrfService);
export const validateToken = csrfService.validateCSRFToken.bind(csrfService);
export { addCSRFToForm };
