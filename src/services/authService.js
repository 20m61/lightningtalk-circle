/**
 * Authentication Service
 * Handles authentication flow between Cognito and backend API
 */

import { getIdToken, handleCallback as cognitoHandleCallback } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.user = this.loadUser();
  }

  /**
   * Load user from localStorage
   */
  loadUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Save authentication data
   */
  saveAuthData(token, refreshToken, user) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.user = user;

    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Clear authentication data
   */
  clearAuthData() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;

    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('cognitoUser');
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(location = window.location) {
    try {
      // Handle Cognito callback
      const cognitoUser = await cognitoHandleCallback(location);

      if (!cognitoUser) {
        throw new Error('Failed to get Cognito user');
      }

      // Get ID token
      const idToken = await getIdToken();

      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      // Exchange Cognito token for backend JWT
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google authentication failed');
      }

      const data = await response.json();

      // Save authentication data
      this.saveAuthData(data.token, data.refreshToken, data.user);

      return data.user;
    } catch (error) {
      console.error('Google authentication error:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();

      // Save authentication data
      this.saveAuthData(data.token, data.refreshToken, data.user);

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user (admin only)
   */
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Update tokens
      this.token = data.token;
      this.refreshToken = data.refreshToken;

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);

      return data.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear auth data on refresh failure
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          await this.refreshAuthToken();
          // Retry request
          return this.getCurrentUser();
        }
        throw new Error('Failed to get user');
      }

      const user = await response.json();
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get users');
      }

      return await response.json();
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(userId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }

      return await response.json();
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  logout() {
    this.clearAuthData();
    // Redirect to home page
    window.location.href = '/';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.user?.role === 'admin';
  }

  /**
   * Get auth headers
   */
  getAuthHeaders() {
    return this.token
      ? {
          Authorization: `Bearer ${this.token}`
        }
      : {};
  }
}

// Export singleton instance
export default new AuthService();
