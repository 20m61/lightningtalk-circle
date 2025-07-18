/**
 * WebSocket Client Utility
 * Manages real-time connections for Lightning Talk Circle
 */

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
    this.subscriptions = new Set();
    this.authToken = null;

    this.init();
  }

  init() {
    // Check if Socket.IO is available
    if (typeof io === 'undefined') {
      console.warn('Socket.IO not available - WebSocket features disabled');
      return;
    }

    this.authToken = localStorage.getItem('authToken');
    this.connect();
  }

  connect() {
    try {
      // Connect with authentication if available
      const auth = this.authToken ? { token: this.authToken } : {};

      this.socket = io({
        auth,
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false
      });

      this.setupEventHandlers();
      console.log('WebSocket connection initiated');
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  setupEventHandlers() {
    if (!this.socket) {
      return;
    }

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('WebSocket connected:', this.socket.id);

      // Restore subscriptions
      this.restoreSubscriptions();

      // Emit custom connected event
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', reason => {
      this.isConnected = false;
      console.log('WebSocket disconnected:', reason);

      // Emit custom disconnected event
      this.emit('disconnected', { reason });

      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't reconnect automatically
        console.log('Server disconnected client - manual reconnection required');
      } else {
        // Client side disconnect - attempt reconnect
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', error => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    // Server messages
    this.socket.on('connected', data => {
      console.log('Server welcome:', data);
    });

    this.socket.on('server:shutdown', data => {
      console.warn('Server shutdown notification:', data);
      this.emit('serverShutdown', data);
    });

    // Room events
    this.socket.on('room:joined', data => {
      console.log('Joined room:', data.room);
      this.emit('roomJoined', data);
    });

    this.socket.on('room:left', data => {
      console.log('Left room:', data.room);
      this.emit('roomLeft', data);
    });

    this.socket.on('room:error', data => {
      console.error('Room error:', data);
      this.emit('roomError', data);
    });

    // Poll events
    this.socket.on('pollStarted', data => {
      console.log('Poll started:', data);
      this.emit('pollStarted', data);
    });

    this.socket.on('pollEnded', data => {
      console.log('Poll ended:', data);
      this.emit('pollEnded', data);
    });

    this.socket.on('pollResponse', data => {
      console.log('New poll response:', data);
      this.emit('pollResponse', data);
    });

    this.socket.on('pollUpdate', data => {
      console.log('Poll update:', data);
      this.emit('pollUpdate', data);
    });

    this.socket.on('pollResults', data => {
      console.log('Poll results:', data);
      this.emit('pollResults', data);
    });

    // Q&A events
    this.socket.on('questionSubmitted', data => {
      console.log('Question submitted:', data);
      this.emit('questionSubmitted', data);
    });

    this.socket.on('questionApproved', data => {
      console.log('Question approved:', data);
      this.emit('questionApproved', data);
    });

    // Feedback events
    this.socket.on('feedbackSubmitted', data => {
      console.log('Feedback submitted:', data);
      this.emit('feedbackSubmitted', data);
    });

    // Chat events
    this.socket.on('chat:message', data => {
      console.log('Chat message:', data);
      this.emit('chatMessage', data);
    });

    this.socket.on('chat:typing', data => {
      console.log('Chat typing:', data);
      this.emit('chatTyping', data);
    });

    // Error handling
    this.socket.on('error', error => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isConnected) {
        console.log(`Reconnect attempt ${this.reconnectAttempts}`);
        this.connect();
      }
    }, delay);
  }

  restoreSubscriptions() {
    // Restore all active subscriptions after reconnection
    this.subscriptions.forEach(subscription => {
      const { type, data } = JSON.parse(subscription);

      if (type === 'poll') {
        this.subscribeToPoll(data.eventId, data.pollId);
      } else if (type === 'room') {
        this.joinRoom(data.room, data.metadata);
      }
    });
  }

  // Event emitter functionality
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Room management
  joinRoom(room, metadata = {}) {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot join room - not connected');
      return;
    }

    this.socket.emit('join:room', { room, metadata });
    this.subscriptions.add(JSON.stringify({ type: 'room', data: { room, metadata } }));
  }

  leaveRoom(room) {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot leave room - not connected');
      return;
    }

    this.socket.emit('leave:room', { room });

    // Remove from subscriptions
    const subscriptionKey = JSON.stringify({ type: 'room', data: { room } });
    this.subscriptions.delete(subscriptionKey);
  }

  // Poll subscription
  subscribeToPoll(eventId, pollId = null) {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot subscribe to poll - not connected');
      return;
    }

    this.socket.emit('poll:subscribe', { eventId, pollId });
    this.subscriptions.add(JSON.stringify({ type: 'poll', data: { eventId, pollId } }));
  }

  unsubscribeFromPoll(eventId, pollId = null) {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot unsubscribe from poll - not connected');
      return;
    }

    this.socket.emit('poll:unsubscribe', { eventId, pollId });

    // Remove from subscriptions
    const subscriptionKey = JSON.stringify({ type: 'poll', data: { eventId, pollId } });
    this.subscriptions.delete(subscriptionKey);
  }

  // Chat functionality
  sendChatMessage(room, message, metadata = {}) {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot send chat message - not connected');
      return;
    }

    this.socket.emit('chat:message', { room, message, metadata });
  }

  sendTypingIndicator(room, isTyping) {
    if (!this.isConnected || !this.socket) {
      return;
    }

    this.socket.emit('chat:typing', { room, isTyping });
  }

  // Message sending
  sendMessage(type, payload, options = {}) {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot send message - not connected');
      return;
    }

    this.socket.emit('message', {
      type,
      payload,
      ...options
    });
  }

  // Status methods
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions)
    };
  }

  // Authentication update
  updateAuth(token) {
    this.authToken = token;

    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }

    // Reconnect with new auth
    if (this.socket) {
      this.socket.disconnect();
      this.connect();
    }
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
    this.eventHandlers.clear();
  }
}

// Create global instance
const socketService = new WebSocketClient();

// Make available globally
window.socketService = socketService;

// Handle authentication changes
window.addEventListener('storage', e => {
  if (e.key === 'authToken') {
    socketService.updateAuth(e.newValue);
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  socketService.disconnect();
});

export default socketService;
