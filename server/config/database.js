/**
 * Database Configuration
 * 本番環境用データベース設定
 */

export const getDatabaseConfig = () => {
  const environment = process.env.NODE_ENV || 'development';

  const config = {
    development: {
      type: 'file',
      filePath: process.env.DATABASE_FILE || 'data/database.json',
      options: {
        encoding: 'utf8',
        autosave: true,
        autosaveInterval: 5000
      }
    },

    test: {
      type: 'memory',
      options: {
        autoReset: true
      }
    },

    production: {
      type: process.env.DATABASE_TYPE || 'dynamodb',

      // DynamoDB configuration (本番環境)
      dynamodb: {
        region: process.env.AWS_REGION || 'ap-northeast-1',
        endpoint: process.env.DYNAMODB_ENDPOINT, // ローカル開発用 (通常は未設定)
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN, // IAMロール使用時
        tables: {
          events: process.env.DYNAMODB_EVENTS_TABLE || 'lightningtalk-production-events',
          participants:
            process.env.DYNAMODB_PARTICIPANTS_TABLE || 'lightningtalk-production-participants',
          talks: process.env.DYNAMODB_TALKS_TABLE || 'lightningtalk-production-talks',
          voting: process.env.DYNAMODB_VOTING_TABLE || 'lightningtalk-production-voting',
          sessions: process.env.DYNAMODB_SESSIONS_TABLE || 'lightningtalk-production-sessions'
        },
        options: {
          convertEmptyValues: true,
          maxRetries: 3,
          retryDelayOptions: {
            customBackoff: retryCount => Math.pow(2, retryCount) * 100
          }
        }
      },

      // PostgreSQL configuration (代替オプション)
      postgresql: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT) || 5432,
        database: process.env.DATABASE_NAME || 'lightningtalk',
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD,
        ssl:
          process.env.DATABASE_SSL === 'true'
            ? {
              rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
            }
            : false,
        pool: {
          min: parseInt(process.env.DATABASE_POOL_MIN) || 2,
          max: parseInt(process.env.DATABASE_POOL_MAX) || 10,
          idle: parseInt(process.env.DATABASE_POOL_IDLE) || 10000
        }
      }
    }
  };

  return config[environment];
};

export const validateDatabaseConfig = config => {
  if (!config) {
    throw new Error('Database configuration is required');
  }

  if (config.type === 'dynamodb') {
    if (!config.dynamodb) {
      throw new Error('DynamoDB configuration is required');
    }

    if (!config.dynamodb.region) {
      throw new Error('DynamoDB region is required');
    }

    if (!config.dynamodb.tables) {
      throw new Error('DynamoDB table configuration is required');
    }

    // 本番環境ではAWS認証情報またはIAMロールが必要
    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.AWS_ACCESS_KEY_ID &&
      !process.env.AWS_SESSION_TOKEN
    ) {
      console.warn('⚠️  AWS credentials not found. Assuming IAM role authentication.');
    }
  }

  if (config.type === 'postgresql') {
    const required = ['host', 'database', 'username', 'password'];
    const missing = required.filter(key => !config.postgresql[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required PostgreSQL configuration: ${missing.join(', ')}`);
    }
  }

  return true;
};

export default {
  getDatabaseConfig,
  validateDatabaseConfig
};
