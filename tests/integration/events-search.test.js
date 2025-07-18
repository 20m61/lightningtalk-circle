/**
 * Event Search Integration Tests
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import eventsRouter from '../../server/routes/events.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock database
  const mockDatabase = {
    findAll: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    getCurrentEvent: jest.fn(),
    getEventAnalytics: jest.fn()
  };

  app.locals.database = mockDatabase;
  app.use('/api/events', eventsRouter);

  return { app, mockDatabase };
};

describe('Event Search Integration', () => {
  let app, mockDatabase;

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    mockDatabase = testSetup.mockDatabase;

    // Default mock implementations
    mockDatabase.findAll.mockResolvedValue([]);
    mockDatabase.count.mockResolvedValue(0);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/events/search', () => {
    test('should return 200 with empty results when no events match', async () => {
      const response = await request(app).get('/api/events/search').query({ q: 'nonexistent' }).expect(200);

      expect(response.body).toHaveProperty('events');
      expect(response.body.events).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.filters.search).toBe('nonexistent');
    });

    test('should search events by text query', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Lightning Talk Circle',
          description: 'Monthly lightning talk event',
          date: '2025-08-01T19:00:00+09:00',
          status: 'upcoming',
          venue: { name: 'Tech Hub', capacity: 100 }
        },
        {
          id: 'event-2',
          title: 'Tech Conference',
          description: 'Annual tech conference with lightning sessions',
          date: '2025-08-15T19:00:00+09:00',
          status: 'upcoming',
          venue: { name: 'Convention Center', capacity: 500 }
        }
      ];

      mockDatabase.findAll.mockResolvedValue(mockEvents);
      mockDatabase.count.mockResolvedValue(0); // For participant/talk counts

      const response = await request(app).get('/api/events/search').query({ q: 'lightning' }).expect(200);

      expect(response.body.events).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.filters.search).toBe('lightning');
    });

    test('should filter by status', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Event 1',
          description: 'Test',
          status: 'upcoming',
          date: '2025-08-01T19:00:00+09:00'
        },
        {
          id: '2',
          title: 'Event 2',
          description: 'Test',
          status: 'ongoing',
          date: '2025-07-15T19:00:00+09:00'
        },
        {
          id: '3',
          title: 'Event 3',
          description: 'Test',
          status: 'completed',
          date: '2025-06-01T19:00:00+09:00'
        }
      ];

      mockDatabase.findAll.mockResolvedValue(mockEvents);

      const response = await request(app).get('/api/events/search').query({ status: 'upcoming' }).expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].status).toBe('upcoming');
      expect(response.body.filters.status).toBe('upcoming');
    });

    test('should filter by venue type', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Online Event',
          description: 'Test',
          date: '2025-08-01T19:00:00+09:00',
          venue: { online: true, onlineUrl: 'https://meet.example.com' }
        },
        {
          id: '2',
          title: 'Offline Event',
          description: 'Test',
          date: '2025-08-01T19:00:00+09:00',
          venue: { name: 'Conference Hall', address: '123 Main St' }
        },
        {
          id: '3',
          title: 'Hybrid Event',
          description: 'Test',
          date: '2025-08-01T19:00:00+09:00',
          venue: {
            online: true,
            onlineUrl: 'https://meet.example.com',
            name: 'Tech Center',
            address: '456 Oak Ave'
          }
        }
      ];

      mockDatabase.findAll.mockResolvedValue(mockEvents);

      // Test online filter
      let response = await request(app).get('/api/events/search').query({ venue: 'online' }).expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].id).toBe('1');

      // Test hybrid filter
      response = await request(app).get('/api/events/search').query({ venue: 'hybrid' }).expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].id).toBe('3');
    });

    test('should filter by date range', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Past Event',
          description: 'Test',
          date: '2025-06-01T19:00:00+09:00'
        },
        {
          id: '2',
          title: 'Current Month Event',
          description: 'Test',
          date: '2025-07-15T19:00:00+09:00'
        },
        {
          id: '3',
          title: 'Future Event',
          description: 'Test',
          date: '2025-08-01T19:00:00+09:00'
        }
      ];

      mockDatabase.findAll.mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/events/search')
        .query({
          dateFrom: '2025-07-01',
          dateTo: '2025-07-31'
        })
        .expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].id).toBe('2');
      expect(response.body.filters.dateFrom).toBe('2025-07-01');
      expect(response.body.filters.dateTo).toBe('2025-07-31');
    });

    test('should handle pagination parameters', async () => {
      const mockEvents = Array.from({ length: 25 }, (_, i) => ({
        id: `event-${i + 1}`,
        title: `Event ${i + 1}`,
        description: 'Test event',
        date: new Date(2025, 7, i + 1).toISOString()
      }));

      mockDatabase.findAll.mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/events/search')
        .query({
          page: 2,
          perPage: 10
        })
        .expect(200);

      expect(response.body.events).toHaveLength(10);
      expect(response.body.events[0].id).toBe('event-11');
      expect(response.body.pagination).toMatchObject({
        total: 25,
        page: 2,
        perPage: 10,
        totalPages: 3,
        hasMore: true
      });
    });

    test('should sort events correctly', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'B Event',
          description: 'Test',
          date: '2025-08-15T19:00:00+09:00',
          createdAt: '2025-01-15T10:00:00+09:00'
        },
        {
          id: '2',
          title: 'A Event',
          description: 'Test',
          date: '2025-08-01T19:00:00+09:00',
          createdAt: '2025-01-20T10:00:00+09:00'
        },
        {
          id: '3',
          title: 'C Event',
          description: 'Test',
          date: '2025-08-30T19:00:00+09:00',
          createdAt: '2025-01-10T10:00:00+09:00'
        }
      ];

      mockDatabase.findAll.mockResolvedValue(mockEvents);

      // Test sort by title
      const response = await request(app)
        .get('/api/events/search')
        .query({
          sortBy: 'title',
          sortOrder: 'asc'
        })
        .expect(200);

      expect(response.body.events[0].title).toBe('A Event');
      expect(response.body.events[1].title).toBe('B Event');
      expect(response.body.events[2].title).toBe('C Event');
      expect(response.body.sort).toMatchObject({
        by: 'title',
        order: 'asc'
      });
    });

    test('should include event statistics', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        description: 'Test',
        date: '2025-08-01T19:00:00+09:00',
        maxTalks: 20,
        venue: { capacity: 100 }
      };

      mockDatabase.findAll.mockResolvedValue([mockEvent]);
      mockDatabase.count
        .mockResolvedValueOnce(45) // participants
        .mockResolvedValueOnce(12); // talks

      const response = await request(app).get('/api/events/search').expect(200);

      expect(response.body.events[0].stats).toMatchObject({
        participantCount: 45,
        talkCount: 12,
        spotsRemaining: 8,
        capacityPercentage: 45
      });
    });

    test('should validate query parameters', async () => {
      // Test invalid date format
      const response = await request(app)
        .get('/api/events/search')
        .query({
          dateFrom: 'invalid-date'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    test('should handle multiple filters simultaneously', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Lightning Talk Online',
          description: 'Online lightning talk session',
          date: '2025-07-20T19:00:00+09:00',
          status: 'upcoming',
          venue: { online: true }
        },
        {
          id: '2',
          title: 'Lightning Talk Offline',
          description: 'Offline lightning talk session',
          date: '2025-07-25T19:00:00+09:00',
          status: 'upcoming',
          venue: { address: '123 Main St' }
        },
        {
          id: '3',
          title: 'Tech Conference',
          description: 'Various tech talks',
          date: '2025-08-10T19:00:00+09:00',
          status: 'upcoming',
          venue: { online: true }
        }
      ];

      mockDatabase.findAll.mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/events/search')
        .query({
          q: 'lightning',
          status: 'upcoming',
          venue: 'online',
          dateFrom: '2025-07-01',
          dateTo: '2025-07-31'
        })
        .expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].id).toBe('1');
    });

    test('should include summary statistics in response', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', description: 'Test', status: 'upcoming', date: '2025-08-01' },
        { id: '2', title: 'Event 2', description: 'Test', status: 'upcoming', date: '2025-08-02' },
        { id: '3', title: 'Event 3', description: 'Test', status: 'ongoing', date: '2025-07-15' },
        { id: '4', title: 'Event 4', description: 'Test', status: 'completed', date: '2025-06-01' },
        { id: '5', title: 'Event 5', description: 'Test', status: 'cancelled', date: '2025-07-10' }
      ];

      mockDatabase.findAll.mockResolvedValue(mockEvents);

      const response = await request(app).get('/api/events/search').expect(200);

      expect(response.body.summary).toMatchObject({
        totalEvents: 5,
        upcomingEvents: 2,
        ongoingEvents: 1,
        completedEvents: 1,
        cancelledEvents: 1
      });
    });

    test('should handle case-insensitive search', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'LIGHTNING TALK SESSION',
          description: 'Join us for talks',
          date: '2025-08-01T19:00:00+09:00'
        },
        {
          id: '2',
          title: 'Tech Conference',
          description: 'Including Lightning Presentations',
          date: '2025-08-15T19:00:00+09:00'
        }
      ];

      mockDatabase.findAll.mockResolvedValue(mockEvents);

      const response = await request(app).get('/api/events/search').query({ q: 'LiGhTnInG' }).expect(200);

      expect(response.body.events).toHaveLength(2);
    });

    test('should handle server errors gracefully', async () => {
      mockDatabase.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/events/search').expect(500);

      expect(response.body.error).toBe('Failed to search events');
      expect(response.body.message).toBe('イベント検索中にエラーが発生しました');
    });
  });
});
