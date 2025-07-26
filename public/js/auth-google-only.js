/**
 * Google-Only Authentication Module
 * Googleログインのみの認証システム
 */

class GoogleAuthManager {
  constructor() {
    this.currentUser = null;
    this.config = this.getConfig();
    this.init();
  }

  getConfig() {
    const isDev =
      window.location.hostname.includes('dev') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('cloudfront');

    return {
      userPoolId: isDev ? 'ap-northeast-1_PHRdkumdl' : 'ap-northeast-1_IG3yOKBmT',
      clientId: isDev ? '5t48tpbh5qe26otojkfq1rf0ls' : '42u3ma63qf01utk4jcd6pn9l8s',
      region: 'ap-northeast-1',
      domain: isDev
        ? 'lightningtalk-auth-dev.auth.ap-northeast-1.amazoncognito.com'
        : 'lightningtalk-secure-1753166187.auth.ap-northeast-1.amazoncognito.com',
      redirectUri: `${window.location.origin}/callback`,
      apiEndpoint: window.location.origin.includes('localhost')
        ? 'http://localhost:3333/api'
        : isDev
          ? 'https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api'
          : 'https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api'
    };
  }

  async init() {
    // Check for callback from Cognito
    if (window.location.pathname === '/callback') {
      await this.handleCallback();
      return;
    }

    // Check for existing session
    const token = localStorage.getItem('id_token');
    if (token) {
      try {
        await this.verifyToken(token);
      } catch (error) {
        console.error('Token verification failed:', error);
        this.clearTokens();
      }
    }

    // Setup UI
    this.setupAuthUI();
    this.updateUI();
  }

  setupAuthUI() {
    // Create enhanced auth container
    const authContainer = document.createElement('div');
    authContainer.id = 'auth-container';
    authContainer.className = 'auth-container';

    // Find or create header location
    const header = document.querySelector('header nav');
    if (header) {
      header.appendChild(authContainer);
    }

    // Setup event listeners
    document.addEventListener('click', e => {
      // Close dropdown when clicking outside
      if (!e.target.closest('.user-dropdown')) {
        document.querySelectorAll('.user-dropdown__menu').forEach(menu => {
          menu.classList.remove('active');
        });
      }
    });
  }

  updateUI() {
    const container = document.getElementById('auth-container');
    if (!container) {return;}

    if (this.currentUser) {
      container.innerHTML = this.renderUserProfile();
      this.attachUserMenuEvents();
    } else {
      container.innerHTML = this.renderLoginButton();
    }
  }

  renderLoginButton() {
    return `
      <button class="google-login-btn" onclick="googleAuth.login()">
        <span class="google-login-btn__icon">
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </span>
        <span class="google-login-btn__text">Googleでログイン</span>
      </button>
    `;
  }

  renderUserProfile() {
    const initials = this.getInitials(this.currentUser.name || this.currentUser.email);
    const avatarContent = this.currentUser.picture
      ? `<img src="${this.escapeHtml(this.currentUser.picture)}" alt="Avatar">`
      : `<span>${initials}</span>`;

    return `
      <div class="user-profile">
        <div class="user-avatar">
          ${avatarContent}
        </div>
        <div class="user-info">
          <div class="user-name">${this.escapeHtml(this.currentUser.name || 'User')}</div>
          <div class="user-email">${this.escapeHtml(this.currentUser.email)}</div>
        </div>
        <div class="user-dropdown">
          <button class="user-dropdown__trigger" aria-label="ユーザーメニュー">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path d="M10 4a2 2 0 100-4 2 2 0 000 4z"/>
              <path d="M10 20a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
          </button>
          <div class="user-dropdown__menu">
            ${this.currentUser.role === 'admin' ? '<button class="user-dropdown__item" onclick="googleAuth.openAdminPanel()">管理画面</button>' : ''}
            <button class="user-dropdown__item" onclick="googleAuth.openProfile()">プロフィール</button>
            <button class="user-dropdown__item" onclick="googleAuth.openSettings()">設定</button>
            <div class="user-dropdown__divider"></div>
            <button class="user-dropdown__item user-dropdown__item--danger" onclick="googleAuth.logout()">ログアウト</button>
          </div>
        </div>
      </div>
    `;
  }

  attachUserMenuEvents() {
    const trigger = document.querySelector('.user-dropdown__trigger');
    const menu = document.querySelector('.user-dropdown__menu');

    if (trigger && menu) {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('active');
      });
    }
  }

  async login() {
    // Show loading state
    const container = document.getElementById('auth-container');
    if (container) {
      container.innerHTML =
        '<div class="auth-loading"><div class="auth-loading__spinner"></div><span>認証画面を開いています...</span></div>';
    }

    // Construct authorization URL
    const authUrl =
      `https://${this.config.domain}/login?` +
      `client_id=${this.config.clientId}&` +
      'response_type=code&' +
      'scope=email+openid+profile&' +
      `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
      'identity_provider=Google';

    // Redirect to Cognito hosted UI
    window.location.href = authUrl;
  }

  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('Authentication error:', error);
      this.showError('認証エラーが発生しました。もう一度お試しください。');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return;
    }

    if (code) {
      try {
        // Exchange code for tokens
        const response = await fetch(`${this.config.apiEndpoint}/auth/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri: this.config.redirectUri })
        });

        if (!response.ok) {
          throw new Error('Token exchange failed');
        }

        const data = await response.json();

        // Store tokens
        localStorage.setItem('id_token', data.id_token);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Decode and store user info
        const userInfo = this.decodeToken(data.id_token);
        this.currentUser = {
          email: userInfo.email,
          name: userInfo.name || userInfo['cognito:username'],
          picture: userInfo.picture,
          role: userInfo['custom:role'] || 'user'
        };

        // Redirect to home
        window.location.href = '/';
      } catch (error) {
        console.error('Callback handling error:', error);
        this.showError('認証処理中にエラーが発生しました。');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    }
  }

  async verifyToken(token) {
    try {
      const userInfo = this.decodeToken(token);

      // Check token expiration
      if (userInfo.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      this.currentUser = {
        email: userInfo.email,
        name: userInfo.name || userInfo['cognito:username'],
        picture: userInfo.picture,
        role: userInfo['custom:role'] || 'user'
      };

      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  async logout() {
    // Clear tokens
    this.clearTokens();

    // Clear user data
    this.currentUser = null;

    // Update UI
    this.updateUI();

    // Optional: Logout from Cognito
    const logoutUrl =
      `https://${this.config.domain}/logout?` +
      `client_id=${this.config.clientId}&` +
      `logout_uri=${encodeURIComponent(window.location.origin)}`;

    window.location.href = logoutUrl;
  }

  clearTokens() {
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token decode error:', error);
      throw new Error('Invalid token');
    }
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-error);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      z-index: 9999;
    `;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Placeholder methods for menu actions
  openAdminPanel() {
    window.location.href = '/admin';
  }

  openProfile() {
    // TODO: Implement profile modal
    window.modalSystem?.confirm({
      title: 'プロフィール',
      message: 'プロフィール機能は現在開発中です。',
      type: 'info',
      confirmText: 'OK',
      cancelText: null
    });
  }

  openSettings() {
    // TODO: Implement settings modal
    window.modalSystem?.confirm({
      title: '設定',
      message: '設定機能は現在開発中です。',
      type: 'info',
      confirmText: 'OK',
      cancelText: null
    });
  }

  // Public API
  isAuthenticated() {
    return !!this.currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  async getAuthHeader() {
    const token = localStorage.getItem('id_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Initialize authentication
window.googleAuth = new GoogleAuthManager();

// Legacy function compatibility
window.loginWithGoogle = () => window.googleAuth.login();
window.logout = () => window.googleAuth.logout();
window.isAuthenticated = () => window.googleAuth.isAuthenticated();
window.getAuthHeader = () => window.googleAuth.getAuthHeader();
