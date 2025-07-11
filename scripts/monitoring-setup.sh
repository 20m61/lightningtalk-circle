#!/bin/bash

# Lightning Talk Circle - Monitoring Setup Script
# Sets up comprehensive monitoring for 24/7 operations

set -euo pipefail

# Configuration
PROJECT_NAME="lightningtalk-circle"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
SNS_EMAIL="${SNS_EMAIL:-alerts@example.com}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
PAGERDUTY_KEY="${PAGERDUTY_KEY:-}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

log_step() {
  echo -e "\n${BLUE}==>${NC} $1\n"
}

# Create SNS topics
create_sns_topics() {
  log_step "Creating SNS topics for alerts"
  
  local topics=("critical-alerts" "high-alerts" "medium-alerts" "low-alerts")
  
  for topic in "${topics[@]}"; do
    local topic_name="${PROJECT_NAME}-${topic}"
    
    # Create topic
    local topic_arn=$(aws sns create-topic \
      --name "$topic_name" \
      --region "$AWS_REGION" \
      --query 'TopicArn' \
      --output text 2>/dev/null || \
      aws sns list-topics \
        --region "$AWS_REGION" \
        --query "Topics[?contains(TopicArn, '$topic_name')].TopicArn" \
        --output text)
    
    log_info "Topic ARN for $topic: $topic_arn"
    
    # Subscribe email
    if [ -n "$SNS_EMAIL" ]; then
      aws sns subscribe \
        --topic-arn "$topic_arn" \
        --protocol email \
        --notification-endpoint "$SNS_EMAIL" \
        --region "$AWS_REGION" || true
    fi
    
    # Store ARN
    echo "export ${topic///-/_}_ARN='$topic_arn'" >> monitoring-arns.sh
  done
  
  log_info "SNS topics created successfully"
}

# Create CloudWatch alarms
create_cloudwatch_alarms() {
  log_step "Creating CloudWatch alarms"
  
  # Load ARNs
  source monitoring-arns.sh
  
  # P1 - Critical alarms
  log_info "Creating P1 Critical alarms..."
  
  # Service health check failure
  aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-service-down" \
    --alarm-description "Service health check failing" \
    --metric-name HealthyHostCount \
    --namespace AWS/ApplicationELB \
    --statistic Minimum \
    --period 60 \
    --threshold 1 \
    --comparison-operator LessThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "$critical_alerts_ARN" \
    --dimensions Name=TargetGroup,Value=targetgroup/${PROJECT_NAME}-prod/* \
    --region "$AWS_REGION" || true
  
  # High 5xx error rate
  aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-high-5xx-errors" \
    --alarm-description "5xx error rate exceeds 1%" \
    --metric-name HTTPCode_Target_5XX_Count \
    --namespace AWS/ApplicationELB \
    --statistic Sum \
    --period 60 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 3 \
    --alarm-actions "$critical_alerts_ARN" \
    --treat-missing-data notBreaching \
    --region "$AWS_REGION" || true
  
  # Database errors
  aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-database-errors" \
    --alarm-description "DynamoDB system errors detected" \
    --metric-name SystemErrors \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions "$critical_alerts_ARN" \
    --region "$AWS_REGION" || true
  
  # P2 - High priority alarms
  log_info "Creating P2 High priority alarms..."
  
  # High CPU usage
  aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-high-cpu" \
    --alarm-description "ECS CPU usage exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "$high_alerts_ARN" \
    --dimensions Name=ServiceName,Value=${PROJECT_NAME}-prod-api \
    --region "$AWS_REGION" || true
  
  # High memory usage
  aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-high-memory" \
    --alarm-description "ECS memory usage exceeds 80%" \
    --metric-name MemoryUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "$high_alerts_ARN" \
    --dimensions Name=ServiceName,Value=${PROJECT_NAME}-prod-api \
    --region "$AWS_REGION" || true
  
  # Response time degradation
  aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-slow-response" \
    --alarm-description "Response time exceeds 1 second" \
    --metric-name TargetResponseTime \
    --namespace AWS/ApplicationELB \
    --statistic Average \
    --period 300 \
    --threshold 1.0 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 3 \
    --alarm-actions "$high_alerts_ARN" \
    --region "$AWS_REGION" || true
  
  # P3 - Medium priority alarms
  log_info "Creating P3 Medium priority alarms..."
  
  # Elevated 4xx errors
  aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-elevated-4xx" \
    --alarm-description "4xx error rate elevated" \
    --metric-name HTTPCode_Target_4XX_Count \
    --namespace AWS/ApplicationELB \
    --statistic Sum \
    --period 300 \
    --threshold 50 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "$medium_alerts_ARN" \
    --region "$AWS_REGION" || true
  
  # DynamoDB throttling
  aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-dynamodb-throttle" \
    --alarm-description "DynamoDB requests being throttled" \
    --metric-name ConsumedReadCapacityUnits \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "$medium_alerts_ARN" \
    --dimensions Name=TableName,Value=${PROJECT_NAME}-prod-events \
    --region "$AWS_REGION" || true
  
  log_info "CloudWatch alarms created successfully"
}

# Create custom metrics
create_custom_metrics() {
  log_step "Creating custom metrics configuration"
  
  # Create metric filters for application logs
  log_info "Creating log metric filters..."
  
  # Error count metric
  aws logs put-metric-filter \
    --log-group-name "/aws/ecs/${PROJECT_NAME}-prod" \
    --filter-name "${PROJECT_NAME}-error-count" \
    --filter-pattern '[timestamp, request_id, level=ERROR, ...]' \
    --metric-transformations \
      metricName=ErrorCount,metricNamespace=${PROJECT_NAME}/Application,metricValue=1 \
    --region "$AWS_REGION" || true
  
  # Slow query metric
  aws logs put-metric-filter \
    --log-group-name "/aws/ecs/${PROJECT_NAME}-prod" \
    --filter-name "${PROJECT_NAME}-slow-queries" \
    --filter-pattern '[timestamp, request_id, level, message, duration > 1000]' \
    --metric-transformations \
      metricName=SlowQueries,metricNamespace=${PROJECT_NAME}/Performance,metricValue=1 \
    --region "$AWS_REGION" || true
  
  # Authentication failures
  aws logs put-metric-filter \
    --log-group-name "/aws/ecs/${PROJECT_NAME}-prod" \
    --filter-name "${PROJECT_NAME}-auth-failures" \
    --filter-pattern '"Authentication failed"' \
    --metric-transformations \
      metricName=AuthFailures,metricNamespace=${PROJECT_NAME}/Security,metricValue=1 \
    --region "$AWS_REGION" || true
  
  log_info "Custom metrics created successfully"
}

# Create CloudWatch dashboards
create_dashboards() {
  log_step "Creating CloudWatch dashboards"
  
  # Main operational dashboard
  cat > dashboard-operational.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ApplicationELB", "RequestCount", { "stat": "Sum" } ],
          [ ".", "HTTPCode_Target_2XX_Count", { "stat": "Sum", "color": "#2ca02c" } ],
          [ ".", "HTTPCode_Target_4XX_Count", { "stat": "Sum", "color": "#ff7f0e" } ],
          [ ".", "HTTPCode_Target_5XX_Count", { "stat": "Sum", "color": "#d62728" } ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-northeast-1",
        "title": "Request Distribution"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ApplicationELB", "TargetResponseTime", { "stat": "p50" } ],
          [ "...", { "stat": "p95" } ],
          [ "...", { "stat": "p99" } ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-northeast-1",
        "title": "Response Time Percentiles"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ECS", "CPUUtilization", { "stat": "Average" } ],
          [ ".", "MemoryUtilization", { "stat": "Average" } ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-northeast-1",
        "title": "ECS Resource Utilization"
      }
    },
    {
      "type": "log",
      "x": 12,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "query": "SOURCE '/aws/ecs/lightningtalk-circle-prod'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20",
        "region": "ap-northeast-1",
        "title": "Recent Errors"
      }
    }
  ]
}
EOF
  
  # Create dashboard
  aws cloudwatch put-dashboard \
    --dashboard-name "${PROJECT_NAME}-operational" \
    --dashboard-body file://dashboard-operational.json \
    --region "$AWS_REGION"
  
  log_info "Dashboards created successfully"
}

# Setup log aggregation
setup_log_aggregation() {
  log_step "Setting up log aggregation"
  
  # Create log groups with retention
  local log_groups=(
    "/aws/ecs/${PROJECT_NAME}-prod"
    "/aws/lambda/${PROJECT_NAME}-prod"
    "/aws/api-gateway/${PROJECT_NAME}-prod"
  )
  
  for log_group in "${log_groups[@]}"; do
    # Create log group
    aws logs create-log-group \
      --log-group-name "$log_group" \
      --region "$AWS_REGION" 2>/dev/null || true
    
    # Set retention
    aws logs put-retention-policy \
      --log-group-name "$log_group" \
      --retention-in-days 30 \
      --region "$AWS_REGION"
    
    log_info "Log group configured: $log_group"
  done
  
  # Create log insights queries
  cat > log-insights-queries.json << EOF
[
  {
    "name": "${PROJECT_NAME}-error-analysis",
    "query": "fields @timestamp, @message, error_type, stack_trace\\n| filter level = 'ERROR'\\n| stats count() by error_type"
  },
  {
    "name": "${PROJECT_NAME}-slow-api-calls",
    "query": "fields @timestamp, api_endpoint, duration\\n| filter duration > 1000\\n| sort duration desc\\n| limit 50"
  },
  {
    "name": "${PROJECT_NAME}-user-activity",
    "query": "fields @timestamp, user_id, action\\n| stats count() by user_id, action\\n| sort count desc"
  }
]
EOF
  
  log_info "Log aggregation configured successfully"
}

# Setup synthetic monitoring
setup_synthetic_monitoring() {
  log_step "Setting up synthetic monitoring"
  
  # Create synthetic canary
  cat > canary-script.js << 'EOF'
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanary = async function () {
    const page = await synthetics.getPage();
    
    // Test 1: Homepage load
    await synthetics.executeStep('Homepage', async function () {
        const response = await page.goto('https://xn--6wym69a.com');
        if (response.status() !== 200) {
            throw new Error(`Homepage returned ${response.status()}`);
        }
    });
    
    // Test 2: API health check
    await synthetics.executeStep('API Health', async function () {
        const response = await page.goto('https://api.xn--6wym69a.com/health');
        if (response.status() !== 200) {
            throw new Error(`API health check failed`);
        }
    });
    
    // Test 3: Critical user journey
    await synthetics.executeStep('Event List', async function () {
        const response = await page.goto('https://api.xn--6wym69a.com/api/events');
        const data = await response.json();
        if (!Array.isArray(data.events)) {
            throw new Error('Invalid events response');
        }
    });
};

exports.handler = async () => {
    return await synthetics.executeSchedule(apiCanary);
};
EOF
  
  # Package canary
  zip canary.zip canary-script.js
  
  log_info "Synthetic monitoring scripts created"
}

# Configure alerting integrations
configure_integrations() {
  log_step "Configuring alerting integrations"
  
  # Slack integration via Lambda
  if [ -n "$SLACK_WEBHOOK" ]; then
    cat > slack-notifier.js << EOF
const https = require('https');
const url = require('url');

exports.handler = async (event) => {
    const snsMessage = JSON.parse(event.Records[0].Sns.Message);
    const alarmName = snsMessage.AlarmName;
    const newState = snsMessage.NewStateValue;
    const reason = snsMessage.NewStateReason;
    
    const color = newState === 'ALARM' ? '#d62728' : '#2ca02c';
    const emoji = newState === 'ALARM' ? ':rotating_light:' : ':white_check_mark:';
    
    const slackMessage = {
        attachments: [{
            color: color,
            title: \`\${emoji} \${alarmName}\`,
            text: reason,
            fields: [
                { title: 'State', value: newState, short: true },
                { title: 'Time', value: new Date().toISOString(), short: true }
            ]
        }]
    };
    
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
    };
    
    // Send to Slack
    return fetch('$SLACK_WEBHOOK', options);
};
EOF
    
    log_info "Slack integration configured"
  fi
  
  # PagerDuty integration
  if [ -n "$PAGERDUTY_KEY" ]; then
    log_info "Configuring PagerDuty integration..."
    # PagerDuty configuration would go here
  fi
}

# Generate runbook
generate_runbook() {
  log_step "Generating monitoring runbook"
  
  cat > MONITORING-RUNBOOK.md << 'EOF'
# Lightning Talk Circle - Monitoring Runbook

## Quick Reference

### Critical Alarms Response

#### Service Down
```bash
# 1. Check ECS service status
aws ecs describe-services --cluster lightningtalk-prod --services api-service

# 2. Check target health
aws elbv2 describe-target-health --target-group-arn $TG_ARN

# 3. Force new deployment if needed
aws ecs update-service --cluster lightningtalk-prod --service api-service --force-new-deployment
```

#### High Error Rate
```bash
# 1. Check recent logs
aws logs tail /aws/ecs/lightningtalk-prod --follow --since 5m

# 2. Check for deployment issues
aws ecs describe-task-definition --task-definition lightningtalk-prod-api

# 3. Rollback if necessary
./scripts/rollback-deployment.sh
```

### Monitoring URLs
- CloudWatch: https://ap-northeast-1.console.aws.amazon.com/cloudwatch/
- ECS Console: https://ap-northeast-1.console.aws.amazon.com/ecs/
- Application: https://xn--6wym69a.com
- API Health: https://api.xn--6wym69a.com/health

### Emergency Contacts
- On-call: Check PagerDuty
- Escalation: See 24H-MONITORING-GUIDE.md
EOF
  
  log_info "Runbook generated successfully"
}

# Main setup process
main() {
  log_info "Starting monitoring setup for ${PROJECT_NAME}"
  
  # Check prerequisites
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found"
    exit 1
  fi
  
  # Execute setup steps
  create_sns_topics
  create_cloudwatch_alarms
  create_custom_metrics
  create_dashboards
  setup_log_aggregation
  setup_synthetic_monitoring
  configure_integrations
  generate_runbook
  
  log_info "✅ Monitoring setup completed successfully!"
  log_info "Check monitoring-arns.sh for resource ARNs"
  log_info "Review MONITORING-RUNBOOK.md for operational procedures"
}

# Run main process
main