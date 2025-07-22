/**
 * Talks API Routes
 * Handle talk submissions and management
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/talks/:eventId
 * Get talks for a specific event
 */
router.get(
  '/:eventId',
  param('eventId').isLength({ min: 1 }).withMessage('Event ID is required'),
  handleValidationErrors,
  async(req, res) => {
    try {
      const { database } = req.app.locals;
      const { eventId } = req.params;
      const {
        status,
        category,
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filter
      const filter = { eventId };
      if (status) {
        filter.status = status;
      }
      if (category) {
        filter.category = category;
      }

      // Get talks
      const talks = await database.findAll('talks', filter);

      // Sort talks
      talks.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Paginate
      const total = talks.length;
      const paginatedTalks = talks.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      res.json({
        talks: paginatedTalks,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total
        },
        summary: {
          total,
          confirmed: talks.filter(t => t.status === 'confirmed').length,
          pending: talks.filter(t => t.status === 'pending').length,
          categories: talks.reduce((acc, talk) => {
            acc[talk.category] = (acc[talk.category] || 0) + 1;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('Error fetching talks:', error);
      res.status(500).json({
        error: 'Failed to fetch talks',
        message: '発表情報の取得に失敗しました'
      });
    }
  }
);

/**
 * POST /api/talks
 * Submit a new talk
 */
router.post(
  '/',
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Description is required and must be less than 2000 characters'),
    body('category')
      .isIn([
        'tech',
        'hobby',
        'learning',
        'travel',
        'food',
        'game',
        'lifehack',
        'pet',
        'garden',
        'money',
        'sports',
        'music',
        'other'
      ])
      .withMessage('Valid category is required'),
    body('eventId').isLength({ min: 1 }).withMessage('Event ID is required'),
    body('speakerName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Speaker name is required'),
    body('speakerEmail').isEmail().normalizeEmail().withMessage('Valid speaker email is required')
  ],
  handleValidationErrors,
  async(req, res) => {
    try {
      const { database, eventService } = req.app.locals;
      const talkData = req.body;

      // Get event
      const event = await database.findById('events', talkData.eventId);
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'イベントが見つかりません'
        });
      }

      // Validate talk submission
      await eventService.validateTalkSubmission(event, talkData);

      const settings = await database.getSettings();

      // Create talk
      const talk = await database.create('talks', {
        ...talkData,
        duration: event.talkDuration || 5,
        status: settings.talkSettings?.requireApproval ? 'pending' : 'confirmed',
        submissionSource: 'api'
      });

      // Track analytics
      await eventService.trackAnalytics(event.id, 'talk_submitted', {
        category: talk.category,
        source: 'api'
      });

      res.status(201).json({
        success: true,
        message: 'Talk submitted successfully',
        talk: {
          id: talk.id,
          title: talk.title,
          category: talk.category,
          status: talk.status,
          submittedAt: talk.createdAt
        }
      });
    } catch (error) {
      console.error('Error submitting talk:', error);
      res.status(500).json({
        error: 'Failed to submit talk',
        message: '発表申込みに失敗しました'
      });
    }
  }
);

/**
 * PUT /api/talks/:id
 * Update a talk
 */
router.put(
  '/:id',
  [
    param('id').isLength({ min: 1 }).withMessage('Talk ID is required'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ min: 1, max: 2000 }),
    body('category')
      .optional()
      .isIn([
        'tech',
        'hobby',
        'learning',
        'travel',
        'food',
        'game',
        'lifehack',
        'pet',
        'garden',
        'money',
        'sports',
        'music',
        'other'
      ]),
    body('status').optional().isIn(['pending', 'confirmed', 'rejected'])
  ],
  handleValidationErrors,
  async(req, res) => {
    try {
      const { database, eventService } = req.app.locals;
      const { id } = req.params;
      const updates = req.body;

      // Find existing talk
      const talk = await database.findById('talks', id);
      if (!talk) {
        return res.status(404).json({
          error: 'Talk not found',
          message: '発表が見つかりません'
        });
      }

      // Update talk
      const updatedTalk = await database.update('talks', id, updates);

      // Track analytics for status changes
      if (updates.status && updates.status !== talk.status) {
        await eventService.trackAnalytics(talk.eventId, 'talk_status_changed', {
          from: talk.status,
          to: updates.status
        });
      }

      res.json({
        success: true,
        message: 'Talk updated successfully',
        talk: updatedTalk
      });
    } catch (error) {
      console.error('Error updating talk:', error);
      res.status(500).json({
        error: 'Failed to update talk',
        message: '発表情報の更新に失敗しました'
      });
    }
  }
);

/**
 * DELETE /api/talks/:id
 * Delete a talk
 */
router.delete(
  '/:id',
  param('id').isLength({ min: 1 }).withMessage('Talk ID is required'),
  handleValidationErrors,
  async(req, res) => {
    try {
      const { database, eventService } = req.app.locals;
      const { id } = req.params;

      // Find existing talk
      const talk = await database.findById('talks', id);
      if (!talk) {
        return res.status(404).json({
          error: 'Talk not found',
          message: '発表が見つかりません'
        });
      }

      // Delete talk
      await database.delete('talks', id);

      // Track analytics
      await eventService.trackAnalytics(talk.eventId, 'talk_deleted', {
        category: talk.category,
        status: talk.status
      });

      res.json({
        success: true,
        message: 'Talk deleted successfully',
        talkId: id
      });
    } catch (error) {
      console.error('Error deleting talk:', error);
      res.status(500).json({
        error: 'Failed to delete talk',
        message: '発表の削除に失敗しました'
      });
    }
  }
);

export default router;
