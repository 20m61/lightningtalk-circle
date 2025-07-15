/**
 * Authentication Integration Bridge
 * Connects the new auth UI with existing auth.js module
 */

// Wait for auth module to be available
function waitForAuthModule() {
  return new Promise(resolve => {
    const checkInterval = setInterval(() => {
      if (window.authModule) {
        clearInterval(checkInterval);
        resolve(window.authModule);
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(null);
    }, 5000);
  });
}

// Initialize auth integration
async function initializeAuthIntegration() {
  // Load auth.js if not already loaded
  if (!window.authModule) {
    const script = document.createElement('script');
    script.src = '/js/auth.js';
    script.type = 'module';
    document.head.appendChild(script);
  }

  // Wait for auth module
  const authModule = await waitForAuthModule();

  if (!authModule) {
    console.error('Failed to load auth module');
    return;
  }

  // Enhance Google OAuth handling
  enhanceGoogleOAuth(authModule);

  // Integrate with new auth forms
  integrateAuthForms(authModule);
}

// Enhance Google OAuth
function enhanceGoogleOAuth(authModule) {
  // Override the Google sign-in handler
  const originalSignInWithGoogle = authModule.signInWithGoogle;

  authModule.signInWithGoogle = async function () {
    try {
      // Show loading state
      showGoogleAuthLoading(true);

      // Call original method
      const result = await originalSignInWithGoogle.call(authModule);

      if (result) {
        handleGoogleAuthSuccess(result);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      handleGoogleAuthError(error);
    } finally {
      showGoogleAuthLoading(false);
    }
  };

  // Handle Google auth callback
  if (authModule.onGoogleSignIn) {
    const originalCallback = authModule.onGoogleSignIn;

    authModule.onGoogleSignIn = function (response) {
      // Add enhanced UI feedback
      if (response.error) {
        handleGoogleAuthError(response.error);
      } else {
        handleGoogleAuthSuccess(response);
      }

      // Call original callback
      originalCallback.call(authModule, response);
    };
  }
}

// Integrate with auth forms
function integrateAuthForms(authModule) {
  // Override form handlers in auth-v2.js
  if (window.authenticationModule) {
    const auth = window.authenticationModule;

    // Enhance login handler
    const originalHandleLogin = auth.handleLogin.bind(auth);
    auth.handleLogin = async function (event) {
      event.preventDefault();

      const form = event.target;
      const formData = new FormData(form);

      try {
        // Use existing auth service
        const result = await authModule.login({
          email: formData.get('email'),
          password: formData.get('password'),
          remember: formData.get('remember') === 'on'
        });

        if (result.success) {
          auth.handleAuthSuccess(result);
        } else {
          auth.handleAuthError(result.message);
        }
      } catch (error) {
        console.error('Login error:', error);
        auth.handleAuthError('ログインに失敗しました');
      }
    };

    // Enhance signup handler
    const originalHandleSignup = auth.handleSignup.bind(auth);
    auth.handleSignup = async function (event) {
      event.preventDefault();

      const form = event.target;
      const formData = new FormData(form);

      try {
        // Use existing auth service
        const result = await authModule.signup({
          name: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password')
        });

        if (result.success) {
          auth.handleAuthSuccess(result, true);
        } else {
          auth.handleAuthError(result.message);
        }
      } catch (error) {
        console.error('Signup error:', error);
        auth.handleAuthError('アカウント作成に失敗しました');
      }
    };
  }
}

// Show Google auth loading state
function showGoogleAuthLoading(isLoading) {
  const googleButtons = document.querySelectorAll('.btn-google-auth');

  googleButtons.forEach(button => {
    if (isLoading) {
      button.disabled = true;
      button.innerHTML = `
        <div class="google-auth-loading">
          <span class="loader-spinner"></span>
          <span>認証中...</span>
        </div>
      `;
    } else {
      button.disabled = false;
      button.innerHTML = `
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        <span>${button.textContent.includes('登録') ? 'Googleで登録' : 'Googleでログイン'}</span>
      `;
    }
  });
}

// Handle Google auth success
function handleGoogleAuthSuccess(response) {
  const user = response.user || response;
  const message = `Googleアカウントでログインしました: ${user.email}`;

  if (window.showToast) {
    showToast(message, 'success');
  }

  // Smooth redirect
  setTimeout(() => {
    window.location.href = user.role === 'admin' ? '/admin' : '/dashboard';
  }, 1000);
}

// Handle Google auth error
function handleGoogleAuthError(error) {
  const message = error.message || 'Google認証に失敗しました';

  if (window.showToast) {
    showToast(message, 'error');
  }

  showGoogleAuthLoading(false);
}

// Enhanced form validation with real-time feedback
function enhanceFormValidation() {
  // Add input formatting
  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', function () {
      this.value = this.value.toLowerCase().trim();
    });
  });

  // Add password strength meter animation
  document.querySelectorAll('input[name="password"]').forEach(input => {
    input.addEventListener('input', function () {
      const strength = calculatePasswordStrength(this.value);
      updatePasswordStrengthMeter(this, strength);
    });
  });
}

// Calculate password strength
function calculatePasswordStrength(password) {
  let score = 0;

  // Length
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // Common patterns (negative score)
  if (/^[a-zA-Z]+$/.test(password)) score -= 10;
  if (/^[0-9]+$/.test(password)) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// Update password strength meter
function updatePasswordStrengthMeter(input, score) {
  const container = input.closest('.ltc-input-container');
  let meter = container.querySelector('.password-strength-meter');

  if (!meter) {
    meter = document.createElement('div');
    meter.className = 'password-strength-meter';
    meter.innerHTML = `
      <div class="strength-bar">
        <div class="strength-fill"></div>
      </div>
      <span class="strength-text"></span>
    `;
    container.querySelector('.ltc-input-helper').appendChild(meter);
  }

  const fill = meter.querySelector('.strength-fill');
  const text = meter.querySelector('.strength-text');

  // Update fill
  fill.style.width = `${score}%`;

  // Update color and text
  if (score < 30) {
    fill.style.background = '#ef4444';
    text.textContent = '弱い';
  } else if (score < 50) {
    fill.style.background = '#f59e0b';
    text.textContent = '普通';
  } else if (score < 70) {
    fill.style.background = '#eab308';
    text.textContent = '良い';
  } else if (score < 90) {
    fill.style.background = '#84cc16';
    text.textContent = '強い';
  } else {
    fill.style.background = '#10b981';
    text.textContent = '非常に強い';
  }
}

// Add styles for enhancements
const enhancementStyles = `
  .google-auth-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .google-auth-loading .loader-spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top-color: #4285f4;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  .password-strength-meter {
    margin-top: 0.5rem;
  }
  
  .strength-bar {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.25rem;
  }
  
  .strength-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 2px;
  }
  
  .strength-text {
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

// Inject enhancement styles
const styleSheet = document.createElement('style');
styleSheet.textContent = enhancementStyles;
document.head.appendChild(styleSheet);

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeAuthIntegration();
    enhanceFormValidation();
  });
} else {
  initializeAuthIntegration();
  enhanceFormValidation();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeAuthIntegration,
    enhanceGoogleOAuth,
    calculatePasswordStrength
  };
}
