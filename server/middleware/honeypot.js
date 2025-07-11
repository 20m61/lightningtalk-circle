/**
 * Honeypot Middleware for Bot Detection
 * Implements form honeypots and API endpoint traps
 */

import { createLogger } from '../utils/logger.js';
const logger = createLogger('honeypot');

class HoneypotService {
  constructor() {
    this.suspiciousIPs = new Map();
    this.honeypotHits = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // 5 minutes
  }

  // Form honeypot middleware
  formHoneypot() {
    return (req, res, next) => {
      const honeypotFields = ['website', 'url', 'homepage', 'link'];

      for (const field of honeypotFields) {
        if (req.body[field] && req.body[field].trim() !== '') {
          this.recordHoneypotHit(req, 'form_honeypot', field);
          return res.status(400).json({
            error: 'Invalid form submission',
            code: 'VALIDATION_ERROR'
          });
        }
      }

      next();
    };
  }

  // API endpoint honeypots
  createAPIHoneypot(endpointName) {
    return (req, res) => {
      this.recordHoneypotHit(req, 'api_honeypot', endpointName);

      // Return realistic-looking error to avoid detection
      res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND'
      });
    };
  }

  // Time-based honeypot (form submission too fast)
  timingHoneypot(minTime = 3000) {
    // 3 seconds minimum
    return (req, res, next) => {
      const startTime = req.body._formStartTime;

      if (startTime) {
        const submissionTime = Date.now() - parseInt(startTime, 10);

        if (submissionTime < minTime) {
          this.recordHoneypotHit(req, 'timing_honeypot', `${submissionTime}ms`);
          return res.status(429).json({
            error: 'Please wait before submitting',
            code: 'TOO_FAST'
          });
        }
      }

      next();
    };
  }

  // Behavioral honeypot (suspicious patterns)
  behavioralHoneypot() {
    return (req, res, next) => {
      const suspiciousPatterns = [
        // Multiple rapid requests from same IP
        this.checkRapidRequests(req),
        // Unusual user agent patterns
        this.checkUserAgent(req),
        // Suspicious referer patterns
        this.checkReferer(req),
        // Missing or unusual headers
        this.checkHeaders(req)
      ];

      const suspiciousCount = suspiciousPatterns.filter(Boolean).length;

      if (suspiciousCount >= 2) {
        this.recordHoneypotHit(req, 'behavioral_honeypot', `score:${suspiciousCount}`);

        // Increase rate limiting for this IP
        req.suspiciousActivity = true;
      }

      next();
    };
  }

  recordHoneypotHit(req, type, details) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    const hit = {
      ip,
      type,
      details,
      userAgent,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date(),
      headers: req.headers
    };

    logger.warn('Honeypot triggered', hit);

    // Track by IP
    if (!this.honeypotHits.has(ip)) {
      this.honeypotHits.set(ip, []);
    }
    this.honeypotHits.get(ip).push(hit);

    // Mark IP as suspicious after multiple hits
    const ipHits = this.honeypotHits.get(ip);
    if (ipHits.length >= 3) {
      this.suspiciousIPs.set(ip, {
        firstSeen: ipHits[0].timestamp,
        lastSeen: new Date(),
        hitCount: ipHits.length,
        types: [...new Set(ipHits.map(h => h.type))]
      });

      logger.error('IP marked as suspicious due to multiple honeypot hits', {
        ip,
        hitCount: ipHits.length
      });
    }
  }

  checkRapidRequests(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!this.requestTimings) {
      this.requestTimings = new Map();
    }

    if (!this.requestTimings.has(ip)) {
      this.requestTimings.set(ip, []);
    }

    const timings = this.requestTimings.get(ip);
    timings.push(now);

    // Keep only last 10 requests
    if (timings.length > 10) {
      timings.shift();
    }

    // Check if more than 5 requests in 10 seconds
    const recentRequests = timings.filter(time => now - time < 10000);
    return recentRequests.length > 5;
  }

  checkUserAgent(req) {
    const userAgent = req.get('User-Agent') || '';

    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /python/i,
      /curl/i,
      /wget/i,
      /^$/,
      /test/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  checkReferer(req) {
    const referer = req.get('Referer') || '';
    const host = req.get('Host') || '';

    // Suspicious if referer is completely different domain for form submissions
    if (req.method === 'POST' && referer && !referer.includes(host)) {
      return true;
    }

    return false;
  }

  checkHeaders(req) {
    const requiredHeaders = ['accept', 'accept-language'];
    const missingHeaders = requiredHeaders.filter(header => !req.get(header));

    return missingHeaders.length > 0;
  }

  // Get suspicious IPs
  getSuspiciousIPs() {
    return Array.from(this.suspiciousIPs.entries()).map(([ip, data]) => ({
      ip,
      ...data
    }));
  }

  // Check if IP is suspicious
  isSuspicious(ip) {
    return this.suspiciousIPs.has(ip);
  }

  // Cleanup old data
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean old honeypot hits
    for (const [ip, hits] of this.honeypotHits.entries()) {
      const recentHits = hits.filter(hit => now - hit.timestamp.getTime() < maxAge);
      if (recentHits.length === 0) {
        this.honeypotHits.delete(ip);
      } else {
        this.honeypotHits.set(ip, recentHits);
      }
    }

    // Clean old suspicious IPs
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen.getTime() > maxAge) {
        this.suspiciousIPs.delete(ip);
      }
    }

    // Clean old request timings
    if (this.requestTimings) {
      for (const [ip, timings] of this.requestTimings.entries()) {
        const recentTimings = timings.filter(time => now - time < 60000); // 1 minute
        if (recentTimings.length === 0) {
          this.requestTimings.delete(ip);
        } else {
          this.requestTimings.set(ip, recentTimings);
        }
      }
    }

    logger.info('Honeypot cleanup completed', {
      suspiciousIPs: this.suspiciousIPs.size,
      honeypotHits: this.honeypotHits.size
    });
  }

  // Destroy cleanup interval
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create singleton instance and export
export const honeypotService = new HoneypotService();
export const formHoneypot = honeypotService.formHoneypot.bind(honeypotService);
export const timingHoneypot = honeypotService.timingHoneypot.bind(honeypotService);
export const behavioralHoneypot = honeypotService.behavioralHoneypot.bind(honeypotService);
export const createAPIHoneypot = honeypotService.createAPIHoneypot.bind(honeypotService);
