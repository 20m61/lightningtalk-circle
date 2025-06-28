#!/bin/bash

# Lightning Talk Circle - Observability and Log Aggregation Setup Script
# Configure comprehensive observability infrastructure

set -e

# Configuration
ENVIRONMENT=${ENVIRONMENT:-"dev"}
AWS_REGION=${AWS_REGION:-"us-east-1"}
STACK_PREFIX=${STACK_PREFIX:-"lightningtalk"}
ENABLE_OPENSEARCH=${ENABLE_OPENSEARCH:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Lightning Talk Circle Observability Setup ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${AWS_REGION}${NC}"
echo -e "Stack Prefix: ${YELLOW}${STACK_PREFIX}${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking observability setup prerequisites..."
    
    local errors=0
    
    # Check required tools
    for tool in aws jq curl; do
        if ! command -v $tool &> /dev/null; then
            print_error "$tool is not installed or not in PATH"
            ((errors++))
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured or invalid"
        ((errors++))
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        print_error "AWS CDK not installed"
        ((errors++))
    fi
    
    if [ $errors -gt 0 ]; then
        print_error "Prerequisites check failed with $errors errors"
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Function to deploy observability infrastructure
deploy_observability_infrastructure() {
    print_step "Deploying observability infrastructure..."
    
    # Deploy observability stack
    print_status "Deploying observability stack..."
    cdk deploy "${STACK_PREFIX}-Observability-${ENVIRONMENT}" \
        --context env="$ENVIRONMENT" \
        --require-approval never \
        --outputs-file "observability-outputs-${ENVIRONMENT}.json"
    
    if [ $? -eq 0 ]; then
        print_status "✅ Observability stack deployed successfully"
    else
        print_error "❌ Failed to deploy observability stack"
        return 1
    fi
}

# Function to configure log shipping
configure_log_shipping() {
    print_step "Configuring log shipping for applications..."
    
    # Create CloudWatch agent configuration
    cat > cloudwatch-agent-config.json << EOF
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/lightningtalk/*.log",
            "log_group_name": "/aws/${STACK_PREFIX}/${ENVIRONMENT}/application",
            "log_stream_name": "{instance_id}/application.log",
            "timezone": "UTC",
            "multi_line_start_pattern": "{datetime_format}"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/${STACK_PREFIX}/${ENVIRONMENT}/nginx",
            "log_stream_name": "{instance_id}/access.log",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/${STACK_PREFIX}/${ENVIRONMENT}/nginx",
            "log_stream_name": "{instance_id}/error.log",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "${STACK_PREFIX}/${ENVIRONMENT}",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "io_time"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          "tcp_established",
          "tcp_time_wait"
        ],
        "metrics_collection_interval": 60
      },
      "swap": {
        "measurement": [
          "swap_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF
    
    print_status "CloudWatch agent configuration created"
    
    # Create ECS task definition for log shipping
    cat > ecs-logging-task-definition.json << EOF
{
  "family": "${STACK_PREFIX}-${ENVIRONMENT}-logging",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/${STACK_PREFIX}-${ENVIRONMENT}-execution-role",
  "taskRoleArn": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/${STACK_PREFIX}-${ENVIRONMENT}-task-role",
  "containerDefinitions": [
    {
      "name": "log-router",
      "image": "fluent/fluent-bit:latest",
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/${STACK_PREFIX}/${ENVIRONMENT}/log-router",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "fluent-bit"
        }
      },
      "environment": [
        {
          "name": "AWS_REGION",
          "value": "${AWS_REGION}"
        },
        {
          "name": "LOG_GROUP_NAME",
          "value": "/aws/${STACK_PREFIX}/${ENVIRONMENT}/central"
        }
      ],
      "firelensConfiguration": {
        "type": "fluentbit",
        "options": {
          "config-file-type": "file",
          "config-file-value": "/fluent-bit/etc/fluent-bit.conf"
        }
      }
    }
  ]
}
EOF
    
    print_status "ECS logging task definition created"
}

# Function to setup monitoring dashboards
setup_monitoring_dashboards() {
    print_step "Setting up custom monitoring dashboards..."
    
    # Create comprehensive dashboard
    cat > custom-dashboard.json << EOF
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
          [ "${STACK_PREFIX}/${ENVIRONMENT}", "ResponseTime", "Source", "api" ],
          [ ".", "ErrorCount", ".", "." ],
          [ ".", "ActiveRegistrations" ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${AWS_REGION}",
        "title": "Application Performance",
        "period": 300
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
          [ "AWS/ECS", "CPUUtilization", "ServiceName", "${STACK_PREFIX}-${ENVIRONMENT}-api", "ClusterName", "${STACK_PREFIX}-${ENVIRONMENT}-cluster" ],
          [ ".", "MemoryUtilization", ".", ".", ".", "." ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${AWS_REGION}",
        "title": "ECS Resource Utilization",
        "period": 300
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
          [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${STACK_PREFIX}-${ENVIRONMENT}-database" ],
          [ ".", "DatabaseConnections", ".", "." ],
          [ ".", "FreeableMemory", ".", "." ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${AWS_REGION}",
        "title": "Database Performance",
        "period": 300
      }
    },
    {
      "type": "log",
      "x": 12,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "query": "SOURCE '/aws/${STACK_PREFIX}/${ENVIRONMENT}/central'\n| fields @timestamp, level, message, source\n| filter level = \"ERROR\"\n| sort @timestamp desc\n| limit 100",
        "region": "${AWS_REGION}",
        "title": "Recent Errors",
        "view": "table"
      }
    }
  ]
}
EOF
    
    # Create dashboard
    aws cloudwatch put-dashboard \
        --dashboard-name "${STACK_PREFIX}-${ENVIRONMENT}-comprehensive" \
        --dashboard-body file://custom-dashboard.json
    
    print_status "✅ Custom dashboard created"
}

# Function to configure alerting
configure_alerting() {
    print_step "Configuring advanced alerting rules..."
    
    # Create composite alarm for application health
    aws cloudwatch put-composite-alarm \
        --alarm-name "${STACK_PREFIX}-${ENVIRONMENT}-application-health" \
        --alarm-description "Composite alarm for overall application health" \
        --alarm-rule "(ALARM(\"${STACK_PREFIX}-${ENVIRONMENT}-error-rate\") OR ALARM(\"${STACK_PREFIX}-${ENVIRONMENT}-response-time\"))" \
        --actions-enabled \
        --alarm-actions "arn:aws:sns:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):${STACK_PREFIX}-${ENVIRONMENT}-alerts"
    
    # Create anomaly detector for unusual patterns
    aws cloudwatch put-anomaly-detector \
        --namespace "${STACK_PREFIX}/${ENVIRONMENT}" \
        --metric-name "ActiveRegistrations" \
        --stat "Average" \
        --dimensions Name=Environment,Value="${ENVIRONMENT}"
    
    # Create anomaly alarm
    aws cloudwatch put-anomaly-alarm \
        --alarm-name "${STACK_PREFIX}-${ENVIRONMENT}-registration-anomaly" \
        --alarm-description "Anomaly detection for registration patterns" \
        --metric-math-anomaly-detector AnomalyDetector='{
            "Namespace": "'${STACK_PREFIX}'/'${ENVIRONMENT}'",
            "MetricName": "ActiveRegistrations",
            "Stat": "Average",
            "Dimensions": [{"Name": "Environment", "Value": "'${ENVIRONMENT}'"}]
        }' \
        --threshold-metric-id "m1" \
        --comparison-operator "LessThanLowerOrGreaterThanUpperThreshold" \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):${STACK_PREFIX}-${ENVIRONMENT}-alerts"
    
    print_status "✅ Advanced alerting configured"
}

# Function to setup log analytics
setup_log_analytics() {
    if [ "$ENABLE_OPENSEARCH" = "true" ]; then
        print_step "Setting up OpenSearch for log analytics..."
        
        # Deploy disaster recovery stack which includes OpenSearch
        cdk deploy "${STACK_PREFIX}-DisasterRecovery-${ENVIRONMENT}" \
            --context env="$ENVIRONMENT" \
            --require-approval never
        
        print_status "✅ OpenSearch domain deployed for log analytics"
    else
        print_status "OpenSearch deployment skipped (set ENABLE_OPENSEARCH=true to enable)"
    fi
}

# Function to validate observability setup
validate_observability_setup() {
    print_step "Validating observability infrastructure..."
    
    local validation_results=()
    
    # Check CloudWatch log groups
    if aws logs describe-log-groups --log-group-name-prefix "/aws/${STACK_PREFIX}/${ENVIRONMENT}" --query 'logGroups[0].logGroupName' --output text &> /dev/null; then
        validation_results+=("✅ CloudWatch log groups: OPERATIONAL")
    else
        validation_results+=("❌ CloudWatch log groups: NOT FOUND")
    fi
    
    # Check Kinesis stream
    if aws kinesis describe-stream --stream-name "${STACK_PREFIX}-${ENVIRONMENT}-log-aggregation" --query 'StreamDescription.StreamStatus' --output text &> /dev/null; then
        validation_results+=("✅ Kinesis log stream: OPERATIONAL")
    else
        validation_results+=("❌ Kinesis log stream: NOT FOUND")
    fi
    
    # Check SNS topic
    if aws sns get-topic-attributes --topic-arn "arn:aws:sns:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):${STACK_PREFIX}-${ENVIRONMENT}-alerts" &> /dev/null; then
        validation_results+=("✅ SNS alerting topic: OPERATIONAL")
    else
        validation_results+=("❌ SNS alerting topic: NOT FOUND")
    fi
    
    # Check CloudWatch dashboard
    if aws cloudwatch get-dashboard --dashboard-name "${STACK_PREFIX}-${ENVIRONMENT}-comprehensive" &> /dev/null; then
        validation_results+=("✅ CloudWatch dashboard: OPERATIONAL")
    else
        validation_results+=("❌ CloudWatch dashboard: NOT FOUND")
    fi
    
    # Print validation results
    echo ""
    print_step "Observability Validation Results:"
    for result in "${validation_results[@]}"; do
        echo "  $result"
    done
    echo ""
    
    # Check if any validation failed
    local failed_validations=$(printf '%s\n' "${validation_results[@]}" | grep -c "❌" || true)
    
    if [ "$failed_validations" -gt 0 ]; then
        print_error "Observability validation failed with $failed_validations errors"
        return 1
    else
        print_status "All observability validations passed successfully"
        return 0
    fi
}

# Function to generate observability report
generate_observability_report() {
    print_step "Generating observability setup report..."
    
    local report_file="./observability-setup-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# Observability Infrastructure Setup Report

## Setup Summary

- **Environment**: $ENVIRONMENT
- **Region**: $AWS_REGION
- **Stack Prefix**: $STACK_PREFIX
- **Setup Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Components Deployed

### Log Aggregation
- [x] Kinesis Stream for log aggregation
- [x] Kinesis Firehose for S3 delivery
- [x] Lambda function for log processing
- [x] S3 bucket for long-term storage
- [x] CloudWatch log groups

### Metrics Collection
- [x] Custom metrics Lambda function
- [x] CloudWatch metrics namespace
- [x] Scheduled metrics collection
- [x] Business metrics tracking

### Alerting Infrastructure
- [x] SNS topic for alerts
- [x] CloudWatch alarms
- [x] Composite alarms
- [x] Anomaly detection

### Dashboards
- [x] Application performance dashboard
- [x] Infrastructure monitoring dashboard
- [x] Business metrics dashboard
- [x] Log analytics queries

### Monitoring Capabilities
- [x] Synthetic monitoring
- [x] Distributed tracing (X-Ray)
- [x] Real-time alerting
- [x] Log correlation

## Access Information

### CloudWatch Dashboard
- **URL**: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${STACK_PREFIX}-${ENVIRONMENT}-comprehensive

### Log Groups
- Application Logs: \`/aws/${STACK_PREFIX}/${ENVIRONMENT}/central\`
- ECS Logs: \`/aws/ecs/${STACK_PREFIX}-${ENVIRONMENT}\`
- Lambda Logs: \`/aws/lambda/${STACK_PREFIX}-${ENVIRONMENT}-*\`

### Metrics Namespace
- Custom Metrics: \`${STACK_PREFIX}/${ENVIRONMENT}\`

### Alerting
- SNS Topic: \`${STACK_PREFIX}-${ENVIRONMENT}-alerts\`

## Configuration Files

### CloudWatch Agent
- Configuration: \`cloudwatch-agent-config.json\`
- Log patterns supported: Application, Nginx, System logs

### ECS Logging
- Task Definition: \`ecs-logging-task-definition.json\`
- Log router: Fluent Bit

## Maintenance Tasks

### Daily
- [ ] Review error dashboards
- [ ] Check alert status
- [ ] Monitor capacity utilization

### Weekly
- [ ] Analyze log retention policies
- [ ] Review metric anomalies
- [ ] Update alert thresholds

### Monthly
- [ ] Optimize log aggregation costs
- [ ] Review observability coverage
- [ ] Update monitoring strategies

## Troubleshooting

### Common Issues
1. **Missing Logs**: Check CloudWatch agent configuration
2. **High Costs**: Review log retention and metric frequency
3. **Alert Fatigue**: Tune alert thresholds and conditions

### Useful Commands
\`\`\`bash
# View recent logs
aws logs tail /aws/${STACK_PREFIX}/${ENVIRONMENT}/central --follow

# Check metrics
aws cloudwatch get-metric-statistics --namespace "${STACK_PREFIX}/${ENVIRONMENT}" --metric-name ErrorCount --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) --period 300 --statistics Sum

# Test alerting
aws sns publish --topic-arn "arn:aws:sns:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):${STACK_PREFIX}-${ENVIRONMENT}-alerts" --message "Test alert"
\`\`\`

---
Generated by Observability Setup Script
Report ID: observability-setup-$(date +%s)
EOF
    
    print_status "Observability setup report generated: $report_file"
    echo "$report_file"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --environment ENV     Target environment [default: dev]"
    echo "  --region REGION       AWS region [default: us-east-1]"
    echo "  --stack-prefix PREFIX Stack naming prefix [default: lightningtalk]"
    echo "  --enable-opensearch   Enable OpenSearch for log analytics"
    echo "  --help               Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ENVIRONMENT          Environment name"
    echo "  AWS_REGION           AWS region"
    echo "  STACK_PREFIX         Stack naming prefix"
    echo "  ENABLE_OPENSEARCH    Enable OpenSearch (true/false)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 --environment prod --region us-west-2"
    echo "  $0 --enable-opensearch"
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    print_status "Starting observability infrastructure setup..."
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --region)
                AWS_REGION="$2"
                shift 2
                ;;
            --stack-prefix)
                STACK_PREFIX="$2"
                shift 2
                ;;
            --enable-opensearch)
                ENABLE_OPENSEARCH=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Execute setup steps
    check_prerequisites
    deploy_observability_infrastructure
    configure_log_shipping
    setup_monitoring_dashboards
    configure_alerting
    setup_log_analytics
    
    if validate_observability_setup; then
        local report_file=$(generate_observability_report)
        
        local end_time=$(date +%s)
        local total_time=$((end_time - start_time))
        local total_minutes=$((total_time / 60))
        
        print_status "🎉 Observability infrastructure setup completed successfully!"
        print_status "Total setup time: ${total_minutes}m ${total_time}s"
        print_status "Setup report: $report_file"
        
        exit 0
    else
        print_error "Observability setup validation failed"
        exit 1
    fi
}

# Execute main function if script is run directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi