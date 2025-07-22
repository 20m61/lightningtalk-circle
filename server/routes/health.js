/**
 * Health Check Routes
 * Comprehensive system health monitoring and status reporting
 */

import express from 'express';
import os from 'os';
import { performance } from 'perf_hooks';

const router = express.Router();

/**
 * Helper function to check database connectivity
 */
async function checkDatabase(database) {
  const startTime = performance.now();
  try {
    // Try to perform a simple query
    await database.findAll('events', {}, 1);
    const responseTime = performance.now() - startTime;
    return {
      status: 'healthy',
      responseTime: Math.round(responseTime),
      message: 'Database connection successful'
    };
  } catch (error) {
    const responseTime = performance.now() - startTime;
    return {
      status: 'unhealthy',
      responseTime: Math.round(responseTime),
      message: 'Database connection failed',
      error: error.message
    };
  }
}

/**
 * Helper function to check external service connectivity
 */
async function checkExternalService(serviceName, checkFunction) {
  const startTime = performance.now();
  try {
    await checkFunction();
    const responseTime = performance.now() - startTime;
    return {
      status: 'healthy',
      responseTime: Math.round(responseTime),
      message: `${serviceName} is accessible`
    };
  } catch (error) {
    const responseTime = performance.now() - startTime;
    return {
      status: 'unhealthy',
      responseTime: Math.round(responseTime),
      message: `${serviceName} is not accessible`,
      error: error.message
    };
  }
}

/**
 * Get memory usage statistics
 */
function getMemoryStats() {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    process: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) // MB
    },
    system: {
      total: Math.round(totalMem / 1024 / 1024), // MB
      free: Math.round(freeMem / 1024 / 1024), // MB
      used: Math.round(usedMem / 1024 / 1024), // MB
      percentUsed: Math.round((usedMem / totalMem) * 100)
    }
  };
}

/**
 * Get CPU usage statistics
 */
function getCPUStats() {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();

  // Calculate average CPU usage
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const avgCPUUsage = 100 - Math.round((totalIdle / totalTick) * 100);

  return {
    count: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    usage: avgCPUUsage,
    loadAverage: {
      '1min': loadAvg[0],
      '5min': loadAvg[1],
      '15min': loadAvg[2]
    }
  };
}

/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', async(req, res) => {
  const { database } = req.app.locals;

  // Quick health check
  const dbCheck = await checkDatabase(database);
  const isHealthy = dbCheck.status === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * GET /api/health/detailed
 * Detailed health check with all system information
 */
router.get('/detailed', async(req, res) => {
  const { database, emailService } = req.app.locals;
  const startTime = performance.now();

  // Perform all health checks
  const [dbHealth, emailHealth] = await Promise.all([
    checkDatabase(database),
    checkExternalService('Email Service', async() => {
      if (!emailService.isConfigured()) {
        throw new Error('Email service not configured');
      }
    })
  ]);

  // Collect system metrics
  const memoryStats = getMemoryStats();
  const cpuStats = getCPUStats();

  // System information
  const systemInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    pid: process.pid,
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  };

  // Application metrics
  const appMetrics = {
    version: process.env.npm_package_version || '1.0.0',
    port: process.env.PORT || 3000,
    features: {
      emailEnabled: process.env.EMAIL_ENABLED === 'true',
      analyticsEnabled: process.env.ANALYTICS_ENABLED === 'true',
      githubIntegration: !!process.env.GITHUB_TOKEN,
      autoMerge: process.env.AUTO_MERGE === 'true'
    }
  };

  // Calculate overall health status
  const healthChecks = {
    database: dbHealth,
    email: emailHealth
  };

  const allHealthy = Object.values(healthChecks).every(check => check.status === 'healthy');
  const responseTime = Math.round(performance.now() - startTime);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime,
    system: systemInfo,
    application: appMetrics,
    resources: {
      memory: memoryStats,
      cpu: cpuStats
    },
    services: healthChecks
  });
});

/**
 * GET /api/health/live
 * Kubernetes liveness probe endpoint
 */
router.get('/live', (req, res) => {
  // Simple check to see if the service is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/health/ready
 * Kubernetes readiness probe endpoint
 */
router.get('/ready', async(req, res) => {
  const { database } = req.app.locals;

  // Check if all required services are ready
  const dbCheck = await checkDatabase(database);
  const isReady = dbCheck.status === 'healthy';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbCheck.status
    }
  });
});

/**
 * GET /api/health/metrics
 * Prometheus-compatible metrics endpoint
 */
router.get('/metrics', async(req, res) => {
  const { database } = req.app.locals;

  // Collect metrics
  const memStats = getMemoryStats();
  const cpuStats = getCPUStats();
  const dbHealth = await checkDatabase(database);

  // Get event statistics
  let eventCount = 0;
  let participantCount = 0;
  let talkCount = 0;

  try {
    const [events, participants, talks] = await Promise.all([
      database.findAll('events'),
      database.findAll('participants'),
      database.findAll('talks')
    ]);

    eventCount = events.length;
    participantCount = participants.length;
    talkCount = talks.length;
  } catch (error) {
    // Continue with zero counts if database query fails
  }

  // Format as Prometheus metrics
  const metrics = `
# HELP nodejs_process_uptime_seconds Node.js process uptime
# TYPE nodejs_process_uptime_seconds counter
nodejs_process_uptime_seconds ${process.uptime()}

# HELP nodejs_heap_used_bytes Process heap memory used
# TYPE nodejs_heap_used_bytes gauge
nodejs_heap_used_bytes ${memStats.process.heapUsed * 1024 * 1024}

# HELP nodejs_heap_total_bytes Process heap memory total
# TYPE nodejs_heap_total_bytes gauge
nodejs_heap_total_bytes ${memStats.process.heapTotal * 1024 * 1024}

# HELP system_memory_used_percent System memory usage percentage
# TYPE system_memory_used_percent gauge
system_memory_used_percent ${memStats.system.percentUsed}

# HELP system_cpu_usage_percent System CPU usage percentage
# TYPE system_cpu_usage_percent gauge
system_cpu_usage_percent ${cpuStats.usage}

# HELP system_load_average_1m System load average over 1 minute
# TYPE system_load_average_1m gauge
system_load_average_1m ${cpuStats.loadAverage['1min']}

# HELP database_healthy Database connection health (1=healthy, 0=unhealthy)
# TYPE database_healthy gauge
database_healthy ${dbHealth.status === 'healthy' ? 1 : 0}

# HELP database_response_time_ms Database response time in milliseconds
# TYPE database_response_time_ms gauge
database_response_time_ms ${dbHealth.responseTime}

# HELP lightning_talk_events_total Total number of events
# TYPE lightning_talk_events_total gauge
lightning_talk_events_total ${eventCount}

# HELP lightning_talk_participants_total Total number of participants
# TYPE lightning_talk_participants_total gauge
lightning_talk_participants_total ${participantCount}

# HELP lightning_talk_talks_total Total number of talks
# TYPE lightning_talk_talks_total gauge
lightning_talk_talks_total ${talkCount}
`.trim();

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
});

/**
 * GET /api/health/database
 * Database-specific health check
 */
router.get('/database', async(req, res) => {
  const { database } = req.app.locals;
  const startTime = performance.now();

  try {
    // Perform various database operations
    const checks = await Promise.all([
      database.findAll('events', {}, 1),
      database.findAll('participants', {}, 1),
      database.findAll('talks', {}, 1)
    ]);

    const responseTime = Math.round(performance.now() - startTime);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      message: 'All database collections are accessible',
      collections: {
        events: 'accessible',
        participants: 'accessible',
        talks: 'accessible'
      }
    });
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      message: 'Database health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/health/dependencies
 * Check all external dependencies
 */
router.get('/dependencies', async(req, res) => {
  const { emailService } = req.app.locals;
  const startTime = performance.now();

  const dependencies = {
    github: {
      configured: !!process.env.GITHUB_TOKEN,
      url: 'https://api.github.com',
      required: false
    },
    email: {
      configured: emailService.isConfigured(),
      service: process.env.EMAIL_SERVICE || 'not configured',
      required: false
    },
    googleMaps: {
      configured: !!process.env.GOOGLE_MAPS_API_KEY,
      required: false
    },
    analytics: {
      configured: !!process.env.GOOGLE_ANALYTICS_ID,
      required: false
    }
  };

  // Check GitHub API if configured
  if (dependencies.github.configured) {
    try {
      // Use native fetch if available (Node 18+), otherwise skip the check
      if (typeof fetch !== 'undefined') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch('https://api.github.com/status', {
            signal: controller.signal,
            headers: {
              'User-Agent': 'LightningTalk-HealthCheck'
            }
          });
          clearTimeout(timeout);
          dependencies.github.status = response.ok ? 'healthy' : 'unhealthy';
        } catch (err) {
          clearTimeout(timeout);
          throw err;
        }
      } else {
        // If fetch is not available, mark as unknown
        dependencies.github.status = 'unknown';
        dependencies.github.message = 'Fetch API not available';
      }
    } catch (error) {
      dependencies.github.status = 'unhealthy';
      dependencies.github.error = error.message;
    }
  }

  const responseTime = Math.round(performance.now() - startTime);
  const allHealthy = Object.values(dependencies).every(
    dep => !dep.configured || dep.status === 'healthy'
  );

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    responseTime,
    dependencies
  });
});

export default router;
