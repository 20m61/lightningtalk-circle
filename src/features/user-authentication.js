/**
 * User Authentication Feature
 * Client-side authentication management
 */

class UserAuthentication {
  constructor() {
    this.token = null;
    this.user = null;
    this.tokenKey = 'ltc_auth_token';
    this.userKey = 'ltc_user';
    this.loadFromStorage();
  }

  /**
   * Load authentication data from localStorage
   */
  loadFromStorage() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(this.tokenKey);
      const userJson = localStorage.getItem(this.userKey);
      if (userJson) {
        try {
          this.user = JSON.parse(userJson);
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }
  }

  /**
   * Save authentication data to localStorage
   */
  saveToStorage() {
    if (typeof window !== 'undefined') {
      if (this.token) {
        localStorage.setItem(this.tokenKey, this.token);
      } else {
        localStorage.removeItem(this.tokenKey);
      }

      if (this.user) {
        localStorage.setItem(this.userKey, JSON.stringify(this.user));
      } else {
        localStorage.removeItem(this.userKey);
      }
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.token;
        this.user = data.user;
        this.saveToStorage();
        return { success: true, user: this.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Logout user
   */
  logout() {
    this.token = null;
    this.user = null;
    this.saveToStorage();
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  isAdmin() {
    return this.isAuthenticated() && this.user.role === 'admin';
  }

  /**
   * Get authentication headers
   * @returns {Object}
   */
  getAuthHeaders() {
    return this.token
      ? {
          Authorization: `Bearer ${this.token}`
        }
      : {};
  }

  /**
   * Make authenticated request
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>}
   */
  async authenticatedFetch(url, options = {}) {
    const headers = {
      ...options.headers,
      ...this.getAuthHeaders()
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle token expiration
    if (response.status === 401 || response.status === 403) {
      const data = await response.json();
      if (data.error === 'Invalid or expired token') {
        this.logout();
        // Redirect to login page or show login modal
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }
    }

    return response;
  }

  /**
   * Get current user info
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const response = await this.authenticatedFetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        this.saveToStorage();
        return this.user;
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
    }

    return null;
  }

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>}
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.authenticatedFetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message || data.error
      };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        message: 'Failed to change password'
      };
    }
  }

  /**
   * Create login form HTML
   * @returns {string}
   */
  createLoginForm() {
    return `
            <div class="auth-form" id="loginForm">
                <h2>ログイン</h2>
                <form id="authLoginForm">
                    <div class="form-group">
                        <label for="email">メールアドレス</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">パスワード</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <div class="form-error" id="loginError" style="display: none;"></div>
                    <button type="submit" class="btn btn-primary">ログイン</button>
                </form>
            </div>
        `;
  }

  /**
   * Initialize authentication UI
   */
  initializeUI() {
    if (typeof window === 'undefined') return;

    // Add auth status to body
    document.body.classList.toggle('authenticated', this.isAuthenticated());
    document.body.classList.toggle('admin', this.isAdmin());

    // Handle login form submission
    const loginForm = document.getElementById('authLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');

        const result = await this.login(email, password);

        if (result.success) {
          window.location.reload();
        } else {
          const errorDiv = document.getElementById('loginError');
          if (errorDiv) {
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
          }
        }
      });
    }

    // Handle logout
    document.querySelectorAll('.logout-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        this.logout();
        window.location.reload();
      });
    });

    // Listen for auth expiration
    window.addEventListener('auth:expired', () => {
      alert('セッションの有効期限が切れました。再度ログインしてください。');
      window.location.href = '/login';
    });
  }
}

// Export singleton instance
const auth = new UserAuthentication();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => auth.initializeUI());
  } else {
    auth.initializeUI();
  }
}

export default auth;
