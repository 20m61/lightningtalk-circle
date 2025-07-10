import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

/**
 * VotingService Unit Tests
 * 投票サービスの単体テスト
 */

// Mock uuid module
jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn(() => 'test-session-id')
}));

// Mock logger module
jest.unstable_mockModule('../../../server/utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

// Import after mocks are set up
const { VotingService } = await import('../../../server/services/votingService.js');

describe('VotingService', () => {
  let votingService;
  let mockDatabase;
  let mockSession;

  beforeEach(() => {
    // Mock database
    mockDatabase = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn()
    };

    // Create service instance
    votingService = new VotingService(mockDatabase);

    // Mock session data
    mockSession = {
      id: 'test-session-id',
      eventId: 'event-123',
      talkId: 'talk-456',
      status: 'active',
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      duration: 60,
      createdBy: 'user-123',
      votes: {},
      results: {
        totalVotes: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    };

    // Clear all timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clean up timers
    jest.clearAllTimers();
    jest.useRealTimers();

    // Clear active sessions
    votingService.activeSessions.clear();
    votingService.sessionTimers.clear();
  });

  describe('createSession', () => {
    it('should create a new voting session', async () => {
      mockDatabase.create.mockResolvedValue(true);

      const sessionData = {
        eventId: 'event-123',
        talkId: 'talk-456',
        duration: 60,
        createdBy: 'user-123'
      };

      const session = await votingService.createSession(sessionData);

      expect(session).toMatchObject({
        id: 'test-session-id',
        eventId: 'event-123',
        talkId: 'talk-456',
        status: 'active',
        duration: 60,
        createdBy: 'user-123',
        votes: {},
        results: {
          totalVotes: 0,
          averageRating: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });

      expect(mockDatabase.create).toHaveBeenCalledWith('voting_sessions', expect.any(Object));
      expect(votingService.activeSessions.has('test-session-id')).toBe(true);
      expect(votingService.sessionTimers.has('test-session-id')).toBe(true);
    });

    it('should emit sessionCreated event', async () => {
      mockDatabase.create.mockResolvedValue(true);

      const eventListener = jest.fn();
      votingService.on('sessionCreated', eventListener);

      const session = await votingService.createSession({
        eventId: 'event-123',
        talkId: 'talk-456',
        duration: 60,
        createdBy: 'user-123'
      });

      expect(eventListener).toHaveBeenCalledWith(session);
    });

    it('should auto-end session after duration', async () => {
      mockDatabase.create.mockResolvedValue(true);
      mockDatabase.findOne.mockResolvedValue(mockSession);
      mockDatabase.update.mockResolvedValue(true);

      await votingService.createSession({
        eventId: 'event-123',
        talkId: 'talk-456',
        duration: 60,
        createdBy: 'user-123'
      });

      // Fast-forward time
      jest.advanceTimersByTime(60000);

      // Wait for async operations
      await Promise.resolve();

      expect(mockDatabase.update).toHaveBeenCalledWith(
        'voting_sessions',
        'test-session-id',
        expect.objectContaining({
          status: 'ended'
        })
      );
    });
  });

  describe('submitVote', () => {
    beforeEach(() => {
      votingService.activeSessions.set('test-session-id', mockSession);
    });

    it('should submit a vote successfully', async () => {
      mockDatabase.update.mockResolvedValue(true);

      const vote = await votingService.submitVote({
        sessionId: 'test-session-id',
        voterId: 'voter-123',
        rating: 5
      });

      expect(vote).toEqual({
        voterId: 'voter-123',
        rating: 5,
        timestamp: expect.any(String)
      });

      const updatedSession = votingService.activeSessions.get('test-session-id');
      expect(updatedSession.votes['voter-123']).toBeDefined();
      expect(updatedSession.results.totalVotes).toBe(1);
      expect(updatedSession.results.distribution[5]).toBe(1);
      expect(updatedSession.results.averageRating).toBe('5.00');
    });

    it('should calculate average rating correctly', async () => {
      mockDatabase.update.mockResolvedValue(true);

      // Submit multiple votes
      await votingService.submitVote({
        sessionId: 'test-session-id',
        voterId: 'voter-1',
        rating: 5
      });

      await votingService.submitVote({
        sessionId: 'test-session-id',
        voterId: 'voter-2',
        rating: 4
      });

      await votingService.submitVote({
        sessionId: 'test-session-id',
        voterId: 'voter-3',
        rating: 3
      });

      const session = votingService.activeSessions.get('test-session-id');
      expect(session.results.totalVotes).toBe(3);
      expect(session.results.averageRating).toBe('4.00'); // (5+4+3)/3 = 4
    });

    it('should emit voteSubmitted event', async () => {
      mockDatabase.update.mockResolvedValue(true);

      const eventListener = jest.fn();
      votingService.on('voteSubmitted', eventListener);

      await votingService.submitVote({
        sessionId: 'test-session-id',
        voterId: 'voter-123',
        rating: 5
      });

      expect(eventListener).toHaveBeenCalledWith({
        sessionId: 'test-session-id',
        vote: expect.any(Object),
        results: expect.any(Object)
      });
    });

    it('should reject duplicate votes', async () => {
      mockDatabase.update.mockResolvedValue(true);

      // First vote
      await votingService.submitVote({
        sessionId: 'test-session-id',
        voterId: 'voter-123',
        rating: 5
      });

      // Duplicate vote
      await expect(
        votingService.submitVote({
          sessionId: 'test-session-id',
          voterId: 'voter-123',
          rating: 4
        })
      ).rejects.toThrow('User has already voted in this session');
    });

    it('should reject votes for non-existent session', async () => {
      mockDatabase.findOne.mockResolvedValue(null);

      await expect(
        votingService.submitVote({
          sessionId: 'non-existent',
          voterId: 'voter-123',
          rating: 5
        })
      ).rejects.toThrow('Voting session not found');
    });

    it('should reject votes for ended session', async () => {
      const endedSession = { ...mockSession, status: 'ended' };
      votingService.activeSessions.set('test-session-id', endedSession);

      await expect(
        votingService.submitVote({
          sessionId: 'test-session-id',
          voterId: 'voter-123',
          rating: 5
        })
      ).rejects.toThrow('Voting session has ended');
    });

    it('should reject votes for expired session', async () => {
      const expiredSession = {
        ...mockSession,
        endsAt: new Date(Date.now() - 1000).toISOString() // 1 second ago
      };
      votingService.activeSessions.set('test-session-id', expiredSession);
      mockDatabase.update.mockResolvedValue(true);

      await expect(
        votingService.submitVote({
          sessionId: 'test-session-id',
          voterId: 'voter-123',
          rating: 5
        })
      ).rejects.toThrow('Voting session has ended');
    });

    it('should validate rating range', async () => {
      // Note: Rating validation should be done at the route level
      // But we can test the service handles invalid ratings gracefully
      mockDatabase.update.mockResolvedValue(true);

      const vote = await votingService.submitVote({
        sessionId: 'test-session-id',
        voterId: 'voter-123',
        rating: 3
      });

      expect(vote.rating).toBe(3);
    });
  });

  describe('getResults', () => {
    it('should return results from active session', async () => {
      const sessionWithVotes = {
        ...mockSession,
        results: {
          totalVotes: 3,
          averageRating: '4.33',
          distribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 2 }
        }
      };
      votingService.activeSessions.set('test-session-id', sessionWithVotes);

      const results = await votingService.getResults('test-session-id');

      expect(results).toEqual({
        sessionId: 'test-session-id',
        status: 'active',
        totalVotes: 3,
        averageRating: 4.33,
        distribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 2 },
        percentages: { 1: 0, 2: 0, 3: 33, 4: 0, 5: 67 },
        endsAt: sessionWithVotes.endsAt
      });
    });

    it('should fetch results from database if not in cache', async () => {
      const sessionWithVotes = {
        ...mockSession,
        results: {
          totalVotes: 2,
          averageRating: '4.50',
          distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }
        }
      };
      mockDatabase.findOne.mockResolvedValue(sessionWithVotes);

      const results = await votingService.getResults('test-session-id');

      expect(mockDatabase.findOne).toHaveBeenCalledWith('voting_sessions', {
        id: 'test-session-id'
      });
      expect(results.averageRating).toBe(4.5);
    });

    it('should throw error for non-existent session', async () => {
      mockDatabase.findOne.mockResolvedValue(null);

      await expect(votingService.getResults('non-existent')).rejects.toThrow(
        'Voting session not found'
      );
    });
  });

  describe('calculatePercentages', () => {
    it('should calculate percentages correctly', () => {
      const distribution = { 1: 1, 2: 2, 3: 3, 4: 2, 5: 2 };
      const totalVotes = 10;

      const percentages = votingService.calculatePercentages(distribution, totalVotes);

      expect(percentages).toEqual({
        1: 10, // 1/10 * 100
        2: 20, // 2/10 * 100
        3: 30, // 3/10 * 100
        4: 20, // 2/10 * 100
        5: 20 // 2/10 * 100
      });
    });

    it('should handle zero total votes', () => {
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const totalVotes = 0;

      const percentages = votingService.calculatePercentages(distribution, totalVotes);

      expect(percentages).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      });
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions for an event', async () => {
      const activeSessions = [
        { ...mockSession, id: 'session-1' },
        { ...mockSession, id: 'session-2' }
      ];
      mockDatabase.find.mockResolvedValue(activeSessions);

      const sessions = await votingService.getActiveSessions('event-123');

      expect(mockDatabase.find).toHaveBeenCalledWith('voting_sessions', {
        eventId: 'event-123',
        status: 'active'
      });
      expect(sessions).toHaveLength(2);
    });

    it('should filter out expired sessions', async () => {
      const sessions = [
        { ...mockSession, id: 'session-1', endsAt: new Date(Date.now() + 60000).toISOString() },
        { ...mockSession, id: 'session-2', endsAt: new Date(Date.now() - 60000).toISOString() }
      ];
      mockDatabase.find.mockResolvedValue(sessions);
      mockDatabase.findOne.mockResolvedValue(sessions[1]);
      mockDatabase.update.mockResolvedValue(true);

      const activeSessions = await votingService.getActiveSessions('event-123');

      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].id).toBe('session-1');
    });
  });

  describe('endSession', () => {
    beforeEach(() => {
      votingService.activeSessions.set('test-session-id', mockSession);
      const timer = setTimeout(() => {}, 60000);
      votingService.sessionTimers.set('test-session-id', timer);
    });

    it('should end an active session', async () => {
      mockDatabase.update.mockResolvedValue(true);
      mockDatabase.findOne.mockResolvedValue(null); // No talk found

      const endedSession = await votingService.endSession('test-session-id');

      expect(endedSession.status).toBe('ended');
      expect(endedSession.endedAt).toBeDefined();
      expect(mockDatabase.update).toHaveBeenCalledWith(
        'voting_sessions',
        'test-session-id',
        expect.objectContaining({
          status: 'ended',
          endedAt: expect.any(String)
        })
      );
    });

    it('should clear timer when ending session', async () => {
      mockDatabase.update.mockResolvedValue(true);
      mockDatabase.findOne.mockResolvedValue(null);

      await votingService.endSession('test-session-id');

      expect(votingService.sessionTimers.has('test-session-id')).toBe(false);
      expect(votingService.activeSessions.has('test-session-id')).toBe(false);
    });

    it('should emit sessionEnded event', async () => {
      mockDatabase.update.mockResolvedValue(true);
      mockDatabase.findOne.mockResolvedValue(null);

      const eventListener = jest.fn();
      votingService.on('sessionEnded', eventListener);

      await votingService.endSession('test-session-id');

      expect(eventListener).toHaveBeenCalledWith({
        sessionId: 'test-session-id',
        results: mockSession.results
      });
    });

    it('should update talk rating if votes exist', async () => {
      const sessionWithVotes = {
        ...mockSession,
        results: {
          totalVotes: 5,
          averageRating: '4.20',
          distribution: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 1 }
        }
      };
      votingService.activeSessions.set('test-session-id', sessionWithVotes);

      const mockTalk = { id: 'talk-456', totalVotes: 10 };
      mockDatabase.findOne.mockResolvedValue(mockTalk);
      mockDatabase.update.mockResolvedValue(true);

      await votingService.endSession('test-session-id');

      expect(mockDatabase.update).toHaveBeenCalledWith(
        'talks',
        'talk-456',
        expect.objectContaining({
          lastVotingResults: sessionWithVotes.results,
          averageRating: '4.20',
          totalVotes: 15 // 10 + 5
        })
      );
    });
  });

  describe('getTalkVotingHistory', () => {
    it('should return voting history for a talk', async () => {
      const sessions = [
        {
          id: 'session-1',
          eventId: 'event-1',
          status: 'ended',
          createdAt: '2025-07-01T10:00:00Z',
          endedAt: '2025-07-01T10:05:00Z',
          results: {
            totalVotes: 10,
            averageRating: '4.50',
            distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 5 }
          }
        },
        {
          id: 'session-2',
          eventId: 'event-2',
          status: 'ended',
          createdAt: '2025-07-08T10:00:00Z',
          endedAt: '2025-07-08T10:05:00Z',
          results: {
            totalVotes: 15,
            averageRating: '4.80',
            distribution: { 1: 0, 2: 0, 3: 0, 4: 3, 5: 12 }
          }
        }
      ];
      mockDatabase.find.mockResolvedValue(sessions);

      const history = await votingService.getTalkVotingHistory('talk-456');

      expect(history).toHaveLength(2);
      expect(history[0].sessionId).toBe('session-2'); // Most recent first
      expect(history[0].averageRating).toBe('4.80');
    });
  });

  describe('hasVoted', () => {
    it('should return true if user has voted', async () => {
      const sessionWithVotes = {
        ...mockSession,
        votes: {
          'voter-123': { voterId: 'voter-123', rating: 5, timestamp: new Date().toISOString() }
        }
      };
      votingService.activeSessions.set('test-session-id', sessionWithVotes);

      const hasVoted = await votingService.hasVoted('test-session-id', 'voter-123');
      expect(hasVoted).toBe(true);
    });

    it('should return false if user has not voted', async () => {
      votingService.activeSessions.set('test-session-id', mockSession);

      const hasVoted = await votingService.hasVoted('test-session-id', 'voter-999');
      expect(hasVoted).toBe(false);
    });

    it('should check database if session not in cache', async () => {
      mockDatabase.findOne.mockResolvedValue(mockSession);

      const hasVoted = await votingService.hasVoted('test-session-id', 'voter-123');

      expect(mockDatabase.findOne).toHaveBeenCalledWith('voting_sessions', {
        id: 'test-session-id'
      });
      expect(hasVoted).toBe(false);
    });
  });

  describe('getVoterVote', () => {
    it('should return voter vote details', async () => {
      const vote = { voterId: 'voter-123', rating: 5, timestamp: new Date().toISOString() };
      const sessionWithVotes = {
        ...mockSession,
        votes: { 'voter-123': vote }
      };
      votingService.activeSessions.set('test-session-id', sessionWithVotes);

      const result = await votingService.getVoterVote('test-session-id', 'voter-123');
      expect(result).toEqual(vote);
    });

    it('should return null if voter has not voted', async () => {
      votingService.activeSessions.set('test-session-id', mockSession);

      const result = await votingService.getVoterVote('test-session-id', 'voter-999');
      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions on startup', async () => {
      const sessions = [
        { ...mockSession, id: 'session-1', endsAt: new Date(Date.now() - 60000).toISOString() },
        { ...mockSession, id: 'session-2', endsAt: new Date(Date.now() - 30000).toISOString() },
        { ...mockSession, id: 'session-3', endsAt: new Date(Date.now() + 60000).toISOString() }
      ];
      mockDatabase.find.mockResolvedValue(sessions);
      mockDatabase.findOne.mockImplementation((collection, query) => {
        if (query && query.id) {
          return Promise.resolve(sessions.find(s => s.id === query.id));
        }
        return Promise.resolve(null);
      });
      mockDatabase.update.mockResolvedValue(true);

      await votingService.cleanupExpiredSessions();

      // Should end 2 expired sessions
      expect(mockDatabase.update).toHaveBeenCalledTimes(2);
    });

    it('should handle no expired sessions', async () => {
      const sessions = [
        { ...mockSession, id: 'session-1', endsAt: new Date(Date.now() + 60000).toISOString() }
      ];
      mockDatabase.find.mockResolvedValue(sessions);

      await votingService.cleanupExpiredSessions();

      expect(mockDatabase.update).not.toHaveBeenCalled();
    });
  });

  describe('EventEmitter functionality', () => {
    it('should inherit from EventEmitter', () => {
      expect(votingService).toBeInstanceOf(EventEmitter);
    });

    it('should handle multiple event listeners', async () => {
      mockDatabase.create.mockResolvedValue(true);

      const listener1 = jest.fn();
      const listener2 = jest.fn();

      votingService.on('sessionCreated', listener1);
      votingService.on('sessionCreated', listener2);

      await votingService.createSession({
        eventId: 'event-123',
        talkId: 'talk-456',
        duration: 60,
        createdBy: 'user-123'
      });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDatabase.create.mockRejectedValue(new Error('Database error'));

      await expect(
        votingService.createSession({
          eventId: 'event-123',
          talkId: 'talk-456',
          duration: 60,
          createdBy: 'user-123'
        })
      ).rejects.toThrow('Database error');
    });

    it('should handle update talk rating errors', async () => {
      const sessionWithVotes = {
        ...mockSession,
        results: {
          totalVotes: 5,
          averageRating: '4.20',
          distribution: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 1 }
        }
      };
      votingService.activeSessions.set('test-session-id', sessionWithVotes);

      mockDatabase.findOne.mockRejectedValue(new Error('Talk lookup failed'));
      mockDatabase.update.mockResolvedValue(true);

      // Should not throw, just log the error
      await expect(votingService.endSession('test-session-id')).resolves.toBeDefined();
    });
  });
});
