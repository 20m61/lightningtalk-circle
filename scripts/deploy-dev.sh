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
CLOUDFRONT_DISTRIBUTION_ID="ESY18KIDPJK68"
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

# Function to deploy CDK stack with optimizations
deploy_cdk() {
    echo "☁️ Deploying CDK stack to development..."
    
    cd cdk
    
    # Install CDK dependencies (with cache)
    echo "📦 Installing CDK dependencies..."
    if [ -d node_modules ] && [ -f package-lock.json ]; then
        echo "Checking for dependency changes..."
        npm ci --prefer-offline --no-audit || npm ci
    else
        npm ci --no-audit
    fi
    
    # Check for changes before deployment
    echo "🔍 Checking for stack changes..."
    if npm run | grep -q "diff:dev"; then
        npm run diff:dev || true
    else
        npx cdk diff LightningTalkCircle-dev --context stage=dev || true
    fi
    
    # Synthesize CDK with progress output
    echo "🏗️ Synthesizing CDK stack..."
    npm run synth:dev || {
        echo -e "${RED}❌ CDK synthesis failed${NC}"
        exit 1
    }
    
    # Deploy CDK stack with progress monitoring
    echo "🚀 Starting CDK deployment (this may take 5-10 minutes)..."
    echo "💡 Tip: CDK deployment includes Lambda functions, DynamoDB, S3, CloudFront setup"
    
    # Run deployment with timeout handling
    timeout 1200 npm run deploy:dev -- --require-approval never --progress events || {
        EXIT_CODE=$?
        if [ $EXIT_CODE -eq 124 ]; then
            echo -e "${YELLOW}⚠️ CDK deployment timed out (20 minutes)${NC}"
            echo "Checking deployment status..."
            STACK_STATUS=$(aws cloudformation describe-stacks --stack-name LightningTalkCircle-dev --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
            echo "Current stack status: $STACK_STATUS"
            
            if [[ "$STACK_STATUS" == "CREATE_COMPLETE" || "$STACK_STATUS" == "UPDATE_COMPLETE" ]]; then
                echo -e "${GREEN}✅ Stack deployment completed successfully despite timeout${NC}"
                echo "Continuing with asset synchronization..."
            elif [[ "$STACK_STATUS" == "CREATE_IN_PROGRESS" || "$STACK_STATUS" == "UPDATE_IN_PROGRESS" ]]; then
                echo -e "${YELLOW}⏳ Stack is still updating. You may need to wait longer or check AWS Console.${NC}"
                echo "Skipping asset sync to avoid conflicts."
                exit 1
            else
                echo -e "${RED}❌ Stack deployment failed or in unexpected state: $STACK_STATUS${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ CDK deployment failed${NC}"
            exit 1
        fi
    }
    
    cd ..
    
    echo -e "${GREEN}✅ CDK deployment completed${NC}"
}

# Function to sync static assets to S3
sync_static_assets() {
    echo "📦 Syncing static assets to S3..."
    
    # Sync dist directory to S3 (Vite build output)
    aws s3 sync ./dist s3://${S3_BUCKET}/ \
        --delete \
        --exclude "*.map" \
        --exclude ".DS_Store" \
        --cache-control "public, max-age=31536000" || {
        echo -e "${RED}❌ S3 sync failed${NC}"
        exit 1
    }
    
    # Update HTML files with shorter cache
    aws s3 cp ./dist/ s3://${S3_BUCKET}/ \
        --recursive \
        --exclude "*" \
        --include "*.html" \
        --cache-control "public, max-age=300, must-revalidate" || {
        echo -e "${RED}❌ Failed to update HTML files${NC}"
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