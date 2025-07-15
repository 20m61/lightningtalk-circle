#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { LightningTalkStack } = require('../lib/lightning-talk-stack');
const { CognitoStack } = require('../lib/cognito-stack');
const { ApiOnlyStack } = require('../lib/api-only-stack');
const { WebSocketStack } = require('../lib/websocket-stack');
const { getEnvironmentConfig, validateEnvironment } = require('../lib/config/environment');

const app = new cdk.App();

// Get stage from context or default to 'dev'
const stage = app.node.tryGetContext('env') || process.env.CDK_STAGE || 'dev';

// Get environment configuration
const config = validateEnvironment(getEnvironmentConfig(stage));
const env = config.env;

// console.log(`🚀 Deploying Lightning Talk Circle infrastructure`);
// console.log(`📍 Domain: 発表.com (xn--6wym69a.com)`);
// console.log(`🏢 AWS Account: ${env.account}`);
// console.log(`🌍 AWS Region: ${env.region}`);

// Create the unified stack
new LightningTalkStack(app, `LightningTalkStack-${stage}`, {
  env: env,
  description: `Lightning Talk Circle - Complete Infrastructure (${stage})`,
  config: config,
  tags: {
    Project: config.projectName,
    Environment: stage,
    ManagedBy: 'cdk',
  },
});

// Create Cognito stack
new CognitoStack(app, `LightningTalkCognitoStack-${stage}`, {
  env: env,
  description: `Lightning Talk Circle - Authentication Infrastructure (${stage})`,
  config: config,
  tags: {
    Project: config.projectName,
    Environment: stage,
    ManagedBy: 'cdk',
  },
});

// Create API-only stack (for quick deployment)
new ApiOnlyStack(app, `LightningTalkApiOnlyStack-${stage}`, {
  env: env,
  description: `Lightning Talk Circle - API Only Stack (${stage})`,
  config: config,
  tags: {
    Project: config.projectName,
    Environment: stage,
    ManagedBy: 'cdk',
  },
});

// Create WebSocket stack for real-time updates
new WebSocketStack(app, `LightningTalkWebSocketStack-${stage}`, {
  env: env,
  description: `Lightning Talk Circle - WebSocket API for Real-time Updates (${stage})`,
  config: config,
  tags: {
    Project: config.projectName,
    Environment: stage,
    ManagedBy: 'cdk',
  },
});

app.synth();