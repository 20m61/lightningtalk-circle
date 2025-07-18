/**
 * WebSocket Service
 * Centralized WebSocket management for real-time features
 */

import { Server } from 'socket.io';
import { createLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';

const logger = createLogger('WebSocketService');

export class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.io = null;
    this.rooms = new Map();
    this.connections = new Map();
    this.messageHandlers = new Map();
    this.metrics = {
      connectionsTotal: 0,
      messagesTotal: 0,
      errorsTotal: 0,
      activeConnections: 0
    };
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server, options = {}) {
    const {
      cors = {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST']
      },
      pingTimeout = 60000,
      pingInterval = 25000,
      maxHttpBufferSize = 1e6, // 1MB
      connectionStateRecovery = {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true
      }
    } = options;

    this.io = new Server(server, {
      cors,
      pingTimeout,
      pingInterval,
      maxHttpBufferSize,
      connectionStateRecovery
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupMetrics();

    logger.info('WebSocket service initialized');
    return this.io;
  }

  /**
   * Setup socket middleware
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      const { token } = socket.handshake.auth;

      if (token) {
        const user = this.verifyToken(token);
        if (user) {
          socket.userId = user.id;
          socket.userRole = user.role;
          socket.userEmail = user.email;
          socket.authenticated = true;
        } else {
          socket.authenticated = false;
          return next(new Error('Invalid authentication token'));
        }
      } else {
        socket.authenticated = false;
      }

      next();
    });

    // Request tracking and rate limiting
    this.io.use((socket, next) => {
      socket.requestId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      socket.messageCount = 0;
      socket.lastMessageTime = Date.now();
      socket.rateLimitExceeded = false;

      logger.debug(`New connection attempt: ${socket.requestId}`);
      next();
    });
  }

  /**
   * Setup core event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', socket => {
      this.handleConnection(socket);

      socket.on('disconnect', reason => {
        this.handleDisconnect(socket, reason);
      });

      socket.on('error', error => {
        this.handleError(socket, error);
      });

      // Room management
      socket.on('join:room', data => this.handleJoinRoom(socket, data));
      socket.on('leave:room', data => this.handleLeaveRoom(socket, data));

      // Message routing
      socket.on('message', data => this.handleMessage(socket, data));

      // Poll-specific events
      socket.on('poll:subscribe', data => this.handlePollSubscribe(socket, data));
      socket.on('poll:unsubscribe', data => this.handlePollUnsubscribe(socket, data));

      // Chat events (existing)
      socket.on('chat:message', data => this.handleChatMessage(socket, data));
      socket.on('chat:typing', data => this.handleChatTyping(socket, data));
    });

    // Register default poll message handlers
    this.registerPollHandlers();
  }

  /**
   * Handle new connection
   */
  handleConnection(socket) {
    this.metrics.connectionsTotal++;
    this.metrics.activeConnections++;

    // Store connection info
    const connectionInfo = {
      id: socket.id,
      userId: socket.userId,
      authenticated: socket.authenticated,
      connectedAt: new Date(),
      rooms: new Set(),
      metadata: {}
    };
    this.connections.set(socket.id, connectionInfo);

    logger.info(`Client connected: ${socket.id}`);
    this.emit('connection', { socket, connectionInfo });

    // Send welcome message
    socket.emit('connected', {
      socketId: socket.id,
      authenticated: socket.authenticated,
      serverTime: new Date().toISOString()
    });
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(socket, reason) {
    this.metrics.activeConnections--;

    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      // Clean up rooms
      connectionInfo.rooms.forEach(room => {
        this.removeFromRoom(socket, room);
      });

      this.connections.delete(socket.id);
    }

    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    this.emit('disconnect', { socket, reason });
  }

  /**
   * Handle errors
   */
  handleError(socket, error) {
    this.metrics.errorsTotal++;
    logger.error(`Socket error for ${socket.id}:`, error);
    this.emit('error', { socket, error });
  }

  /**
   * Handle room join
   */
  async handleJoinRoom(socket, data) {
    const { room, metadata = {} } = data;

    try {
      // Validate room access
      const canJoin = await this.validateRoomAccess(socket, room);
      if (!canJoin) {
        socket.emit('room:error', { room, error: 'Access denied' });
        return;
      }

      // Join room
      socket.join(room);

      // Update room info
      if (!this.rooms.has(room)) {
        this.rooms.set(room, {
          name: room,
          members: new Set(),
          created: new Date(),
          metadata: {}
        });
      }

      const roomInfo = this.rooms.get(room);
      roomInfo.members.add(socket.id);

      // Update connection info
      const connectionInfo = this.connections.get(socket.id);
      if (connectionInfo) {
        connectionInfo.rooms.add(room);
      }

      // Notify room members
      this.io.to(room).emit('room:member:joined', {
        room,
        member: {
          id: socket.id,
          userId: socket.userId,
          metadata
        }
      });

      socket.emit('room:joined', {
        room,
        members: Array.from(roomInfo.members)
      });

      logger.info(`Socket ${socket.id} joined room: ${room}`);
      this.emit('room:joined', { socket, room });
    } catch (error) {
      logger.error(`Error joining room ${room}:`, error);
      socket.emit('room:error', { room, error: error.message });
    }
  }

  /**
   * Handle room leave
   */
  handleLeaveRoom(socket, data) {
    const { room } = data;

    this.removeFromRoom(socket, room);
    socket.leave(room);

    socket.emit('room:left', { room });
    logger.info(`Socket ${socket.id} left room: ${room}`);
  }

  /**
   * Remove socket from room
   */
  removeFromRoom(socket, room) {
    const roomInfo = this.rooms.get(room);
    if (roomInfo) {
      roomInfo.members.delete(socket.id);

      // Notify remaining members
      this.io.to(room).emit('room:member:left', {
        room,
        member: { id: socket.id, userId: socket.userId }
      });

      // Clean up empty rooms
      if (roomInfo.members.size === 0) {
        this.rooms.delete(room);
      }
    }

    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.rooms.delete(room);
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(socket, data) {
    // Rate limiting check
    const now = Date.now();
    if (now - socket.lastMessageTime < 100) {
      // 100ms minimum between messages
      socket.messageCount++;
      if (socket.messageCount > 10) {
        // Max 10 rapid messages
        if (!socket.rateLimitExceeded) {
          socket.rateLimitExceeded = true;
          logger.warn(`Rate limit exceeded for socket ${socket.id}`);
          socket.emit('error', { message: 'Rate limit exceeded' });
        }
        return;
      }
    } else {
      socket.messageCount = 0;
      socket.rateLimitExceeded = false;
    }
    socket.lastMessageTime = now;

    this.metrics.messagesTotal++;

    const { type, payload, room, target } = data;

    // Route to specific handler
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(socket, payload || {}, { room, target });
    } else {
      // Default broadcast behavior
      if (room) {
        socket.to(room).emit('message', data);
      } else if (target) {
        this.io.to(target).emit('message', data);
      } else {
        socket.broadcast.emit('message', data);
      }
    }

    this.emit('message', { socket, data });
  }

  /**
   * Register message handler
   */
  registerMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
    logger.info(`Registered message handler for type: ${type}`);
  }

  /**
   * Broadcast to room
   */
  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  /**
   * Send to specific socket
   */
  sendToSocket(socketId, event, data) {
    this.io.to(socketId).emit(event, data);
  }

  /**
   * Broadcast to all
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Get room info
   */
  getRoomInfo(room) {
    const roomInfo = this.rooms.get(room);
    if (!roomInfo) {
      return null;
    }

    return {
      name: room,
      memberCount: roomInfo.members.size,
      members: Array.from(roomInfo.members),
      created: roomInfo.created,
      metadata: roomInfo.metadata
    };
  }

  /**
   * Get connection info
   */
  getConnectionInfo(socketId) {
    return this.connections.get(socketId);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      rooms: this.rooms.size,
      roomDetails: Array.from(this.rooms.entries()).map(([name, info]) => ({
        name,
        members: info.members.size
      }))
    };
  }

  /**
   * Setup metrics collection
   */
  setupMetrics() {
    // Periodic metrics logging
    this.metricsInterval = setInterval(() => {
      logger.info('WebSocket metrics:', this.getMetrics());
    }, 60000); // Every minute

    // Allow cleanup
    if (this.metricsInterval.unref) {
      this.metricsInterval.unref();
    }
  }

  /**
   * Validate room access
   */
  async validateRoomAccess(socket, room) {
    // Implement your room access validation logic
    // For example, check if user has permission to join event room

    if (room.startsWith('event:')) {
      return socket.authenticated;
    }

    if (room.startsWith('admin:')) {
      return socket.userId && socket.userRole === 'admin';
    }

    return true; // Default allow
  }

  /**
   * Verify JWT token for WebSocket authentication
   */
  verifyToken(token) {
    try {
      const jwt = require('jsonwebtoken'); // Dynamic import for optional dependency
      const secret = process.env.JWT_SECRET || 'development-secret-do-not-use-in-production';

      const decoded = jwt.verify(token, secret);
      return {
        id: decoded.userId || decoded.id,
        role: decoded.role || 'user',
        email: decoded.email
      };
    } catch (error) {
      logger.warn('Token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Handle poll subscription
   */
  handlePollSubscribe(socket, data) {
    const { eventId, pollId } = data;

    if (eventId) {
      const eventRoom = `event:${eventId}`;
      socket.join(eventRoom);
      logger.info(`Socket ${socket.id} subscribed to event polls: ${eventId}`);
    }

    if (pollId) {
      const pollRoom = `poll:${pollId}`;
      socket.join(pollRoom);
      logger.info(`Socket ${socket.id} subscribed to poll: ${pollId}`);
    }

    socket.emit('poll:subscribed', { eventId, pollId });
  }

  /**
   * Handle poll unsubscription
   */
  handlePollUnsubscribe(socket, data) {
    const { eventId, pollId } = data;

    if (eventId) {
      const eventRoom = `event:${eventId}`;
      socket.leave(eventRoom);
      logger.info(`Socket ${socket.id} unsubscribed from event polls: ${eventId}`);
    }

    if (pollId) {
      const pollRoom = `poll:${pollId}`;
      socket.leave(pollRoom);
      logger.info(`Socket ${socket.id} unsubscribed from poll: ${pollId}`);
    }

    socket.emit('poll:unsubscribed', { eventId, pollId });
  }

  /**
   * Handle chat message (existing functionality)
   */
  handleChatMessage(socket, data) {
    const { room, message, metadata } = data;

    if (!room || !message) {
      return;
    }

    // Broadcast to room
    socket.to(room).emit('chat:message', {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: socket.userId,
      message,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle chat typing indicator
   */
  handleChatTyping(socket, data) {
    const { room, isTyping } = data;

    if (!room) {
      return;
    }

    socket.to(room).emit('chat:typing', {
      userId: socket.userId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Register poll-specific message handlers
   */
  registerPollHandlers() {
    // Poll lifecycle events
    this.registerMessageHandler('pollStarted', (socket, payload, options) => {
      const { eventId } = payload;
      this.broadcastToRoom(`event:${eventId}`, 'pollStarted', payload);
    });

    this.registerMessageHandler('pollEnded', (socket, payload, options) => {
      const { eventId } = payload;
      this.broadcastToRoom(`event:${eventId}`, 'pollEnded', payload);
    });

    this.registerMessageHandler('pollResponse', (socket, payload, options) => {
      const { eventId, pollId } = payload;

      // Broadcast to event room
      this.broadcastToRoom(`event:${eventId}`, 'pollResponse', payload);

      // Broadcast to specific poll room
      this.broadcastToRoom(`poll:${pollId}`, 'pollResponse', payload);
    });

    // Q&A events
    this.registerMessageHandler('questionSubmitted', (socket, payload, options) => {
      const { eventId } = payload;
      this.broadcastToRoom(`event:${eventId}`, 'questionSubmitted', payload);
    });

    this.registerMessageHandler('questionApproved', (socket, payload, options) => {
      const { eventId } = payload;
      this.broadcastToRoom(`event:${eventId}`, 'questionApproved', payload);
    });

    // Feedback events
    this.registerMessageHandler('feedbackSubmitted', (socket, payload, options) => {
      const { eventId, talkId } = payload;
      this.broadcastToRoom(`event:${eventId}`, 'feedbackSubmitted', payload);
      if (talkId) {
        this.broadcastToRoom(`talk:${talkId}`, 'feedbackSubmitted', payload);
      }
    });
  }

  /**
   * Broadcast poll update
   */
  broadcastPollUpdate(pollData) {
    const { eventId, id: pollId } = pollData;

    // Broadcast to event subscribers
    this.broadcastToRoom(`event:${eventId}`, 'pollUpdate', pollData);

    // Broadcast to specific poll subscribers
    this.broadcastToRoom(`poll:${pollId}`, 'pollUpdate', pollData);
  }

  /**
   * Broadcast poll results
   */
  broadcastPollResults(pollId, results) {
    this.broadcastToRoom(`poll:${pollId}`, 'pollResults', {
      pollId,
      results,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down WebSocket service...');

    // Notify all clients
    this.broadcast('server:shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });

    // Close all connections
    if (this.io) {
      await new Promise(resolve => {
        this.io.close(() => {
          logger.info('WebSocket server closed');
          resolve();
        });
      });
    }

    // Clear intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Clear data
    this.rooms.clear();
    this.connections.clear();
    this.messageHandlers.clear();
  }
}

// Singleton instance
const websocketService = new WebSocketService();
export default websocketService;
