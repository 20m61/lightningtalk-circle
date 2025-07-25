#!/usr/bin/env node

/**
 * Automated Migration Script: File-based to DynamoDB
 *
 * This script migrates data from the file-based database to DynamoDB tables.
 * It includes validation, progress tracking, and rollback capabilities.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AWS from 'aws-sdk';
import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { DynamoDBDatabaseService } from '../server/services/dynamodb-database.js';
import { DatabaseService } from '../server/services/database.js';
import { logger } from '../server/services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration configuration
const MIGRATION_CONFIG = {
  batchSize: 25, // DynamoDB batch write limit
  collections: ['events', 'participants', 'users', 'talks'],
  backupDir: path.join(__dirname, '../migration-backups'),
  progressFile: path.join(__dirname, '../migration-progress.json')
};

class MigrationService {
  constructor(options) {
    this.options = options;
    this.fileDb = DatabaseService.getInstance();
    this.dynamoDb = new DynamoDBDatabaseService({
      region: options.region,
      endpoint: options.endpoint, // For local testing
      eventsTable: options.eventsTable,
      participantsTable: options.participantsTable,
      usersTable: options.usersTable,
      talksTable: options.talksTable
    });

    this.progress = {
      startTime: null,
      endTime: null,
      collections: {},
      status: 'pending',
      errors: []
    };
  }

  /**
   * Load migration progress from file
   */
  async loadProgress() {
    try {
      const data = await fs.readFile(MIGRATION_CONFIG.progressFile, 'utf-8');
      this.progress = JSON.parse(data);
      console.log(chalk.yellow('📂 Loaded previous migration progress'));
    } catch (error) {
      // No previous progress file
    }
  }

  /**
   * Save migration progress to file
   */
  async saveProgress() {
    await fs.writeFile(MIGRATION_CONFIG.progressFile, JSON.stringify(this.progress, null, 2));
  }

  /**
   * Create backup of current data
   */
  async createBackup() {
    console.log(chalk.blue('📦 Creating backup of current data...'));

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(MIGRATION_CONFIG.backupDir, timestamp);

    await fs.mkdir(backupPath, { recursive: true });

    for (const collection of MIGRATION_CONFIG.collections) {
      const sourceFile = path.join(__dirname, '../server/data', `${collection}.json`);
      const backupFile = path.join(backupPath, `${collection}.json`);

      try {
        await fs.copyFile(sourceFile, backupFile);
        console.log(chalk.green(`  ✓ Backed up ${collection}`));
      } catch (error) {
        console.log(chalk.yellow(`  ⚠ No data file for ${collection}`));
      }
    }

    this.progress.backupPath = backupPath;
    await this.saveProgress();

    console.log(chalk.green(`✅ Backup created at: ${backupPath}`));
  }

  /**
   * Validate DynamoDB connection and tables
   */
  async validateDynamoDB() {
    console.log(chalk.blue('🔍 Validating DynamoDB connection and tables...'));

    const dynamodb = new AWS.DynamoDB({ region: this.options.region });

    for (const collection of MIGRATION_CONFIG.collections) {
      const tableName = this.dynamoDb.tables[collection];

      try {
        const tableInfo = await dynamodb.describeTable({ TableName: tableName }).promise();
        console.log(
          chalk.green(`  ✓ Table ${tableName} exists (status: ${tableInfo.Table.TableStatus})`)
        );

        if (tableInfo.Table.TableStatus !== 'ACTIVE') {
          throw new Error(`Table ${tableName} is not active`);
        }
      } catch (error) {
        if (error.code === 'ResourceNotFoundException') {
          throw new Error(`Table ${tableName} does not exist. Please run CDK deployment first.`);
        }
        throw error;
      }
    }

    console.log(chalk.green('✅ All DynamoDB tables validated'));
  }

  /**
   * Migrate a single collection
   */
  async migrateCollection(collection) {
    console.log(chalk.blue(`\n📤 Migrating ${collection}...`));

    // Initialize collection progress
    if (!this.progress.collections[collection]) {
      this.progress.collections[collection] = {
        status: 'pending',
        total: 0,
        migrated: 0,
        errors: []
      };
    }

    const collectionProgress = this.progress.collections[collection];

    try {
      // Load data from file-based database
      await this.fileDb.initialize();
      const items = await this.fileDb.findAll(collection);

      collectionProgress.total = items.length;
      console.log(chalk.yellow(`  Found ${items.length} items to migrate`));

      if (items.length === 0) {
        collectionProgress.status = 'completed';
        await this.saveProgress();
        return;
      }

      // Migrate in batches
      const batches = [];
      for (let i = 0; i < items.length; i += MIGRATION_CONFIG.batchSize) {
        batches.push(items.slice(i, i + MIGRATION_CONFIG.batchSize));
      }

      collectionProgress.status = 'in_progress';

      for (const [batchIndex, batch] of batches.entries()) {
        try {
          // Skip already migrated items if resuming
          const startIndex = batchIndex * MIGRATION_CONFIG.batchSize;
          if (startIndex < collectionProgress.migrated) {
            continue;
          }

          // Prepare items for DynamoDB
          const preparedItems = batch.map(item => this.prepareItemForDynamoDB(collection, item));

          // Batch insert to DynamoDB
          await this.dynamoDb.batchInsert(collection, preparedItems);

          collectionProgress.migrated += batch.length;
          await this.saveProgress();

          const progress = Math.round(
            (collectionProgress.migrated / collectionProgress.total) * 100
          );
          console.log(
            chalk.cyan(
              `  Progress: ${progress}% (${collectionProgress.migrated}/${collectionProgress.total})`
            )
          );
        } catch (error) {
          console.error(chalk.red(`  ❌ Error migrating batch ${batchIndex + 1}:`), error.message);
          collectionProgress.errors.push({
            batch: batchIndex,
            error: error.message,
            timestamp: new Date().toISOString()
          });

          if (!this.options.continueOnError) {
            throw error;
          }
        }
      }

      collectionProgress.status = 'completed';
      console.log(chalk.green(`  ✅ Migrated ${collectionProgress.migrated} items`));
    } catch (error) {
      collectionProgress.status = 'failed';
      collectionProgress.errors.push({
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      await this.saveProgress();
    }
  }

  /**
   * Prepare item for DynamoDB (handle data transformations)
   */
  prepareItemForDynamoDB(collection, item) {
    const prepared = { ...item };

    // Ensure required fields
    if (!prepared.id) {
      prepared.id = this.dynamoDb.generateId();
    }

    if (!prepared.createdAt) {
      prepared.createdAt = new Date().toISOString();
    }

    if (!prepared.updatedAt) {
      prepared.updatedAt = prepared.createdAt;
    }

    // Collection-specific transformations
    switch (collection) {
    case 'events':
      // Add sort key for events table
      if (!prepared.createdAt) {
        prepared.createdAt = new Date().toISOString();
      }
      break;

    case 'participants':
      // Ensure eventId is present (sort key)
      if (!prepared.eventId) {
        console.warn(chalk.yellow(`  ⚠ Participant ${prepared.id} missing eventId`));
      }
      break;

    case 'talks':
      // Ensure eventId is present (sort key)
      if (!prepared.eventId) {
        console.warn(chalk.yellow(`  ⚠ Talk ${prepared.id} missing eventId`));
      }
      break;
    }

    return prepared;
  }

  /**
   * Verify migration by comparing counts
   */
  async verifyMigration() {
    console.log(chalk.blue('\n🔍 Verifying migration...'));

    let allValid = true;

    for (const collection of MIGRATION_CONFIG.collections) {
      const fileCount = await this.fileDb.count(collection);
      const dynamoItems = await this.dynamoDb.scan(collection);
      const dynamoCount = dynamoItems.length;

      const match = fileCount === dynamoCount;
      const icon = match ? '✓' : '✗';
      const color = match ? chalk.green : chalk.red;

      console.log(
        color(`  ${icon} ${collection}: File DB: ${fileCount}, DynamoDB: ${dynamoCount}`)
      );

      if (!match) {
        allValid = false;
      }
    }

    return allValid;
  }

  /**
   * Run the complete migration
   */
  async run() {
    try {
      console.log(chalk.bold.blue('\n🚀 Lightning Talk Circle - DynamoDB Migration\n'));

      // Load previous progress
      await this.loadProgress();

      // Check if migration was already completed
      if (this.progress.status === 'completed' && !this.options.force) {
        const { continueAnyway } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueAnyway',
            message: 'Migration was already completed. Do you want to run it again?',
            default: false
          }
        ]);

        if (!continueAnyway) {
          console.log(chalk.yellow('Migration cancelled'));
          return;
        }
      }

      // Validate environment
      await this.validateDynamoDB();

      // Create backup
      if (!this.options.skipBackup) {
        await this.createBackup();
      }

      // Start migration
      this.progress.status = 'in_progress';
      this.progress.startTime = new Date().toISOString();
      await this.saveProgress();

      // Migrate each collection
      for (const collection of MIGRATION_CONFIG.collections) {
        await this.migrateCollection(collection);
      }

      // Verify migration
      const isValid = await this.verifyMigration();

      if (!isValid && !this.options.force) {
        throw new Error('Migration verification failed');
      }

      // Complete migration
      this.progress.status = 'completed';
      this.progress.endTime = new Date().toISOString();
      await this.saveProgress();

      // Calculate duration
      const duration = new Date(this.progress.endTime) - new Date(this.progress.startTime);
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);

      console.log(
        chalk.bold.green(`\n✅ Migration completed successfully in ${minutes}m ${seconds}s!`)
      );

      // Show summary
      console.log(chalk.blue('\n📊 Migration Summary:'));
      for (const [collection, stats] of Object.entries(this.progress.collections)) {
        console.log(chalk.cyan(`  ${collection}: ${stats.migrated}/${stats.total} items`));
        if (stats.errors.length > 0) {
          console.log(chalk.yellow(`    ⚠ ${stats.errors.length} errors`));
        }
      }

      console.log(chalk.yellow('\n📌 Next steps:'));
      console.log('  1. Update your .env file: DATABASE_TYPE=dynamodb');
      console.log('  2. Test the application with DynamoDB');
      console.log('  3. Monitor CloudWatch metrics');
    } catch (error) {
      this.progress.status = 'failed';
      this.progress.errors.push({
        error: error.message,
        timestamp: new Date().toISOString()
      });
      await this.saveProgress();

      console.error(chalk.red('\n❌ Migration failed:'), error.message);
      console.log(chalk.yellow('\n💡 You can resume the migration by running this script again'));
      process.exit(1);
    }
  }

  /**
   * Rollback migration
   */
  async rollback() {
    console.log(chalk.blue('\n🔄 Rolling back migration...'));

    if (!this.progress.backupPath) {
      throw new Error('No backup path found in migration progress');
    }

    // Restore from backup
    for (const collection of MIGRATION_CONFIG.collections) {
      const backupFile = path.join(this.progress.backupPath, `${collection}.json`);
      const targetFile = path.join(__dirname, '../server/data', `${collection}.json`);

      try {
        await fs.copyFile(backupFile, targetFile);
        console.log(chalk.green(`  ✓ Restored ${collection}`));
      } catch (error) {
        console.log(chalk.yellow(`  ⚠ Could not restore ${collection}: ${error.message}`));
      }
    }

    // Reset progress
    this.progress = {
      startTime: null,
      endTime: null,
      collections: {},
      status: 'rolled_back',
      errors: []
    };
    await this.saveProgress();

    console.log(chalk.green('✅ Rollback completed'));
  }
}

// CLI setup
program
  .name('migrate-to-dynamodb')
  .description('Migrate Lightning Talk Circle data from file-based storage to DynamoDB')
  .version('1.0.0');

program
  .command('run')
  .description('Run the migration')
  .option('-r, --region <region>', 'AWS region', process.env.AWS_REGION || 'ap-northeast-1')
  .option('-e, --endpoint <endpoint>', 'DynamoDB endpoint (for local testing)')
  .option('--events-table <table>', 'Events table name', process.env.DYNAMODB_EVENTS_TABLE)
  .option(
    '--participants-table <table>',
    'Participants table name',
    process.env.DYNAMODB_PARTICIPANTS_TABLE
  )
  .option('--users-table <table>', 'Users table name', process.env.DYNAMODB_USERS_TABLE)
  .option('--talks-table <table>', 'Talks table name', process.env.DYNAMODB_TALKS_TABLE)
  .option('--skip-backup', 'Skip creating backup')
  .option('--continue-on-error', 'Continue migration even if some items fail')
  .option('--force', 'Force migration even if already completed')
  .action(async options => {
    const migration = new MigrationService(options);
    await migration.run();
  });

program
  .command('rollback')
  .description('Rollback the migration using backup')
  .action(async() => {
    const migration = new MigrationService({});
    await migration.loadProgress();
    await migration.rollback();
  });

program
  .command('status')
  .description('Check migration status')
  .action(async() => {
    const migration = new MigrationService({});
    await migration.loadProgress();

    console.log(chalk.blue('\n📊 Migration Status\n'));
    console.log(`Status: ${chalk.bold(migration.progress.status || 'not started')}`);

    if (migration.progress.startTime) {
      console.log(`Started: ${migration.progress.startTime}`);
    }

    if (migration.progress.endTime) {
      console.log(`Completed: ${migration.progress.endTime}`);
    }

    if (Object.keys(migration.progress.collections).length > 0) {
      console.log('\nCollections:');
      for (const [collection, stats] of Object.entries(migration.progress.collections)) {
        console.log(`  ${collection}: ${stats.status} (${stats.migrated}/${stats.total})`);
      }
    }
  });

program.parse(process.argv);
