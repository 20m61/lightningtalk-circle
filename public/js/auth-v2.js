/**
 * Enhanced Authentication JavaScript v2
 * Handles login, signup, and authentication flows with improved UX
 */

// Authentication state
const AuthState = {
  isLoading: false,
  errors: {},
  user: null
};

// Initialize authentication module
class AuthenticationModule {
  constructor() {
    this.apiEndpoint = window.API_ENDPOINT || '/api';
    this.initializeAuth();
  }

  // Initialize authentication
  async initializeAuth() {
    // Check for existing session
    await this.checkSession();

    // Load Google OAuth if available
    this.loadGoogleAuth();

    // Setup form handlers
    this.setupFormHandlers();
  }

  // Check existing session
  async checkSession() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${this.apiEndpoint}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        AuthState.user = data.user;
        this.redirectAuthenticated();
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }

  // Load Google OAuth
  loadGoogleAuth() {
    // Check if Google auth script is already loaded
    if (window.authModule) {
      window.authModule.onGoogleSignIn = user => this.handleGoogleSignIn(user);
    }
  }

  // Setup form handlers
  setupFormHandlers() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', e => this.handleLogin(e));
    }

    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', e => this.handleSignup(e));
    }

    // Real-time validation
    document.querySelectorAll('.auth-form input').forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('ltc-input--error')) {
          this.validateField(input);
        }
      });
    });
  }

  // Handle login
  async handleLogin(event) {
    event.preventDefault();

    if (AuthState.isLoading) return;

    const form = event.target;
    const formData = new FormData(form);

    // Validate all fields
    const isValid = this.validateForm(form);
    if (!isValid) return;

    // Show loading state
    this.setLoadingState(form, true);

    try {
      const response = await fetch(`${this.apiEndpoint}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          remember: formData.get('remember') === 'on'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        this.handleAuthSuccess(data);
      } else {
        // Error
        this.handleAuthError(data.message || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.handleAuthError('ネットワークエラーが発生しました');
    } finally {
      this.setLoadingState(form, false);
    }
  }

  // Handle signup
  async handleSignup(event) {
    event.preventDefault();

    if (AuthState.isLoading) return;

    const form = event.target;
    const formData = new FormData(form);

    // Validate all fields
    const isValid = this.validateForm(form);
    if (!isValid) return;

    // Check password match
    if (formData.get('password') !== formData.get('confirmPassword')) {
      this.showFieldError(
        form.querySelector('[name="confirmPassword"]'),
        'パスワードが一致しません'
      );
      return;
    }

    // Show loading state
    this.setLoadingState(form, true);

    try {
      const response = await fetch(`${this.apiEndpoint}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password'),
          agreeToTerms: formData.get('agreeToTerms') === 'on'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        this.handleAuthSuccess(data, true);
      } else {
        // Error
        this.handleAuthError(data.message || 'アカウント作成に失敗しました');
      }
    } catch (error) {
      console.error('Signup error:', error);
      this.handleAuthError('ネットワークエラーが発生しました');
    } finally {
      this.setLoadingState(form, false);
    }
  }

  // Handle Google sign in
  async handleGoogleSignIn(googleUser) {
    try {
      const response = await fetch(`${this.apiEndpoint}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idToken: googleUser.credential,
          provider: 'google'
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.handleAuthSuccess(data);
      } else {
        this.handleAuthError(data.message || 'Google認証に失敗しました');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      this.handleAuthError('Google認証でエラーが発生しました');
    }
  }

  // Handle authentication success
  handleAuthSuccess(data, isNewUser = false) {
    // Store token
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    // Store user
    AuthState.user = data.user;

    // Show success message
    const message = isNewUser
      ? 'アカウントを作成しました！'
      : `おかえりなさい、${data.user.name || data.user.email}さん！`;

    showToast(message, 'success');

    // Redirect after delay
    setTimeout(() => {
      this.redirectAuthenticated();
    }, 1500);
  }

  // Handle authentication error
  handleAuthError(message) {
    showToast(message, 'error');
  }

  // Redirect authenticated user
  redirectAuthenticated() {
    const returnUrl = new URLSearchParams(window.location.search).get('return');

    if (returnUrl && returnUrl.startsWith('/')) {
      window.location.href = returnUrl;
    } else if (AuthState.user?.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
  }

  // Validate form
  validateForm(form) {
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  // Validate field
  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;

    // Reset error state
    this.clearFieldError(field);

    // Required check
    if (field.hasAttribute('required') && !value) {
      this.showFieldError(field, 'このフィールドは必須です');
      return false;
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showFieldError(field, '有効なメールアドレスを入力してください');
        return false;
      }
    }

    // Password validation
    if (fieldName === 'password' && value) {
      if (value.length < 8) {
        this.showFieldError(field, 'パスワードは8文字以上で入力してください');
        return false;
      }

      // For signup, check password strength
      if (field.closest('#signup-form')) {
        const strength = this.checkPasswordStrength(value);
        this.updatePasswordStrength(field, strength);
      }
    }

    // Name validation
    if (fieldName === 'name' && value) {
      if (value.length < 2) {
        this.showFieldError(field, '名前は2文字以上で入力してください');
        return false;
      }
    }

    return true;
  }

  // Check password strength
  checkPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
  }

  // Update password strength indicator
  updatePasswordStrength(field, strength) {
    const indicator = field.closest('.ltc-input-container')?.querySelector('.password-strength');

    if (!indicator) return;

    const strengthText = ['弱い', '普通', '良い', '強い', '非常に強い'];
    const strengthClass = ['weak', 'fair', 'good', 'strong', 'excellent'];

    indicator.className = `password-strength strength-${strengthClass[strength]}`;
    indicator.textContent = strengthText[strength];
  }

  // Show field error
  showFieldError(field, message) {
    const container = field.closest('.ltc-input-container');
    const errorDiv = container?.querySelector('.ltc-input-helper--error');

    if (!errorDiv) return;

    field.classList.add('ltc-input--error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    // Animate error
    field.classList.add('shake');
    setTimeout(() => field.classList.remove('shake'), 500);
  }

  // Clear field error
  clearFieldError(field) {
    const container = field.closest('.ltc-input-container');
    const errorDiv = container?.querySelector('.ltc-input-helper--error');

    field.classList.remove('ltc-input--error');
    if (errorDiv) {
      errorDiv.textContent = '';
      errorDiv.style.display = 'none';
    }
  }

  // Set loading state
  setLoadingState(form, isLoading) {
    AuthState.isLoading = isLoading;

    const submitButton = form.querySelector('[type="submit"]');
    const buttonContent = submitButton?.querySelector('.button-content');
    const buttonLoader = submitButton?.querySelector('.button-loader');

    if (submitButton) {
      submitButton.disabled = isLoading;

      if (buttonContent) {
        buttonContent.style.display = isLoading ? 'none' : 'block';
      }

      if (buttonLoader) {
        buttonLoader.style.display = isLoading ? 'block' : 'none';
      }
    }

    // Disable all inputs
    form.querySelectorAll('input').forEach(input => {
      input.disabled = isLoading;
    });
  }
}

// Password visibility toggle
window.togglePassword = function (fieldId) {
  const field = document.getElementById(fieldId);
  const wrapper = field?.closest('.ltc-input-wrapper');
  const eyeIcon = wrapper?.querySelector('.eye-icon');
  const eyeOffIcon = wrapper?.querySelector('.eye-off-icon');

  if (!field) return;

  if (field.type === 'password') {
    field.type = 'text';
    if (eyeIcon) eyeIcon.style.display = 'none';
    if (eyeOffIcon) eyeOffIcon.style.display = 'block';
  } else {
    field.type = 'password';
    if (eyeIcon) eyeIcon.style.display = 'block';
    if (eyeOffIcon) eyeOffIcon.style.display = 'none';
  }
};

// Toast notification helper
window.showToast = function (message, type = 'info') {
  if (window.LightningTalk?.createToast) {
    const toast = window.LightningTalk.createToast({
      message: message,
      type: type,
      duration: 3000
    });

    const container = document.getElementById('toast-container');
    if (container) {
      window.LightningTalk.showToast(toast, container);
    }
  } else {
    // Fallback alert
    alert(message);
  }
};

// Shake animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  .shake {
    animation: shake 0.5s ease-in-out;
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.authenticationModule = new AuthenticationModule();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthenticationModule;
}
