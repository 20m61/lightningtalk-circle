#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { DatabaseStack } = require('../lib/stacks/database-stack');
const { ApiStack } = require('../lib/stacks/api-stack');
const { StaticSiteStack } = require('../lib/stacks/static-site-stack');
const { MonitoringStack } = require('../lib/stacks/monitoring-stack');
const { CostMonitoringStack } = require('../lib/stacks/cost-monitoring-stack');
const { WafStack } = require('../lib/stacks/waf-stack');
const { SecretsStack } = require('../lib/stacks/secrets-stack');
const { getConfig } = require('../lib/shared/config');

const app = new cdk.App();

// Get environment from context with validation
const env = app.node.tryGetContext('env') || 'dev';

// Validate environment
const validEnvironments = ['dev', 'staging', 'prod', 'production'];
if (!validEnvironments.includes(env)) {
  throw new Error(`Invalid environment: ${env}. Must be one of: ${validEnvironments.join(', ')}`);
}

// Normalize environment name
const normalizedEnv = env === 'production' ? 'prod' : env;

const config = getConfig(normalizedEnv);

// Validate required environment variables
const requiredEnvVars = ['CDK_DEFAULT_ACCOUNT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please set these environment variables before running CDK commands.');
  console.error('Example: export CDK_DEFAULT_ACCOUNT=123456789012');
  process.exit(1);
}

// Define AWS environment
const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

// Validate AWS environment
if (!awsEnv.account.match(/^\d{12}$/)) {
  throw new Error(`Invalid AWS account ID: ${awsEnv.account}. Must be a 12-digit number.`);
}

// Log deployment information
console.log(`🚀 Deploying Lightning Talk Circle infrastructure`);
console.log(`📍 Environment: ${normalizedEnv}`);
console.log(`🏢 AWS Account: ${awsEnv.account}`);
console.log(`🌍 AWS Region: ${awsEnv.region}`);

// Create Secrets stack first
const secretsStack = new SecretsStack(app, `LightningTalk-Secrets-${normalizedEnv}`, {
  env: awsEnv,
  config,
  stackName: `LightningTalk-Secrets-${normalizedEnv}`,
  description: 'Lightning Talk Circle - Secrets Management',
  tags: {
    Project: 'LightningTalk',
    Environment: normalizedEnv,
    ManagedBy: 'CDK'
  }
});

// Create WAF stack (if enabled)
let wafStack;
if (config.security?.wafEnabled === true) {
  // WAF for CloudFront must be in us-east-1
  const wafEnv = {
    ...awsEnv,
    region: 'us-east-1'
  };
  
  wafStack = new WafStack(app, `LightningTalk-WAF-${normalizedEnv}`, {
    env: wafEnv,
    config,
    stackName: `LightningTalk-WAF-${normalizedEnv}`,
    description: 'Lightning Talk Circle - WAF Security Rules',
    crossRegionReferences: true,
    tags: {
      Project: 'LightningTalk',
      Environment: normalizedEnv,
      ManagedBy: 'CDK'
    }
  });
}

// Create stacks with normalized environment name
const databaseStack = new DatabaseStack(app, `LightningTalk-Database-${normalizedEnv}`, {
  env: awsEnv,
  config,
  stackName: `LightningTalk-Database-${normalizedEnv}`,
  description: 'Lightning Talk Circle - Database Infrastructure',
  tags: {
    Project: 'LightningTalk',
    Environment: normalizedEnv,
    ManagedBy: 'CDK'
  }
});

const apiStack = new ApiStack(app, `LightningTalk-Api-${normalizedEnv}`, {
  env: awsEnv,
  config,
  databaseStack: databaseStack,
  wafAclArn: wafStack?.regionalWebAcl?.attrArn || null,
  secretsStack: secretsStack,
  stackName: `LightningTalk-Api-${normalizedEnv}`,
  description: 'Lightning Talk Circle - API Infrastructure',
  crossRegionReferences: true,
  tags: {
    Project: 'LightningTalk',
    Environment: normalizedEnv,
    ManagedBy: 'CDK'
  }
});

// Allow API to access database and Redis
// Note: This is handled within the API stack by referencing the database security group

const staticSiteStack = new StaticSiteStack(app, `LightningTalk-StaticSite-${normalizedEnv}`, {
  env: awsEnv,
  config,
  apiUrl: apiStack.apiUrl,
  wafAclArn: wafStack?.cloudFrontWebAcl?.attrArn || null,
  stackName: `LightningTalk-StaticSite-${normalizedEnv}`,
  description: 'Lightning Talk Circle - Static Site Infrastructure',
  crossRegionReferences: true,
  tags: {
    Project: 'LightningTalk',
    Environment: normalizedEnv,
    ManagedBy: 'CDK'
  }
});

const monitoringStack = new MonitoringStack(app, `LightningTalk-Monitoring-${normalizedEnv}`, {
  env: awsEnv,
  config,
  databaseStack: databaseStack,
  apiService: apiStack.service,
  alb: apiStack.alb,
  stackName: `LightningTalk-Monitoring-${normalizedEnv}`,
  description: 'Lightning Talk Circle - Monitoring Infrastructure',
  tags: {
    Project: 'LightningTalk',
    Environment: normalizedEnv,
    ManagedBy: 'CDK'
  }
});

const costMonitoringStack = new CostMonitoringStack(app, `LightningTalk-CostMonitoring-${normalizedEnv}`, {
  env: awsEnv,
  config,
  stackName: `LightningTalk-CostMonitoring-${normalizedEnv}`,
  description: 'Lightning Talk Circle - Cost Monitoring and Budget Alerts',
  tags: {
    Project: 'LightningTalk',
    Environment: normalizedEnv,
    ManagedBy: 'CDK'
  }
});

// Add dependencies
apiStack.addDependency(secretsStack);
apiStack.addDependency(databaseStack);
staticSiteStack.addDependency(apiStack);
monitoringStack.addDependency(apiStack);
monitoringStack.addDependency(databaseStack);
// Cost monitoring can be deployed independently

app.synth();