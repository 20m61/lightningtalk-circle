/**
 * Monitoring API Routes
 * Provides monitoring dashboard and metrics endpoints
 */

import express from 'express';
import { getMonitoring } from '../services/monitoringService.js';
import { getCloudWatch } from '../services/cloudWatchService.js';
import { cloudWatchHealthCheck } from '../middleware/cloudWatchMiddleware.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('MonitoringRoutes');

// Apply admin authentication to all monitoring routes except health check
router.use((req, res, next) => {
  // Health check is public for load balancers
  if (req.path === '/health') {
    return next();
  }
  // All other monitoring routes require admin authentication
  return authenticateAdmin(req, res, next);
});

/**
 * GET /api/monitoring/health
 * Enhanced health check with CloudWatch integration
 */
router.get('/health', cloudWatchHealthCheck());

/**
 * GET /api/monitoring/status
 * Get current system status
 */
router.get('/status', async(req, res) => {
  try {
    const monitoring = getMonitoring();
    const cloudWatch = getCloudWatch();

    const status = {
      timestamp: new Date().toISOString(),
      application: {
        name: 'Lightning Talk Circle',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      services: {
        monitoring: monitoring.getHealthStatus(),
        cloudWatch: cloudWatch.getHealthStatus()
      },
      checks: {
        database: monitoring.metrics.database.connectionStatus === 'healthy',
        cloudWatch: cloudWatch.isEnabled,
        memory: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal < 0.8
      }
    };

    // Overall health
    status.healthy = Object.values(status.checks).every(check => check === true);

    res.json(status);
  } catch (error) {
    logger.error('Failed to get monitoring status', error);
    res.status(500).json({ error: 'Failed to get monitoring status' });
  }
});

/**
 * GET /api/monitoring/metrics
 * Get comprehensive metrics
 */
router.get('/metrics', async(req, res) => {
  try {
    const monitoring = getMonitoring();
    const metrics = monitoring.getMetrics();

    res.json({
      timestamp: new Date().toISOString(),
      metrics,
      summary: monitoring.getMetricsSummary()
    });
  } catch (error) {
    logger.error('Failed to get metrics', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * GET /api/monitoring/metrics/summary
 * Get metrics summary for dashboard
 */
router.get('/metrics/summary', async(req, res) => {
  try {
    const monitoring = getMonitoring();
    const summary = monitoring.getMetricsSummary();

    res.json({
      timestamp: new Date().toISOString(),
      ...summary
    });
  } catch (error) {
    logger.error('Failed to get metrics summary', error);
    res.status(500).json({ error: 'Failed to get metrics summary' });
  }
});

/**
 * GET /api/monitoring/alerts
 * Get active alerts
 */
router.get('/alerts', async(req, res) => {
  try {
    const monitoring = getMonitoring();
    const metrics = monitoring.getMetrics();

    const alerts = {
      active: metrics.alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return alertTime > hourAgo;
      }),
      recent: metrics.alerts.slice(-20),
      summary: {
        total: metrics.alerts.length,
        critical: metrics.alerts.filter(a => a.severity === 'critical').length,
        high: metrics.alerts.filter(a => a.severity === 'high').length,
        medium: metrics.alerts.filter(a => a.severity === 'medium').length,
        low: metrics.alerts.filter(a => a.severity === 'low').length
      }
    };

    res.json(alerts);
  } catch (error) {
    logger.error('Failed to get alerts', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * GET /api/monitoring/errors
 * Get recent errors
 */
router.get('/errors', async(req, res) => {
  try {
    const monitoring = getMonitoring();
    const metrics = monitoring.getMetrics();
    const { limit = 50, since } = req.query;

    let { errors } = metrics;

    if (since) {
      const sinceDate = new Date(since);
      errors = errors.filter(error => new Date(error.timestamp) > sinceDate);
    }

    errors = errors.slice(-limit);

    const errorSummary = {
      total: errors.length,
      byType: {},
      recentCount: errors.filter(e => {
        const errorTime = new Date(e.timestamp);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return errorTime > hourAgo;
      }).length
    };

    errors.forEach(error => {
      errorSummary.byType[error.type] = (errorSummary.byType[error.type] || 0) + 1;
    });

    res.json({
      errors,
      summary: errorSummary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get errors', error);
    res.status(500).json({ error: 'Failed to get errors' });
  }
});

/**
 * GET /api/monitoring/performance
 * Get performance metrics
 */
router.get('/performance', async(req, res) => {
  try {
    const monitoring = getMonitoring();
    const metrics = monitoring.getMetrics();

    const performance = {
      requests: {
        total: metrics.requests.total,
        successRate: ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2),
        errorRate: ((metrics.requests.error / metrics.requests.total) * 100).toFixed(2),
        byEndpoint: metrics.requests.byEndpoint,
        byStatus: metrics.requests.byStatus
      },
      response: {
        average: Math.round(metrics.performance.averageResponseTime),
        p95: Math.round(metrics.performance.p95ResponseTime),
        p99: Math.round(metrics.performance.p99ResponseTime),
        distribution: metrics.performance.responseTimes.slice(-100) // Last 100 requests
      },
      system: {
        cpu: (metrics.system.cpu * 100).toFixed(2),
        memory: {
          percentage: (metrics.system.memory.percentage * 100).toFixed(2),
          used: Math.round(metrics.system.memory.used / 1024 / 1024), // MB
          total: Math.round(metrics.system.memory.total / 1024 / 1024) // MB
        },
        uptime: metrics.system.uptime,
        processMemory: metrics.system.processMemory
      }
    };

    res.json({
      timestamp: new Date().toISOString(),
      performance
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

/**
 * POST /api/monitoring/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/alerts/:id/acknowledge', async(req, res) => {
  try {
    const { id } = req.params;
    const { acknowledgedBy, notes } = req.body;

    const monitoring = getMonitoring();
    const metrics = monitoring.getMetrics();

    const alert = metrics.alerts.find(a => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy || 'unknown';
    alert.notes = notes;

    // Log alert acknowledgment
    const cloudWatch = getCloudWatch();
    await cloudWatch.logEvent('INFO', 'Alert Acknowledged', {
      alertId: id,
      alertMessage: alert.message,
      acknowledgedBy,
      notes
    });

    res.json({ success: true, alert });
  } catch (error) {
    logger.error('Failed to acknowledge alert', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

/**
 * GET /api/monitoring/cloudwatch/status
 * Get CloudWatch service status
 */
router.get('/cloudwatch/status', async(req, res) => {
  try {
    const cloudWatch = getCloudWatch();
    const status = cloudWatch.getHealthStatus();

    res.json({
      timestamp: new Date().toISOString(),
      cloudWatch: status
    });
  } catch (error) {
    logger.error('Failed to get CloudWatch status', error);
    res.status(500).json({ error: 'Failed to get CloudWatch status' });
  }
});

/**
 * POST /api/monitoring/cloudwatch/alarms/create
 * Create CloudWatch alarms
 */
router.post('/cloudwatch/alarms/create', async(req, res) => {
  try {
    const cloudWatch = getCloudWatch();

    if (!cloudWatch.isEnabled) {
      return res.status(400).json({ error: 'CloudWatch is not enabled' });
    }

    await cloudWatch.createStandardAlarms();

    res.json({
      success: true,
      message: 'Standard CloudWatch alarms created successfully'
    });
  } catch (error) {
    logger.error('Failed to create CloudWatch alarms', error);
    res.status(500).json({ error: 'Failed to create CloudWatch alarms' });
  }
});

/**
 * GET /api/monitoring/dashboard
 * Get dashboard data
 */
router.get('/dashboard', async(req, res) => {
  try {
    const monitoring = getMonitoring();
    const cloudWatch = getCloudWatch();

    const summary = monitoring.getMetricsSummary();
    const cloudWatchStatus = cloudWatch.getHealthStatus();

    const dashboard = {
      timestamp: new Date().toISOString(),
      status: summary.health.healthy ? 'healthy' : 'unhealthy',
      uptime: summary.system.uptime,
      overview: {
        requests: summary.requests,
        performance: summary.performance,
        system: summary.system,
        alerts: summary.alerts
      },
      services: {
        cloudWatch: cloudWatchStatus,
        monitoring: {
          status: 'healthy',
          metricsCollected: true
        }
      },
      checks: summary.health.checks,
      recentAlerts: monitoring.getMetrics().alerts.slice(-5)
    };

    res.json(dashboard);
  } catch (error) {
    logger.error('Failed to get dashboard data', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * WebSocket endpoint for real-time monitoring
 */
router.ws = io => {
  const monitoring = getMonitoring();

  // Send metrics every 30 seconds
  setInterval(() => {
    try {
      const summary = monitoring.getMetricsSummary();
      io.emit('metrics-update', {
        timestamp: new Date().toISOString(),
        ...summary
      });
    } catch (error) {
      logger.error('Failed to emit metrics update', error);
    }
  }, 30000);

  // Listen for alerts
  monitoring.on('alert', alert => {
    io.emit('alert', alert);
  });
};

export default router;
