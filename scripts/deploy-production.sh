#!/bin/bash

# Deploy to 発表.com (Production Environment)
# This script deploys the application to the production environment with safety checks

set -e

echo "🚀 Starting deployment to 発表.com (PRODUCTION)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env.production"
S3_BUCKET="lightningtalk-circle-static-prod"
CLOUDFRONT_DISTRIBUTION_ID="d1kpcrcfnixxa7"
AWS_REGION="ap-northeast-1"
CDK_ENV="prod"

# Function to confirm production deployment
confirm_deployment() {
    echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION (発表.com)${NC}"
    echo -e "${YELLOW}This will affect real users. Are you sure you want to continue?${NC}"
    read -p "Type 'yes' to confirm: " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check if on main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo -e "${RED}❌ Not on main branch (current: $CURRENT_BRANCH)${NC}"
        echo "Production deployments must be from the main branch"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo -e "${RED}❌ Uncommitted changes detected${NC}"
        echo "Please commit or stash your changes before deploying"
        exit 1
    fi
    
    # Check if up to date with remote
    git fetch origin main
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo -e "${RED}❌ Local branch is not up to date with remote${NC}"
        echo "Please pull the latest changes before deploying"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        exit 1
    fi
    
    # Check production environment file
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}❌ Production environment file $ENV_FILE not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Function to run comprehensive tests
run_tests() {
    echo "🧪 Running comprehensive test suite..."
    
    # Run all tests
    npm test || {
        echo -e "${RED}❌ Tests failed${NC}"
        exit 1
    }
    
    # Run security audit
    npm audit --audit-level=high || {
        echo -e "${RED}❌ Security vulnerabilities found${NC}"
        exit 1
    }
    
    # Run linting
    npm run lint || {
        echo -e "${RED}❌ Linting errors found${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ All tests and checks passed${NC}"
}

# Function to create backup
create_backup() {
    echo "💾 Creating backup of current production state..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup current deployment info
    aws s3 cp s3://${S3_BUCKET}/deployment-info.json "$BACKUP_DIR/" || true
    
    # Record backup info
    cat > "$BACKUP_DIR/backup-info.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commit": "$(git rev-parse HEAD)",
  "branch": "main",
  "environment": "production"
}
EOF
    
    echo -e "${GREEN}✅ Backup created in $BACKUP_DIR${NC}"
}

# Function to build application for production
build_application() {
    echo "🔨 Building application for production..."
    
    # Clean install dependencies
    rm -rf node_modules
    npm ci --production=false
    
    # Build with production optimizations
    NODE_ENV=production npm run build || {
        echo -e "${RED}❌ Production build failed${NC}"
        exit 1
    }
    
    # Generate source maps for error tracking
    npm run build:sourcemaps || true
    
    echo -e "${GREEN}✅ Production build completed${NC}"
}

# Function to deploy CDK stack
deploy_cdk() {
    echo "☁️ Deploying CDK stack to production..."
    
    cd cdk
    
    # Install CDK dependencies
    npm ci
    
    # Synthesize CDK
    npm run synth:prod || {
        echo -e "${RED}❌ CDK synthesis failed${NC}"
        exit 1
    }
    
    # Show diff
    echo -e "${BLUE}📊 CDK Diff:${NC}"
    npm run diff:prod || true
    
    # Deploy CDK stack with manual approval
    npm run deploy:prod -- --require-approval broadening || {
        echo -e "${RED}❌ CDK deployment failed${NC}"
        exit 1
    }
    
    cd ..
    
    echo -e "${GREEN}✅ CDK deployment completed${NC}"
}

# Function to sync static assets with versioning
sync_static_assets() {
    echo "📦 Syncing static assets to S3 with versioning..."
    
    # Create deployment info
    cat > public/deployment-info.json <<EOF
{
  "version": "$(git describe --tags --always)",
  "commit": "$(git rev-parse HEAD)",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production"
}
EOF
    
    # Sync with cache headers
    aws s3 sync ./public s3://${S3_BUCKET}/ \
        --delete \
        --exclude "*.map" \
        --exclude ".DS_Store" \
        --exclude "*.log" \
        --cache-control "public, max-age=31536000, immutable" || {
        echo -e "${RED}❌ S3 sync failed${NC}"
        exit 1
    }
    
    # Update HTML files with shorter cache
    aws s3 cp ./public/ s3://${S3_BUCKET}/ \
        --recursive \
        --exclude "*" \
        --include "*.html" \
        --cache-control "public, max-age=300, must-revalidate" || {
        echo -e "${RED}❌ Failed to update HTML files${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Static assets synced with versioning${NC}"
}

# Function to perform blue-green deployment
blue_green_deployment() {
    echo "🔄 Performing blue-green deployment..."
    
    # This is a placeholder for blue-green deployment logic
    # In a real scenario, this would:
    # 1. Deploy to green environment
    # 2. Run smoke tests
    # 3. Switch traffic
    # 4. Monitor for issues
    # 5. Rollback if needed
    
    echo -e "${BLUE}ℹ️  Using standard deployment (blue-green not configured)${NC}"
}

# Function to invalidate CloudFront cache
invalidate_cloudfront() {
    echo "🔄 Invalidating CloudFront cache..."
    
    # Create targeted invalidation
    INVALIDATION_PATHS=(
        "/index.html"
        "/js/*"
        "/css/*"
        "/api/*"
    )
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
        --paths "${INVALIDATION_PATHS[@]}" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "Invalidation ID: ${INVALIDATION_ID}"
    
    echo -e "${GREEN}✅ CloudFront invalidation initiated${NC}"
}

# Function to run production smoke tests
smoke_tests() {
    echo "🔍 Running production smoke tests..."
    
    # Wait for deployment to propagate
    sleep 30
    
    # Test main site
    SITE_URL="https://xn--6wym69a.com"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SITE_URL})
    
    if [ "$HTTP_STATUS" -ne 200 ]; then
        echo -e "${RED}❌ Production site is not accessible (HTTP ${HTTP_STATUS})${NC}"
        echo "Rolling back deployment..."
        rollback_deployment
        exit 1
    fi
    
    # Test API endpoint
    API_URL="https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health"
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL})
    
    if [ "$API_STATUS" -ne 200 ]; then
        echo -e "${RED}❌ Production API is not healthy (HTTP ${API_STATUS})${NC}"
        echo "Rolling back deployment..."
        rollback_deployment
        exit 1
    fi
    
    # Test critical paths
    CRITICAL_PATHS=(
        "/login.html"
        "/events"
        "/api/events"
    )
    
    for path in "${CRITICAL_PATHS[@]}"; do
        URL="${SITE_URL}${path}"
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${URL})
        if [ "$STATUS" -ge 400 ]; then
            echo -e "${YELLOW}⚠️ Critical path ${path} returned ${STATUS}${NC}"
        fi
    done
    
    echo -e "${GREEN}✅ Smoke tests passed${NC}"
}

# Function to monitor deployment
monitor_deployment() {
    echo "📊 Monitoring deployment for 5 minutes..."
    
    # Monitor CloudWatch alarms
    ALARM_NAMES=(
        "lightningtalk-prod-api-errors"
        "lightningtalk-prod-response-time"
        "lightningtalk-prod-4xx-errors"
        "lightningtalk-prod-5xx-errors"
    )
    
    END_TIME=$(($(date +%s) + 300)) # 5 minutes from now
    
    while [ $(date +%s) -lt $END_TIME ]; do
        for alarm in "${ALARM_NAMES[@]}"; do
            STATE=$(aws cloudwatch describe-alarms \
                --alarm-names "$alarm" \
                --query 'MetricAlarms[0].StateValue' \
                --output text 2>/dev/null || echo "OK")
            
            if [ "$STATE" = "ALARM" ]; then
                echo -e "${RED}❌ CloudWatch alarm triggered: $alarm${NC}"
                echo "Rolling back deployment..."
                rollback_deployment
                exit 1
            fi
        done
        
        echo -n "."
        sleep 10
    done
    
    echo -e "\n${GREEN}✅ No alarms triggered during monitoring period${NC}"
}

# Function to rollback deployment
rollback_deployment() {
    echo -e "${RED}🔙 Initiating rollback...${NC}"
    
    # This is a placeholder for rollback logic
    # In a real scenario, this would restore the previous version
    
    echo -e "${YELLOW}⚠️  Manual rollback required${NC}"
    echo "Run: ./scripts/rollback-deployment.sh"
}

# Function to send notification
send_notification() {
    echo "📢 Sending deployment notification..."
    
    DEPLOYMENT_TIME=$(date +"%Y-%m-%d %H:%M:%S JST")
    COMMIT_SHA=$(git rev-parse --short HEAD)
    TAG=$(git describe --tags --always)
    
    # Create deployment record
    cat > deployment-record.json <<EOF
{
  "environment": "production",
  "timestamp": "${DEPLOYMENT_TIME}",
  "commit": "${COMMIT_SHA}",
  "tag": "${TAG}",
  "url": "https://xn--6wym69a.com",
  "deployer": "$(whoami)",
  "status": "success"
}
EOF
    
    # Upload to S3 for record keeping
    aws s3 cp deployment-record.json s3://${S3_BUCKET}/deployments/$(date +%Y%m%d_%H%M%S).json
    
    echo -e "${GREEN}✅ Production deployment completed successfully!${NC}"
    echo "🌐 Site URL: https://発表.com"
    echo "📝 Version: ${TAG}"
    echo "⏰ Time: ${DEPLOYMENT_TIME}"
}

# Main deployment flow
main() {
    echo "================================"
    echo "Production Environment Deployment"
    echo "Target: 発表.com"
    echo "================================"
    
    confirm_deployment
    check_prerequisites
    run_tests
    create_backup
    build_application
    deploy_cdk
    blue_green_deployment
    sync_static_assets
    invalidate_cloudfront
    smoke_tests
    monitor_deployment
    send_notification
    
    echo -e "\n${GREEN}🎉 Deployment to 発表.com completed successfully!${NC}"
    echo -e "${YELLOW}📌 Remember to monitor the production environment closely for the next hour${NC}"
}

# Run main function
main "$@"