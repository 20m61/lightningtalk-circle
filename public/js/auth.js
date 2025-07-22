/**
 * Cognito Authentication Module
 */

// Configuration
const COGNITO_CONFIG = {
  userPoolId: 'ap-northeast-1_PHRdkumdl',
  clientId: '5t48tpbh5qe26otojkfq1rf0ls',
  region: 'ap-northeast-1',
  domain: 'lightningtalk-auth-dev.auth.ap-northeast-1.amazoncognito.com',
  redirectUri: `${window.location.origin}/callback`,
  apiEndpoint: window.location.origin.includes('localhost')
    ? 'http://localhost:3333/api'
    : 'https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api'
};

// Authentication state
let currentUser = null;

/**
 * Initialize authentication
 */
async function initAuth() {
  // Check for callback from Cognito
  if (window.location.pathname === '/callback') {
    showAuthLoading('認証情報を処理中...');
    await handleCallback();
    return;
  }

  // Check for existing session
  const token = localStorage.getItem('id_token');
  if (token) {
    try {
      await verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('id_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // Update UI
  updateAuthUI();
}

/**
 * Update authentication UI
 */
function updateAuthUI() {
  const authHeader = document.getElementById('auth-header');
  if (!authHeader) {
    return;
  }

  if (currentUser) {
    authHeader.innerHTML = `
      <div class="user-menu">
        <span class="user-name">${escapeHtml(currentUser.name || currentUser.email)}</span>
        <button onclick="logout()" class="btn-logout">ログアウト</button>
      </div>
    `;

    // Close admin login modal if open
    const adminModal = document.getElementById('adminLoginModal');
    if (adminModal && adminModal.classList.contains('show')) {
      closeAdminLogin();
    }

    // Check if user has admin role and redirect if needed
    if (currentUser.role === 'admin' && window.location.pathname === '/') {
      // User can now access admin features
      showAdminSuccessMessage();
    }
  } else {
    authHeader.innerHTML = `
      <button onclick="loginWithGoogle()" class="btn-google-login">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
        Googleでログイン
      </button>
    `;
  }
}

/**
 * Login with Google
 */
function loginWithGoogle() {
  // Show loading state
  showAuthLoading('Googleログインに移動中...');

  const authUrl =
    `https://${COGNITO_CONFIG.domain}/oauth2/authorize?` +
    `client_id=${COGNITO_CONFIG.clientId}&` +
    'response_type=code&' +
    'scope=email+openid+profile&' +
    `redirect_uri=${encodeURIComponent(COGNITO_CONFIG.redirectUri)}&` +
    'identity_provider=Google';

  // Add slight delay for better UX
  setTimeout(() => {
    window.location.href = authUrl;
  }, 500);
}

/**
 * Handle OAuth callback
 */
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (!code) {
    console.error('No authorization code found');
    window.location.href = '/';
    return;
  }

  try {
    // Exchange code for tokens
    const response = await fetch(`${COGNITO_CONFIG.apiEndpoint}/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    const data = await response.json();

    // Store tokens
    localStorage.setItem('id_token', data.id_token);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    // Set current user
    currentUser = data.user;

    // Redirect to home
    window.location.href = '/';
  } catch (error) {
    console.error('Callback handling failed:', error);

    // Show user-friendly error message
    showAuthError('認証に失敗しました。再度お試しください。');

    // Redirect to home after showing error
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  }
}

/**
 * Verify token
 */
async function verifyToken(token) {
  const response = await fetch(`${COGNITO_CONFIG.apiEndpoint}/auth/verify`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Token verification failed');
  }

  const data = await response.json();
  currentUser = data.user;
}

/**
 * Logout
 */
function logout() {
  // Clear tokens
  localStorage.removeItem('id_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  // Clear user
  currentUser = null;

  // Update UI
  updateAuthUI();

  // Redirect to Cognito logout
  const logoutUrl =
    `https://${COGNITO_CONFIG.domain}/logout?` +
    `client_id=${COGNITO_CONFIG.clientId}&` +
    `logout_uri=${encodeURIComponent(window.location.origin)}`;

  window.location.href = logoutUrl;
}

/**
 * Get current user
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!currentUser;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show admin success message
 */
function showAdminSuccessMessage() {
  // Create success notification
  const notification = document.createElement('div');
  notification.className = 'auth-success-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">✅</span>
      <span class="notification-text">管理者としてログインしました</span>
    </div>
  `;

  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * Show authentication error message
 */
function showAuthError(message) {
  // Create error notification
  const notification = document.createElement('div');
  notification.className = 'auth-error-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">❌</span>
      <span class="notification-text">${escapeHtml(message)}</span>
    </div>
  `;

  document.body.appendChild(notification);

  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

/**
 * Show loading state during authentication
 */
function showAuthLoading(message = 'ログイン中...') {
  const authHeader = document.getElementById('auth-header');
  if (authHeader) {
    authHeader.innerHTML = `
      <div class="auth-loading">
        <div class="loading-spinner"></div>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  }
}

/**
 * Close admin login modal
 */
function closeAdminLogin() {
  const modal = document.getElementById('adminLoginModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuth);

// Export functions for use in other scripts
window.auth = {
  getCurrentUser,
  isAuthenticated,
  loginWithGoogle,
  logout
};
