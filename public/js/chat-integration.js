/**
 * Chat Integration for Lightning Talk Events
 * Simple integration script to add chat functionality to event pages
 */

(function() {
  'use strict';

  // Chat Integration Class
  class ChatIntegration {
    constructor(options = {}) {
      this.options = {
        eventId: null,
        position: 'bottom-right',
        minimized: true,
        authRequired: true,
        ...options
      };

      this.chatSystem = null;
      this.initialized = false;
      this.authenticated = false;

      this.init();
    }

    async init() {
      try {
        // Check if user is authenticated
        if (this.options.authRequired) {
          this.authenticated = await this.checkAuthentication();
          if (!this.authenticated) {
            this.showLoginPrompt();
            return;
          }
        }

        // Load chat system
        await this.loadChatSystem();

        // Initialize chat for event
        if (this.options.eventId) {
          await this.initEventChat();
        }

        this.initialized = true;
        console.log('Chat integration initialized');
      } catch (error) {
        console.error('Failed to initialize chat integration:', error);
        this.showError('チャット機能の初期化に失敗しました');
      }
    }

    async loadChatSystem() {
      // Check if ChatSystem is already loaded
      if (window.ChatSystem) {
        this.chatSystem = new window.ChatSystem();
        return;
      }

      // Load chat system dynamically
      await this.loadScript('/js/chat-system.js');
      await this.loadStylesheet('/css/chat-system.css');

      // Wait for Socket.io to be available
      if (typeof io === 'undefined') {
        await this.loadScript('/socket.io/socket.io.js');
      }

      // Initialize chat system
      this.chatSystem = new window.ChatSystem();
    }

    async initEventChat() {
      if (!this.chatSystem) {
        throw new Error('Chat system not loaded');
      }

      try {
        // Get or create chat room for event
        const roomId = `event-${this.options.eventId}`;

        // Join the event chat room
        await this.chatSystem.joinRoom(roomId);

        // Update chat title
        this.updateChatTitle();

        // Setup event-specific features
        this.setupEventFeatures();
      } catch (error) {
        console.error('Failed to initialize event chat:', error);
        throw error;
      }
    }

    async checkAuthentication() {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          return false;
        }

        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        return response.ok;
      } catch (error) {
        console.error('Authentication check failed:', error);
        return false;
      }
    }

    showLoginPrompt() {
      const promptDiv = document.createElement('div');
      promptDiv.className = 'chat-login-prompt';
      promptDiv.innerHTML = `
        <div class="chat-login-content">
          <h3>チャットに参加</h3>
          <p>イベントチャットに参加するには、ログインが必要です。</p>
          <button class="btn btn-primary" onclick="this.closest('.chat-login-prompt').remove(); window.location.href='/login'">
            ログイン
          </button>
          <button class="btn btn-outline" onclick="this.closest('.chat-login-prompt').remove()">
            後で
          </button>
        </div>
      `;

      promptDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
      `;

      document.body.appendChild(promptDiv);

      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (promptDiv.parentNode) {
          promptDiv.remove();
        }
      }, 10000);
    }

    updateChatTitle() {
      if (!this.chatSystem?.chatContainer) {
        return;
      }

      const titleElement = this.chatSystem.chatContainer.querySelector('.chat-title');
      if (titleElement) {
        titleElement.textContent = 'イベントチャット';
      }
    }

    setupEventFeatures() {
      // Add event-specific chat features
      this.addEventInfo();
      this.setupQuickActions();
    }

    addEventInfo() {
      if (!this.chatSystem?.chatContainer) {
        return;
      }

      // Get event information from the page
      const eventTitle = document.querySelector('h1')?.textContent || 'Lightning Talk Event';
      const eventDate = document.querySelector('[data-event-date]')?.textContent;
      const eventTime = document.querySelector('[data-event-time]')?.textContent;

      // Add event info to chat header
      const chatHeader = this.chatSystem.chatContainer.querySelector('.chat-header');
      if (chatHeader && !chatHeader.querySelector('.event-info')) {
        const eventInfo = document.createElement('div');
        eventInfo.className = 'event-info';
        eventInfo.innerHTML = `
          <div class="event-title">${eventTitle}</div>
          ${eventDate ? `<div class="event-meta">${eventDate} ${eventTime || ''}</div>` : ''}
        `;
        eventInfo.style.cssText = `
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          line-height: 1.3;
        `;

        chatHeader.appendChild(eventInfo);
      }
    }

    setupQuickActions() {
      if (!this.chatSystem?.chatContainer) {
        return;
      }

      // Add quick action buttons for common event chat messages
      const inputArea = this.chatSystem.chatContainer.querySelector('.chat-input-area');
      if (inputArea && !inputArea.querySelector('.quick-actions')) {
        const quickActions = document.createElement('div');
        quickActions.className = 'quick-actions';
        quickActions.innerHTML = `
          <div class="quick-actions-label">クイックメッセージ:</div>
          <div class="quick-actions-buttons">
            <button class="quick-action-btn" data-message="参加しました！よろしくお願いします🎉">参加表明</button>
            <button class="quick-action-btn" data-message="素晴らしい発表でした！👏">拍手</button>
            <button class="quick-action-btn" data-message="質問があります🙋‍♀️">質問</button>
          </div>
        `;

        quickActions.style.cssText = `
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 12px;
        `;

        // Add click handlers
        quickActions.addEventListener('click', e => {
          if (e.target.classList.contains('quick-action-btn')) {
            const { message } = e.target.dataset;
            if (message && this.chatSystem.messageInput) {
              this.chatSystem.messageInput.value = message;
              this.chatSystem.sendMessage();
            }
          }
        });

        inputArea.insertBefore(quickActions, inputArea.firstChild);
      }
    }

    async loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    async loadStylesheet(href) {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      });
    }

    showError(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'chat-error-notification';
      errorDiv.textContent = message;
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fee2e2;
        color: #dc2626;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        z-index: 1001;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;

      document.body.appendChild(errorDiv);

      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 5000);
    }

    // Public methods
    show() {
      if (this.chatSystem?.chatContainer) {
        this.chatSystem.chatContainer.classList.remove('minimized');
      }
    }

    hide() {
      if (this.chatSystem?.chatContainer) {
        this.chatSystem.chatContainer.classList.add('minimized');
      }
    }

    destroy() {
      if (this.chatSystem) {
        // Leave current room
        this.chatSystem.leaveRoom();

        // Remove chat container
        if (this.chatSystem.chatContainer?.parentNode) {
          this.chatSystem.chatContainer.remove();
        }
      }

      this.initialized = false;
      this.chatSystem = null;
    }
  }

  // Auto-initialize chat if event ID is found in the page
  document.addEventListener('DOMContentLoaded', () => {
    // Look for event ID in various places
    const eventId =
      document.querySelector('[data-event-id]')?.dataset.eventId ||
      document.querySelector('meta[name="event-id"]')?.content ||
      new URLSearchParams(window.location.search).get('eventId');

    if (eventId) {
      window.eventChat = new ChatIntegration({
        eventId,
        minimized: true
      });
    }
  });

  // Export for manual initialization
  window.ChatIntegration = ChatIntegration;

  // Add styles for the integration
  const style = document.createElement('style');
  style.textContent = `
    .quick-actions-label {
      color: #6b7280;
      margin-bottom: 6px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .quick-actions-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    
    .quick-action-btn {
      padding: 4px 8px;
      font-size: 11px;
      border: 1px solid #d1d5db;
      background: #f9fafb;
      color: #374151;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .quick-action-btn:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }
    
    .chat-login-content h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #111827;
    }
    
    .chat-login-content p {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.4;
    }
    
    .chat-login-content .btn {
      margin-right: 8px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      text-decoration: none;
      display: inline-block;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }
    
    .chat-login-content .btn-primary {
      background: #3b82f6;
      color: white;
    }
    
    .chat-login-content .btn-primary:hover {
      background: #2563eb;
    }
    
    .chat-login-content .btn-outline {
      background: transparent;
      color: #6b7280;
      border-color: #d1d5db;
    }
    
    .chat-login-content .btn-outline:hover {
      background: #f3f4f6;
      color: #374151;
    }
  `;
  document.head.appendChild(style);
})();
