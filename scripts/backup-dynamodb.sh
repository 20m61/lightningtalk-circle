#!/bin/bash

# DynamoDB Daily Backup Script
# This script creates daily backups of all DynamoDB tables for Lightning Talk Circle

set -euo pipefail

# Configuration
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
TABLE_PREFIX="lightningtalk-circle-prod"
BACKUP_RETENTION_DAYS=30
LOG_FILE="/var/log/dynamodb-backup.log"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Tables to backup
TABLES=(
  "${TABLE_PREFIX}-events"
  "${TABLE_PREFIX}-participants"
  "${TABLE_PREFIX}-users"
  "${TABLE_PREFIX}-talks"
  "${TABLE_PREFIX}-participation-votes"
  "${TABLE_PREFIX}-voting-sessions"
)

# Logging function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Send notification to Slack
notify_slack() {
  local message="$1"
  local color="${2:-#36a64f}"
  
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{
        \"attachments\": [{
          \"color\": \"$color\",
          \"text\": \"$message\",
          \"footer\": \"DynamoDB Backup\",
          \"ts\": $(date +%s)
        }]
      }" 2>/dev/null || true
  fi
}

# Check if table exists
table_exists() {
  local table_name="$1"
  aws dynamodb describe-table \
    --table-name "$table_name" \
    --region "$AWS_REGION" \
    --output text \
    --query 'Table.TableStatus' 2>/dev/null || echo "NOT_FOUND"
}

# Create backup
create_backup() {
  local table_name="$1"
  local backup_name="${table_name}-backup-$(date +%Y%m%d-%H%M%S)"
  
  log "Creating backup for table: $table_name"
  
  # Check if table exists
  local table_status=$(table_exists "$table_name")
  if [ "$table_status" = "NOT_FOUND" ]; then
    log "ERROR: Table $table_name not found"
    return 1
  fi
  
  if [ "$table_status" != "ACTIVE" ]; then
    log "WARNING: Table $table_name is not in ACTIVE state (current: $table_status)"
  fi
  
  # Create backup
  local backup_arn=$(aws dynamodb create-backup \
    --table-name "$table_name" \
    --backup-name "$backup_name" \
    --region "$AWS_REGION" \
    --output text \
    --query 'BackupDetails.BackupArn' 2>&1)
  
  if [ $? -eq 0 ]; then
    log "SUCCESS: Backup created - $backup_arn"
    echo "$backup_arn"
    return 0
  else
    log "ERROR: Failed to create backup for $table_name - $backup_arn"
    return 1
  fi
}

# Delete old backups
cleanup_old_backups() {
  local table_name="$1"
  local cutoff_timestamp=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%s)
  
  log "Cleaning up old backups for table: $table_name"
  
  # List backups
  local backups=$(aws dynamodb list-backups \
    --table-name "$table_name" \
    --region "$AWS_REGION" \
    --output json)
  
  # Process each backup
  echo "$backups" | jq -r '.BackupSummaries[] | @base64' | while read -r backup_data; do
    local backup=$(echo "$backup_data" | base64 -d)
    local backup_arn=$(echo "$backup" | jq -r '.BackupArn')
    local backup_timestamp=$(echo "$backup" | jq -r '.BackupCreationDateTime')
    local backup_epoch=$(date -d "$backup_timestamp" +%s 2>/dev/null || echo 0)
    
    if [ "$backup_epoch" -lt "$cutoff_timestamp" ] && [ "$backup_epoch" -gt 0 ]; then
      log "Deleting old backup: $backup_arn"
      aws dynamodb delete-backup \
        --backup-arn "$backup_arn" \
        --region "$AWS_REGION" 2>&1 | tee -a "$LOG_FILE"
    fi
  done
}

# Verify backup
verify_backup() {
  local backup_arn="$1"
  
  local backup_status=$(aws dynamodb describe-backup \
    --backup-arn "$backup_arn" \
    --region "$AWS_REGION" \
    --output text \
    --query 'BackupDescription.BackupDetails.BackupStatus' 2>/dev/null)
  
  if [ "$backup_status" = "AVAILABLE" ]; then
    return 0
  else
    return 1
  fi
}

# Main backup process
main() {
  log "=== Starting DynamoDB backup process ==="
  
  local total_tables=${#TABLES[@]}
  local successful_backups=0
  local failed_tables=()
  
  # Create backups
  for table in "${TABLES[@]}"; do
    if backup_arn=$(create_backup "$table"); then
      # Verify backup
      sleep 5  # Wait a bit for backup to initialize
      if verify_backup "$backup_arn"; then
        ((successful_backups++))
      else
        failed_tables+=("$table")
        log "WARNING: Backup verification failed for $table"
      fi
      
      # Cleanup old backups
      cleanup_old_backups "$table"
    else
      failed_tables+=("$table")
    fi
    
    # Small delay between operations
    sleep 2
  done
  
  # Summary
  log "=== Backup process completed ==="
  log "Total tables: $total_tables"
  log "Successful backups: $successful_backups"
  log "Failed backups: ${#failed_tables[@]}"
  
  # Send notification
  if [ ${#failed_tables[@]} -eq 0 ]; then
    notify_slack "✅ DynamoDB backup completed successfully. $successful_backups/$total_tables tables backed up." "#36a64f"
  else
    notify_slack "⚠️ DynamoDB backup completed with errors. $successful_backups/$total_tables tables backed up. Failed: ${failed_tables[*]}" "#ff9900"
  fi
  
  # Exit with appropriate code
  if [ ${#failed_tables[@]} -gt 0 ]; then
    exit 1
  fi
}

# Check AWS CLI availability
if ! command -v aws &> /dev/null; then
  log "ERROR: AWS CLI not found. Please install AWS CLI."
  exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  log "ERROR: AWS credentials not configured or invalid."
  exit 1
fi

# Create log directory if needed
mkdir -p "$(dirname "$LOG_FILE")"

# Run main process
main