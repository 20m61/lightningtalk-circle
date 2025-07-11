import React from 'react';
import { createRoot } from 'react-dom/client';
import { authService } from '../lib/auth';

/**
 * OAuth Callback Page Entry Point
 * 
 * This file handles OAuth callbacks from social login providers
 * and provides a React-based UI for the callback process.
 */

const CallbackComponent = () => {
  const [status, setStatus] = React.useState('processing');
  const [message, setMessage] = React.useState('認証情報を処理しています...');
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setStatus('processing');
      setMessage('認証情報を処理しています...');

      // Handle OAuth callback
      const result = await authService.handleCallback();

      if (result.success) {
        setStatus('success');
        setMessage('ログインに成功しました。リダイレクトしています...');
        
        // Redirect after short delay
        setTimeout(() => {
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
          sessionStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        }, 2000);
      } else {
        setStatus('error');
        setError(result.error || '認証に失敗しました');
        setMessage('認証処理中にエラーが発生しました');
        
        // Auto-redirect to home after 5 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      }
    } catch (error) {
      console.error('Callback error:', error);
      setStatus('error');
      setError(error.message || '予期しないエラーが発生しました');
      setMessage('認証処理中にエラーが発生しました');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 5000);
    }
  };

  return (
    <div className="text-center">
      {status === 'processing' && (
        <p className="text-gray-500">{message}</p>
      )}
      
      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-green-600">{message}</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-red-600">
            {error && `認証に失敗しました: ${error}`}
            <br />
            <a href="/" className="underline hover:text-red-700">
              ホームページに戻る
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

class CallbackPageApp {
  constructor() {
    this.root = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.mount());
    } else {
      this.mount();
    }
  }

  mount() {
    const container = document.getElementById('status-message');
    if (!container) {
      console.error('Status message container not found');
      return;
    }

    this.root = createRoot(container);
    this.render();
  }

  render() {
    this.root.render(<CallbackComponent />);
  }
}

// Initialize the app
new CallbackPageApp();