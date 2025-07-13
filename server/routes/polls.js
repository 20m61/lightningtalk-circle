/**
 * Interactive Polls & Feedback API Routes v1
 * Real-time polling, Q&A, and enhanced feedback collection system
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const logger = createLogger('InteractivePolls');

// Rate limiting for poll API
const pollRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs (higher for interactive features)
  message: 'Too many poll requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
router.use(pollRateLimit);

/**
 * @swagger
 * components:
 *   schemas:
 *     Poll:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique poll identifier
 *         eventId:
 *           type: string
 *           description: Associated event ID
 *         talkId:
 *           type: string
 *           description: Associated talk ID (optional)
 *         title:
 *           type: string
 *           description: Poll question/title
 *         description:
 *           type: string
 *           description: Additional poll description
 *         type:
 *           type: string
 *           enum: [multiple_choice, rating_scale, text_input, yes_no, ranking]
 *         options:
 *           type: array
 *           description: Poll options (for multiple choice/ranking)
 *         settings:
 *           type: object
 *           properties:
 *             anonymous:
 *               type: boolean
 *             multipleAnswers:
 *               type: boolean
 *             showResults:
 *               type: string
 *               enum: [immediately, after_voting, never, manual]
 *             duration:
 *               type: number
 *               description: Duration in seconds (null for indefinite)
 *         status:
 *           type: string
 *           enum: [draft, active, paused, ended]
 *         createdBy:
 *           type: string
 *           description: Creator user ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         startsAt:
 *           type: string
 *           format: date-time
 *         endsAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/polls:
 *   post:
 *     summary: Create a new poll
 *     tags: [Polls]
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
 *               - title
 *               - type
 *             properties:
 *               eventId:
 *                 type: string
 *               talkId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, rating_scale, text_input, yes_no, ranking]
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               settings:
 *                 type: object
 */
router.post(
  '/',
  authenticateToken,
  [
    body('eventId').isString().notEmpty().withMessage('Event ID is required'),
    body('talkId').optional().isString(),
    body('title')
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be 5-200 characters'),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('type')
      .isIn(['multiple_choice', 'rating_scale', 'text_input', 'yes_no', 'ranking'])
      .withMessage('Invalid poll type'),
    body('options').optional().isArray(),
    body('options.*').optional().isString().isLength({ max: 100 }),
    body('settings').optional().isObject(),
    body('settings.anonymous').optional().isBoolean(),
    body('settings.multipleAnswers').optional().isBoolean(),
    body('settings.showResults')
      .optional()
      .isIn(['immediately', 'after_voting', 'never', 'manual']),
    body('settings.duration').optional().isInt({ min: 10, max: 3600 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { eventId, talkId, title, description, type, options, settings } = req.body;

      // Verify event exists
      const event = await req.app.locals.database.read('events', eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Verify talk exists if provided
      if (talkId) {
        const talk = await req.app.locals.database.read('talks', talkId);
        if (!talk) {
          return res.status(404).json({
            success: false,
            error: 'Talk not found'
          });
        }
      }

      // Validate options for certain poll types
      if (['multiple_choice', 'ranking'].includes(type)) {
        if (!options || !Array.isArray(options) || options.length < 2) {
          return res.status(400).json({
            success: false,
            error: 'Multiple choice and ranking polls require at least 2 options'
          });
        }
      }

      // Create poll
      const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const poll = {
        id: pollId,
        eventId,
        talkId: talkId || null,
        title: title.trim(),
        description: description?.trim() || '',
        type,
        options: options || [],
        settings: {
          anonymous: settings?.anonymous ?? true,
          multipleAnswers: settings?.multipleAnswers ?? false,
          showResults: settings?.showResults || 'after_voting',
          duration: settings?.duration || null
        },
        status: 'draft',
        createdBy: userId,
        createdAt: new Date(),
        startsAt: null,
        endsAt: null,
        responses: [],
        statistics: {
          totalResponses: 0,
          uniqueParticipants: 0,
          responseBreakdown: {}
        }
      };

      await req.app.locals.database.create('polls', poll);

      res.status(201).json({
        success: true,
        data: poll,
        message: 'Poll created successfully'
      });

      logger.info(`New poll created: ${pollId} by user ${userId} for event ${eventId}`);
    } catch (error) {
      logger.error('Error creating poll:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create poll'
      });
    }
  }
);

/**
 * @swagger
 * /api/polls/events/{eventId}:
 *   get:
 *     summary: Get polls for an event
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, paused, ended]
 *       - in: query
 *         name: includeResults
 *         schema:
 *           type: boolean
 */
router.get(
  '/events/:eventId',
  [
    param('eventId').isString().notEmpty(),
    query('status').optional().isIn(['draft', 'active', 'paused', 'ended']),
    query('includeResults').optional().isBoolean().toBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { eventId } = req.params;
      const { status, includeResults } = req.query;

      // Build query
      const queryParams = { eventId };
      if (status) {
        queryParams.status = status;
      }

      // Get polls
      let polls = await req.app.locals.database.query('polls', queryParams);

      // Sort by creation date (newest first)
      polls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Include results if requested and allowed
      if (includeResults) {
        polls = await Promise.all(
          polls.map(async poll => {
            const showResults = poll.settings.showResults;
            const isOwner = req.user && req.user.id === poll.createdBy;
            const hasVoted = req.user && poll.responses.some(r => r.userId === req.user.id);

            // Determine if results should be shown
            const shouldShowResults =
              isOwner ||
              showResults === 'immediately' ||
              (showResults === 'after_voting' && hasVoted) ||
              poll.status === 'ended';

            if (shouldShowResults) {
              return {
                ...poll,
                results: await this.calculatePollResults(poll)
              };
            } else {
              // Remove detailed responses for non-authorized users
              const { responses, ...pollWithoutResponses } = poll;
              return {
                ...pollWithoutResponses,
                hasResponded: hasVoted,
                totalResponses: poll.statistics.totalResponses
              };
            }
          })
        );
      }

      res.json({
        success: true,
        data: polls
      });

      logger.info(`Retrieved ${polls.length} polls for event ${eventId}`);
    } catch (error) {
      logger.error('Error retrieving polls:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve polls'
      });
    }
  }
);

/**
 * @swagger
 * /api/polls/{pollId}:
 *   get:
 *     summary: Get a specific poll
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:pollId', [param('pollId').isString().notEmpty()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { pollId } = req.params;
    const poll = await req.app.locals.database.read('polls', pollId);

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    // Check if user has voting permission
    const hasVoted = req.user && poll.responses.some(r => r.userId === req.user.id);
    const isOwner = req.user && req.user.id === poll.createdBy;

    // Determine if results should be shown
    const showResults = poll.settings.showResults;
    const shouldShowResults =
      isOwner ||
      showResults === 'immediately' ||
      (showResults === 'after_voting' && hasVoted) ||
      poll.status === 'ended';

    let responseData = { ...poll };

    if (shouldShowResults) {
      responseData.results = await this.calculatePollResults(poll);
    } else {
      // Remove sensitive data for non-authorized users
      const { responses, ...pollWithoutResponses } = poll;
      responseData = {
        ...pollWithoutResponses,
        hasResponded: hasVoted,
        totalResponses: poll.statistics.totalResponses
      };
    }

    res.json({
      success: true,
      data: responseData
    });

    logger.info(`Poll retrieved: ${pollId} by user ${req.user?.id || 'anonymous'}`);
  } catch (error) {
    logger.error('Error retrieving poll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve poll'
    });
  }
});

/**
 * @swagger
 * /api/polls/{pollId}/respond:
 *   post:
 *     summary: Submit a response to a poll
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: pollId
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
 *               answers:
 *                 type: array
 *                 description: Array of selected options or text responses
 *               participantInfo:
 *                 type: object
 *                 description: Optional participant information
 */
router.post(
  '/:pollId/respond',
  [
    param('pollId').isString().notEmpty(),
    body('answers').isArray().notEmpty().withMessage('Answers are required'),
    body('participantInfo').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { pollId } = req.params;
      const { answers, participantInfo } = req.body;
      const userId = req.user?.id;

      // Get poll
      const poll = await req.app.locals.database.read('polls', pollId);
      if (!poll) {
        return res.status(404).json({
          success: false,
          error: 'Poll not found'
        });
      }

      // Check if poll is active
      if (poll.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Poll is not currently active'
        });
      }

      // Check if poll has ended
      if (poll.endsAt && new Date() > new Date(poll.endsAt)) {
        return res.status(400).json({
          success: false,
          error: 'Poll has ended'
        });
      }

      // Generate participant ID for anonymous polls
      const participantId = userId || `anon_${req.ip}_${Date.now()}`;

      // Check if user has already responded (if not allowing multiple answers)
      if (!poll.settings.multipleAnswers) {
        const existingResponse = poll.responses.find(r =>
          poll.settings.anonymous ? r.participantId === participantId : r.userId === userId
        );

        if (existingResponse) {
          return res.status(409).json({
            success: false,
            error: 'You have already responded to this poll'
          });
        }
      }

      // Validate answers based on poll type
      if (!this.validateAnswers(poll, answers)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid answers for this poll type'
        });
      }

      // Create response
      const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const response = {
        id: responseId,
        pollId,
        userId: poll.settings.anonymous ? null : userId,
        participantId: poll.settings.anonymous ? participantId : null,
        answers,
        participantInfo: participantInfo || {},
        submittedAt: new Date(),
        ipAddress: req.ip
      };

      // Add response to poll
      poll.responses.push(response);

      // Update statistics
      poll.statistics.totalResponses = poll.responses.length;
      poll.statistics.uniqueParticipants = new Set(
        poll.responses.map(r => r.userId || r.participantId)
      ).size;

      // Update response breakdown
      this.updateResponseBreakdown(poll);

      // Save updated poll
      await req.app.locals.database.update('polls', pollId, poll);

      // Broadcast update via WebSocket
      if (req.app.locals.websocketService) {
        req.app.locals.websocketService.broadcastToRoom(`event:${poll.eventId}`, 'pollResponse', {
          pollId,
          eventId: poll.eventId,
          statistics: poll.statistics,
          newResponse: poll.settings.showResults === 'immediately' ? response : null,
          timestamp: new Date().toISOString()
        });

        req.app.locals.websocketService.broadcastToRoom(`poll:${pollId}`, 'pollResponse', {
          pollId,
          eventId: poll.eventId,
          statistics: poll.statistics,
          newResponse: poll.settings.showResults === 'immediately' ? response : null,
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json({
        success: true,
        data: {
          responseId,
          pollId,
          submittedAt: response.submittedAt
        },
        message: 'Response submitted successfully'
      });

      logger.info(`Poll response submitted: ${responseId} for poll ${pollId}`);
    } catch (error) {
      logger.error('Error submitting poll response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit response'
      });
    }
  }
);

/**
 * @swagger
 * /api/polls/{pollId}/start:
 *   post:
 *     summary: Start a poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  '/:pollId/start',
  authenticateToken,
  [param('pollId').isString().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { pollId } = req.params;
      const userId = req.user.id;

      const poll = await req.app.locals.database.read('polls', pollId);
      if (!poll) {
        return res.status(404).json({
          success: false,
          error: 'Poll not found'
        });
      }

      // Check ownership
      if (poll.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Check if poll can be started
      if (poll.status !== 'draft' && poll.status !== 'paused') {
        return res.status(400).json({
          success: false,
          error: 'Poll cannot be started in current status'
        });
      }

      // Update poll status
      const now = new Date();
      poll.status = 'active';
      poll.startsAt = now;

      if (poll.settings.duration) {
        poll.endsAt = new Date(now.getTime() + poll.settings.duration * 1000);
      }

      await req.app.locals.database.update('polls', pollId, poll);

      // Broadcast poll start
      if (req.app.locals.websocketService) {
        req.app.locals.websocketService.broadcastToRoom(`event:${poll.eventId}`, 'pollStarted', {
          pollId,
          eventId: poll.eventId,
          poll: poll,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: poll,
        message: 'Poll started successfully'
      });

      logger.info(`Poll started: ${pollId} by user ${userId}`);
    } catch (error) {
      logger.error('Error starting poll:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start poll'
      });
    }
  }
);

/**
 * @swagger
 * /api/polls/{pollId}/end:
 *   post:
 *     summary: End a poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  '/:pollId/end',
  authenticateToken,
  [param('pollId').isString().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { pollId } = req.params;
      const userId = req.user.id;

      const poll = await req.app.locals.database.read('polls', pollId);
      if (!poll) {
        return res.status(404).json({
          success: false,
          error: 'Poll not found'
        });
      }

      // Check ownership
      if (poll.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Check if poll can be ended
      if (poll.status !== 'active' && poll.status !== 'paused') {
        return res.status(400).json({
          success: false,
          error: 'Poll cannot be ended in current status'
        });
      }

      // Update poll status
      poll.status = 'ended';
      poll.endsAt = new Date();

      await req.app.locals.database.update('polls', pollId, poll);

      // Calculate final results
      const results = await this.calculatePollResults(poll);

      // Broadcast poll end
      if (req.app.locals.websocketService) {
        req.app.locals.websocketService.broadcastToRoom(`event:${poll.eventId}`, 'pollEnded', {
          pollId,
          eventId: poll.eventId,
          poll: poll,
          results: results,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: {
          poll,
          results
        },
        message: 'Poll ended successfully'
      });

      logger.info(`Poll ended: ${pollId} by user ${userId}`);
    } catch (error) {
      logger.error('Error ending poll:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end poll'
      });
    }
  }
);

/**
 * Helper method to validate answers based on poll type
 */
router.validateAnswers = function (poll, answers) {
  switch (poll.type) {
    case 'multiple_choice':
      // Check if all answers are valid options
      return answers.every(answer => typeof answer === 'string' && poll.options.includes(answer));

    case 'rating_scale':
      // Check if all answers are numbers within range (1-5)
      return answers.every(answer => typeof answer === 'number' && answer >= 1 && answer <= 5);

    case 'text_input':
      // Check if all answers are strings
      return answers.every(answer => typeof answer === 'string' && answer.trim().length > 0);

    case 'yes_no':
      // Check if answer is yes or no
      return answers.length === 1 && ['yes', 'no'].includes(answers[0]);

    case 'ranking': {
      // Check if answers are valid options and no duplicates
      const uniqueAnswers = new Set(answers);
      return (
        answers.length === uniqueAnswers.size &&
        answers.every(answer => poll.options.includes(answer))
      );
    }

    default:
      return false;
  }
};

/**
 * Helper method to update response breakdown statistics
 */
router.updateResponseBreakdown = function (poll) {
  const breakdown = {};

  switch (poll.type) {
    case 'multiple_choice':
    case 'yes_no': {
      poll.responses.forEach(response => {
        response.answers.forEach(answer => {
          breakdown[answer] = (breakdown[answer] || 0) + 1;
        });
      });
      break;
    }

    case 'rating_scale': {
      for (let i = 1; i <= 5; i++) {
        breakdown[i] = 0;
      }
      poll.responses.forEach(response => {
        response.answers.forEach(answer => {
          breakdown[answer] = (breakdown[answer] || 0) + 1;
        });
      });
      break;
    }

    case 'ranking': {
      poll.options.forEach(option => {
        breakdown[option] = { position_sum: 0, count: 0 };
      });
      poll.responses.forEach(response => {
        response.answers.forEach((answer, index) => {
          if (breakdown[answer]) {
            breakdown[answer].position_sum += index + 1;
            breakdown[answer].count += 1;
          }
        });
      });
      break;
    }
  }

  poll.statistics.responseBreakdown = breakdown;
};

/**
 * Helper method to calculate poll results
 */
router.calculatePollResults = async function (poll) {
  const results = {
    totalResponses: poll.statistics.totalResponses,
    uniqueParticipants: poll.statistics.uniqueParticipants,
    breakdown: poll.statistics.responseBreakdown,
    analysis: {}
  };

  switch (poll.type) {
    case 'multiple_choice':
    case 'yes_no': {
      const total = Object.values(results.breakdown).reduce((sum, count) => sum + count, 0);
      results.analysis = Object.entries(results.breakdown)
        .map(([option, count]) => ({
          option,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);
      break;
    }

    case 'rating_scale': {
      const ratings = Object.entries(results.breakdown).map(([rating, count]) => ({
        rating: parseInt(rating),
        count
      }));
      const totalRatings = ratings.reduce((sum, r) => sum + r.count, 0);
      const weightedSum = ratings.reduce((sum, r) => sum + r.rating * r.count, 0);

      results.analysis = {
        ratings,
        average: totalRatings > 0 ? Math.round((weightedSum / totalRatings) * 10) / 10 : 0,
        distribution: ratings.map(r => ({
          ...r,
          percentage: totalRatings > 0 ? Math.round((r.count / totalRatings) * 100) : 0
        }))
      };
      break;
    }

    case 'ranking': {
      results.analysis = Object.entries(results.breakdown)
        .map(([option, data]) => ({
          option,
          averagePosition:
            data.count > 0 ? Math.round((data.position_sum / data.count) * 10) / 10 : 0,
          mentions: data.count
        }))
        .sort((a, b) => a.averagePosition - b.averagePosition);
      break;
    }

    case 'text_input': {
      // Simple word frequency analysis
      const allText = poll.responses
        .flatMap(r => r.answers)
        .join(' ')
        .toLowerCase();
      const words = allText.split(/\s+/).filter(word => word.length > 3);
      const wordFreq = {};
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });

      results.analysis = {
        totalWords: words.length,
        topWords: Object.entries(wordFreq)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([word, count]) => ({ word, count })),
        responses: poll.responses.map(r => ({
          id: r.id,
          text: r.answers[0],
          submittedAt: r.submittedAt
        }))
      };
      break;
    }
  }

  return results;
};

export default router;
