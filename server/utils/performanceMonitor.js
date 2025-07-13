/**
 * Performance Monitoring Utility
 * Tracks system performance metrics and provides optimization insights
 */

import { EventEmitter } from 'events';
import { createLogger } from './logger.js';

const logger = createLogger('performance-monitor');

export class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      interval: options.interval || 10000, // 10 seconds
      maxMetrics: options.maxMetrics || 1000,
      enableAutoOptimization: options.enableAutoOptimization !== false,
      ...options
    };

    this.metrics = new Map();
    this.timers = new Map();
    this.counters = new Map();
    this.isMonitoring = false;
    this.systemStats = {
      startTime: Date.now(),
      memoryPeaks: [],
      cpuHistory: [],
      requestLatency: []
    };
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.options.interval);

    logger.info('Performance monitoring started');
    this.emit('started');
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('Performance monitoring stopped');
    this.emit('stopped');
  }

  /**
   * Start timing an operation
   */
  startTimer(name, metadata = {}) {
    const timer = {
      name,
      startTime: process.hrtime.bigint(),
      metadata
    };

    this.timers.set(name, timer);
    return timer;
  }

  /**
   * End timing and record metric
   */
  endTimer(name) {
    const timer = this.timers.get(name);
    if (!timer) {
      logger.warn(`Timer '${name}' not found`);
      return null;
    }

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - timer.startTime) / 1e6; // Convert to milliseconds

    this.recordMetric('timer', name, duration, timer.metadata);
    this.timers.delete(name);

    return { name, duration, metadata: timer.metadata };
  }

  /**
   * Record a custom metric
   */
  recordMetric(type, name, value, metadata = {}) {
    const metric = {
      type,
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    const key = `${type}:${name}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metricArray = this.metrics.get(key);
    metricArray.push(metric);

    // Keep only recent metrics
    if (metricArray.length > this.options.maxMetrics) {
      metricArray.shift();
    }

    this.emit('metric', metric);

    // Check for performance issues
    if (this.options.enableAutoOptimization) {
      this.analyzeMetric(metric);
    }
  }

  /**
   * Increment a counter
   */
  increment(name, value = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);

    this.recordMetric('counter', name, current + value);
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Record memory metrics
    this.recordMetric('memory', 'rss', memUsage.rss);
    this.recordMetric('memory', 'heapUsed', memUsage.heapUsed);
    this.recordMetric('memory', 'heapTotal', memUsage.heapTotal);
    this.recordMetric('memory', 'external', memUsage.external);

    // Track memory peaks
    this.systemStats.memoryPeaks.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed
    });

    // Keep only last 100 measurements
    if (this.systemStats.memoryPeaks.length > 100) {
      this.systemStats.memoryPeaks.shift();
    }

    // Record CPU metrics
    this.recordMetric('cpu', 'user', cpuUsage.user);
    this.recordMetric('cpu', 'system', cpuUsage.system);

    // Event loop lag
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6;
      this.recordMetric('eventloop', 'lag', lag);
    });
  }

  /**
   * Analyze metric for performance issues
   */
  analyzeMetric(metric) {
    const { type, name, value } = metric;

    // Memory pressure detection
    if (type === 'memory' && name === 'heapUsed') {
      const heapMB = value / 1024 / 1024;
      if (heapMB > 500) {
        // 500MB threshold
        this.emit('alert', {
          level: 'warning',
          type: 'memory_pressure',
          message: `High heap usage: ${Math.round(heapMB)}MB`,
          value: heapMB
        });
      }
    }

    // Slow timer detection
    if (type === 'timer' && value > 1000) {
      // 1 second threshold
      this.emit('alert', {
        level: 'warning',
        type: 'slow_operation',
        message: `Slow operation detected: ${name} took ${Math.round(value)}ms`,
        operation: name,
        duration: value
      });
    }

    // Event loop lag detection
    if (type === 'eventloop' && name === 'lag' && value > 100) {
      // 100ms threshold
      this.emit('alert', {
        level: 'critical',
        type: 'event_loop_lag',
        message: `High event loop lag: ${Math.round(value)}ms`,
        lag: value
      });
    }
  }

  /**
   * Get metric statistics
   */
  getStats(type, name) {
    const key = `${type}:${name}`;
    const metrics = this.metrics.get(key) || [];

    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const sorted = [...values].sort((a, b) => a - b);

    return {
      count: metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      recent: metrics.slice(-10) // Last 10 measurements
    };
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const uptime = Date.now() - this.systemStats.startTime;
    const memUsage = process.memoryUsage();

    return {
      uptime: uptime,
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
      },
      metrics: {
        timers: this.timers.size,
        counters: this.counters.size,
        totalMetrics: Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0)
      },
      topOperations: this.getTopOperations(),
      memoryTrend: this.getMemoryTrend()
    };
  }

  /**
   * Get top slow operations
   */
  getTopOperations(limit = 5) {
    const operations = new Map();

    for (const [key, metrics] of this.metrics.entries()) {
      if (key.startsWith('timer:')) {
        const name = key.substring(6);
        const stats = this.getStats('timer', name);
        if (stats) {
          operations.set(name, stats);
        }
      }
    }

    return Array.from(operations.entries())
      .sort((a, b) => b[1].avg - a[1].avg)
      .slice(0, limit)
      .map(([name, stats]) => ({ name, ...stats }));
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend() {
    const recent = this.systemStats.memoryPeaks.slice(-10);
    if (recent.length < 2) return 'insufficient_data';

    const first = recent[0].heapUsed;
    const last = recent[recent.length - 1].heapUsed;
    const change = ((last - first) / first) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Express middleware for automatic request timing
   */
  requestMiddleware() {
    return (req, res, next) => {
      const requestId = `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timer = this.startTimer(requestId, {
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent')
      });

      res.on('finish', () => {
        const result = this.endTimer(requestId);
        if (result) {
          this.recordMetric('http', 'request', result.duration, {
            ...result.metadata,
            statusCode: res.statusCode,
            contentLength: res.get('content-length')
          });
        }
      });

      next();
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.timers.clear();
    this.counters.clear();
    this.systemStats.memoryPeaks = [];
    this.systemStats.cpuHistory = [];
    this.systemStats.requestLatency = [];

    logger.info('Performance metrics cleared');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
