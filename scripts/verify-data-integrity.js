#!/usr/bin/env node

/**
 * Data Integrity Verification Script
 * Verifies data consistency after backup restoration
 */

import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

class DataIntegrityVerifier {
  constructor(region = 'ap-northeast-1') {
    const dynamoDbClient = new DynamoDB({ region });
    this.docClient = DynamoDBDocument.from(dynamoDbClient);

    this.tables = [
      {
        name: process.env.DYNAMODB_EVENTS_TABLE || 'lightningtalk-circle-prod-events',
        primaryKey: 'id',
        checks: ['id', 'title', 'eventDate', 'createdAt']
      },
      {
        name: process.env.DYNAMODB_PARTICIPANTS_TABLE || 'lightningtalk-circle-prod-participants',
        primaryKey: 'id',
        sortKey: 'eventId',
        checks: ['id', 'eventId', 'name', 'email']
      },
      {
        name: process.env.DYNAMODB_USERS_TABLE || 'lightningtalk-circle-prod-users',
        primaryKey: 'id',
        checks: ['id', 'email', 'role', 'createdAt']
      },
      {
        name: process.env.DYNAMODB_TALKS_TABLE || 'lightningtalk-circle-prod-talks',
        primaryKey: 'id',
        sortKey: 'eventId',
        checks: ['id', 'eventId', 'title', 'speakerId']
      }
    ];

    this.results = {
      tables: {},
      summary: {
        totalTables: 0,
        healthyTables: 0,
        warnings: [],
        errors: []
      }
    };
  }

  async verifyAll() {
    console.log('🔍 Starting Data Integrity Verification\n');

    for (const table of this.tables) {
      await this.verifyTable(table);
    }

    this.generateReport();
  }

  async verifyTable(tableConfig) {
    const { name, primaryKey, sortKey, checks } = tableConfig;
    console.log(`📊 Verifying table: ${name}`);

    const result = {
      tableName: name,
      itemCount: 0,
      corruptedItems: [],
      missingFields: {},
      duplicates: [],
      checksumMismatches: [],
      status: 'HEALTHY'
    };

    try {
      // Check table exists and is active
      const tableInfo = await this.describeTable(name);
      if (!tableInfo) {
        result.status = 'ERROR';
        result.error = 'Table not found';
        this.results.tables[name] = result;
        return;
      }

      if (tableInfo.TableStatus !== 'ACTIVE') {
        result.status = 'WARNING';
        result.warning = `Table status is ${tableInfo.TableStatus}`;
      }

      // Scan all items
      const items = await this.scanTable(name);
      result.itemCount = items.length;

      // Check for data integrity
      const seenIds = new Set();
      const checksums = new Map();

      for (const item of items) {
        // Check for required fields
        for (const field of checks) {
          if (!item[field]) {
            if (!result.missingFields[field]) {
              result.missingFields[field] = 0;
            }
            result.missingFields[field]++;
          }
        }

        // Check for duplicates
        const itemId = sortKey ? `${item[primaryKey]}#${item[sortKey]}` : item[primaryKey];
        if (seenIds.has(itemId)) {
          result.duplicates.push(itemId);
        }
        seenIds.add(itemId);

        // Calculate checksum for critical fields
        const checksum = this.calculateChecksum(item, checks);
        if (item._checksum && item._checksum !== checksum) {
          result.checksumMismatches.push({
            id: itemId,
            expected: item._checksum,
            actual: checksum
          });
        }
        checksums.set(itemId, checksum);
      }

      // Determine overall status
      if (result.duplicates.length > 0 || Object.keys(result.missingFields).length > 0) {
        result.status = 'WARNING';
      }

      if (result.checksumMismatches.length > 0) {
        result.status = 'CRITICAL';
      }

      // Cross-table validation for relationships
      if (name.includes('participants') || name.includes('talks')) {
        await this.validateRelationships(name, items);
      }
    } catch (error) {
      result.status = 'ERROR';
      result.error = error.message;
      this.results.summary.errors.push(`${name}: ${error.message}`);
    }

    this.results.tables[name] = result;
    this.results.summary.totalTables++;

    if (result.status === 'HEALTHY') {
      this.results.summary.healthyTables++;
    }

    // Display progress
    const statusEmoji = {
      HEALTHY: '✅',
      WARNING: '⚠️',
      CRITICAL: '❌',
      ERROR: '🚨'
    };

    console.log(
      `${statusEmoji[result.status]} ${name}: ${result.status} (${result.itemCount} items)\n`
    );
  }

  async describeTable(tableName) {
    try {
      const response = await this.docClient.send({
        TableName: tableName
      });
      return response.Table;
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        return null;
      }
      throw error;
    }
  }

  async scanTable(tableName) {
    const items = [];
    let lastEvaluatedKey = null;

    do {
      const params = {
        TableName: tableName
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      try {
        const response = await this.docClient.scan(params);
        items.push(...response.Items);
        lastEvaluatedKey = response.LastEvaluatedKey;
      } catch (error) {
        console.error(`Error scanning ${tableName}:`, error);
        throw error;
      }
    } while (lastEvaluatedKey);

    return items;
  }

  calculateChecksum(item, fields) {
    const data = {};
    for (const field of fields) {
      if (item[field] !== undefined) {
        data[field] = item[field];
      }
    }

    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data, Object.keys(data).sort()));
    return hash.digest('hex');
  }

  async validateRelationships(tableName, items) {
    // Validate foreign key relationships
    if (tableName.includes('participants')) {
      const eventIds = new Set(items.map(item => item.eventId));
      const eventsTable = this.tables.find(t => t.name.includes('events'));

      if (eventsTable) {
        const events = await this.scanTable(eventsTable.name);
        const validEventIds = new Set(events.map(e => e.id));

        for (const eventId of eventIds) {
          if (!validEventIds.has(eventId)) {
            this.results.summary.warnings.push(
              `Orphaned participant with non-existent eventId: ${eventId}`
            );
          }
        }
      }
    }
  }

  generateReport() {
    console.log('\n📋 Data Integrity Verification Report');
    console.log('=====================================\n');

    // Summary
    console.log('Summary:');
    console.log(`Total Tables: ${this.results.summary.totalTables}`);
    console.log(`Healthy Tables: ${this.results.summary.healthyTables}`);
    console.log(
      `Tables with Issues: ${this.results.summary.totalTables - this.results.summary.healthyTables}\n`
    );

    // Detailed results
    for (const [tableName, result] of Object.entries(this.results.tables)) {
      console.log(`\n📊 ${tableName}`);
      console.log(`Status: ${result.status}`);
      console.log(`Item Count: ${result.itemCount}`);

      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      }

      if (result.warning) {
        console.log(`⚠️  Warning: ${result.warning}`);
      }

      if (Object.keys(result.missingFields).length > 0) {
        console.log('Missing Fields:');
        for (const [field, count] of Object.entries(result.missingFields)) {
          console.log(`  - ${field}: ${count} items`);
        }
      }

      if (result.duplicates.length > 0) {
        console.log(`Duplicate IDs: ${result.duplicates.length}`);
        result.duplicates.slice(0, 5).forEach(id => {
          console.log(`  - ${id}`);
        });
        if (result.duplicates.length > 5) {
          console.log(`  ... and ${result.duplicates.length - 5} more`);
        }
      }

      if (result.checksumMismatches.length > 0) {
        console.log(`Checksum Mismatches: ${result.checksumMismatches.length}`);
      }
    }

    // Warnings and recommendations
    if (this.results.summary.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.results.summary.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    // Overall verdict
    console.log('\n🎯 Overall Data Integrity Status:');
    const allHealthy = this.results.summary.healthyTables === this.results.summary.totalTables;
    const hasErrors = this.results.summary.errors.length > 0;
    const hasCritical = Object.values(this.results.tables).some(t => t.status === 'CRITICAL');

    if (allHealthy) {
      console.log('✅ All tables are healthy. Data integrity verified.');
    } else if (hasCritical || hasErrors) {
      console.log('❌ CRITICAL: Data integrity issues detected. Manual intervention required.');
    } else {
      console.log('⚠️  WARNING: Minor data integrity issues detected. Review recommended.');
    }

    // Save detailed report
    const reportPath = `./reports/data-integrity-${new Date().toISOString().split('T')[0]}.json`;
    import('fs')
      .then(async fs => {
        try {
          await fs.promises.mkdir('./reports', { recursive: true });
          await fs.promises.writeFile(reportPath, JSON.stringify(this.results, null, 2));
          console.log(`\n💾 Detailed report saved: ${reportPath}`);
        } catch (error) {
          console.error('Failed to save report:', error.message);
        }
      })
      .catch(error => {
        console.error('Failed to import fs:', error.message);
      });

    // Exit code based on status
    process.exit(allHealthy ? 0 : 1);
  }
}

// Run verification
async function main() {
  const verifier = new DataIntegrityVerifier(process.env.AWS_REGION);

  try {
    await verifier.verifyAll();
  } catch (error) {
    console.error('Fatal error during verification:', error);
    process.exit(2);
  }
}

// Check if AWS SDK is available
(async () => {
  try {
    await import('@aws-sdk/client-dynamodb');
    main();
  } catch (error) {
    console.error(
      'AWS SDK not found. Please install: npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb'
    );
    process.exit(1);
  }
})();
