#!/bin/bash

# Lightning Talk Circle - Storybook Deployment Script
# This script helps deploy and manage the Storybook static site

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="LightningTalkStorybook-dev"
STORYBOOK_DIR="lightningtalk-modern/packages/components"
CDK_DIR="cdk"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Storybook is built
check_storybook_build() {
    if [ ! -d "$STORYBOOK_DIR/storybook-static" ]; then
        print_error "Storybook static files not found!"
        print_info "Building Storybook..."
        cd "$STORYBOOK_DIR"
        npm run build-storybook
        cd - > /dev/null
        print_success "Storybook built successfully"
    else
        print_success "Storybook static files found"
    fi
}

# Function to check stack status
check_stack_status() {
    local status=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].StackStatus" --output text 2>/dev/null || echo "NOT_FOUND")
    echo "$status"
}

# Function to get stack outputs
get_stack_outputs() {
    aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs" --output json 2>/dev/null || echo "[]"
}

# Function to deploy Storybook
deploy_storybook() {
    print_info "Deploying Storybook to AWS..."
    cd "$CDK_DIR"
    npx cdk deploy "$STACK_NAME" -a 'node bin/storybook.js' --require-approval never
    cd - > /dev/null
}

# Function to invalidate CloudFront cache
invalidate_cache() {
    local distribution_id=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text 2>/dev/null)
    
    if [ -n "$distribution_id" ] && [ "$distribution_id" != "None" ]; then
        print_info "Invalidating CloudFront cache for distribution: $distribution_id"
        aws cloudfront create-invalidation --distribution-id "$distribution_id" --paths "/*" --query "Invalidation.Id" --output text
        print_success "Cache invalidation started"
    else
        print_warning "CloudFront distribution ID not found"
    fi
}

# Function to update Storybook content only
update_content() {
    print_info "Updating Storybook content..."
    
    # Get bucket name
    local bucket_name=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='StorybookBucketName'].OutputValue" --output text 2>/dev/null)
    
    if [ -n "$bucket_name" ] && [ "$bucket_name" != "None" ]; then
        print_info "Syncing files to S3 bucket: $bucket_name"
        aws s3 sync "$STORYBOOK_DIR/storybook-static" "s3://$bucket_name" --delete
        print_success "Files synced successfully"
        
        # Invalidate cache
        invalidate_cache
    else
        print_error "S3 bucket not found. Stack may not be deployed."
        exit 1
    fi
}

# Main script
case "${1:-help}" in
    deploy)
        print_info "Starting Storybook deployment..."
        check_storybook_build
        
        # Check if stack exists
        status=$(check_stack_status)
        if [ "$status" != "NOT_FOUND" ]; then
            print_warning "Stack already exists with status: $status"
            read -p "Do you want to update the stack? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_info "Deployment cancelled"
                exit 0
            fi
        fi
        
        deploy_storybook
        ;;
    
    update)
        print_info "Updating Storybook content..."
        check_storybook_build
        update_content
        ;;
    
    status)
        status=$(check_stack_status)
        print_info "Stack status: $status"
        
        if [ "$status" == "CREATE_COMPLETE" ] || [ "$status" == "UPDATE_COMPLETE" ]; then
            outputs=$(get_stack_outputs)
            echo -e "\n${GREEN}Stack Outputs:${NC}"
            echo "$outputs" | jq -r '.[] | "\(.OutputKey): \(.OutputValue)"'
        fi
        ;;
    
    invalidate)
        invalidate_cache
        ;;
    
    destroy)
        print_warning "This will delete the Storybook infrastructure!"
        read -p "Are you sure? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd "$CDK_DIR"
            npx cdk destroy "$STACK_NAME" -a 'node bin/storybook.js' --force
            cd - > /dev/null
            print_success "Stack destroyed"
        else
            print_info "Destruction cancelled"
        fi
        ;;
    
    *)
        echo "Lightning Talk Circle - Storybook Deployment"
        echo "==========================================="
        echo ""
        echo "Usage: $0 {deploy|update|status|invalidate|destroy}"
        echo ""
        echo "Commands:"
        echo "  deploy      - Deploy the Storybook infrastructure and content"
        echo "  update      - Update only the Storybook content (faster)"
        echo "  status      - Check the deployment status and show URLs"
        echo "  invalidate  - Invalidate CloudFront cache"
        echo "  destroy     - Remove all Storybook infrastructure"
        echo ""
        echo "Examples:"
        echo "  $0 deploy     # First time deployment"
        echo "  $0 update     # Update content after changes"
        echo "  $0 status     # Check deployment and get URLs"
        ;;
esac