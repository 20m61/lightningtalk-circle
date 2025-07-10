import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('voting-routes');

/**
 * Real-time Voting API Routes
 */

// Create a new voting session
router.post(
  '/sessions',
  authenticateToken,
  [
    body('eventId')
      .isUUID()
      .withMessage('Event ID must be a valid UUID'),
    body('talkId')
      .isUUID()
      .withMessage('Talk ID must be a valid UUID'),
    body('duration')
      .optional()
      .isInt({ min: 30, max: 300 })
      .withMessage('Duration must be between 30-300 seconds')
      .toInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { eventId, talkId, duration = 60 } = req.body;
      const { votingService } = req.app.locals;

      const session = await votingService.createSession({
        eventId,
        talkId,
        duration,
        createdBy: req.user.id
      });

      // Emit session created event
      const { notificationService } = req.app.locals;
      await notificationService.broadcast('voting_session_created', {
        sessionId: session.id,
        eventId,
        talkId,
        endsAt: session.endsAt
      });

      res.status(201).json({
        success: true,
        session
      });
    } catch (error) {
      logger.error('Failed to create voting session:', error);
      res.status(500).json({
        error: 'Failed to create voting session',
        message: error.message
      });
    }
  }
);

// Submit a vote
router.post(
  '/sessions/:sessionId/vote',
  [
    param('sessionId')
      .isLength({ min: 1, max: 100 })
      .withMessage('Session ID must be provided')
      .trim(),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1-5')
      .toInt(),
    body('participantId')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Participant ID must be 1-100 characters')
      .trim()
      .escape()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { sessionId } = req.params;
      const { rating, participantId } = req.body;
      const { votingService, notificationService } = req.app.locals;

      // Get voter ID (from auth token or participant ID)
      const voterId = req.user?.id || participantId || req.ip;

      const vote = await votingService.submitVote({
        sessionId,
        voterId,
        rating
      });

      // Get updated results
      const results = await votingService.getResults(sessionId);

      // Broadcast vote update
      await notificationService.broadcast('vote_submitted', {
        sessionId,
        results
      });

      res.json({
        success: true,
        vote,
        results
      });
    } catch (error) {
      logger.error('Failed to submit vote:', error);

      if (error.message === 'Voting session not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Voting session has ended') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Already voted') {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({
        error: 'Failed to submit vote',
        message: error.message
      });
    }
  }
);

// Get voting results
router.get('/sessions/:sessionId/results', param('sessionId').notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { sessionId } = req.params;
    const { votingService } = req.app.locals;

    const results = await votingService.getResults(sessionId);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    logger.error('Failed to get voting results:', error);

    if (error.message === 'Voting session not found') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Failed to get voting results',
      message: error.message
    });
  }
});

// Get active voting sessions for an event
router.get('/events/:eventId/sessions', param('eventId').notEmpty(), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { votingService } = req.app.locals;

    const sessions = await votingService.getActiveSessions(eventId);

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    logger.error('Failed to get voting sessions:', error);
    res.status(500).json({
      error: 'Failed to get voting sessions',
      message: error.message
    });
  }
});

// End a voting session (admin only)
router.post(
  '/sessions/:sessionId/end',
  authenticateToken,
  param('sessionId').notEmpty(),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { votingService, notificationService } = req.app.locals;

      const session = await votingService.endSession(sessionId);
      const results = await votingService.getResults(sessionId);

      // Broadcast session ended
      await notificationService.broadcast('voting_session_ended', {
        sessionId,
        results
      });

      res.json({
        success: true,
        session,
        results
      });
    } catch (error) {
      logger.error('Failed to end voting session:', error);
      res.status(500).json({
        error: 'Failed to end voting session',
        message: error.message
      });
    }
  }
);

// Get voting history for a talk
router.get('/talks/:talkId/history', param('talkId').notEmpty(), async (req, res) => {
  try {
    const { talkId } = req.params;
    const { votingService } = req.app.locals;

    const history = await votingService.getTalkVotingHistory(talkId);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Failed to get voting history:', error);
    res.status(500).json({
      error: 'Failed to get voting history',
      message: error.message
    });
  }
});

export default router;
