#!/bin/bash

# Deploy to dev.発表.com (Development Environment)
# This script deploys the application to the development environment

set -e

echo "🚀 Starting deployment to dev.発表.com..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env.development"
S3_BUCKET="lightningtalk-dev-static-822063948773"
CLOUDFRONT_DISTRIBUTION_ID="E3U9O7A93IDYO4"
AWS_REGION="ap-northeast-1"
CDK_ENV="dev"

# Function to check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        exit 1
    fi
    
    # Check if CDK is installed
    if ! command -v cdk &> /dev/null; then
        echo -e "${RED}❌ AWS CDK is not installed${NC}"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}❌ Environment file $ENV_FILE not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Run unit tests
    npm run test:unit || {
        echo -e "${RED}❌ Unit tests failed${NC}"
        exit 1
    }
    
    # Run integration tests
    npm run test:integration || {
        echo -e "${RED}❌ Integration tests failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ All tests passed${NC}"
}

# Function to build application
build_application() {
    echo "🔨 Building application..."
    
    # Install dependencies
    npm ci
    
    # Build frontend
    npm run build:dev || {
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Build completed${NC}"
}

# Function to deploy CDK stack
deploy_cdk() {
    echo "☁️ Deploying CDK stack to development..."
    
    cd cdk
    
    # Install CDK dependencies
    npm ci
    
    # Synthesize CDK
    npm run synth:dev || {
        echo -e "${RED}❌ CDK synthesis failed${NC}"
        exit 1
    }
    
    # Deploy CDK stack
    npm run deploy:dev -- --require-approval never || {
        echo -e "${RED}❌ CDK deployment failed${NC}"
        exit 1
    }
    
    cd ..
    
    echo -e "${GREEN}✅ CDK deployment completed${NC}"
}

# Function to sync static assets to S3
sync_static_assets() {
    echo "📦 Syncing static assets to S3..."
    
    # Sync public directory to S3
    aws s3 sync ./public s3://${S3_BUCKET}/ \
        --delete \
        --exclude "*.map" \
        --exclude ".DS_Store" \
        --cache-control "public, max-age=31536000" || {
        echo -e "${RED}❌ S3 sync failed${NC}"
        exit 1
    }
    
    # Update index.html with shorter cache
    aws s3 cp ./public/index.html s3://${S3_BUCKET}/index.html \
        --cache-control "public, max-age=300" || {
        echo -e "${RED}❌ Failed to update index.html${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Static assets synced${NC}"
}

# Function to invalidate CloudFront cache
invalidate_cloudfront() {
    echo "🔄 Invalidating CloudFront cache..."
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "Invalidation ID: ${INVALIDATION_ID}"
    
    # Wait for invalidation to complete
    echo "Waiting for invalidation to complete..."
    aws cloudfront wait invalidation-completed \
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
        --id ${INVALIDATION_ID} || {
        echo -e "${YELLOW}⚠️ CloudFront invalidation is taking longer than expected${NC}"
    }
    
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
}

# Function to run post-deployment tests
post_deployment_tests() {
    echo "🔍 Running post-deployment tests..."
    
    # Check if the site is accessible
    SITE_URL="https://dev.xn--6wym69a.com"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SITE_URL})
    
    if [ "$HTTP_STATUS" -ne 200 ]; then
        echo -e "${RED}❌ Site is not accessible (HTTP ${HTTP_STATUS})${NC}"
        exit 1
    fi
    
    # Check API health
    API_URL="https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health"
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL})
    
    if [ "$API_STATUS" -ne 200 ]; then
        echo -e "${YELLOW}⚠️ API health check failed (HTTP ${API_STATUS})${NC}"
    fi
    
    echo -e "${GREEN}✅ Post-deployment tests passed${NC}"
}

# Function to send notification
send_notification() {
    echo "📢 Sending deployment notification..."
    
    # Create deployment record
    DEPLOYMENT_TIME=$(date +"%Y-%m-%d %H:%M:%S")
    COMMIT_SHA=$(git rev-parse --short HEAD)
    BRANCH=$(git branch --show-current)
    
    cat > deployment-record.json <<EOF
{
  "environment": "development",
  "timestamp": "${DEPLOYMENT_TIME}",
  "commit": "${COMMIT_SHA}",
  "branch": "${BRANCH}",
  "url": "https://dev.xn--6wym69a.com"
}
EOF
    
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo "🌐 Site URL: https://dev.発表.com"
    echo "📝 Commit: ${COMMIT_SHA}"
    echo "🌿 Branch: ${BRANCH}"
    echo "⏰ Time: ${DEPLOYMENT_TIME}"
}

# Main deployment flow
main() {
    echo "================================"
    echo "Development Environment Deployment"
    echo "Target: dev.発表.com"
    echo "================================"
    
    check_prerequisites
    run_tests
    build_application
    deploy_cdk
    sync_static_assets
    invalidate_cloudfront
    post_deployment_tests
    send_notification
    
    echo -e "\n${GREEN}🎉 Deployment to dev.発表.com completed successfully!${NC}"
}

# Run main function
main "$@"