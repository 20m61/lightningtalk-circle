import { jest } from '@jest/globals';
import request from 'supertest';
import { EventEmitter } from 'events';
import express from 'express';

/**
 * Voting API Integration Tests (Without Auth)
 * 投票APIの統合テスト（認証なし）
 */

// Mock logger module
jest.unstable_mockModule('../../server/utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

// Import voting router after mocks
const votingRouter = (await import('../../server/routes/voting.js')).default;

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
      getActiveSessions: jest.fn(),
      endSession: jest.fn(),
      getTalkVotingHistory: jest.fn(),
      hasVoted: jest.fn(),
      cleanupExpiredSessions: jest.fn().mockResolvedValue(true)
    });

    mockNotificationService = {
      broadcast: jest.fn().mockResolvedValue(true)
    };

    // Set up app locals
    app.locals.votingService = mockVotingService;
    app.locals.notificationService = mockNotificationService;

    // Mount the voting router with custom auth middleware
    app.use(
      '/api/voting',
      (req, res, next) => {
        // Simple auth middleware for testing
        if (req.path === '/sessions' && req.method === 'POST') {
          req.user = { id: 'test-user-123' };
        } else if (req.path.endsWith('/end') && req.method === 'POST') {
          req.user = { id: 'test-user-123' };
        }
        next();
      },
      votingRouter
    );

    // Add error handling
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/voting/sessions/:sessionId/vote', () => {
    it('should submit a vote successfully', async () => {
      const mockVote = {
        voterId: 'voter-123',
        rating: 5,
        timestamp: new Date().toISOString()
      };

      const mockResults = {
        sessionId: 'test-session-id',
        status: 'active',
        totalVotes: 1,
        averageRating: 5.0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
        percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 },
        endsAt: new Date(Date.now() + 60000).toISOString()
      };

      mockVotingService.submitVote.mockResolvedValue(mockVote);
      mockVotingService.getResults.mockResolvedValue(mockResults);

      const response = await request(app).post('/api/voting/sessions/test-session-id/vote').send({
        rating: 5,
        participantId: 'participant-123'
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        vote: mockVote,
        results: mockResults
      });
      expect(mockNotificationService.broadcast).toHaveBeenCalledWith('vote_submitted', {
        sessionId: 'test-session-id',
        results: mockResults
      });
    });

    it('should validate rating range', async () => {
      const response = await request(app).post('/api/voting/sessions/test-session-id/vote').send({
        rating: 6 // Invalid rating
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Rating must be between 1-5');
    });

    it('should handle voting errors appropriately', async () => {
      mockVotingService.submitVote.mockRejectedValue(new Error('Already voted'));

      const response = await request(app).post('/api/voting/sessions/test-session-id/vote').send({
        rating: 5
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Already voted');
    });

    it('should handle session not found', async () => {
      mockVotingService.submitVote.mockRejectedValue(new Error('Voting session not found'));

      const response = await request(app).post('/api/voting/sessions/non-existent/vote').send({
        rating: 5
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Voting session not found');
    });

    it('should handle ended session', async () => {
      mockVotingService.submitVote.mockRejectedValue(new Error('Voting session has ended'));

      const response = await request(app).post('/api/voting/sessions/test-session-id/vote').send({
        rating: 5
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Voting session has ended');
    });

    it('should handle missing rating', async () => {
      const response = await request(app).post('/api/voting/sessions/test-session-id/vote').send({
        // Missing rating
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/voting/sessions/:sessionId/results', () => {
    it('should return voting results', async () => {
      const mockResults = {
        sessionId: 'test-session-id',
        status: 'active',
        totalVotes: 10,
        averageRating: 4.5,
        distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 5 },
        percentages: { 1: 0, 2: 0, 3: 10, 4: 40, 5: 50 },
        endsAt: new Date(Date.now() + 60000).toISOString()
      };

      mockVotingService.getResults.mockResolvedValue(mockResults);

      const response = await request(app).get('/api/voting/sessions/test-session-id/results');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        results: mockResults
      });
    });

    it('should handle session not found', async () => {
      mockVotingService.getResults.mockRejectedValue(new Error('Voting session not found'));

      const response = await request(app).get('/api/voting/sessions/non-existent/results');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Voting session not found');
    });

    it('should handle general errors', async () => {
      mockVotingService.getResults.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/voting/sessions/test-session-id/results');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get voting results');
    });
  });

  describe('GET /api/voting/events/:eventId/sessions', () => {
    it('should return active sessions for an event', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          eventId: 'event-123',
          talkId: 'talk-1',
          status: 'active',
          endsAt: new Date(Date.now() + 60000).toISOString()
        },
        {
          id: 'session-2',
          eventId: 'event-123',
          talkId: 'talk-2',
          status: 'active',
          endsAt: new Date(Date.now() + 120000).toISOString()
        }
      ];

      mockVotingService.getActiveSessions.mockResolvedValue(mockSessions);

      const response = await request(app).get('/api/voting/events/event-123/sessions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        sessions: mockSessions
      });
    });

    it('should handle empty sessions list', async () => {
      mockVotingService.getActiveSessions.mockResolvedValue([]);

      const response = await request(app).get('/api/voting/events/event-123/sessions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        sessions: []
      });
    });

    it('should handle errors gracefully', async () => {
      mockVotingService.getActiveSessions.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/voting/events/event-123/sessions');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get voting sessions');
    });
  });

  describe('GET /api/voting/talks/:talkId/history', () => {
    it('should return voting history for a talk', async () => {
      const mockHistory = [
        {
          sessionId: 'session-1',
          eventId: 'event-1',
          status: 'ended',
          createdAt: '2025-07-01T10:00:00Z',
          endedAt: '2025-07-01T10:05:00Z',
          totalVotes: 10,
          averageRating: '4.50',
          distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 5 }
        },
        {
          sessionId: 'session-2',
          eventId: 'event-2',
          status: 'ended',
          createdAt: '2025-07-08T10:00:00Z',
          endedAt: '2025-07-08T10:05:00Z',
          totalVotes: 15,
          averageRating: '4.80',
          distribution: { 1: 0, 2: 0, 3: 0, 4: 3, 5: 12 }
        }
      ];

      mockVotingService.getTalkVotingHistory.mockResolvedValue(mockHistory);

      const response = await request(app).get('/api/voting/talks/talk-456/history');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        history: mockHistory
      });
    });

    it('should handle empty history', async () => {
      mockVotingService.getTalkVotingHistory.mockResolvedValue([]);

      const response = await request(app).get('/api/voting/talks/talk-456/history');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        history: []
      });
    });

    it('should handle errors when getting history', async () => {
      mockVotingService.getTalkVotingHistory.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/voting/talks/talk-456/history');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get voting history');
    });
  });

  describe('Concurrent requests', () => {
    it('should handle multiple concurrent vote submissions', async () => {
      const mockVote = {
        voterId: 'voter-123',
        rating: 5,
        timestamp: new Date().toISOString()
      };

      const mockResults = {
        sessionId: 'test-session-id',
        status: 'active',
        totalVotes: 1,
        averageRating: 5.0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
        percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 }
      };

      mockVotingService.submitVote.mockResolvedValue(mockVote);
      mockVotingService.getResults.mockResolvedValue(mockResults);

      const requests = Array(5)
        .fill(null)
        .map((_, i) =>
          request(app)
            .post('/api/voting/sessions/test-session-id/vote')
            .send({
              rating: 5,
              participantId: `participant-${i}`
            })
        );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(mockVotingService.submitVote).toHaveBeenCalledTimes(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/voting/sessions/test-session-id/vote')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle very long session IDs', async () => {
      const longSessionId = 'a'.repeat(100);
      mockVotingService.getResults.mockRejectedValue(new Error('Voting session not found'));

      const response = await request(app).get(`/api/voting/sessions/${longSessionId}/results`);

      expect(response.status).toBe(404);
    });

    it('should handle special characters in parameters', async () => {
      const specialTalkId = 'talk-456!@#$%';
      mockVotingService.getTalkVotingHistory.mockResolvedValue([]);

      const response = await request(app).get(
        `/api/voting/talks/${encodeURIComponent(specialTalkId)}/history`
      );

      expect(response.status).toBe(200);
    });
  });
});
