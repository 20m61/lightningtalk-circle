#!/bin/bash

# Lightning Talk Circle - Deployment Rollback Script
# Provides quick and safe rollback capabilities for production deployments

set -euo pipefail

# Configuration
PROJECT_NAME="lightningtalk-circle"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
CLUSTER_NAME="${PROJECT_NAME}-prod"
LOG_FILE="rollback-$(date +%Y%m%d-%H%M%S).log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_step() {
  echo -e "\n${BLUE}==>${NC} $1\n" | tee -a "$LOG_FILE"
}

# Get current service information
get_current_version() {
  local service_name="$1"
  
  aws ecs describe-services \
    --cluster "$CLUSTER_NAME" \
    --services "$service_name" \
    --region "$AWS_REGION" \
    --query 'services[0].taskDefinition' \
    --output text | rev | cut -d: -f1 | rev
}

# Get previous stable version
get_previous_version() {
  local service_name="$1"
  local current_version="$2"
  
  # Check if we have a recorded stable version
  local stable_version=$(aws ssm get-parameter \
    --name "/lightningtalk/prod/${service_name}/stable-version" \
    --region "$AWS_REGION" \
    --query 'Parameter.Value' \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$stable_version" ] && [ "$stable_version" != "$current_version" ]; then
    echo "$stable_version"
  else
    # Default to previous version
    echo $((current_version - 1))
  fi
}

# Perform health check
health_check() {
  local max_attempts=30
  local attempt=1
  
  log_info "Performing health checks..."
  
  while [ $attempt -le $max_attempts ]; do
    local api_health=$(curl -s -o /dev/null -w "%{http_code}" https://api.xn--6wym69a.com/health || echo "000")
    
    if [ "$api_health" = "200" ]; then
      log_info "✓ Health check passed (attempt $attempt)"
      return 0
    else
      log_warn "Health check failed (attempt $attempt/$max_attempts)"
      sleep 10
      ((attempt++))
    fi
  done
  
  log_error "Health check failed after $max_attempts attempts"
  return 1
}

# Rollback ECS service
rollback_service() {
  local service_name="$1"
  local target_version="$2"
  local task_family="${service_name%-service}"
  
  log_info "Rolling back $service_name to version $target_version"
  
  # Update service with previous task definition
  aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "$service_name" \
    --task-definition "${task_family}:${target_version}" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --output json >> "$LOG_FILE"
  
  # Wait for service to stabilize
  log_info "Waiting for $service_name to stabilize..."
  aws ecs wait services-stable \
    --cluster "$CLUSTER_NAME" \
    --services "$service_name" \
    --region "$AWS_REGION"
  
  log_info "✓ $service_name rollback complete"
}

# Rollback static assets
rollback_static_assets() {
  local backup_tag="$1"
  
  log_info "Rolling back static assets to backup: $backup_tag"
  
  # Copy from backup
  aws s3 sync \
    "s3://${PROJECT_NAME}-backups/static/${backup_tag}/" \
    "s3://${PROJECT_NAME}-prod-static/" \
    --delete \
    --region "$AWS_REGION"
  
  # Invalidate CloudFront cache
  local dist_id=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='${PROJECT_NAME}-prod'].Id" \
    --output text)
  
  if [ -n "$dist_id" ]; then
    aws cloudfront create-invalidation \
      --distribution-id "$dist_id" \
      --paths "/*" \
      --region "$AWS_REGION"
    log_info "CloudFront invalidation created"
  fi
}

# Create rollback report
create_report() {
  local report_file="rollback-report-$(date +%Y%m%d-%H%M%S).md"
  
  cat > "$report_file" << EOF
# Rollback Report

## Summary
- Date: $(date)
- Initiated by: $(whoami)
- Type: $ROLLBACK_TYPE
- Status: $ROLLBACK_STATUS

## Services Rolled Back
EOF
  
  for service in "${ROLLED_BACK_SERVICES[@]}"; do
    echo "- $service" >> "$report_file"
  done
  
  cat >> "$report_file" << EOF

## Metrics
- Duration: $ROLLBACK_DURATION seconds
- Health Check: $HEALTH_STATUS
- Error Count: $(grep -c ERROR "$LOG_FILE" || echo 0)

## Log File
See: $LOG_FILE
EOF
  
  log_info "Report saved to: $report_file"
}

# Main rollback menu
show_menu() {
  echo -e "\n${BLUE}Lightning Talk Circle - Rollback Menu${NC}"
  echo "======================================"
  echo "1) Quick Rollback (All Services)"
  echo "2) Selective Service Rollback"
  echo "3) Static Assets Rollback Only"
  echo "4) Configuration Rollback"
  echo "5) Emergency Full Rollback"
  echo "6) Check Current Versions"
  echo "7) Exit"
  echo
  read -p "Select option: " choice
  
  case $choice in
    1) quick_rollback ;;
    2) selective_rollback ;;
    3) static_rollback ;;
    4) config_rollback ;;
    5) emergency_rollback ;;
    6) check_versions ;;
    7) exit 0 ;;
    *) log_error "Invalid option" ;;
  esac
}

# Quick rollback all services
quick_rollback() {
  log_step "Quick Rollback - All Services"
  
  ROLLBACK_TYPE="Quick All Services"
  ROLLBACK_START=$(date +%s)
  ROLLED_BACK_SERVICES=()
  
  # Confirm action
  read -p "This will rollback ALL services. Continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    log_warn "Rollback cancelled"
    return
  fi
  
  # Get current versions
  local api_current=$(get_current_version "api-service")
  local ws_current=$(get_current_version "websocket-service")
  
  # Get target versions
  local api_target=$(get_previous_version "api-service" "$api_current")
  local ws_target=$(get_previous_version "websocket-service" "$ws_current")
  
  log_info "API Service: v$api_current → v$api_target"
  log_info "WebSocket Service: v$ws_current → v$ws_target"
  
  # Perform rollbacks
  rollback_service "api-service" "$api_target"
  ROLLED_BACK_SERVICES+=("api-service")
  
  rollback_service "websocket-service" "$ws_target"
  ROLLED_BACK_SERVICES+=("websocket-service")
  
  # Health check
  if health_check; then
    HEALTH_STATUS="PASSED"
    ROLLBACK_STATUS="SUCCESS"
    log_info "✅ Rollback completed successfully"
  else
    HEALTH_STATUS="FAILED"
    ROLLBACK_STATUS="PARTIAL"
    log_error "⚠️  Rollback completed but health check failed"
  fi
  
  ROLLBACK_END=$(date +%s)
  ROLLBACK_DURATION=$((ROLLBACK_END - ROLLBACK_START))
  
  create_report
}

# Selective service rollback
selective_rollback() {
  log_step "Selective Service Rollback"
  
  echo "Available services:"
  echo "1) api-service"
  echo "2) websocket-service"
  echo "3) lambda-functions"
  read -p "Select service to rollback: " service_choice
  
  case $service_choice in
    1)
      local current=$(get_current_version "api-service")
      local target=$(get_previous_version "api-service" "$current")
      rollback_service "api-service" "$target"
      ;;
    2)
      local current=$(get_current_version "websocket-service")
      local target=$(get_previous_version "websocket-service" "$current")
      rollback_service "websocket-service" "$target"
      ;;
    3)
      rollback_lambda_functions
      ;;
    *)
      log_error "Invalid service selection"
      ;;
  esac
}

# Static assets rollback
static_rollback() {
  log_step "Static Assets Rollback"
  
  # List available backups
  echo "Available static backups:"
  aws s3 ls "s3://${PROJECT_NAME}-backups/static/" --region "$AWS_REGION" | tail -10
  
  read -p "Enter backup tag (YYYYMMDD-HHMMSS): " backup_tag
  
  if [ -n "$backup_tag" ]; then
    rollback_static_assets "$backup_tag"
  else
    log_error "Invalid backup tag"
  fi
}

# Configuration rollback
config_rollback() {
  log_step "Configuration Rollback"
  
  # List recent configuration versions
  echo "Recent configuration versions:"
  aws secretsmanager list-secret-version-ids \
    --secret-id "${PROJECT_NAME}-prod-env" \
    --region "$AWS_REGION" \
    --query 'Versions[0:5].{Version:VersionId,Stage:join(`,`,VersionStages),Created:CreatedDate}' \
    --output table
  
  read -p "Enter version ID to rollback to: " version_id
  
  if [ -n "$version_id" ]; then
    log_info "Rolling back configuration to version: $version_id"
    
    # Update secret version
    aws secretsmanager update-secret-version-stage \
      --secret-id "${PROJECT_NAME}-prod-env" \
      --version-stage AWSCURRENT \
      --move-to-version-id "$version_id" \
      --region "$AWS_REGION"
    
    # Restart services to pick up new config
    log_info "Restarting services with new configuration..."
    aws ecs update-service \
      --cluster "$CLUSTER_NAME" \
      --service "api-service" \
      --force-new-deployment \
      --region "$AWS_REGION"
    
    log_info "Configuration rollback complete"
  fi
}

# Emergency full rollback
emergency_rollback() {
  log_step "🚨 EMERGENCY FULL ROLLBACK 🚨"
  
  echo -e "${RED}WARNING: This will perform a complete system rollback${NC}"
  echo "This includes:"
  echo "- All ECS services"
  echo "- Static assets"
  echo "- Lambda functions"
  echo "- Configuration"
  echo
  read -p "Type 'EMERGENCY' to confirm: " confirm
  
  if [ "$confirm" != "EMERGENCY" ]; then
    log_warn "Emergency rollback cancelled"
    return
  fi
  
  ROLLBACK_START=$(date +%s)
  
  # 1. Enable maintenance mode
  log_info "Enabling maintenance mode..."
  aws s3 cp s3://${PROJECT_NAME}-emergency/maintenance.html \
    s3://${PROJECT_NAME}-prod-static/index.html \
    --cache-control "no-cache" \
    --region "$AWS_REGION"
  
  # 2. Get stable versions from SSM
  local api_stable=$(aws ssm get-parameter \
    --name "/lightningtalk/prod/stable-version" \
    --region "$AWS_REGION" \
    --query 'Parameter.Value' \
    --output text)
  
  # 3. Rollback all services
  log_info "Rolling back all services to stable versions..."
  rollback_service "api-service" "$api_stable"
  rollback_service "websocket-service" "$api_stable"
  
  # 4. Rollback static assets to last known good
  rollback_static_assets "stable"
  
  # 5. Disable maintenance mode
  log_info "Disabling maintenance mode..."
  aws s3 cp s3://${PROJECT_NAME}-prod-static/index.html.backup \
    s3://${PROJECT_NAME}-prod-static/index.html \
    --region "$AWS_REGION"
  
  ROLLBACK_END=$(date +%s)
  ROLLBACK_DURATION=$((ROLLBACK_END - ROLLBACK_START))
  
  log_info "Emergency rollback completed in ${ROLLBACK_DURATION} seconds"
}

# Check current versions
check_versions() {
  log_step "Current Service Versions"
  
  echo "ECS Services:"
  for service in api-service websocket-service; do
    local version=$(get_current_version "$service")
    echo "  $service: v$version"
  done
  
  echo -e "\nLambda Functions:"
  aws lambda list-functions \
    --region "$AWS_REGION" \
    --query "Functions[?starts_with(FunctionName, '${PROJECT_NAME}')].{Name:FunctionName,Version:Version}" \
    --output table
  
  echo -e "\nLast Deployment:"
  aws ssm get-parameter \
    --name "/lightningtalk/prod/last-deployment" \
    --region "$AWS_REGION" \
    --query 'Parameter.Value' \
    --output text 2>/dev/null || echo "No deployment record found"
}

# Lambda functions rollback
rollback_lambda_functions() {
  log_info "Rolling back Lambda functions..."
  
  local functions=$(aws lambda list-functions \
    --region "$AWS_REGION" \
    --query "Functions[?starts_with(FunctionName, '${PROJECT_NAME}')].FunctionName" \
    --output text)
  
  for func in $functions; do
    local current_version=$(aws lambda get-alias \
      --function-name "$func" \
      --name prod \
      --region "$AWS_REGION" \
      --query 'FunctionVersion' \
      --output text 2>/dev/null || echo "")
    
    if [ -n "$current_version" ] && [ "$current_version" != "\$LATEST" ]; then
      local previous_version=$((current_version - 1))
      
      log_info "Rolling back $func from v$current_version to v$previous_version"
      
      aws lambda update-alias \
        --function-name "$func" \
        --name prod \
        --function-version "$previous_version" \
        --region "$AWS_REGION"
    fi
  done
}

# Main execution
main() {
  log_info "Lightning Talk Circle Rollback Utility Started"
  log_info "Logging to: $LOG_FILE"
  
  # Check prerequisites
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found"
    exit 1
  fi
  
  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured"
    exit 1
  fi
  
  # Interactive menu
  while true; do
    show_menu
  done
}

# Handle script arguments
case "${1:-}" in
  --quick)
    quick_rollback
    ;;
  --emergency)
    emergency_rollback
    ;;
  --help)
    echo "Usage: $0 [--quick|--emergency|--help]"
    echo "  --quick     Perform quick rollback of all services"
    echo "  --emergency Perform emergency full system rollback"
    echo "  --help      Show this help message"
    exit 0
    ;;
  *)
    main
    ;;
esac