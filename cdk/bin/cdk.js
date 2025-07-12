#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { LightningTalkStack } = require('../lib/lightning-talk-stack');
const { CognitoStack } = require('../lib/cognito-stack');
const { ApiOnlyStack } = require('../lib/api-only-stack');
const { WebSocketStack } = require('../lib/websocket-stack');

const app = new cdk.App();

// Get configuration from context or environment
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '822063948773',
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-northeast-1',
};

// console.log(`🚀 Deploying Lightning Talk Circle infrastructure`);
// console.log(`📍 Domain: 発表.com (xn--6wym69a.com)`);
// console.log(`🏢 AWS Account: ${env.account}`);
// console.log(`🌍 AWS Region: ${env.region}`);

// Create the unified stack
new LightningTalkStack(app, 'LightningTalkStack', {
  env: env,
  description: 'Lightning Talk Circle - Complete Infrastructure (発表.com)',
  tags: {
    Project: 'lightning-talk-circle',
    Environment: 'production',
    ManagedBy: 'cdk',
  },
});

// Create Cognito stack
new CognitoStack(app, 'LightningTalkCognitoStack', {
  env: env,
  description: 'Lightning Talk Circle - Authentication Infrastructure',
  tags: {
    Project: 'lightning-talk-circle',
    Environment: 'production',
    ManagedBy: 'cdk',
  },
});

// Create API-only stack (for quick deployment)
new ApiOnlyStack(app, 'LightningTalkApiOnlyStack', {
  env: env,
  description: 'Lightning Talk Circle - API Only Stack',
  tags: {
    Project: 'lightning-talk-circle',
    Environment: 'production',
    ManagedBy: 'cdk',
  },
});

// Create WebSocket stack for real-time updates
new WebSocketStack(app, 'LightningTalkWebSocketStack', {
  env: env,
  description: 'Lightning Talk Circle - WebSocket API for Real-time Updates',
  tags: {
    Project: 'lightning-talk-circle',
    Environment: 'production',
    ManagedBy: 'cdk',
  },
});

app.synth();