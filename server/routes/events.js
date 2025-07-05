/**
 * Events API Routes
 * Handle event creation, management, and queries
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
 * GET /api/events
 * Get all events with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { database } = req.app.locals;
    const {
      status,
      upcoming = false,
      limit = 10,
      offset = 0,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;

    // Get events
    let events = await database.findAll('events', filter);

    // Filter upcoming events
    if (upcoming === 'true') {
      const now = new Date();
      events = events.filter(event => new Date(event.date) > now);
    }

    // Sort events
    events.sort((a, b) => {
      const aValue = new Date(a[sortBy]);
      const bValue = new Date(b[sortBy]);
      if (sortOrder === 'desc') {
        return bValue - aValue;
      }
      return aValue - bValue;
    });

    // Paginate
    const total = events.length;
    const paginatedEvents = events.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Enhance events with additional data
    const enhancedEvents = await Promise.all(
      paginatedEvents.map(async event => {
        const [participantCount, talkCount] = await Promise.all([
          database.count('participants', { eventId: event.id }),
          database.count('talks', { eventId: event.id })
        ]);

        return {
          ...event,
          stats: {
            participantCount,
            talkCount,
            spotsRemaining: Math.max(0, (event.maxTalks || 20) - talkCount)
          }
        };
      })
    );

    res.json({
      events: enhancedEvents,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: 'イベント情報の取得に失敗しました'
    });
  }
});

/**
 * GET /api/events/search
 * Search and filter events with advanced options
 */
router.get(
  '/search',
  [
    query('q').optional().trim().isLength({ max: 200 }).withMessage('Search query too long'),
    query('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled', 'all']),
    query('venue').optional().isIn(['online', 'offline', 'hybrid', 'all']),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('perPage').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['date', 'createdAt', 'title']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database } = req.app.locals;
      const {
        q = '',
        status = 'all',
        venue = 'all',
        dateFrom,
        dateTo,
        page = 1,
        perPage = 10,
        sortBy = 'date',
        sortOrder = 'asc'
      } = req.query;

      // Get all events
      let events = await database.findAll('events');

      // Text search in title and description
      if (q) {
        const searchLower = q.toLowerCase();
        events = events.filter(
          event =>
            event.title.toLowerCase().includes(searchLower) ||
            event.description.toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (status !== 'all') {
        events = events.filter(event => event.status === status);
      }

      // Venue type filter
      if (venue !== 'all') {
        events = events.filter(event => {
          const hasOnline = event.venue?.online || false;
          const hasOffline = event.venue?.address || event.venue?.name;

          switch (venue) {
            case 'online':
              return hasOnline && !hasOffline;
            case 'offline':
              return !hasOnline && hasOffline;
            case 'hybrid':
              return hasOnline && hasOffline;
            default:
              return true;
          }
        });
      }

      // Date range filter
      if (dateFrom || dateTo) {
        events = events.filter(event => {
          const eventDate = new Date(event.date);
          if (dateFrom && eventDate < new Date(dateFrom)) return false;
          if (dateTo && eventDate > new Date(dateTo)) return false;
          return true;
        });
      }

      // Sort events
      events.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
            break;
          default: // 'date'
            aValue = new Date(a.date);
            bValue = new Date(b.date);
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Calculate pagination
      const total = events.length;
      const totalPages = Math.ceil(total / perPage);
      const offset = (page - 1) * perPage;
      const paginatedEvents = events.slice(offset, offset + perPage);

      // Enhance events with stats
      const enhancedEvents = await Promise.all(
        paginatedEvents.map(async event => {
          const [participantCount, talkCount] = await Promise.all([
            database.count('participants', { eventId: event.id }),
            database.count('talks', { eventId: event.id })
          ]);

          return {
            ...event,
            stats: {
              participantCount,
              talkCount,
              spotsRemaining: Math.max(0, (event.maxTalks || 20) - talkCount),
              capacityPercentage: Math.round(
                (participantCount / (event.venue?.capacity || 100)) * 100
              )
            }
          };
        })
      );

      // Generate summary statistics
      const summaryStats = {
        totalEvents: total,
        upcomingEvents: events.filter(e => e.status === 'upcoming').length,
        ongoingEvents: events.filter(e => e.status === 'ongoing').length,
        completedEvents: events.filter(e => e.status === 'completed').length,
        cancelledEvents: events.filter(e => e.status === 'cancelled').length
      };

      res.json({
        events: enhancedEvents,
        pagination: {
          total,
          page,
          perPage,
          totalPages,
          hasMore: page < totalPages
        },
        filters: {
          search: q || null,
          status: status !== 'all' ? status : null,
          venue: venue !== 'all' ? venue : null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null
        },
        sort: {
          by: sortBy,
          order: sortOrder
        },
        summary: summaryStats
      });
    } catch (error) {
      console.error('Error searching events:', error);
      res.status(500).json({
        error: 'Failed to search events',
        message: 'イベント検索中にエラーが発生しました'
      });
    }
  }
);

/**
 * GET /api/events/current
 * Get the current/next upcoming event
 */
router.get('/current', async (req, res) => {
  try {
    const { database } = req.app.locals;

    const currentEvent = await database.getCurrentEvent();

    if (!currentEvent) {
      return res.status(404).json({
        error: 'No current event',
        message: '現在開催予定のイベントはありません'
      });
    }

    // Get event statistics
    const [participantCount, talkCount, analytics] = await Promise.all([
      database.count('participants', { eventId: currentEvent.id }),
      database.count('talks', { eventId: currentEvent.id }),
      database.getEventAnalytics(currentEvent.id)
    ]);

    const enhancedEvent = {
      ...currentEvent,
      stats: {
        participantCount,
        talkCount,
        spotsRemaining: Math.max(0, (currentEvent.maxTalks || 20) - talkCount),
        ...analytics
      }
    };

    res.json({
      event: enhancedEvent
    });
  } catch (error) {
    console.error('Error fetching current event:', error);
    res.status(500).json({
      error: 'Failed to fetch current event',
      message: '現在のイベント情報の取得に失敗しました'
    });
  }
});

/**
 * GET /api/events/:id
 * Get a specific event by ID
 */
router.get(
  '/:id',
  param('id').isLength({ min: 1 }).withMessage('Event ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database } = req.app.locals;
      const { id } = req.params;
      const { includeParticipants = false, includeTalks = false } = req.query;

      const event = await database.findById('events', id);

      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'イベントが見つかりません'
        });
      }

      // Get event statistics
      const [participantCount, talkCount] = await Promise.all([
        database.count('participants', { eventId: id }),
        database.count('talks', { eventId: id })
      ]);

      const enhancedEvent = {
        ...event,
        stats: {
          participantCount,
          talkCount,
          spotsRemaining: Math.max(0, (event.maxTalks || 20) - talkCount)
        }
      };

      // Include participants if requested
      if (includeParticipants === 'true') {
        const participants = await database.findAll('participants', { eventId: id });
        enhancedEvent.participants = participants.map(p => ({
          id: p.id,
          name: p.name,
          participationType: p.participationType,
          status: p.status,
          isSpeaker: p.isSpeaker || false,
          registeredAt: p.createdAt
        }));
      }

      // Include talks if requested
      if (includeTalks === 'true') {
        const talks = await database.findAll('talks', { eventId: id });
        enhancedEvent.talks = talks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          speakerName: t.speakerName,
          duration: t.duration,
          status: t.status,
          submittedAt: t.createdAt
        }));
      }

      res.json({
        event: enhancedEvent
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({
        error: 'Failed to fetch event',
        message: 'イベント情報の取得に失敗しました'
      });
    }
  }
);

/**
 * POST /api/events
 * Create a new event (admin only)
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
    body('date').isISO8601().withMessage('Valid date is required'),
    body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    body('venue.name').trim().isLength({ min: 1, max: 200 }).withMessage('Venue name is required'),
    body('venue.capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Venue capacity must be a positive integer'),
    body('maxTalks')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Max talks must be between 1 and 100'),
    body('talkDuration')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Talk duration must be between 1 and 30 minutes')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database, eventService } = req.app.locals;
      const eventData = req.body;

      // Set defaults
      const newEvent = {
        ...eventData,
        status: eventData.status || 'upcoming',
        registrationOpen: eventData.registrationOpen !== false,
        talkSubmissionOpen: eventData.talkSubmissionOpen !== false,
        maxTalks: eventData.maxTalks || 20,
        talkDuration: eventData.talkDuration || 5,
        venue: {
          name: eventData.venue.name,
          address: eventData.venue.address || '',
          capacity: eventData.venue.capacity || 100,
          online: eventData.venue.online || false,
          onlineUrl: eventData.venue.onlineUrl || ''
        }
      };

      // Validate dates
      const startDate = new Date(newEvent.date);
      const endDate = newEvent.endDate ? new Date(newEvent.endDate) : null;

      if (endDate && endDate <= startDate) {
        return res.status(400).json({
          error: 'Invalid dates',
          message: 'End date must be after start date'
        });
      }

      const event = await database.create('events', newEvent);

      // Track analytics
      await eventService.trackAnalytics(event.id, 'event_created', {
        source: 'admin'
      });

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({
        error: 'Failed to create event',
        message: 'イベントの作成に失敗しました'
      });
    }
  }
);

/**
 * PUT /api/events/:id
 * Update an event (admin only)
 */
router.put(
  '/:id',
  [
    param('id').isLength({ min: 1 }).withMessage('Event ID is required'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ min: 1, max: 2000 }),
    body('date').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']),
    body('registrationOpen').optional().isBoolean(),
    body('talkSubmissionOpen').optional().isBoolean(),
    body('maxTalks').optional().isInt({ min: 1, max: 100 }),
    body('talkDuration').optional().isInt({ min: 1, max: 30 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database, eventService } = req.app.locals;
      const { id } = req.params;
      const updates = req.body;

      // Find existing event
      const event = await database.findById('events', id);
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'イベントが見つかりません'
        });
      }

      // Validate date changes
      if (updates.date || updates.endDate) {
        const startDate = new Date(updates.date || event.date);
        const endDate = updates.endDate
          ? new Date(updates.endDate)
          : event.endDate
            ? new Date(event.endDate)
            : null;

        if (endDate && endDate <= startDate) {
          return res.status(400).json({
            error: 'Invalid dates',
            message: 'End date must be after start date'
          });
        }
      }

      // Update event
      const updatedEvent = await database.update('events', id, updates);

      // Track analytics for status changes
      if (updates.status && updates.status !== event.status) {
        await eventService.trackAnalytics(id, 'event_status_changed', {
          from: event.status,
          to: updates.status
        });
      }

      res.json({
        success: true,
        message: 'Event updated successfully',
        event: updatedEvent
      });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({
        error: 'Failed to update event',
        message: 'イベントの更新に失敗しました'
      });
    }
  }
);

/**
 * DELETE /api/events/:id
 * Delete an event (admin only)
 */
router.delete(
  '/:id',
  param('id').isLength({ min: 1 }).withMessage('Event ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database, eventService } = req.app.locals;
      const { id } = req.params;

      // Find existing event
      const event = await database.findById('events', id);
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'イベントが見つかりません'
        });
      }

      // Check if event has participants
      const participantCount = await database.count('participants', { eventId: id });
      if (participantCount > 0) {
        return res.status(400).json({
          error: 'Cannot delete event with participants',
          message:
            '参加者がいるイベントは削除できません。代わりにキャンセルすることを検討してください。',
          suggestion: 'Consider updating status to "cancelled" instead'
        });
      }

      // Delete related talks first
      const talks = await database.findAll('talks', { eventId: id });
      for (const talk of talks) {
        await database.delete('talks', talk.id);
      }

      // Delete event
      await database.delete('events', id);

      // Track analytics
      await eventService.trackAnalytics(id, 'event_deleted', {
        participantCount,
        talkCount: talks.length
      });

      res.json({
        success: true,
        message: 'Event deleted successfully',
        eventId: id
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({
        error: 'Failed to delete event',
        message: 'イベントの削除に失敗しました'
      });
    }
  }
);

/**
 * GET /api/events/:id/analytics
 * Get event analytics (admin only)
 */
router.get(
  '/:id/analytics',
  param('id').isLength({ min: 1 }).withMessage('Event ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database } = req.app.locals;
      const { id } = req.params;

      // Check if event exists
      const event = await database.findById('events', id);
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'イベントが見つかりません'
        });
      }

      // Get comprehensive analytics
      const analytics = await database.getEventAnalytics(id);

      // Additional analytics
      const participants = await database.findAll('participants', { eventId: id });
      const talks = await database.findAll('talks', { eventId: id });

      const enhancedAnalytics = {
        ...analytics,
        timeline: {
          registrationTrend: analytics.registrationTrend,
          dailyRegistrations: this.getDailyRegistrations(participants),
          peakRegistrationDay: this.getPeakRegistrationDay(participants)
        },
        demographics: {
          participationTypes: analytics.participationTypes,
          speakerRatio: analytics.speakerCount / analytics.participantCount,
          onlineRatio: (analytics.participationTypes.online || 0) / analytics.participantCount
        },
        content: {
          talkCategories: analytics.talkCategories,
          avgTalkRating: analytics.avgRating,
          topCategories: Object.entries(analytics.talkCategories)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
        },
        capacity: {
          currentCapacity: analytics.participantCount / (event.venue?.capacity || 100),
          talkSlotsUsed: analytics.speakerCount / (event.maxTalks || 20),
          remainingSlots: Math.max(0, (event.maxTalks || 20) - analytics.speakerCount)
        },
        generatedAt: new Date().toISOString()
      };

      res.json({
        analytics: enhancedAnalytics,
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          status: event.status
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics',
        message: 'アナリティクスデータの取得に失敗しました'
      });
    }
  }
);

/**
 * POST /api/events/:id/status
 * Update event status with automatic actions
 */
router.post(
  '/:id/status',
  [
    param('id').isLength({ min: 1 }).withMessage('Event ID is required'),
    body('status')
      .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
      .withMessage('Valid status is required'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { database, eventService, emailService } = req.app.locals;
      const { id } = req.params;
      const { status, reason = '' } = req.body;

      // Find existing event
      const event = await database.findById('events', id);
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'イベントが見つかりません'
        });
      }

      // Prevent invalid status transitions
      const validTransitions = {
        upcoming: ['ongoing', 'cancelled'],
        ongoing: ['completed', 'cancelled'],
        completed: [],
        cancelled: []
      };

      if (!validTransitions[event.status].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status transition',
          message: `Cannot change status from ${event.status} to ${status}`
        });
      }

      // Update event status
      const updatedEvent = await database.update('events', id, {
        status,
        statusChangeReason: reason,
        statusChangedAt: new Date().toISOString()
      });

      // Perform status-specific actions
      const participants = await database.findAll('participants', { eventId: id });
      const settings = await database.getSettings();

      switch (status) {
        case 'cancelled':
          // Close registration and talk submission
          await database.update('events', id, {
            registrationOpen: false,
            talkSubmissionOpen: false
          });

          // Notify participants if email is enabled
          if (settings.emailEnabled) {
            for (const participant of participants) {
              try {
                await emailService.sendEventCancellation(participant, event, reason);
              } catch (error) {
                console.error('Failed to send cancellation email:', error);
              }
            }
          }
          break;

        case 'ongoing':
          // Close registration
          await database.update('events', id, {
            registrationOpen: false
          });
          break;

        case 'completed':
          // Close everything and trigger post-event processes
          await database.update('events', id, {
            registrationOpen: false,
            talkSubmissionOpen: false
          });

          // Send feedback request emails
          if (settings.emailEnabled) {
            for (const participant of participants) {
              try {
                await emailService.sendFeedbackRequest(participant, event);
              } catch (error) {
                console.error('Failed to send feedback email:', error);
              }
            }
          }
          break;
      }

      // Track analytics
      await eventService.trackAnalytics(id, 'event_status_changed', {
        from: event.status,
        to: status,
        reason: reason,
        participantCount: participants.length
      });

      res.json({
        success: true,
        message: `Event status updated to ${status}`,
        event: updatedEvent,
        actionsPerformed: {
          emailsSent: settings.emailEnabled ? participants.length : 0,
          registrationClosed: ['cancelled', 'ongoing', 'completed'].includes(status),
          talkSubmissionClosed: ['cancelled', 'completed'].includes(status)
        }
      });
    } catch (error) {
      console.error('Error updating event status:', error);
      res.status(500).json({
        error: 'Failed to update event status',
        message: 'イベントステータスの更新に失敗しました'
      });
    }
  }
);

export default router;
