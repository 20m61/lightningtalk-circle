# Lightning Talk Circle - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying Lightning Talk
Circle to production using AWS CDK with enterprise-grade infrastructure
including security, monitoring, disaster recovery, and observability.

## Prerequisites

### Required Tools

```bash
# AWS CLI
aws --version  # >= 2.x

# AWS CDK
npm install -g aws-cdk
cdk --version  # >= 2.x

# Node.js
node --version  # >= 18.x
npm --version   # >= 9.x

# Docker
docker --version  # >= 20.x

# Git
git --version
```

### AWS Account Setup

1. **AWS Account Configuration**
   - Dedicated AWS account for production
   - Appropriate IAM permissions for CDK deployment
   - Service limits increased if needed

2. **Domain and SSL**
   - Domain registered (e.g., lightningtalk.com)
   - Route 53 hosted zone configured
   - SSL certificate in AWS Certificate Manager

3. **Environment Variables**
   ```bash
   export AWS_ACCOUNT_ID=123456789012
   export AWS_DEFAULT_REGION=us-east-1
   export CDK_DEFAULT_ACCOUNT=123456789012
   export CDK_DEFAULT_REGION=us-east-1
   ```

## Configuration

### 1. Environment Configuration

Create production configuration file:

```bash
# Create production config
cp cdk/lib/shared/config.dev.ts cdk/lib/shared/config.prod.ts
```

Edit `config.prod.ts`:

```typescript
export const prodConfig: EnvironmentConfig = {
  appName: 'lightningtalk',
  domain: 'lightningtalk.com',

  database: {
    instanceClass: 'db.r6g.large',
    allocatedStorage: 100,
    backupRetention: 30,
    multiAZ: true,
    deletionProtection: true,
    monitoringInterval: 60
  },

  api: {
    desiredCount: 3,
    maxCapacity: 10,
    cpu: 1024,
    memory: 2048,
    autoScaling: {
      targetCpuUtilization: 70,
      scaleUpCooldown: 300,
      scaleDownCooldown: 300
    }
  },

  security: {
    enableWaf: true,
    enableGuardDuty: true,
    allowedIpRanges: ['0.0.0.0/0'], // Configure as needed
    sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01'
  },

  monitoring: {
    logRetentionDays: 365,
    alertEmail: 'alerts@lightningtalk.com',
    enableDetailedMonitoring: true
  },

  wordpress: {
    enabled: false // Enable if WordPress theme is needed
  }
};
```

### 2. Secrets Configuration

Set up AWS Secrets Manager:

```bash
# Database credentials
aws secretsmanager create-secret \
  --name "lightningtalk-prod/database/credentials" \
  --description "Production database credentials" \
  --secret-string '{
    "username": "admin",
    "password": "GENERATE_SECURE_PASSWORD",
    "host": "lightningtalk-prod-database.cluster-xxx.us-east-1.rds.amazonaws.com",
    "port": "5432",
    "dbname": "lightningtalk"
  }'

# Application secrets
aws secretsmanager create-secret \
  --name "lightningtalk-prod/app/secrets" \
  --description "Production application secrets" \
  --secret-string '{
    "jwt_secret": "GENERATE_JWT_SECRET",
    "session_secret": "GENERATE_SESSION_SECRET",
    "encryption_key": "GENERATE_ENCRYPTION_KEY",
    "github_token": "YOUR_GITHUB_TOKEN",
    "email_password": "YOUR_EMAIL_PASSWORD"
  }'
```

### 3. GitHub Secrets (for CI/CD)

Configure GitHub repository secrets:

```
AWS_ACCOUNT_ID=123456789012
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_DEFAULT_REGION=us-east-1
DOCKER_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
```

## Deployment Process

### Phase 1: Foundation Infrastructure

1. **Bootstrap CDK**

   ```bash
   cdk bootstrap aws://123456789012/us-east-1
   ```

2. **Deploy Database Stack**

   ```bash
   cdk deploy lightningtalk-Database-prod \
     --context env=prod \
     --require-approval never
   ```

3. **Deploy Security Stack**
   ```bash
   cdk deploy lightningtalk-Security-prod \
     --context env=prod \
     --require-approval never
   ```

### Phase 2: Application Infrastructure

4. **Build and Push Docker Image**

   ```bash
   # Build optimized production image
   docker build -t lightningtalk-api:prod -f Dockerfile.optimized .

   # Tag and push to ECR
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

   docker tag lightningtalk-api:prod \
     123456789012.dkr.ecr.us-east-1.amazonaws.com/lightningtalk-api:prod

   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/lightningtalk-api:prod
   ```

5. **Deploy API Stack**

   ```bash
   cdk deploy lightningtalk-Api-prod \
     --context env=prod \
     --require-approval never
   ```

6. **Deploy Static Site Stack**
   ```bash
   cdk deploy lightningtalk-StaticSite-prod \
     --context env=prod \
     --require-approval never
   ```

### Phase 3: Monitoring and Observability

7. **Deploy Observability Stack**

   ```bash
   cdk deploy lightningtalk-Observability-prod \
     --context env=prod \
     --require-approval never
   ```

8. **Deploy Monitoring Stack**
   ```bash
   cdk deploy lightningtalk-Monitoring-prod \
     --context env=prod \
     --require-approval never
   ```

### Phase 4: Disaster Recovery

9. **Deploy Disaster Recovery Stack**
   ```bash
   cdk deploy lightningtalk-DisasterRecovery-prod \
     --context env=prod \
     --require-approval never
   ```

### Phase 5: WordPress (Optional)

10. **Deploy WordPress Stack** (if enabled)
    ```bash
    cdk deploy lightningtalk-WordPress-prod \
      --context env=prod \
      --require-approval never
    ```

## Post-Deployment Configuration

### 1. DNS Configuration

Configure Route 53 records:

```bash
# Get CloudFront distribution domain from stack outputs
aws cloudformation describe-stacks \
  --stack-name lightningtalk-StaticSite-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text

# Get Load Balancer DNS from stack outputs
aws cloudformation describe-stacks \
  --stack-name lightningtalk-Api-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text

# Create Route 53 records
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1D633PJN98FT9 \
  --change-batch file://route53-changes.json
```

Example `route53-changes.json`:

```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "lightningtalk.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "d123456789.cloudfront.net",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.lightningtalk.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "lightningtalk-prod-alb-123456789.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true,
          "HostedZoneId": "Z35SXDOTRQ7X7K"
        }
      }
    }
  ]
}
```

### 2. Database Migration

Run database migrations:

```bash
# Connect to production database via bastion or VPN
export DATABASE_URL="postgresql://admin:password@lightningtalk-prod-database.cluster-xxx.us-east-1.rds.amazonaws.com:5432/lightningtalk"

# Run migrations
npm run migrate:prod

# Seed initial data (if needed)
npm run seed:prod
```

### 3. SSL Certificate Verification

Verify SSL certificates are properly configured:

```bash
# Check certificate status
aws acm list-certificates \
  --certificate-statuses ISSUED \
  --query 'CertificateSummaryList[?DomainName==`lightningtalk.com`]'

# Test SSL configuration
curl -I https://lightningtalk.com
curl -I https://api.lightningtalk.com/health
```

### 4. Monitoring Setup

Configure monitoring and alerting:

```bash
# Run observability setup
./scripts/observability-setup.sh \
  --environment prod \
  --region us-east-1 \
  --enable-opensearch

# Subscribe to alerting topic
aws sns subscribe \
  --topic-arn "arn:aws:sns:us-east-1:123456789012:lightningtalk-prod-alerts" \
  --protocol email \
  --notification-endpoint alerts@lightningtalk.com
```

## Verification and Testing

### 1. Health Checks

```bash
# API health check
curl https://api.lightningtalk.com/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-15T10:30:00.000Z",
#   "environment": "prod",
#   "version": "1.0.0"
# }

# Frontend health check
curl -I https://lightningtalk.com

# Expected: HTTP/2 200
```

### 2. Load Testing

Run production load tests:

```bash
# Run load test suite
./scripts/load-test.sh \
  --target https://api.lightningtalk.com \
  --users 100 \
  --duration 600 \
  --type comprehensive
```

### 3. Security Testing

Run security validation:

```bash
# WAF testing
curl -X POST https://api.lightningtalk.com/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": "<script>alert(1)</script>"}'

# Expected: 403 Forbidden (blocked by WAF)

# Rate limiting test
for i in {1..50}; do
  curl https://api.lightningtalk.com/health
done

# Should start receiving 429 responses after threshold
```

### 4. Disaster Recovery Testing

Test backup and recovery procedures:

```bash
# Test database backup
aws backup start-backup-job \
  --backup-vault-name lightningtalk-prod-backup-vault \
  --resource-arn "arn:aws:rds:us-east-1:123456789012:cluster:lightningtalk-prod-database" \
  --iam-role-arn "arn:aws:iam::123456789012:role/lightningtalk-prod-backup-role"

# Test failover procedure (in maintenance window)
aws rds failover-db-cluster \
  --db-cluster-identifier lightningtalk-prod-database \
  --target-db-instance-identifier lightningtalk-prod-database-1
```

## Monitoring and Maintenance

### Daily Operations

1. **Health Dashboard Review**
   - Check application performance metrics
   - Review error rates and response times
   - Monitor capacity utilization

2. **Log Analysis**
   - Review error logs for any issues
   - Check for unusual patterns
   - Monitor business metrics

3. **Security Monitoring**
   - Review WAF blocked requests
   - Check GuardDuty findings
   - Monitor access patterns

### Weekly Operations

1. **Backup Verification**
   - Verify backup completion
   - Test backup restoration process
   - Review backup retention policies

2. **Performance Analysis**
   - Analyze performance trends
   - Review auto-scaling patterns
   - Check resource utilization

3. **Security Updates**
   - Review and apply security patches
   - Update dependencies
   - Scan for vulnerabilities

### Monthly Operations

1. **Capacity Planning**
   - Review growth trends
   - Plan for capacity increases
   - Optimize resource allocation

2. **Cost Optimization**
   - Review AWS billing
   - Optimize resource usage
   - Consider Reserved Instances

3. **Disaster Recovery Testing**
   - Test backup restoration
   - Validate failover procedures
   - Update recovery documentation

## Troubleshooting

### Common Issues

**Application Not Starting**

1. Check ECS service logs
2. Verify environment variables
3. Check database connectivity
4. Review security group rules

**High Response Times**

1. Check database performance
2. Review auto-scaling configuration
3. Analyze application bottlenecks
4. Consider caching implementation

**SSL Certificate Issues**

1. Verify certificate validation
2. Check DNS configuration
3. Review CloudFront settings
4. Validate certificate renewal

**Database Connection Issues**

1. Check security group rules
2. Verify database status
3. Review connection pool settings
4. Check for connection leaks

### Emergency Procedures

**Application Rollback**

```bash
# Rollback to previous version
cdk deploy lightningtalk-Api-prod \
  --context env=prod \
  --context imageTag=previous-stable \
  --require-approval never
```

**Database Emergency**

```bash
# Create immediate backup
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier lightningtalk-prod-database \
  --db-cluster-snapshot-identifier emergency-backup-$(date +%s)

# Restore from backup (if needed)
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier lightningtalk-prod-database-restore \
  --snapshot-identifier emergency-backup-123456789
```

**Scale Up Resources**

```bash
# Scale up ECS service
aws ecs update-service \
  --cluster lightningtalk-prod-cluster \
  --service lightningtalk-prod-api \
  --desired-count 6

# Scale up database
aws rds modify-db-cluster \
  --db-cluster-identifier lightningtalk-prod-database \
  --db-instance-class db.r6g.xlarge \
  --apply-immediately
```

## Security Considerations

### Network Security

1. **VPC Configuration**
   - Private subnets for application and database
   - Public subnets only for load balancers
   - Network ACLs for additional protection

2. **Security Groups**
   - Principle of least privilege
   - Port 443 only for public access
   - Database access only from application tier

3. **WAF Protection**
   - SQL injection protection
   - XSS protection
   - Rate limiting rules
   - Geographic restrictions (if needed)

### Data Protection

1. **Encryption**
   - Encryption at rest for all storage
   - Encryption in transit (TLS 1.2+)
   - KMS key management

2. **Backup Security**
   - Encrypted backups
   - Cross-region backup replication
   - Backup access controls

3. **Secrets Management**
   - AWS Secrets Manager for credentials
   - Automatic password rotation
   - Secure secret distribution

### Access Control

1. **IAM Policies**
   - Least privilege access
   - Role-based permissions
   - Regular access reviews

2. **Audit Logging**
   - CloudTrail for API calls
   - VPC Flow Logs
   - Application audit logs

3. **Compliance**
   - AWS Config rules
   - Security compliance monitoring
   - Regular security assessments

## Performance Optimization

### Application Optimization

1. **Caching Strategy**
   - Redis for session data
   - CloudFront for static assets
   - Application-level caching

2. **Database Optimization**
   - Connection pooling
   - Query optimization
   - Read replicas for read-heavy workloads

3. **Auto-scaling Configuration**
   - CPU-based scaling
   - Memory-based scaling
   - Predictive scaling

### Infrastructure Optimization

1. **CDN Configuration**
   - Global edge locations
   - Cache optimization
   - Compression enabled

2. **Load Balancer Optimization**
   - Health check tuning
   - Connection draining
   - Target group configuration

3. **ECS Optimization**
   - Resource allocation tuning
   - Task placement strategies
   - Service discovery optimization

## Cost Management

### Cost Optimization Strategies

1. **Reserved Instances**
   - RDS Reserved Instances
   - EC2 Reserved Instances (for ECS)
   - Savings Plans

2. **Resource Right-sizing**
   - Regular usage analysis
   - Instance type optimization
   - Storage optimization

3. **Automated Cost Controls**
   - Budget alerts
   - Cost allocation tags
   - Resource lifecycle management

### Cost Monitoring

1. **AWS Cost Explorer**
   - Daily cost monitoring
   - Cost trend analysis
   - Service-level cost breakdown

2. **Billing Alerts**
   - Monthly budget alerts
   - Anomaly detection
   - Cost spike notifications

3. **Resource Tagging**
   - Consistent tagging strategy
   - Cost allocation tracking
   - Environment-based billing

---

This deployment guide provides a comprehensive approach to production deployment
with enterprise-grade security, monitoring, and operational procedures. Follow
each phase carefully and validate at each step to ensure a successful production
deployment.
