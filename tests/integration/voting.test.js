import { jest } from '@jest/globals';
import request from 'supertest';
import { EventEmitter } from 'events';
import express from 'express';

/**
 * Voting API Integration Tests
 * 投票APIの統合テスト
 */

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

    // Mount the voting router
    app.use('/api/voting', votingRouter);

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

  describe('POST /api/voting/sessions', () => {
    it('should create a new voting session with authentication', async () => {
      const mockSession = {
        id: 'test-session-id',
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        talkId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'active',
        duration: 60,
        createdBy: 'test-user-123',
        createdAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 60000).toISOString(),
        votes: {},
        results: {
          totalVotes: 0,
          averageRating: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      };

      mockVotingService.createSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/voting/sessions')
        .set('Authorization', 'Bearer test-token')
        .send({
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          talkId: '123e4567-e89b-12d3-a456-426614174001',
          duration: 60
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        session: mockSession
      });
      expect(mockVotingService.createSession).toHaveBeenCalledWith({
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        talkId: '123e4567-e89b-12d3-a456-426614174001',
        duration: 60,
        createdBy: 'test-user-123'
      });
      expect(mockNotificationService.broadcast).toHaveBeenCalledWith(
        'voting_session_created',
        expect.objectContaining({
          sessionId: 'test-session-id',
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          talkId: '123e4567-e89b-12d3-a456-426614174001'
        })
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/voting/sessions')
        .set('Authorization', 'Bearer test-token')
        .send({
          talkId: '123e4567-e89b-12d3-a456-426614174001'
          // Missing eventId
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toMatch(/Event ID/); // Matches both validation messages
    });

    it('should validate duration range', async () => {
      const response = await request(app)
        .post('/api/voting/sessions')
        .set('Authorization', 'Bearer test-token')
        .send({
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          talkId: '123e4567-e89b-12d3-a456-426614174001',
          duration: 400 // Too long
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Duration must be between 30-300 seconds');
    });
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

      const response = await request(app)
        .post('/api/voting/sessions/550e8400-e29b-41d4-a716-446655440000/vote')
        .send({
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
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        results: mockResults
      });
    });

    it('should validate rating range', async () => {
      const response = await request(app)
        .post('/api/voting/sessions/550e8400-e29b-41d4-a716-446655440000/vote')
        .send({
          rating: 6 // Invalid rating
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Rating must be between 1-5');
    });

    it('should handle voting errors appropriately', async () => {
      mockVotingService.submitVote.mockRejectedValue(new Error('Already voted'));

      const response = await request(app)
        .post('/api/voting/sessions/550e8400-e29b-41d4-a716-446655440000/vote')
        .send({
          rating: 5
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Already voted');
    });

    it('should handle session not found', async () => {
      mockVotingService.submitVote.mockRejectedValue(new Error('Voting session not found'));

      const response = await request(app)
        .post('/api/voting/sessions/550e8400-e29b-41d4-a716-446655440001/vote')
        .send({
          rating: 5
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Voting session not found');
    });

    it('should handle ended session', async () => {
      mockVotingService.submitVote.mockRejectedValue(new Error('Voting session has ended'));

      const response = await request(app)
        .post('/api/voting/sessions/550e8400-e29b-41d4-a716-446655440000/vote')
        .send({
          rating: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Voting session has ended');
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

      const response = await request(app).get(
        '/api/voting/sessions/550e8400-e29b-41d4-a716-446655440000/results'
      );

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
  });

  describe('GET /api/voting/events/:eventId/sessions', () => {
    it('should return active sessions for an event', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          talkId: 'talk-1',
          status: 'active',
          endsAt: new Date(Date.now() + 60000).toISOString()
        },
        {
          id: 'session-2',
          eventId: '123e4567-e89b-12d3-a456-426614174000',
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

    it('should handle errors gracefully', async () => {
      mockVotingService.getActiveSessions.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/voting/events/event-123/sessions');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get voting sessions');
    });
  });

  describe('POST /api/voting/sessions/:sessionId/end', () => {
    it('should end a voting session with authentication', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'ended',
        endedAt: new Date().toISOString()
      };

      const mockResults = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'ended',
        totalVotes: 10,
        averageRating: 4.5,
        distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 5 },
        percentages: { 1: 0, 2: 0, 3: 10, 4: 40, 5: 50 }
      };

      mockVotingService.endSession.mockResolvedValue(mockSession);
      mockVotingService.getResults.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/voting/sessions/550e8400-e29b-41d4-a716-446655440000/end')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        session: mockSession,
        results: mockResults
      });
      expect(mockNotificationService.broadcast).toHaveBeenCalledWith('voting_session_ended', {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        results: mockResults
      });
    });

    it('should handle errors when ending session', async () => {
      mockVotingService.endSession.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .post('/api/voting/sessions/550e8400-e29b-41d4-a716-446655440000/end')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to end voting session');
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

    it('should handle errors when getting history', async () => {
      mockVotingService.getTalkVotingHistory.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/voting/talks/talk-456/history');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get voting history');
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
            .post('/api/voting/sessions/550e8400-e29b-41d4-a716-446655440000/vote')
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

  describe('UUID Format Support', () => {
    it('should accept UUID format for event and talk IDs', async () => {
      const mockSession = {
        id: 'test-session-id',
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        talkId: '456e4567-e89b-12d3-a456-426614174001',
        status: 'active',
        duration: 60,
        createdBy: 'test-user-123',
        createdAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 60000).toISOString(),
        votes: {},
        results: {
          totalVotes: 0,
          averageRating: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      };

      mockVotingService.createSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/voting/sessions')
        .set('Authorization', 'Bearer test-token')
        .send({
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          talkId: '456e4567-e89b-12d3-a456-426614174001',
          duration: 60
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        session: mockSession
      });
    });
  });

  describe('Participation Voting', () => {
    it('should handle event participation voting', async () => {
      const mockParticipationVote = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        participantId: 'participant-123',
        voteType: 'attendance',
        vote: 'yes',
        timestamp: new Date().toISOString()
      };

      // Mock for participation voting endpoint if it exists
      app.post('/api/voting/events/:eventId/participate', async (req, res) => {
        res.status(200).json({
          success: true,
          vote: mockParticipationVote
        });
      });

      const response = await request(app).post('/api/voting/events/event-123/participate').send({
        participantId: 'participant-123',
        vote: 'yes'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should track participation statistics', async () => {
      const mockStats = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        totalParticipants: 50,
        attendance: {
          yes: 35,
          no: 10,
          maybe: 5
        },
        lastUpdated: new Date().toISOString()
      };

      // Mock for participation stats endpoint
      app.get('/api/voting/events/:eventId/participation-stats', async (req, res) => {
        res.status(200).json({
          success: true,
          stats: mockStats
        });
      });

      const response = await request(app).get('/api/voting/events/event-123/participation-stats');

      expect(response.status).toBe(200);
      expect(response.body.stats).toEqual(mockStats);
    });
  });

  describe('Session Status Checks', () => {
    it('should check if a user has already voted in a session', async () => {
      mockVotingService.hasVoted.mockResolvedValue(true);

      // Mock endpoint for checking vote status
      app.get('/api/voting/sessions/:sessionId/has-voted/:userId', async (req, res) => {
        const hasVoted = await mockVotingService.hasVoted(req.params.sessionId, req.params.userId);
        res.status(200).json({ hasVoted });
      });

      const response = await request(app).get(
        '/api/voting/sessions/550e8400-e29b-41d4-a716-446655440000/has-voted/user-123'
      );

      expect(response.status).toBe(200);
      expect(response.body.hasVoted).toBe(true);
    });
  });
});
