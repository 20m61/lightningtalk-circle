#!/bin/bash

# Lightning Talk Circle - Import Existing Resources Script
# 既存のAWSリソースをCloudFormationスタックにインポートするスクリプト

set -euo pipefail

# Variables
ENV="${1:-dev}"
REGION="${AWS_REGION:-ap-northeast-1}"
STACK_PREFIX="LTC"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
IMPORT_DIR="./imports/${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create import directory
mkdir -p "${IMPORT_DIR}"

echo -e "${GREEN}=== Lightning Talk Circle Resource Import ===${NC}"
echo -e "Environment: ${YELLOW}${ENV}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"
echo ""

# Function to check if AWS CLI is configured
check_aws_config() {
    if ! aws sts get-caller-identity &>/dev/null; then
        echo -e "${RED}Error: AWS CLI is not configured or credentials are invalid${NC}"
        exit 1
    fi
}

# Function to create import template for DynamoDB tables
create_dynamodb_import() {
    echo -e "${BLUE}[1/4] Creating DynamoDB import configuration...${NC}"
    
    local tables=("events" "participants" "talks" "users")
    local resources_to_import=()
    
    for table in "${tables[@]}"; do
        local table_name="lightningtalk-circle-${ENV}-${table}"
        
        # Check if table exists
        if aws dynamodb describe-table --table-name "${table_name}" --region "${REGION}" &>/dev/null 2>&1; then
            echo -e "  Found table: ${YELLOW}${table_name}${NC}"
            
            # Create import entry
            local resource_entry=$(cat <<EOF
{
  "ResourceType": "AWS::DynamoDB::Table",
  "LogicalResourceId": "${table^}Table",
  "ResourceIdentifier": {
    "TableName": "${table_name}"
  }
}
EOF
)
            resources_to_import+=("${resource_entry}")
        else
            echo -e "  ${YELLOW}⚠ Table ${table_name} not found${NC}"
        fi
    done
    
    # Create import file
    if [ ${#resources_to_import[@]} -gt 0 ]; then
        echo "[" > "${IMPORT_DIR}/dynamodb-import.json"
        for i in "${!resources_to_import[@]}"; do
            echo "${resources_to_import[$i]}" >> "${IMPORT_DIR}/dynamodb-import.json"
            if [ $i -lt $((${#resources_to_import[@]} - 1)) ]; then
                echo "," >> "${IMPORT_DIR}/dynamodb-import.json"
            fi
        done
        echo "]" >> "${IMPORT_DIR}/dynamodb-import.json"
        
        echo -e "  ${GREEN}✓ Created DynamoDB import configuration${NC}"
    fi
}

# Function to create import template for S3 buckets
create_s3_import() {
    echo -e "\n${BLUE}[2/4] Creating S3 import configuration...${NC}"
    
    local buckets=("uploads" "assets" "static")
    local resources_to_import=()
    
    for bucket in "${buckets[@]}"; do
        local bucket_name="lightningtalk-circle-${ENV}-${bucket}"
        
        # Check if bucket exists
        if aws s3api head-bucket --bucket "${bucket_name}" 2>/dev/null; then
            echo -e "  Found bucket: ${YELLOW}${bucket_name}${NC}"
            
            # Create import entry
            local resource_entry=$(cat <<EOF
{
  "ResourceType": "AWS::S3::Bucket",
  "LogicalResourceId": "${bucket^}Bucket",
  "ResourceIdentifier": {
    "BucketName": "${bucket_name}"
  }
}
EOF
)
            resources_to_import+=("${resource_entry}")
        else
            echo -e "  ${YELLOW}⚠ Bucket ${bucket_name} not found${NC}"
        fi
    done
    
    # Create import file
    if [ ${#resources_to_import[@]} -gt 0 ]; then
        echo "[" > "${IMPORT_DIR}/s3-import.json"
        for i in "${!resources_to_import[@]}"; do
            echo "${resources_to_import[$i]}" >> "${IMPORT_DIR}/s3-import.json"
            if [ $i -lt $((${#resources_to_import[@]} - 1)) ]; then
                echo "," >> "${IMPORT_DIR}/s3-import.json"
            fi
        done
        echo "]" >> "${IMPORT_DIR}/s3-import.json"
        
        echo -e "  ${GREEN}✓ Created S3 import configuration${NC}"
    fi
}

# Function to create import template for Cognito
create_cognito_import() {
    echo -e "\n${BLUE}[3/4] Creating Cognito import configuration...${NC}"
    
    # Get User Pool
    local user_pool_name="lightningtalk-circle-${ENV}"
    local user_pool_id=$(aws cognito-idp list-user-pools \
        --max-results 60 \
        --region "${REGION}" \
        --query "UserPools[?Name=='${user_pool_name}'].Id" \
        --output text)
    
    local resources_to_import=()
    
    if [ -n "${user_pool_id}" ]; then
        echo -e "  Found User Pool: ${YELLOW}${user_pool_id}${NC}"
        
        # Create import entry for User Pool
        local user_pool_entry=$(cat <<EOF
{
  "ResourceType": "AWS::Cognito::UserPool",
  "LogicalResourceId": "UserPool",
  "ResourceIdentifier": {
    "UserPoolId": "${user_pool_id}"
  }
}
EOF
)
        resources_to_import+=("${user_pool_entry}")
        
        # Get User Pool Client
        local client_ids=$(aws cognito-idp list-user-pool-clients \
            --user-pool-id "${user_pool_id}" \
            --region "${REGION}" \
            --query "UserPoolClients[].ClientId" \
            --output text)
        
        if [ -n "${client_ids}" ]; then
            # Use the first client ID
            local client_id=$(echo "${client_ids}" | awk '{print $1}')
            echo -e "  Found User Pool Client: ${YELLOW}${client_id}${NC}"
            
            local client_entry=$(cat <<EOF
{
  "ResourceType": "AWS::Cognito::UserPoolClient",
  "LogicalResourceId": "UserPoolClient",
  "ResourceIdentifier": {
    "UserPoolId": "${user_pool_id}",
    "ClientId": "${client_id}"
  }
}
EOF
)
            resources_to_import+=("${client_entry}")
        fi
        
        # Get Identity Pool
        local identity_pool_id=$(aws cognito-identity list-identity-pools \
            --max-results 60 \
            --region "${REGION}" \
            --query "IdentityPools[?IdentityPoolName=='lightningtalk-circle-${ENV}'].IdentityPoolId" \
            --output text)
        
        if [ -n "${identity_pool_id}" ]; then
            echo -e "  Found Identity Pool: ${YELLOW}${identity_pool_id}${NC}"
            
            local identity_pool_entry=$(cat <<EOF
{
  "ResourceType": "AWS::Cognito::IdentityPool",
  "LogicalResourceId": "IdentityPool",
  "ResourceIdentifier": {
    "IdentityPoolId": "${identity_pool_id}"
  }
}
EOF
)
            resources_to_import+=("${identity_pool_entry}")
        fi
    else
        echo -e "  ${YELLOW}⚠ Cognito User Pool not found${NC}"
    fi
    
    # Create import file
    if [ ${#resources_to_import[@]} -gt 0 ]; then
        echo "[" > "${IMPORT_DIR}/cognito-import.json"
        for i in "${!resources_to_import[@]}"; do
            echo "${resources_to_import[$i]}" >> "${IMPORT_DIR}/cognito-import.json"
            if [ $i -lt $((${#resources_to_import[@]} - 1)) ]; then
                echo "," >> "${IMPORT_DIR}/cognito-import.json"
            fi
        done
        echo "]" >> "${IMPORT_DIR}/cognito-import.json"
        
        echo -e "  ${GREEN}✓ Created Cognito import configuration${NC}"
    fi
}

# Function to create CloudFormation change sets
create_change_sets() {
    echo -e "\n${BLUE}[4/4] Creating CloudFormation change sets...${NC}"
    
    # SharedResources Stack
    if [ -f "${IMPORT_DIR}/dynamodb-import.json" ] || [ -f "${IMPORT_DIR}/s3-import.json" ] || [ -f "${IMPORT_DIR}/cognito-import.json" ]; then
        echo -e "\n${YELLOW}Creating change set for SharedResources stack...${NC}"
        
        # Combine all imports
        local all_imports="[]"
        
        if [ -f "${IMPORT_DIR}/dynamodb-import.json" ]; then
            all_imports=$(jq -s '.[0] + .[1]' <(echo "${all_imports}") "${IMPORT_DIR}/dynamodb-import.json")
        fi
        
        if [ -f "${IMPORT_DIR}/s3-import.json" ]; then
            all_imports=$(jq -s '.[0] + .[1]' <(echo "${all_imports}") "${IMPORT_DIR}/s3-import.json")
        fi
        
        if [ -f "${IMPORT_DIR}/cognito-import.json" ]; then
            all_imports=$(jq -s '.[0] + .[1]' <(echo "${all_imports}") "${IMPORT_DIR}/cognito-import.json")
        fi
        
        echo "${all_imports}" > "${IMPORT_DIR}/all-imports.json"
        
        # Generate template
        echo -e "  Synthesizing CDK template..."
        cd ..
        npx cdk synth "${STACK_PREFIX}-SharedResources-${ENV}" \
            --app "node bin/cdk-optimized.js" \
            -c env="${ENV}" \
            --output "${IMPORT_DIR}/cdk.out" > /dev/null 2>&1
        cd scripts
        
        local template_path="${IMPORT_DIR}/cdk.out/${STACK_PREFIX}-SharedResources-${ENV}.template.json"
        
        if [ -f "${template_path}" ]; then
            echo -e "  ${GREEN}✓ Template generated${NC}"
            
            # Create import commands
            cat > "${IMPORT_DIR}/import-commands.sh" <<EOF
#!/bin/bash
# Import commands for Lightning Talk Circle resources

# Create change set for importing resources
aws cloudformation create-change-set \\
  --stack-name "${STACK_PREFIX}-SharedResources-${ENV}" \\
  --change-set-name "Import-$(date +%Y%m%d-%H%M%S)" \\
  --change-set-type IMPORT \\
  --resources-to-import file://${IMPORT_DIR}/all-imports.json \\
  --template-body file://${template_path} \\
  --capabilities CAPABILITY_IAM \\
  --region ${REGION}

# Wait for change set creation
echo "Waiting for change set creation..."
aws cloudformation wait change-set-create-complete \\
  --stack-name "${STACK_PREFIX}-SharedResources-${ENV}" \\
  --change-set-name "Import-$(date +%Y%m%d-%H%M%S)" \\
  --region ${REGION}

# Review change set
aws cloudformation describe-change-set \\
  --stack-name "${STACK_PREFIX}-SharedResources-${ENV}" \\
  --change-set-name "Import-$(date +%Y%m%d-%H%M%S)" \\
  --region ${REGION}

# Execute change set (uncomment to execute)
# aws cloudformation execute-change-set \\
#   --stack-name "${STACK_PREFIX}-SharedResources-${ENV}" \\
#   --change-set-name "Import-$(date +%Y%m%d-%H%M%S)" \\
#   --region ${REGION}
EOF
            
            chmod +x "${IMPORT_DIR}/import-commands.sh"
            echo -e "  ${GREEN}✓ Created import commands script${NC}"
        else
            echo -e "  ${RED}✗ Failed to generate template${NC}"
        fi
    fi
}

# Function to create import summary
create_import_summary() {
    echo -e "\n${GREEN}Creating import summary...${NC}"
    
    cat > "${IMPORT_DIR}/import-summary.md" <<EOF
# Lightning Talk Circle Resource Import Summary

**Date**: $(date)  
**Environment**: ${ENV}  
**Region**: ${REGION}

## Resources Found

### DynamoDB Tables
$(if [ -f "${IMPORT_DIR}/dynamodb-import.json" ]; then
    jq -r '.[] | "- " + .ResourceIdentifier.TableName' "${IMPORT_DIR}/dynamodb-import.json"
else
    echo "- None found"
fi)

### S3 Buckets
$(if [ -f "${IMPORT_DIR}/s3-import.json" ]; then
    jq -r '.[] | "- " + .ResourceIdentifier.BucketName' "${IMPORT_DIR}/s3-import.json"
else
    echo "- None found"
fi)

### Cognito Resources
$(if [ -f "${IMPORT_DIR}/cognito-import.json" ]; then
    jq -r '.[] | "- " + .ResourceType + ": " + (.ResourceIdentifier | to_entries | map(.key + "=" + .value) | join(", "))' "${IMPORT_DIR}/cognito-import.json"
else
    echo "- None found"
fi)

## Next Steps

1. Review the generated import configurations in \`${IMPORT_DIR}\`
2. Ensure your CDK templates match the existing resource configurations
3. Execute the import commands script: \`${IMPORT_DIR}/import-commands.sh\`
4. Review the CloudFormation change set before executing
5. Execute the change set to import resources
6. Verify all resources are properly imported

## Important Notes

- Resource import is a one-way operation
- Ensure existing resource configurations match CDK templates
- Some resource properties cannot be imported and must be set manually
- Always review change sets before execution
- Keep backups of existing resources before importing

## Rollback Plan

If import fails:
1. Delete the failed change set
2. Review CloudFormation events for error details
3. Fix template mismatches
4. Retry import process

EOF
    
    echo -e "  ${GREEN}✓ Created import summary: ${YELLOW}${IMPORT_DIR}/import-summary.md${NC}"
}

# Main execution
check_aws_config
create_dynamodb_import
create_s3_import
create_cognito_import
create_change_sets
create_import_summary

echo -e "\n${GREEN}✓ Import configuration completed!${NC}"
echo -e "Import files location: ${YELLOW}${IMPORT_DIR}${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Review import configuration in ${IMPORT_DIR}/import-summary.md"
echo -e "2. Modify CDK templates if needed to match existing resources"
echo -e "3. Execute import commands: ${IMPORT_DIR}/import-commands.sh"
echo -e "4. Review and execute the CloudFormation change set"