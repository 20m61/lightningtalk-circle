/**
 * OAuth Callback Handler
 * Handle OAuth callbacks from social login providers
 */

class CallbackHandler {
  constructor() {
    this.init();
  }

  async init() {
    try {
      // Update status message
      this.updateStatus('認証情報を処理しています...');

      // Check if we have authService from the new implementation
      if (window.authService) {
        // Use new auth service
        const user = await window.authService.handleGoogleCallback();

        if (user) {
          this.showSuccess();
          // Redirect to original page or dashboard after short delay
          setTimeout(() => {
            // Check if there's a stored redirect URL
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
          }, 2000);
        } else {
          this.showError('認証に失敗しました');
        }
      } else {
        // Fallback to old auth service
        const { authService } = await import('../../src/lib/auth.js');

        const result = await authService.handleCallback();

        if (result.success) {
          // Exchange Cognito token for backend JWT
          await this.exchangeTokens();

          this.showSuccess();
          setTimeout(() => {
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
          }, 2000);
        } else {
          this.showError(result.error);
        }
      }
    } catch (error) {
      console.error('Callback error:', error);
      this.showError(error.message || '認証処理中にエラーが発生しました');
    }
  }

  async exchangeTokens() {
    try {
      // Get Cognito ID token
      const cognitoUser = JSON.parse(localStorage.getItem('cognitoUser') || '{}');
      const idToken = cognitoUser.idToken;

      if (!idToken) {
        throw new Error('ID token not found');
      }

      // Exchange for backend JWT
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Token exchange failed');
      }

      const data = await response.json();

      // Save authentication data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data.user;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  updateStatus(message) {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
      statusElement.innerHTML = `<p class="text-gray-500">${message}</p>`;
    }
  }

  showSuccess() {
    const statusElement = document.getElementById('status-message');
    const successElement = document.getElementById('success-message');

    if (statusElement) {
      statusElement.classList.add('hidden');
    }

    if (successElement) {
      successElement.classList.remove('hidden');
    }
  }

  showError(error) {
    const statusElement = document.getElementById('status-message');
    const errorElement = document.getElementById('error-message');

    if (statusElement) {
      statusElement.classList.add('hidden');
    }

    if (errorElement) {
      errorElement.classList.remove('hidden');
      const errorText = errorElement.querySelector('p');
      if (errorText) {
        errorText.innerHTML = `認証に失敗しました: ${error}<br><a href="/" class="underline hover:text-red-700">ホームページに戻る</a>`;
      }
    }

    // Auto-redirect to home after 5 seconds
    setTimeout(() => {
      window.location.href = '/';
    }, 5000);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CallbackHandler();
  });
} else {
  new CallbackHandler();
}
