/**
 * Database Factory - Strategy Pattern for Database Service Selection
 * Allows seamless switching between file-based and PostgreSQL databases
 */

import { DatabaseService } from './database.js';
import { PostgreSQLDatabaseService } from './database-postgresql.js';

export class DatabaseFactory {
  static create(options = {}) {
    const dbType = options.type || process.env.DATABASE_TYPE || 'file';

    switch (dbType.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
      case 'pg':
        console.log('🐘 Using PostgreSQL Database Service');
        return new PostgreSQLDatabaseService();

      case 'file':
      case 'json':
      default:
        console.log('📁 Using File-based Database Service');
        return new DatabaseService();
    }
  }

  static async createAndInitialize(options = {}) {
    const database = this.create(options);
    await database.initialize();
    return database;
  }

  static getSupportedTypes() {
    return [
      {
        type: 'file',
        name: 'File-based Database',
        description: 'JSON file storage for development',
        recommended: 'development'
      },
      {
        type: 'postgresql',
        name: 'PostgreSQL Database',
        description: 'Production-grade relational database',
        recommended: 'production'
      }
    ];
  }

  static validateConfiguration(type = null) {
    const dbType = type || process.env.DATABASE_TYPE || 'file';
    const validation = {
      type: dbType,
      valid: true,
      errors: [],
      warnings: []
    };

    switch (dbType.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
      case 'pg':
        // Check PostgreSQL configuration
        if (!process.env.DATABASE_URL) {
          validation.errors.push('DATABASE_URL is required for PostgreSQL');
          validation.valid = false;
        }

        // Validate connection string format
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
          validation.errors.push('DATABASE_URL must start with postgresql://');
          validation.valid = false;
        }

        // Check pool configuration
        const poolSize = parseInt(process.env.DB_POOL_SIZE);
        if (poolSize && (poolSize < 1 || poolSize > 100)) {
          validation.warnings.push('DB_POOL_SIZE should be between 1 and 100');
        }

        break;

      case 'file':
      case 'json':
        // Check file permissions and directory
        try {
          const dataDir = process.env.DATABASE_FILE_DIR || './server/data';
          // Additional file system checks can be added here
          validation.warnings.push('File-based database is not recommended for production');
        } catch (error) {
          validation.errors.push(`File system check failed: ${error.message}`);
          validation.valid = false;
        }
        break;

      default:
        validation.errors.push(`Unsupported database type: ${dbType}`);
        validation.valid = false;
    }

    return validation;
  }
}

export default DatabaseFactory;
