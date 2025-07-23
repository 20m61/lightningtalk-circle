import { jest } from '@jest/globals';
import request from 'supertest';
import { EventEmitter } from 'events';
import express from 'express';

/**
 * Voting API Integration Tests
 * 投票APIの統合テスト
 */

// Polyfill for setImmediate if not available
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(callback, 0, ...args);
  };
  global.clearImmediate = id => {
    return clearTimeout(id);
  };
}

// Mock dependencies
jest.unstable_mockModule('../../server/utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

jest.unstable_mockModule('../../server/middleware/auth.js', () => ({
  authenticateToken: (req, res, next) => {
    // Mock authentication for tests
    req.user = { id: 'test-user-123' };
    next();
  },
  requireAdmin: (req, res, next) => {
    req.user = { id: 'test-admin', role: 'admin' };
    next();
  }
}));

// Import voting router after mocks are set up
const { default: votingRouter } = await import('../../server/routes/voting.js');
describe('Voting API Integration Tests', () => {
  let app;
  let mockVotingService;
  let mockNotificationService;

  beforeEach(async () => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());

    // Create mock services
    mockVotingService = new EventEmitter();
    Object.assign(mockVotingService, {
      createSession: jest.fn(),
      submitVote: jest.fn(),
      getResults: jest.fn(),
      closeSession: jest.fn(),
      getSessionDetails: jest.fn(),
      getActiveSessionsForEvent: jest.fn(),
      getSessionHistory: jest.fn(),
      exportResults: jest.fn(),
      validateVote: jest.fn(),
      calculateStatistics: jest.fn()
    });

    mockNotificationService = {
      sendEmail: jest.fn(),
      sendRealtimeUpdate: jest.fn(),
      notifyVoteUpdate: jest.fn()
    };

    // Mount the router
    app.use('/api/voting', votingRouter);

    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should create a new voting session', async () => {
      const sessionData = {
        eventId: 'event-123',
        title: 'Best Lightning Talk',
        options: ['Talk 1', 'Talk 2', 'Talk 3'],
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString()
      };

      mockVotingService.createSession.mockResolvedValue({
        id: 'session-456',
        ...sessionData,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      const response = await request(app).post('/api/voting/sessions').send(sessionData).expect(201);

      expect(response.body).toHaveProperty('id', 'session-456');
      expect(response.body).toHaveProperty('status', 'active');
      expect(mockVotingService.createSession).toHaveBeenCalledWith(sessionData);
    });

    it('should get session details', async () => {
      const sessionDetails = {
        id: 'session-456',
        eventId: 'event-123',
        title: 'Best Lightning Talk',
        options: ['Talk 1', 'Talk 2', 'Talk 3'],
        status: 'active',
        votes: [],
        statistics: {
          totalVotes: 0,
          distribution: {}
        }
      };

      mockVotingService.getSessionDetails.mockResolvedValue(sessionDetails);

      const response = await request(app).get('/api/voting/sessions/session-456').expect(200);

      expect(response.body).toEqual(sessionDetails);
      expect(mockVotingService.getSessionDetails).toHaveBeenCalledWith('session-456');
    });

    it('should close a voting session', async () => {
      mockVotingService.closeSession.mockResolvedValue({
        id: 'session-456',
        status: 'closed',
        closedAt: new Date().toISOString()
      });

      const response = await request(app).post('/api/voting/sessions/session-456/close').expect(200);

      expect(response.body).toHaveProperty('status', 'closed');
      expect(mockVotingService.closeSession).toHaveBeenCalledWith('session-456');
    });
  });

  describe('Vote Submission', () => {
    it('should submit a vote successfully', async () => {
      const voteData = {
        sessionId: 'session-456',
        optionIndex: 1,
        comment: 'Great talk!'
      };

      mockVotingService.submitVote.mockResolvedValue({
        id: 'vote-789',
        ...voteData,
        userId: 'test-user-123',
        timestamp: new Date().toISOString()
      });

      const response = await request(app).post('/api/voting/votes').send(voteData).expect(201);

      expect(response.body).toHaveProperty('id', 'vote-789');
      expect(mockVotingService.submitVote).toHaveBeenCalledWith({
        ...voteData,
        userId: 'test-user-123'
      });
    });

    it('should prevent duplicate votes', async () => {
      const voteData = {
        sessionId: 'session-456',
        optionIndex: 1
      };

      mockVotingService.submitVote.mockRejectedValue(new Error('User has already voted in this session'));

      const response = await request(app).post('/api/voting/votes').send(voteData).expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate vote data', async () => {
      const invalidVoteData = {
        sessionId: 'session-456'
        // Missing optionIndex
      };

      const response = await request(app).post('/api/voting/votes').send(invalidVoteData).expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Results and Statistics', () => {
    it('should get voting results', async () => {
      const results = {
        sessionId: 'session-456',
        totalVotes: 10,
        options: [
          { name: 'Talk 1', votes: 5, percentage: 50 },
          { name: 'Talk 2', votes: 3, percentage: 30 },
          { name: 'Talk 3', votes: 2, percentage: 20 }
        ],
        winner: 'Talk 1'
      };

      mockVotingService.getResults.mockResolvedValue(results);

      const response = await request(app).get('/api/voting/sessions/session-456/results').expect(200);

      expect(response.body).toEqual(results);
      expect(mockVotingService.getResults).toHaveBeenCalledWith('session-456');
    });

    it('should export results in CSV format', async () => {
      const csvData = 'Option,Votes,Percentage\nTalk 1,5,50\nTalk 2,3,30\nTalk 3,2,20';

      mockVotingService.exportResults.mockResolvedValue(csvData);

      const response = await request(app).get('/api/voting/sessions/session-456/export?format=csv').expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toBe(csvData);
    });

    it('should get real-time statistics', async () => {
      const statistics = {
        activeVoters: 5,
        totalVotes: 10,
        votingRate: 0.5,
        timeRemaining: 1800
      };

      mockVotingService.calculateStatistics.mockResolvedValue(statistics);

      const response = await request(app).get('/api/voting/sessions/session-456/statistics').expect(200);

      expect(response.body).toEqual(statistics);
    });
  });

  describe('Event-based Voting', () => {
    it('should get active sessions for an event', async () => {
      const activeSessions = [
        {
          id: 'session-456',
          title: 'Best Lightning Talk',
          status: 'active'
        },
        {
          id: 'session-789',
          title: 'Most Innovative Topic',
          status: 'active'
        }
      ];

      mockVotingService.getActiveSessionsForEvent.mockResolvedValue(activeSessions);

      const response = await request(app).get('/api/voting/events/event-123/sessions').expect(200);

      expect(response.body).toEqual(activeSessions);
      expect(mockVotingService.getActiveSessionsForEvent).toHaveBeenCalledWith('event-123');
    });

    it('should get voting history for an event', async () => {
      const history = [
        {
          id: 'session-123',
          title: 'Previous Vote',
          status: 'closed',
          results: {
            winner: 'Option A',
            totalVotes: 20
          }
        }
      ];

      mockVotingService.getSessionHistory.mockResolvedValue(history);

      const response = await request(app).get('/api/voting/events/event-123/history').expect(200);

      expect(response.body).toEqual(history);
    });
  });

  describe('Real-time Updates', () => {
    it('should emit vote updates via WebSocket', async () => {
      const voteData = {
        sessionId: 'session-456',
        optionIndex: 0
      };

      mockVotingService.submitVote.mockResolvedValue({
        id: 'vote-new',
        ...voteData,
        userId: 'test-user-123'
      });

      // Spy on notification service
      const notifySpy = jest.spyOn(mockNotificationService, 'notifyVoteUpdate');

      await request(app).post('/api/voting/votes').send(voteData).expect(201);

      // Verify real-time notification was triggered
      expect(notifySpy).toHaveBeenCalledWith(
        'session-456',
        expect.objectContaining({
          id: 'vote-new',
          sessionId: 'session-456'
        })
      );
    });
  });

  describe('Validation', () => {
    it('should validate sessionId parameter', async () => {
      const response = await request(app).get('/api/voting/sessions//results'); // Empty session ID

      expect(response.status).toBe(404); // Express would return 404 for invalid route
    });

    it('should validate eventId parameter', async () => {
      const response = await request(app).get('/api/voting/events//sessions'); // Empty event ID

      expect(response.status).toBe(404); // Express would return 404 for invalid route
    });

    it('should validate vote option index', async () => {
      const invalidVote = {
        sessionId: 'session-456',
        optionIndex: -1 // Invalid index
      };

      const response = await request(app).post('/api/voting/votes').send(invalidVote).expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockVotingService.getResults.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/voting/sessions/session-456/results').expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle not found errors', async () => {
      mockVotingService.getSessionDetails.mockResolvedValue(null);

      const response = await request(app).get('/api/voting/sessions/non-existent').expect(404);

      expect(response.body).toHaveProperty('error', 'Session not found');
    });
  });
});
