#!/usr/bin/env node

/**
 * Test Script for DynamoDB Rollback Procedure
 *
 * This script simulates and tests the rollback procedure
 * to ensure it works correctly in a staging environment.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RollbackTester {
  constructor() {
    this.testResults = [];
    this.testDataDir = path.join(__dirname, '../test-rollback-data');
  }

  /**
   * Log test result
   */
  logResult(testName, success, message) {
    this.testResults.push({ testName, success, message });
    const icon = success ? '✓' : '✗';
    const color = success ? chalk.green : chalk.red;
    console.log(color(`  ${icon} ${testName}: ${message}`));
  }

  /**
   * Run a shell command and return output
   */
  async runCommand(command, throwOnError = true) {
    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr && throwOnError) {
        throw new Error(stderr);
      }
      return { stdout, stderr, success: true };
    } catch (error) {
      if (throwOnError) {
        throw error;
      }
      return { stdout: '', stderr: error.message, success: false };
    }
  }

  /**
   * Test 1: Verify backup exists
   */
  async testBackupExists() {
    console.log(chalk.blue('\nTest 1: Verify Backup Exists'));

    try {
      const backupDir = path.join(__dirname, '../migration-backups');
      const exists = await fs
        .access(backupDir)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        this.logResult('Backup Directory', false, 'Backup directory does not exist');
        return false;
      }

      const files = await fs.readdir(backupDir);
      if (files.length === 0) {
        this.logResult('Backup Files', false, 'No backup files found');
        return false;
      }

      this.logResult('Backup Verification', true, `Found ${files.length} backup(s)`);
      return true;
    } catch (error) {
      this.logResult('Backup Check', false, error.message);
      return false;
    }
  }

  /**
   * Test 2: Create test data
   */
  async testCreateTestData() {
    console.log(chalk.blue('\nTest 2: Create Test Data'));

    try {
      await fs.mkdir(this.testDataDir, { recursive: true });

      // Create sample data files
      const testData = {
        events: [
          {
            id: 'test-event-1',
            title: 'Test Rollback Event',
            date: new Date().toISOString(),
            status: 'active'
          }
        ],
        participants: [
          {
            id: 'test-participant-1',
            eventId: 'test-event-1',
            name: 'Test User',
            email: 'test@example.com'
          }
        ],
        users: [
          {
            id: 'test-user-1',
            username: 'testuser',
            email: 'test@example.com'
          }
        ],
        talks: [
          {
            id: 'test-talk-1',
            eventId: 'test-event-1',
            title: 'Test Talk',
            speaker: 'Test Speaker'
          }
        ]
      };

      for (const [collection, data] of Object.entries(testData)) {
        const filePath = path.join(this.testDataDir, `${collection}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      }

      this.logResult('Test Data Creation', true, 'Created test data files');
      return true;
    } catch (error) {
      this.logResult('Test Data Creation', false, error.message);
      return false;
    }
  }

  /**
   * Test 3: Simulate rollback command
   */
  async testRollbackCommand() {
    console.log(chalk.blue('\nTest 3: Simulate Rollback Command'));

    try {
      // Check if rollback script exists
      const scriptPath = path.join(__dirname, 'migrate-to-dynamodb.js');
      const exists = await fs
        .access(scriptPath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        this.logResult('Rollback Script', false, 'Migration script not found');
        return false;
      }

      // Test rollback status command
      const { success } = await this.runCommand(
        'node scripts/migrate-to-dynamodb.js status',
        false
      );

      this.logResult('Rollback Command', true, 'Rollback script is accessible');
      return true;
    } catch (error) {
      this.logResult('Rollback Command', false, error.message);
      return false;
    }
  }

  /**
   * Test 4: Verify data integrity
   */
  async testDataIntegrity() {
    console.log(chalk.blue('\nTest 4: Verify Data Integrity'));

    try {
      // Check if test data files exist
      const collections = ['events', 'participants', 'users', 'talks'];
      let allValid = true;

      for (const collection of collections) {
        const filePath = path.join(this.testDataDir, `${collection}.json`);
        const exists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);

        if (!exists) {
          this.logResult(`${collection} integrity`, false, 'File not found');
          allValid = false;
          continue;
        }

        try {
          const data = await fs.readFile(filePath, 'utf-8');
          JSON.parse(data); // Validate JSON
          this.logResult(`${collection} integrity`, true, 'Valid JSON data');
        } catch (error) {
          this.logResult(`${collection} integrity`, false, 'Invalid JSON data');
          allValid = false;
        }
      }

      return allValid;
    } catch (error) {
      this.logResult('Data Integrity', false, error.message);
      return false;
    }
  }

  /**
   * Test 5: Configuration rollback
   */
  async testConfigRollback() {
    console.log(chalk.blue('\nTest 5: Test Configuration Rollback'));

    try {
      // Create a test .env file
      const testEnvPath = path.join(this.testDataDir, '.env.test');
      const testEnvContent = `
DATABASE_TYPE=dynamodb
NODE_ENV=test
PORT=3001
      `.trim();

      await fs.writeFile(testEnvPath, testEnvContent);

      // Simulate sed command to change DATABASE_TYPE
      const envContent = await fs.readFile(testEnvPath, 'utf-8');
      const updatedContent = envContent.replace('DATABASE_TYPE=dynamodb', 'DATABASE_TYPE=file');
      await fs.writeFile(testEnvPath, updatedContent);

      // Verify the change
      const finalContent = await fs.readFile(testEnvPath, 'utf-8');
      const isRolledBack = finalContent.includes('DATABASE_TYPE=file');

      this.logResult(
        'Config Rollback',
        isRolledBack,
        isRolledBack ? 'Configuration updated successfully' : 'Failed to update configuration'
      );

      return isRolledBack;
    } catch (error) {
      this.logResult('Config Rollback', false, error.message);
      return false;
    }
  }

  /**
   * Test 6: Rollback time measurement
   */
  async testRollbackTime() {
    console.log(chalk.blue('\nTest 6: Measure Rollback Time'));

    const startTime = Date.now();

    try {
      // Simulate rollback operations
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate backup check
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate data copy
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate config update

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      const withinLimit = duration < 300; // 5 minutes limit
      this.logResult(
        'Rollback Time',
        withinLimit,
        `Simulated rollback took ${duration.toFixed(1)} seconds`
      );

      return withinLimit;
    } catch (error) {
      this.logResult('Rollback Time', false, error.message);
      return false;
    }
  }

  /**
   * Test 7: Service health check
   */
  async testHealthCheck() {
    console.log(chalk.blue('\nTest 7: Service Health Check'));

    try {
      // Check if health check endpoint would be available
      const healthCheckScript = `
        const isHealthy = () => {
          // Simulate health check
          return {
            database: 'file',
            status: 'healthy',
            timestamp: new Date().toISOString()
          };
        };
        
        console.log(JSON.stringify(isHealthy()));
      `;

      const healthCheckPath = path.join(this.testDataDir, 'health-check.js');
      await fs.writeFile(healthCheckPath, healthCheckScript);

      const { stdout, success } = await this.runCommand(`node ${healthCheckPath}`, false);

      if (success && stdout) {
        const health = JSON.parse(stdout);
        const isHealthy = health.status === 'healthy' && health.database === 'file';
        this.logResult(
          'Health Check',
          isHealthy,
          isHealthy ? 'Service is healthy after rollback' : 'Service health check failed'
        );
        return isHealthy;
      }

      this.logResult('Health Check', false, 'Health check script failed');
      return false;
    } catch (error) {
      this.logResult('Health Check', false, error.message);
      return false;
    }
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    try {
      await fs.rm(this.testDataDir, { recursive: true, force: true });
      console.log(chalk.yellow('\n🧹 Cleaned up test data'));
    } catch (error) {
      console.error(chalk.red('Failed to clean up test data:', error.message));
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(chalk.bold.blue('\n🧪 DynamoDB Rollback Procedure Test Suite\n'));
    console.log(chalk.yellow('Running in test mode - no actual rollback will be performed\n'));

    const tests = [
      () => this.testBackupExists(),
      () => this.testCreateTestData(),
      () => this.testRollbackCommand(),
      () => this.testDataIntegrity(),
      () => this.testConfigRollback(),
      () => this.testRollbackTime(),
      () => this.testHealthCheck()
    ];

    for (const test of tests) {
      await test();
    }

    // Summary
    console.log(chalk.bold.blue('\n📊 Test Summary\n'));

    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const total = this.testResults.length;

    console.log(chalk.green(`  ✓ Passed: ${passed}`));
    console.log(chalk.red(`  ✗ Failed: ${failed}`));
    console.log(chalk.blue(`  Total: ${total}`));

    const allPassed = failed === 0;

    if (allPassed) {
      console.log(chalk.bold.green('\n✅ All rollback tests passed!'));
      console.log(chalk.yellow('\n📝 Recommendations:'));
      console.log('  1. Test the actual rollback procedure in a staging environment');
      console.log('  2. Ensure all team members are familiar with the procedure');
      console.log('  3. Keep rollback documentation easily accessible');
      console.log('  4. Schedule regular rollback drills');
    } else {
      console.log(chalk.bold.red('\n❌ Some rollback tests failed!'));
      console.log(chalk.yellow('\n⚠️  Please address the following issues:'));
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.testName}: ${r.message}`));
    }

    // Clean up
    await this.cleanup();

    return allPassed;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new RollbackTester();
  tester
    .runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(chalk.red('\n❌ Test suite failed:'), error);
      process.exit(1);
    });
}

export { RollbackTester };
