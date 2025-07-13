/**
 * Speaker Dashboard API Routes v2
 * Comprehensive speaker management with voting system integration
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';

const router = express.Router();
const logger = createLogger('SpeakerDashboard');

// Rate limiting for speaker API
const speakerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// File upload configuration for presentations
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/presentations/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `presentation-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.ppt', '.pptx', '.key'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PPT, PPTX, and KEY files are allowed.'));
    }
  }
});

// Apply rate limiting
router.use(speakerRateLimit);

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     Speaker:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique speaker identifier
 *         userId:
 *           type: string
 *           description: Associated user ID
 *         bio:
 *           type: string
 *           description: Speaker biography
 *         expertise:
 *           type: array
 *           items:
 *             type: string
 *           description: Areas of expertise
 *         socialLinks:
 *           type: object
 *           properties:
 *             twitter:
 *               type: string
 *             linkedin:
 *               type: string
 *             github:
 *               type: string
 *         statistics:
 *           type: object
 *           properties:
 *             totalTalks:
 *               type: number
 *             averageRating:
 *               type: number
 *             totalVotes:
 *               type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/speakers/profile:
 *   get:
 *     summary: Get current speaker's profile
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Speaker profile retrieved successfully
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get speaker profile
    let speaker = await req.app.locals.database.query('speakers', { userId });

    if (!speaker || speaker.length === 0) {
      // Create new speaker profile if doesn't exist
      speaker = {
        id: `speaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        bio: '',
        expertise: [],
        socialLinks: {},
        statistics: {
          totalTalks: 0,
          averageRating: 0,
          totalVotes: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await req.app.locals.database.create('speakers', speaker);
    } else {
      speaker = speaker[0];
    }

    // Get user info
    const user = await req.app.locals.database.read('users', userId);

    res.json({
      success: true,
      data: {
        ...speaker,
        user: {
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      }
    });

    logger.info(`Speaker profile retrieved for user ${userId}`);
  } catch (error) {
    logger.error('Error retrieving speaker profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve speaker profile'
    });
  }
});

/**
 * @swagger
 * /api/speakers/profile:
 *   put:
 *     summary: Update speaker profile
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               expertise:
 *                 type: array
 *                 items:
 *                   type: string
 *               socialLinks:
 *                 type: object
 */
router.put(
  '/profile',
  [
    body('bio')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Bio must be less than 1000 characters'),
    body('expertise').optional().isArray().withMessage('Expertise must be an array'),
    body('expertise.*')
      .optional()
      .isString()
      .isLength({ max: 50 })
      .withMessage('Each expertise must be less than 50 characters'),
    body('socialLinks').optional().isObject().withMessage('Social links must be an object'),
    body('socialLinks.twitter').optional().isURL().withMessage('Invalid Twitter URL'),
    body('socialLinks.linkedin').optional().isURL().withMessage('Invalid LinkedIn URL'),
    body('socialLinks.github').optional().isURL().withMessage('Invalid GitHub URL')
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
      const updates = req.body;

      // Get existing speaker
      const speakers = await req.app.locals.database.query('speakers', { userId });
      if (!speakers || speakers.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Speaker profile not found'
        });
      }

      const speaker = speakers[0];

      // Update speaker profile
      const updatedSpeaker = {
        ...speaker,
        ...updates,
        updatedAt: new Date()
      };

      await req.app.locals.database.update('speakers', speaker.id, updatedSpeaker);

      res.json({
        success: true,
        data: updatedSpeaker,
        message: 'Speaker profile updated successfully'
      });

      logger.info(`Speaker profile updated for user ${userId}`);
    } catch (error) {
      logger.error('Error updating speaker profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update speaker profile'
      });
    }
  }
);

/**
 * @swagger
 * /api/speakers/talks:
 *   get:
 *     summary: Get speaker's talks
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, rejected, presented]
 *         description: Filter by talk status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of talks to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *         description: Number of talks to skip
 */
router.get(
  '/talks',
  [
    query('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected', 'presented']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
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
      const { status, limit = 20, offset = 0 } = req.query;

      // Build query
      const queryParams = { speakerId: userId };
      if (status) {
        queryParams.status = status;
      }

      // Get talks
      let talks = await req.app.locals.database.query('talks', queryParams);

      // Apply pagination
      const total = talks.length;
      talks = talks.slice(offset, offset + limit);

      // Get voting data for each talk
      const talksWithVotes = await Promise.all(
        talks.map(async talk => {
          const votes = await req.app.locals.database.query('votes', { talkId: talk.id });
          const voteCount = votes ? votes.length : 0;
          const averageRating =
            votes && votes.length > 0
              ? votes.reduce((sum, vote) => sum + vote.rating, 0) / votes.length
              : 0;

          return {
            ...talk,
            voting: {
              voteCount,
              averageRating: Math.round(averageRating * 10) / 10
            }
          };
        })
      );

      res.json({
        success: true,
        data: talksWithVotes,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });

      logger.info(`Retrieved ${talks.length} talks for speaker ${userId}`);
    } catch (error) {
      logger.error('Error retrieving speaker talks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve talks'
      });
    }
  }
);

/**
 * @swagger
 * /api/speakers/talks:
 *   post:
 *     summary: Submit a new talk proposal
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - eventId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               abstract:
 *                 type: string
 *               eventId:
 *                 type: string
 *               duration:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post(
  '/talks',
  [
    body('title')
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be 5-200 characters'),
    body('description')
      .isString()
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Description must be 20-2000 characters'),
    body('abstract')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Abstract must be less than 500 characters'),
    body('eventId').isString().notEmpty().withMessage('Event ID is required'),
    body('duration')
      .optional()
      .isInt({ min: 5, max: 60 })
      .withMessage('Duration must be 5-60 minutes'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .isLength({ max: 30 })
      .withMessage('Each tag must be less than 30 characters')
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
      const { title, description, abstract, eventId, duration = 20, tags = [] } = req.body;

      // Verify event exists and is accepting submissions
      const event = await req.app.locals.database.read('events', eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Check if submissions are open
      const now = new Date();
      if (event.submissionsDeadline && new Date(event.submissionsDeadline) < now) {
        return res.status(400).json({
          success: false,
          error: 'Submissions for this event are closed'
        });
      }

      // Create talk
      const talkId = `talk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const talk = {
        id: talkId,
        speakerId: userId,
        eventId,
        title: title.trim(),
        description: description.trim(),
        abstract: abstract?.trim(),
        duration,
        tags,
        status: 'submitted',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await req.app.locals.database.create('talks', talk);

      // Update speaker statistics
      const speakers = await req.app.locals.database.query('speakers', { userId });
      if (speakers && speakers.length > 0) {
        const speaker = speakers[0];
        speaker.statistics.totalTalks += 1;
        await req.app.locals.database.update('speakers', speaker.id, speaker);
      }

      res.status(201).json({
        success: true,
        data: talk,
        message: 'Talk proposal submitted successfully'
      });

      logger.info(`New talk proposal submitted: ${talkId} by speaker ${userId}`);
    } catch (error) {
      logger.error('Error submitting talk proposal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit talk proposal'
      });
    }
  }
);

/**
 * @swagger
 * /api/speakers/talks/{talkId}:
 *   put:
 *     summary: Update talk proposal
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: talkId
 *         required: true
 *         schema:
 *           type: string
 */
router.put(
  '/talks/:talkId',
  [
    param('talkId').isString().notEmpty(),
    body('title').optional().isString().trim().isLength({ min: 5, max: 200 }),
    body('description').optional().isString().trim().isLength({ min: 20, max: 2000 }),
    body('abstract').optional().isString().isLength({ max: 500 }),
    body('duration').optional().isInt({ min: 5, max: 60 }),
    body('tags').optional().isArray()
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
      const { talkId } = req.params;
      const updates = req.body;

      // Get existing talk
      const talk = await req.app.locals.database.read('talks', talkId);
      if (!talk) {
        return res.status(404).json({
          success: false,
          error: 'Talk not found'
        });
      }

      // Check ownership
      if (talk.speakerId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Only allow updates if status is draft or submitted
      if (!['draft', 'submitted'].includes(talk.status)) {
        return res.status(400).json({
          success: false,
          error: 'Cannot update talk in current status'
        });
      }

      // Update talk
      const updatedTalk = {
        ...talk,
        ...updates,
        updatedAt: new Date()
      };

      await req.app.locals.database.update('talks', talkId, updatedTalk);

      res.json({
        success: true,
        data: updatedTalk,
        message: 'Talk updated successfully'
      });

      logger.info(`Talk updated: ${talkId} by speaker ${userId}`);
    } catch (error) {
      logger.error('Error updating talk:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update talk'
      });
    }
  }
);

/**
 * @swagger
 * /api/speakers/talks/{talkId}/presentation:
 *   post:
 *     summary: Upload presentation file
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: talkId
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
 *               presentation:
 *                 type: string
 *                 format: binary
 */
router.post(
  '/talks/:talkId/presentation',
  upload.single('presentation'),
  [param('talkId').isString().notEmpty()],
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
      const { talkId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Get talk and verify ownership
      const talk = await req.app.locals.database.read('talks', talkId);
      if (!talk) {
        return res.status(404).json({
          success: false,
          error: 'Talk not found'
        });
      }

      if (talk.speakerId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Update talk with presentation info
      talk.presentation = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      };
      talk.updatedAt = new Date();

      await req.app.locals.database.update('talks', talkId, talk);

      res.json({
        success: true,
        data: {
          presentation: talk.presentation
        },
        message: 'Presentation uploaded successfully'
      });

      logger.info(`Presentation uploaded for talk ${talkId} by speaker ${userId}`);
    } catch (error) {
      logger.error('Error uploading presentation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload presentation'
      });
    }
  }
);

/**
 * @swagger
 * /api/speakers/analytics:
 *   get:
 *     summary: Get speaker analytics
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all talks
    const talks = await req.app.locals.database.query('talks', { speakerId: userId });

    // Get voting data
    const votingData = await Promise.all(
      talks.map(async talk => {
        const votes = await req.app.locals.database.query('votes', { talkId: talk.id });
        const feedback = await req.app.locals.database.query('feedback', { talkId: talk.id });

        return {
          talkId: talk.id,
          title: talk.title,
          eventId: talk.eventId,
          status: talk.status,
          votes: votes ? votes.length : 0,
          averageRating:
            votes && votes.length > 0
              ? votes.reduce((sum, vote) => sum + vote.rating, 0) / votes.length
              : 0,
          feedbackCount: feedback ? feedback.length : 0
        };
      })
    );

    // Calculate analytics
    const analytics = {
      totalTalks: talks.length,
      talksByStatus: {
        draft: talks.filter(t => t.status === 'draft').length,
        submitted: talks.filter(t => t.status === 'submitted').length,
        approved: talks.filter(t => t.status === 'approved').length,
        rejected: talks.filter(t => t.status === 'rejected').length,
        presented: talks.filter(t => t.status === 'presented').length
      },
      totalVotes: votingData.reduce((sum, data) => sum + data.votes, 0),
      averageRating:
        votingData.length > 0
          ? votingData.reduce((sum, data) => sum + data.averageRating, 0) / votingData.length
          : 0,
      mostVotedTalk: votingData.sort((a, b) => b.votes - a.votes)[0] || null,
      highestRatedTalk: votingData.sort((a, b) => b.averageRating - a.averageRating)[0] || null,
      recentActivity: votingData.slice(0, 5)
    };

    res.json({
      success: true,
      data: analytics
    });

    logger.info(`Analytics retrieved for speaker ${userId}`);
  } catch (error) {
    logger.error('Error retrieving speaker analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics'
    });
  }
});

/**
 * @swagger
 * /api/speakers/practice-timer:
 *   post:
 *     summary: Record practice session
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - talkId
 *               - duration
 *             properties:
 *               talkId:
 *                 type: string
 *               duration:
 *                 type: number
 *                 description: Duration in seconds
 *               notes:
 *                 type: string
 */
router.post(
  '/practice-timer',
  [
    body('talkId').isString().notEmpty().withMessage('Talk ID is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('notes').optional().isString().isLength({ max: 500 })
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
      const { talkId, duration, notes } = req.body;

      // Verify talk ownership
      const talk = await req.app.locals.database.read('talks', talkId);
      if (!talk || talk.speakerId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Record practice session
      const sessionId = `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const practiceSession = {
        id: sessionId,
        talkId,
        speakerId: userId,
        duration,
        notes,
        createdAt: new Date()
      };

      await req.app.locals.database.create('practiceSessions', practiceSession);

      // Update talk with latest practice info
      if (!talk.practiceData) {
        talk.practiceData = {
          totalSessions: 0,
          totalDuration: 0,
          averageDuration: 0,
          lastPractice: null
        };
      }

      talk.practiceData.totalSessions += 1;
      talk.practiceData.totalDuration += duration;
      talk.practiceData.averageDuration =
        talk.practiceData.totalDuration / talk.practiceData.totalSessions;
      talk.practiceData.lastPractice = new Date();

      await req.app.locals.database.update('talks', talkId, talk);

      res.json({
        success: true,
        data: {
          session: practiceSession,
          practiceData: talk.practiceData
        },
        message: 'Practice session recorded successfully'
      });

      logger.info(`Practice session recorded: ${sessionId} for talk ${talkId}`);
    } catch (error) {
      logger.error('Error recording practice session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record practice session'
      });
    }
  }
);

/**
 * @swagger
 * /api/speakers/feedback/{talkId}:
 *   get:
 *     summary: Get feedback for a talk
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: talkId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/feedback/:talkId', [param('talkId').isString().notEmpty()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { talkId } = req.params;

    // Verify talk ownership
    const talk = await req.app.locals.database.read('talks', talkId);
    if (!talk || talk.speakerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    // Get feedback
    const feedback = await req.app.locals.database.query('feedback', { talkId });

    // Get votes with comments
    const votes = await req.app.locals.database.query('votes', { talkId });
    const votesWithComments = votes ? votes.filter(v => v.comment) : [];

    // Aggregate feedback
    const aggregatedFeedback = {
      totalFeedback: (feedback ? feedback.length : 0) + votesWithComments.length,
      ratings: {
        content: feedback
          ? feedback.filter(f => f.ratings?.content).map(f => f.ratings.content)
          : [],
        delivery: feedback
          ? feedback.filter(f => f.ratings?.delivery).map(f => f.ratings.delivery)
          : [],
        engagement: feedback
          ? feedback.filter(f => f.ratings?.engagement).map(f => f.ratings.engagement)
          : []
      },
      comments: [
        ...(feedback
          ? feedback.map(f => ({
              type: 'feedback',
              comment: f.comment,
              ratings: f.ratings,
              createdAt: f.createdAt
            }))
          : []),
        ...votesWithComments.map(v => ({
          type: 'vote',
          comment: v.comment,
          rating: v.rating,
          createdAt: v.createdAt
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };

    // Calculate average ratings
    aggregatedFeedback.averageRatings = {
      content:
        aggregatedFeedback.ratings.content.length > 0
          ? aggregatedFeedback.ratings.content.reduce((a, b) => a + b, 0) /
            aggregatedFeedback.ratings.content.length
          : 0,
      delivery:
        aggregatedFeedback.ratings.delivery.length > 0
          ? aggregatedFeedback.ratings.delivery.reduce((a, b) => a + b, 0) /
            aggregatedFeedback.ratings.delivery.length
          : 0,
      engagement:
        aggregatedFeedback.ratings.engagement.length > 0
          ? aggregatedFeedback.ratings.engagement.reduce((a, b) => a + b, 0) /
            aggregatedFeedback.ratings.engagement.length
          : 0
    };

    res.json({
      success: true,
      data: aggregatedFeedback
    });

    logger.info(`Feedback retrieved for talk ${talkId} by speaker ${userId}`);
  } catch (error) {
    logger.error('Error retrieving feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback'
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 50MB.'
      });
    }
  }

  logger.error('Speaker routes error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

export default router;
