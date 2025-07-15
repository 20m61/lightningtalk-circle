# CDK Stack Consolidation Deployment Guide

## Overview

This guide covers the migration from multiple individual CDK stacks to a
consolidated two-stack architecture for the Lightning Talk Circle project.

## New Architecture

### Stack Structure

#### Development Environment

- **LightningTalkDev-dev**: Cost-optimized development stack
  - Lambda-based API (cheaper than ECS)
  - Basic DynamoDB tables (PAY_PER_REQUEST)
  - S3 + CloudFront for static assets
  - Basic monitoring with short retention

#### Production Environment

- **LightningTalkProd-prod**: High-availability production stack
  - ECS Fargate with ALB for scalability
  - Enhanced DynamoDB with backup and GSIs
  - WAF protection and enhanced monitoring
  - Cost monitoring with budget alerts

#### Shared Stacks

- **LightningTalkCognito-{env}**: Authentication infrastructure
- **LightningTalkWebSocket-{env}**: Real-time communication

## Migration Process

### Prerequisites

1. **CDK CLI**: Ensure you have the latest version installed

   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

2. **AWS Credentials**: Configure your AWS credentials

   ```bash
   aws configure
   ```

3. **Environment Variables**: Set required environment variables
   ```bash
   export AWS_ACCOUNT_ID=your-account-id
   export AWS_REGION=ap-northeast-1
   export HOSTED_ZONE_ID=your-hosted-zone-id  # For production
   export PROD_ALERT_EMAIL=admin@lightningtalk.com
   ```

### Step 1: Backup Current Stacks

Before migration, export current stack resources:

```bash
# Navigate to CDK directory
cd cdk

# Make migration script executable
chmod +x scripts/migrate-stacks.js

# Dry run to see what would be done
node scripts/migrate-stacks.js dev --dry-run
```

### Step 2: Deploy New Consolidated Stacks

#### For Development Environment:

```bash
# Deploy development stack
cdk deploy LightningTalkDev-dev --require-approval never

# Deploy shared stacks
cdk deploy LightningTalkCognito-dev --require-approval never
cdk deploy LightningTalkWebSocket-dev --require-approval never
```

#### For Production Environment:

```bash
# Deploy production stack
cdk deploy LightningTalkProd-prod --require-approval never

# Deploy shared stacks
cdk deploy LightningTalkCognito-prod --require-approval never
cdk deploy LightningTalkWebSocket-prod --require-approval never
```

### Step 3: Verify New Stacks

1. **Check AWS Console**: Verify resources are created correctly
2. **Test API Endpoints**: Ensure API Gateway/ALB is functioning
3. **Test Authentication**: Verify Cognito integration
4. **Test Real-time Features**: Check WebSocket connections

### Step 4: Migrate Data (if needed)

If you have existing data in old DynamoDB tables:

```bash
# Use AWS CLI to backup and restore data
aws dynamodb scan --table-name old-table-name --output json > backup.json
aws dynamodb batch-write-item --request-items file://backup.json
```

### Step 5: Update Application Configuration

Update your application to use new resource names:

```javascript
// Example environment variables
const config = {
  // New stack outputs
  apiEndpoint: process.env.API_ENDPOINT, // From new stack
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID
  // ... other configurations
};
```

### Step 6: Destroy Old Stacks

**⚠️ Only after thorough verification:**

```bash
# Run migration script with destroy flag
node scripts/migrate-stacks.js dev --destroy-old
```

## Stack Outputs

### Development Stack (LightningTalkDev-dev)

- API Gateway URL
- Lambda function ARN
- DynamoDB table names
- CloudFront distribution domain
- S3 bucket name

### Production Stack (LightningTalkProd-prod)

- Load balancer DNS name
- ECS cluster ARN
- DynamoDB table names
- CloudFront distribution domain
- S3 bucket name

## Cost Optimization

### Development Environment

- **Lambda API**: Pay per request, no idle costs
- **DynamoDB**: PAY_PER_REQUEST billing
- **No NAT Gateway**: Uses public subnets
- **Short log retention**: 1 week
- **No advanced monitoring**: Basic CloudWatch only

### Production Environment

- **ECS Fargate**: Auto-scaling based on load
- **ALB**: Distributes traffic efficiently
- **DynamoDB**: On-demand with backup
- **Cost monitoring**: Budget alerts at 80% threshold
- **Single NAT Gateway**: Cost-optimized networking

## Monitoring and Alerting

### Development

- Basic CloudWatch metrics
- Error rate monitoring
- Duration monitoring

### Production

- Enhanced CloudWatch dashboard
- ECS service monitoring
- ALB target health monitoring
- DynamoDB throttling alerts
- Cost budget alerts
- Email notifications

## Troubleshooting

### Common Issues

1. **Stack deployment fails with permissions error**

   ```bash
   # Check IAM permissions
   aws sts get-caller-identity
   # Ensure your user has necessary CDK permissions
   ```

2. **Domain configuration issues**

   ```bash
   # Verify hosted zone exists
   aws route53 list-hosted-zones
   # Update HOSTED_ZONE_ID environment variable
   ```

3. **Resource conflicts**
   ```bash
   # Check for existing resources with same names
   aws cloudformation list-stacks
   # Use different stack names if needed
   ```

### Rollback Procedure

If migration fails:

1. **Keep old stacks running**
2. **Delete new stacks**:
   ```bash
   cdk destroy LightningTalkDev-dev --force
   cdk destroy LightningTalkCognito-dev --force
   cdk destroy LightningTalkWebSocket-dev --force
   ```
3. **Restore from backups** if needed
4. **Investigate and fix issues**
5. **Retry migration**

## Performance Considerations

### Development

- **Cold starts**: Lambda functions may have cold start delays
- **Concurrency**: Lambda has default concurrency limits
- **Storage**: S3 for static assets, DynamoDB for data

### Production

- **High availability**: Multi-AZ deployment
- **Auto-scaling**: ECS services scale based on CPU/memory
- **Caching**: CloudFront for static assets
- **Database**: DynamoDB with GSIs for efficient queries

## Security

### Development

- **Basic security**: Standard security groups
- **No WAF**: Cost optimization
- **HTTPS**: Enforced via CloudFront

### Production

- **WAF protection**: AWS managed rule sets
- **Enhanced security**: Advanced threat protection
- **Encryption**: At rest and in transit
- **Secrets management**: AWS Secrets Manager

## Maintenance

### Regular Tasks

1. **Monitor costs**: Check AWS Cost Explorer monthly
2. **Update dependencies**: Keep CDK and constructs updated
3. **Security patches**: Apply AWS security updates
4. **Backup verification**: Test backup/restore procedures

### Updates

To update stacks:

```bash
# Update CDK
npm update -g aws-cdk

# Update dependencies
npm update

# Deploy changes
cdk deploy --all
```

## Support

### Documentation

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Project README](../README.md)
- [CLAUDE.md](../CLAUDE.md) - Development guidelines

### Troubleshooting

- Check CloudWatch logs for errors
- Use AWS CloudFormation console for stack events
- Review CDK diff output before deployment

### Contact

- Development team: dev@lightningtalk.com
- Production issues: admin@lightningtalk.com
