/**
 * Authentication Middleware
 * Handles JWT-based authentication for protected routes
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Ensure JWT_SECRET is set in production
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET environment variable is required in production and must be at least 32 characters long'
      );
    }

    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '⚠️  WARNING: Using development JWT secret. Set JWT_SECRET environment variable for production.'
      );
    }
    return 'development-secret-do-not-use-in-production-must-be-replaced';
  }

  return secret;
};

// Initialize JWT_SECRET on startup
let JWT_SECRET;
try {
  JWT_SECRET = getJwtSecret();
} catch (error) {
  console.error('FATAL ERROR:', error.message);
  process.exit(1);
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: '認証が必要です'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token',
        message: 'トークンが無効または期限切れです'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      message: '管理者権限が必要です'
    });
  }
  next();
};

/**
 * Generate JWT token
 */
export const generateToken = user => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
};

/**
 * Hash password
 */
export const hashPassword = async password => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Validate password strength
 * Returns validation result with errors array for consistency
 */
export const validatePassword = password => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Return both formats for backward compatibility
  return {
    valid: errors.length === 0,
    message: errors[0] || '',
    errors
  };
};

export default {
  authenticateToken,
  requireAdmin,
  generateToken,
  hashPassword,
  comparePassword,
  validatePassword
};
