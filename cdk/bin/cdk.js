#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { DevEnvironmentStack } = require('../lib/dev-environment-stack');
const { ProdEnvironmentStack } = require('../lib/prod-environment-stack');
const { CognitoStack } = require('../lib/cognito-stack');
const { WebSocketStack } = require('../lib/websocket-stack');
const { StorybookStack } = require('../lib/storybook-stack');
const { CertificateStack } = require('../lib/certificate-stack');
const { getEnvironmentConfig, validateEnvironment } = require('../lib/config/environment');

const app = new cdk.App();

// Get stage from context or default to 'dev'
const contextEnv = app.node.tryGetContext('env');
const envStage = process.env.CDK_STAGE;
console.log(`Debug - contextEnv: ${contextEnv}, envStage: ${envStage}`);
const stage = contextEnv || envStage || 'dev';

// Get environment configuration
const config = validateEnvironment(getEnvironmentConfig(stage));
const env = config.env;

console.log(`🚀 Deploying Lightning Talk Circle infrastructure`);
console.log(`📍 Domain: 発表.com (xn--6wym69a.com)`);
console.log(`🏢 AWS Account: ${env.account}`);
console.log(`🌍 AWS Region: ${env.region}`);
console.log(`📦 Environment: ${stage}`);

// Create certificate stack for production
let certificateStack;
if (stage === 'prod') {
  certificateStack = new CertificateStack(app, `LightningTalkCertificate-${stage}`, {
    env: {
      ...env,
      region: 'us-east-1', // Certificates for CloudFront must be in us-east-1
    },
    description: `Lightning Talk Circle - ACM Certificate for all domains (${stage})`,
    domainName: config.domainName,
    hostedZoneId: config.hostedZoneId,
    environment: stage,
    tags: {
      Project: config.projectName,
      Environment: stage,
      ManagedBy: 'cdk',
    },
  });
  
  // Update the certificate ARN in config to use the new certificate
  config.certificateArn = certificateStack.certificate.certificateArn;
}

// Create main environment stack based on stage
if (stage === 'prod') {
  new ProdEnvironmentStack(app, `LightningTalkProd-${stage}`, {
    env: env,
    description: `Lightning Talk Circle - Production Environment (${stage})`,
    environment: stage,
    domainConfig: {
      domainName: config.domainName,
      hostedZoneId: config.hostedZoneId,
    },
    enableMonitoring: config.monitoring.enableCloudWatch,
    enableWaf: true,
    enableCostMonitoring: true,
    alertEmail: config.alertEmail || 'admin@lightningtalk.com',
    tags: {
      Project: config.projectName,
      Environment: stage,
      ManagedBy: 'cdk',
    },
  });
} else {
  new DevEnvironmentStack(app, `LightningTalkDev-${stage}`, {
    env: env,
    description: `Lightning Talk Circle - Development Environment (${stage})`,
    environment: stage,
    domainConfig: {
      domainName: config.domainName,
    },
    enableMonitoring: config.monitoring.enableCloudWatch,
    enableCaching: false,
    tags: {
      Project: config.projectName,
      Environment: stage,
      ManagedBy: 'cdk',
    },
  });
}

// Create Cognito stack (shared between environments)
new CognitoStack(app, `LightningTalkCognito-${stage}`, {
  env: env,
  description: `Lightning Talk Circle - Authentication Infrastructure (${stage})`,
  config: config,
  tags: {
    Project: config.projectName,
    Environment: stage,
    ManagedBy: 'cdk',
  },
});

// Create WebSocket stack for real-time updates
new WebSocketStack(app, `LightningTalkWebSocket-${stage}`, {
  env: env,
  description: `Lightning Talk Circle - WebSocket API for Real-time Updates (${stage})`,
  config: config,
  tags: {
    Project: config.projectName,
    Environment: stage,
    ManagedBy: 'cdk',
  },
});

// Create Storybook stacks for staging and production
if (stage === 'prod') {
  // Production Storybook
  new StorybookStack(app, `LightningTalkStorybook-prod`, {
    env: env,
    description: `Lightning Talk Circle - Storybook Production`,
    domainName: config.domainName,
    environment: 'production',
    certificateArn: config.certificateArn,
    hostedZoneId: config.hostedZoneId,
    tags: {
      Project: config.projectName,
      Environment: 'production',
      Component: 'Storybook',
      ManagedBy: 'cdk',
    },
  });
  
  // Staging Storybook  
  new StorybookStack(app, `LightningTalkStorybook-staging`, {
    env: env,
    description: `Lightning Talk Circle - Storybook Staging`,
    domainName: config.domainName,
    environment: 'staging',
    certificateArn: config.certificateArn,
    hostedZoneId: config.hostedZoneId,
    tags: {
      Project: config.projectName,
      Environment: 'staging',
      Component: 'Storybook',
      ManagedBy: 'cdk',
    },
  });
}

app.synth();