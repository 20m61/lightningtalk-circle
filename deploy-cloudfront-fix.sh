#!/bin/bash
# CloudFront OAI Fix Deployment Script
# Created: 2025-07-16

set -e  # Exit on error

echo "🚀 Lightning Talk Circle - CloudFront OAI Fix Deployment"
echo "======================================================="

# Configuration
STACK_NAME="LightningTalkCircle-dev"
ENVIRONMENT="dev"
PROJECT_DIR="/home/ec2-user/workspace/lightningtalk-circle"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    case $1 in
        "success") echo -e "${GREEN}✅ $2${NC}" ;;
        "error") echo -e "${RED}❌ $2${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $2${NC}" ;;
        "info") echo -e "ℹ️  $2" ;;
    esac
}

# Step 1: Check current directory
print_status "info" "Checking current directory..."
if [ "$PWD" != "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR" || exit 1
fi
print_status "success" "Working directory: $PWD"

# Step 2: Check AWS credentials
print_status "info" "Checking AWS credentials..."
if ! aws sts get-caller-identity &>/dev/null; then
    print_status "error" "AWS credentials not configured!"
    exit 1
fi
print_status "success" "AWS credentials verified"

# Step 3: Check current stack status
print_status "info" "Checking CloudFormation stack status..."
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null || echo "DOES_NOT_EXIST")

if [ "$STACK_STATUS" != "CREATE_COMPLETE" ] && [ "$STACK_STATUS" != "UPDATE_COMPLETE" ]; then
    print_status "warning" "Stack status: $STACK_STATUS"
    print_status "warning" "Stack may need attention before deployment"
fi

# Step 4: Deploy CDK stack
print_status "info" "Starting CDK deployment..."
print_status "info" "This will create a new CloudFront distribution with proper OAI configuration"

cd cdk || exit 1

# Run CDK deployment
if CDK_STAGE=dev cdk deploy --context stage=dev --require-approval never; then
    print_status "success" "CDK deployment completed successfully!"
else
    print_status "error" "CDK deployment failed!"
    exit 1
fi

# Step 5: Get new CloudFront distribution ID
print_status "info" "Retrieving new CloudFront distribution ID..."
NEW_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
    --output text)

if [ -z "$NEW_DISTRIBUTION_ID" ]; then
    print_status "error" "Could not retrieve new distribution ID!"
    exit 1
fi

print_status "success" "New CloudFront Distribution ID: $NEW_DISTRIBUTION_ID"

# Step 6: Get CloudFront domain name
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
    --id "$NEW_DISTRIBUTION_ID" \
    --query "Distribution.DomainName" \
    --output text)

print_status "success" "CloudFront Domain: $CLOUDFRONT_DOMAIN"

# Step 7: Test the deployment
print_status "info" "Testing CloudFront distribution..."

# Wait for distribution to be deployed
print_status "info" "Waiting for CloudFront distribution to be fully deployed..."
sleep 30

# Test health endpoint
if curl -s "https://$CLOUDFRONT_DOMAIN/api/health" | grep -q "healthy"; then
    print_status "success" "API health check passed!"
else
    print_status "warning" "API health check failed - this may be normal during initial deployment"
fi

# Step 8: Create verification report
print_status "info" "Creating deployment verification report..."

cat > cloudfront-deployment-report.txt << EOF
CloudFront OAI Fix Deployment Report
====================================
Date: $(date)
Environment: $ENVIRONMENT
Stack Name: $STACK_NAME

New CloudFront Distribution:
- ID: $NEW_DISTRIBUTION_ID
- Domain: $CLOUDFRONT_DOMAIN
- URL: https://$CLOUDFRONT_DOMAIN

Next Steps:
1. Test static file access: https://$CLOUDFRONT_DOMAIN/index.html
2. Verify OAI configuration in AWS Console
3. Update DNS records if using custom domain
4. Delete old distribution (ID: EA9Q0WKVQIJD) after verification

Testing Commands:
- curl -I https://$CLOUDFRONT_DOMAIN/index.html
- curl https://$CLOUDFRONT_DOMAIN/api/health
- curl https://$CLOUDFRONT_DOMAIN/api/events
EOF

print_status "success" "Deployment report created: cloudfront-deployment-report.txt"

# Final summary
echo ""
echo "======================================================="
print_status "success" "CloudFront OAI fix deployment completed!"
echo ""
echo "🔍 Please verify:"
echo "   1. Static files are accessible via CloudFront"
echo "   2. API endpoints are working correctly"
echo "   3. OAI is properly configured in the AWS Console"
echo ""
echo "📝 See cloudfront-deployment-report.txt for details"
echo "======================================================="