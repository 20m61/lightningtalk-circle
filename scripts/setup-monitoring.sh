#!/bin/bash

# Monitoring Setup Script for Lightning Talk Circle
# Usage: ./setup-monitoring.sh [environment]
# Optional: ALERT_EMAIL=admin@example.com ALERT_PHONE=+1234567890 ./setup-monitoring.sh prod

set -e

# Parameters
ENVIRONMENT=${1:-dev}
ALERT_EMAIL=${ALERT_EMAIL:-""}
ALERT_PHONE=${ALERT_PHONE:-""}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Invalid environment. Must be dev, staging, or prod."
    exit 1
fi

echo "📊 Setting up monitoring for Lightning Talk Circle"
echo "Environment: ${ENVIRONMENT}"

# Configure SNS topic subscriptions if provided
if [ -n "${ALERT_EMAIL}" ] || [ -n "${ALERT_PHONE}" ]; then
    echo "🔔 Configuring alert subscriptions..."
    
    # Get SNS topic ARN
    TOPIC_ARN=$(aws sns list-topics --query "Topics[?contains(TopicArn, 'lightningtalk-alerts-${ENVIRONMENT}')].TopicArn" --output text)
    
    if [ -z "${TOPIC_ARN}" ]; then
        echo "❌ Alert topic not found. Please deploy the monitoring stack first."
        exit 1
    fi
    
    # Subscribe email if provided
    if [ -n "${ALERT_EMAIL}" ]; then
        echo "📧 Adding email subscription: ${ALERT_EMAIL}"
        aws sns subscribe \
            --topic-arn ${TOPIC_ARN} \
            --protocol email \
            --notification-endpoint ${ALERT_EMAIL}
        echo "✅ Email subscription added. Please check your email to confirm."
    fi
    
    # Subscribe SMS if provided
    if [ -n "${ALERT_PHONE}" ]; then
        echo "📱 Adding SMS subscription: ${ALERT_PHONE}"
        aws sns subscribe \
            --topic-arn ${TOPIC_ARN} \
            --protocol sms \
            --notification-endpoint ${ALERT_PHONE}
        echo "✅ SMS subscription added."
    fi
fi

# Create CloudWatch Log Insights queries
echo "🔍 Creating Log Insights queries..."

# Error analysis query
aws logs put-query-definition \
    --name "LightningTalk-${ENVIRONMENT}-Errors" \
    --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 100' \
    --log-group-names "/aws/ecs/lightningtalk-circle-api"

# Performance analysis query
aws logs put-query-definition \
    --name "LightningTalk-${ENVIRONMENT}-SlowRequests" \
    --query-string 'fields @timestamp, duration, path | filter duration > 1000 | sort duration desc | limit 50' \
    --log-group-names "/aws/ecs/lightningtalk-circle-api"

# Database connection tracking
aws logs put-query-definition \
    --name "LightningTalk-${ENVIRONMENT}-DBConnections" \
    --query-string 'fields @timestamp, @message | filter @message like /database.*connect/ | stats count() by bin(5m)' \
    --log-group-names "/aws/ecs/lightningtalk-circle-api"

# API usage statistics
aws logs put-query-definition \
    --name "LightningTalk-${ENVIRONMENT}-APIUsage" \
    --query-string 'fields @timestamp, method, path, statusCode | stats count() by method, path, statusCode' \
    --log-group-names "/aws/ecs/lightningtalk-circle-api"

echo "✅ Log Insights queries created"

# Configure CloudWatch Anomaly Detector (production only)
if [ "${ENVIRONMENT}" == "prod" ]; then
    echo "🤖 Setting up anomaly detection..."
    
    # Create anomaly detector for API response time
    aws cloudwatch put-anomaly-detector \
        --namespace "AWS/ApplicationELB" \
        --metric-name "TargetResponseTime" \
        --stat "Average"
    
    echo "✅ Anomaly detection configured"
fi

# Create custom dashboard JSON
echo "📊 Creating enhanced dashboard..."

DASHBOARD_BODY=$(cat <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "RequestCount", { "stat": "Sum", "period": 300 } ],
                    [ ".", "TargetResponseTime", { "stat": "Average", "period": 300 } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "ap-northeast-1",
                "title": "API Performance Overview"
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", { "stat": "Sum" } ],
                    [ ".", "HTTPCode_Target_4XX_Count", { "stat": "Sum" } ],
                    [ ".", "HTTPCode_Target_5XX_Count", { "stat": "Sum" } ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "ap-northeast-1",
                "title": "HTTP Response Codes"
            }
        },
        {
            "type": "log",
            "properties": {
                "query": "SOURCE '/aws/ecs/lightningtalk-circle-api' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20",
                "region": "ap-northeast-1",
                "title": "Recent Errors"
            }
        }
    ]
}
EOF
)

aws cloudwatch put-dashboard \
    --dashboard-name "LightningTalk-${ENVIRONMENT}-Enhanced" \
    --dashboard-body "${DASHBOARD_BODY}"

echo "✅ Enhanced dashboard created"

# Display monitoring URLs
echo ""
echo "📌 Monitoring Resources:"
echo "Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=lightningtalk-${ENVIRONMENT}-dashboard"
echo "Enhanced Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=LightningTalk-${ENVIRONMENT}-Enhanced"
echo "Logs: https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#logsV2:log-groups/log-group/%252Faws%252Fecs%252Flightningtalk-circle-api"
echo "Alarms: https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#alarmsV2:"

echo ""
echo "✅ Monitoring setup completed successfully!"