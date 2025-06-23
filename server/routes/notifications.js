/**
 * 通知機能のAPIルート
 * SSE (Server-Sent Events) エンドポイントとWebSocket管理
 */

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const logger = require('../middleware/logger');
const { body, query, validationResult } = require('express-validator');

/**
 * SSE (Server-Sent Events) エンドポイント
 * GET /api/notifications/stream
 */
router.get('/stream', (req, res) => {
  try {
    const clientId = notificationService.setupSSE(req, res);
    logger.info(`New SSE connection established: ${clientId}`);
  } catch (error) {
    logger.error('Failed to establish SSE connection:', error);
    res.status(500).json({ error: 'Failed to establish SSE connection' });
  }
});

/**
 * 通知の手動送信
 * POST /api/notifications/send
 */
router.post(
  '/send',
  [
    body('event').notEmpty().withMessage('Event type is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type')
      .optional()
      .isIn(['info', 'success', 'warning', 'error'])
      .withMessage('Invalid notification type'),
    body('topic').optional().isString().withMessage('Topic must be a string')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { event, message, type = 'info', topic = 'all', data = {} } = req.body;

      const notificationData = {
        message,
        type,
        ...data,
        timestamp: new Date().toISOString()
      };

      if (topic === 'all') {
        notificationService.broadcast(event, notificationData);
      } else {
        notificationService.broadcastToTopic(topic, event, notificationData);
      }

      res.json({
        success: true,
        message: 'Notification sent successfully',
        event,
        topic
      });

      logger.info(`Manual notification sent: ${event} to ${topic}`);
    } catch (error) {
      logger.error('Failed to send notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }
);

/**
 * システム通知の送信
 * POST /api/notifications/system
 */
router.post(
  '/system',
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('type')
      .optional()
      .isIn(['info', 'success', 'warning', 'error'])
      .withMessage('Invalid notification type'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority level')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { message, type = 'info', priority = 'medium' } = req.body;

      notificationService.emit('system:notification', {
        message,
        type,
        priority,
        source: 'admin'
      });

      res.json({
        success: true,
        message: 'System notification sent successfully'
      });

      logger.info(`System notification sent: ${message} (${type})`);
    } catch (error) {
      logger.error('Failed to send system notification:', error);
      res.status(500).json({ error: 'Failed to send system notification' });
    }
  }
);

/**
 * 参加者登録通知
 * POST /api/notifications/participant-registered
 */
router.post(
  '/participant-registered',
  [
    body('participant').isObject().withMessage('Participant data is required'),
    body('participant.name').notEmpty().withMessage('Participant name is required'),
    body('participant.email').isEmail().withMessage('Valid email is required')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { participant } = req.body;

      notificationService.emit('participant:registered', participant);

      res.json({
        success: true,
        message: 'Participant registration notification sent'
      });

      logger.info(`Participant registration notification: ${participant.name}`);
    } catch (error) {
      logger.error('Failed to send participant registration notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }
);

/**
 * 発表申込み通知
 * POST /api/notifications/talk-submitted
 */
router.post(
  '/talk-submitted',
  [
    body('talk').isObject().withMessage('Talk data is required'),
    body('talk.title').notEmpty().withMessage('Talk title is required'),
    body('talk.speaker').notEmpty().withMessage('Speaker name is required')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { talk } = req.body;

      notificationService.emit('talk:submitted', talk);

      res.json({
        success: true,
        message: 'Talk submission notification sent'
      });

      logger.info(`Talk submission notification: ${talk.title} by ${talk.speaker}`);
    } catch (error) {
      logger.error('Failed to send talk submission notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }
);

/**
 * イベント更新通知
 * POST /api/notifications/event-updated
 */
router.post(
  '/event-updated',
  [
    body('event').isObject().withMessage('Event data is required'),
    body('event.id').notEmpty().withMessage('Event ID is required'),
    body('updateType')
      .optional()
      .isIn(['info', 'schedule', 'venue', 'urgent'])
      .withMessage('Invalid update type')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { event, updateType = 'info' } = req.body;

      notificationService.emit('event:updated', {
        ...event,
        updateType
      });

      res.json({
        success: true,
        message: 'Event update notification sent'
      });

      logger.info(`Event update notification: ${event.id} (${updateType})`);
    } catch (error) {
      logger.error('Failed to send event update notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }
);

/**
 * チャットメッセージの送信
 * POST /api/notifications/chat
 */
router.post(
  '/chat',
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('author').optional().isString().withMessage('Author must be a string'),
    body('room').optional().isString().withMessage('Room must be a string')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { message, author = 'System', room = 'general' } = req.body;

      notificationService.emit('chat:message', {
        message,
        author,
        room
      });

      res.json({
        success: true,
        message: 'Chat message sent successfully'
      });

      logger.info(`Chat message sent: ${author}: ${message}`);
    } catch (error) {
      logger.error('Failed to send chat message:', error);
      res.status(500).json({ error: 'Failed to send chat message' });
    }
  }
);

/**
 * 接続統計の取得
 * GET /api/notifications/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = notificationService.getConnectionStats();

    res.json({
      success: true,
      stats: {
        ...stats,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get notification stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * 通知履歴の取得
 * GET /api/notifications/history
 */
router.get(
  '/history',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('topic').optional().isString().withMessage('Topic must be a string'),
    query('event').optional().isString().withMessage('Event must be a string')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { limit = 20, topic, event } = req.query;

      let history = notificationService.notificationHistory;

      // フィルタリング
      if (topic && topic !== 'all') {
        history = history.filter(notification => notification.topic === topic);
      }

      if (event) {
        history = history.filter(notification => notification.event === event);
      }

      // 制限適用
      const limitedHistory = history.slice(-parseInt(limit));

      res.json({
        success: true,
        history: limitedHistory,
        total: history.length,
        limit: parseInt(limit)
      });
    } catch (error) {
      logger.error('Failed to get notification history:', error);
      res.status(500).json({ error: 'Failed to get notification history' });
    }
  }
);

/**
 * トピック一覧の取得
 * GET /api/notifications/topics
 */
router.get('/topics', (req, res) => {
  try {
    const topics = Array.from(notificationService.subscriptions.keys());

    res.json({
      success: true,
      topics,
      count: topics.length
    });
  } catch (error) {
    logger.error('Failed to get topics:', error);
    res.status(500).json({ error: 'Failed to get topics' });
  }
});

/**
 * 通知設定のテスト
 * POST /api/notifications/test
 */
router.post(
  '/test',
  [body('type').optional().isIn(['sse', 'websocket', 'both']).withMessage('Invalid test type')],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { type = 'both' } = req.body;
      const testMessage = {
        message: 'This is a test notification',
        type: 'info',
        test: true,
        timestamp: new Date().toISOString()
      };

      if (type === 'sse' || type === 'both') {
        notificationService.broadcastSSE({
          id: require('uuid').v4(),
          event: 'test_notification',
          data: testMessage,
          topic: 'all',
          timestamp: new Date().toISOString()
        });
      }

      if (type === 'websocket' || type === 'both') {
        notificationService.broadcastWebSocket({
          id: require('uuid').v4(),
          event: 'test_notification',
          data: testMessage,
          topic: 'all',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: `Test notification sent via ${type}`,
        testType: type
      });

      logger.info(`Test notification sent via ${type}`);
    } catch (error) {
      logger.error('Failed to send test notification:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  }
);

/**
 * サーバーヘルスチェック
 * GET /api/notifications/health
 */
router.get('/health', (req, res) => {
  try {
    const stats = notificationService.getConnectionStats();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: stats,
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
