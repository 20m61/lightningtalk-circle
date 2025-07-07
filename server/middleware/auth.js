/**
 * Authentication Middleware
 * Handles JWT-based authentication for protected routes
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Ensure JWT_SECRET is set in production
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }

  if (!secret) {
    console.warn(
      '⚠️  WARNING: Using development JWT secret. Set JWT_SECRET environment variable for production.'
    );
    return 'development-secret-do-not-use-in-production';
  }

  return secret;
};

const JWT_SECRET = getJwtSecret();

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
 */
export const validatePassword = password => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one special character (!@#$%^&*)'
    };
  }

  return { valid: true };
};

export default {
  authenticateToken,
  requireAdmin,
  generateToken,
  hashPassword,
  comparePassword,
  validatePassword
};
