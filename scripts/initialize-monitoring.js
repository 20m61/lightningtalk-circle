#!/usr/bin/env node

/**
 * Monitoring Initialization Script
 * Sets up CloudWatch monitoring and creates standard alarms
 */

import { initializeCloudWatch } from '../server/services/cloudWatchService.js';
import { initializeMonitoring } from '../server/services/monitoringService.js';
import { createLogger } from '../server/utils/logger.js';

const logger = createLogger('MonitoringInit');

class MonitoringInitializer {
  constructor() {
    this.cloudWatch = null;
    this.monitoring = null;
  }

  /**
   * Initialize all monitoring services
   */
  async initialize() {
    try {
      logger.info('Initializing monitoring services...');

      // Initialize CloudWatch service
      this.cloudWatch = initializeCloudWatch();
      logger.info('CloudWatch service initialized', this.cloudWatch.getHealthStatus());

      // Initialize local monitoring service (mock database for standalone script)
      const mockDatabase = {
        findAll: async() => []
      };
      this.monitoring = initializeMonitoring(mockDatabase);
      logger.info('Local monitoring service initialized');

      // Create standard CloudWatch alarms if enabled
      if (this.cloudWatch.isEnabled) {
        await this.setupCloudWatchAlarms();
      } else {
        logger.warn('CloudWatch is disabled - alarms not created');
      }

      // Test CloudWatch connectivity
      await this.testCloudWatchConnectivity();

      logger.info('✅ Monitoring initialization completed successfully');
    } catch (error) {
      logger.error('❌ Monitoring initialization failed', error);
      throw error;
    }
  }

  /**
   * Set up standard CloudWatch alarms
   */
  async setupCloudWatchAlarms() {
    try {
      logger.info('Creating standard CloudWatch alarms...');
      await this.cloudWatch.createStandardAlarms();
      logger.info('Standard CloudWatch alarms created');
    } catch (error) {
      logger.error('Failed to create CloudWatch alarms', error);
      throw error;
    }
  }

  /**
   * Test CloudWatch connectivity
   */
  async testCloudWatchConnectivity() {
    try {
      if (!this.cloudWatch.isEnabled) {
        logger.info('CloudWatch disabled - skipping connectivity test');
        return;
      }

      logger.info('Testing CloudWatch connectivity...');

      // Test log event
      await this.cloudWatch.logEvent('INFO', 'Monitoring initialization test', {
        source: 'initialization-script',
        timestamp: new Date().toISOString()
      });

      // Test metric
      await this.cloudWatch.sendMetric('InitializationTest', 1, 'Count', {
        source: 'script'
      });

      logger.info('✅ CloudWatch connectivity test successful');
    } catch (error) {
      logger.error('❌ CloudWatch connectivity test failed', error);
      throw error;
    }
  }

  /**
   * Generate monitoring configuration summary
   */
  generateConfigSummary() {
    const config = {
      cloudWatch: this.cloudWatch.getHealthStatus(),
      monitoring: this.monitoring.getHealthStatus(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        AWS_REGION: process.env.AWS_REGION,
        ENABLE_CLOUDWATCH_LOGS: process.env.ENABLE_CLOUDWATCH_LOGS,
        ENABLE_CLOUDWATCH_METRICS: process.env.ENABLE_CLOUDWATCH_METRICS,
        CLOUDWATCH_LOG_GROUP: process.env.CLOUDWATCH_LOG_GROUP,
        CLOUDWATCH_NAMESPACE: process.env.CLOUDWATCH_NAMESPACE
      }
    };

    logger.info('Monitoring configuration summary:', config);
    return config;
  }

  /**
   * Set up monitoring event handlers
   */
  setupEventHandlers() {
    if (this.monitoring) {
      // Forward monitoring alerts to CloudWatch
      this.monitoring.on('alert', async alert => {
        try {
          await this.cloudWatch.logEvent('WARN', 'Monitoring Alert', {
            alert: {
              severity: alert.severity,
              message: alert.message,
              details: alert.details,
              timestamp: alert.timestamp
            }
          });
        } catch (error) {
          logger.error('Failed to forward alert to CloudWatch', error);
        }
      });

      logger.info('Monitoring event handlers configured');
    }
  }

  /**
   * Clean up monitoring services
   */
  cleanup() {
    if (this.monitoring) {
      this.monitoring.stop();
    }
    logger.info('Monitoring services cleaned up');
  }
}

/**
 * Main execution
 */
async function main() {
  const initializer = new MonitoringInitializer();

  try {
    // Initialize monitoring
    await initializer.initialize();

    // Generate configuration summary
    const config = initializer.generateConfigSummary();

    // Set up event handlers
    initializer.setupEventHandlers();

    // If running as a script (not imported), run tests and exit
    if (import.meta.url === `file://${process.argv[1]}`) {
      console.log('\n🔍 Monitoring Configuration Summary:');
      console.log(JSON.stringify(config, null, 2));

      // Clean up and exit
      initializer.cleanup();
      process.exit(0);
    }

    return initializer;
  } catch (error) {
    logger.error('Monitoring initialization failed:', error);
    process.exit(1);
  }
}

// Handle cleanup on process termination
process.on('SIGINT', () => {
  logger.info('Received SIGINT, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, cleaning up...');
  process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MonitoringInitializer, main };
export default MonitoringInitializer;
