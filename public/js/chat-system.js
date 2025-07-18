/**
 * Chat System v2 - Frontend Implementation
 * Real-time chat system for Lightning Talk Circle
 */

class ChatSystem {
  constructor() {
    this.socket = null;
    this.logger = window.Logger;
    this.currentRoom = null;
    this.currentUser = null;
    this.messages = new Map();
    this.typingUsers = new Set();
    this.isConnected = false;
    this.messageQueue = [];
    this.eventHandlers = new Map();

    // UI elements
    this.chatContainer = null;
    this.messageList = null;
    this.messageInput = null;
    this.typingIndicator = null;
    this.userList = null;

    // Settings
    this.settings = {
      maxMessages: 1000,
      typingTimeout: 3000,
      reconnectDelay: 1000,
      messageRetryLimit: 3
    };

    this.init();
  }

  /**
   * Initialize chat system
   */
  async init() {
    try {
      // Get authentication token
      this.authToken = await this.getAuthToken();

      // Initialize Socket.io connection
      await this.initializeSocket();

      // Create chat UI
      this.createChatUI();

      // Setup event handlers
      this.setupEventHandlers();

      this.logger.info('Chat system initialized successfully', { category: 'chat' });
    } catch (error) {
      this.logger.error('Failed to initialize chat system', {
        error: error.message,
        category: 'chat'
      });
    }
  }

  /**
   * Initialize Socket.io connection
   */
  async initializeSocket() {
    const socketUrl = window.location.origin;

    this.socket = io(socketUrl, {
      auth: {
        token: this.authToken
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    // Connection events
    this.socket.on('connect', () => {
      this.logger.info('Connected to chat server', { category: 'chat' });
      this.isConnected = true;
      this.processMessageQueue();
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', reason => {
      this.logger.warn('Disconnected from chat server', { reason, category: 'chat' });
      this.isConnected = false;
      this.updateConnectionStatus(false);
    });

    this.socket.on('connect_error', error => {
      this.logger.error('Chat connection error', { error: error.message, category: 'chat' });
      this.handleConnectionError(error);
    });

    // Chat-specific events
    this.socket.on('chat:room-joined', this.handleRoomJoined.bind(this));
    this.socket.on('chat:room-left', this.handleRoomLeft.bind(this));
    this.socket.on('chat:message-received', this.handleMessageReceived.bind(this));
    this.socket.on('chat:message-edited', this.handleMessageEdited.bind(this));
    this.socket.on('chat:message-deleted', this.handleMessageDeleted.bind(this));
    this.socket.on('chat:reaction-added', this.handleReactionAdded.bind(this));
    this.socket.on('chat:reaction-removed', this.handleReactionRemoved.bind(this));
    this.socket.on('chat:user-joined', this.handleUserJoined.bind(this));
    this.socket.on('chat:user-left', this.handleUserLeft.bind(this));
    this.socket.on('chat:user-typing', this.handleUserTyping.bind(this));
    this.socket.on('chat:mention', this.handleMention.bind(this));
    this.socket.on('chat:error', this.handleChatError.bind(this));
  }

  /**
   * Create chat UI
   */
  createChatUI() {
    // Create main chat container
    this.chatContainer = document.createElement('div');
    this.chatContainer.className = 'chat-container';
    this.chatContainer.innerHTML = this.getChatHTML();

    // Get UI elements
    this.messageList = this.chatContainer.querySelector('.chat-messages');
    this.messageInput = this.chatContainer.querySelector('.chat-input');
    this.typingIndicator = this.chatContainer.querySelector('.typing-indicator');
    this.userList = this.chatContainer.querySelector('.chat-participants');

    // Setup input handlers
    this.setupInputHandlers();

    // Add to page (this could be done differently based on integration needs)
    this.attachToPage();
  }

  /**
   * Get chat HTML template
   */
  getChatHTML() {
    return `
      <div class="chat-header">
        <h3 class="chat-title">Chat</h3>
        <div class="chat-controls">
          <button class="chat-control-btn" data-action="toggle-participants" title="参加者一覧">
            👥
          </button>
          <button class="chat-control-btn" data-action="toggle-settings" title="設定">
            ⚙️
          </button>
          <button class="chat-control-btn chat-minimize" data-action="minimize" title="最小化">
            −
          </button>
        </div>
        <div class="connection-status">
          <span class="status-indicator" data-status="disconnected"></span>
        </div>
      </div>

      <div class="chat-main">
        <div class="chat-messages-container">
          <div class="chat-messages" role="log" aria-live="polite" aria-label="チャットメッセージ">
            <!-- Messages will be inserted here -->
          </div>
          <div class="typing-indicator" style="display: none;">
            <span class="typing-text"></span>
          </div>
        </div>

        <div class="chat-participants" style="display: none;">
          <h4>参加者</h4>
          <div class="participants-list">
            <!-- Participants will be listed here -->
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div class="chat-input-toolbar">
          <button class="chat-tool-btn" data-action="attach-file" title="ファイル添付">
            📎
          </button>
          <button class="chat-tool-btn" data-action="emoji" title="絵文字">
            😊
          </button>
        </div>
        <div class="chat-input-wrapper">
          <textarea 
            class="chat-input" 
            placeholder="メッセージを入力..."
            rows="1"
            maxlength="2000"
            aria-label="メッセージ入力欄"></textarea>
          <button class="chat-send-btn" disabled title="送信">
            ➤
          </button>
        </div>
        <div class="chat-input-counter">
          <span class="char-count">0</span> / 2000
        </div>
      </div>

      <input type="file" class="chat-file-input" style="display: none;" 
             accept=".jpg,.jpeg,.png,.gif,.pdf" />
    `;
  }

  /**
   * Setup input event handlers
   */
  setupInputHandlers() {
    const sendBtn = this.chatContainer.querySelector('.chat-send-btn');
    const fileInput = this.chatContainer.querySelector('.chat-file-input');
    const charCount = this.chatContainer.querySelector('.char-count');

    // Message input handling
    this.messageInput.addEventListener('input', e => {
      const text = e.target.value;
      const charLength = text.length;

      // Update character counter
      charCount.textContent = charLength;

      // Enable/disable send button
      sendBtn.disabled = text.trim().length === 0;

      // Auto-resize textarea
      this.autoResizeTextarea(e.target);

      // Handle typing indicator
      this.handleTypingInput();
    });

    // Send message on Enter (Shift+Enter for new line)
    this.messageInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Send button click
    sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    // File upload handling
    this.chatContainer
      .querySelector('[data-action="attach-file"]')
      .addEventListener('click', () => {
        fileInput.click();
      });

    fileInput.addEventListener('change', e => {
      if (e.target.files.length > 0) {
        this.uploadFile(e.target.files[0]);
      }
    });

    // Control buttons
    this.chatContainer.addEventListener('click', e => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleControlAction(action, e.target);
      }
    });

    // Message interactions
    this.messageList.addEventListener('click', e => {
      if (e.target.classList.contains('message-reaction-btn')) {
        const messageId = e.target.closest('.message-item').dataset.messageId;
        const emoji = e.target.dataset.emoji;
        this.toggleReaction(messageId, emoji);
      }

      if (e.target.classList.contains('message-reply-btn')) {
        const messageId = e.target.closest('.message-item').dataset.messageId;
        this.replyToMessage(messageId);
      }
    });
  }

  /**
   * Join a chat room
   */
  async joinRoom(roomId) {
    if (!this.isConnected) {
      throw new Error('Not connected to chat server');
    }

    try {
      this.currentRoom = roomId;

      // Emit join room event
      this.socket.emit('chat:join-room', {
        roomId: roomId,
        userId: await this.getCurrentUserId()
      });

      // Update UI
      this.updateChatTitle(roomId);
      this.clearMessages();

      console.log(`Joining chat room: ${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Leave current chat room
   */
  async leaveRoom() {
    if (!this.currentRoom || !this.isConnected) {
      return;
    }

    try {
      this.socket.emit('chat:leave-room', {
        roomId: this.currentRoom,
        userId: await this.getCurrentUserId()
      });

      this.currentRoom = null;
      this.clearMessages();

      console.log('Left chat room');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  }

  /**
   * Send a message
   */
  async sendMessage() {
    const text = this.messageInput.value.trim();
    if (!text || !this.currentRoom || !this.isConnected) {
      return;
    }

    try {
      // Check for mentions
      const mentions = this.extractMentions(text);

      // Prepare message data
      const messageData = {
        roomId: this.currentRoom,
        content: text,
        mentions: mentions,
        replyTo: this.replyToMessageId || null
      };

      // Send via WebSocket
      this.socket.emit('chat:send-message', messageData);

      // Clear input
      this.messageInput.value = '';
      this.chatContainer.querySelector('.chat-send-btn').disabled = true;
      this.chatContainer.querySelector('.char-count').textContent = '0';
      this.autoResizeTextarea(this.messageInput);

      // Clear reply state
      this.clearReplyState();

      console.log('Message sent:', text);
    } catch (error) {
      console.error('Failed to send message:', error);
      this.showError('メッセージの送信に失敗しました');
    }
  }

  /**
   * Handle received message
   */
  handleMessageReceived(data) {
    const { message, roomId } = data;

    if (roomId !== this.currentRoom) {
      return;
    }

    this.addMessageToUI(message);
    this.scrollToBottom();

    // Play notification sound (if enabled)
    this.playNotificationSound();
  }

  /**
   * Add message to UI
   */
  addMessageToUI(message) {
    const messageElement = this.createMessageElement(message);
    this.messageList.appendChild(messageElement);

    // Store message
    this.messages.set(message.id, message);

    // Limit messages in memory
    if (this.messages.size > this.settings.maxMessages) {
      const oldestId = this.messages.keys().next().value;
      this.messages.delete(oldestId);

      // Remove from UI
      const oldestElement = this.messageList.querySelector(`[data-message-id="${oldestId}"]`);
      if (oldestElement) {
        oldestElement.remove();
      }
    }
  }

  /**
   * Create message element
   */
  createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-item ${this.getMessageClasses(message)}`;
    messageDiv.dataset.messageId = message.id;

    const isOwnMessage = message.userId === this.currentUser?.id;

    messageDiv.innerHTML = `
      <div class="message-content">
        ${!isOwnMessage ? `<div class="message-author">${this.escapeHtml(message.username)}</div>` : ''}
        <div class="message-text">${this.formatMessageText(message.content.text)}</div>
        ${message.content.replyTo ? this.createReplyElement(message.content.replyTo) : ''}
        <div class="message-meta">
          <span class="message-time">${this.formatTime(message.createdAt)}</span>
          ${message.edited.isEdited ? '<span class="message-edited">(編集済み)</span>' : ''}
        </div>
      </div>
      <div class="message-actions">
        <button class="message-action-btn message-reaction-btn" data-emoji="👍" title="いいね">👍</button>
        <button class="message-action-btn message-reply-btn" title="返信">↩️</button>
        ${isOwnMessage ? '<button class="message-action-btn message-edit-btn" title="編集">✏️</button>' : ''}
      </div>
      ${this.createReactionsElement(message.reactions)}
    `;

    return messageDiv;
  }

  /**
   * Handle typing input
   */
  handleTypingInput() {
    if (!this.currentRoom || !this.isConnected) {
      return;
    }

    // Emit typing start
    this.socket.emit('chat:typing-start', {
      roomId: this.currentRoom,
      userId: this.currentUser?.id
    });

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Set timeout to stop typing
    this.typingTimeout = setTimeout(() => {
      this.socket.emit('chat:typing-stop', {
        roomId: this.currentRoom,
        userId: this.currentUser?.id
      });
    }, this.settings.typingTimeout);
  }

  /**
   * Handle typing indicator
   */
  handleUserTyping(data) {
    const { userId, isTyping } = data;

    if (isTyping) {
      this.typingUsers.add(userId);
    } else {
      this.typingUsers.delete(userId);
    }

    this.updateTypingIndicator();
  }

  /**
   * Update typing indicator
   */
  updateTypingIndicator() {
    const typingArray = Array.from(this.typingUsers);
    const typingText = this.typingIndicator.querySelector('.typing-text');

    if (typingArray.length === 0) {
      this.typingIndicator.style.display = 'none';
    } else if (typingArray.length === 1) {
      typingText.textContent = `${typingArray[0]} が入力中...`;
      this.typingIndicator.style.display = 'block';
    } else if (typingArray.length === 2) {
      typingText.textContent = `${typingArray[0]} と ${typingArray[1]} が入力中...`;
      this.typingIndicator.style.display = 'block';
    } else {
      typingText.textContent = `${typingArray.length} 人が入力中...`;
      this.typingIndicator.style.display = 'block';
    }
  }

  /**
   * Upload file
   */
  async uploadFile(file) {
    if (!this.currentRoom) {
      this.showError('チャットルームに参加してください');
      return;
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.showError('ファイルサイズが大きすぎます（最大10MB）');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.showError('サポートされていないファイル形式です');
      return;
    }

    try {
      // Show upload progress
      this.showUploadProgress(0);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/chat/rooms/${this.currentRoom}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('File uploaded successfully:', result);

      this.hideUploadProgress();
    } catch (error) {
      console.error('File upload error:', error);
      this.showError('ファイルのアップロードに失敗しました');
      this.hideUploadProgress();
    }
  }

  /**
   * Utility methods
   */
  async getAuthToken() {
    // Get token from localStorage or make API call
    return localStorage.getItem('authToken') || null;
  }

  async getCurrentUserId() {
    if (!this.currentUser) {
      // Fetch current user info
      this.currentUser = await this.fetchCurrentUser();
    }
    return this.currentUser?.id;
  }

  async fetchCurrentUser() {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
    return null;
  }

  formatMessageText(text) {
    // Basic formatting (could be extended)
    return this.escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  scrollToBottom() {
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  attachToPage() {
    // This method should be customized based on how you want to integrate the chat
    // For now, we'll add it to the body
    document.body.appendChild(this.chatContainer);
  }

  /**
   * Event handlers
   */
  handleRoomJoined(data) {
    console.log('Joined room:', data);
    this.loadRecentMessages(data.recentMessages);
  }

  handleRoomLeft(data) {
    console.log('Left room:', data);
  }

  handleUserJoined(data) {
    console.log('User joined:', data);
    this.updateParticipantsList();
  }

  handleUserLeft(data) {
    console.log('User left:', data);
    this.updateParticipantsList();
  }

  handleChatError(data) {
    console.error('Chat error:', data);
    this.showError(data.error);
  }

  loadRecentMessages(messages) {
    if (!messages || !Array.isArray(messages)) {
      return;
    }

    messages.forEach(message => {
      this.addMessageToUI(message);
    });

    this.scrollToBottom();
  }

  showError(message) {
    // Show error toast or notification
    console.error(message);
  }

  showUploadProgress(percent) {
    // Show upload progress indicator
    console.log(`Upload progress: ${percent}%`);
  }

  hideUploadProgress() {
    // Hide upload progress indicator
    console.log('Upload complete');
  }

  updateConnectionStatus(connected) {
    const indicator = this.chatContainer.querySelector('.status-indicator');
    indicator.dataset.status = connected ? 'connected' : 'disconnected';
  }

  // Add more methods as needed...
}

// Initialize chat system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.chatSystem = new ChatSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatSystem;
}
