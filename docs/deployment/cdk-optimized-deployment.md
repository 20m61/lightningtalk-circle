# CDK Optimized Stack Deployment Guide

## Overview

This guide covers the deployment process for the optimized CDK stack architecture, which consolidates infrastructure from 6 stacks into 4 optimized stacks.

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Node.js 18.x** or higher installed
3. **AWS CDK 2.x** installed globally: `npm install -g aws-cdk`
4. **GitHub Personal Access Token** (for GitHub integration features)
5. **Domain and Route53 Hosted Zone** (for production deployments)

## Stack Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   BaseInfrastructure (prod only)            │
│                 - Route53 Hosted Zone                       │
│                 - ACM Certificate (us-east-1)               │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SharedResources                        │
│   - Cognito User Pool & Identity Pool                      │
│   - DynamoDB Tables (Events, Participants, Talks, Users)   │
│   - S3 Buckets (Uploads, Assets)                          │
│   - Secrets Manager                                        │
│   - SSM Parameter Store                                    │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Application                           │
│   - Lambda Functions (with Layer)                          │
│   - API Gateway                                            │
│   - CloudFront Distribution                                │
│   - Static Site S3 Bucket                                  │
│   - Route53 A Records                                      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Operations (Optional)                     │
│   - CloudWatch Dashboard                                    │
│   - CloudWatch Alarms                                      │
│   - Cost Budget Alerts                                     │
│   - SNS Topics                                             │
└─────────────────────────────────────────────────────────────┘
```

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/20m61/lightningtalk-circle.git
cd lightningtalk-circle/cdk
npm install
```

### 2. Build Lambda Layer

Before deploying, build the Lambda layer dependencies:

```bash
cd layers/dependencies
./build.sh
cd ../..
```

### 3. Configure Environment

Edit `lib/config/environment.js` to set your environment-specific values:

```javascript
// For development
dev: {
  domainName: 'dev.example.com',
  alertEmail: 'alerts@example.com',
}

// For production
prod: {
  domainName: 'example.com',
  hostedZoneId: 'Z1234567890ABC',
  certificateArn: 'arn:aws:acm:us-east-1:...',
  alertEmail: 'alerts@example.com',
}
```

## Deployment Steps

### Development Environment

```bash
# 1. Set environment
export CDK_STAGE=dev

# 2. Bootstrap CDK (first time only)
npm run bootstrap:dev

# 3. Deploy all stacks
npm run deploy:optimized

# Or deploy individual stacks
npx cdk deploy LTC-SharedResources-dev --app "node bin/cdk-optimized.js" -c env=dev
npx cdk deploy LTC-Application-dev --app "node bin/cdk-optimized.js" -c env=dev
npx cdk deploy LTC-Operations-dev --app "node bin/cdk-optimized.js" -c env=dev
```

### Production Environment

```bash
# 1. Set environment
export CDK_STAGE=prod

# 2. Bootstrap CDK (first time only)
npm run bootstrap:prod

# 3. Deploy base infrastructure (prod only)
npx cdk deploy LTC-BaseInfra-prod --app "node bin/cdk-optimized.js" -c env=prod

# 4. Deploy all other stacks
npm run deploy:optimized:prod
```

## Migration from Existing Infrastructure

### Step 1: Backup Existing Resources

```bash
cd cdk
./scripts/backup-existing-resources.sh prod
# Creates backup in ./backups/[timestamp]/
```

### Step 2: Deploy New Infrastructure

Deploy the new optimized stacks alongside existing infrastructure:

```bash
npm run deploy:optimized:prod
```

### Step 3: Import Existing Resources (Optional)

If you want to import existing resources into CloudFormation:

```bash
./scripts/import-existing-resources.sh prod
# Follow the generated instructions in ./imports/[timestamp]/
```

### Step 4: Migrate Data

```bash
# Dry run first
./scripts/migrate-data.sh prod prod-new dry-run

# Actual migration
./scripts/migrate-data.sh prod prod-new
```

### Step 5: Update DNS

Update Route53 A records to point to the new CloudFront distribution.

### Step 6: Verify and Monitor

1. Test all endpoints
2. Check CloudWatch dashboards
3. Verify data integrity
4. Monitor error rates

### Step 7: Decommission Old Infrastructure

Once confident with the new setup:

```bash
# Delete old stacks
cdk destroy LightningTalkCircle-prod
cdk destroy LightningTalkCognito-prod
# ... etc
```

## Cost Optimization Details

The optimized stacks implement several cost-saving measures:

### Development Environment
- **DynamoDB**: On-Demand billing (saves ~$20/month)
- **Lambda**: 512MB memory allocation
- **CloudFront**: PriceClass_100 (North America/Europe only)
- **S3**: 30-day lifecycle policy
- **Logs**: 1-week retention

### Production Environment
- **DynamoDB**: Provisioned with Auto Scaling
- **Lambda**: 1024MB memory with reserved concurrency
- **CloudFront**: PriceClass_All for global coverage
- **S3**: Versioning enabled, 90-day lifecycle
- **Logs**: 3-month retention

## Monitoring and Alerts

### CloudWatch Dashboard

Access the dashboard at:
```
https://ap-northeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=Lightning-Talk-Circle-[env]
```

### Alert Conditions

- Lambda error rate > 5% (dev) or 1% (prod)
- API Gateway 5xx errors > 1%
- Lambda duration > 5s (dev) or 3s (prod)
- Monthly cost exceeds budget

## Troubleshooting

### Common Issues

1. **Lambda Layer Too Large**
   ```bash
   cd layers/dependencies
   # Edit package.json to remove unnecessary packages
   ./build.sh
   ```

2. **SSM Parameter Not Found**
   - Ensure SharedResources stack is deployed first
   - Check parameter names match between stacks

3. **Import Fails**
   - Verify resource names match exactly
   - Check CloudFormation import compatibility

4. **Migration Script Errors**
   - Ensure both source and target environments exist
   - Check AWS credentials have necessary permissions

## Rollback Procedure

If issues occur during migration:

1. **Immediate Rollback**
   ```bash
   # Update DNS back to old CloudFront
   # No data changes needed if using same backend
   ```

2. **Data Rollback**
   ```bash
   # If data was migrated
   ./scripts/migrate-data.sh prod-new prod
   ```

3. **Infrastructure Rollback**
   ```bash
   npm run destroy:optimized:prod
   ```

## Security Considerations

1. **Secrets Management**
   - All secrets stored in AWS Secrets Manager
   - Accessed via IAM roles only

2. **Network Security**
   - CloudFront with AWS WAF (production)
   - API Gateway with request validation

3. **Access Control**
   - Cognito for user authentication
   - IAM roles follow least privilege principle

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review CloudWatch alarms
   - Check cost trends

2. **Monthly**
   - Update dependencies in Lambda layer
   - Review and optimize DynamoDB capacity

3. **Quarterly**
   - Security audit
   - Cost optimization review

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review this documentation
3. Create GitHub issue: https://github.com/20m61/lightningtalk-circle/issues