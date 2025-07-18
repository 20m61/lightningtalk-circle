/**
 * CloudWatch Integration Service
 * Provides structured logging and custom metrics for production monitoring
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('CloudWatch');

export class CloudWatchService {
  constructor() {
    this.isEnabled = process.env.ENABLE_CLOUDWATCH_LOGS === 'true';
    this.environment = process.env.NODE_ENV || 'development';
    this.logGroup = process.env.CLOUDWATCH_LOG_GROUP || '/aws/lambda/lightningtalk-circle';
    this.region = process.env.AWS_REGION || 'ap-northeast-1';

    // Initialize CloudWatch client only if AWS SDK is available
    this.cloudWatch = null;
    this.cloudWatchLogs = null;

    if (this.isEnabled) {
      this.initializeAWS();
    }
  }

  /**
   * Initialize AWS SDK clients
   */
  async initializeAWS() {
    try {
      // Dynamic import to handle optional AWS dependency
      const AWS = await import('@aws-sdk/client-cloudwatch');
      const CloudWatchLogs = await import('@aws-sdk/client-cloudwatch-logs');

      this.cloudWatch = new AWS.CloudWatchClient({ region: this.region });
      this.cloudWatchLogs = new CloudWatchLogs.CloudWatchLogsClient({ region: this.region });

      logger.info('CloudWatch service initialized', {
        region: this.region,
        logGroup: this.logGroup
      });
    } catch (error) {
      logger.warn('CloudWatch SDK not available, using local logging only', {
        error: error.message
      });
      this.isEnabled = false;
    }
  }

  /**
   * Send structured log to CloudWatch
   */
  async logEvent(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: this.environment,
      service: 'lightningtalk-circle',
      ...metadata
    };

    // Always log locally
    logger[level.toLowerCase()](message, metadata);

    // Send to CloudWatch if enabled
    if (this.isEnabled && this.cloudWatchLogs) {
      try {
        await this.sendLogToCloudWatch(logEntry);
      } catch (error) {
        logger.error('Failed to send log to CloudWatch', { error: error.message });
      }
    }
  }

  /**
   * Send log entry to CloudWatch Logs
   */
  async sendLogToCloudWatch(logEntry) {
    try {
      const { PutLogEventsCommand } = await import('@aws-sdk/client-cloudwatch-logs');

      const command = new PutLogEventsCommand({
        logGroupName: this.logGroup,
        logStreamName: `${this.environment}-${new Date().toISOString().split('T')[0]}`,
        logEvents: [
          {
            timestamp: Date.now(),
            message: JSON.stringify(logEntry)
          }
        ]
      });

      await this.cloudWatchLogs.send(command);
    } catch (error) {
      // Don't throw here to avoid cascading failures
      logger.warn('CloudWatch log submission failed', { error: error.message });
    }
  }

  /**
   * Send custom metric to CloudWatch
   */
  async sendMetric(metricName, value, unit = 'Count', dimensions = {}) {
    if (!this.isEnabled || !this.cloudWatch) {
      logger.debug('CloudWatch metrics disabled, metric not sent', { metricName, value });
      return;
    }

    try {
      const { PutMetricDataCommand } = await import('@aws-sdk/client-cloudwatch');

      const metricData = {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: Object.entries(dimensions).map(([name, value]) => ({
          Name: name,
          Value: String(value)
        }))
      };

      const command = new PutMetricDataCommand({
        Namespace: 'LightningTalkCircle/Application',
        MetricData: [metricData]
      });

      await this.cloudWatch.send(command);
      logger.debug('Metric sent to CloudWatch', { metricName, value, unit });
    } catch (error) {
      logger.error('Failed to send metric to CloudWatch', {
        error: error.message,
        metricName,
        value
      });
    }
  }

  /**
   * Send multiple metrics in batch
   */
  async sendMetricsBatch(metrics) {
    if (!this.isEnabled || !this.cloudWatch || !Array.isArray(metrics)) {
      return;
    }

    try {
      const { PutMetricDataCommand } = await import('@aws-sdk/client-cloudwatch');

      const metricData = metrics.map(metric => ({
        MetricName: metric.name,
        Value: metric.value,
        Unit: metric.unit || 'Count',
        Timestamp: new Date(),
        Dimensions: Object.entries(metric.dimensions || {}).map(([name, value]) => ({
          Name: name,
          Value: String(value)
        }))
      }));

      const command = new PutMetricDataCommand({
        Namespace: 'LightningTalkCircle/Application',
        MetricData: metricData
      });

      await this.cloudWatch.send(command);
      logger.debug('Metrics batch sent to CloudWatch', { count: metrics.length });
    } catch (error) {
      logger.error('Failed to send metrics batch to CloudWatch', { error: error.message });
    }
  }

  /**
   * Log API request metrics
   */
  async logAPIRequest(req, res, duration) {
    const metadata = {
      method: req.method,
      endpoint: req.route?.path || req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    };

    // Determine log level based on status code
    let level = 'INFO';
    if (res.statusCode >= 500) {
      level = 'ERROR';
    } else if (res.statusCode >= 400) {
      level = 'WARN';
    }

    await this.logEvent(level, 'API Request', metadata);

    // Send metrics
    const metrics = [
      {
        name: 'APIRequest',
        value: 1,
        dimensions: {
          method: req.method,
          endpoint: req.route?.path || req.path,
          statusCode: res.statusCode
        }
      },
      {
        name: 'ResponseTime',
        value: duration,
        unit: 'Milliseconds',
        dimensions: {
          endpoint: req.route?.path || req.path
        }
      }
    ];

    if (res.statusCode >= 400) {
      metrics.push({
        name: 'APIError',
        value: 1,
        dimensions: {
          statusCode: res.statusCode,
          endpoint: req.route?.path || req.path
        }
      });
    }

    await this.sendMetricsBatch(metrics);
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(type, success, metadata = {}) {
    const level = success ? 'INFO' : 'WARN';
    await this.logEvent(level, `Authentication ${type}`, {
      success,
      authType: type,
      ...metadata
    });

    await this.sendMetric('AuthEvent', 1, 'Count', {
      type,
      success: success ? 'true' : 'false'
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(eventType, severity, details = {}) {
    const level = severity === 'critical' ? 'ERROR' : 'WARN';
    await this.logEvent(level, `Security Event: ${eventType}`, {
      eventType,
      severity,
      ...details
    });

    await this.sendMetric('SecurityEvent', 1, 'Count', {
      eventType,
      severity
    });
  }

  /**
   * Log business metrics
   */
  async logBusinessMetric(eventType, value = 1, metadata = {}) {
    await this.logEvent('INFO', `Business Metric: ${eventType}`, {
      eventType,
      value,
      ...metadata
    });

    await this.sendMetric('BusinessMetric', value, 'Count', {
      eventType
    });
  }

  /**
   * Log performance metrics
   */
  async logPerformanceMetric(operation, duration, success = true, metadata = {}) {
    const level = success ? 'INFO' : 'WARN';
    await this.logEvent(level, `Performance: ${operation}`, {
      operation,
      duration,
      success,
      ...metadata
    });

    const metrics = [
      {
        name: 'OperationDuration',
        value: duration,
        unit: 'Milliseconds',
        dimensions: { operation }
      }
    ];

    if (!success) {
      metrics.push({
        name: 'OperationFailure',
        value: 1,
        dimensions: { operation }
      });
    }

    await this.sendMetricsBatch(metrics);
  }

  /**
   * Create CloudWatch alarm
   */
  async createAlarm(alarmName, config) {
    if (!this.isEnabled || !this.cloudWatch) {
      logger.debug('CloudWatch disabled, alarm not created', { alarmName });
      return;
    }

    try {
      const { PutMetricAlarmCommand } = await import('@aws-sdk/client-cloudwatch');

      const command = new PutMetricAlarmCommand({
        AlarmName: alarmName,
        AlarmDescription: config.description || `Alarm for ${alarmName}`,
        MetricName: config.metricName,
        Namespace: config.namespace || 'LightningTalkCircle/Application',
        Statistic: config.statistic || 'Sum',
        Period: config.period || 300,
        EvaluationPeriods: config.evaluationPeriods || 1,
        Threshold: config.threshold,
        ComparisonOperator: config.comparisonOperator || 'GreaterThanThreshold',
        AlarmActions: config.alarmActions || [],
        Dimensions: Object.entries(config.dimensions || {}).map(([name, value]) => ({
          Name: name,
          Value: String(value)
        }))
      });

      await this.cloudWatch.send(command);
      logger.info('CloudWatch alarm created', { alarmName });
    } catch (error) {
      logger.error('Failed to create CloudWatch alarm', {
        error: error.message,
        alarmName
      });
    }
  }

  /**
   * Create standard application alarms
   */
  async createStandardAlarms() {
    const alarms = [
      {
        name: 'HighErrorRate',
        config: {
          metricName: 'APIError',
          threshold: 10,
          evaluationPeriods: 2,
          description: 'High API error rate detected'
        }
      },
      {
        name: 'SlowResponseTime',
        config: {
          metricName: 'ResponseTime',
          threshold: 2000,
          statistic: 'Average',
          description: 'Slow API response times detected'
        }
      },
      {
        name: 'AuthenticationFailures',
        config: {
          metricName: 'AuthEvent',
          threshold: 20,
          dimensions: { success: 'false' },
          description: 'High authentication failure rate'
        }
      }
    ];

    for (const alarm of alarms) {
      await this.createAlarm(alarm.name, alarm.config);
    }
  }

  /**
   * Health check for CloudWatch service
   */
  getHealthStatus() {
    return {
      cloudWatchEnabled: this.isEnabled,
      region: this.region,
      logGroup: this.logGroup,
      environment: this.environment,
      status: this.isEnabled ? 'healthy' : 'disabled'
    };
  }
}

// Export singleton instance
let cloudWatchInstance;

export function initializeCloudWatch() {
  if (!cloudWatchInstance) {
    cloudWatchInstance = new CloudWatchService();
  }
  return cloudWatchInstance;
}

export function getCloudWatch() {
  if (!cloudWatchInstance) {
    cloudWatchInstance = new CloudWatchService();
  }
  return cloudWatchInstance;
}
