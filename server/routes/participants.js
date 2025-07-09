/**
 * Participants API Routes
 * Handle participant registration, management, and queries
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = express.Router();

/**
 * GET /api/participants
 * Get participants for current event or return error message
 */
router.get('/', async (req, res) => {
  try {
    const { database } = req.app.locals;

    // Get current event
    const events = await database.findAll('events');
    const currentEvent = events.find(event => event.status === 'upcoming');

    if (!currentEvent) {
      return res.status(404).json({
        error: 'No current event',
        message: '現在開催予定のイベントがありません',
        suggestion: 'イベントIDを指定してください: /api/participants/:eventId'
      });
    }

    // Get participants for current event
    const participants = await database.findAll('participants', { eventId: currentEvent.id });

    res.json({
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      participants: participants || [],
      total: participants ? participants.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      error: 'Failed to fetch participants',
      message: '参加者情報の取得に失敗しました',
      details: error.message
    });
  }
});

// Rate limiting for registration
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registrations per hour
  message: {
    error: 'Too many registration attempts. Please try again later.',
    retryAfter: 3600
  }
});

// Validation middleware
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('名前は1文字以上100文字以内で入力してください'),
  body('email').isEmail().normalizeEmail().withMessage('有効なメールアドレスを入力してください'),
  body('participationType')
    .isIn(['onsite', 'online', 'undecided'])
    .withMessage('参加方法を選択してください'),
  body('eventId').optional().isLength({ min: 1 }).withMessage('イベントIDが無効です'),
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('メッセージは1000文字以内で入力してください'),
  body('newsletter').optional().isBoolean().withMessage('ニュースレター購読設定が無効です')
];

const validateSpeakerRegistration = [
  ...validateRegistration,
  body('talkTitle')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('発表タイトルは1文字以上200文字以内で入力してください'),
  body('talkDescription')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('発表概要は1文字以上2000文字以内で入力してください'),
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
    ])
    .withMessage('有効なカテゴリーを選択してください')
];

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
 * POST /api/participants/register
 * Register a participant for an event
 */
router.post(
  '/register',
  registrationLimiter,
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database, emailService, eventService } = req.app.locals;
      const {
        name,
        email,
        participationType,
        eventId,
        message = '',
        newsletter = false
      } = req.body;

      // Get current event if no eventId provided
      const event = eventId
        ? await database.findById('events', eventId)
        : await database.getCurrentEvent();

      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'イベントが見つかりません'
        });
      }

      // Check if registration is open
      if (!event.registrationOpen) {
        return res.status(400).json({
          error: 'Registration closed',
          message: 'このイベントの参加登録は締め切られています'
        });
      }

      // Check for duplicate registration
      const existingParticipant = await database.findOne('participants', {
        email,
        eventId: event.id
      });

      if (existingParticipant) {
        return res.status(400).json({
          error: 'Already registered',
          message: 'このメールアドレスで既に登録されています',
          participant: {
            id: existingParticipant.id,
            registeredAt: existingParticipant.createdAt
          }
        });
      }

      // Check capacity
      const currentParticipants = await database.count('participants', { eventId: event.id });
      const settings = await database.getSettings();
      const maxParticipants = settings.registrationSettings?.maxParticipants || 100;

      if (currentParticipants >= maxParticipants) {
        return res.status(400).json({
          error: 'Event full',
          message: 'このイベントは定員に達しています'
        });
      }

      // Create participant record
      const participant = await database.create('participants', {
        name,
        email,
        participationType,
        eventId: event.id,
        message,
        newsletter,
        status: settings.registrationSettings?.requireApproval ? 'pending' : 'confirmed',
        checkedIn: false,
        registrationSource: 'web',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Send confirmation email
      if (settings.emailEnabled && settings.notificationSettings?.emailOnRegistration) {
        try {
          await emailService.sendRegistrationConfirmation(participant, event);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the registration if email fails
        }
      }

      // Track analytics
      await eventService.trackAnalytics(event.id, 'participant_registered', {
        participationType,
        source: 'web'
      });

      res.status(201).json({
        success: true,
        message: 'Registered successfully',
        participant: {
          id: participant.id,
          name: participant.name,
          participationType: participant.participationType,
          status: participant.status,
          registeredAt: participant.createdAt
        },
        event: {
          id: event.id,
          title: event.title,
          date: event.date
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: '登録処理中にエラーが発生しました。しばらく待ってから再度お試しください。'
      });
    }
  }
);

/**
 * POST /api/participants/register-speaker
 * Register a speaker with talk submission
 */
router.post(
  '/register-speaker',
  registrationLimiter,
  validateSpeakerRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database, emailService, eventService } = req.app.locals;
      const {
        name,
        email,
        participationType,
        eventId,
        message = '',
        newsletter = false,
        talkTitle,
        talkDescription,
        category = 'other'
      } = req.body;

      // Get current event if no eventId provided
      const event = eventId
        ? await database.findById('events', eventId)
        : await database.getCurrentEvent();

      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'イベントが見つかりません'
        });
      }

      // Check if registration and talk submission are open
      if (!event.registrationOpen || !event.talkSubmissionOpen) {
        return res.status(400).json({
          error: 'Registration or talk submission closed',
          message: '参加登録または発表申込みが締め切られています'
        });
      }

      // Check for duplicate registration
      const existingParticipant = await database.findOne('participants', {
        email,
        eventId: event.id
      });

      if (existingParticipant) {
        return res.status(400).json({
          error: 'Already registered',
          message: 'このメールアドレスで既に登録されています'
        });
      }

      // Check talk slots
      const currentTalks = await database.count('talks', { eventId: event.id });
      const maxTalks = event.maxTalks || 20;

      if (currentTalks >= maxTalks) {
        return res.status(400).json({
          error: 'Talk slots full',
          message: '発表枠が満席です。聴講参加をご検討ください'
        });
      }

      const settings = await database.getSettings();

      // Create participant record
      const participant = await database.create('participants', {
        name,
        email,
        participationType,
        eventId: event.id,
        message,
        newsletter,
        status: settings.registrationSettings?.requireApproval ? 'pending' : 'confirmed',
        checkedIn: false,
        registrationSource: 'web',
        isSpeaker: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Create talk record
      const talk = await database.create('talks', {
        title: talkTitle,
        description: talkDescription,
        category,
        eventId: event.id,
        speakerId: participant.id,
        speakerName: name,
        speakerEmail: email,
        duration: event.talkDuration || 5,
        status: settings.talkSettings?.requireApproval ? 'pending' : 'confirmed',
        submissionSource: 'web'
      });

      // Send confirmation email
      if (settings.emailEnabled && settings.notificationSettings?.emailOnTalkSubmission) {
        try {
          await emailService.sendSpeakerConfirmation(participant, talk, event);
        } catch (emailError) {
          console.error('Failed to send speaker confirmation email:', emailError);
        }
      }

      // Track analytics
      await eventService.trackAnalytics(event.id, 'speaker_registered', {
        participationType,
        category,
        source: 'web'
      });

      res.status(201).json({
        success: true,
        message: 'Speaker registration successful',
        participant: {
          id: participant.id,
          name: participant.name,
          participationType: participant.participationType,
          status: participant.status,
          isSpeaker: true,
          registeredAt: participant.createdAt
        },
        talk: {
          id: talk.id,
          title: talk.title,
          category: talk.category,
          status: talk.status,
          submittedAt: talk.createdAt
        },
        event: {
          id: event.id,
          title: event.title,
          date: event.date
        }
      });
    } catch (error) {
      console.error('Speaker registration error:', error);
      res.status(500).json({
        error: 'Speaker registration failed',
        message: '発表者登録処理中にエラーが発生しました。しばらく待ってから再度お試しください。'
      });
    }
  }
);

/**
 * GET /api/participants/:eventId
 * Get participants for an event (admin only for now)
 */
router.get(
  '/:eventId',
  param('eventId').isLength({ min: 1 }).withMessage('Event ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database } = req.app.locals;
      const { eventId } = req.params;
      const {
        status,
        participationType,
        isSpeaker,
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
      if (participationType) {
        filter.participationType = participationType;
      }
      if (isSpeaker !== undefined) {
        filter.isSpeaker = isSpeaker === 'true';
      }

      // Get participants
      const participants = await database.findAll('participants', filter);

      // Sort
      participants.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Paginate
      const total = participants.length;
      const paginatedParticipants = participants.slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
      );

      // Remove sensitive information
      const sanitizedParticipants = paginatedParticipants.map(participant => ({
        id: participant.id,
        name: participant.name,
        participationType: participant.participationType,
        status: participant.status,
        isSpeaker: participant.isSpeaker || false,
        checkedIn: participant.checkedIn || false,
        registeredAt: participant.createdAt
      }));

      res.json({
        participants: sanitizedParticipants,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total
        },
        summary: {
          total,
          confirmed: participants.filter(p => p.status === 'confirmed').length,
          pending: participants.filter(p => p.status === 'pending').length,
          speakers: participants.filter(p => p.isSpeaker).length,
          onsite: participants.filter(p => p.participationType === 'onsite').length,
          online: participants.filter(p => p.participationType === 'online').length
        }
      });
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({
        error: 'Failed to fetch participants',
        message: '参加者情報の取得に失敗しました'
      });
    }
  }
);

/**
 * PUT /api/participants/:id
 * Update participant information
 */
router.put(
  '/:id',
  param('id').isLength({ min: 1 }).withMessage('Participant ID is required'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('participationType').optional().isIn(['onsite', 'online', 'undecided']),
  body('status').optional().isIn(['pending', 'confirmed', 'cancelled']),
  body('checkedIn').optional().isBoolean(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database, eventService } = req.app.locals;
      const { id } = req.params;
      const updates = req.body;

      // Find existing participant
      const participant = await database.findById('participants', id);
      if (!participant) {
        return res.status(404).json({
          error: 'Participant not found',
          message: '参加者が見つかりません'
        });
      }

      // Update participant
      const updatedParticipant = await database.update('participants', id, updates);

      // Track analytics for status changes
      if (updates.status && updates.status !== participant.status) {
        await eventService.trackAnalytics(participant.eventId, 'participant_status_changed', {
          from: participant.status,
          to: updates.status
        });
      }

      res.json({
        success: true,
        message: 'Participant updated successfully',
        participant: {
          id: updatedParticipant.id,
          name: updatedParticipant.name,
          participationType: updatedParticipant.participationType,
          status: updatedParticipant.status,
          checkedIn: updatedParticipant.checkedIn,
          updatedAt: updatedParticipant.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating participant:', error);
      res.status(500).json({
        error: 'Failed to update participant',
        message: '参加者情報の更新に失敗しました'
      });
    }
  }
);

/**
 * DELETE /api/participants/:id
 * Delete/cancel participant registration (admin only)
 */
router.delete(
  '/:id',
  param('id').isLength({ min: 1 }).withMessage('Participant ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database, eventService } = req.app.locals;
      const { id } = req.params;

      // Find existing participant
      const participant = await database.findById('participants', id);
      if (!participant) {
        return res.status(404).json({
          error: 'Participant not found',
          message: '参加者が見つかりません'
        });
      }

      // If participant is a speaker, also remove their talk
      if (participant.isSpeaker) {
        const talks = await database.findAll('talks', { speakerId: id });
        for (const talk of talks) {
          await database.delete('talks', talk.id);
        }
      }

      // Delete participant
      await database.delete('participants', id);

      // Track analytics
      await eventService.trackAnalytics(participant.eventId, 'participant_cancelled', {
        participationType: participant.participationType,
        isSpeaker: participant.isSpeaker
      });

      res.json({
        success: true,
        message: 'Participant registration cancelled',
        participantId: id
      });
    } catch (error) {
      console.error('Error deleting participant:', error);
      res.status(500).json({
        error: 'Failed to cancel registration',
        message: '登録キャンセル処理に失敗しました'
      });
    }
  }
);

export default router;
