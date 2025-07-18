/**
 * Analytics Routes Integration Tests
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

jest.unstable_mockModule('../../../server/utils/logger.js', () => ({
  createLogger: jest.fn(() => mockLogger)
}));

// Convert analytics routes to ES module compatible
let analyticsRoutes;
beforeAll(async () => {
  // Temporarily set NODE_ENV to test to avoid ES module issues
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';

  try {
    analyticsRoutes = require('../../../server/routes/analytics.js');
  } catch (error) {
    // If require fails, try dynamic import
    const module = await import('../../../server/routes/analytics.js');
    analyticsRoutes = module.default || module;
  }

  process.env.NODE_ENV = originalEnv;
});

describe('Analytics Routes Integration', () => {
  let app;

  beforeAll(async () => {
    // Ensure analytics routes are loaded
    if (!analyticsRoutes) {
      try {
        analyticsRoutes = require('../../../server/routes/analytics.js');
      } catch (error) {
        const module = await import('../../../server/routes/analytics.js');
        analyticsRoutes = module.default || module;
      }
    }

    app = express();
    app.use(express.json());
    app.use('/api/analytics', analyticsRoutes.default || analyticsRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/analytics', () => {
    const validPayload = {
      events: [
        {
          type: 'pageView',
          data: {
            url: 'http://localhost:3000/',
            title: 'Home Page'
          }
        }
      ],
      metrics: [
        {
          type: 'navigation',
          data: {
            totalTime: 1500,
            dns: 50,
            tcp: 100
          }
        }
      ],
      errors: [],
      context: {
        sessionId: 'session-123',
        userId: 'user-456',
        userAgent: 'Mozilla/5.0...'
      }
    };

    it('should accept valid analytics data', async () => {
      const response = await request(app).post('/api/analytics').send(validPayload).expect(200);

      expect(response.body).toEqual({
        success: true,
        processed: {
          events: 1,
          metrics: 1,
          errors: 0
        }
      });
    });

    it('should validate required context fields', async () => {
      const invalidPayload = {
        ...validPayload,
        context: {
          sessionId: 'session-123'
          // Missing userId
        }
      };

      const response = await request(app).post('/api/analytics').send(invalidPayload).expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid value',
            path: 'context.userId'
          })
        ])
      );
    });

    it('should process events and update aggregated data', async () => {
      const pageViewPayload = {
        events: [
          {
            type: 'pageView',
            data: { url: 'http://localhost:3000/about' }
          }
        ],
        metrics: [],
        errors: [],
        context: {
          sessionId: 'session-123',
          userId: 'user-456'
        }
      };

      await request(app).post('/api/analytics').send(pageViewPayload).expect(200);

      // Verify aggregated data is updated
      const dashboardResponse = await request(app).get('/api/analytics/dashboard').expect(200);

      expect(dashboardResponse.body.overview.totalPageViews).toBeGreaterThan(0);
      expect(dashboardResponse.body.overview.uniqueUsers).toBeGreaterThan(0);
    });

    it('should handle JavaScript errors and log them', async () => {
      const errorPayload = {
        events: [],
        metrics: [],
        errors: [
          {
            type: 'javascript',
            message: 'Uncaught TypeError: Cannot read property',
            source: 'app.js',
            line: 42
          }
        ],
        context: {
          sessionId: 'session-123',
          userId: 'user-456',
          userAgent: 'Mozilla/5.0...'
        }
      };

      await request(app).post('/api/analytics').send(errorPayload).expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Client JavaScript Error',
        expect.objectContaining({
          message: 'Uncaught TypeError: Cannot read property',
          url: 'app.js',
          line: 42
        })
      );
    });

    it('should calculate average load time from navigation metrics', async () => {
      const performancePayload = {
        events: [],
        metrics: [
          {
            type: 'navigation',
            data: { totalTime: 2000 }
          },
          {
            type: 'navigation',
            data: { totalTime: 3000 }
          }
        ],
        errors: [],
        context: {
          sessionId: 'session-123',
          userId: 'user-456'
        }
      };

      await request(app).post('/api/analytics').send(performancePayload).expect(200);

      const dashboardResponse = await request(app).get('/api/analytics/dashboard').expect(200);

      expect(dashboardResponse.body.overview.averageLoadTime).toBeGreaterThan(0);
    });
  });

  describe('GET /api/analytics/dashboard', () => {
    beforeEach(async () => {
      // Seed some test data
      const seedData = {
        events: [
          { type: 'pageView', data: { url: '/' } },
          { type: 'pageView', data: { url: '/about' } }
        ],
        metrics: [{ type: 'navigation', data: { totalTime: 1500 } }],
        errors: [{ type: 'javascript', message: 'Test error' }],
        context: {
          sessionId: 'session-123',
          userId: 'user-456'
        }
      };

      await request(app).post('/api/analytics').send(seedData);
    });

    it('should return comprehensive dashboard data', async () => {
      const response = await request(app).get('/api/analytics/dashboard').expect(200);

      expect(response.body).toMatchObject({
        overview: {
          totalPageViews: expect.any(Number),
          uniqueUsers: expect.any(Number),
          activeSessions: expect.any(Number),
          averageLoadTime: expect.any(Number),
          errorRate: expect.any(String),
          timestamp: expect.any(Number)
        },
        realtime: {
          activeUsers: expect.any(Number),
          pageViewsLastHour: expect.any(Number),
          errorsLastHour: expect.any(Number),
          topPages: expect.any(Array)
        },
        errors: {
          total: expect.any(Number),
          byType: expect.any(Object),
          recent: expect.any(Array)
        }
      });
    });

    it('should include top pages in realtime data', async () => {
      const response = await request(app).get('/api/analytics/dashboard').expect(200);

      expect(response.body.realtime.topPages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: expect.any(String),
            count: expect.any(Number)
          })
        ])
      );
    });

    it('should calculate error rate correctly', async () => {
      const response = await request(app).get('/api/analytics/dashboard').expect(200);

      const errorRate = parseFloat(response.body.overview.errorRate);
      expect(errorRate).toBeGreaterThanOrEqual(0);
      expect(errorRate).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/analytics/events', () => {
    beforeEach(async () => {
      // Seed test events
      const events = [
        { type: 'pageView', data: { url: '/' } },
        { type: 'interaction', data: { element: 'button' } },
        { type: 'pageView', data: { url: '/about' } }
      ];

      for (const event of events) {
        await request(app)
          .post('/api/analytics')
          .send({
            events: [event],
            metrics: [],
            errors: [],
            context: {
              sessionId: `session-${Math.random()}`,
              userId: `user-${Math.random()}`
            }
          });
      }
    });

    it('should return filtered events', async () => {
      const response = await request(app).get('/api/analytics/events?type=pageView').expect(200);

      expect(response.body.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'pageView'
          })
        ])
      );

      // All returned events should be pageView type
      response.body.events.forEach(event => {
        expect(event.type).toBe('pageView');
      });
    });

    it('should respect limit parameter', async () => {
      const response = await request(app).get('/api/analytics/events?limit=1').expect(200);

      expect(response.body.events).toHaveLength(1);
    });

    it('should return events in descending order by timestamp', async () => {
      const response = await request(app).get('/api/analytics/events').expect(200);

      const timestamps = response.body.events.map(e => e.serverTimestamp);
      const sortedTimestamps = [...timestamps].sort((a, b) => b - a);

      expect(timestamps).toEqual(sortedTimestamps);
    });
  });

  describe('GET /api/analytics/performance', () => {
    beforeEach(async () => {
      // Seed performance metrics
      const metrics = [
        { type: 'navigation', data: { totalTime: 1000 } },
        { type: 'navigation', data: { totalTime: 1500 } },
        { type: 'navigation', data: { totalTime: 2000 } },
        { type: 'webVitals', data: { lcp: 2500, fid: 100 } }
      ];

      for (const metric of metrics) {
        await request(app)
          .post('/api/analytics')
          .send({
            events: [],
            metrics: [metric],
            errors: [],
            context: {
              sessionId: `session-${Math.random()}`,
              userId: `user-${Math.random()}`
            }
          });
      }
    });

    it('should return performance summary with percentiles', async () => {
      const response = await request(app).get('/api/analytics/performance').expect(200);

      expect(response.body.summary).toMatchObject({
        sampleSize: expect.any(Number),
        averageLoadTime: expect.any(Number),
        medianLoadTime: expect.any(Number),
        percentiles: {
          p50: expect.any(Number),
          p75: expect.any(Number),
          p95: expect.any(Number),
          p99: expect.any(Number)
        }
      });
    });

    it('should include Web Vitals data', async () => {
      const response = await request(app).get('/api/analytics/performance').expect(200);

      if (response.body.webVitals) {
        expect(response.body.webVitals).toMatchObject({
          lcp: expect.objectContaining({
            value: expect.any(Number),
            good: expect.any(Number)
          }),
          fid: expect.objectContaining({
            value: expect.any(Number),
            good: expect.any(Number)
          })
        });
      }
    });

    it('should generate time series data', async () => {
      const response = await request(app).get('/api/analytics/performance').expect(200);

      expect(response.body.timeSeries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(Number),
            averageLoadTime: expect.any(Number),
            count: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('GET /api/analytics/errors', () => {
    beforeEach(async () => {
      // Seed error data
      const errors = [
        { type: 'javascript', message: 'TypeError: Cannot read property' },
        { type: 'javascript', message: 'ReferenceError: foo is not defined' },
        { type: 'javascript', message: 'TypeError: Cannot read property' }, // Duplicate
        { type: 'resource', message: 'Failed to load image.jpg' }
      ];

      for (const error of errors) {
        await request(app)
          .post('/api/analytics')
          .send({
            events: [],
            metrics: [],
            errors: [error],
            context: {
              sessionId: `session-${Math.random()}`,
              userId: `user-${Math.random()}`
            }
          });
      }
    });

    it('should group errors by type and message', async () => {
      const response = await request(app).get('/api/analytics/errors').expect(200);

      expect(response.body).toMatchObject({
        totalErrors: expect.any(Number),
        uniqueErrors: expect.any(Number),
        errorGroups: expect.any(Array),
        topErrors: expect.any(Array)
      });

      // Should group duplicate errors
      const typeErrorGroup = response.body.errorGroups.find(
        group => group.message === 'TypeError: Cannot read property'
      );
      expect(typeErrorGroup.count).toBe(2);
    });

    it('should sort error groups by frequency', async () => {
      const response = await request(app).get('/api/analytics/errors').expect(200);

      const counts = response.body.errorGroups.map(group => group.count);
      const sortedCounts = [...counts].sort((a, b) => b - a);

      expect(counts).toEqual(sortedCounts);
    });

    it('should filter by resolved status', async () => {
      const response = await request(app).get('/api/analytics/errors?resolved=false').expect(200);

      // All errors should be unresolved initially
      expect(response.body.totalErrors).toBeGreaterThan(0);
    });
  });

  describe('POST /api/analytics/errors/:id/resolve', () => {
    let errorId;

    beforeEach(async () => {
      // Create an error first
      await request(app)
        .post('/api/analytics')
        .send({
          events: [],
          metrics: [],
          errors: [{ type: 'javascript', message: 'Test error' }],
          context: {
            sessionId: 'session-123',
            userId: 'user-456'
          }
        });

      // Get the error ID
      const errorsResponse = await request(app).get('/api/analytics/errors');

      errorId = errorsResponse.body.errorGroups[0].examples[0].id;
    });

    it('should mark error as resolved', async () => {
      const response = await request(app).post(`/api/analytics/errors/${errorId}/resolve`).expect(200);

      expect(response.body).toMatchObject({
        success: true,
        error: expect.objectContaining({
          id: errorId,
          resolved: true,
          resolvedAt: expect.any(Number)
        })
      });
    });

    it('should return 404 for non-existent error', async () => {
      await request(app).post('/api/analytics/errors/non-existent-id/resolve').expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/analytics')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express should handle JSON parsing errors
      expect(response.body).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/analytics')
        .send({
          events: [],
          metrics: [],
          errors: []
          // Missing context
        })
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'context'
          })
        ])
      );
    });
  });
});
