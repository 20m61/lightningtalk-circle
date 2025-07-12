#!/bin/bash

# Lightning Talk Circle - Traffic Migration Script
# Manages gradual traffic migration between legacy and new systems

set -euo pipefail

# Configuration
PROJECT_NAME="lightningtalk-circle"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-Z1234567890ABC}"
DOMAIN="xn--6wym69a.com"
LEGACY_ALB="${LEGACY_ALB:-legacy-alb.ap-northeast-1.elb.amazonaws.com}"
NEW_ALB="${NEW_ALB:-new-alb.ap-northeast-1.elb.amazonaws.com}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Current phase tracking
PHASE_FILE=".migration-phase"
METRICS_FILE="migration-metrics.json"

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_phase() {
  echo -e "\n${BLUE}=== Phase: $1 ===${NC}\n"
}

# Get current phase
get_current_phase() {
  if [ -f "$PHASE_FILE" ]; then
    cat "$PHASE_FILE"
  else
    echo "0"
  fi
}

# Set current phase
set_current_phase() {
  echo "$1" > "$PHASE_FILE"
  log_info "Phase updated to: $1"
}

# Check system health
check_system_health() {
  local endpoint="$1"
  local system_name="$2"
  
  log_info "Checking health of $system_name system..."
  
  # Health check
  local health_status=$(curl -s -o /dev/null -w "%{http_code}" "https://${endpoint}/health" || echo "000")
  
  if [ "$health_status" = "200" ]; then
    log_info "✓ $system_name system is healthy"
    return 0
  else
    log_error "✗ $system_name system health check failed (HTTP $health_status)"
    return 1
  fi
}

# Collect metrics
collect_metrics() {
  local phase="$1"
  local new_weight="$2"
  
  log_info "Collecting metrics for phase $phase..."
  
  # Initialize metrics
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local error_rate=0
  local response_time=0
  local availability=100
  
  # Get CloudWatch metrics
  if command -v aws &> /dev/null; then
    # Error rate (last 5 minutes)
    error_rate=$(aws cloudwatch get-metric-statistics \
      --namespace AWS/ApplicationELB \
      --metric-name HTTPCode_Target_5XX_Count \
      --start-time $(date -u -d '5 minutes ago' +"%Y-%m-%dT%H:%M:%SZ") \
      --end-time $(date -u +"%Y-%m-%dT%H:%M:%SZ") \
      --period 300 \
      --statistics Sum \
      --dimensions Name=LoadBalancer,Value=${PROJECT_NAME}-prod-alb \
      --region $AWS_REGION \
      --query 'Datapoints[0].Sum' \
      --output text 2>/dev/null || echo "0")
    
    # Response time P95
    response_time=$(aws cloudwatch get-metric-statistics \
      --namespace AWS/ApplicationELB \
      --metric-name TargetResponseTime \
      --start-time $(date -u -d '5 minutes ago' +"%Y-%m-%dT%H:%M:%SZ") \
      --end-time $(date -u +"%Y-%m-%dT%H:%M:%SZ") \
      --period 300 \
      --statistics Maximum \
      --dimensions Name=LoadBalancer,Value=${PROJECT_NAME}-prod-alb \
      --region $AWS_REGION \
      --query 'Datapoints[0].Maximum' \
      --output text 2>/dev/null || echo "0")
  fi
  
  # Store metrics
  cat >> "$METRICS_FILE" << EOF
{
  "timestamp": "$timestamp",
  "phase": $phase,
  "new_system_weight": $new_weight,
  "metrics": {
    "error_rate": $error_rate,
    "response_time_p95": $response_time,
    "availability": $availability
  }
}
EOF
  
  log_info "Metrics collected and stored"
}

# Update Route53 weights
update_route53_weights() {
  local legacy_weight="$1"
  local new_weight="$2"
  
  log_info "Updating Route53 weights: Legacy=$legacy_weight%, New=$new_weight%"
  
  # Create change batch
  cat > route53-change.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${DOMAIN}.",
        "Type": "A",
        "SetIdentifier": "Legacy",
        "Weight": $legacy_weight,
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "${LEGACY_ALB}.",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${DOMAIN}.",
        "Type": "A",
        "SetIdentifier": "New",
        "Weight": $new_weight,
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "${NEW_ALB}.",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF
  
  # Apply changes
  local change_id=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch file://route53-change.json \
    --query 'ChangeInfo.Id' \
    --output text)
  
  log_info "Route53 change initiated: $change_id"
  
  # Wait for propagation
  log_info "Waiting for DNS propagation..."
  aws route53 wait resource-record-sets-changed --id "$change_id"
  
  log_info "DNS changes propagated successfully"
}

# Check migration criteria
check_migration_criteria() {
  local phase="$1"
  
  log_info "Checking migration criteria for phase $phase..."
  
  # Define criteria
  local max_error_rate=0.001  # 0.1%
  local max_response_time=500  # 500ms
  local min_availability=99.9  # 99.9%
  
  # Get latest metrics
  if [ -f "$METRICS_FILE" ]; then
    local latest_metrics=$(tail -n 1 "$METRICS_FILE" 2>/dev/null | jq -r '.metrics' 2>/dev/null || echo "{}")
    
    local error_rate=$(echo "$latest_metrics" | jq -r '.error_rate // 0')
    local response_time=$(echo "$latest_metrics" | jq -r '.response_time_p95 // 0')
    local availability=$(echo "$latest_metrics" | jq -r '.availability // 100')
    
    # Check criteria
    if (( $(echo "$error_rate > $max_error_rate" | bc -l) )); then
      log_error "Error rate ($error_rate) exceeds threshold ($max_error_rate)"
      return 1
    fi
    
    if (( $(echo "$response_time > $max_response_time" | bc -l) )); then
      log_error "Response time ($response_time ms) exceeds threshold ($max_response_time ms)"
      return 1
    fi
    
    if (( $(echo "$availability < $min_availability" | bc -l) )); then
      log_error "Availability ($availability%) below threshold ($min_availability%)"
      return 1
    fi
  fi
  
  log_info "✓ All migration criteria met"
  return 0
}

# Execute phase migration
execute_phase() {
  local phase="$1"
  local new_weight="$2"
  local legacy_weight=$((100 - new_weight))
  local min_duration_hours="$3"
  
  log_phase "Phase $phase: Migrating to $new_weight% new system traffic"
  
  # Pre-flight checks
  if ! check_system_health "$NEW_ALB" "New"; then
    log_error "New system health check failed. Aborting migration."
    return 1
  fi
  
  if ! check_system_health "$LEGACY_ALB" "Legacy"; then
    log_warn "Legacy system health check failed. Proceeding with caution."
  fi
  
  # Update traffic distribution
  update_route53_weights "$legacy_weight" "$new_weight"
  
  # Update phase
  set_current_phase "$phase"
  
  # Initial metrics collection
  sleep 60  # Wait for traffic to stabilize
  collect_metrics "$phase" "$new_weight"
  
  # Monitor phase
  log_info "Phase $phase active. Minimum duration: ${min_duration_hours} hours"
  log_info "Monitoring started. Press Ctrl+C to abort and rollback."
  
  local start_time=$(date +%s)
  local min_duration_seconds=$((min_duration_hours * 3600))
  
  while true; do
    sleep 300  # Check every 5 minutes
    
    # Collect metrics
    collect_metrics "$phase" "$new_weight"
    
    # Check health
    if ! check_migration_criteria "$phase"; then
      log_error "Migration criteria not met. Consider rollback."
      read -p "Rollback? (y/n): " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        rollback
        return 1
      fi
    fi
    
    # Check minimum duration
    local elapsed=$(($(date +%s) - start_time))
    if [ $elapsed -ge $min_duration_seconds ]; then
      log_info "Minimum phase duration reached. Ready to proceed."
      break
    else
      local remaining=$(( (min_duration_seconds - elapsed) / 3600 ))
      log_info "Phase progress: ${elapsed}s elapsed, ~${remaining}h remaining"
    fi
  done
  
  log_info "Phase $phase completed successfully"
  return 0
}

# Rollback function
rollback() {
  log_error "INITIATING ROLLBACK"
  
  # Get previous phase
  local current_phase=$(get_current_phase)
  local previous_phase=$((current_phase - 1))
  
  # Determine weights
  case $previous_phase in
    0) new_weight=0 ;;
    1) new_weight=5 ;;
    2) new_weight=25 ;;
    3) new_weight=50 ;;
    *) new_weight=0 ;;
  esac
  
  local legacy_weight=$((100 - new_weight))
  
  # Execute rollback
  update_route53_weights "$legacy_weight" "$new_weight"
  set_current_phase "$previous_phase"
  
  # Alert
  ./scripts/send-alert.sh "Traffic migration rolled back to phase $previous_phase" "high"
  
  log_warn "Rollback completed. Now at phase $previous_phase ($new_weight% new system)"
}

# Interactive menu
show_menu() {
  local current_phase=$(get_current_phase)
  
  echo -e "\n${BLUE}Lightning Talk Circle - Traffic Migration Control${NC}"
  echo "================================================"
  echo "Current Phase: $current_phase"
  echo
  echo "1) Start/Resume Phase 1 (5% traffic) - 24h minimum"
  echo "2) Advance to Phase 2 (25% traffic) - 48h minimum"
  echo "3) Advance to Phase 3 (50% traffic) - 72h minimum"
  echo "4) Complete migration (100% traffic)"
  echo "5) Check current status"
  echo "6) View metrics"
  echo "7) Rollback to previous phase"
  echo "8) Emergency full rollback"
  echo "9) Exit"
  echo
  read -p "Select option: " choice
  
  case $choice in
    1)
      if [ $current_phase -ge 1 ]; then
        log_warn "Already at or past Phase 1"
      else
        execute_phase 1 5 24
      fi
      ;;
    2)
      if [ $current_phase -ne 1 ]; then
        log_error "Must complete Phase 1 first (current: $current_phase)"
      elif check_migration_criteria 1; then
        execute_phase 2 25 48
      else
        log_error "Phase 1 criteria not met"
      fi
      ;;
    3)
      if [ $current_phase -ne 2 ]; then
        log_error "Must complete Phase 2 first (current: $current_phase)"
      elif check_migration_criteria 2; then
        execute_phase 3 50 72
      else
        log_error "Phase 2 criteria not met"
      fi
      ;;
    4)
      if [ $current_phase -ne 3 ]; then
        log_error "Must complete Phase 3 first (current: $current_phase)"
      elif check_migration_criteria 3; then
        log_phase "FINAL MIGRATION"
        read -p "Confirm full migration to new system? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
          execute_phase 4 100 0
          log_info "🎉 Migration completed! New system serving 100% traffic"
        fi
      else
        log_error "Phase 3 criteria not met"
      fi
      ;;
    5)
      show_status
      ;;
    6)
      view_metrics
      ;;
    7)
      if [ $current_phase -eq 0 ]; then
        log_error "Already at Phase 0"
      else
        rollback
      fi
      ;;
    8)
      log_warn "EMERGENCY ROLLBACK - This will revert all traffic to legacy system"
      read -p "Are you absolutely sure? (type 'ROLLBACK' to confirm): " confirm
      if [ "$confirm" = "ROLLBACK" ]; then
        update_route53_weights 100 0
        set_current_phase 0
        log_error "Emergency rollback completed. All traffic on legacy system."
      fi
      ;;
    9)
      exit 0
      ;;
    *)
      log_error "Invalid option"
      ;;
  esac
}

# Show current status
show_status() {
  log_info "Fetching current migration status..."
  
  local current_phase=$(get_current_phase)
  
  echo -e "\n${BLUE}Current Migration Status${NC}"
  echo "========================"
  echo "Phase: $current_phase"
  
  case $current_phase in
    0) echo "Status: Not started (100% legacy)" ;;
    1) echo "Status: Phase 1 - Canary (5% new, 95% legacy)" ;;
    2) echo "Status: Phase 2 - Early adoption (25% new, 75% legacy)" ;;
    3) echo "Status: Phase 3 - Half migration (50% new, 50% legacy)" ;;
    4) echo "Status: Fully migrated (100% new)" ;;
  esac
  
  # Check current Route53 configuration
  if command -v aws &> /dev/null; then
    echo -e "\n${BLUE}Route53 Configuration:${NC}"
    aws route53 list-resource-record-sets \
      --hosted-zone-id "$HOSTED_ZONE_ID" \
      --query "ResourceRecordSets[?Name=='${DOMAIN}.']" \
      --output table
  fi
  
  # Latest metrics
  if [ -f "$METRICS_FILE" ]; then
    echo -e "\n${BLUE}Latest Metrics:${NC}"
    tail -n 1 "$METRICS_FILE" | jq '.'
  fi
}

# View metrics history
view_metrics() {
  if [ -f "$METRICS_FILE" ]; then
    echo -e "\n${BLUE}Migration Metrics History${NC}"
    echo "========================="
    cat "$METRICS_FILE" | jq -s '.' | jq -r '.[] | "\(.timestamp) - Phase \(.phase): \(.new_system_weight)% new, Error rate: \(.metrics.error_rate), Response time: \(.metrics.response_time_p95)ms"'
  else
    log_warn "No metrics data available"
  fi
}

# Main execution
main() {
  # Check prerequisites
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found. Please install AWS CLI."
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    log_error "jq not found. Please install jq."
    exit 1
  fi
  
  # Interactive mode
  while true; do
    show_menu
    echo
    read -p "Press Enter to continue..."
  done
}

# Handle script arguments
case "${1:-}" in
  status)
    show_status
    ;;
  metrics)
    view_metrics
    ;;
  rollback)
    rollback
    ;;
  *)
    main
    ;;
esac