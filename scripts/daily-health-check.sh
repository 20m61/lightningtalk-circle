#!/bin/bash

# Lightning Talk Circle - Daily Health Check Script
# Performs comprehensive system health checks for daily operations

set -euo pipefail

# Configuration
PROJECT_NAME="lightningtalk-circle"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
HEALTH_REPORT_FILE="health-report-$(date +%Y%m%d).txt"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$HEALTH_REPORT_FILE"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$HEALTH_REPORT_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$HEALTH_REPORT_FILE"
}

log_section() {
  echo -e "\n${BLUE}=== $1 ===${NC}\n" | tee -a "$HEALTH_REPORT_FILE"
}

# Initialize report
initialize_report() {
  cat > "$HEALTH_REPORT_FILE" << EOF
Lightning Talk Circle - Daily Health Check Report
Generated: $(date)
================================================

EOF
}

# Check API health
check_api_health() {
  log_section "API Health Check"
  
  local endpoints=(
    "https://api.xn--6wym69a.com/health"
    "https://api.xn--6wym69a.com/api/events"
    "https://xn--6wym69a.com/"
  )
  
  local all_healthy=true
  
  for endpoint in "${endpoints[@]}"; do
    local start_time=$(date +%s%N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" || echo "000")
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$http_code" = "200" ]; then
      log_info "✓ $endpoint - OK (${response_time}ms)"
    else
      log_error "✗ $endpoint - HTTP $http_code"
      all_healthy=false
    fi
  done
  
  if [ "$all_healthy" = true ]; then
    echo "Overall API Status: HEALTHY" >> "$HEALTH_REPORT_FILE"
  else
    echo "Overall API Status: DEGRADED" >> "$HEALTH_REPORT_FILE"
  fi
}

# Check ECS services
check_ecs_services() {
  log_section "ECS Services Check"
  
  local services=(
    "${PROJECT_NAME}-prod-api"
    "${PROJECT_NAME}-prod-websocket"
  )
  
  for service in "${services[@]}"; do
    local service_info=$(aws ecs describe-services \
      --cluster "${PROJECT_NAME}-prod" \
      --services "$service" \
      --region "$AWS_REGION" \
      --query 'services[0].{name:serviceName,desired:desiredCount,running:runningCount,pending:pendingCount}' \
      --output json 2>/dev/null || echo "{}")
    
    if [ "$service_info" != "{}" ]; then
      local desired=$(echo "$service_info" | jq -r '.desired')
      local running=$(echo "$service_info" | jq -r '.running')
      local pending=$(echo "$service_info" | jq -r '.pending')
      
      if [ "$running" = "$desired" ] && [ "$pending" = "0" ]; then
        log_info "✓ $service - Running: $running/$desired"
      else
        log_warn "⚠ $service - Running: $running/$desired, Pending: $pending"
      fi
    else
      log_error "✗ Failed to get info for service: $service"
    fi
  done
}

# Check DynamoDB tables
check_dynamodb_tables() {
  log_section "DynamoDB Tables Check"
  
  local tables=(
    "${PROJECT_NAME}-prod-events"
    "${PROJECT_NAME}-prod-participants"
    "${PROJECT_NAME}-prod-users"
    "${PROJECT_NAME}-prod-talks"
  )
  
  for table in "${tables[@]}"; do
    local table_status=$(aws dynamodb describe-table \
      --table-name "$table" \
      --region "$AWS_REGION" \
      --query 'Table.TableStatus' \
      --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$table_status" = "ACTIVE" ]; then
      # Check for throttling
      local throttle_count=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/DynamoDB \
        --metric-name UserErrors \
        --dimensions Name=TableName,Value="$table" \
        --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 86400 \
        --statistics Sum \
        --region "$AWS_REGION" \
        --query 'Datapoints[0].Sum' \
        --output text 2>/dev/null || echo "0")
      
      if [ "$throttle_count" = "None" ] || [ "$throttle_count" = "0" ]; then
        log_info "✓ $table - ACTIVE (No throttling)"
      else
        log_warn "⚠ $table - ACTIVE (Throttled: $throttle_count times)"
      fi
    else
      log_error "✗ $table - Status: $table_status"
    fi
  done
}

# Check CloudWatch alarms
check_cloudwatch_alarms() {
  log_section "CloudWatch Alarms Check"
  
  local alarms=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "${PROJECT_NAME}-" \
    --state-value ALARM \
    --region "$AWS_REGION" \
    --query 'MetricAlarms[].{name:AlarmName,state:StateValue,reason:StateReason}' \
    --output json)
  
  local alarm_count=$(echo "$alarms" | jq '. | length')
  
  if [ "$alarm_count" = "0" ]; then
    log_info "✓ No active alarms"
  else
    log_warn "⚠ $alarm_count active alarm(s):"
    echo "$alarms" | jq -r '.[] | "  - \(.name): \(.reason)"' | tee -a "$HEALTH_REPORT_FILE"
  fi
}

# Check backup status
check_backup_status() {
  log_section "Backup Status Check"
  
  # Check DynamoDB backups
  local yesterday=$(date -d 'yesterday' +%Y-%m-%d)
  local tables=("events" "participants" "users" "talks")
  
  for table in "${tables[@]}"; do
    local full_table_name="${PROJECT_NAME}-prod-${table}"
    local backups=$(aws dynamodb list-backups \
      --table-name "$full_table_name" \
      --time-range-lower-bound $(date -d "$yesterday 00:00:00" +%s) \
      --time-range-upper-bound $(date +%s) \
      --region "$AWS_REGION" \
      --query 'BackupSummaries | length(@)' \
      --output text 2>/dev/null || echo "0")
    
    if [ "$backups" -gt "0" ]; then
      log_info "✓ $table - $backups backup(s) in last 24h"
    else
      log_error "✗ $table - No recent backups found"
    fi
  done
}

# Check SSL certificates
check_ssl_certificates() {
  log_section "SSL Certificate Check"
  
  local domains=("xn--6wym69a.com" "api.xn--6wym69a.com")
  
  for domain in "${domains[@]}"; do
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ -n "$cert_info" ]; then
      local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
      local expiry_epoch=$(date -d "$expiry_date" +%s)
      local current_epoch=$(date +%s)
      local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
      
      if [ "$days_until_expiry" -gt 30 ]; then
        log_info "✓ $domain - Certificate valid for $days_until_expiry days"
      elif [ "$days_until_expiry" -gt 7 ]; then
        log_warn "⚠ $domain - Certificate expires in $days_until_expiry days"
      else
        log_error "✗ $domain - Certificate expires in $days_until_expiry days!"
      fi
    else
      log_error "✗ Failed to check certificate for $domain"
    fi
  done
}

# Check system metrics
check_system_metrics() {
  log_section "System Metrics (Last 24 Hours)"
  
  # Error rate
  local error_count=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/ApplicationELB \
    --metric-name HTTPCode_Target_5XX_Count \
    --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Sum \
    --region "$AWS_REGION" \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")
  
  local request_count=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/ApplicationELB \
    --metric-name RequestCount \
    --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Sum \
    --region "$AWS_REGION" \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")
  
  if [ "$request_count" != "None" ] && [ "$request_count" != "0" ]; then
    local error_rate=$(awk "BEGIN {printf \"%.2f\", ($error_count / $request_count) * 100}")
    log_info "Total Requests: $request_count"
    log_info "5XX Errors: $error_count ($error_rate%)"
  else
    log_info "No request data available"
  fi
  
  # Average response time
  local avg_response=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/ApplicationELB \
    --metric-name TargetResponseTime \
    --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Average \
    --region "$AWS_REGION" \
    --query 'Datapoints[0].Average' \
    --output text 2>/dev/null || echo "0")
  
  if [ "$avg_response" != "None" ]; then
    log_info "Average Response Time: ${avg_response}ms"
  fi
}

# Check cost alerts
check_cost_alerts() {
  log_section "Cost Analysis"
  
  # Get yesterday's estimated cost
  local yesterday_cost=$(aws ce get-cost-and-usage \
    --time-period Start=$(date -d 'yesterday' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
    --metrics "UnblendedCost" \
    --granularity DAILY \
    --region us-east-1 \
    --query 'ResultsByTime[0].Total.UnblendedCost.Amount' \
    --output text 2>/dev/null || echo "0")
  
  if [ "$yesterday_cost" != "0" ]; then
    log_info "Yesterday's cost: \$${yesterday_cost}"
    
    # Check if cost is unusually high
    local cost_int=$(echo "$yesterday_cost" | cut -d. -f1)
    if [ "$cost_int" -gt 100 ]; then
      log_warn "⚠ Daily cost exceeds \$100 threshold"
    fi
  fi
}

# Generate summary
generate_summary() {
  log_section "Health Check Summary"
  
  local errors=$(grep -c "ERROR" "$HEALTH_REPORT_FILE" || true)
  local warnings=$(grep -c "WARN" "$HEALTH_REPORT_FILE" || true)
  
  echo "Errors: $errors" >> "$HEALTH_REPORT_FILE"
  echo "Warnings: $warnings" >> "$HEALTH_REPORT_FILE"
  
  if [ "$errors" -eq 0 ] && [ "$warnings" -eq 0 ]; then
    echo "Overall Status: ✅ HEALTHY" >> "$HEALTH_REPORT_FILE"
    local status_emoji="✅"
    local status_text="All systems operational"
  elif [ "$errors" -eq 0 ]; then
    echo "Overall Status: ⚠️ WARNING" >> "$HEALTH_REPORT_FILE"
    local status_emoji="⚠️"
    local status_text="Minor issues detected"
  else
    echo "Overall Status: ❌ CRITICAL" >> "$HEALTH_REPORT_FILE"
    local status_emoji="❌"
    local status_text="Critical issues require attention"
  fi
  
  # Send Slack notification if webhook is configured
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \"Daily Health Check Complete\",
        \"attachments\": [{
          \"color\": \"$([ $errors -eq 0 ] && echo "good" || echo "danger")\",
          \"fields\": [
            {\"title\": \"Status\", \"value\": \"$status_emoji $status_text\", \"short\": false},
            {\"title\": \"Errors\", \"value\": \"$errors\", \"short\": true},
            {\"title\": \"Warnings\", \"value\": \"$warnings\", \"short\": true}
          ],
          \"footer\": \"Lightning Talk Circle\",
          \"ts\": $(date +%s)
        }]
      }" 2>/dev/null || true
  fi
}

# Main execution
main() {
  echo "Starting Daily Health Check for ${PROJECT_NAME}..."
  
  # Initialize report
  initialize_report
  
  # Run all checks
  check_api_health
  check_ecs_services
  check_dynamodb_tables
  check_cloudwatch_alarms
  check_backup_status
  check_ssl_certificates
  check_system_metrics
  check_cost_alerts
  
  # Generate summary
  generate_summary
  
  echo -e "\n✅ Health check complete. Report saved to: $HEALTH_REPORT_FILE"
}

# Run main process
main