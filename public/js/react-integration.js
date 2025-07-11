/**
 * React Component Integration for Lightning Talk Circle
 * Initializes React components into the static HTML page
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthenticatedHeader } from '../src/components/AuthenticatedHeader.jsx';
import { ParticipantCounter } from '../src/components/ParticipantCounter.jsx';
import { EventRegistrationModal } from '../src/components/EventRegistrationModal.jsx';
import { Button } from '../src/components/Button.jsx';

class LightningTalkApp {
  constructor() {
    this.isInitialized = false;
    this.modals = {
      registration: null
    };
  }

  init() {
    if (this.isInitialized) return;

    try {
      this.initAuthHeader();
      this.initRegistrationButton();
      this.initParticipantCounter();
      this.isInitialized = true;
      console.log('Lightning Talk React components initialized');
    } catch (error) {
      console.error('Failed to initialize React components:', error);
    }
  }

  initAuthHeader() {
    const authContainer = document.getElementById('auth-header');
    if (!authContainer) return;

    const root = createRoot(authContainer);
    root.render(
      React.createElement(AuthenticatedHeader, {
        onUserChange: user => {
          console.log('User state changed:', user);
          // Update other components based on user state
          this.handleUserStateChange(user);
        }
      })
    );
  }

  initRegistrationButton() {
    const buttonContainer = document.getElementById('registration-button');
    if (!buttonContainer) return;

    const root = createRoot(buttonContainer);
    root.render(
      React.createElement(
        Button,
        {
          variant: 'primary',
          size: 'lg',
          icon: '📝',
          onClick: () => this.showRegistrationModal(),
          className: 'w-full'
        },
        '当日参加申込み'
      )
    );
  }

  initParticipantCounter() {
    const counterContainer = document.getElementById('participant-counter');
    if (!counterContainer) return;

    const root = createRoot(counterContainer);
    root.render(
      React.createElement(ParticipantCounter, {
        eventId: 'event-001',
        showAnimation: true
      })
    );
  }

  showRegistrationModal() {
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('react-registration-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'react-registration-modal';
      document.body.appendChild(modalContainer);
    }

    const root = createRoot(modalContainer);
    root.render(
      React.createElement(EventRegistrationModal, {
        isOpen: true,
        onClose: () => {
          // Clean up modal
          if (modalContainer) {
            modalContainer.remove();
          }
        },
        onSubmit: async formData => {
          try {
            console.log('Registration submitted:', formData);

            // Submit to API
            const response = await fetch('/api/participants', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('[name="_csrf"]')?.value || ''
              },
              body: JSON.stringify({
                ...formData,
                eventId: 'event-001'
              })
            });

            if (response.ok) {
              this.showSuccessMessage('参加申込みが完了しました！');
              // Refresh participant counter
              this.refreshParticipantCounter();
            } else {
              throw new Error('Registration failed');
            }
          } catch (error) {
            console.error('Registration error:', error);
            this.showErrorMessage('申込みに失敗しました。もう一度お試しください。');
          }
        }
      })
    );
  }

  showSuccessMessage(message) {
    // Create temporary success notification
    const notification = document.createElement('div');
    notification.className =
      'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xl">✅</span>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  showErrorMessage(message) {
    // Create temporary error notification
    const notification = document.createElement('div');
    notification.className =
      'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xl">❌</span>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  refreshParticipantCounter() {
    // Force refresh of participant counter
    const counterContainer = document.getElementById('participant-counter');
    if (counterContainer) {
      // Re-initialize the counter
      this.initParticipantCounter();
    }
  }

  handleUserStateChange(user) {
    // Update UI based on user authentication state
    if (user) {
      console.log('User authenticated:', user.name || user.email);
    } else {
      console.log('User logged out');
    }
  }
}

// Create global instance
window.LightningTalk = new LightningTalkApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.LightningTalk.init();
  });
} else {
  window.LightningTalk.init();
}

export default window.LightningTalk;
