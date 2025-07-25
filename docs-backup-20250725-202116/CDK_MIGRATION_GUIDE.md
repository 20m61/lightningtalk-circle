# Lightning Talk Circle - CDK Migration Guide

## Overview

This guide documents the complete migration of Lightning Talk Circle from
traditional hosting to AWS CDK-based cloud infrastructure. The migration
introduces a modern, scalable, and maintainable cloud architecture using
Infrastructure as Code (IaC) principles.

## Architecture Summary

### Cloud Infrastructure Stack

- **VPC & Networking**: Isolated virtual private cloud with public/private
  subnets
- **Application Layer**: ECS Fargate containers with auto-scaling
- **Database Layer**: RDS PostgreSQL with high availability
- **Static Assets**: S3 + CloudFront distribution
- **Load Balancing**: Application Load Balancer with health checks
- **Monitoring**: CloudWatch metrics, alarms, and custom dashboards
- **Security**: Secrets Manager, security groups, and encrypted storage

### Environment Support

- **Development**: Single AZ, minimal resources, cost-optimized
- **Staging**: Multi-AZ ready, moderate resources, production-like
- **Production**: High availability, auto-scaling, performance-optimized

## Key Components

### 1. Database Stack (`cdk/lib/stacks/database-stack.ts`)

Creates the foundational networking and database infrastructure:

```typescript
// Key features:
- VPC with public/private subnets across 2 AZs
- RDS PostgreSQL with automated backups
- ElastiCache Redis for session storage
- Security groups with least privilege access
- Encrypted storage and transit
```

**Environment Configurations:**

- **Dev**: db.t3.micro, single AZ, 7-day backup retention
- **Staging**: db.t3.small, single AZ, 14-day backup retention
- **Production**: db.t3.medium, multi-AZ, 30-day backup retention

### 2. API Stack (`cdk/lib/stacks/api-stack.ts`)

Manages the containerized application infrastructure:

```typescript
// Key features:
- ECS Fargate cluster with auto-scaling
- Application Load Balancer with health checks
- ECR repository for container images
- Secrets Manager integration
- CloudWatch logging and monitoring
```

**Auto-scaling Configuration:**

- **Dev**: 1-2 tasks, no auto-scaling
- **Staging**: 1-3 tasks, CPU/memory-based scaling
- **Production**: 2-10 tasks, advanced auto-scaling rules

### 3. Static Site Stack (`cdk/lib/stacks/static-site-stack.ts`)

Handles static asset distribution:

```typescript
// Key features:
- S3 bucket with public access policies
- CloudFront distribution for global CDN
- Custom domain support (optional)
- SPA routing and error handling
```

### 4. Monitoring Stack (`cdk/lib/stacks/monitoring-stack.ts`)

Comprehensive observability and alerting:

```typescript
// Key features:
- CloudWatch dashboard with key metrics
- Automated alerts for critical thresholds
- SNS topic for notifications
- Custom metrics and log insights queries
- Lambda functions for advanced monitoring
```

**Alert Thresholds:**

- Database CPU > 80%
- Application response time > 2 seconds
- 5XX error rate > 1%
- Database storage < 2GB free
- ECS CPU/Memory > 80%/85%

### 5. WordPress Stack (`cdk/lib/stacks/wordpress-stack.ts`)

Optional WordPress hosting capability:

```typescript
// Key features:
- ECS Fargate service for WordPress
- EFS for persistent file storage
- Separate MySQL database
- Load balancer integration
```

## Deployment Process

### 1. Prerequisites Setup

```bash
# Install AWS CDK
npm install -g aws-cdk

# Configure AWS credentials
aws configure

# Bootstrap CDK (one-time per region)
npx cdk bootstrap
```

### 2. Environment Configuration

Update environment-specific settings in `cdk/lib/shared/config.ts`:

```typescript
export interface EnvironmentConfig {
  appName: string;
  domain?: string; // Optional custom domain
  database: {
    instanceClass: string;
    multiAz: boolean;
    backupRetention: number;
    deletionProtection: boolean;
    connectionLimit: number;
  };
  api: {
    instanceCount: { min: number; max: number; desired: number };
    cpu: number;
    memory: number;
    autoScaling: boolean;
  };
  monitoring: {
    enableDetailedMonitoring: boolean;
    logRetention: number;
  };
}
```

### 3. Docker Image Preparation

```bash
# Build and push to ECR
./scripts/docker-build-push.sh [environment] [tag]

# Example
./scripts/docker-build-push.sh dev latest
```

### 4. Infrastructure Deployment

```bash
# Deploy all stacks for an environment
npm run cdk:deploy:[environment]

# Or deploy individual stacks
npx cdk deploy LightningTalk-Database-dev
npx cdk deploy LightningTalk-Api-dev
npx cdk deploy LightningTalk-Monitoring-dev
```

### 5. Database Initialization

```bash
# Run database migrations
./scripts/db-migration.sh [environment] init

# Example
./scripts/db-migration.sh dev init
```

### 6. Monitoring Setup

```bash
# Configure monitoring and alerts
./scripts/setup-monitoring.sh [environment]

# With email alerts
ALERT_EMAIL=admin@example.com ./scripts/setup-monitoring.sh prod
```

## GitHub Actions CI/CD Pipeline

The migration includes a comprehensive CI/CD pipeline
(`.github/workflows/cdk-deploy.yml`):

### Pipeline Stages

1. **Test**: Unit tests, linting, static builds
2. **Build & Push**: Docker image creation and ECR push
3. **CDK Diff**: Infrastructure change preview (PR only)
4. **Deploy**: Environment-specific deployments
5. **Notify**: Deployment status notifications

### Environment Mapping

- `feature/cdk-migration` → Development
- `develop` → Staging
- `main` → Production

### Required Secrets

```bash
# Development/Staging
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# Production (separate credentials)
AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD
```

## Scripts and Automation

### Core Scripts

1. **`scripts/docker-build-push.sh`**: Docker image management
2. **`scripts/db-migration.sh`**: Database schema and migrations
3. **`scripts/setup-monitoring.sh`**: Monitoring and alerting setup

### NPM Scripts

```json
{
  "cdk:install": "cd cdk && npm install",
  "cdk:build": "cd cdk && npm run build",
  "cdk:synth": "cd cdk && npx cdk synth",
  "cdk:diff": "cd cdk && npx cdk diff",
  "cdk:deploy:dev": "cd cdk && npx cdk deploy --all --context env=dev",
  "cdk:deploy:staging": "cd cdk && npx cdk deploy --all --context env=staging",
  "cdk:deploy:prod": "cd cdk && npx cdk deploy --all --context env=prod"
}
```

## Security Features

### Infrastructure Security

- VPC isolation with private subnets
- Security groups with minimal required access
- Encrypted storage (EBS, RDS, S3)
- Secrets Manager for credential management
- IAM roles with least privilege principles

### Application Security

- Container security scanning (ECR)
- HTTPS-only communication
- Rate limiting and CORS configuration
- Input validation and sanitization
- Session management with Redis

### Monitoring Security

- CloudTrail logging for audit trails
- CloudWatch alerts for suspicious activity
- Resource-level permissions
- Encrypted log storage

## Cost Optimization

### Development Environment

- t3.micro instances for minimal cost
- Single AZ deployment
- Shorter backup retention
- Basic monitoring

### Production Environment

- Right-sized instances based on usage
- Multi-AZ for availability only where needed
- Auto-scaling to handle load variations
- Spot instances for non-critical workloads

### Cost Monitoring

- CloudWatch billing alerts
- Resource tagging for cost allocation
- Regular usage reviews and optimization

## Migration Benefits

### Scalability

- Horizontal auto-scaling based on demand
- Elastic load balancing
- Distributed architecture
- Cloud-native services

### Reliability

- Multi-AZ availability
- Automated failover
- Health checks and auto-recovery
- Backup and disaster recovery

### Maintainability

- Infrastructure as Code (IaC)
- Version-controlled infrastructure
- Consistent environments
- Automated deployments

### Observability

- Comprehensive monitoring dashboards
- Automated alerting
- Centralized logging
- Performance metrics

## Troubleshooting Guide

### Common Issues

#### 1. CDK Deployment Failures

```bash
# Check CDK context
npx cdk context

# Clear CDK cache
npx cdk context --clear

# Verbose deployment
npx cdk deploy --verbose
```

#### 2. Docker Build Issues

```bash
# Check Docker daemon
docker info

# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache
```

#### 3. Database Connection Problems

```bash
# Test database connectivity
./scripts/db-migration.sh dev test

# Check security groups
aws ec2 describe-security-groups --filters "Name=group-name,Values=*lightningtalk*"

# Verify secrets
aws secretsmanager get-secret-value --secret-id lightningtalk-dev/database/credentials
```

#### 4. Application Health Issues

```bash
# Check ECS service status
aws ecs describe-services --cluster lightningtalk-api-cluster --services lightningtalk-api-service

# Review CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/aws/ecs/lightningtalk"

# Check load balancer health
aws elbv2 describe-target-health --target-group-arn [target-group-arn]
```

### Monitoring and Alerts

#### CloudWatch Dashboards

Access the monitoring dashboard at:

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=lightningtalk-[env]-dashboard
```

#### Log Insights Queries

Pre-configured queries for common troubleshooting:

- Error analysis and patterns
- Performance monitoring
- Database connection tracking
- Security audit trails

#### Alert Configuration

Configure email/SMS alerts:

```bash
ALERT_EMAIL=admin@example.com ALERT_PHONE=+1234567890 ./scripts/setup-monitoring.sh prod
```

## Migration Checklist

### Pre-Migration

- [ ] AWS account setup and credentials
- [ ] Domain and SSL certificates (if using custom domains)
- [ ] Backup existing data and configurations
- [ ] Review security requirements
- [ ] Plan maintenance window

### Migration Steps

- [ ] Deploy CDK infrastructure
- [ ] Build and push Docker images
- [ ] Initialize database schema
- [ ] Configure monitoring and alerts
- [ ] Test application functionality
- [ ] Set up CI/CD pipeline
- [ ] Configure custom domains (if applicable)
- [ ] Performance testing

### Post-Migration

- [ ] Monitor application performance
- [ ] Verify backup processes
- [ ] Test disaster recovery procedures
- [ ] Review and optimize costs
- [ ] Update documentation
- [ ] Train team on new infrastructure

## Future Enhancements

### Planned Improvements

1. **Multi-Region Deployment**: Cross-region replication for disaster recovery
2. **Advanced Auto-Scaling**: Predictive scaling based on historical patterns
3. **Enhanced Security**: WAF integration and advanced threat detection
4. **Cost Optimization**: Reserved instances and Savings Plans
5. **Performance**: Redis ElastiCache for application caching
6. **Compliance**: Additional logging and audit features

### Monitoring Enhancements

1. **Custom Metrics**: Application-specific performance indicators
2. **Advanced Alerting**: Machine learning-based anomaly detection
3. **Integration**: Slack, PagerDuty, and other notification systems
4. **Dashboards**: Executive-level reporting and analytics

This migration represents a significant modernization of the Lightning Talk
Circle infrastructure, providing a solid foundation for future growth and
scalability.
