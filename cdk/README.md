# Lightning Talk Circle - CDK Infrastructure

This directory contains AWS CDK (Cloud Development Kit) infrastructure code for
deploying the Lightning Talk Circle application on AWS.

## Architecture Overview

The infrastructure consists of multiple CDK stacks:

- **DatabaseStack**: VPC, RDS PostgreSQL, ElastiCache Redis, and optional
  bastion host
- **ApiStack**: ECS Fargate service, Application Load Balancer with HTTPS, and
  API container
- **StaticSiteStack**: S3 bucket and CloudFront distribution for static assets
- **MonitoringStack**: CloudWatch dashboards, alarms, and log aggregation
- **CostMonitoringStack**: AWS Budgets, cost anomaly detection, and spending
  alerts

## Prerequisites

- Node.js 18+ installed
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Docker installed (for building container images)

## Environment Setup

1. **Install dependencies**:

   ```bash
   cd cdk
   npm install
   ```

2. **Configure domain settings**:
   - Copy `lib/config/domain-config.example.json` to
     `lib/config/domain-config.json`
   - Update with your actual domain names and Route53 hosted zone IDs

3. **Set environment variables**:

   ```bash
   export CDK_DEFAULT_ACCOUNT=123456789012  # Your AWS account ID
   export CDK_DEFAULT_REGION=ap-northeast-1  # Your AWS region
   ```

4. **Bootstrap CDK** (one-time setup per account/region):
   ```bash
   npx cdk bootstrap
   ```

## Configuration

The infrastructure uses environment-specific configurations located in
`lib/config/`:

- `dev.json` - Development environment settings
- `staging.json` - Staging environment settings
- `production.json` - Production environment settings
- `domain-config.json` - Domain and certificate configuration (create from
  example)

### Key Configuration Options

- **Database**: Instance class, storage, backup retention, multi-AZ
- **API**: Container resources, auto-scaling, health checks
- **Cache**: Redis node type, number of nodes, backup settings
- **Monitoring**: Detailed monitoring, log retention, alerting
- **Security**: WAF rules, allowed CIDRs, bastion host access

## Deployment

### Deploy All Stacks

Deploy to a specific environment:

```bash
# Development
npx cdk deploy --all --context env=dev

# Staging
npx cdk deploy --all --context env=staging

# Production (requires approval)
npx cdk deploy --all --context env=prod --require-approval broadening
```

### Deploy Individual Stacks

Deploy stacks in the correct order:

```bash
# 1. Database infrastructure first
npx cdk deploy LightningTalk-Database-dev --context env=dev

# 2. API infrastructure (depends on database)
npx cdk deploy LightningTalk-Api-dev --context env=dev

# 3. Static site infrastructure
npx cdk deploy LightningTalk-StaticSite-dev --context env=dev

# 4. Monitoring (optional)
npx cdk deploy LightningTalk-Monitoring-dev --context env=dev

# 5. Cost monitoring (optional)
npx cdk deploy LightningTalk-CostMonitoring-dev --context env=dev
```

### Review Changes Before Deployment

Always review infrastructure changes before deploying:

```bash
npx cdk diff --context env=dev
```

## Stack Management

### List All Stacks

```bash
npx cdk ls --context env=dev
```

### View Stack Outputs

```bash
aws cloudformation describe-stacks --stack-name LightningTalk-Api-dev \
  --query "Stacks[0].Outputs"
```

### Destroy Stacks

⚠️ **Warning**: This will delete all resources including databases!

```bash
# Destroy in reverse order
npx cdk destroy LightningTalk-Monitoring-dev --context env=dev
npx cdk destroy LightningTalk-StaticSite-dev --context env=dev
npx cdk destroy LightningTalk-Api-dev --context env=dev
npx cdk destroy LightningTalk-Database-dev --context env=dev
```

## Testing

Run unit tests for CDK code:

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## CI/CD Integration

The infrastructure is automatically deployed via GitHub Actions:

- **Pull Requests**: Runs `cdk diff` and posts results as PR comment
- **Main branch**: Deploys to production environment
- **Develop branch**: Deploys to staging environment
- **Feature branches**: Deploys to dev environment

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

- `AWS_ACCESS_KEY_ID` - AWS access key for dev/staging
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for dev/staging
- `AWS_ACCESS_KEY_ID_PROD` - AWS access key for production
- `AWS_SECRET_ACCESS_KEY_PROD` - AWS secret key for production

## Security Considerations

- All data is encrypted at rest (RDS, S3, ElastiCache)
- HTTPS is enforced on all public endpoints
- WAF rules protect against common attacks
- Database credentials are stored in AWS Secrets Manager
- Network isolation with private subnets for databases
- Bastion host available for emergency access (production only)

## Cost Optimization

- Auto-scaling configured for ECS tasks
- CloudFront caching reduces origin requests
- S3 lifecycle policies for log rotation
- Cost monitoring alerts at 80% and 100% of budget
- Development environments use smaller instance sizes

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Error**:

   ```bash
   npx cdk bootstrap aws://ACCOUNT_ID/REGION
   ```

2. **Docker Build Failures**:
   - Ensure Docker daemon is running
   - Check available disk space
   - Review Dockerfile in `../docker/Dockerfile.production`

3. **Domain Configuration**:
   - Verify Route53 hosted zone exists
   - Ensure domain names are correctly configured
   - ACM certificates must be in us-east-1 for CloudFront

4. **Permission Errors**:
   - Verify AWS credentials have necessary permissions
   - Check IAM policies for CDK deployment role

### Useful Commands

```bash
# View CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name LightningTalk-Api-dev \
  --max-items 20

# Check ECS service status
aws ecs describe-services \
  --cluster lightningtalk-api-cluster \
  --services lightningtalk-api-service

# View application logs
aws logs tail /aws/ecs/lightningtalk-api --follow
```

## Support

For issues or questions:

- Check AWS CloudFormation console for deployment errors
- Review CloudWatch logs for application errors
- Consult the main project documentation in `../docs/`
