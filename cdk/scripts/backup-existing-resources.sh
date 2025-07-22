#!/bin/bash

# Lightning Talk Circle - Backup Existing Resources Script
# 既存のAWSリソースをバックアップするスクリプト

set -euo pipefail

# Variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/${TIMESTAMP}"
REGION="${AWS_REGION:-ap-northeast-1}"
ENV="${1:-dev}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo -e "${GREEN}=== Lightning Talk Circle Backup Script ===${NC}"
echo -e "Environment: ${YELLOW}${ENV}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"
echo -e "Backup Directory: ${YELLOW}${BACKUP_DIR}${NC}"
echo ""

# Function to check if AWS CLI is configured
check_aws_config() {
    if ! aws sts get-caller-identity &>/dev/null; then
        echo -e "${RED}Error: AWS CLI is not configured or credentials are invalid${NC}"
        exit 1
    fi
}

# Function to backup DynamoDB tables
backup_dynamodb() {
    echo -e "${GREEN}[1/5] Backing up DynamoDB tables...${NC}"
    
    local tables=("events" "participants" "talks" "users")
    
    for table in "${tables[@]}"; do
        local table_name="lightningtalk-circle-${ENV}-${table}"
        echo -e "  Backing up table: ${YELLOW}${table_name}${NC}"
        
        # Check if table exists
        if aws dynamodb describe-table --table-name "${table_name}" --region "${REGION}" &>/dev/null; then
            # Export table data
            aws dynamodb scan \
                --table-name "${table_name}" \
                --region "${REGION}" \
                --output json > "${BACKUP_DIR}/dynamodb_${table}.json"
            
            # Also save table schema
            aws dynamodb describe-table \
                --table-name "${table_name}" \
                --region "${REGION}" \
                --output json > "${BACKUP_DIR}/dynamodb_${table}_schema.json"
            
            echo -e "    ✓ Backed up ${GREEN}$(jq '.Count' "${BACKUP_DIR}/dynamodb_${table}.json")${NC} items"
        else
            echo -e "    ${YELLOW}⚠ Table not found, skipping${NC}"
        fi
    done
}

# Function to backup S3 buckets
backup_s3() {
    echo -e "\n${GREEN}[2/5] Backing up S3 bucket configurations...${NC}"
    
    local buckets=("uploads" "assets" "static")
    
    for bucket in "${buckets[@]}"; do
        local bucket_name="lightningtalk-circle-${ENV}-${bucket}"
        echo -e "  Backing up bucket: ${YELLOW}${bucket_name}${NC}"
        
        # Check if bucket exists
        if aws s3api head-bucket --bucket "${bucket_name}" 2>/dev/null; then
            # Save bucket policy
            aws s3api get-bucket-policy \
                --bucket "${bucket_name}" \
                --output json 2>/dev/null > "${BACKUP_DIR}/s3_${bucket}_policy.json" || echo "{}" > "${BACKUP_DIR}/s3_${bucket}_policy.json"
            
            # Save bucket versioning
            aws s3api get-bucket-versioning \
                --bucket "${bucket_name}" \
                --output json > "${BACKUP_DIR}/s3_${bucket}_versioning.json"
            
            # Save bucket lifecycle
            aws s3api get-bucket-lifecycle-configuration \
                --bucket "${bucket_name}" \
                --output json 2>/dev/null > "${BACKUP_DIR}/s3_${bucket}_lifecycle.json" || echo "{}" > "${BACKUP_DIR}/s3_${bucket}_lifecycle.json"
            
            # List objects (first 1000)
            aws s3api list-objects-v2 \
                --bucket "${bucket_name}" \
                --max-items 1000 \
                --output json > "${BACKUP_DIR}/s3_${bucket}_objects.json"
            
            echo -e "    ✓ Configuration backed up"
        else
            echo -e "    ${YELLOW}⚠ Bucket not found, skipping${NC}"
        fi
    done
}

# Function to backup Cognito
backup_cognito() {
    echo -e "\n${GREEN}[3/5] Backing up Cognito configuration...${NC}"
    
    # Get User Pool ID
    local user_pool_name="lightningtalk-circle-${ENV}"
    local user_pool_id=$(aws cognito-idp list-user-pools \
        --max-results 60 \
        --region "${REGION}" \
        --query "UserPools[?Name=='${user_pool_name}'].Id" \
        --output text)
    
    if [ -n "${user_pool_id}" ]; then
        echo -e "  Found User Pool: ${YELLOW}${user_pool_id}${NC}"
        
        # Backup User Pool configuration
        aws cognito-idp describe-user-pool \
            --user-pool-id "${user_pool_id}" \
            --region "${REGION}" \
            --output json > "${BACKUP_DIR}/cognito_user_pool.json"
        
        # Backup User Pool clients
        aws cognito-idp list-user-pool-clients \
            --user-pool-id "${user_pool_id}" \
            --region "${REGION}" \
            --output json > "${BACKUP_DIR}/cognito_clients.json"
        
        # Backup Identity Pool
        local identity_pool_id=$(aws cognito-identity list-identity-pools \
            --max-results 60 \
            --region "${REGION}" \
            --query "IdentityPools[?IdentityPoolName=='lightningtalk-circle-${ENV}'].IdentityPoolId" \
            --output text)
        
        if [ -n "${identity_pool_id}" ]; then
            aws cognito-identity describe-identity-pool \
                --identity-pool-id "${identity_pool_id}" \
                --region "${REGION}" \
                --output json > "${BACKUP_DIR}/cognito_identity_pool.json"
        fi
        
        echo -e "    ✓ Cognito configuration backed up"
    else
        echo -e "    ${YELLOW}⚠ User Pool not found${NC}"
    fi
}

# Function to backup Lambda functions
backup_lambda() {
    echo -e "\n${GREEN}[4/5] Backing up Lambda function configurations...${NC}"
    
    local functions=$(aws lambda list-functions \
        --region "${REGION}" \
        --query "Functions[?starts_with(FunctionName, 'lightningtalk-circle-${ENV}')].FunctionName" \
        --output text)
    
    if [ -n "${functions}" ]; then
        for func in ${functions}; do
            echo -e "  Backing up function: ${YELLOW}${func}${NC}"
            
            # Save function configuration
            aws lambda get-function \
                --function-name "${func}" \
                --region "${REGION}" \
                --output json > "${BACKUP_DIR}/lambda_${func}.json"
            
            # Download function code
            aws lambda get-function \
                --function-name "${func}" \
                --region "${REGION}" \
                --query 'Code.Location' \
                --output text | xargs wget -q -O "${BACKUP_DIR}/lambda_${func}_code.zip"
            
            echo -e "    ✓ Function backed up"
        done
    else
        echo -e "    ${YELLOW}⚠ No Lambda functions found${NC}"
    fi
}

# Function to backup CloudFormation stack parameters
backup_cloudformation() {
    echo -e "\n${GREEN}[5/5] Backing up CloudFormation stack information...${NC}"
    
    local stacks=$(aws cloudformation list-stacks \
        --region "${REGION}" \
        --query "StackSummaries[?contains(StackName, 'LightningTalk') && StackStatus!='DELETE_COMPLETE'].StackName" \
        --output text)
    
    if [ -n "${stacks}" ]; then
        for stack in ${stacks}; do
            echo -e "  Backing up stack: ${YELLOW}${stack}${NC}"
            
            # Save stack template
            aws cloudformation get-template \
                --stack-name "${stack}" \
                --region "${REGION}" \
                --output json > "${BACKUP_DIR}/cf_${stack}_template.json"
            
            # Save stack parameters and outputs
            aws cloudformation describe-stacks \
                --stack-name "${stack}" \
                --region "${REGION}" \
                --output json > "${BACKUP_DIR}/cf_${stack}_description.json"
            
            echo -e "    ✓ Stack information backed up"
        done
    else
        echo -e "    ${YELLOW}⚠ No CloudFormation stacks found${NC}"
    fi
}

# Function to create backup summary
create_summary() {
    echo -e "\n${GREEN}Creating backup summary...${NC}"
    
    cat > "${BACKUP_DIR}/backup_summary.txt" <<EOF
Lightning Talk Circle Backup Summary
====================================
Timestamp: ${TIMESTAMP}
Environment: ${ENV}
Region: ${REGION}

Files created:
$(ls -la "${BACKUP_DIR}" | grep -v "^total" | grep -v "^d")

Backup completed successfully!
EOF

    echo -e "  ✓ Summary created: ${YELLOW}${BACKUP_DIR}/backup_summary.txt${NC}"
}

# Main execution
check_aws_config
backup_dynamodb
backup_s3
backup_cognito
backup_lambda
backup_cloudformation
create_summary

echo -e "\n${GREEN}✓ Backup completed successfully!${NC}"
echo -e "Backup location: ${YELLOW}${BACKUP_DIR}${NC}"
echo -e "\n${YELLOW}Note: This backup includes configurations and metadata only.${NC}"
echo -e "${YELLOW}For full data backup, consider using AWS Backup or DynamoDB point-in-time recovery.${NC}"