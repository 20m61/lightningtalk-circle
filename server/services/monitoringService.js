/**
 * Monitoring Service
 * Provides health checks, metrics collection, and alerting capabilities
 */

import { EventEmitter } from 'events';
import os from 'os';
import { logger } from '../utils/logger.js';

export class MonitoringService extends EventEmitter {
  constructor(database) {
    super();
    this.database = database;
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byEndpoint: {},
        byStatus: {}
      },
      performance: {
        responseTimes: [],
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      },
      system: {
        cpu: 0,
        memory: {
          used: 0,
          total: 0,
          percentage: 0
        },
        uptime: 0
      },
      database: {
        connectionStatus: 'unknown',
        queryCount: 0,
        errorCount: 0
      },
      errors: [],
      alerts: []
    };

    this.thresholds = {
      errorRate: 0.05, // 5% error rate
      responseTime: 1000, // 1 second
      memoryUsage: 0.8, // 80% memory usage
      cpuUsage: 0.8 // 80% CPU usage
    };

    this.alertCooldown = new Map(); // Prevent alert spam
    this.startTime = Date.now();

    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  /**
   * Record an HTTP request
   */
  recordRequest(method, endpoint, status, duration) {
    this.metrics.requests.total++;

    if (status >= 200 && status < 400) {
      this.metrics.requests.success++;
    } else if (status >= 400) {
      this.metrics.requests.error++;
    }

    // Track by endpoint
    const key = `${method} ${endpoint}`;
    if (!this.metrics.requests.byEndpoint[key]) {
      this.metrics.requests.byEndpoint[key] = {
        total: 0,
        success: 0,
        error: 0,
        avgDuration: 0,
        durations: []
      };
    }

    const endpointMetrics = this.metrics.requests.byEndpoint[key];
    endpointMetrics.total++;
    if (status < 400) endpointMetrics.success++;
    else endpointMetrics.error++;

    endpointMetrics.durations.push(duration);
    if (endpointMetrics.durations.length > 100) {
      endpointMetrics.durations.shift(); // Keep last 100
    }
    endpointMetrics.avgDuration =
      endpointMetrics.durations.reduce((a, b) => a + b, 0) / endpointMetrics.durations.length;

    // Track by status code
    this.metrics.requests.byStatus[status] = (this.metrics.requests.byStatus[status] || 0) + 1;

    // Update performance metrics with size limit
    this.metrics.performance.responseTimes.push(duration);
    
    // Prevent memory leak by limiting array size
    const MAX_RESPONSE_TIMES = 1000;
    if (this.metrics.performance.responseTimes.length > MAX_RESPONSE_TIMES) {
      this.metrics.performance.responseTimes = 
        this.metrics.performance.responseTimes.slice(-MAX_RESPONSE_TIMES);
    }

    this.calculatePerformanceMetrics();
    this.checkThresholds();
  }

  /**
   * Record an error
   */
  recordError(error, context = {}) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      type: error.name || 'Error'
    };

    this.metrics.errors.push(errorRecord);

    // Keep last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift();
    }

    logger.error('Monitored error:', errorRecord);

    // Check if this warrants an alert
    this.checkErrorThreshold();
  }

  /**
   * Calculate performance percentiles
   */
  calculatePerformanceMetrics() {
    const times = [...this.metrics.performance.responseTimes].sort((a, b) => a - b);
    const len = times.length;

    if (len === 0) return;

    this.metrics.performance.averageResponseTime = times.reduce((a, b) => a + b, 0) / len;

    this.metrics.performance.p95ResponseTime = times[Math.floor(len * 0.95)];
    this.metrics.performance.p99ResponseTime = times[Math.floor(len * 0.99)];
  }

  /**
   * Start periodic system metrics collection
   */
  startMetricsCollection() {
    // Collect system metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkDatabaseHealth();
    }, 30000);

    // Allow cleanup
    if (this.metricsInterval.unref) {
      this.metricsInterval.unref();
    }

    // Initial collection
    this.collectSystemMetrics();
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    // CPU usage
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    this.metrics.system.cpu = 1 - totalIdle / totalTick;

    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    this.metrics.system.memory = {
      used: usedMem,
      total: totalMem,
      percentage: usedMem / totalMem
    };

    // Uptime
    this.metrics.system.uptime = Date.now() - this.startTime;

    // Process-specific memory
    const processMemory = process.memoryUsage();
    this.metrics.system.processMemory = {
      rss: processMemory.rss,
      heapTotal: processMemory.heapTotal,
      heapUsed: processMemory.heapUsed,
      external: processMemory.external
    };
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      await this.database.findAll('events', { limit: 1 });
      const duration = Date.now() - startTime;

      this.metrics.database.connectionStatus = 'healthy';
      this.metrics.database.queryCount++;

      if (duration > 1000) {
        this.createAlert('warning', 'Slow database query', {
          duration,
          threshold: 1000
        });
      }
    } catch (error) {
      this.metrics.database.connectionStatus = 'unhealthy';
      this.metrics.database.errorCount++;
      this.createAlert('critical', 'Database connection failed', {
        error: error.message
      });
    }
  }

  /**
   * Check various thresholds and create alerts
   */
  checkThresholds() {
    // Error rate
    const errorRate = this.metrics.requests.error / this.metrics.requests.total;
    if (errorRate > this.thresholds.errorRate && this.metrics.requests.total > 100) {
      this.createAlert('high', 'High error rate detected', {
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
        threshold: `${this.thresholds.errorRate * 100}%`
      });
    }

    // Response time
    if (this.metrics.performance.p95ResponseTime > this.thresholds.responseTime) {
      this.createAlert('medium', 'Slow response times', {
        p95: `${this.metrics.performance.p95ResponseTime}ms`,
        threshold: `${this.thresholds.responseTime}ms`
      });
    }

    // Memory usage
    if (this.metrics.system.memory.percentage > this.thresholds.memoryUsage) {
      this.createAlert('high', 'High memory usage', {
        usage: `${(this.metrics.system.memory.percentage * 100).toFixed(2)}%`,
        threshold: `${this.thresholds.memoryUsage * 100}%`
      });
    }

    // CPU usage
    if (this.metrics.system.cpu > this.thresholds.cpuUsage) {
      this.createAlert('medium', 'High CPU usage', {
        usage: `${(this.metrics.system.cpu * 100).toFixed(2)}%`,
        threshold: `${this.thresholds.cpuUsage * 100}%`
      });
    }
  }

  /**
   * Check error threshold
   */
  checkErrorThreshold() {
    const recentErrors = this.metrics.errors.filter(
      e => new Date(e.timestamp) > new Date(Date.now() - 300000) // Last 5 minutes
    );

    if (recentErrors.length > 10) {
      this.createAlert('high', 'High error frequency', {
        errorCount: recentErrors.length,
        timeWindow: '5 minutes'
      });
    }
  }

  /**
   * Create an alert
   */
  createAlert(severity, message, details = {}) {
    const alertKey = `${severity}-${message}`;
    const lastAlert = this.alertCooldown.get(alertKey);

    // Prevent spam - minimum 5 minutes between same alerts
    if (lastAlert && Date.now() - lastAlert < 300000) {
      return;
    }

    const alert = {
      timestamp: new Date().toISOString(),
      severity,
      message,
      details,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.metrics.alerts.push(alert);

    // Keep last 50 alerts
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts.shift();
    }

    this.alertCooldown.set(alertKey, Date.now());

    // Emit alert event
    this.emit('alert', alert);

    // Log critical alerts
    if (severity === 'critical' || severity === 'high') {
      logger.error(`ALERT [${severity}]: ${message}`, details);
    } else {
      logger.warn(`ALERT [${severity}]: ${message}`, details);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    const recentErrors = this.metrics.errors.filter(
      e => new Date(e.timestamp) > new Date(Date.now() - 300000)
    ).length;

    const errorRate =
      this.metrics.requests.total > 0
        ? this.metrics.requests.error / this.metrics.requests.total
        : 0;

    const status = {
      healthy: true,
      timestamp: new Date().toISOString(),
      uptime: this.metrics.system.uptime,
      checks: {
        database: this.metrics.database.connectionStatus === 'healthy',
        errorRate: errorRate < this.thresholds.errorRate,
        responseTime: this.metrics.performance.p95ResponseTime < this.thresholds.responseTime,
        memory: this.metrics.system.memory.percentage < this.thresholds.memoryUsage,
        recentErrors: recentErrors < 10
      }
    };

    // Overall health is false if any check fails
    status.healthy = Object.values(status.checks).every(check => check === true);

    return status;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      health: this.getHealthStatus()
    };
  }

  /**
   * Get metrics summary for dashboard
   */
  getMetricsSummary() {
    const errorRate =
      this.metrics.requests.total > 0
        ? ((this.metrics.requests.error / this.metrics.requests.total) * 100).toFixed(2)
        : 0;

    return {
      requests: {
        total: this.metrics.requests.total,
        successRate: `${100 - errorRate}%`,
        errorRate: `${errorRate}%`
      },
      performance: {
        average: `${Math.round(this.metrics.performance.averageResponseTime)}ms`,
        p95: `${Math.round(this.metrics.performance.p95ResponseTime)}ms`,
        p99: `${Math.round(this.metrics.performance.p99ResponseTime)}ms`
      },
      system: {
        cpu: `${(this.metrics.system.cpu * 100).toFixed(2)}%`,
        memory: `${(this.metrics.system.memory.percentage * 100).toFixed(2)}%`,
        uptime: this.formatUptime(this.metrics.system.uptime)
      },
      alerts: {
        total: this.metrics.alerts.length,
        critical: this.metrics.alerts.filter(a => a.severity === 'critical').length,
        high: this.metrics.alerts.filter(a => a.severity === 'high').length
      },
      health: this.getHealthStatus()
    };
  }

  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Clean up
   */
  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}

// Export singleton instance
let monitoringInstance;

export function initializeMonitoring(database) {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringService(database);
  }
  return monitoringInstance;
}

export function getMonitoring() {
  if (!monitoringInstance) {
    throw new Error('Monitoring service not initialized');
  }
  return monitoringInstance;
}
