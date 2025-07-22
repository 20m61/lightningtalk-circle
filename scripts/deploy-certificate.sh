#!/bin/bash

# Lightning Talk Circle - Certificate Deployment Script
# This script helps deploy or update the ACM certificate for all domains

set -e

echo "🔐 Lightning Talk Circle - Certificate Deployment"
echo "================================================"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure'${NC}"
    exit 1
fi

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-ap-northeast-1}

echo -e "${GREEN}✅ AWS Account: ${ACCOUNT_ID}${NC}"
echo -e "${GREEN}✅ Region: ${REGION}${NC}"

# Navigate to CDK directory
cd "$(dirname "$0")/../cdk"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing CDK dependencies...${NC}"
    npm install
fi

# Build TypeScript if needed
if [ -f "tsconfig.json" ]; then
    echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
    npm run build
fi

# Bootstrap CDK in us-east-1 if needed (required for certificates)
echo -e "${YELLOW}🚀 Bootstrapping CDK in us-east-1 (if needed)...${NC}"
npx cdk bootstrap aws://${ACCOUNT_ID}/us-east-1 --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess

# Deploy the certificate stack
echo -e "${YELLOW}🎯 Deploying certificate stack...${NC}"
CDK_STAGE=prod npx cdk deploy LightningTalkCertificate-prod \
    --require-approval never \
    --context env=prod

echo -e "${GREEN}✅ Certificate deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for the certificate to be validated (this can take up to 30 minutes)"
echo "2. Check the certificate status in ACM console:"
echo "   https://console.aws.amazon.com/acm/home?region=us-east-1"
echo "3. Once validated, update the certificate ARN in your CDK stacks"
echo ""
echo "The certificate will include these domains:"
echo "  - xn--6wym69a.com (発表.com)"
echo "  - www.xn--6wym69a.com"
echo "  - storybook.xn--6wym69a.com"
echo "  - storybook-staging.xn--6wym69a.com"
echo "  - dev.xn--6wym69a.com"
echo "  - storybook.dev.xn--6wym69a.com"
echo "  - api.xn--6wym69a.com"
echo "  - staging.xn--6wym69a.com"