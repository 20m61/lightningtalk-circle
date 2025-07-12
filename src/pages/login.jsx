import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginModal } from '../components/LoginModal';

/**
 * Login Page Entry Point
 * 
 * This file is loaded by login.html to render the login modal
 * in the designated container element.
 */

class LoginPageApp {
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
    const container = document.getElementById('login-container');
    if (!container) {
      console.error('Login container not found');
      return;
    }

    this.root = createRoot(container);
    this.render();
  }

  render() {
    this.root.render(
      <LoginModal 
        isOpen={true}
        onClose={() => {
          // Redirect to home page when modal is closed
          window.location.href = '/';
        }}
        onSuccess={(user) => {
          console.log('Login successful:', user);
          // Redirect to dashboard or home
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
          sessionStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        }}
      />
    );
  }
}

// Initialize the app
new LoginPageApp();