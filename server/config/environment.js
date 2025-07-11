/**
 * Environment Configuration Validation
 * 環境変数の検証とデフォルト値設定
 */

export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];

  // Production specific validations
  if (process.env.NODE_ENV === 'production') {
    const requiredProd = ['JWT_SECRET', 'SESSION_SECRET'];

    requiredProd.forEach(env => {
      if (!process.env[env]) {
        errors.push(`Missing required production environment variable: ${env}`);
      }
    });

    // DynamoDB specific validations for production
    const databaseType = process.env.DATABASE_TYPE || 'dynamodb';
    if (databaseType === 'dynamodb') {
      if (!process.env.AWS_REGION) {
        errors.push('AWS_REGION is required for DynamoDB in production');
      }

      // Check for AWS credentials or IAM role
      if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_SESSION_TOKEN) {
        warnings.push(
          'AWS credentials not found. Ensure Lambda has appropriate IAM role permissions for DynamoDB access.'
        );
      }
    }

    // Validate secret lengths
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      warnings.push('JWT_SECRET should be at least 64 characters for production');
    }

    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 64) {
      warnings.push('SESSION_SECRET should be at least 64 characters for production');
    }
  }

  // Common validations
  const commonRequired = ['PORT'];
  commonRequired.forEach(env => {
    if (!process.env[env] && !getDefaultValue(env)) {
      warnings.push(`Environment variable ${env} not set, using default`);
    }
  });

  // Validate port
  const port = parseInt(process.env.PORT) || 3000;
  if (port < 1 || port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  // Validate email configuration if email service is enabled
  if (process.env.EMAIL_SERVICE && process.env.EMAIL_SERVICE !== 'none') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      errors.push('EMAIL_USER and EMAIL_PASS required when EMAIL_SERVICE is configured');
    }
  }

  return { errors, warnings };
};

export const getDefaultValue = key => {
  const defaults = {
    PORT: '3000',
    NODE_ENV: 'development',
    DATABASE_TYPE: process.env.NODE_ENV === 'production' ? 'dynamodb' : 'file',
    DATABASE_FILE: 'data/database.json',
    AWS_REGION: 'ap-northeast-1',
    JWT_EXPIRES_IN: '24h',
    CORS_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000',
    EMAIL_SERVICE: 'none'
  };

  return defaults[key];
};

export const getEnvironmentConfig = () => {
  const validation = validateEnvironment();

  if (validation.errors.length > 0) {
    console.error('❌ Environment validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed in production');
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  return {
    nodeEnv: process.env.NODE_ENV || getDefaultValue('NODE_ENV'),
    port: parseInt(process.env.PORT) || parseInt(getDefaultValue('PORT')),
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || getDefaultValue('JWT_EXPIRES_IN'),
    corsOrigins: process.env.CORS_ORIGINS || getDefaultValue('CORS_ORIGINS'),
    emailService: process.env.EMAIL_SERVICE || getDefaultValue('EMAIL_SERVICE'),
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    githubToken: process.env.GITHUB_TOKEN,
    githubOwner: process.env.GITHUB_OWNER,
    githubRepo: process.env.GITHUB_REPO,
    validation
  };
};

export default {
  validateEnvironment,
  getDefaultValue,
  getEnvironmentConfig
};
