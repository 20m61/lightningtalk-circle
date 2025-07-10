# 🌍 Environment Management Guide

Lightning Talk Circle supports two distinct deployment models with proper
environment separation:

## 📋 Quick Reference

| Environment     | Purpose                     | Technology Stack      | Usage                           |
| --------------- | --------------------------- | --------------------- | ------------------------------- |
| **Development** | Local development & testing | Docker + File storage | `npm run docker:dev`            |
| **Staging**     | Pre-production testing      | AWS Lambda + DynamoDB | `npm run aws:deploy:staging`    |
| **Production**  | Live application            | AWS Lambda + DynamoDB | `npm run aws:deploy:production` |

## 🐳 Development Environment (Docker)

### Purpose

- Local development and testing
- Rapid prototyping
- Integration testing
- Developer workflow

### Technology Stack

- **Runtime**: Docker containers
- **Database**: PostgreSQL (containerized)
- **Cache**: Redis (containerized)
- **Storage**: File-based system
- **Email**: Console output (mock)
- **Static Assets**: Local file system

### Setup and Usage

```bash
# Quick setup
npm run docker:dev

# Manual setup
npm run env:docker
docker-compose up -d

# View logs
npm run docker:logs

# Stop environment
npm run docker:stop
```

### Access Points

- **Application**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health
- **Database**: localhost:5432
- **Redis**: localhost:6379

### Configuration

- **Environment File**: `.env.development`
- **Docker Compose**: `docker-compose.yml`
- **Data Persistence**: `./data/` directory
- **File Uploads**: `./uploads/` directory

## ☁️ AWS Deployment Environments

### Purpose

- Staging: Pre-production testing and QA
- Production: Live application serving real users

### Technology Stack

- **Runtime**: AWS Lambda (serverless)
- **Database**: DynamoDB
- **API Gateway**: AWS API Gateway
- **Static Hosting**: S3 + CloudFront
- **Email**: Amazon SES
- **Secrets**: AWS Secrets Manager
- **Monitoring**: CloudWatch
- **File Storage**: S3

### Staging Environment

```bash
# Deploy to staging
npm run aws:deploy:staging

# Manual deployment
npm run env:aws:staging
cd cdk
npx cdk deploy --context env=staging
```

### Production Environment

```bash
# Deploy to production
npm run aws:deploy:production

# Manual deployment
npm run env:aws:production
cd cdk
npx cdk deploy --context env=production
```

### Current Deployed URLs

- **Static Site**: https://d19wq5f8laq7i.cloudfront.net
- **API**:
  https://6wva362954.execute-api.ap-northeast-1.amazonaws.com/development/

## 🔧 Environment Management Commands

### Environment Switching

```bash
# Check current environment
npm run env:status

# Switch to development (Docker)
npm run env:switch development

# Switch to staging (AWS)
npm run env:switch staging

# Switch to production (AWS)
npm run env:switch production

# List all available environments
npm run env:list

# Validate current environment configuration
npm run env:validate
```

### Environment Setup

```bash
# Setup Docker development environment
npm run env:docker

# Setup AWS staging environment
npm run env:aws:staging

# Setup AWS production environment
npm run env:aws:production
```

## 📁 Environment Files

### File Structure

```
├── .env                    # Current active environment
├── .env.development        # Docker development settings
├── .env.staging            # AWS staging settings
├── .env.production         # AWS production settings
├── .env.example            # Template for new environments
└── scripts/
    └── environment-manager.sh  # Environment management tool
```

### Key Configuration Differences

| Setting          | Development    | Staging             | Production          |
| ---------------- | -------------- | ------------------- | ------------------- |
| `NODE_ENV`       | development    | staging             | production          |
| `DATABASE_TYPE`  | file           | dynamodb            | dynamodb            |
| `EMAIL_ENABLED`  | false          | true                | true                |
| `EMAIL_PROVIDER` | console        | ses                 | ses                 |
| `DEBUG`          | true           | true                | false               |
| `CORS_ORIGIN`    | localhost:3000 | staging-url         | production-url      |
| `SECRETS`        | plain text     | AWS Secrets Manager | AWS Secrets Manager |

## 🛡️ Security Considerations

### Development Environment

- Uses hardcoded development secrets (safe for local use)
- CORS allows localhost origins
- Debug information enabled
- Test routes accessible
- File-based storage (no external dependencies)

### AWS Environments

- Secrets managed by AWS Secrets Manager
- CORS restricted to specific domains
- Production secrets rotation
- Rate limiting enabled
- Monitoring and alerting configured
- No debug information in production

## 🚀 Deployment Workflow

### Development Workflow

1. Switch to development environment: `npm run env:docker`
2. Start Docker containers: `docker-compose up -d`
3. Develop and test locally
4. Run tests: `npm test`
5. Commit changes

### Staging Deployment

1. Switch to staging: `npm run env:switch staging`
2. Deploy to AWS: `npm run aws:deploy:staging`
3. Run integration tests against staging
4. Perform manual QA testing

### Production Deployment

1. Switch to production: `npm run env:switch production`
2. Deploy to AWS: `npm run aws:deploy:production`
3. Monitor deployment health
4. Verify production functionality

## 🔍 Troubleshooting

### Environment Issues

```bash
# Check current environment status
npm run env:status

# Validate configuration
npm run env:validate

# Backup current environment
./scripts/environment-manager.sh backup

# Restore from backup
./scripts/environment-manager.sh restore
```

### Docker Issues

```bash
# View Docker logs
npm run docker:logs

# Restart Docker services
npm run docker:stop && npm run docker:dev

# Clean Docker resources
docker system prune -f
```

### AWS Issues

```bash
# Check CDK stack status
npm run aws:status

# View AWS CloudFormation console
# Check AWS Lambda logs in CloudWatch
```

## 📝 Best Practices

1. **Always validate** environment configuration after switching
2. **Backup** current environment before major changes
3. **Test locally** with Docker before deploying to AWS
4. **Use staging** environment for integration testing
5. **Monitor** production deployments closely
6. **Keep secrets** in AWS Secrets Manager for cloud environments
7. **Separate** development and production AWS accounts when possible

## 🆘 Support

For environment-related issues:

1. Check this guide first
2. Validate your environment: `npm run env:validate`
3. Check the troubleshooting section
4. Review logs (Docker or CloudWatch)
5. Create an issue with environment details
