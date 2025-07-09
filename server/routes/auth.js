/**
 * Authentication Routes
 * Handle user authentication and management
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  authenticateToken,
  requireAdmin,
  generateToken,
  hashPassword,
  comparePassword,
  validatePassword
} from '../middleware/auth.js';

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/auth/login
 * User login
 */
router.post(
  '/login',
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database } = req.app.locals;
      const { email, password } = req.body;

      // Find user by email
      const users = await database.findAll('users', { email });
      const user = users[0];

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: '認証情報が正しくありません'
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: '認証情報が正しくありません'
        });
      }

      // Generate token
      const token = generateToken(user);

      // Update last login
      await database.update('users', user.id, {
        lastLogin: new Date().toISOString()
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'ログインに失敗しました'
      });
    }
  }
);

/**
 * POST /api/auth/register
 * Register new user (admin only)
 */
router.post(
  '/register',
  authenticateToken,
  requireAdmin,
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').notEmpty().trim().withMessage('Name required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database } = req.app.locals;
      const { email, password, name, role = 'user' } = req.body;

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          error: 'Weak password',
          message: passwordValidation.message
        });
      }

      // Check if user exists
      const existingUsers = await database.findAll('users', { email });
      if (existingUsers.length > 0) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'このメールアドレスは既に登録されています'
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const newUser = await database.create('users', {
        email,
        passwordHash,
        name,
        role,
        createdAt: new Date().toISOString(),
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: '登録に失敗しました'
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { database } = req.app.locals;
    const user = await database.findById('users', req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'ユーザーが見つかりません'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: 'ユーザー情報の取得に失敗しました'
    });
  }
});

/**
 * PUT /api/auth/password
 * Change password
 */
router.put(
  '/password',
  authenticateToken,
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database } = req.app.locals;
      const { currentPassword, newPassword } = req.body;

      // Get user
      const user = await database.findById('users', req.user.id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'ユーザーが見つかりません'
        });
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid current password',
          message: '現在のパスワードが正しくありません'
        });
      }

      // Validate new password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          error: 'Weak password',
          message: passwordValidation.message
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password
      await database.update('users', user.id, {
        passwordHash,
        passwordChangedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        error: 'Password change failed',
        message: 'パスワードの変更に失敗しました'
      });
    }
  }
);

/**
 * GET /api/auth/users
 * List all users (admin only)
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { database } = req.app.locals;
    const users = await database.findAll('users');

    res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'ユーザー一覧の取得に失敗しました'
    });
  }
});

/**
 * DELETE /api/auth/users/:id
 * Delete user (admin only)
 */
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { database } = req.app.locals;
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete self',
        message: '自分自身を削除することはできません'
      });
    }

    // Check if user exists
    const user = await database.findById('users', id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'ユーザーが見つかりません'
      });
    }

    // Delete user
    await database.delete('users', id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({
      error: 'User deletion failed',
      message: 'ユーザーの削除に失敗しました'
    });
  }
});

export default router;
