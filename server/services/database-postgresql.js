/**
 * PostgreSQL Database Service for Lightning Talk Event Management
 * Production-ready database implementation with connection pooling,
 * transactions, and migration support
 */

import pkg from 'pg';
const { Pool } = pkg;
import { EventEmitter } from 'events';

export class PostgreSQLDatabaseService extends EventEmitter {
  constructor() {
    super();
    this.pool = null;
    this.initialized = false;
    this.connectionString =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'lightningtalk'}`;
  }

  async initialize() {
    try {
      // Initialize connection pool
      this.pool = new Pool({
        connectionString: this.connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('📦 PostgreSQL connection established');
      client.release();

      // Run migrations
      await this.runMigrations();

      this.initialized = true;
      this.emit('ready');

      console.log('🚀 PostgreSQL Database service initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async runMigrations() {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create tables if they don't exist
      await this.createTables(client);

      // Create indexes
      await this.createIndexes(client);

      await client.query('COMMIT');
      console.log('✅ Database migrations completed');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createTables(client) {
    // Events table
    await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                date TIMESTAMPTZ NOT NULL,
                end_date TIMESTAMPTZ,
                venue_name VARCHAR(255),
                venue_address TEXT,
                capacity INTEGER DEFAULT 50,
                online BOOLEAN DEFAULT false,
                online_url TEXT,
                status VARCHAR(50) DEFAULT 'upcoming',
                registration_open BOOLEAN DEFAULT true,
                talk_submission_open BOOLEAN DEFAULT true,
                max_talks INTEGER DEFAULT 20,
                talk_duration INTEGER DEFAULT 5,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

    // Participants table
    await client.query(`
            CREATE TABLE IF NOT EXISTS participants (
                id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                participation_type VARCHAR(50) DEFAULT 'listener',
                online_participation BOOLEAN DEFAULT false,
                emergency_contact VARCHAR(255),
                dietary_restrictions TEXT,
                accessibility_needs TEXT,
                registration_date TIMESTAMPTZ DEFAULT NOW(),
                confirmed BOOLEAN DEFAULT false,
                attended BOOLEAN DEFAULT false,
                UNIQUE(event_id, email)
            );
        `);

    // Talks table
    await client.query(`
            CREATE TABLE IF NOT EXISTS talks (
                id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                duration INTEGER DEFAULT 5,
                slides_url TEXT,
                video_url TEXT,
                status VARCHAR(50) DEFAULT 'submitted',
                order_position INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

    // Settings table
    await client.query(`
            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR(255) PRIMARY KEY,
                value JSONB,
                description TEXT,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

    // Analytics table
    await client.query(`
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(100) NOT NULL,
                event_data JSONB,
                user_id INTEGER,
                session_id VARCHAR(255),
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

    // Update triggers for updated_at
    await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

    const tables = ['events', 'talks'];
    for (const table of tables) {
      await client.query(`
                DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
                CREATE TRIGGER update_${table}_updated_at 
                    BEFORE UPDATE ON ${table} 
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            `);
    }
  }

  async createIndexes(client) {
    // Performance indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);');
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);'
    );
    await client.query('CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_talks_event_id ON talks(event_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_talks_status ON talks(status);');
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);'
    );
  }

  // Events operations
  async createEvent(eventData) {
    const client = await this.pool.connect();
    try {
      const query = `
                INSERT INTO events (title, description, date, end_date, venue_name, venue_address, 
                                  capacity, online, online_url, max_talks, talk_duration)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *;
            `;
      const values = [
        eventData.title,
        eventData.description,
        eventData.date,
        eventData.endDate,
        eventData.venue?.name,
        eventData.venue?.address,
        eventData.venue?.capacity || 50,
        eventData.venue?.online || false,
        eventData.venue?.onlineUrl,
        eventData.maxTalks || 20,
        eventData.talkDuration || 5
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getEvents(filters = {}) {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM events';
      const conditions = [];
      const values = [];

      if (filters.status) {
        conditions.push(`status = $${values.length + 1}`);
        values.push(filters.status);
      }

      if (filters.future) {
        conditions.push('date > NOW()');
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' ORDER BY date DESC';

      if (filters.limit) {
        query += ` LIMIT $${values.length + 1}`;
        values.push(filters.limit);
      }

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getEventById(id) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM events WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async updateEvent(id, updates) {
    const client = await this.pool.connect();
    try {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

      const query = `UPDATE events SET ${setClause} WHERE id = $1 RETURNING *`;
      const result = await client.query(query, [id, ...values]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Participants operations
  async registerParticipant(participantData) {
    const client = await this.pool.connect();
    try {
      const query = `
                INSERT INTO participants (event_id, name, email, participation_type, 
                                        online_participation, emergency_contact, 
                                        dietary_restrictions, accessibility_needs)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
      const values = [
        participantData.eventId,
        participantData.name,
        participantData.email,
        participantData.participationType || 'listener',
        participantData.onlineParticipation || false,
        participantData.emergencyContact,
        participantData.dietaryRestrictions,
        participantData.accessibilityNeeds
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('Email already registered for this event');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async getParticipantsByEvent(eventId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM participants WHERE event_id = $1 ORDER BY registration_date DESC',
        [eventId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Talks operations
  async submitTalk(talkData) {
    const client = await this.pool.connect();
    try {
      const query = `
                INSERT INTO talks (event_id, participant_id, title, description, category, duration)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;
      const values = [
        talkData.eventId,
        talkData.participantId,
        talkData.title,
        talkData.description,
        talkData.category,
        talkData.duration || 5
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getTalksByEvent(eventId) {
    const client = await this.pool.connect();
    try {
      const query = `
                SELECT t.*, p.name as speaker_name, p.email as speaker_email
                FROM talks t
                JOIN participants p ON t.participant_id = p.id
                WHERE t.event_id = $1
                ORDER BY t.order_position, t.created_at
            `;
      const result = await client.query(query, [eventId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Settings operations
  async setSetting(key, value, description = null) {
    const client = await this.pool.connect();
    try {
      const query = `
                INSERT INTO settings (key, value, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (key) DO UPDATE SET 
                    value = EXCLUDED.value,
                    description = EXCLUDED.description,
                    updated_at = NOW()
                RETURNING *;
            `;
      const result = await client.query(query, [key, JSON.stringify(value), description]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getSetting(key) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM settings WHERE key = $1', [key]);
      return result.rows[0] ? JSON.parse(result.rows[0].value) : null;
    } finally {
      client.release();
    }
  }

  // Analytics operations
  async logEvent(eventType, eventData, metadata = {}) {
    const client = await this.pool.connect();
    try {
      const query = `
                INSERT INTO analytics (event_type, event_data, user_id, session_id, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id;
            `;
      const values = [
        eventType,
        JSON.stringify(eventData),
        metadata.userId,
        metadata.sessionId,
        metadata.ipAddress,
        metadata.userAgent
      ];

      const result = await client.query(query, values);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  // Transaction support
  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Connection management
  async waitForConnection() {
    if (!this.initialized) {
      return new Promise(resolve => {
        this.once('ready', resolve);
      });
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('📦 PostgreSQL connection pool closed');
    }
  }

  // Health check
  async healthCheck() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      return {
        status: 'healthy',
        timestamp: result.rows[0].now,
        poolSize: this.pool.totalCount,
        activeConnections: this.pool.totalCount - this.pool.idleCount
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

export default PostgreSQLDatabaseService;
