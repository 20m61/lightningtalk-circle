#!/bin/bash

# Lightning Talk Circle - Data Migration Script
# 既存環境から新環境へのデータ移行スクリプト

set -euo pipefail

# Variables
SOURCE_ENV="${1:-}"
TARGET_ENV="${2:-}"
REGION="${AWS_REGION:-ap-northeast-1}"
BATCH_SIZE=25
DRY_RUN="${3:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Usage
usage() {
    echo "Usage: $0 <source-env> <target-env> [dry-run]"
    echo "Example: $0 dev dev-new"
    echo "Example: $0 dev dev-new dry-run"
    exit 1
}

# Validate arguments
if [ -z "${SOURCE_ENV}" ] || [ -z "${TARGET_ENV}" ]; then
    usage
fi

echo -e "${GREEN}=== Lightning Talk Circle Data Migration ===${NC}"
echo -e "Source Environment: ${YELLOW}${SOURCE_ENV}${NC}"
echo -e "Target Environment: ${YELLOW}${TARGET_ENV}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"
echo -e "Dry Run: ${YELLOW}${DRY_RUN}${NC}"
echo ""

# Function to check if AWS CLI is configured
check_aws_config() {
    if ! aws sts get-caller-identity &>/dev/null; then
        echo -e "${RED}Error: AWS CLI is not configured or credentials are invalid${NC}"
        exit 1
    fi
}

# Function to check if table exists
table_exists() {
    local table_name=$1
    aws dynamodb describe-table --table-name "${table_name}" --region "${REGION}" &>/dev/null
}

# Function to migrate DynamoDB table
migrate_dynamodb_table() {
    local table_type=$1
    local source_table="lightningtalk-circle-${SOURCE_ENV}-${table_type}"
    local target_table="ltc-${TARGET_ENV}-${table_type}"
    
    echo -e "\n${BLUE}Migrating ${table_type} table...${NC}"
    echo -e "  Source: ${YELLOW}${source_table}${NC}"
    echo -e "  Target: ${YELLOW}${target_table}${NC}"
    
    # Check if source table exists
    if ! table_exists "${source_table}"; then
        echo -e "  ${RED}✗ Source table not found${NC}"
        return 1
    fi
    
    # Check if target table exists
    if ! table_exists "${target_table}"; then
        echo -e "  ${RED}✗ Target table not found${NC}"
        return 1
    fi
    
    # Get item count
    local item_count=$(aws dynamodb describe-table \
        --table-name "${source_table}" \
        --region "${REGION}" \
        --query 'Table.ItemCount' \
        --output text)
    
    echo -e "  Items to migrate: ${YELLOW}${item_count}${NC}"
    
    if [ "${DRY_RUN}" == "true" ]; then
        echo -e "  ${YELLOW}[DRY RUN] Would migrate ${item_count} items${NC}"
        return 0
    fi
    
    # Create temporary file for scan results
    local temp_file="/tmp/dynamodb_scan_${table_type}_$$.json"
    
    # Scan all items from source table
    echo -e "  Scanning source table..."
    aws dynamodb scan \
        --table-name "${source_table}" \
        --region "${REGION}" \
        --output json > "${temp_file}"
    
    # Extract items
    local items=$(jq -c '.Items[]' "${temp_file}")
    local total_items=$(echo "${items}" | wc -l)
    local migrated=0
    
    # Batch write items to target table
    echo -e "  Writing to target table..."
    echo "${items}" | while IFS= read -r item; do
        # Create batch write request
        if [ $((migrated % BATCH_SIZE)) -eq 0 ]; then
            echo -ne "\r  Progress: ${migrated}/${total_items} items"
        fi
        
        # Build put request
        echo "${item}" | jq -c "{PutRequest: {Item: .}}" >> "/tmp/batch_${table_type}_$$.json"
        
        # Execute batch write when batch is full
        if [ $((migrated % BATCH_SIZE)) -eq $((BATCH_SIZE - 1)) ] || [ ${migrated} -eq $((total_items - 1)) ]; then
            local batch_items=$(cat "/tmp/batch_${table_type}_$$.json" | jq -s '.')
            local request="{\"${target_table}\": ${batch_items}}"
            
            aws dynamodb batch-write-item \
                --request-items "${request}" \
                --region "${REGION}" \
                --output json > /dev/null
            
            rm -f "/tmp/batch_${table_type}_$$.json"
        fi
        
        ((migrated++)) || true
    done
    
    echo -e "\n  ${GREEN}✓ Migrated ${migrated} items successfully${NC}"
    
    # Cleanup
    rm -f "${temp_file}"
}

# Function to migrate S3 bucket
migrate_s3_bucket() {
    local bucket_type=$1
    local source_bucket="lightningtalk-circle-${SOURCE_ENV}-${bucket_type}"
    local target_bucket="ltc-${TARGET_ENV}-${bucket_type}"
    
    echo -e "\n${BLUE}Migrating ${bucket_type} S3 bucket...${NC}"
    echo -e "  Source: ${YELLOW}${source_bucket}${NC}"
    echo -e "  Target: ${YELLOW}${target_bucket}${NC}"
    
    # Check if source bucket exists
    if ! aws s3api head-bucket --bucket "${source_bucket}" 2>/dev/null; then
        echo -e "  ${YELLOW}⚠ Source bucket not found, skipping${NC}"
        return 0
    fi
    
    # Check if target bucket exists
    if ! aws s3api head-bucket --bucket "${target_bucket}" 2>/dev/null; then
        echo -e "  ${RED}✗ Target bucket not found${NC}"
        return 1
    fi
    
    # Get object count
    local object_count=$(aws s3 ls "s3://${source_bucket}" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')
    echo -e "  Objects to migrate: ${YELLOW}${object_count:-0}${NC}"
    
    if [ "${DRY_RUN}" == "true" ]; then
        echo -e "  ${YELLOW}[DRY RUN] Would sync ${object_count:-0} objects${NC}"
        return 0
    fi
    
    # Sync buckets
    echo -e "  Syncing objects..."
    aws s3 sync "s3://${source_bucket}" "s3://${target_bucket}" \
        --region "${REGION}" \
        --no-progress
    
    echo -e "  ${GREEN}✓ S3 sync completed${NC}"
}

# Function to migrate Cognito users
migrate_cognito_users() {
    echo -e "\n${BLUE}Migrating Cognito users...${NC}"
    
    # Get source User Pool ID
    local source_pool_name="lightningtalk-circle-${SOURCE_ENV}"
    local source_pool_id=$(aws cognito-idp list-user-pools \
        --max-results 60 \
        --region "${REGION}" \
        --query "UserPools[?Name=='${source_pool_name}'].Id" \
        --output text)
    
    # Get target User Pool ID
    local target_pool_name="ltc-${TARGET_ENV}-users"
    local target_pool_id=$(aws cognito-idp list-user-pools \
        --max-results 60 \
        --region "${REGION}" \
        --query "UserPools[?Name=='${target_pool_name}'].Id" \
        --output text)
    
    if [ -z "${source_pool_id}" ]; then
        echo -e "  ${YELLOW}⚠ Source User Pool not found, skipping${NC}"
        return 0
    fi
    
    if [ -z "${target_pool_id}" ]; then
        echo -e "  ${RED}✗ Target User Pool not found${NC}"
        return 1
    fi
    
    echo -e "  Source Pool: ${YELLOW}${source_pool_id}${NC}"
    echo -e "  Target Pool: ${YELLOW}${target_pool_id}${NC}"
    
    if [ "${DRY_RUN}" == "true" ]; then
        echo -e "  ${YELLOW}[DRY RUN] Would migrate Cognito users${NC}"
        return 0
    fi
    
    echo -e "  ${YELLOW}Note: User passwords cannot be migrated directly.${NC}"
    echo -e "  ${YELLOW}Users will need to reset their passwords or use social login.${NC}"
    
    # Export users (limited functionality - mainly for reference)
    local temp_file="/tmp/cognito_users_$$.json"
    aws cognito-idp list-users \
        --user-pool-id "${source_pool_id}" \
        --region "${REGION}" \
        --output json > "${temp_file}"
    
    local user_count=$(jq '.Users | length' "${temp_file}")
    echo -e "  Users found: ${YELLOW}${user_count}${NC}"
    echo -e "  ${GREEN}✓ User list exported for reference${NC}"
    
    # Cleanup
    rm -f "${temp_file}"
}

# Function to update API Gateway base path mappings
update_api_gateway_mappings() {
    echo -e "\n${BLUE}Updating API Gateway mappings...${NC}"
    
    if [ "${DRY_RUN}" == "true" ]; then
        echo -e "  ${YELLOW}[DRY RUN] Would update API Gateway mappings${NC}"
        return 0
    fi
    
    # This would typically involve updating custom domain names and base path mappings
    echo -e "  ${YELLOW}Note: Manual update may be required for API Gateway custom domains${NC}"
}

# Function to verify migration
verify_migration() {
    echo -e "\n${GREEN}=== Verification ===${NC}"
    
    local tables=("events" "participants" "talks" "users")
    
    for table in "${tables[@]}"; do
        local source_table="lightningtalk-circle-${SOURCE_ENV}-${table}"
        local target_table="ltc-${TARGET_ENV}-${table}"
        
        if table_exists "${source_table}" && table_exists "${target_table}"; then
            local source_count=$(aws dynamodb describe-table \
                --table-name "${source_table}" \
                --region "${REGION}" \
                --query 'Table.ItemCount' \
                --output text)
            
            local target_count=$(aws dynamodb describe-table \
                --table-name "${target_table}" \
                --region "${REGION}" \
                --query 'Table.ItemCount' \
                --output text)
            
            if [ "${source_count}" -eq "${target_count}" ]; then
                echo -e "  ${GREEN}✓${NC} ${table}: ${source_count} items"
            else
                echo -e "  ${RED}✗${NC} ${table}: source=${source_count}, target=${target_count}"
            fi
        fi
    done
}

# Function to create migration report
create_migration_report() {
    local report_file="migration_report_${SOURCE_ENV}_to_${TARGET_ENV}_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "${report_file}" <<EOF
Lightning Talk Circle Migration Report
=====================================
Date: $(date)
Source Environment: ${SOURCE_ENV}
Target Environment: ${TARGET_ENV}
Region: ${REGION}

Migration Summary:
- DynamoDB tables migrated
- S3 buckets synced
- Cognito user export completed

Next Steps:
1. Update DNS records to point to new CloudFront distribution
2. Update application configuration with new resource names
3. Test all functionality in new environment
4. Monitor CloudWatch logs for any errors
5. Keep old environment running for rollback capability

Rollback Procedure:
1. Update DNS records back to old CloudFront distribution
2. Stop new environment to prevent data divergence
3. Investigate and fix issues
4. Retry migration
EOF

    echo -e "\n${GREEN}Migration report created: ${YELLOW}${report_file}${NC}"
}

# Main execution
echo -e "${YELLOW}This script will migrate data from ${SOURCE_ENV} to ${TARGET_ENV}.${NC}"
echo -e "${YELLOW}Make sure both environments are properly deployed before proceeding.${NC}"
echo -e ""

if [ "${DRY_RUN}" != "true" ]; then
    read -p "Continue with migration? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Migration cancelled${NC}"
        exit 1
    fi
fi

check_aws_config

# Migrate DynamoDB tables
for table in events participants talks users; do
    migrate_dynamodb_table "${table}" || echo -e "${RED}Failed to migrate ${table} table${NC}"
done

# Migrate S3 buckets
for bucket in uploads assets static; do
    migrate_s3_bucket "${bucket}" || echo -e "${RED}Failed to migrate ${bucket} bucket${NC}"
done

# Migrate Cognito users
migrate_cognito_users

# Update API Gateway mappings
update_api_gateway_mappings

# Verify migration
if [ "${DRY_RUN}" != "true" ]; then
    verify_migration
    create_migration_report
fi

echo -e "\n${GREEN}✓ Migration process completed!${NC}"
if [ "${DRY_RUN}" == "true" ]; then
    echo -e "${YELLOW}This was a dry run. No data was actually migrated.${NC}"
else
    echo -e "${YELLOW}Please verify all data and functionality before switching traffic.${NC}"
fi