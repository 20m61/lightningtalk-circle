/**
 * Health Check API Routes
 * Provides comprehensive application health monitoring
 */

import express from 'express';
import os from 'os';
import { EmailServiceFactory } from '../services/email-factory.js';

const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const healthStatus = await performHealthChecks();

    const status = healthStatus.overall === 'healthy' ? 200 : 503;
    res.status(status).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = await performDetailedHealthChecks();

    const status = healthStatus.overall === 'healthy' ? 200 : 503;
    res.status(status).json(healthStatus);
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness probe (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
  try {
    const checks = await performReadinessChecks();

    if (checks.ready) {
      res.status(200).json({
        status: 'ready',
        checks: checks.results,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not-ready',
        checks: checks.results,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

// Performance metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Basic health checks
async function performHealthChecks() {
  const checks = {
    app: { status: 'healthy', message: 'Application running' },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  // Check email service
  try {
    const emailHealth = await EmailServiceFactory.testEmailConfiguration();
    checks.email = emailHealth;
  } catch (error) {
    checks.email = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // Determine overall status
  const services = Object.keys(checks).filter(
    key => !['timestamp', 'uptime', 'version', 'environment'].includes(key)
  );

  const healthyServices = services.filter(service => checks[service].status === 'healthy');

  checks.overall = healthyServices.length === services.length ? 'healthy' : 'degraded';

  return checks;
}

// Detailed health checks
async function performDetailedHealthChecks() {
  const basic = await performHealthChecks();

  // System information
  const system = {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    loadAverage: os.loadavg(),
    nodeVersion: process.version
  };

  // Process information
  const processInfo = {
    pid: process.pid,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };

  // Environment checks
  const environment = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    databaseType: process.env.DATABASE_TYPE,
    emailEnabled: process.env.EMAIL_ENABLED,
    emailProvider: process.env.EMAIL_PROVIDER
  };

  return {
    ...basic,
    system,
    process: processInfo,
    environment
  };
}

// Readiness checks (for orchestration platforms)
async function performReadinessChecks() {
  const results = {};
  let allReady = true;

  // Check if email service is configured
  try {
    const emailValidation = EmailServiceFactory.validateConfiguration();
    results.email = {
      ready: emailValidation.valid,
      provider: emailValidation.provider,
      warnings: emailValidation.warnings,
      errors: emailValidation.errors
    };

    if (!emailValidation.valid) {
      allReady = false;
    }
  } catch (error) {
    results.email = {
      ready: false,
      error: error.message
    };
    allReady = false;
  }

  // Check environment variables
  const requiredEnvVars = ['NODE_ENV', 'JWT_SECRET', 'SESSION_SECRET'];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  results.environment = {
    ready: missingEnvVars.length === 0,
    missing: missingEnvVars
  };

  if (missingEnvVars.length > 0) {
    allReady = false;
  }

  return {
    ready: allReady,
    results
  };
}

// Performance metrics
async function getPerformanceMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length
    },
    eventLoop: {
      // Event loop lag would be measured here in a real implementation
      lag: 0
    }
  };
}

export default router;
