/**
 * Multi-Event Management Integration Tests
 * 複数イベント管理機能の統合テスト
 */

const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../../server/app');
const multiEventService = require('../../server/services/multiEventService');
const { DatabaseService } = require('../../server/services/database');

describe('Multi-Event Management Integration Tests', () => {
  let server;
  let database;

  before(async () => {
    server = app.listen(0);
    database = DatabaseService.getInstance();
    await database.initialize();
  });

  after(async () => {
    await database.close();
    server.close();
  });

  beforeEach(async () => {
    // テストデータのクリア
    await database.query('DELETE FROM events WHERE title LIKE "Test%"');
    await database.query('DELETE FROM participants WHERE name LIKE "Test%"');
    await database.query('DELETE FROM talks WHERE title LIKE "Test%"');
  });

  describe('Batch Event Creation', () => {
    it('should create multiple events successfully', async () => {
      const eventsData = [
        {
          title: 'Test Event 1',
          description: 'First test event',
          date: '2025-12-01T19:00:00Z',
          venue: 'Test Venue 1',
          status: 'upcoming'
        },
        {
          title: 'Test Event 2',
          description: 'Second test event',
          date: '2025-12-02T19:00:00Z',
          venue: 'Test Venue 2',
          status: 'upcoming'
        }
      ];

      const response = await request(app)
        .post('/api/multi-events/create-batch')
        .send({
          events: eventsData,
          options: {
            checkConflicts: false,
            autoResolve: false,
            notifyParticipants: false
          }
        })
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.data.created).to.have.lengthOf(2);
      expect(response.body.data.summary.successfullyCreated).to.equal(2);
      expect(response.body.data.errors).to.have.lengthOf(0);
    });

    it('should handle validation errors in batch creation', async () => {
      const invalidEventsData = [
        {
          // title missing
          description: 'Invalid event',
          date: '2025-12-01T19:00:00Z',
          venue: 'Test Venue'
        }
      ];

      await request(app)
        .post('/api/multi-events/create-batch')
        .send({ events: invalidEventsData })
        .expect(400);
    });

    it('should detect and handle conflicts in batch creation', async () => {
      // 最初にイベントを作成
      await request(app).post('/api/events').send({
        title: 'Existing Event',
        description: 'Already exists',
        date: '2025-12-01T19:00:00Z',
        venue: 'Test Venue',
        status: 'upcoming'
      });

      const conflictingEventsData = [
        {
          title: 'Test Conflicting Event',
          description: 'This should conflict',
          date: '2025-12-01T19:00:00Z', // 同じ日時
          venue: 'Test Venue', // 同じ会場
          status: 'upcoming'
        }
      ];

      const response = await request(app)
        .post('/api/multi-events/create-batch')
        .send({
          events: conflictingEventsData,
          options: {
            checkConflicts: true,
            autoResolve: false
          }
        })
        .expect(201);

      expect(response.body.data.conflicts).to.have.length.greaterThan(0);
    });
  });

  describe('Concurrent Event Management', () => {
    beforeEach(async () => {
      // テスト用の並行イベントを作成
      const testEvents = [
        {
          title: 'Test Concurrent Event 1',
          description: 'First concurrent event',
          date: '2025-12-01T19:00:00Z',
          end_date: '2025-12-01T21:00:00Z',
          venue: 'Venue A',
          status: 'upcoming'
        },
        {
          title: 'Test Concurrent Event 2',
          description: 'Second concurrent event',
          date: '2025-12-01T20:00:00Z',
          end_date: '2025-12-01T22:00:00Z',
          venue: 'Venue B',
          status: 'upcoming'
        }
      ];

      for (const event of testEvents) {
        await request(app).post('/api/events').send(event);
      }
    });

    it('should identify concurrent events', async () => {
      const response = await request(app)
        .get('/api/multi-events/concurrent')
        .query({
          'dateRange.start': '2025-12-01T00:00:00Z',
          'dateRange.end': '2025-12-02T00:00:00Z',
          includeConflicts: true
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.activeEvents).to.be.greaterThan(0);
      expect(response.body.data.managementStatus).to.have.property('healthy');
    });

    it('should provide conflict resolution suggestions', async () => {
      const response = await request(app)
        .get('/api/multi-events/concurrent')
        .query({
          resolveConflicts: true,
          priorityOrder: 'date'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('resolutions');
    });
  });

  describe('Shared Resource Management', () => {
    let eventIds = [];

    beforeEach(async () => {
      // テスト用イベントを作成
      const testEvents = [
        {
          title: 'Test Resource Event 1',
          description: 'First resource test event',
          date: '2025-12-01T19:00:00Z',
          venue: 'Shared Venue',
          status: 'upcoming'
        },
        {
          title: 'Test Resource Event 2',
          description: 'Second resource test event',
          date: '2025-12-01T21:00:00Z',
          venue: 'Shared Venue',
          status: 'upcoming'
        }
      ];

      eventIds = [];
      for (const event of testEvents) {
        const response = await request(app).post('/api/events').send(event);
        eventIds.push(response.body.data.id);
      }
    });

    it('should manage shared resources between events', async () => {
      const response = await request(app)
        .post('/api/multi-events/shared-resources')
        .send({
          eventIds,
          resourceType: 'venue',
          options: {
            allocationStrategy: 'priority',
            autoBalance: false,
            notifyChanges: false
          }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('efficiency');
    });

    it('should handle invalid resource types', async () => {
      await request(app)
        .post('/api/multi-events/shared-resources')
        .send({
          eventIds,
          resourceType: 'invalid-type'
        })
        .expect(400);
    });
  });

  describe('Cross-Event Participant Management', () => {
    beforeEach(async () => {
      // テスト用参加者とイベントを作成
      const event1Response = await request(app).post('/api/events').send({
        title: 'Test Cross Event 1',
        description: 'First cross event',
        date: '2025-12-01T19:00:00Z',
        venue: 'Test Venue',
        status: 'upcoming'
      });

      const event2Response = await request(app).post('/api/events').send({
        title: 'Test Cross Event 2',
        description: 'Second cross event',
        date: '2025-12-02T19:00:00Z',
        venue: 'Test Venue',
        status: 'upcoming'
      });

      // 同じ参加者を両方のイベントに登録
      const participantData = {
        name: 'Test Cross Participant',
        email: 'cross@test.com',
        participation_type: 'online'
      };

      await request(app)
        .post('/api/participants/register')
        .send({
          ...participantData,
          event_id: event1Response.body.data.id
        });

      await request(app)
        .post('/api/participants/register')
        .send({
          ...participantData,
          event_id: event2Response.body.data.id
        });
    });

    it('should analyze cross-event participants', async () => {
      const response = await request(app)
        .get('/api/multi-events/cross-participants')
        .query({
          detectDuplicates: true,
          suggestOptimalEvents: true
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('totalParticipants');
      expect(response.body.data).to.have.property('multiEventParticipants');
      expect(response.body.data).to.have.property('duplicates');
    });

    it('should detect duplicate registrations', async () => {
      const response = await request(app)
        .get('/api/multi-events/cross-participants')
        .query({ detectDuplicates: true })
        .expect(200);

      expect(response.body.data.duplicates).to.have.length.greaterThan(0);
    });
  });

  describe('Combined Analytics', () => {
    let eventIds = [];

    beforeEach(async () => {
      // 統計用テストイベントを作成
      const testEvents = [
        {
          title: 'Test Analytics Event 1',
          description: 'First analytics event',
          date: '2025-11-01T19:00:00Z',
          venue: 'Analytics Venue 1',
          status: 'completed'
        },
        {
          title: 'Test Analytics Event 2',
          description: 'Second analytics event',
          date: '2025-11-15T19:00:00Z',
          venue: 'Analytics Venue 2',
          status: 'completed'
        }
      ];

      eventIds = [];
      for (const event of testEvents) {
        const response = await request(app).post('/api/events').send(event);
        eventIds.push(response.body.data.id);
      }
    });

    it('should generate combined analytics report', async () => {
      const response = await request(app)
        .post('/api/multi-events/combined-analytics')
        .send({
          eventIds,
          options: {
            includeComparisons: true,
            includeTrends: true,
            includeForecasts: false,
            timeGranularity: 'daily'
          }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('combinedStatistics');
      expect(response.body.data).to.have.property('individualAnalytics');
      expect(response.body.data).to.have.property('summary');
      expect(response.body.data.eventIds).to.deep.equal(eventIds);
    });

    it('should handle analytics for single event', async () => {
      const response = await request(app)
        .post('/api/multi-events/combined-analytics')
        .send({
          eventIds: [eventIds[0]],
          options: { includeComparisons: false }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.summary.totalEvents).to.equal(1);
    });
  });

  describe('Conflict Detection', () => {
    it('should check for event conflicts', async () => {
      const eventData = {
        title: 'Test Conflict Event',
        description: 'Event to test conflicts',
        date: '2025-12-01T19:00:00Z',
        venue: 'Conflict Test Venue',
        status: 'upcoming'
      };

      const response = await request(app)
        .post('/api/multi-events/check-conflicts')
        .send({
          eventData,
          options: {
            checkTime: true,
            checkVenue: true,
            checkResources: true
          }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('hasConflicts');
      expect(response.body.data).to.have.property('conflicts');
    });

    it('should handle invalid event data in conflict check', async () => {
      await request(app)
        .post('/api/multi-events/check-conflicts')
        .send({
          eventData: {
            // title missing
            date: '2025-12-01T19:00:00Z'
          }
        })
        .expect(400);
    });
  });

  describe('Optimization Suggestions', () => {
    it('should generate optimization suggestions', async () => {
      const response = await request(app)
        .get('/api/multi-events/optimization-suggestions')
        .query({
          optimizationType: 'all',
          'timeRange.start': '2025-12-01T00:00:00Z',
          'timeRange.end': '2025-12-31T23:59:59Z'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('object');
    });

    it('should handle specific optimization types', async () => {
      const optimizationTypes = ['schedule', 'resources', 'participants'];

      for (const type of optimizationTypes) {
        const response = await request(app)
          .get('/api/multi-events/optimization-suggestions')
          .query({ optimizationType: type })
          .expect(200);

        expect(response.body.success).to.be.true;
      }
    });
  });

  describe('Real-time Dashboard', () => {
    it('should provide dashboard data', async () => {
      const response = await request(app)
        .get('/api/multi-events/dashboard')
        .query({
          includeMetrics: true,
          includeAlerts: true,
          refreshInterval: 60
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('timestamp');
      expect(response.body.data).to.have.property('overview');
      expect(response.body.data.overview).to.have.property('activeEvents');
      expect(response.body.data.overview).to.have.property('concurrentGroups');
      expect(response.body.data.overview).to.have.property('totalConflicts');
    });

    it('should handle dashboard without optional features', async () => {
      const response = await request(app)
        .get('/api/multi-events/dashboard')
        .query({
          includeMetrics: false,
          includeAlerts: false
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.metrics).to.be.null;
      expect(response.body.data.alerts).to.be.null;
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle batch creation of many events efficiently', async () => {
      const manyEvents = Array.from({ length: 20 }, (_, i) => ({
        title: `Test Batch Event ${i + 1}`,
        description: `Batch test event number ${i + 1}`,
        date: new Date(2025, 11, i + 1, 19, 0, 0).toISOString(),
        venue: `Batch Venue ${i + 1}`,
        status: 'upcoming'
      }));

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/multi-events/create-batch')
        .send({
          events: manyEvents,
          options: {
            checkConflicts: false,
            batchSize: 5
          }
        })
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.data.created).to.have.lengthOf(20);
      expect(duration).to.be.lessThan(10000); // 10秒以内
    });

    it('should handle concurrent dashboard requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        request(app).get('/api/multi-events/dashboard').query({ includeMetrics: true })
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // データベース接続を一時的に閉じるシミュレーション
      const originalQuery = database.query;
      database.query = () => {
        throw new Error('Database connection lost');
      };

      const response = await request(app).get('/api/multi-events/concurrent').expect(500);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('失敗');

      // データベース接続を復元
      database.query = originalQuery;
    });

    it('should validate request parameters properly', async () => {
      const invalidRequests = [
        {
          endpoint: '/api/multi-events/create-batch',
          method: 'post',
          data: { events: [] } // 空の配列
        },
        {
          endpoint: '/api/multi-events/shared-resources',
          method: 'post',
          data: { eventIds: ['single-id'] } // 1つしかIDがない
        },
        {
          endpoint: '/api/multi-events/combined-analytics',
          method: 'post',
          data: { eventIds: [] } // 空の配列
        }
      ];

      for (const req of invalidRequests) {
        const response = await request(app)[req.method](req.endpoint).send(req.data).expect(400);

        expect(response.body.success).to.be.false;
        expect(response.body.message).to.include('バリデーションエラー');
      }
    });
  });
});
