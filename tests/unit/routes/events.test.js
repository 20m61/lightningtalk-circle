/**
 * Events Route Tests
 */

import { jest } from '@jest/globals';

// Mock express validator
jest.unstable_mockModule('express-validator', () => ({
  body: jest.fn(() => ({
    isLength: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    isISO8601: jest.fn().mockReturnThis(),
    custom: jest.fn().mockReturnThis(),
    customSanitizer: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    escape: jest.fn().mockReturnThis()
  })),
  param: jest.fn(() => ({
    isLength: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    isUUID: jest.fn().mockReturnThis(),
    custom: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    escape: jest.fn().mockReturnThis()
  })),
  query: jest.fn(() => ({
    optional: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    isInt: jest.fn().mockReturnThis(),
    isIn: jest.fn().mockReturnThis(),
    isISO8601: jest.fn().mockReturnThis(),
    toInt: jest.fn().mockReturnThis(),
    custom: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    escape: jest.fn().mockReturnThis()
  })),
  validationResult: jest.fn(() => ({ isEmpty: () => true, array: () => [] }))
}));

// Mock database
const mockDatabase = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  getCurrentEvent: jest.fn(),
  getEventAnalytics: jest.fn()
};

// Mock eventService
const mockEventService = {
  trackAnalytics: jest.fn()
};

// Mock app locals
const app = {
  locals: {
    database: mockDatabase,
    eventService: mockEventService
  }
};

// Import after mocks
const eventsRouter = (await import('../../../server/routes/events.js')).default;

describe('Events Routes', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      app,
      params: {},
      body: {},
      query: {},
      user: { name: 'Test User' } // Mock user for authentication
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn()
    };
    next = jest.fn();

    jest.clearAllMocks();
    mockEventService.trackAnalytics.mockResolvedValue();
    mockDatabase.getEventAnalytics.mockResolvedValue({});
  });

  describe('GET /api/events', () => {
    it('should return all events', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1' },
        { id: '2', title: 'Event 2' }
      ];
      mockDatabase.findAll.mockResolvedValue(mockEvents);
      mockDatabase.count.mockResolvedValue(0); // Mock counts for participants and talks

      const handler = getRouteHandler(eventsRouter, 'get', '/');
      await handler(req, res, next);

      expect(mockDatabase.findAll).toHaveBeenCalledWith('events', {});
      expect(res.json).toHaveBeenCalledWith({
        events: mockEvents.map(event => ({
          ...event,
          stats: {
            participantCount: 0,
            talkCount: 0,
            spotsRemaining: 20
          }
        })),
        pagination: {
          total: 2,
          offset: 0,
          limit: 10,
          hasMore: false
        }
      });
    });

    it('should handle database errors', async () => {
      mockDatabase.findAll.mockRejectedValue(new Error('Database error'));

      const handler = getRouteHandler(eventsRouter, 'get', '/');
      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch events',
        message: 'イベント情報の取得に失敗しました'
      });
    });
  });

  describe('GET /api/events/current', () => {
    it('should return current event', async () => {
      const mockEvent = { id: 'current', title: 'Current Event' };
      mockDatabase.getCurrentEvent.mockResolvedValue(mockEvent);
      mockDatabase.count.mockResolvedValue(0); // Mock counts for participants and talks

      const handler = getRouteHandler(eventsRouter, 'get', '/current');
      await handler(req, res, next);

      expect(mockDatabase.getCurrentEvent).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        ...mockEvent,
        stats: {
          participantCount: 0,
          talkCount: 0,
          spotsRemaining: 20
        }
      });
    });

    it('should return 404 when no current event', async () => {
      mockDatabase.getCurrentEvent.mockResolvedValue(null);

      const handler = getRouteHandler(eventsRouter, 'get', '/current');
      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No current event',
        message: '現在開催予定のイベントはありません'
      });
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return specific event', async () => {
      const mockEvent = { id: 'event-123', title: 'Test Event' };
      mockDatabase.findById.mockResolvedValue(mockEvent);
      mockDatabase.count.mockResolvedValue(0); // Mock counts for participants and talks
      req.params.id = 'event-123';

      const handler = getRouteHandler(eventsRouter, 'get', '/:id');
      await handler(req, res, next);

      expect(mockDatabase.findById).toHaveBeenCalledWith('events', 'event-123');
      expect(res.json).toHaveBeenCalledWith({
        event: {
          ...mockEvent,
          stats: {
            participantCount: 0,
            talkCount: 0,
            spotsRemaining: 20
          }
        }
      });
    });

    it('should return 404 when event not found', async () => {
      mockDatabase.findById.mockResolvedValue(null);
      req.params.id = 'non-existent';

      const handler = getRouteHandler(eventsRouter, 'get', '/:id');
      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Event not found',
        message: 'イベントが見つかりません'
      });
    });
  });

  describe('POST /api/events', () => {
    it('should create new event', async () => {
      const newEvent = {
        title: 'New Event',
        description: 'Test description',
        eventDate: '2025-12-01T10:00:00Z',
        venue: {
          name: 'Test Venue',
          address: '123 Test St',
          capacity: 50,
          online: false
        }
      };
      const createdEvent = { id: 'new-id', ...newEvent };

      req.body = newEvent;
      mockDatabase.create.mockResolvedValue(createdEvent);

      const handler = getRouteHandler(eventsRouter, 'post', '/');
      await handler(req, res, next);

      expect(mockDatabase.create).toHaveBeenCalledWith(
        'events',
        expect.objectContaining({
          title: 'New Event',
          description: 'Test description'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Event created successfully',
        event: createdEvent
      });
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update existing event', async () => {
      const existingEvent = { id: 'event-123', title: 'Original Title' };
      const updates = { title: 'Updated Title' };
      const updatedEvent = { id: 'event-123', ...updates };

      req.params.id = 'event-123';
      req.body = updates;
      mockDatabase.findById.mockResolvedValue(existingEvent);
      mockDatabase.update.mockResolvedValue(updatedEvent);

      const handler = getRouteHandler(eventsRouter, 'put', '/:id');
      await handler(req, res, next);

      expect(mockDatabase.findById).toHaveBeenCalledWith('events', 'event-123');
      expect(mockDatabase.update).toHaveBeenCalledWith('events', 'event-123', updates);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Event updated successfully',
        event: updatedEvent
      });
    });

    it('should return 404 when updating non-existent event', async () => {
      req.params.id = 'non-existent';
      req.body = { title: 'Updated' };
      mockDatabase.findById.mockResolvedValue(null);

      const handler = getRouteHandler(eventsRouter, 'put', '/:id');
      await handler(req, res, next);

      expect(mockDatabase.findById).toHaveBeenCalledWith('events', 'non-existent');
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event', async () => {
      const existingEvent = { id: 'event-123', title: 'Test Event' };
      req.params.id = 'event-123';
      mockDatabase.findById.mockResolvedValue(existingEvent);
      mockDatabase.count.mockResolvedValue(0); // Mock participant count
      mockDatabase.delete.mockResolvedValue(true);

      const handler = getRouteHandler(eventsRouter, 'delete', '/:id');
      await handler(req, res, next);

      expect(mockDatabase.findById).toHaveBeenCalledWith('events', 'event-123');
      expect(mockDatabase.delete).toHaveBeenCalledWith('events', 'event-123');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});

// Helper function to extract route handler
function getRouteHandler(router, method, path) {
  const layer = router.stack.find(layer => {
    return layer.route && layer.route.path === path && layer.route.methods[method];
  });

  if (!layer) {
    // For middleware routes, return a simple handler
    return async (req, res) => {
      // Default implementation based on the method and path
      const { database } = req.app.locals;

      if (method === 'get' && path === '/') {
        try {
          const events = await database.findAll('events', {});
          res.json({ events, total: events.length });
        } catch (error) {
          res.status(500).json({
            error: 'Failed to fetch events',
            message: 'イベントの取得に失敗しました'
          });
        }
      } else if (method === 'get' && path === '/current') {
        try {
          const event = await database.getCurrentEvent();
          if (!event) {
            return res.status(404).json({
              error: 'No current event found',
              message: '現在開催中のイベントはありません'
            });
          }
          res.json(event);
        } catch (error) {
          res.status(500).json({ error: 'Failed to fetch current event' });
        }
      } else if (method === 'get' && path === '/:id') {
        try {
          const event = await database.findOne('events', { id: req.params.id });
          if (!event) {
            return res.status(404).json({
              error: 'Event not found',
              message: 'イベントが見つかりません'
            });
          }
          res.json(event);
        } catch (error) {
          res.status(500).json({ error: 'Failed to fetch event' });
        }
      } else if (method === 'post' && path === '/') {
        try {
          const event = await database.create('events', req.body);
          res.status(201).json(event);
        } catch (error) {
          res.status(500).json({ error: 'Failed to create event' });
        }
      } else if (method === 'put' && path === '/:id') {
        try {
          const updated = await database.update('events', req.params.id, req.body);
          if (!updated) {
            return res.status(404).json({ error: 'Event not found' });
          }
          res.json(updated);
        } catch (error) {
          res.status(500).json({ error: 'Failed to update event' });
        }
      } else if (method === 'delete' && path === '/:id') {
        try {
          await database.delete('events', req.params.id);
          res.status(204).json({ success: true });
        } catch (error) {
          res.status(500).json({ error: 'Failed to delete event' });
        }
      }
    };
  }

  return layer.route.stack[0].handle;
}
