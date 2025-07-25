/**
 * Chat Service v2
 * Comprehensive real-time chat system for Lightning Talk Circle
 * Built on top of the existing WebSocket service
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import websocketService from './websocketService.js';
// Database will be injected during initialization

const logger = createLogger('ChatService');

// Create DOMPurify instance for server-side sanitization
const { window } = new JSDOM('');
const purify = DOMPurify(window);

export class ChatService extends EventEmitter {
  constructor() {
    super();
    this.chatRooms = new Map();
    this.messageQueue = new Map();
    this.rateLimits = new Map();
    this.moderationFilters = new Set(['spam', 'inappropriate', 'harassment']);
    this.initialized = false;
    this.database = null;
  }

  /**
   * Initialize chat service
   */
  async initialize(database = null) {
    try {
      // Set database instance
      this.database = database;

      // Load existing chat rooms from database
      await this.loadChatRooms();

      // Register WebSocket message handlers
      this.registerMessageHandlers();

      // Setup rate limiting and moderation
      this.setupRateLimiting();
      this.setupModeration();

      // Setup periodic cleanup
      this.setupCleanup();

      this.initialized = true;
      logger.info('Chat service initialized successfully');

      return true;
    } catch (error) {
      logger.error('Failed to initialize chat service:', error);
      throw error;
    }
  }

  /**
   * Register WebSocket message handlers for chat events
   */
  registerMessageHandlers() {
    const handlers = {
      'chat:join-room': this.handleJoinRoom.bind(this),
      'chat:leave-room': this.handleLeaveRoom.bind(this),
      'chat:send-message': this.handleSendMessage.bind(this),
      'chat:edit-message': this.handleEditMessage.bind(this),
      // 'chat:delete-message': this.handleDeleteMessage.bind(this), // TODO: Implement
      'chat:add-reaction': this.handleAddReaction.bind(this),
      'chat:remove-reaction': this.handleRemoveReaction.bind(this),
      'chat:typing-start': this.handleTypingStart.bind(this),
      'chat:typing-stop': this.handleTypingStop.bind(this),
      'chat:user-presence': this.handleUserPresence.bind(this)
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      if (websocketService && websocketService.registerMessageHandler) {
        websocketService.registerMessageHandler(event, handler);
      }
    });

    logger.info('Chat message handlers registered');
  }

  /**
   * Create chat room for event
   */
  async createEventChatRoom(eventData) {
    const roomId = `event-${eventData.id}`;

    const chatRoom = {
      id: roomId,
      eventId: eventData.id,
      name: `${eventData.title} - チャット`,
      status: 'active',
      createdAt: new Date(),
      settings: {
        preEventAccess: true,
        postEventDuration: 24, // 24 hours after event
        moderated: true,
        maxMessages: 10000,
        allowFileUpload: true,
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
        maxFileSize: 10 // MB
      },
      participants: [],
      statistics: {
        totalMessages: 0,
        activeUsers: 0,
        totalFiles: 0
      }
    };

    try {
      // Save to database
      await this.database.create('chatRooms', chatRoom);

      // Store in memory
      this.chatRooms.set(roomId, chatRoom);

      logger.info(`Created chat room for event: ${eventData.title} (${roomId})`);
      this.emit('room:created', { roomId, eventId: eventData.id });

      return chatRoom;
    } catch (error) {
      logger.error(`Failed to create chat room for event ${eventData.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle chat room join
   */
  async handleJoinRoom(socket, payload) {
    const { roomId, userId } = payload;

    try {
      // Validate room exists
      const room = await this.getChatRoom(roomId);
      if (!room) {
        socket.emit('chat:error', { error: 'Room not found', code: 'ROOM_NOT_FOUND' });
        return;
      }

      // Check permissions
      const canJoin = await this.checkRoomPermission(userId, roomId, 'join');
      if (!canJoin) {
        socket.emit('chat:error', { error: 'Access denied', code: 'ACCESS_DENIED' });
        return;
      }

      // Add participant to room
      await this.addParticipant(roomId, {
        userId,
        username: socket.userEmail?.split('@')[0] || `User${userId.slice(-4)}`,
        role: this.determineUserRole(socket),
        joinedAt: new Date(),
        lastSeenAt: new Date(),
        permissions: this.getDefaultPermissions(this.determineUserRole(socket))
      });

      // Join WebSocket room
      socket.join(roomId);

      // Update room statistics
      room.statistics.activeUsers = await this.getActiveUserCount(roomId);

      // Notify other users
      socket.to(roomId).emit('chat:user-joined', {
        roomId,
        user: {
          userId,
          username: socket.userEmail?.split('@')[0] || `User${userId.slice(-4)}`,
          role: this.determineUserRole(socket)
        }
      });

      // Send room data to user
      socket.emit('chat:room-joined', {
        room: await this.sanitizeRoomData(room),
        recentMessages: await this.getRecentMessages(roomId, 50)
      });

      logger.info(`User ${userId} joined chat room ${roomId}`);
    } catch (error) {
      logger.error(`Error handling join room for ${userId}:`, error);
      socket.emit('chat:error', { error: error.message, code: 'JOIN_FAILED' });
    }
  }

  /**
   * Handle chat room leave
   */
  async handleLeaveRoom(socket, payload) {
    const { roomId, userId } = payload;

    try {
      // Remove participant from room
      await this.removeParticipant(roomId, userId);

      // Leave WebSocket room
      socket.leave(roomId);

      // Update statistics
      const room = this.chatRooms.get(roomId);
      if (room) {
        room.statistics.activeUsers = await this.getActiveUserCount(roomId);
      }

      // Notify other users
      socket.to(roomId).emit('chat:user-left', { roomId, userId });

      socket.emit('chat:room-left', { roomId });

      logger.info(`User ${userId} left chat room ${roomId}`);
    } catch (error) {
      logger.error(`Error handling leave room for ${userId}:`, error);
      socket.emit('chat:error', { error: error.message, code: 'LEAVE_FAILED' });
    }
  }

  /**
   * Handle send message
   */
  async handleSendMessage(socket, payload) {
    const { roomId, content, mentions, replyTo } = payload;
    const { userId } = socket;

    try {
      // Rate limiting check
      if (!this.checkRateLimit(userId, 'sendMessage')) {
        socket.emit('chat:error', { error: 'Rate limit exceeded', code: 'RATE_LIMIT' });
        return;
      }

      // Permission check
      const canSend = await this.checkRoomPermission(userId, roomId, 'sendMessages');
      if (!canSend) {
        socket.emit('chat:error', { error: 'Permission denied', code: 'PERMISSION_DENIED' });
        return;
      }

      // Content validation and sanitization
      const sanitizedContent = this.sanitizeMessageContent(content);
      if (!sanitizedContent.text?.trim()) {
        socket.emit('chat:error', { error: 'Empty message', code: 'EMPTY_MESSAGE' });
        return;
      }

      // Moderation check
      const moderationResult = await this.moderateContent(sanitizedContent.text);
      if (moderationResult.blocked) {
        socket.emit('chat:error', {
          error: 'Message blocked by moderation',
          code: 'MODERATION_BLOCKED',
          reason: moderationResult.reason
        });
        return;
      }

      // Create message
      const message = {
        id: uuidv4(),
        roomId,
        userId,
        username: socket.userEmail?.split('@')[0] || `User${userId.slice(-4)}`,
        userRole: this.determineUserRole(socket),
        content: {
          type: 'text',
          text: sanitizedContent.text,
          mentions: mentions || [],
          replyTo: replyTo || null
        },
        reactions: [],
        edited: {
          isEdited: false,
          editedAt: null,
          editHistory: []
        },
        moderation: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deleteReason: null,
          isHidden: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save message
      await this.saveMessage(message);

      // Update room statistics
      await this.updateRoomStatistics(roomId, { totalMessages: 1 });

      // Broadcast to room
      websocketService.broadcastToRoom(roomId, 'chat:message-received', {
        message: await this.sanitizeMessageData(message),
        roomId
      });

      // Handle mentions
      if (mentions?.length > 0) {
        await this.handleMentions(message, mentions);
      }

      logger.info(`Message sent in room ${roomId} by user ${userId}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('chat:error', { error: error.message, code: 'SEND_FAILED' });
    }
  }

  /**
   * Handle message editing
   */
  async handleEditMessage(socket, payload) {
    const { messageId, newContent } = payload;
    const { userId } = socket;

    try {
      // Get original message
      const message = await this.getMessage(messageId);
      if (!message) {
        socket.emit('chat:error', { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' });
        return;
      }

      // Permission check
      const canEdit =
        message.userId === userId ||
        (await this.checkRoomPermission(userId, message.roomId, 'deleteMessages'));
      if (!canEdit) {
        socket.emit('chat:error', { error: 'Permission denied', code: 'PERMISSION_DENIED' });
        return;
      }

      // Sanitize new content
      const sanitizedContent = this.sanitizeMessageContent(newContent);

      // Moderation check
      const moderationResult = await this.moderateContent(sanitizedContent.text);
      if (moderationResult.blocked) {
        socket.emit('chat:error', {
          error: 'Edited message blocked by moderation',
          code: 'MODERATION_BLOCKED'
        });
        return;
      }

      // Update message
      const originalContent = message.content.text;
      message.content.text = sanitizedContent.text;
      message.edited.isEdited = true;
      message.edited.editedAt = new Date();
      message.edited.editHistory.push({
        content: originalContent,
        editedAt: new Date()
      });
      message.updatedAt = new Date();

      // Save updated message
      await this.updateMessage(message);

      // Broadcast update
      websocketService.broadcastToRoom(message.roomId, 'chat:message-edited', {
        messageId,
        newContent: sanitizedContent.text,
        editedAt: message.edited.editedAt
      });

      logger.info(`Message ${messageId} edited by user ${userId}`);
    } catch (error) {
      logger.error('Error editing message:', error);
      socket.emit('chat:error', { error: error.message, code: 'EDIT_FAILED' });
    }
  }

  /**
   * Handle typing indicators
   */
  async handleTypingStart(socket, payload) {
    const { roomId, userId } = payload;

    socket.to(roomId).emit('chat:user-typing', {
      roomId,
      userId,
      isTyping: true
    });

    // Auto-stop typing after 5 seconds
    setTimeout(() => {
      this.handleTypingStop(socket, { roomId, userId });
    }, 5000);
  }

  /**
   * Handle typing stop
   */
  async handleTypingStop(socket, payload) {
    const { roomId, userId } = payload;

    socket.to(roomId).emit('chat:user-typing', {
      roomId,
      userId,
      isTyping: false
    });
  }

  /**
   * Handle user presence updates
   */
  async handleUserPresence(socket, payload) {
    const { roomId, status } = payload;
    const { userId } = socket;

    try {
      // Update user presence in room
      const room = await this.getChatRoom(roomId);
      if (!room) {
        return;
      }

      const participant = room.participants.find(p => p.userId === userId);
      if (participant) {
        participant.lastSeenAt = new Date();
        participant.status = status || 'online';
        await this.database.update('chatRooms', roomId, room);
      }

      // Broadcast presence update to room
      socket.to(roomId).emit('chat:presence-update', {
        roomId,
        userId,
        status: status || 'online',
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error handling user presence:', error);
    }
  }

  /**
   * Handle reactions
   */
  async handleAddReaction(socket, payload) {
    const { messageId, emoji } = payload;
    const { userId } = socket;

    try {
      const message = await this.getMessage(messageId);
      if (!message) {
        socket.emit('chat:error', { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' });
        return;
      }

      // Find or create reaction
      let reaction = message.reactions.find(r => r.emoji === emoji);
      if (!reaction) {
        reaction = { emoji, users: [], count: 0 };
        message.reactions.push(reaction);
      }

      // Add user to reaction if not already there
      if (!reaction.users.includes(userId)) {
        reaction.users.push(userId);
        reaction.count = reaction.users.length;

        await this.updateMessage(message);

        websocketService.broadcastToRoom(message.roomId, 'chat:reaction-added', {
          messageId,
          emoji,
          userId,
          count: reaction.count
        });
      }
    } catch (error) {
      logger.error('Error adding reaction:', error);
      socket.emit('chat:error', { error: error.message, code: 'REACTION_FAILED' });
    }
  }

  /**
   * Handle remove reaction
   */
  async handleRemoveReaction(socket, payload) {
    const { messageId, emoji } = payload;
    const { userId } = socket;

    try {
      const message = await this.getMessage(messageId);
      if (!message) {
        socket.emit('chat:error', { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' });
        return;
      }

      const reaction = message.reactions.find(r => r.emoji === emoji);
      if (reaction && reaction.users.includes(userId)) {
        reaction.users = reaction.users.filter(id => id !== userId);
        reaction.count = reaction.users.length;

        if (reaction.count === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }

        await this.updateMessage(message);

        websocketService.broadcastToRoom(message.roomId, 'chat:reaction-removed', {
          messageId,
          emoji,
          userId,
          count: reaction.count
        });
      }
    } catch (error) {
      logger.error('Error removing reaction:', error);
      socket.emit('chat:error', { error: error.message, code: 'REACTION_FAILED' });
    }
  }

  /**
   * Sanitize message content for XSS protection
   */
  sanitizeMessageContent(content) {
    if (typeof content === 'string') {
      return {
        text: purify.sanitize(content, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
          ALLOWED_ATTR: []
        })
      };
    }

    return {
      text: purify.sanitize(content.text || '', {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
        ALLOWED_ATTR: []
      }),
      ...content
    };
  }

  /**
   * Check rate limits for user actions
   */
  checkRateLimit(userId, action) {
    const limits = {
      sendMessage: { count: 30, window: 60000 }, // 30 messages per minute
      uploadFile: { count: 5, window: 60000 }, // 5 files per minute
      joinRoom: { count: 10, window: 60000 }, // 10 room joins per minute
      createRoom: { count: 2, window: 60000 } // 2 room creates per minute
    };

    const limit = limits[action];
    if (!limit) {
      return true;
    }

    const key = `${userId}:${action}`;
    const now = Date.now();

    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, []);
    }

    const userLimits = this.rateLimits.get(key);

    // Remove old entries
    const windowStart = now - limit.window;
    const recentActions = userLimits.filter(timestamp => timestamp > windowStart);

    if (recentActions.length >= limit.count) {
      return false;
    }

    // Add current action
    recentActions.push(now);
    this.rateLimits.set(key, recentActions);

    return true;
  }

  /**
   * Content moderation
   */
  async moderateContent(text) {
    // Simple keyword-based moderation
    const lowerText = text.toLowerCase();

    for (const filter of this.moderationFilters) {
      if (lowerText.includes(filter)) {
        return {
          blocked: true,
          reason: `Contains inappropriate content: ${filter}`
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Determine user role based on socket info
   */
  determineUserRole(socket) {
    if (socket.userRole === 'admin') {
      return 'admin';
    }
    if (socket.userRole === 'moderator') {
      return 'moderator';
    }
    // Additional logic to determine if user is a speaker for the event
    return 'participant';
  }

  /**
   * Get default permissions for role
   */
  getDefaultPermissions(role) {
    const permissions = {
      participant: {
        canSendMessages: true,
        canUploadFiles: false,
        canDeleteMessages: false,
        canManageUsers: false
      },
      speaker: {
        canSendMessages: true,
        canUploadFiles: true,
        canDeleteMessages: false,
        canManageUsers: false
      },
      moderator: {
        canSendMessages: true,
        canUploadFiles: true,
        canDeleteMessages: true,
        canManageUsers: false
      },
      admin: {
        canSendMessages: true,
        canUploadFiles: true,
        canDeleteMessages: true,
        canManageUsers: true
      }
    };

    return permissions[role] || permissions.participant;
  }

  /**
   * Load chat rooms from database
   */
  async loadChatRooms() {
    try {
      if (!this.database) {
        logger.warn('Database not available, skipping chat room loading');
        return;
      }

      const rooms = (await this.database.find('chatRooms', {})) || [];
      rooms.forEach(room => {
        this.chatRooms.set(room.id, room);
      });
      logger.info(`Loaded ${rooms.length} chat rooms from database`);
    } catch (error) {
      logger.warn('Could not load chat rooms from database:', error.message);
    }
  }

  /**
   * Setup rate limiting
   */
  setupRateLimiting() {
    // Clean up old rate limit entries every 5 minutes
    this.rateLimitCleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.rateLimits.entries()) {
        const recent = timestamps.filter(ts => now - ts < 300000); // 5 minutes
        if (recent.length === 0) {
          this.rateLimits.delete(key);
        } else {
          this.rateLimits.set(key, recent);
        }
      }
    }, 300000);
  }

  /**
   * Setup content moderation
   */
  setupModeration() {
    // Load moderation filters from configuration
    // This could be extended to use external moderation services
    logger.info('Content moderation setup complete');
  }

  /**
   * Setup periodic cleanup
   */
  setupCleanup() {
    // Clean up old messages and inactive rooms
    this.cleanupInterval = setInterval(async() => {
      await this.performCleanup();
    }, 3600000); // Every hour
  }

  /**
   * Helper methods for database operations
   */
  async getChatRoom(roomId) {
    return this.chatRooms.get(roomId) || (await this.database.read('chatRooms', roomId));
  }

  async saveMessage(message) {
    return await this.database.create('chatMessages', message);
  }

  async getMessage(messageId) {
    return await this.database.read('chatMessages', messageId);
  }

  async updateMessage(message) {
    return await this.database.update('chatMessages', message.id, message);
  }

  async getRecentMessages(roomId, limit = 50) {
    // Implementation depends on database schema
    return [];
  }

  async addParticipant(roomId, participant) {
    const room = this.chatRooms.get(roomId);
    if (room) {
      const existingIndex = room.participants.findIndex(p => p.userId === participant.userId);
      if (existingIndex !== -1) {
        room.participants[existingIndex] = participant;
      } else {
        room.participants.push(participant);
      }
      await this.database.update('chatRooms', roomId, room);
    }
  }

  async removeParticipant(roomId, userId) {
    const room = this.chatRooms.get(roomId);
    if (room) {
      room.participants = room.participants.filter(p => p.userId !== userId);
      await this.database.update('chatRooms', roomId, room);
    }
  }

  async checkRoomPermission(userId, roomId, action) {
    // Implement permission checking logic
    return true; // Simplified for initial implementation
  }

  async getActiveUserCount(roomId) {
    const roomInfo = websocketService.getRoomInfo(roomId);
    return roomInfo ? roomInfo.memberCount : 0;
  }

  async updateRoomStatistics(roomId, updates) {
    const room = this.chatRooms.get(roomId);
    if (room) {
      Object.assign(room.statistics, updates);
      await this.database.update('chatRooms', roomId, room);
    }
  }

  async sanitizeRoomData(room) {
    // Remove sensitive data before sending to client
    const { participants, ...publicData } = room;
    return {
      ...publicData,
      participantCount: participants.length
    };
  }

  async sanitizeMessageData(message) {
    // Remove sensitive data from message
    return message;
  }

  async handleMentions(message, mentions) {
    // Handle @mentions and notifications
    mentions.forEach(userId => {
      websocketService.sendToSocket(`user-${userId}`, 'chat:mention', {
        message,
        roomId: message.roomId
      });
    });
  }

  async performCleanup() {
    logger.info('Performing chat service cleanup...');
    // Implement cleanup logic for old messages, inactive rooms, etc.
  }

  // Additional helper methods needed by the HTTP API
  async updateChatRoom(roomId, updates) {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    Object.assign(room, updates);
    await this.database.update('chatRooms', roomId, room);
    this.chatRooms.set(roomId, room);

    return room;
  }

  async joinRoom(userId, roomId) {
    // This is the HTTP version, WebSocket version is in handleJoinRoom
    const room = await this.getChatRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const participant = {
      userId,
      username: `User${userId.slice(-4)}`,
      role: 'participant',
      joinedAt: new Date(),
      lastSeenAt: new Date(),
      permissions: this.getDefaultPermissions('participant')
    };

    await this.addParticipant(roomId, participant);
    return { roomId, participant };
  }

  async leaveRoom(userId, roomId) {
    await this.removeParticipant(roomId, userId);
    return { roomId, userId };
  }

  async sendMessage(userId, roomId, messageData) {
    // HTTP version of sending message
    const { content, mentions, replyTo } = messageData;

    const sanitizedContent = this.sanitizeMessageContent(content);
    const moderationResult = await this.moderateContent(sanitizedContent.text);

    if (moderationResult.blocked) {
      throw new Error(`Message blocked: ${moderationResult.reason}`);
    }

    const message = {
      id: uuidv4(),
      roomId,
      userId,
      username: `User${userId.slice(-4)}`,
      userRole: 'participant',
      content: {
        type: 'text',
        text: sanitizedContent.text,
        mentions: mentions || [],
        replyTo: replyTo || null
      },
      reactions: [],
      edited: {
        isEdited: false,
        editedAt: null,
        editHistory: []
      },
      moderation: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        isHidden: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveMessage(message);
    await this.updateRoomStatistics(roomId, { totalMessages: 1 });

    // Broadcast via WebSocket if available
    websocketService.broadcastToRoom(roomId, 'chat:message-received', {
      message: await this.sanitizeMessageData(message),
      roomId
    });

    return message;
  }

  async getMessages(roomId, options = {}) {
    const { limit = 50, before, after } = options;

    try {
      // This is a simplified implementation
      // In a real implementation, you'd query the database with pagination
      const messages = (await this.database.find('chatMessages', { roomId })) || [];

      // Sort by creation date
      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      // Apply pagination (simplified)
      return messages.slice(-limit);
    } catch (error) {
      logger.error('Error getting messages:', error);
      return [];
    }
  }

  async editMessage(userId, messageId, newContent) {
    const message = await this.getMessage(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.userId !== userId) {
      throw new Error('Permission denied');
    }

    const sanitizedContent = this.sanitizeMessageContent(newContent);
    const moderationResult = await this.moderateContent(sanitizedContent.text);

    if (moderationResult.blocked) {
      throw new Error(`Message blocked: ${moderationResult.reason}`);
    }

    const originalContent = message.content.text;
    message.content.text = sanitizedContent.text;
    message.edited.isEdited = true;
    message.edited.editedAt = new Date();
    message.edited.editHistory.push({
      content: originalContent,
      editedAt: new Date()
    });
    message.updatedAt = new Date();

    await this.updateMessage(message);

    websocketService.broadcastToRoom(message.roomId, 'chat:message-edited', {
      messageId,
      newContent: sanitizedContent.text,
      editedAt: message.edited.editedAt
    });

    return message;
  }

  async deleteMessage(userId, messageId) {
    const message = await this.getMessage(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.userId !== userId) {
      throw new Error('Permission denied');
    }

    message.moderation.isDeleted = true;
    message.moderation.deletedAt = new Date();
    message.moderation.deletedBy = userId;
    message.updatedAt = new Date();

    await this.updateMessage(message);

    websocketService.broadcastToRoom(message.roomId, 'chat:message-deleted', {
      messageId,
      deletedBy: userId
    });

    return message;
  }

  async addReaction(userId, messageId, emoji) {
    const message = await this.getMessage(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    let reaction = message.reactions.find(r => r.emoji === emoji);
    if (!reaction) {
      reaction = { emoji, users: [], count: 0 };
      message.reactions.push(reaction);
    }

    if (!reaction.users.includes(userId)) {
      reaction.users.push(userId);
      reaction.count = reaction.users.length;

      await this.updateMessage(message);

      websocketService.broadcastToRoom(message.roomId, 'chat:reaction-added', {
        messageId,
        emoji,
        userId,
        count: reaction.count
      });
    }

    return reaction;
  }

  async removeReaction(userId, messageId, emoji) {
    const message = await this.getMessage(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const reaction = message.reactions.find(r => r.emoji === emoji);
    if (reaction) {
      reaction.users = reaction.users.filter(id => id !== userId);
      reaction.count = reaction.users.length;

      if (reaction.count === 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }

      await this.updateMessage(message);

      websocketService.broadcastToRoom(message.roomId, 'chat:reaction-removed', {
        messageId,
        emoji,
        userId
      });
    }

    return message;
  }

  async sendFileMessage(userId, roomId, fileInfo, caption = '') {
    const message = {
      id: uuidv4(),
      roomId,
      userId,
      username: `User${userId.slice(-4)}`,
      userRole: 'participant',
      content: {
        type: 'file',
        text: caption,
        file: {
          originalName: fileInfo.originalName,
          storedName: fileInfo.storedName,
          mimeType: fileInfo.mimeType,
          size: fileInfo.size,
          url: `/uploads/chat/${fileInfo.storedName}`
        }
      },
      reactions: [],
      edited: {
        isEdited: false,
        editedAt: null,
        editHistory: []
      },
      moderation: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        isHidden: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveMessage(message);
    await this.updateRoomStatistics(roomId, { totalFiles: 1 });

    websocketService.broadcastToRoom(roomId, 'chat:message-received', {
      message: await this.sanitizeMessageData(message),
      roomId
    });

    return message;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down chat service...');

    if (this.rateLimitCleanup) {
      clearInterval(this.rateLimitCleanup);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.chatRooms.clear();
    this.messageQueue.clear();
    this.rateLimits.clear();

    logger.info('Chat service shutdown complete');
  }
}

// Singleton instance
const chatService = new ChatService();
export default chatService;
