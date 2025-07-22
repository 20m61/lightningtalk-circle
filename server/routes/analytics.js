/**
 * Analytics API Routes
 * アナリティクスデータの収集と処理
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const logger = createLogger('Analytics');

// In-memory storage for demo (replace with database in production)
const analyticsStore = {
  events: [],
  metrics: [],
  errors: [],
  sessions: new Map(),
  aggregated: {
    pageViews: 0,
    uniqueUsers: new Set(),
    averageLoadTime: 0,
    errorRate: 0
  }
};

// Analytics data validation
const validateAnalyticsData = [
  body('events').optional().isArray(),
  body('metrics').optional().isArray(),
  body('errors').optional().isArray(),
  body('context').isObject(),
  body('context.sessionId').notEmpty(),
  body('context.userId').notEmpty()
];

/**
 * POST /api/analytics
 * Receive analytics data from client
 */
router.post('/', validateAnalyticsData, async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { events = [], metrics = [], errors: clientErrors = [], context } = req.body;
    const timestamp = Date.now();

    // Process events
    events.forEach(event => {
      const processedEvent = {
        id: uuidv4(),
        ...event,
        serverTimestamp: timestamp,
        ip: req.ip,
        ...context
      };

      analyticsStore.events.push(processedEvent);

      // Update aggregated data
      if (event.type === 'pageView') {
        analyticsStore.aggregated.pageViews++;
        analyticsStore.aggregated.uniqueUsers.add(context.userId);
      }
    });

    // Process performance metrics
    metrics.forEach(metric => {
      const processedMetric = {
        id: uuidv4(),
        ...metric,
        serverTimestamp: timestamp,
        ...context
      };

      analyticsStore.metrics.push(processedMetric);

      // Update average load time
      if (metric.type === 'navigation' && metric.data.totalTime) {
        const currentAvg = analyticsStore.aggregated.averageLoadTime;
        const count = analyticsStore.metrics.filter(
          m => m.type === 'navigation' && m.data.totalTime
        ).length;
        analyticsStore.aggregated.averageLoadTime =
          (currentAvg * (count - 1) + metric.data.totalTime) / count;
      }
    });

    // Process errors
    clientErrors.forEach(error => {
      const processedError = {
        id: uuidv4(),
        ...error,
        serverTimestamp: timestamp,
        resolved: false,
        ...context
      };

      analyticsStore.errors.push(processedError);

      // Log critical errors
      if (error.type === 'javascript') {
        logger.error('Client JavaScript Error', {
          message: error.message,
          url: error.source,
          line: error.line,
          userAgent: context.userAgent
        });
      }
    });

    // Update session info
    updateSession(context.sessionId, {
      lastActivity: timestamp,
      userId: context.userId,
      pageViews: events.filter(e => e.type === 'pageView').length,
      errors: clientErrors.length
    });

    // Send response
    res.json({
      success: true,
      processed: {
        events: events.length,
        metrics: metrics.length,
        errors: clientErrors.length
      }
    });
  } catch (error) {
    logger.error('Analytics processing error:', error);
    res.status(500).json({ error: 'Failed to process analytics data' });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get analytics dashboard data
 */
router.get('/dashboard', async(req, res) => {
  try {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Calculate real-time metrics
    const recentEvents = analyticsStore.events.filter(e => e.serverTimestamp > oneHourAgo);
    const recentErrors = analyticsStore.errors.filter(e => e.serverTimestamp > oneHourAgo);
    const activeSessions = Array.from(analyticsStore.sessions.values()).filter(
      s => s.lastActivity > oneHourAgo
    );

    // Performance metrics
    const performanceMetrics = calculatePerformanceMetrics();

    // Error analytics
    const errorAnalytics = calculateErrorAnalytics();

    // User behavior
    const userBehavior = calculateUserBehavior();

    const dashboard = {
      overview: {
        totalPageViews: analyticsStore.aggregated.pageViews,
        uniqueUsers: analyticsStore.aggregated.uniqueUsers.size,
        activeSessions: activeSessions.length,
        averageLoadTime: Math.round(analyticsStore.aggregated.averageLoadTime),
        errorRate: calculateErrorRate(),
        timestamp: now
      },
      realtime: {
        activeUsers: activeSessions.length,
        pageViewsLastHour: recentEvents.filter(e => e.type === 'pageView').length,
        errorsLastHour: recentErrors.length,
        topPages: getTopPages(recentEvents)
      },
      performance: performanceMetrics,
      errors: errorAnalytics,
      userBehavior
    };

    res.json(dashboard);
  } catch (error) {
    logger.error('Dashboard generation error:', error);
    res.status(500).json({ error: 'Failed to generate dashboard' });
  }
});

/**
 * GET /api/analytics/events
 * Get detailed event data with filtering
 */
router.get('/events', async(req, res) => {
  try {
    const {
      type,
      startTime = Date.now() - 24 * 60 * 60 * 1000,
      endTime = Date.now(),
      limit = 100
    } = req.query;

    let events = analyticsStore.events.filter(
      e => e.serverTimestamp >= startTime && e.serverTimestamp <= endTime
    );

    if (type) {
      events = events.filter(e => e.type === type);
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.serverTimestamp - a.serverTimestamp);

    // Apply limit
    events = events.slice(0, limit);

    res.json({
      events,
      total: events.length,
      query: { type, startTime, endTime, limit }
    });
  } catch (error) {
    logger.error('Events query error:', error);
    res.status(500).json({ error: 'Failed to query events' });
  }
});

/**
 * GET /api/analytics/performance
 * Get performance metrics
 */
router.get('/performance', async(req, res) => {
  try {
    const metrics = analyticsStore.metrics.filter(m => m.type === 'navigation');

    if (metrics.length === 0) {
      return res.json({ message: 'No performance data available' });
    }

    // Calculate percentiles
    const loadTimes = metrics.map(m => m.data.totalTime).sort((a, b) => a - b);
    const p50 = percentile(loadTimes, 50);
    const p75 = percentile(loadTimes, 75);
    const p95 = percentile(loadTimes, 95);
    const p99 = percentile(loadTimes, 99);

    // Web Vitals
    const webVitals = calculateWebVitals();

    // Resource breakdown
    const resourceBreakdown = calculateResourceBreakdown();

    res.json({
      summary: {
        sampleSize: metrics.length,
        averageLoadTime: Math.round(average(loadTimes)),
        medianLoadTime: Math.round(p50),
        percentiles: {
          p50: Math.round(p50),
          p75: Math.round(p75),
          p95: Math.round(p95),
          p99: Math.round(p99)
        }
      },
      webVitals,
      resourceBreakdown,
      timeSeries: generateTimeSeries(metrics)
    });
  } catch (error) {
    logger.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to calculate performance metrics' });
  }
});

/**
 * GET /api/analytics/errors
 * Get error analytics
 */
router.get('/errors', async(req, res) => {
  try {
    const { resolved = false } = req.query;

    let { errors } = analyticsStore;
    if (resolved !== undefined) {
      errors = errors.filter(e => e.resolved === (resolved === 'true'));
    }

    // Group errors by type and message
    const errorGroups = {};
    errors.forEach(error => {
      const key = `${error.type}:${error.message}`;
      if (!errorGroups[key]) {
        errorGroups[key] = {
          type: error.type,
          message: error.message,
          count: 0,
          firstSeen: error.serverTimestamp,
          lastSeen: error.serverTimestamp,
          examples: []
        };
      }

      errorGroups[key].count++;
      errorGroups[key].lastSeen = Math.max(errorGroups[key].lastSeen, error.serverTimestamp);

      if (errorGroups[key].examples.length < 3) {
        errorGroups[key].examples.push({
          id: error.id,
          url: error.url,
          userAgent: error.userAgent,
          timestamp: error.serverTimestamp
        });
      }
    });

    // Sort by frequency
    const sortedGroups = Object.values(errorGroups).sort((a, b) => b.count - a.count);

    res.json({
      totalErrors: errors.length,
      uniqueErrors: sortedGroups.length,
      errorGroups: sortedGroups,
      topErrors: sortedGroups.slice(0, 10)
    });
  } catch (error) {
    logger.error('Error analytics error:', error);
    res.status(500).json({ error: 'Failed to analyze errors' });
  }
});

/**
 * POST /api/analytics/errors/:id/resolve
 * Mark an error as resolved
 */
router.post('/errors/:id/resolve', async(req, res) => {
  try {
    const { id } = req.params;
    const error = analyticsStore.errors.find(e => e.id === id);

    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }

    error.resolved = true;
    error.resolvedAt = Date.now();
    error.resolvedBy = req.user?.id || 'system';

    res.json({ success: true, error });
  } catch (error) {
    logger.error('Error resolution error:', error);
    res.status(500).json({ error: 'Failed to resolve error' });
  }
});

// Helper functions
function updateSession(sessionId, data) {
  const existing = analyticsStore.sessions.get(sessionId) || {
    id: sessionId,
    startTime: Date.now(),
    pageViews: 0,
    errors: 0
  };

  analyticsStore.sessions.set(sessionId, {
    ...existing,
    ...data,
    pageViews: existing.pageViews + (data.pageViews || 0),
    errors: existing.errors + (data.errors || 0)
  });
}

function calculateErrorRate() {
  const totalRequests = analyticsStore.events.filter(
    e => e.type === 'pageView' || e.type === 'api'
  ).length;

  if (totalRequests === 0) {
    return 0;
  }

  return ((analyticsStore.errors.length / totalRequests) * 100).toFixed(2);
}

function getTopPages(events) {
  const pageCounts = {};
  events
    .filter(e => e.type === 'pageView')
    .forEach(e => {
      const { url } = e.data;
      pageCounts[url] = (pageCounts[url] || 0) + 1;
    });

  return Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([url, count]) => ({ url, count }));
}

function calculatePerformanceMetrics() {
  const navMetrics = analyticsStore.metrics.filter(m => m.type === 'navigation');
  if (navMetrics.length === 0) {
    return null;
  }

  const latest = navMetrics[navMetrics.length - 1].data;

  return {
    dns: Math.round(average(navMetrics.map(m => m.data.dns))),
    tcp: Math.round(average(navMetrics.map(m => m.data.tcp))),
    ttfb: Math.round(average(navMetrics.map(m => m.data.ttfb))),
    download: Math.round(average(navMetrics.map(m => m.data.download))),
    domParsing: Math.round(average(navMetrics.map(m => m.data.domParsing))),
    domComplete: Math.round(average(navMetrics.map(m => m.data.domComplete)))
  };
}

function calculateErrorAnalytics() {
  const errorsByType = {};
  analyticsStore.errors.forEach(error => {
    errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
  });

  return {
    total: analyticsStore.errors.length,
    byType: errorsByType,
    recent: analyticsStore.errors.slice(-10).reverse()
  };
}

function calculateUserBehavior() {
  const interactions = analyticsStore.events.filter(e => e.type === 'interaction');
  const scrollEvents = analyticsStore.events.filter(e => e.type === 'scrollDepth');

  const clicksByCategory = {};
  interactions.forEach(event => {
    if (event.data.category) {
      clicksByCategory[event.data.category] = (clicksByCategory[event.data.category] || 0) + 1;
    }
  });

  const avgScrollDepth = scrollEvents.length > 0 ? average(scrollEvents.map(e => e.data.depth)) : 0;

  return {
    totalInteractions: interactions.length,
    clicksByCategory,
    averageScrollDepth: Math.round(avgScrollDepth)
  };
}

function calculateWebVitals() {
  const webVitalMetrics = analyticsStore.metrics.filter(m => m.type === 'webVitals');
  if (webVitalMetrics.length === 0) {
    return null;
  }

  const lcp = webVitalMetrics.filter(m => m.data.lcp).map(m => m.data.lcp);

  const fid = webVitalMetrics.filter(m => m.data.fid).map(m => m.data.fid);

  const cls = analyticsStore.metrics
    .filter(m => m.type === 'layoutShift')
    .map(m => parseFloat(m.data.cls));

  return {
    lcp:
      lcp.length > 0
        ? {
          value: Math.round(average(lcp)),
          good: (lcp.filter(v => v <= 2500).length / lcp.length) * 100,
          needsImprovement: (lcp.filter(v => v > 2500 && v <= 4000).length / lcp.length) * 100,
          poor: (lcp.filter(v => v > 4000).length / lcp.length) * 100
        }
        : null,
    fid:
      fid.length > 0
        ? {
          value: Math.round(average(fid)),
          good: (fid.filter(v => v <= 100).length / fid.length) * 100,
          needsImprovement: (fid.filter(v => v > 100 && v <= 300).length / fid.length) * 100,
          poor: (fid.filter(v => v > 300).length / fid.length) * 100
        }
        : null,
    cls:
      cls.length > 0
        ? {
          value: average(cls).toFixed(3),
          good: (cls.filter(v => v <= 0.1).length / cls.length) * 100,
          needsImprovement: (cls.filter(v => v > 0.1 && v <= 0.25).length / cls.length) * 100,
          poor: (cls.filter(v => v > 0.25).length / cls.length) * 100
        }
        : null
  };
}

function calculateResourceBreakdown() {
  const resources = analyticsStore.metrics.filter(m => m.type === 'resources');
  if (resources.length === 0) {
    return null;
  }

  const latest = resources[resources.length - 1].data;
  const breakdown = {};

  Object.entries(latest).forEach(([type, data]) => {
    breakdown[type] = {
      count: data.count,
      averageDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
      totalSize: data.totalSize,
      slowResources: data.items
    };
  });

  return breakdown;
}

function generateTimeSeries(metrics) {
  const hourly = {};

  metrics.forEach(metric => {
    const hour = new Date(metric.serverTimestamp).setMinutes(0, 0, 0);
    if (!hourly[hour]) {
      hourly[hour] = {
        timestamp: hour,
        count: 0,
        totalLoadTime: 0
      };
    }
    hourly[hour].count++;
    hourly[hour].totalLoadTime += metric.data.totalTime;
  });

  return Object.values(hourly)
    .map(data => ({
      timestamp: data.timestamp,
      averageLoadTime: Math.round(data.totalLoadTime / data.count),
      count: data.count
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function percentile(arr, p) {
  if (arr.length === 0) {
    return 0;
  }
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[index];
}

function average(arr) {
  if (arr.length === 0) {
    return 0;
  }
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export default router;
