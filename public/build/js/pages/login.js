/**
 * Login Page - React Integration
 * Integrates the LoginModal component into the static login page
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginModal } from '../../src/components/LoginModal.jsx';

// Initialize the login form
function initializeLoginPage() {
  const container = document.getElementById('login-container');

  if (!container) {
    console.error('Login container not found');
    return;
  }

  // Clear loading content
  container.innerHTML = '';

  // Create React root and render LoginModal
  const root = createRoot(container);

  root.render(
    React.createElement(LoginModal, {
      isOpen: true,
      onClose: () => {
        // Redirect to home on close
        window.location.href = '/';
      },
      onSuccess: user => {
        console.log('Login successful:', user);

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'text-center py-8';
        successMessage.innerHTML = `
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl text-green-600">✅</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">ログイン成功</h3>
          <p class="text-gray-600 mb-4">ようこそ、${user.name || user.email}さん</p>
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
          <p class="text-sm text-gray-500 mt-2">リダイレクト中...</p>
        `;

        container.innerHTML = '';
        container.appendChild(successMessage);

        // Redirect after success
        setTimeout(() => {
          if (user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        }, 2000);
      }
    })
  );
}

// Check if user is already logged in
async function checkAuthStatus() {
  try {
    // Import auth service
    const { authService } = await import('../../src/lib/auth.js');

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // User is already logged in, redirect
      if (currentUser.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
      return true;
    }

    return false;
  } catch (error) {
    console.log('Auth check failed, proceeding with login page');
    return false;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Check if already authenticated
  const isAuthenticated = await checkAuthStatus();

  if (!isAuthenticated) {
    // Initialize login page
    initializeLoginPage();
  }
});

// Handle back button
window.addEventListener('popstate', () => {
  window.location.href = '/';
});
