#!/usr/bin/env node
/**
 * Lightning Talk Circle - Optimized CDK Application
 * 統合・最適化されたスタック構成
 */

const cdk = require('aws-cdk-lib');
const { BaseInfrastructureStack } = require('../lib/base-infrastructure-stack');
const { SharedResourcesStack } = require('../lib/shared-resources-stack');
const { ApplicationStack } = require('../lib/application-stack');
const { OperationsStack } = require('../lib/operations-stack');
const { WebSocketStack } = require('../lib/websocket-stack');
const { getEnvironmentConfig, validateEnvironment } = require('../lib/config/environment');

const app = new cdk.App();

// Get environment from context
const environment = app.node.tryGetContext('env') || process.env.CDK_STAGE || 'dev';
const config = validateEnvironment(getEnvironmentConfig(environment));

console.log(`
🚀 Lightning Talk Circle - Optimized CDK Deployment
==================================================
📍 Domain: ${config.domainName} (発表.com)
🏢 Account: ${config.env.account}
🌍 Region: ${config.env.region}
📦 Environment: ${environment}
🔧 Optimized Stack Architecture
`);

// 1. Base Infrastructure Stack (us-east-1 for CloudFront certificate)
let certificateArn;
if (environment === 'prod') {
  const baseInfraStack = new BaseInfrastructureStack(app, `LTC-BaseInfra-${environment}`, {
    env: {
      account: config.env.account,
      region: 'us-east-1', // Required for CloudFront certificates
    },
    config: config,
    environment: environment,
    description: `Lightning Talk Circle - Base Infrastructure (${environment})`,
    terminationProtection: environment === 'prod',
  });
  certificateArn = baseInfraStack.certificate?.certificateArn;
}

// 2. Shared Resources Stack
const sharedResourcesStack = new SharedResourcesStack(app, `LTC-SharedResources-${environment}`, {
  env: config.env,
  config: config,
  environment: environment,
  description: `Lightning Talk Circle - Shared Resources (${environment})`,
  terminationProtection: environment === 'prod',
});

// 3. Application Stack
const applicationStack = new ApplicationStack(app, `LTC-Application-${environment}`, {
  env: config.env,
  config: config,
  environment: environment,
  sharedResources: sharedResourcesStack,
  certificateArn: certificateArn || config.certificateArn,
  description: `Lightning Talk Circle - Application Layer (${environment})`,
  terminationProtection: environment === 'prod',
});

// Add explicit dependency
applicationStack.addDependency(sharedResourcesStack);

// 4. WebSocket Stack (Optional - can be deployed separately)
if (config.features?.enableWebSocket !== false) {
  const webSocketStack = new WebSocketStack(app, `LTC-WebSocket-${environment}`, {
    env: config.env,
    config: config,
    description: `Lightning Talk Circle - WebSocket API (${environment})`,
    terminationProtection: environment === 'prod',
  });
  
  // WebSocket stack can reference shared resources if needed
  webSocketStack.addDependency(sharedResourcesStack);
}

// 5. Operations Stack (Monitoring, Alerts, Cost Management)
if (environment === 'prod' || config.monitoring?.enableCloudWatch) {
  const operationsStack = new OperationsStack(app, `LTC-Operations-${environment}`, {
    env: config.env,
    config: config,
    environment: environment,
    applicationStack: applicationStack,
    description: `Lightning Talk Circle - Operations & Monitoring (${environment})`,
    terminationProtection: environment === 'prod',
  });
  
  // Operations stack depends on application stack for metrics
  operationsStack.addDependency(applicationStack);
}

// Add tags to all stacks
const tags = {
  Project: 'Lightning Talk Circle',
  Environment: environment,
  ManagedBy: 'CDK-Optimized',
  Version: '2.0',
  Repository: 'https://github.com/20m61/lightningtalk-circle',
};

Object.entries(tags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

// Output deployment information
console.log(`
📝 Stack Deployment Order:
1. Base Infrastructure (us-east-1) ${environment === 'prod' ? '✓' : '○ (prod only)'}
2. Shared Resources ✓
3. Application Stack ✓
4. WebSocket Stack ${config.features?.enableWebSocket !== false ? '✓' : '○ (disabled)'}
5. Operations Stack ${environment === 'prod' || config.monitoring?.enableCloudWatch ? '✓' : '○'}

🎯 Deployment Commands:
  All stacks:     cdk deploy --all --app "node bin/cdk-optimized.js" -c env=${environment}
  Specific stack: cdk deploy LTC-Application-${environment} --app "node bin/cdk-optimized.js" -c env=${environment}
  
💡 Cost Optimization Applied:
  - Environment-based resource sizing
  - Conditional monitoring deployment  
  - Optimized CloudFront distributions
  - DynamoDB billing mode optimization
  
🔍 View Resources:
  - CloudFormation: https://console.aws.amazon.com/cloudformation
  - Cost Explorer: https://console.aws.amazon.com/cost-management/home
`);

app.synth();