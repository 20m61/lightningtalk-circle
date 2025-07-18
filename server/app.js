/**
 * Lightning Talk Event Management System - Server
 * Express.js backend with event management functionality
 */

import dotenv from 'dotenv';
// Load environment variables first, before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Routes
import eventsRouter from './routes/events.js';
import participantsRouter from './routes/participants.js';
import talksRouter from './routes/talks.js';
import adminRouter from './routes/admin.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import swaggerRouter from './routes/swagger.js';
import votingRouter from './routes/voting.js';
import chatRouter from './routes/chat.js';
import mediaRouter from './routes/media.js';
import speakersRouter from './routes/speakers.js';
import aiImagesRouter from './routes/ai-images.js';
import frontendLogsRouter from './routes/frontend-logs.js';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { authenticateToken, requireAdmin } from './middleware/auth.js';
import {
  formHoneypot,
  timingHoneypot,
  behavioralHoneypot,
  createAPIHoneypot
} from './middleware/honeypot.js';
import {
  addToken as addCSRFToken,
  validateToken as validateCSRF
} from './middleware/csrf-protection.js';

// Services
import { DatabaseService } from './services/database.js';
import { EmailService } from './services/email.js';
import { EventService } from './services/event.js';
import { VotingService } from './services/votingService.js';
import websocketService from './services/websocketService.js';
import chatService from './services/chatService.js';
import imageService from './services/imageService.js';

// Performance monitoring
import { performanceMonitor } from './utils/performanceMonitor.js';
import http from 'http';

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

    // Initialize voting service
    this.votingService = new VotingService(this.database);

    // Only cleanup if database is properly initialized
    if (this.database && typeof this.database.find === 'function') {
      await this.votingService.cleanupExpiredSessions();
    }

    // Initialize chat service
    await chatService.initialize(this.database);

    // Initialize image service
    await imageService.initialize();

    // Make services available to routes
    this.app.locals.database = this.database;
    this.app.locals.emailService = this.emailService;
    this.app.locals.eventService = this.eventService;
    this.app.locals.votingService = this.votingService;
    this.app.locals.websocketService = websocketService;
    this.app.locals.chatService = chatService;
    this.app.locals.imageService = imageService;

    // Initialize performance monitoring
    if (this.environment !== 'production' || process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
      performanceMonitor.start();

      // Set up performance alerts
      performanceMonitor.on('alert', alert => {
        console.warn(`🚨 Performance Alert [${alert.level}]: ${alert.message}`);
      });
    }
  }

  setupMiddleware() {
    // Security middleware - 環境に応じて設定
    if (this.environment === 'production' && process.env.DISABLE_STRICT_CSP !== 'true') {
      // 本番環境: 厳格なセキュリティ設定
      this.app.use(
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: [
                "'self'",
                'https://accounts.google.com',
                'https://*.auth.ap-northeast-1.amazoncognito.com'
              ],
              workerSrc: ["'self'", 'blob:'],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'self'"],
              upgradeInsecureRequests: []
            }
          }
        })
      );
    } else {
      // 開発環境: 緩和されたセキュリティ設定
      this.app.use(
        helmet({
          contentSecurityPolicy: {
            useDefaults: false, // デフォルトを使用しない
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              scriptSrcAttr: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: [
                "'self'",
                'https://accounts.google.com',
                'https://*.auth.ap-northeast-1.amazoncognito.com'
              ],
              workerSrc: ["'self'", 'blob:'],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'self'"]
              // upgradeInsecureRequests を意図的に除外
              // script-src-attr も除外
            }
          },
          hsts: false, // HTTPSの強制を無効
          crossOriginEmbedderPolicy: false
        })
      );
    }

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
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : this.environment === 'production'
        ? ['https://lightningtalk.example.com']
        : [
            'http://localhost:3000',
            'http://localhost:3010',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3010'
          ];

    this.app.use(
      cors({
        origin: corsOrigins,
        credentials: true
      })
    );

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(logger);

    // Performance monitoring (in development/staging)
    if (this.environment !== 'production' || process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
      this.app.use(performanceMonitor.requestMiddleware());
    }

    // Security middleware - honeypot and CSRF protection
    this.app.use(behavioralHoneypot());
    this.app.use(addCSRFToken());

    // Static files
    this.app.use(express.static(join(__dirname, '../public')));

    // Apply registration rate limiter
    this.app.use('/api/participants', registrationLimiter);
  }

  setupRoutes() {
    // API Documentation
    this.app.use('/api/docs', swaggerRouter);

    // Honeypot API endpoints (must be before real routes)
    this.app.use('/api/admin-login', createAPIHoneypot('admin-login'));
    this.app.use('/api/wp-admin', createAPIHoneypot('wp-admin'));
    this.app.use('/api/administrator', createAPIHoneypot('administrator'));
    this.app.use('/api/backup', createAPIHoneypot('backup'));
    this.app.use('/api/config', createAPIHoneypot('config'));

    // API Routes with CSRF protection for POST/PUT/DELETE
    this.app.use('/api/auth', authRouter);
    this.app.use('/api/events', eventsRouter);
    this.app.use(
      '/api/participants',
      validateCSRF(),
      formHoneypot(),
      timingHoneypot(),
      participantsRouter
    );
    this.app.use('/api/talks', validateCSRF(), talksRouter);
    this.app.use('/api/voting', votingRouter);
    this.app.use('/api/chat', chatRouter);
    this.app.use('/api/media', mediaRouter);
    this.app.use('/api/speakers', validateCSRF(), speakersRouter);
    this.app.use('/api/ai-images', aiImagesRouter);
    this.app.use('/api/logs', frontendLogsRouter);
    this.app.use('/api/admin', authenticateToken, requireAdmin, adminRouter);
    this.app.use('/api/health', healthRouter);

    // API information endpoint (simple JSON overview)
    this.app.get('/api', (req, res) => {
      res.json({
        title: 'Lightning Talk API',
        version: '1.0.0',
        description: 'Lightning Talk Event Management System API',
        documentation: '/api/docs',
        health: '/api/health',
        endpoints: {
          events: 'GET|POST /api/events, GET|PUT|DELETE /api/events/:id',
          participants: 'POST /api/participants/register, GET|PUT|DELETE /api/participants/:id',
          talks: 'GET /api/talks/:eventId, POST|PUT|DELETE /api/talks/:id',
          auth: 'POST /api/auth/login, POST /api/auth/register, GET /api/auth/me',
          admin: 'GET /api/admin/* (requires admin access)',
          health: {
            'GET /api/health': 'Basic health check',
            'GET /api/health/detailed': 'Detailed system status',
            'GET /api/health/live': 'Kubernetes liveness probe',
            'GET /api/health/ready': 'Kubernetes readiness probe',
            'GET /api/health/metrics': 'Prometheus metrics',
            'GET /api/health/database': 'Database health check',
            'GET /api/health/dependencies': 'External dependencies check'
          },
          performance: this.environment !== 'production' ? 'GET /api/performance' : 'disabled'
        }
      });
    });

    // Performance monitoring endpoint (development/staging only)
    if (this.environment !== 'production' || process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
      this.app.get('/api/performance', (req, res) => {
        const summary = performanceMonitor.getSummary();
        const dbStats = this.database?.getPerformanceStats?.() || {};

        res.json({
          timestamp: new Date().toISOString(),
          system: summary,
          database: dbStats,
          details: {
            memory: performanceMonitor.getStats('memory', 'heapUsed'),
            requests: performanceMonitor.getStats('http', 'request'),
            eventloop: performanceMonitor.getStats('eventloop', 'lag')
          }
        });
      });
    }

    // Catch-all route for SPA
    this.app.get('*', (req, res) => {
      res.sendFile(join(__dirname, '../public/index.html'));
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Wait for database to be ready
      await this.database.waitForConnection();

      // Create HTTP server for WebSocket support
      this.server = http.createServer(this.app);

      // Initialize WebSocket service
      websocketService.initialize(this.server, {
        cors: {
          origin: process.env.CLIENT_URL || '*',
          methods: ['GET', 'POST']
        }
      });

      // Start server
      this.server.listen(this.port, () => {
        console.log(`
🚀 Lightning Talk Server is running!
   
📍 Environment: ${this.environment}
🌐 Server: http://localhost:${this.port}
📊 Health: http://localhost:${this.port}/api/health
📚 API Docs: http://localhost:${this.port}/api/docs
📋 API Info: http://localhost:${this.port}/api

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
    const shutdown = async signal => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);

      if (this.server) {
        this.server.close(async () => {
          console.log('📴 HTTP server closed');

          try {
            // Shutdown WebSocket and Chat services
            await websocketService.shutdown();
            await chatService.shutdown();
            console.log('📴 WebSocket and Chat services closed');

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
    (async () => {
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
