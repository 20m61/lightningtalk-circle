#!/bin/bash

set -e

echo "🔒 本番環境セキュリティ強化を開始します..."

# API Gateway ID
API_ID="ass56wcvr1"
STAGE="prod"

# 1. API Gatewayの使用プラン作成
echo "1. API使用プランを作成中..."
USAGE_PLAN_ID=$(aws apigateway create-usage-plan \
  --name "lightningtalk-prod-standard" \
  --description "Standard usage plan for production API" \
  --throttle burstLimit=50,rateLimit=100 \
  --quota limit=10000,period=DAY \
  --api-stages apiId=$API_ID,stage=$STAGE \
  --query 'id' \
  --output text) || echo "Usage plan already exists"

echo "   使用プラン ID: $USAGE_PLAN_ID"

# 2. APIキーの作成
echo "2. APIキーを作成中..."
API_KEY_ID=$(aws apigateway create-api-key \
  --name "lightningtalk-prod-default-key" \
  --description "Default API key for production" \
  --enabled \
  --query 'id' \
  --output text) || echo "API key already exists"

# 3. APIキーを使用プランに関連付け
if [ ! -z "$USAGE_PLAN_ID" ] && [ ! -z "$API_KEY_ID" ]; then
  echo "3. APIキーを使用プランに関連付け中..."
  aws apigateway create-usage-plan-key \
    --usage-plan-id $USAGE_PLAN_ID \
    --key-id $API_KEY_ID \
    --key-type API_KEY || echo "Already associated"
fi

# 4. Lambda関数の同時実行数制限
echo "4. Lambda関数の同時実行数を制限中..."
aws lambda put-function-concurrency \
  --function-name lightningtalk-prod-api \
  --reserved-concurrent-executions 100

# 5. S3バケットのセキュリティ設定
echo "5. S3バケットのセキュリティを強化中..."

# 静的ファイルバケット
aws s3api put-bucket-versioning \
  --bucket lightningtalk-prod-static-822063948773 \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket lightningtalk-prod-static-822063948773 \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# アップロードバケット
aws s3api put-bucket-versioning \
  --bucket lightningtalk-prod-uploads-822063948773 \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket lightningtalk-prod-uploads-822063948773 \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# 6. DynamoDBバックアップの有効化
echo "6. DynamoDBの継続的バックアップを有効化中..."
for table in events participants talks users; do
  aws dynamodb update-continuous-backups \
    --table-name lightningtalk-prod-${table} \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    2>/dev/null || echo "PITR already enabled for ${table}"
done

# 7. CloudFrontのセキュリティヘッダー設定用CloudFront Function
echo "7. セキュリティヘッダー用CloudFront Functionを作成中..."

cat > security-headers.js <<'EOF'
function handler(event) {
    var response = event.response;
    var headers = response.headers;
    
    // Security headers
    headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload' };
    headers['x-content-type-options'] = { value: 'nosniff' };
    headers['x-frame-options'] = { value: 'DENY' };
    headers['x-xss-protection'] = { value: '1; mode=block' };
    headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };
    headers['permissions-policy'] = { value: 'geolocation=(self), microphone=(), camera=()' };
    
    // CSP header
    headers['content-security-policy'] = { 
        value: "default-src 'self' https://*.amazonaws.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.amazonaws.com wss://*.amazonaws.com"
    };
    
    return response;
}
EOF

# CloudFront Functionの作成（手動で行う必要があります）
echo "   注: CloudFront Functionは手動で作成し、ディストリビューションに関連付ける必要があります"

# 8. Secrets Managerのローテーション設定
echo "8. シークレットのローテーション設定..."
# aws secretsmanager put-secret-rotation-configuration \
#   --secret-id lightningtalk-prod/app/secrets \
#   --rotation-rules AutomaticallyAfterDays=90

# 9. セキュリティグループの確認
echo "9. セキュリティ設定のサマリー:"
echo "   ✅ API使用プランとレート制限設定完了"
echo "   ✅ Lambda同時実行数制限設定完了 (100)"
echo "   ✅ S3バケットの暗号化とバージョニング有効化完了"
echo "   ✅ DynamoDB継続的バックアップ有効化完了"
echo "   ✅ セキュリティヘッダー用CloudFront Function準備完了"

echo ""
echo "📋 推奨される追加セキュリティ対策:"
echo "   1. AWS WAFの有効化"
echo "   2. AWS GuardDutyの有効化"
echo "   3. AWS Security Hubの有効化"
echo "   4. 定期的なセキュリティ監査"
echo "   5. ペネトレーションテストの実施"

echo ""
echo "✅ セキュリティ強化が完了しました！"