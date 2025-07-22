#!/bin/bash
# Lightning Talk Circle - Storybook Staging Environment Setup
# ステージング環境用Storybookデプロイスクリプト

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="lightning-talk-storybook-staging"
REGION="ap-northeast-1"
PROFILE=""

echo -e "${BLUE}🚀 Lightning Talk Circle - Storybook Staging Setup${NC}"
echo -e "${BLUE}====================================================${NC}"

# Function to create S3 bucket
create_s3_bucket() {
    echo -e "\n${YELLOW}📦 Creating S3 bucket for staging...${NC}"
    
    # Check if bucket exists
    if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
        # Create bucket
        aws s3 mb "s3://$BUCKET_NAME" --region $REGION
        echo -e "${GREEN}✅ S3 bucket created: $BUCKET_NAME${NC}"
        
        # Configure bucket for static website hosting
        aws s3 website "s3://$BUCKET_NAME" \
            --index-document index.html \
            --error-document index.html
        
        # Skip public policy - will use OAI with CloudFront instead
        echo -e "${YELLOW}⚠️  Skipping public policy - will use CloudFront OAI${NC}"
        
        echo -e "${GREEN}✅ S3 bucket configured for static website hosting${NC}"
    else
        echo -e "${YELLOW}⚠️  S3 bucket already exists: $BUCKET_NAME${NC}"
    fi
}

# Function to create CloudFront distribution
create_cloudfront_distribution() {
    echo -e "\n${YELLOW}🌐 Creating CloudFront distribution for staging...${NC}"
    
    # First create Origin Access Identity
    OAI_ID=$(aws cloudfront create-cloud-front-origin-access-identity \
        --cloud-front-origin-access-identity-config CallerReference=$(date +%s),Comment="OAI for Storybook Staging" \
        --query 'CloudFrontOriginAccessIdentity.Id' \
        --output text)
    
    echo -e "${GREEN}✅ Origin Access Identity created: $OAI_ID${NC}"
    
    # Create bucket policy for OAI
    aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "{
        \"Version\": \"2012-10-17\",
        \"Statement\": [
            {
                \"Effect\": \"Allow\",
                \"Principal\": {
                    \"AWS\": \"arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_ID\"
                },
                \"Action\": \"s3:GetObject\",
                \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
            }
        ]
    }"
    
    # Create distribution configuration
    DISTRIBUTION_CONFIG='{
        "CallerReference": "'$(date +%s)'",
        "Comment": "Lightning Talk Circle Storybook Staging",
        "DefaultRootObject": "index.html",
        "Origins": {
            "Quantity": 1,
            "Items": [
                {
                    "Id": "S3-'$BUCKET_NAME'",
                    "DomainName": "'$BUCKET_NAME'.s3.amazonaws.com",
                    "S3OriginConfig": {
                        "OriginAccessIdentity": "origin-access-identity/cloudfront/'$OAI_ID'"
                    }
                }
            ]
        },
        "DefaultCacheBehavior": {
            "TargetOriginId": "S3-'$BUCKET_NAME'",
            "ViewerProtocolPolicy": "redirect-to-https",
            "TrustedSigners": {
                "Enabled": false,
                "Quantity": 0
            },
            "ForwardedValues": {
                "QueryString": false,
                "Cookies": {
                    "Forward": "none"
                }
            },
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000,
            "Compress": true
        },
        "CustomErrorResponses": {
            "Quantity": 2,
            "Items": [
                {
                    "ErrorCode": 403,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 300
                },
                {
                    "ErrorCode": 404,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 300
                }
            ]
        },
        "Enabled": true,
        "PriceClass": "PriceClass_200"
    }'
    
    # Create the distribution
    DISTRIBUTION_ID=$(aws cloudfront create-distribution \
        --distribution-config "$DISTRIBUTION_CONFIG" \
        --query 'Distribution.Id' \
        --output text)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ CloudFront distribution created: $DISTRIBUTION_ID${NC}"
        
        # Get the distribution domain name
        DOMAIN_NAME=$(aws cloudfront get-distribution \
            --id $DISTRIBUTION_ID \
            --query 'Distribution.DomainName' \
            --output text)
        
        echo -e "${GREEN}🌐 Distribution URL: https://$DOMAIN_NAME${NC}"
        
        # Save distribution ID for future use
        echo $DISTRIBUTION_ID > .storybook-staging-distribution-id
        
        return 0
    else
        echo -e "${RED}❌ Failed to create CloudFront distribution${NC}"
        return 1
    fi
}

# Function to deploy storybook content
deploy_content() {
    echo -e "\n${YELLOW}📤 Deploying Storybook content to staging...${NC}"
    
    # Check if storybook-static directory exists
    STORYBOOK_DIR="./lightningtalk-modern/packages/components/storybook-static"
    if [ ! -d "$STORYBOOK_DIR" ]; then
        echo -e "${YELLOW}⚠️  Storybook not built. Building now...${NC}"
        cd ./lightningtalk-modern/packages/components
        npm run build-storybook
        cd ../../../
    fi
    
    # Upload to S3
    aws s3 sync "$STORYBOOK_DIR" "s3://$BUCKET_NAME/" \
        --delete \
        --cache-control "max-age=86400" \
        --metadata-directive REPLACE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Storybook content deployed to staging${NC}"
        
        # Get distribution ID if it exists
        if [ -f ".storybook-staging-distribution-id" ]; then
            DISTRIBUTION_ID=$(cat .storybook-staging-distribution-id)
            echo -e "\n${YELLOW}♻️  Creating CloudFront invalidation...${NC}"
            
            aws cloudfront create-invalidation \
                --distribution-id $DISTRIBUTION_ID \
                --paths "/*" \
                --query 'Invalidation.Id' \
                --output text
            
            echo -e "${GREEN}✅ Cache invalidation created${NC}"
        fi
        
        return 0
    else
        echo -e "${RED}❌ Failed to deploy content${NC}"
        return 1
    fi
}

# Function to display status
show_status() {
    echo -e "\n${BLUE}📊 Staging Environment Status${NC}"
    echo -e "${BLUE}=============================${NC}"
    
    # S3 bucket status
    if aws s3 ls "s3://$BUCKET_NAME" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ S3 Bucket: s3://$BUCKET_NAME${NC}"
        echo -e "   Website: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com/"
    else
        echo -e "${RED}❌ S3 Bucket: Not found${NC}"
    fi
    
    # CloudFront distribution status
    if [ -f ".storybook-staging-distribution-id" ]; then
        DISTRIBUTION_ID=$(cat .storybook-staging-distribution-id)
        STATUS=$(aws cloudfront get-distribution \
            --id $DISTRIBUTION_ID \
            --query 'Distribution.Status' \
            --output text 2>/dev/null || echo "Not found")
        
        if [ "$STATUS" != "Not found" ]; then
            DOMAIN_NAME=$(aws cloudfront get-distribution \
                --id $DISTRIBUTION_ID \
                --query 'Distribution.DomainName' \
                --output text)
            echo -e "${GREEN}✅ CloudFront Distribution: $DISTRIBUTION_ID${NC}"
            echo -e "   Status: $STATUS"
            echo -e "   URL: https://$DOMAIN_NAME"
        else
            echo -e "${RED}❌ CloudFront Distribution: Not found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  CloudFront Distribution: Not configured${NC}"
    fi
}

# Main execution
case "${1:-setup}" in
    "setup")
        create_s3_bucket
        create_cloudfront_distribution
        deploy_content
        show_status
        ;;
    "deploy")
        deploy_content
        ;;
    "status")
        show_status
        ;;
    "destroy")
        echo -e "${RED}🗑️  Destroying staging environment...${NC}"
        
        # Delete CloudFront distribution
        if [ -f ".storybook-staging-distribution-id" ]; then
            DISTRIBUTION_ID=$(cat .storybook-staging-distribution-id)
            echo -e "Disabling CloudFront distribution..."
            
            # First, disable the distribution
            aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > /tmp/dist-config.json
            
            # Modify the config to disable
            jq '.DistributionConfig.Enabled = false' /tmp/dist-config.json > /tmp/dist-config-disabled.json
            
            # Update the distribution
            aws cloudfront update-distribution \
                --id $DISTRIBUTION_ID \
                --distribution-config file:///tmp/dist-config-disabled.json \
                --if-match $(jq -r '.ETag' /tmp/dist-config.json)
            
            echo -e "${YELLOW}⚠️  Distribution disabled. You'll need to delete it manually after it's fully disabled.${NC}"
            rm -f .storybook-staging-distribution-id
        fi
        
        # Empty and delete S3 bucket
        aws s3 rm "s3://$BUCKET_NAME" --recursive
        aws s3api delete-bucket --bucket $BUCKET_NAME --region $REGION
        
        echo -e "${GREEN}✅ Staging environment destroyed${NC}"
        ;;
    *)
        echo -e "Usage: $0 [setup|deploy|status|destroy]"
        echo -e "  setup   - Create staging infrastructure and deploy"
        echo -e "  deploy  - Deploy content to existing staging environment"
        echo -e "  status  - Show staging environment status"
        echo -e "  destroy - Remove staging environment"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✨ Storybook staging operation completed!${NC}"