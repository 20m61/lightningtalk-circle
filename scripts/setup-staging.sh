#!/bin/bash

# Lightning Talk Circle - Staging Environment Setup Script
# This script sets up a complete staging environment for testing before production deployment

set -euo pipefail

# Configuration
STAGING_ENV="${STAGING_ENV:-staging}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
PROJECT_NAME="lightningtalk-circle"
STAGING_DOMAIN="${STAGING_DOMAIN:-staging.xn--6wym69a.com}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
  echo -e "\n${BLUE}==>${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  log_step "Checking prerequisites"
  
  local missing=()
  
  # Check required commands
  for cmd in aws node npm docker git jq; do
    if ! command -v $cmd &> /dev/null; then
      missing+=($cmd)
    fi
  done
  
  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing required commands: ${missing[*]}"
    log_error "Please install missing dependencies"
    exit 1
  fi
  
  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured"
    exit 1
  fi
  
  # Check Node.js version
  local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ $node_version -lt 18 ]; then
    log_error "Node.js 18+ required (current: $(node -v))"
    exit 1
  fi
  
  log_info "All prerequisites satisfied"
}

# Create staging branch
setup_git_branch() {
  log_step "Setting up staging branch"
  
  # Fetch latest changes
  git fetch origin
  
  # Check if staging branch exists
  if git show-ref --verify --quiet refs/heads/staging; then
    log_info "Staging branch exists, updating..."
    git checkout staging
    git pull origin staging
  else
    log_info "Creating staging branch from main..."
    git checkout -b staging origin/main
  fi
  
  # Ensure we're on staging branch
  current_branch=$(git branch --show-current)
  if [ "$current_branch" != "staging" ]; then
    log_error "Failed to switch to staging branch"
    exit 1
  fi
  
  log_info "Staging branch ready"
}

# Create staging environment file
create_env_file() {
  log_step "Creating staging environment configuration"
  
  cat > .env.staging << EOF
# Lightning Talk Circle - Staging Environment
# Generated: $(date)

# Application Settings
NODE_ENV=staging
PORT=3000
SITE_NAME="なんでもライトニングトーク (Staging)"
SITE_URL="https://${STAGING_DOMAIN}"

# Security (Using staging-specific secrets)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Admin (Staging defaults)
ADMIN_EMAIL=admin@staging.local
ADMIN_PASSWORD=StagingAdmin123!
ADMIN_NAME=Staging Administrator

# Database Configuration
DATABASE_TYPE=dynamodb
AWS_REGION=${AWS_REGION}
DYNAMODB_EVENTS_TABLE=${PROJECT_NAME}-${STAGING_ENV}-events
DYNAMODB_PARTICIPANTS_TABLE=${PROJECT_NAME}-${STAGING_ENV}-participants
DYNAMODB_USERS_TABLE=${PROJECT_NAME}-${STAGING_ENV}-users
DYNAMODB_TALKS_TABLE=${PROJECT_NAME}-${STAGING_ENV}-talks
DYNAMODB_PARTICIPATION_VOTES_TABLE=${PROJECT_NAME}-${STAGING_ENV}-participation-votes
DYNAMODB_VOTING_SESSIONS_TABLE=${PROJECT_NAME}-${STAGING_ENV}-voting-sessions

# External Services (Staging)
EMAIL_ENABLED=true
EMAIL_SERVICE=mock
EMAIL_FROM="noreply@staging.local"

# GitHub Integration (Optional for staging)
GITHUB_TOKEN=${GITHUB_TOKEN:-}
GITHUB_OWNER=${GITHUB_OWNER:-}
GITHUB_REPO=${GITHUB_REPO:-}

# Monitoring
CLOUDWATCH_LOG_GROUP=/aws/ecs/${PROJECT_NAME}-staging
CLOUDWATCH_LOG_STREAM_PREFIX=staging

# Rate Limiting (More permissive for testing)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
REGISTRATION_LIMIT_PER_HOUR=50

# Feature Flags
SHOW_SURVEY_COUNTER=true
SEND_CONFIRMATION_EMAILS=false
SEND_REMINDER_EMAILS=false
AUTO_CREATE_ISSUES=false

# CORS (Allow localhost for testing)
CORS_ORIGINS=https://${STAGING_DOMAIN},http://localhost:3000,http://localhost:8080

# Staging-specific settings
ENABLE_DEBUG_LOGS=true
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ERROR_DETAILS=true
EOF

  # Create AWS Secrets Manager entry
  log_info "Storing staging configuration in AWS Secrets Manager"
  aws secretsmanager create-secret \
    --name "${PROJECT_NAME}-staging-env" \
    --description "Staging environment variables" \
    --secret-string file://.env.staging \
    --region $AWS_REGION 2>/dev/null || \
  aws secretsmanager update-secret \
    --secret-id "${PROJECT_NAME}-staging-env" \
    --secret-string file://.env.staging \
    --region $AWS_REGION
  
  log_info "Staging environment configuration created"
}

# Deploy CDK stacks for staging
deploy_infrastructure() {
  log_step "Deploying staging infrastructure with CDK"
  
  cd cdk
  
  # Install dependencies
  npm install
  
  # Set staging context
  export CDK_DEPLOY_ENVIRONMENT=staging
  export CDK_DEPLOY_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
  export CDK_DEPLOY_REGION=$AWS_REGION
  
  # Bootstrap CDK if needed
  log_info "Bootstrapping CDK environment"
  npx cdk bootstrap aws://${CDK_DEPLOY_ACCOUNT}/${CDK_DEPLOY_REGION}
  
  # Deploy stacks
  log_info "Deploying staging stacks"
  npx cdk deploy --all \
    --context environment=staging \
    --context domain=${STAGING_DOMAIN} \
    --require-approval never \
    --outputs-file staging-outputs.json
  
  cd ..
  
  log_info "Infrastructure deployment completed"
}

# Setup DynamoDB tables with sample data
setup_database() {
  log_step "Setting up staging database with sample data"
  
  # Create sample data script
  cat > scripts/staging-seed-data.js << 'EOF'
#!/usr/bin/env node

import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const tablePrefix = process.env.TABLE_PREFIX || 'lightningtalk-circle-staging';

const dynamoDbClient = new DynamoDB({ region });
const docClient = DynamoDBDocument.from(dynamoDbClient);

async function seedData() {
  console.log('🌱 Seeding staging database...');
  
  // Seed events
  const events = [
    {
      id: 'staging-event-001',
      title: 'Staging Test Event #1',
      description: 'This is a test event for staging environment',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      venue: {
        name: 'オンライン会場',
        address: 'Zoom Meeting',
        mapUrl: 'https://zoom.us/test'
      },
      maxTalks: 10,
      talkDuration: 5,
      isOnline: true,
      status: 'upcoming',
      createdAt: new Date().toISOString()
    },
    {
      id: 'staging-event-002',
      title: 'Staging Test Event #2',
      description: 'Past event for testing',
      eventDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      venue: {
        name: 'テスト会場',
        address: '東京都渋谷区テスト1-2-3'
      },
      maxTalks: 8,
      talkDuration: 5,
      isOnline: false,
      status: 'completed',
      createdAt: new Date().toISOString()
    }
  ];
  
  // Seed participants
  const participants = [
    {
      id: uuidv4(),
      eventId: 'staging-event-001',
      name: 'テスト参加者1',
      email: 'test1@staging.local',
      attendance: 'online',
      role: 'speaker',
      registeredAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      eventId: 'staging-event-001',
      name: 'テスト参加者2',
      email: 'test2@staging.local',
      attendance: 'offline',
      role: 'participant',
      registeredAt: new Date().toISOString()
    }
  ];
  
  // Seed talks
  const talks = [
    {
      id: uuidv4(),
      eventId: 'staging-event-001',
      title: 'ステージング環境でのテスト方法',
      description: 'ステージング環境の効果的な活用方法について',
      speakerId: participants[0].id,
      duration: 5,
      order: 1,
      status: 'scheduled'
    }
  ];
  
  // Insert data
  try {
    // Events
    for (const event of events) {
      await docClient.put({
        TableName: `${tablePrefix}-events`,
        Item: event
      });
      console.log(`✓ Created event: ${event.title}`);
    }
    
    // Participants
    for (const participant of participants) {
      await docClient.put({
        TableName: `${tablePrefix}-participants`,
        Item: participant
      });
      console.log(`✓ Created participant: ${participant.name}`);
    }
    
    // Talks
    for (const talk of talks) {
      await docClient.put({
        TableName: `${tablePrefix}-talks`,
        Item: talk
      });
      console.log(`✓ Created talk: ${talk.title}`);
    }
    
    console.log('\n✅ Staging database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
EOF
  
  chmod +x scripts/staging-seed-data.js
  
  # Run seeding script
  log_info "Seeding staging database"
  TABLE_PREFIX="${PROJECT_NAME}-${STAGING_ENV}" node scripts/staging-seed-data.js
  
  log_info "Database setup completed"
}

# Build and deploy application
deploy_application() {
  log_step "Building and deploying application"
  
  # Build application
  log_info "Building application for staging"
  npm run build
  
  # Build Docker image
  log_info "Building Docker image"
  docker build -t ${PROJECT_NAME}-staging:latest .
  
  # Tag for ECR
  local account_id=$(aws sts get-caller-identity --query Account --output text)
  local ecr_repo="${account_id}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-staging"
  
  # Login to ECR
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ecr_repo
  
  # Push to ECR
  docker tag ${PROJECT_NAME}-staging:latest ${ecr_repo}:latest
  docker tag ${PROJECT_NAME}-staging:latest ${ecr_repo}:$(git rev-parse --short HEAD)
  
  log_info "Pushing Docker image to ECR"
  docker push ${ecr_repo}:latest
  docker push ${ecr_repo}:$(git rev-parse --short HEAD)
  
  # Update ECS service
  log_info "Updating ECS service"
  aws ecs update-service \
    --cluster ${PROJECT_NAME}-staging \
    --service ${PROJECT_NAME}-staging-api \
    --force-new-deployment \
    --region $AWS_REGION
  
  log_info "Application deployment initiated"
}

# Setup monitoring
setup_monitoring() {
  log_step "Setting up staging monitoring"
  
  # Create CloudWatch dashboard
  cat > cloudwatch-staging-dashboard.json << EOF
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "${PROJECT_NAME}-staging-api"],
          [".", "MemoryUtilization", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "${AWS_REGION}",
        "title": "ECS Service Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "${PROJECT_NAME}-staging-alb"],
          [".", "RequestCount", ".", "."]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "${AWS_REGION}",
        "title": "Load Balancer Metrics"
      }
    }
  ]
}
EOF
  
  aws cloudwatch put-dashboard \
    --dashboard-name ${PROJECT_NAME}-staging \
    --dashboard-body file://cloudwatch-staging-dashboard.json \
    --region $AWS_REGION
  
  # Create basic alarms
  log_info "Creating CloudWatch alarms"
  
  # High CPU alarm
  aws cloudwatch put-metric-alarm \
    --alarm-name ${PROJECT_NAME}-staging-high-cpu \
    --alarm-description "High CPU usage in staging" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --region $AWS_REGION || true
  
  log_info "Monitoring setup completed"
}

# Run smoke tests
run_smoke_tests() {
  log_step "Running smoke tests"
  
  # Wait for service to be ready
  log_info "Waiting for service to be ready..."
  sleep 30
  
  # Get ALB endpoint
  local alb_endpoint=$(aws elbv2 describe-load-balancers \
    --names ${PROJECT_NAME}-staging-alb \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text 2>/dev/null || echo "")
  
  if [ -z "$alb_endpoint" ]; then
    log_warn "Could not find ALB endpoint, skipping smoke tests"
    return
  fi
  
  local base_url="https://${alb_endpoint}"
  
  # Health check
  log_info "Testing health endpoint"
  if curl -sf "${base_url}/health" > /dev/null; then
    log_info "✓ Health check passed"
  else
    log_error "✗ Health check failed"
  fi
  
  # API endpoints
  log_info "Testing API endpoints"
  if curl -sf "${base_url}/api/events" > /dev/null; then
    log_info "✓ Events API accessible"
  else
    log_error "✗ Events API failed"
  fi
  
  # Static assets
  log_info "Testing static assets"
  if curl -sf "${base_url}/css/style.css" > /dev/null; then
    log_info "✓ Static assets accessible"
  else
    log_error "✗ Static assets failed"
  fi
}

# Generate staging report
generate_report() {
  log_step "Generating staging environment report"
  
  local report_file="staging-environment-report.md"
  
  cat > $report_file << EOF
# Staging Environment Setup Report
Generated: $(date)

## Environment Details
- Environment: ${STAGING_ENV}
- Region: ${AWS_REGION}
- Domain: ${STAGING_DOMAIN}
- Branch: staging
- Commit: $(git rev-parse --short HEAD)

## Infrastructure Components

### CDK Stacks Deployed
EOF
  
  # List CDK stacks
  aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
    --region $AWS_REGION \
    --query "StackSummaries[?contains(StackName, 'staging')].StackName" \
    --output text | tr '\t' '\n' | while read stack; do
    echo "- $stack" >> $report_file
  done
  
  cat >> $report_file << EOF

### Database Tables
- ${PROJECT_NAME}-${STAGING_ENV}-events
- ${PROJECT_NAME}-${STAGING_ENV}-participants
- ${PROJECT_NAME}-${STAGING_ENV}-users
- ${PROJECT_NAME}-${STAGING_ENV}-talks
- ${PROJECT_NAME}-${STAGING_ENV}-participation-votes
- ${PROJECT_NAME}-${STAGING_ENV}-voting-sessions

### Access Points
- API Endpoint: https://${STAGING_DOMAIN}
- CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logsV2:log-groups/log-group/${PROJECT_NAME}-staging

## Test Credentials
- Admin Email: admin@staging.local
- Admin Password: StagingAdmin123!

## Next Steps
1. Update DNS records to point ${STAGING_DOMAIN} to the ALB
2. Configure SSL certificate for the domain
3. Run full integration test suite
4. Perform load testing
5. Review security configuration

## Useful Commands
\`\`\`bash
# View logs
aws logs tail /aws/ecs/${PROJECT_NAME}-staging --follow

# Update service
aws ecs update-service --cluster ${PROJECT_NAME}-staging --service ${PROJECT_NAME}-staging-api --force-new-deployment

# Connect to database
aws dynamodb scan --table-name ${PROJECT_NAME}-${STAGING_ENV}-events
\`\`\`
EOF
  
  log_info "Report generated: $report_file"
}

# Main execution
main() {
  log_info "🚀 Starting staging environment setup"
  
  check_prerequisites
  setup_git_branch
  create_env_file
  deploy_infrastructure
  setup_database
  deploy_application
  setup_monitoring
  run_smoke_tests
  generate_report
  
  log_info "✅ Staging environment setup completed!"
  log_info "Check staging-environment-report.md for details"
}

# Parse command line arguments
SKIP_INFRA=false
SKIP_APP=false

while getopts "iah" opt; do
  case $opt in
    i)
      SKIP_INFRA=true
      ;;
    a)
      SKIP_APP=true
      ;;
    h)
      echo "Usage: $0 [-i] [-a]"
      echo "  -i: Skip infrastructure deployment"
      echo "  -a: Skip application deployment"
      echo "  -h: Show this help"
      exit 0
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

# Run main process
main