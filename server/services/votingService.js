import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';
import { DatabaseError, ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

const logger = createLogger('voting-service');

/**
 * Real-time Voting Service
 * Manages voting sessions, vote collection, and results calculation
 */
export class VotingService extends EventEmitter {
  constructor(database) {
    super();
    this.database = database;
    this.activeSessions = new Map(); // In-memory cache for active sessions
    this.sessionTimers = new Map(); // Timers for auto-ending sessions
    this.participationVotes = new Map(); // In-memory cache for participation votes
  }

  /**
   * Create a new voting session
   */
  async createSession({ eventId, talkId, duration = 60, createdBy }) {
    const sessionId = uuidv4();
    const now = new Date();
    const endsAt = new Date(now.getTime() + duration * 1000);

    const session = {
      id: sessionId,
      eventId,
      talkId,
      status: 'active',
      createdAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      duration,
      createdBy,
      votes: {},
      results: {
        totalVotes: 0,
        averageRating: 0,
        distribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        }
      }
    };

    // Save to database
    await this.database.create('voting_sessions', session);

    // Cache in memory
    this.activeSessions.set(sessionId, session);

    // Set auto-end timer
    const timer = setTimeout(() => {
      this.endSession(sessionId).catch(error => {
        logger.error(`Failed to auto-end session ${sessionId}:`, error);
      });
    }, duration * 1000);

    this.sessionTimers.set(sessionId, timer);

    this.emit('sessionCreated', session);
    logger.info(`Created voting session ${sessionId} for talk ${talkId}`);

    return session;
  }

  /**
   * Submit a vote to a session
   */
  async submitVote({ sessionId, voterId, rating }) {
    // Get session from cache or database
    let session = this.activeSessions.get(sessionId);
    if (!session) {
      session = await this.database.findOne('voting_sessions', { id: sessionId });
      if (!session) {
        throw new NotFoundError('Voting session');
      }
    }

    // Check if session is active
    if (session.status !== 'active') {
      throw new Error('Voting session has ended');
    }

    // Check if session has expired
    const now = new Date();
    if (new Date(session.endsAt) < now) {
      await this.endSession(sessionId);
      throw new Error('Voting session has ended');
    }

    // Check if user has already voted
    if (session.votes[voterId]) {
      throw new ConflictError('User has already voted in this session');
    }

    // Record vote
    const vote = {
      voterId,
      rating,
      timestamp: now.toISOString()
    };

    session.votes[voterId] = vote;

    // Update results
    session.results.totalVotes++;
    session.results.distribution[rating]++;

    // Recalculate average
    let sum = 0;
    for (let r = 1; r <= 5; r++) {
      sum += r * session.results.distribution[r];
    }
    session.results.averageRating =
      session.results.totalVotes > 0 ? (sum / session.results.totalVotes).toFixed(2) : 0;

    // Update in database
    await this.database.update('voting_sessions', sessionId, {
      votes: session.votes,
      results: session.results
    });

    // Update cache
    this.activeSessions.set(sessionId, session);

    this.emit('voteSubmitted', { sessionId, vote, results: session.results });
    logger.info(`Vote submitted for session ${sessionId}: ${rating} stars`);

    return vote;
  }

  /**
   * Get voting results for a session
   */
  async getResults(sessionId) {
    let session = this.activeSessions.get(sessionId);
    if (!session) {
      session = await this.database.findOne('voting_sessions', { id: sessionId });
      if (!session) {
        throw new NotFoundError('Voting session');
      }
    }

    return {
      sessionId,
      status: session.status,
      totalVotes: session.results.totalVotes,
      averageRating: parseFloat(session.results.averageRating),
      distribution: session.results.distribution,
      percentages: this.calculatePercentages(
        session.results.distribution,
        session.results.totalVotes
      ),
      endsAt: session.endsAt
    };
  }

  /**
   * Calculate percentage distribution
   */
  calculatePercentages(distribution, totalVotes) {
    const percentages = {};
    for (let rating = 1; rating <= 5; rating++) {
      percentages[rating] =
        totalVotes > 0 ? Math.round((distribution[rating] / totalVotes) * 100) : 0;
    }
    return percentages;
  }

  /**
   * Get active voting sessions for an event
   */
  async getActiveSessions(eventId) {
    const sessions = await this.database.find('voting_sessions', {
      eventId,
      status: 'active'
    });

    // Filter out expired sessions
    const now = new Date();
    const activeSessions = sessions.filter(session => {
      if (new Date(session.endsAt) < now) {
        // End expired session
        this.endSession(session.id).catch(error => {
          logger.error(`Failed to end expired session ${session.id}:`, error);
        });
        return false;
      }
      return true;
    });

    return activeSessions;
  }

  /**
   * End a voting session
   */
  async endSession(sessionId) {
    let session = this.activeSessions.get(sessionId);
    if (!session) {
      session = await this.database.findOne('voting_sessions', { id: sessionId });
      if (!session) {
        throw new NotFoundError('Voting session');
      }
    }

    // Update status
    session.status = 'ended';
    session.endedAt = new Date().toISOString();

    // Update database
    await this.database.update('voting_sessions', sessionId, {
      status: session.status,
      endedAt: session.endedAt
    });

    // Clear timer
    const timer = this.sessionTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.sessionTimers.delete(sessionId);
    }

    // Remove from active sessions cache
    this.activeSessions.delete(sessionId);

    // Save final results to talk
    if (session.results.totalVotes > 0) {
      await this.updateTalkRating(session.talkId, session.results);
    }

    this.emit('sessionEnded', { sessionId, results: session.results });
    logger.info(`Ended voting session ${sessionId}`);

    return session;
  }

  /**
   * Update talk rating based on voting results
   */
  async updateTalkRating(talkId, results) {
    try {
      const talk = await this.database.findOne('talks', { id: talkId });
      if (!talk) {
        return;
      }

      // Update talk with voting results
      const updates = {
        lastVotingResults: results,
        averageRating: results.averageRating,
        totalVotes: (talk.totalVotes || 0) + results.totalVotes
      };

      await this.database.update('talks', talkId, updates);
      logger.info(`Updated talk ${talkId} with voting results`);
    } catch (error) {
      logger.error('Failed to update talk rating:', error);
    }
  }

  /**
   * Get voting history for a talk
   */
  async getTalkVotingHistory(talkId) {
    const sessions = await this.database.find('voting_sessions', { talkId });

    // Sort by creation date (newest first)
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return sessions.map(session => ({
      sessionId: session.id,
      eventId: session.eventId,
      status: session.status,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
      totalVotes: session.results.totalVotes,
      averageRating: session.results.averageRating,
      distribution: session.results.distribution
    }));
  }

  /**
   * Check if a voter has already voted in a session
   */
  async hasVoted(sessionId, voterId) {
    let session = this.activeSessions.get(sessionId);
    if (!session) {
      session = await this.database.findOne('voting_sessions', { id: sessionId });
      if (!session) {
        return false;
      }
    }

    return !!session.votes[voterId];
  }

  /**
   * Get voter's vote in a session
   */
  async getVoterVote(sessionId, voterId) {
    let session = this.activeSessions.get(sessionId);
    if (!session) {
      session = await this.database.findOne('voting_sessions', { id: sessionId });
      if (!session) {
        return null;
      }
    }

    return session.votes[voterId] || null;
  }

  /**
   * Clean up expired sessions on startup
   */
  async cleanupExpiredSessions() {
    const activeSessions = await this.database.find('voting_sessions', { status: 'active' });
    const now = new Date();
    let cleaned = 0;

    for (const session of activeSessions) {
      if (new Date(session.endsAt) < now) {
        await this.endSession(session.id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired voting sessions`);
    }
  }

  /**
   * Create a participation vote for an event
   */
  async createParticipationVote({
    eventId,
    participationType,
    participantName,
    participantEmail,
    timestamp
  }) {
    const voteId = uuidv4();
    const vote = {
      id: voteId,
      eventId,
      participationType,
      participantName,
      participantEmail,
      timestamp,
      createdAt: new Date().toISOString()
    };

    try {
      // Store in database
      await this.database.create('participation_votes', vote);

      // Update in-memory cache
      if (!this.participationVotes.has(eventId)) {
        this.participationVotes.set(eventId, {
          online: [],
          onsite: []
        });
      }

      const eventVotes = this.participationVotes.get(eventId);
      eventVotes[participationType].push(vote);

      // Emit event for real-time updates
      this.emit('participationVoteCreated', { eventId, vote });

      logger.info(`Created participation vote for event ${eventId}`);
      return vote;
    } catch (error) {
      logger.error('Failed to create participation vote:', error);
      throw new DatabaseError('Failed to create participation vote');
    }
  }

  /**
   * Get participation vote counts for an event
   */
  async getVoteCounts(eventId) {
    try {
      // Try cache first
      if (this.participationVotes.has(eventId)) {
        const votes = this.participationVotes.get(eventId);
        return {
          online: votes.online,
          onsite: votes.onsite
        };
      }

      // Load from database
      const votes = await this.database.find('participation_votes', { eventId });

      const counts = {
        online: [],
        onsite: []
      };

      votes.forEach(vote => {
        if (vote.participationType === 'online') {
          counts.online.push(vote);
        } else if (vote.participationType === 'onsite') {
          counts.onsite.push(vote);
        }
      });

      // Update cache
      this.participationVotes.set(eventId, counts);

      return counts;
    } catch (error) {
      logger.error('Failed to get vote counts:', error);
      throw new DatabaseError('Failed to get vote counts');
    }
  }

  /**
   * Check if a participant has already voted for an event
   */
  async getParticipantVote(eventId, participantName) {
    try {
      const vote = await this.database.findOne('participation_votes', {
        eventId,
        participantName
      });
      return vote;
    } catch (error) {
      logger.error('Failed to check participant vote:', error);
      return null;
    }
  }

  /**
   * Get all participation votes for admin dashboard
   */
  async getAllParticipationVotes() {
    try {
      const votes = await this.database.find('participation_votes', {});

      // Group by event
      const groupedVotes = {};
      votes.forEach(vote => {
        if (!groupedVotes[vote.eventId]) {
          groupedVotes[vote.eventId] = {
            online: [],
            onsite: [],
            total: 0
          };
        }

        groupedVotes[vote.eventId][vote.participationType].push(vote);
        groupedVotes[vote.eventId].total++;
      });

      return groupedVotes;
    } catch (error) {
      logger.error('Failed to get all participation votes:', error);
      throw new DatabaseError('Failed to get participation votes');
    }
  }

  /**
   * Get participation votes for a specific event
   */
  async getParticipationVotes(eventId) {
    return this.getVoteCounts(eventId);
  }
}

export default VotingService;
