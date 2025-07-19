#!/bin/bash

set -e

echo "🚀 CloudWatch監視セットアップを開始します..."

# SNSトピックの作成
echo "1. SNSトピックを作成中..."
SNS_TOPIC_ARN=$(aws sns create-topic \
  --name lightningtalk-prod-alerts \
  --region ap-northeast-1 \
  --query 'TopicArn' \
  --output text) || SNS_TOPIC_ARN=$(aws sns list-topics --query "Topics[?contains(TopicArn,'lightningtalk-prod-alerts')].TopicArn" --output text)

echo "   SNSトピック: $SNS_TOPIC_ARN"

# メール通知の設定（手動で確認が必要）
echo "2. メール通知を設定..."
# aws sns subscribe \
#   --topic-arn $SNS_TOPIC_ARN \
#   --protocol email \
#   --notification-endpoint alerts@xn--6wym69a.com

# Lambda関数エラーアラーム
echo "3. Lambda関数アラームを作成中..."

aws cloudwatch put-metric-alarm \
  --alarm-name lightningtalk-prod-lambda-errors \
  --alarm-description "Lambda function error rate" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=lightningtalk-prod-api \
  --alarm-actions $SNS_TOPIC_ARN \
  --region ap-northeast-1

aws cloudwatch put-metric-alarm \
  --alarm-name lightningtalk-prod-lambda-throttles \
  --alarm-description "Lambda function throttles" \
  --metric-name Throttles \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=lightningtalk-prod-api \
  --alarm-actions $SNS_TOPIC_ARN \
  --region ap-northeast-1

aws cloudwatch put-metric-alarm \
  --alarm-name lightningtalk-prod-lambda-duration \
  --alarm-description "Lambda function duration" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 10000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=FunctionName,Value=lightningtalk-prod-api \
  --alarm-actions $SNS_TOPIC_ARN \
  --region ap-northeast-1

# API Gateway アラーム
echo "4. API Gatewayアラームを作成中..."

aws cloudwatch put-metric-alarm \
  --alarm-name lightningtalk-prod-api-4xx \
  --alarm-description "API Gateway 4XX errors" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=ApiName,Value=lightningtalk-prod-api \
  --alarm-actions $SNS_TOPIC_ARN \
  --region ap-northeast-1

aws cloudwatch put-metric-alarm \
  --alarm-name lightningtalk-prod-api-5xx \
  --alarm-description "API Gateway 5XX errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=ApiName,Value=lightningtalk-prod-api \
  --alarm-actions $SNS_TOPIC_ARN \
  --region ap-northeast-1

# DynamoDBアラーム
echo "5. DynamoDBアラームを作成中..."

for table in events participants talks users; do
  aws cloudwatch put-metric-alarm \
    --alarm-name lightningtalk-prod-dynamodb-${table}-throttles \
    --alarm-description "DynamoDB ${table} table throttles" \
    --metric-name UserErrors \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --dimensions Name=TableName,Value=lightningtalk-prod-${table} \
    --alarm-actions $SNS_TOPIC_ARN \
    --region ap-northeast-1
done

# CloudWatchダッシュボード作成
echo "6. CloudWatchダッシュボードを作成中..."

cat > cloudwatch-dashboard.json <<EOF
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
          [ "AWS/Lambda", "Invocations", { "stat": "Sum" }, { "label": "Invocations" } ],
          [ ".", "Errors", { "stat": "Sum" }, { "label": "Errors" } ],
          [ ".", "Throttles", { "stat": "Sum" }, { "label": "Throttles" } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "ap-northeast-1",
        "title": "Lambda Function Metrics",
        "period": 300,
        "dimensions": {
          "FunctionName": "lightningtalk-prod-api"
        }
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
          [ "AWS/Lambda", "Duration", { "stat": "Average" }, { "label": "Average Duration" } ],
          [ "...", { "stat": "Maximum" }, { "label": "Max Duration" } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "ap-northeast-1",
        "title": "Lambda Duration",
        "period": 300,
        "dimensions": {
          "FunctionName": "lightningtalk-prod-api"
        }
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
          [ "AWS/ApiGateway", "Count", { "stat": "Sum" }, { "label": "Total Requests" } ],
          [ ".", "4XXError", { "stat": "Sum" }, { "label": "4XX Errors" } ],
          [ ".", "5XXError", { "stat": "Sum" }, { "label": "5XX Errors" } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "ap-northeast-1",
        "title": "API Gateway Metrics",
        "period": 300,
        "dimensions": {
          "ApiName": "lightningtalk-prod-api"
        }
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", { "stat": "Sum" } ],
          [ ".", "ConsumedWriteCapacityUnits", { "stat": "Sum" } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "ap-northeast-1",
        "title": "DynamoDB Capacity",
        "period": 300
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name lightningtalk-prod-monitoring \
  --dashboard-body file://cloudwatch-dashboard.json \
  --region ap-northeast-1

echo "✅ 監視セットアップが完了しました！"
echo ""
echo "📊 ダッシュボード: https://ap-northeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=lightningtalk-prod-monitoring"
echo "🚨 アラーム: https://ap-northeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#alarmsV2:"
echo ""
echo "⚠️  注意: メール通知を有効にするには、SNSサブスクリプションの確認が必要です"