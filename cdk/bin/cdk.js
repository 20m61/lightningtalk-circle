#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { DatabaseStack } = require('../lib/stacks/database-stack');
const { ApiStack } = require('../lib/stacks/api-stack');
const { StaticSiteStack } = require('../lib/stacks/static-site-stack');
const { MonitoringStack } = require('../lib/stacks/monitoring-stack');
const { getConfig } = require('../lib/shared/config');

const app = new cdk.App();

// Get environment from context
const env = app.node.tryGetContext('env') || 'dev';
const config = getConfig(env);

// Define AWS environment
const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

// Create stacks
const databaseStack = new DatabaseStack(app, `LightningTalk-Database-${env}`, {
  env: awsEnv,
  config,
  stackName: `LightningTalk-Database-${env}`,
  description: 'Lightning Talk Circle - Database Infrastructure',
  tags: {
    Project: 'LightningTalk',
    Environment: env,
    ManagedBy: 'CDK'
  }
});

const apiStack = new ApiStack(app, `LightningTalk-Api-${env}`, {
  env: awsEnv,
  config,
  vpc: databaseStack.vpc,
  database: databaseStack.database,
  redis: databaseStack.redis,
  stackName: `LightningTalk-Api-${env}`,
  description: 'Lightning Talk Circle - API Infrastructure',
  tags: {
    Project: 'LightningTalk',
    Environment: env,
    ManagedBy: 'CDK'
  }
});

// Allow API to access database and Redis
databaseStack.allowAccessFrom(apiStack.serviceSecurityGroup);

const staticSiteStack = new StaticSiteStack(app, `LightningTalk-StaticSite-${env}`, {
  env: awsEnv,
  config,
  apiUrl: apiStack.apiUrl,
  stackName: `LightningTalk-StaticSite-${env}`,
  description: 'Lightning Talk Circle - Static Site Infrastructure',
  tags: {
    Project: 'LightningTalk',
    Environment: env,
    ManagedBy: 'CDK'
  }
});

const monitoringStack = new MonitoringStack(app, `LightningTalk-Monitoring-${env}`, {
  env: awsEnv,
  config,
  database: databaseStack.database,
  apiService: apiStack.service,
  alb: apiStack.alb,
  stackName: `LightningTalk-Monitoring-${env}`,
  description: 'Lightning Talk Circle - Monitoring Infrastructure',
  tags: {
    Project: 'LightningTalk',
    Environment: env,
    ManagedBy: 'CDK'
  }
});

// Add dependencies
apiStack.addDependency(databaseStack);
staticSiteStack.addDependency(apiStack);
monitoringStack.addDependency(apiStack);
monitoringStack.addDependency(databaseStack);

app.synth();