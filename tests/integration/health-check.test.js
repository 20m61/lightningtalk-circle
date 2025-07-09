/**
 * Health Check Integration Tests
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import healthRouter from '../../server/routes/health.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock services
  const mockDatabase = {
    findAll: jest.fn(),
    getSettings: jest.fn().mockResolvedValue({ emailEnabled: false })
  };

  const mockEmailService = {
    isConfigured: jest.fn().mockReturnValue(true)
  };

  app.locals.database = mockDatabase;
  app.locals.emailService = mockEmailService;

  app.use('/api/health', healthRouter);

  return { app, mockDatabase, mockEmailService };
};

describe('Health Check Endpoints', () => {
  let app, mockDatabase, mockEmailService;

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    mockDatabase = testSetup.mockDatabase;
    mockEmailService = testSetup.mockEmailService;

    // Default mock implementations
    mockDatabase.findAll.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    test('should return healthy status when database is accessible', async () => {
      mockDatabase.findAll.mockResolvedValue([]);

      const response = await request(app).get('/api/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String)
      });
    });

    test('should return unhealthy status when database fails', async () => {
      mockDatabase.findAll.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/health').expect(503);

      expect(response.body).toMatchObject({
        status: 'unhealthy',
        timestamp: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String)
      });
    });
  });

  describe('GET /api/health/detailed', () => {
    test('should return detailed system information', async () => {
      mockDatabase.findAll.mockResolvedValue([]);
      mockEmailService.isConfigured.mockReturnValue(true);

      const response = await request(app).get('/api/health/detailed').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        responseTime: expect.any(Number),
        system: {
          hostname: expect.any(String),
          platform: expect.any(String),
          arch: expect.any(String),
          nodeVersion: expect.any(String),
          pid: expect.any(Number),
          uptime: expect.any(Number),
          environment: expect.any(String)
        },
        application: {
          version: expect.any(String),
          port: expect.any(Number),
          features: {
            emailEnabled: expect.any(Boolean),
            analyticsEnabled: expect.any(Boolean),
            githubIntegration: expect.any(Boolean),
            autoMerge: expect.any(Boolean)
          }
        },
        resources: {
          memory: {
            process: expect.any(Object),
            system: expect.any(Object)
          },
          cpu: expect.any(Object)
        },
        services: {
          database: expect.any(Object),
          email: expect.any(Object)
        }
      });
    });

    test('should include memory statistics', async () => {
      const response = await request(app).get('/api/health/detailed').expect(200);

      const { memory } = response.body.resources;

      expect(memory.process).toMatchObject({
        rss: expect.any(Number),
        heapTotal: expect.any(Number),
        heapUsed: expect.any(Number),
        external: expect.any(Number),
        arrayBuffers: expect.any(Number)
      });

      expect(memory.system).toMatchObject({
        total: expect.any(Number),
        free: expect.any(Number),
        used: expect.any(Number),
        percentUsed: expect.any(Number)
      });
    });

    test('should include CPU statistics', async () => {
      const response = await request(app).get('/api/health/detailed').expect(200);

      const { cpu } = response.body.resources;

      expect(cpu).toMatchObject({
        count: expect.any(Number),
        model: expect.any(String),
        usage: expect.any(Number),
        loadAverage: {
          '1min': expect.any(Number),
          '5min': expect.any(Number),
          '15min': expect.any(Number)
        }
      });
    });

    test('should report degraded status when services are unhealthy', async () => {
      mockDatabase.findAll.mockRejectedValue(new Error('Database error'));
      mockEmailService.isConfigured.mockReturnValue(false);

      const response = await request(app).get('/api/health/detailed').expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.services.database.status).toBe('unhealthy');
      expect(response.body.services.email.status).toBe('unhealthy');
    });
  });

  describe('GET /api/health/live', () => {
    test('should return alive status', async () => {
      const response = await request(app).get('/api/health/live').expect(200);

      expect(response.body).toMatchObject({
        status: 'alive',
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/health/ready', () => {
    test('should return ready when database is healthy', async () => {
      mockDatabase.findAll.mockResolvedValue([]);

      const response = await request(app).get('/api/health/ready').expect(200);

      expect(response.body).toMatchObject({
        status: 'ready',
        timestamp: expect.any(String),
        checks: {
          database: 'healthy'
        }
      });
    });

    test('should return not ready when database is unhealthy', async () => {
      mockDatabase.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/health/ready').expect(503);

      expect(response.body).toMatchObject({
        status: 'not ready',
        timestamp: expect.any(String),
        checks: {
          database: 'unhealthy'
        }
      });
    });
  });

  describe('GET /api/health/metrics', () => {
    test('should return Prometheus-formatted metrics', async () => {
      mockDatabase.findAll
        .mockResolvedValueOnce([{ id: '1' }, { id: '2' }]) // events
        .mockResolvedValueOnce([{ id: '1' }, { id: '2' }, { id: '3' }]) // participants
        .mockResolvedValueOnce([{ id: '1' }]); // talks

      const response = await request(app).get('/api/health/metrics').expect(200);

      expect(response.headers['content-type']).toContain('text/plain');

      const metrics = response.text;
      expect(metrics).toContain('# HELP nodejs_process_uptime_seconds');
      expect(metrics).toContain('# TYPE nodejs_process_uptime_seconds counter');
      expect(metrics).toContain('nodejs_process_uptime_seconds');

      expect(metrics).toContain('# HELP nodejs_heap_used_bytes');
      expect(metrics).toContain('nodejs_heap_used_bytes');

      expect(metrics).toContain('# HELP system_memory_used_percent');
      expect(metrics).toContain('system_memory_used_percent');

      expect(metrics).toContain('# HELP database_healthy');
      expect(metrics).toContain('database_healthy 1');

      expect(metrics).toContain('# HELP lightning_talk_events_total');
      expect(metrics).toMatch(/lightning_talk_events_total \d+/);

      expect(metrics).toContain('# HELP lightning_talk_participants_total');
      expect(metrics).toMatch(/lightning_talk_participants_total \d+/);

      expect(metrics).toContain('# HELP lightning_talk_talks_total');
      expect(metrics).toMatch(/lightning_talk_talks_total \d+/);
    });

    test('should handle database errors gracefully in metrics', async () => {
      mockDatabase.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/health/metrics').expect(200);

      const metrics = response.text;
      expect(metrics).toContain('database_healthy 0');
      expect(metrics).toContain('lightning_talk_events_total 0');
      expect(metrics).toContain('lightning_talk_participants_total 0');
      expect(metrics).toContain('lightning_talk_talks_total 0');
    });
  });

  describe('GET /api/health/database', () => {
    test('should check all database collections', async () => {
      mockDatabase.findAll.mockResolvedValue([]);

      const response = await request(app).get('/api/health/database').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        responseTime: expect.any(Number),
        message: 'All database collections are accessible',
        collections: {
          events: 'accessible',
          participants: 'accessible',
          talks: 'accessible'
        }
      });

      expect(mockDatabase.findAll).toHaveBeenCalledTimes(3);
      expect(mockDatabase.findAll).toHaveBeenCalledWith('events', {}, 1);
      expect(mockDatabase.findAll).toHaveBeenCalledWith('participants', {}, 1);
      expect(mockDatabase.findAll).toHaveBeenCalledWith('talks', {}, 1);
    });

    test('should report database errors', async () => {
      mockDatabase.findAll.mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app).get('/api/health/database').expect(503);

      expect(response.body).toMatchObject({
        status: 'unhealthy',
        timestamp: expect.any(String),
        responseTime: expect.any(Number),
        message: 'Database health check failed',
        error: 'Connection timeout'
      });
    });
  });

  describe('GET /api/health/dependencies', () => {
    test('should check external dependencies', async () => {
      // Mock environment variables
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.EMAIL_SERVICE = 'gmail';
      mockEmailService.isConfigured.mockReturnValue(true);

      const response = await request(app).get('/api/health/dependencies');

      // The status could be 200 or 503 depending on whether fetch is successful
      expect([200, 503]).toContain(response.status);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        responseTime: expect.any(Number),
        dependencies: {
          github: {
            configured: true,
            url: 'https://api.github.com',
            required: false
          },
          email: {
            configured: true,
            service: 'gmail',
            required: false
          },
          googleMaps: {
            configured: false,
            required: false
          },
          analytics: {
            configured: false,
            required: false
          }
        }
      });

      // Clean up
      delete process.env.GITHUB_TOKEN;
      delete process.env.EMAIL_SERVICE;
    });

    test('should handle unconfigured dependencies', async () => {
      // Save current env vars
      const savedGithubToken = process.env.GITHUB_TOKEN;
      const savedEmailService = process.env.EMAIL_SERVICE;

      // Clear environment variables
      delete process.env.GITHUB_TOKEN;
      delete process.env.EMAIL_SERVICE;

      mockEmailService.isConfigured.mockReturnValue(false);

      const response = await request(app).get('/api/health/dependencies').expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.dependencies.github.configured).toBe(false);
      expect(response.body.dependencies.email.configured).toBe(false);

      // Restore env vars
      if (savedGithubToken) process.env.GITHUB_TOKEN = savedGithubToken;
      if (savedEmailService) process.env.EMAIL_SERVICE = savedEmailService;
    });
  });
});
