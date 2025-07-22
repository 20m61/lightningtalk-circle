#!/bin/bash
# Lightning Talk Circle - Storybook Manual Deployment Script
# 手動でStorybookをデプロイするためのスクリプト

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPONENT_DIR="$PROJECT_ROOT/lightningtalk-modern/packages/components"
ENVIRONMENT="${1:-staging}"

echo -e "${BLUE}⚡ Lightning Talk Circle - Storybook Deployment${NC}"
echo -e "${BLUE}================================================${NC}"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [staging|production]"
    exit 1
fi

# Set S3 bucket based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    S3_BUCKET="lightning-talk-storybook-production"
    DISTRIBUTION_ID="${CLOUDFRONT_PRODUCTION_DISTRIBUTION_ID}"
    URL="https://storybook.xn--6wym69a.com"
else
    S3_BUCKET="lightning-talk-storybook-staging"
    DISTRIBUTION_ID="${CLOUDFRONT_STAGING_DISTRIBUTION_ID}"
    URL="https://storybook-staging.xn--6wym69a.com"
fi

echo -e "${YELLOW}📦 Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}🪣 S3 Bucket: $S3_BUCKET${NC}"
echo -e "${YELLOW}🌐 URL: $URL${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# Check AWS credentials
echo -e "\n${BLUE}🔐 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

# Navigate to component directory
cd "$COMPONENT_DIR"

# Build Storybook
echo -e "\n${BLUE}🔨 Building Storybook...${NC}"
if [ -f "package.json" ]; then
    npm run build-storybook
else
    echo -e "${RED}❌ package.json not found in $COMPONENT_DIR${NC}"
    exit 1
fi

# Check if build was successful
if [ ! -d "storybook-static" ]; then
    echo -e "${RED}❌ Storybook build failed - storybook-static directory not found${NC}"
    exit 1
fi

# Check if S3 bucket exists
echo -e "\n${BLUE}🪣 Checking S3 bucket...${NC}"
if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
    echo -e "${YELLOW}⚠️  S3 bucket does not exist. Creating...${NC}"
    # Note: Bucket creation should be done via CDK
    echo -e "${RED}❌ Please deploy the CDK stack first to create the S3 bucket${NC}"
    exit 1
fi

# Upload to S3
echo -e "\n${BLUE}📤 Uploading to S3...${NC}"
aws s3 sync storybook-static/ "s3://$S3_BUCKET/" \
    --delete \
    --cache-control "max-age=86400" \
    --metadata-directive REPLACE

# Upload index.html with shorter cache
aws s3 cp storybook-static/index.html "s3://$S3_BUCKET/" \
    --cache-control "max-age=3600" \
    --content-type "text/html" \
    --metadata-directive REPLACE

# Invalidate CloudFront cache if distribution ID is provided
if [ -n "$DISTRIBUTION_ID" ]; then
    echo -e "\n${BLUE}♻️  Invalidating CloudFront cache...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo -e "${GREEN}✅ Invalidation created: $INVALIDATION_ID${NC}"
else
    echo -e "${YELLOW}⚠️  CloudFront distribution ID not set. Skipping cache invalidation.${NC}"
    echo "   Set CLOUDFRONT_${ENVIRONMENT^^}_DISTRIBUTION_ID environment variable"
fi

# Success message
echo -e "\n${GREEN}🎉 Storybook deployed successfully!${NC}"
echo -e "${GREEN}🌐 URL: $URL${NC}"

# List uploaded files summary
echo -e "\n${BLUE}📊 Upload Summary:${NC}"
FILE_COUNT=$(find storybook-static -type f | wc -l)
echo -e "   Total files uploaded: $FILE_COUNT"

# Clean up
echo -e "\n${BLUE}🧹 Cleaning up...${NC}"
rm -rf storybook-static

echo -e "\n${GREEN}✨ Deployment complete!${NC}"