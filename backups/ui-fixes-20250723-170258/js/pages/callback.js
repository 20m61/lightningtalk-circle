import { authService } from '../../src/lib/auth.js';

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

      // Handle OAuth callback
      const result = await authService.handleCallback();

      if (result.success) {
        this.showSuccess();
        // Redirect to original page or dashboard after short delay
        setTimeout(() => {
          // Check if there's a stored redirect URL
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
          sessionStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        }, 2000);
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      console.error('Callback error:', error);
      this.showError('認証処理中にエラーが発生しました');
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
