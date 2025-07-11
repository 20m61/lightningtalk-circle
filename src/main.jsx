import React from 'react';
import ReactDOM from 'react-dom/client';
import './main.css';

// Import components
import { Button } from './components/Button.jsx';
import { Modal } from './components/Modal.jsx';
import { EventRegistrationModal } from './components/EventRegistrationModal.jsx';
import { EventManagementModal } from './components/EventManagementModal.jsx';
import { ParticipantCounter } from './components/ParticipantCounter.jsx';
import { authService } from './lib/auth';

// Make components globally available
window.LightningTalk = {
  React,
  ReactDOM,
  components: {
    Button,
    Modal,
    EventRegistrationModal,
    EventManagementModal,
    ParticipantCounter
  },
  authService,

  // Helper function to mount components
  mount(Component, props, elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id "${elementId}" not found`);
      return;
    }

    const root = ReactDOM.createRoot(element);
    root.render(React.createElement(Component, props));
    return root;
  },

  // Initialize all components on page
  init() {
    console.log('⚡ Lightning Talk Circle UI initialized');

    // Check for auth callback
    if (window.location.pathname === '/callback') {
      authService.handleCallback().then(result => {
        if (result.success) {
          window.location.href = '/';
        } else {
          console.error('Auth callback failed:', result.error);
        }
      });
    }

    // Initialize participant counters
    document.querySelectorAll('[data-lt-counter]').forEach(element => {
      const eventId = element.dataset.ltCounter;
      const showDetails = element.dataset.ltShowDetails !== 'false';

      this.mount(ParticipantCounter, { eventId, showDetails }, element.id);
    });

    // Initialize buttons
    document.querySelectorAll('[data-lt-button]').forEach(element => {
      const props = JSON.parse(element.dataset.ltButton || '{}');
      this.mount(Button, props, element.id);
    });
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.LightningTalk.init();
  });
} else {
  window.LightningTalk.init();
}
