/**
 * Lightning Talk Event Management System - Server
 * Express.js backend with event management functionality
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Routes
import eventsRouter from './routes/events.js';
import participantsRouter from './routes/participants.js';
import talksRouter from './routes/talks.js';
import adminRouter from './routes/admin.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

// Services
import { DatabaseService } from './services/database.js';
import { EmailService } from './services/email.js';
import { EventService } from './services/event.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LightningTalkServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.environment = process.env.NODE_ENV || 'development';

    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  async initializeServices() {
    // Initialize database
    this.database = new DatabaseService();
    await this.database.initialize();

    // Initialize email service
    this.emailService = new EmailService();

    // Initialize event service
    this.eventService = new EventService(this.database, this.emailService);

    // Make services available to routes
    this.app.locals.database = this.database;
    this.app.locals.emailService = this.emailService;
    this.app.locals.eventService = this.eventService;
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"]
        }
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Stricter rate limiting for registration endpoints
    const registrationLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // limit each IP to 5 registration attempts per hour
      message: 'Too many registration attempts, please try again later.'
    });

    // CORS
    this.app.use(cors({
      origin: this.environment === 'production'
        ? ['https://lightningtalk.example.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(logger);

    // Static files
    this.app.use(express.static(join(__dirname, '../public')));

    // Apply registration rate limiter
    this.app.use('/api/participants', registrationLimiter);
  }

  setupRoutes() {
    // API Routes
    this.app.use('/api/events', eventsRouter);
    this.app.use('/api/participants', participantsRouter);
    this.app.use('/api/talks', talksRouter);
    this.app.use('/api/admin', adminRouter);

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: this.environment,
        uptime: process.uptime()
      });
    });

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'Lightning Talk API',
        version: '1.0.0',
        endpoints: {
          events: {
            'GET /api/events': 'Get all events',
            'GET /api/events/:id': 'Get specific event',
            'POST /api/events': 'Create new event (admin)',
            'PUT /api/events/:id': 'Update event (admin)',
            'DELETE /api/events/:id': 'Delete event (admin)'
          },
          participants: {
            'POST /api/participants/register': 'Register for event',
            'GET /api/participants/:eventId': 'Get event participants (admin)',
            'PUT /api/participants/:id': 'Update participant info',
            'DELETE /api/participants/:id': 'Remove participant (admin)'
          },
          talks: {
            'GET /api/talks/:eventId': 'Get talks for event',
            'POST /api/talks': 'Submit talk proposal',
            'PUT /api/talks/:id': 'Update talk',
            'DELETE /api/talks/:id': 'Delete talk'
          }
        }
      });
    });

    // Catch-all route for SPA
    this.app.get('*', (req, res) => {
      res.sendFile(join(__dirname, '../public/index.html'));
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res, next) => {
      const error = new Error(`Not Found - ${req.originalUrl}`);
      error.status = 404;
      next(error);
    });

    // Error handler
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Wait for database to be ready
      await this.database.waitForConnection();

      // Start server
      this.server = this.app.listen(this.port, () => {
        console.log(`
🚀 Lightning Talk Server is running!
   
📍 Environment: ${this.environment}
🌐 Server: http://localhost:${this.port}
📊 Health: http://localhost:${this.port}/api/health
📚 API Docs: http://localhost:${this.port}/api/docs

⚡ Ready to manage lightning talks!
                `);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async(signal) => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);

      if (this.server) {
        this.server.close(async() => {
          console.log('📴 HTTP server closed');

          try {
            await this.database.close();
            console.log('📴 Database connections closed');

            console.log('📴 Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
          }
        });
      }

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('📴 Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  // Development helpers
  async seedDatabase() {
    if (this.environment !== 'development') {
      throw new Error('Database seeding is only available in development mode');
    }

    const seedData = {
      events: [
        {
          id: 'event-001',
          title: '第1回 なんでもライトニングトーク',
          description: '5分間で世界を変える！あなたの「なんでも」を聞かせて！',
          date: '2025-06-25T19:00:00+09:00',
          endDate: '2025-06-25T22:00:00+09:00',
          venue: {
            name: '新宿会場',
            address: '西新宿8-14-19 小林第二ビル8階',
            capacity: 50,
            online: true,
            onlineUrl: 'https://meet.google.com/ycp-sdec-xsr'
          },
          status: 'upcoming',
          registrationOpen: true,
          talkSubmissionOpen: true,
          maxTalks: 20,
          talkDuration: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      participants: [],
      talks: []
    };

    await this.database.seed(seedData);
    console.log('🌱 Database seeded successfully');
  }
}

// Export for testing
export default LightningTalkServer;

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new LightningTalkServer();

  // Seed database in development
  if (process.env.NODE_ENV === 'development' && process.argv.includes('--seed')) {
    (async() => {
      try {
        await server.initializeServices();
        await server.seedDatabase();
        console.log('🌱 Database seeded successfully');
        process.exit(0);
      } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
      }
    })();
  } else {
    server.start().catch(console.error);
  }
}
