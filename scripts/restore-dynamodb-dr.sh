#!/bin/bash

# DynamoDB Disaster Recovery Restore Script
# This script restores DynamoDB tables in a DR region from backups

set -euo pipefail

# Configuration
SOURCE_REGION="${SOURCE_REGION:-ap-northeast-1}"
TARGET_REGION="${TARGET_REGION:-us-west-2}"
TABLE_PREFIX="lightningtalk-circle-prod"
RESTORE_POINT="${RESTORE_POINT:-}"  # Optional: specific timestamp for PITR

# Tables to restore
TABLES=(
  "${TABLE_PREFIX}-events"
  "${TABLE_PREFIX}-participants"
  "${TABLE_PREFIX}-users"
  "${TABLE_PREFIX}-talks"
  "${TABLE_PREFIX}-participation-votes"
  "${TABLE_PREFIX}-voting-sessions"
)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Find latest backup for a table
find_latest_backup() {
  local table_name="$1"
  local region="$2"
  
  log_info "Finding latest backup for $table_name in $region"
  
  local latest_backup=$(aws dynamodb list-backups \
    --table-name "$table_name" \
    --region "$region" \
    --backup-type "USER" \
    --output json \
    --query 'BackupSummaries | sort_by(@, &BackupCreationDateTime) | [-1].BackupArn' \
    --output text 2>/dev/null)
  
  if [ "$latest_backup" = "None" ] || [ -z "$latest_backup" ]; then
    return 1
  else
    echo "$latest_backup"
    return 0
  fi
}

# Export table to S3 for cross-region restore
export_table_to_s3() {
  local table_name="$1"
  local s3_bucket="$2"
  local export_time="${3:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
  
  log_info "Exporting $table_name to S3 bucket $s3_bucket"
  
  local export_arn=$(aws dynamodb export-table-to-point-in-time \
    --table-arn "arn:aws:dynamodb:${SOURCE_REGION}:$(aws sts get-caller-identity --query Account --output text):table/${table_name}" \
    --s3-bucket "$s3_bucket" \
    --s3-prefix "dr-export/${table_name}" \
    --export-time "$export_time" \
    --region "$SOURCE_REGION" \
    --output text \
    --query 'ExportDescription.ExportArn' 2>&1)
  
  if [ $? -eq 0 ]; then
    echo "$export_arn"
    return 0
  else
    log_error "Failed to export table: $export_arn"
    return 1
  fi
}

# Wait for export to complete
wait_for_export() {
  local export_arn="$1"
  local max_wait=1800  # 30 minutes
  local elapsed=0
  
  log_info "Waiting for export to complete..."
  
  while [ $elapsed -lt $max_wait ]; do
    local status=$(aws dynamodb describe-export \
      --export-arn "$export_arn" \
      --region "$SOURCE_REGION" \
      --output text \
      --query 'ExportDescription.ExportStatus' 2>/dev/null)
    
    case "$status" in
      "COMPLETED")
        log_info "Export completed successfully"
        return 0
        ;;
      "FAILED")
        log_error "Export failed"
        return 1
        ;;
      "IN_PROGRESS")
        echo -n "."
        sleep 30
        elapsed=$((elapsed + 30))
        ;;
      *)
        log_warn "Unknown export status: $status"
        sleep 30
        elapsed=$((elapsed + 30))
        ;;
    esac
  done
  
  log_error "Export timed out after ${max_wait} seconds"
  return 1
}

# Import table from S3
import_table_from_s3() {
  local table_name="$1"
  local s3_bucket="$2"
  local s3_prefix="dr-export/${table_name}"
  
  log_info "Importing $table_name from S3 in DR region"
  
  # Get the manifest file location
  local manifest_file="s3://${s3_bucket}/${s3_prefix}/AWSDynamoDB/manifest-files.json"
  
  # Create import job
  local import_arn=$(aws dynamodb import-table \
    --s3-bucket-source "{\"S3Bucket\": \"$s3_bucket\", \"S3KeyPrefix\": \"$s3_prefix\"}" \
    --input-format "DYNAMODB_JSON" \
    --table-creation-parameters "{
      \"TableName\": \"${table_name}-dr\",
      \"BillingMode\": \"PAY_PER_REQUEST\",
      \"AttributeDefinitions\": [{\"AttributeName\": \"id\", \"AttributeType\": \"S\"}],
      \"KeySchema\": [{\"AttributeName\": \"id\", \"KeyType\": \"HASH\"}]
    }" \
    --region "$TARGET_REGION" \
    --output text \
    --query 'ImportTableDescription.ImportArn' 2>&1)
  
  if [ $? -eq 0 ]; then
    echo "$import_arn"
    return 0
  else
    log_error "Failed to start import: $import_arn"
    return 1
  fi
}

# Restore using Point-in-Time Recovery
restore_with_pitr() {
  local table_name="$1"
  local target_table_name="${table_name}-dr"
  local restore_time="${RESTORE_POINT:-$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)}"
  
  log_info "Attempting PITR restore for $table_name to $restore_time"
  
  # Note: Cross-region PITR is not directly supported, so we use export/import
  log_warn "Cross-region PITR not available, using export/import method"
  return 1
}

# Create table from backup (same region only)
restore_from_backup() {
  local backup_arn="$1"
  local target_table_name="$2"
  local region="$3"
  
  log_info "Restoring from backup to $target_table_name"
  
  aws dynamodb restore-table-from-backup \
    --backup-arn "$backup_arn" \
    --target-table-name "$target_table_name" \
    --region "$region" \
    --billing-mode-override "PAY_PER_REQUEST" \
    2>&1 | tee -a restore.log
  
  return $?
}

# Verify restored table
verify_table() {
  local table_name="$1"
  local region="$2"
  
  log_info "Verifying table $table_name in $region"
  
  local table_status=$(aws dynamodb describe-table \
    --table-name "$table_name" \
    --region "$region" \
    --output text \
    --query 'Table.TableStatus' 2>/dev/null)
  
  if [ "$table_status" = "ACTIVE" ]; then
    local item_count=$(aws dynamodb describe-table \
      --table-name "$table_name" \
      --region "$region" \
      --output text \
      --query 'Table.ItemCount' 2>/dev/null)
    
    log_info "Table is ACTIVE with $item_count items"
    return 0
  else
    log_error "Table status: $table_status"
    return 1
  fi
}

# Main restore process
main() {
  log_info "=== Starting DynamoDB DR Restore Process ==="
  log_info "Source Region: $SOURCE_REGION"
  log_info "Target Region: $TARGET_REGION"
  
  # Check prerequisites
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found"
    exit 1
  fi
  
  # Check S3 bucket for cross-region transfer
  local s3_bucket="lightningtalk-dr-transfer-$(aws sts get-caller-identity --query Account --output text)"
  log_info "Using S3 bucket: $s3_bucket"
  
  # Create S3 bucket if it doesn't exist
  aws s3 mb "s3://${s3_bucket}" --region "$SOURCE_REGION" 2>/dev/null || true
  
  # Process each table
  local total_tables=${#TABLES[@]}
  local restored_tables=0
  local failed_tables=()
  
  for table in "${TABLES[@]}"; do
    log_info "Processing table: $table"
    
    # Try different restore methods
    if [ -n "$RESTORE_POINT" ]; then
      # Specific point-in-time restore
      if restore_with_pitr "$table"; then
        ((restored_tables++))
        continue
      fi
    fi
    
    # Export/Import method for cross-region
    if export_arn=$(export_table_to_s3 "$table" "$s3_bucket"); then
      if wait_for_export "$export_arn"; then
        if import_arn=$(import_table_from_s3 "$table" "$s3_bucket"); then
          log_info "Import started: $import_arn"
          ((restored_tables++))
        else
          failed_tables+=("$table")
        fi
      else
        failed_tables+=("$table")
      fi
    else
      # Try backup restore as fallback
      if backup_arn=$(find_latest_backup "$table" "$SOURCE_REGION"); then
        log_warn "Using backup restore (same region only)"
        if restore_from_backup "$backup_arn" "${table}-dr" "$SOURCE_REGION"; then
          ((restored_tables++))
        else
          failed_tables+=("$table")
        fi
      else
        log_error "No backup found for $table"
        failed_tables+=("$table")
      fi
    fi
    
    # Small delay between operations
    sleep 5
  done
  
  # Summary
  log_info "=== DR Restore Process Completed ==="
  log_info "Total tables: $total_tables"
  log_info "Successfully initiated restore: $restored_tables"
  log_info "Failed: ${#failed_tables[@]}"
  
  if [ ${#failed_tables[@]} -gt 0 ]; then
    log_error "Failed tables: ${failed_tables[*]}"
    exit 1
  fi
  
  # Wait for imports to complete and verify
  log_info "Waiting for all imports to complete..."
  sleep 60
  
  # Verify all restored tables
  for table in "${TABLES[@]}"; do
    if verify_table "${table}-dr" "$TARGET_REGION"; then
      log_info "✓ ${table}-dr verified"
    else
      log_warn "✗ ${table}-dr verification failed"
    fi
  done
  
  log_info "DR restore process completed. Please update application configuration to use new table names."
}

# Parse command line arguments
while getopts "s:t:p:h" opt; do
  case $opt in
    s)
      SOURCE_REGION="$OPTARG"
      ;;
    t)
      TARGET_REGION="$OPTARG"
      ;;
    p)
      RESTORE_POINT="$OPTARG"
      ;;
    h)
      echo "Usage: $0 [-s source_region] [-t target_region] [-p restore_point]"
      echo "  -s: Source region (default: ap-northeast-1)"
      echo "  -t: Target region (default: us-west-2)"
      echo "  -p: Restore point timestamp (default: latest)"
      exit 0
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

# Run main process
main