/**
 * Chat API Routes
 * HTTP endpoints for chat room and message management
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { createLogger } from '../utils/logger.js';
import chatService from '../services/chatService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const logger = createLogger('ChatRoutes');

// Rate limiting for chat API
const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many chat requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// File upload configuration
const upload = multer({
  dest: 'uploads/chat/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Apply rate limiting to all chat routes
router.use(chatRateLimit);

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRoom:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique chat room identifier
 *         eventId:
 *           type: string
 *           description: Associated event ID
 *         name:
 *           type: string
 *           description: Chat room name
 *         status:
 *           type: string
 *           enum: [active, archived, disabled]
 *         settings:
 *           type: object
 *           properties:
 *             preEventAccess:
 *               type: boolean
 *             postEventDuration:
 *               type: number
 *             moderated:
 *               type: boolean
 *             maxMessages:
 *               type: number
 *             allowFileUpload:
 *               type: boolean
 *             allowedFileTypes:
 *               type: array
 *               items:
 *                 type: string
 *             maxFileSize:
 *               type: number
 *         statistics:
 *           type: object
 *           properties:
 *             totalMessages:
 *               type: number
 *             activeUsers:
 *               type: number
 *             totalFiles:
 *               type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         roomId:
 *           type: string
 *         userId:
 *           type: string
 *         username:
 *           type: string
 *         userRole:
 *           type: string
 *           enum: [participant, speaker, moderator, admin]
 *         content:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [text, file, system, reaction]
 *             text:
 *               type: string
 *             file:
 *               type: object
 *             mentions:
 *               type: array
 *               items:
 *                 type: string
 *             replyTo:
 *               type: string
 *         reactions:
 *           type: array
 *         edited:
 *           type: object
 *         moderation:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/chat/rooms:
 *   post:
 *     summary: Create a new chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - name
 *             properties:
 *               eventId:
 *                 type: string
 *               name:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Chat room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 */
router.post(
  '/rooms',
  [
    body('eventId').isString().notEmpty().withMessage('Event ID is required'),
    body('name')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('settings').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { eventId, name, settings = {} } = req.body;
      const userId = req.user.id;

      // Check if user has permission to create room for this event
      // This would typically check if user is event organizer

      const eventData = { id: eventId, title: name };
      const chatRoom = await chatService.createEventChatRoom(eventData);

      // Apply custom settings if provided
      if (Object.keys(settings).length > 0) {
        Object.assign(chatRoom.settings, settings);
        // Update in database
        await chatService.updateChatRoom(chatRoom.id, { settings: chatRoom.settings });
      }

      res.status(201).json({
        success: true,
        data: chatRoom
      });

      logger.info(`Chat room created: ${chatRoom.id} by user ${userId}`);
    } catch (error) {
      logger.error('Error creating chat room:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chat room'
      });
    }
  }
);

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   get:
 *     summary: Get chat room details
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat room details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 */
router.get('/rooms/:roomId', [param('roomId').isString().notEmpty()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await chatService.getChatRoom(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Chat room not found'
      });
    }

    // Check if user has access to this room
    const hasAccess = await chatService.checkRoomPermission(userId, roomId, 'view');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const sanitizedRoom = await chatService.sanitizeRoomData(room);

    res.json({
      success: true,
      data: sanitizedRoom
    });
  } catch (error) {
    logger.error('Error getting chat room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat room'
    });
  }
});

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   put:
 *     summary: Update chat room settings
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               settings:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat room updated successfully
 */
router.put(
  '/rooms/:roomId',
  [
    param('roomId').isString().notEmpty(),
    body('name').optional().isString().isLength({ min: 1, max: 100 }),
    body('settings').optional().isObject(),
    body('status').optional().isIn(['active', 'archived', 'disabled'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { roomId } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Check permissions
      const canUpdate = await chatService.checkRoomPermission(userId, roomId, 'manage');
      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      const updatedRoom = await chatService.updateChatRoom(roomId, updates);

      res.json({
        success: true,
        data: await chatService.sanitizeRoomData(updatedRoom)
      });

      logger.info(`Chat room ${roomId} updated by user ${userId}`);
    } catch (error) {
      logger.error('Error updating chat room:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update chat room'
      });
    }
  }
);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/join:
 *   post:
 *     summary: Join a chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully joined chat room
 */
router.post('/rooms/:roomId/join', [param('roomId').isString().notEmpty()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomId } = req.params;
    const userId = req.user.id;

    const result = await chatService.joinRoom(userId, roomId);

    res.json({
      success: true,
      data: result
    });

    logger.info(`User ${userId} joined chat room ${roomId} via HTTP`);
  } catch (error) {
    logger.error('Error joining chat room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join chat room'
    });
  }
});

/**
 * @swagger
 * /api/chat/rooms/{roomId}/leave:
 *   post:
 *     summary: Leave a chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left chat room
 */
router.post('/rooms/:roomId/leave', [param('roomId').isString().notEmpty()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomId } = req.params;
    const userId = req.user.id;

    await chatService.leaveRoom(userId, roomId);

    res.json({
      success: true,
      message: 'Left chat room successfully'
    });

    logger.info(`User ${userId} left chat room ${roomId} via HTTP`);
  } catch (error) {
    logger.error('Error leaving chat room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave chat room'
    });
  }
});

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   get:
 *     summary: Get chat messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           description: Message ID to get messages before
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *           description: Message ID to get messages after
 *     responses:
 *       200:
 *         description: Chat messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 */
router.get(
  '/rooms/:roomId/messages',
  [
    param('roomId').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('before').optional().isString(),
    query('after').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { roomId } = req.params;
      const { limit = 50, before, after } = req.query;
      const userId = req.user.id;

      // Check room access
      const hasAccess = await chatService.checkRoomPermission(userId, roomId, 'view');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const messages = await chatService.getMessages(roomId, {
        limit,
        before,
        after
      });

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      logger.error('Error getting chat messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get messages'
      });
    }
  }
);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   post:
 *     summary: Send a chat message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *               replyTo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post(
  '/rooms/:roomId/messages',
  [
    param('roomId').isString().notEmpty(),
    body('content')
      .isString()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Content must be 1-2000 characters'),
    body('mentions').optional().isArray(),
    body('replyTo').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { roomId } = req.params;
      const { content, mentions, replyTo } = req.body;
      const userId = req.user.id;

      const message = await chatService.sendMessage(userId, roomId, {
        content,
        mentions,
        replyTo
      });

      res.status(201).json({
        success: true,
        data: message
      });

      logger.info(`Message sent via HTTP by user ${userId} in room ${roomId}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }
);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/upload:
 *   post:
 *     summary: Upload file to chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               caption:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post(
  '/rooms/:roomId/upload',
  upload.single('file'),
  [
    param('roomId').isString().notEmpty(),
    body('caption').optional().isString().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { roomId } = req.params;
      const { caption = '' } = req.body;
      const userId = req.user.id;

      // Check upload permissions
      const canUpload = await chatService.checkRoomPermission(userId, roomId, 'uploadFiles');
      if (!canUpload) {
        // Clean up uploaded file
        await fs.unlink(req.file.path);
        return res.status(403).json({
          success: false,
          error: 'File upload not permitted'
        });
      }

      // Process and save file
      const fileInfo = {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };

      const message = await chatService.sendFileMessage(userId, roomId, fileInfo, caption);

      res.status(201).json({
        success: true,
        data: message
      });

      logger.info(`File uploaded by user ${userId} in room ${roomId}: ${fileInfo.originalName}`);
    } catch (error) {
      logger.error('Error uploading file:', error);

      // Clean up file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error('Error cleaning up uploaded file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to upload file'
      });
    }
  }
);

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   put:
 *     summary: Edit a chat message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message edited successfully
 */
router.put(
  '/messages/:messageId',
  [
    param('messageId').isString().notEmpty(),
    body('content').isString().isLength({ min: 1, max: 2000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const result = await chatService.editMessage(userId, messageId, content);

      res.json({
        success: true,
        data: result
      });

      logger.info(`Message ${messageId} edited by user ${userId}`);
    } catch (error) {
      logger.error('Error editing message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to edit message'
      });
    }
  }
);

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   delete:
 *     summary: Delete a chat message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 */
router.delete(
  '/messages/:messageId',
  [param('messageId').isString().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { messageId } = req.params;
      const userId = req.user.id;

      await chatService.deleteMessage(userId, messageId);

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });

      logger.info(`Message ${messageId} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete message'
      });
    }
  }
);

/**
 * @swagger
 * /api/chat/messages/{messageId}/reactions:
 *   post:
 *     summary: Add reaction to message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reaction added successfully
 */
router.post(
  '/messages/:messageId/reactions',
  [
    param('messageId').isString().notEmpty(),
    body('emoji').isString().isLength({ min: 1, max: 10 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user.id;

      const result = await chatService.addReaction(userId, messageId, emoji);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error adding reaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add reaction'
      });
    }
  }
);

/**
 * @swagger
 * /api/chat/messages/{messageId}/reactions:
 *   delete:
 *     summary: Remove reaction from message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: emoji
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reaction removed successfully
 */
router.delete(
  '/messages/:messageId/reactions',
  [
    param('messageId').isString().notEmpty(),
    query('emoji').isString().isLength({ min: 1, max: 10 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { messageId } = req.params;
      const { emoji } = req.query;
      const userId = req.user.id;

      await chatService.removeReaction(userId, messageId, emoji);

      res.json({
        success: true,
        message: 'Reaction removed successfully'
      });
    } catch (error) {
      logger.error('Error removing reaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove reaction'
      });
    }
  }
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one file allowed.'
      });
    }
  }

  if (error.message === 'Invalid file type') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'
    });
  }

  logger.error('Chat route error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

export default router;
