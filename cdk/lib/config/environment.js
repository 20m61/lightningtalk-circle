/**
 * Environment configuration for Lightning Talk Circle CDK
 * This file centralizes all environment-specific configurations
 */

const getEnvironmentConfig = (stage = 'dev') => {
  const config = {
    // Common configurations across all environments
    common: {
      projectName: 'lightning-talk-circle',
      domainName: 'xn--6wym69a.com', // 発表.com
      region: process.env.AWS_REGION || 'ap-northeast-1',
    },
    
    // Development environment
    dev: {
      account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
      stage: 'dev',
      domainName: 'dev.xn--6wym69a.com', // dev.発表.com
      app: {
        name: 'lightningtalk-circle',
        stage: 'dev',
      },
      security: {
        rateLimitPerMinute: 1000,
        allowedCountries: [], // No country restrictions in dev
      },
      database: {
        type: 'dynamodb', // Use DynamoDB for consistency
        backupRetentionDays: 1,
        pointInTimeRecovery: false, // Disabled for cost optimization
      },
      monitoring: {
        enableCloudWatch: true,
        enableXRay: false,
        enableEnhancedMonitoring: false,
      },
      cognito: {
        mfaRequired: false,
        advancedSecurity: false,
      },
      alertEmail: process.env.DEV_ALERT_EMAIL || 'dev@lightningtalk.com',
    },
    
    // Staging environment
    staging: {
      account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
      stage: 'staging',
      app: {
        name: 'lightningtalk-circle',
        stage: 'staging',
      },
      security: {
        rateLimitPerMinute: 500,
        allowedCountries: [], // No country restrictions in staging
      },
      database: {
        type: 'dynamodb',
        backupRetentionDays: 7,
        pointInTimeRecovery: true,
      },
      monitoring: {
        enableCloudWatch: true,
        enableXRay: true,
        enableEnhancedMonitoring: false,
      },
      cognito: {
        mfaRequired: false,
        advancedSecurity: true,
      },
      alertEmail: process.env.STAGING_ALERT_EMAIL || 'staging@lightningtalk.com',
    },
    
    // Production environment
    prod: {
      account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      stage: 'prod',
      domainName: 'xn--6wym69a.com', // 発表.com
      app: {
        name: 'lightningtalk-circle',
        stage: 'prod',
      },
      security: {
        rateLimitPerMinute: 1000,
        allowedCountries: ['JP'], // Restrict to Japan in production
      },
      database: {
        type: 'dynamodb',
        backupRetentionDays: 30,
        pointInTimeRecovery: true,
      },
      monitoring: {
        enableCloudWatch: true,
        enableXRay: true,
        enableEnhancedMonitoring: true,
      },
      cognito: {
        mfaRequired: true,
        advancedSecurity: true,
      },
      alertEmail: process.env.PROD_ALERT_EMAIL || 'admin@lightningtalk.com',
      hostedZoneId: process.env.HOSTED_ZONE_ID || 'Z036564723AZHFOSIARRI',
      certificateArn: process.env.CERTIFICATE_ARN || 'arn:aws:acm:us-east-1:822063948773:certificate/42ab57fd-bb00-47c8-b218-fc23216e0f63',
    },
  };
  
  // Merge common config with environment-specific config
  const envConfig = config[stage] || config.dev;
  return {
    ...config.common,
    ...envConfig,
    env: {
      account: envConfig.account,
      region: config.common.region,
    },
  };
};

// Validate required environment variables
const validateEnvironment = (config) => {
  const required = ['account'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missing.join(', ')}`);
    console.warn('   Please set AWS_ACCOUNT_ID or CDK_DEFAULT_ACCOUNT');
  }
  
  return config;
};

// Get stack prefix for consistent naming
const getStackPrefix = (stage) => {
  return `LightningTalk-${stage}`;
};

// Get stack tags for consistent tagging
const getStackTags = (config, stage) => {
  return {
    Project: config.projectName,
    Environment: stage,
    ManagedBy: 'cdk',
    Version: '2.0-consolidated',
    Owner: 'lightning-talk-circle',
  };
};

// Check if environment is production
const isProduction = (stage) => {
  return stage === 'prod' || stage === 'production';
};

// Get deployment configuration
const getDeploymentConfig = (stage) => {
  const config = getEnvironmentConfig(stage);
  
  return {
    ...config,
    stackPrefix: getStackPrefix(stage),
    stackTags: getStackTags(config, stage),
    isProduction: isProduction(stage),
  };
};

module.exports = {
  getEnvironmentConfig,
  validateEnvironment,
  getStackPrefix,
  getStackTags,
  isProduction,
  getDeploymentConfig,
};