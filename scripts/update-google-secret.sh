#!/bin/bash

# Script to update Google OAuth Client Secret in AWS Secrets Manager
# This script helps securely store the Google Client Secret without exposing it in code

set -e

echo "🔐 Google OAuth Client Secret 更新スクリプト"
echo "========================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI がインストールされていません"
    echo "インストール方法: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS 認証情報が設定されていません"
    echo "aws configure コマンドで設定してください"
    exit 1
fi

# Function to update secret in AWS Secrets Manager
update_secret() {
    local secret_name=$1
    local secret_value=$2
    local region=${3:-ap-northeast-1}
    
    echo "📝 AWS Secrets Manager を更新中..."
    
    # Check if secret exists
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$region" &> /dev/null; then
        # Update existing secret
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "{\"clientSecret\":\"$secret_value\"}" \
            --region "$region"
        echo "✅ シークレットを更新しました: $secret_name"
    else
        # Create new secret
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "Google OAuth Client Secret for Lightning Talk Circle" \
            --secret-string "{\"clientSecret\":\"$secret_value\"}" \
            --region "$region"
        echo "✅ シークレットを作成しました: $secret_name"
    fi
}

# Main execution
echo "⚠️  警告: このスクリプトはセンシティブな情報を扱います"
echo ""
echo "Google Cloud Console で新しいクライアントシークレットを生成済みですか？"
echo "https://console.cloud.google.com/apis/credentials"
echo ""
read -p "続行しますか？ (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ キャンセルしました"
    exit 1
fi

# Prompt for the new secret (hidden input)
echo ""
echo "新しい Google Client Secret を入力してください (入力は表示されません):"
read -s GOOGLE_CLIENT_SECRET
echo ""

# Validate input
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ シークレットが入力されていません"
    exit 1
fi

# Confirm the action
echo ""
echo "以下の設定で AWS Secrets Manager を更新します:"
echo "  - Secret Name: lightningtalk-google-client-secret"
echo "  - Region: ap-northeast-1"
echo ""
read -p "実行してよろしいですか？ (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ キャンセルしました"
    exit 1
fi

# Update the secret
update_secret "lightningtalk-google-client-secret" "$GOOGLE_CLIENT_SECRET"

echo ""
echo "🎉 完了しました！"
echo ""
echo "📋 次のステップ:"
echo "1. 開発環境でテストする場合は、.env ファイルに以下を追加:"
echo "   GOOGLE_CLIENT_SECRET=<your-secret>"
echo ""
echo "2. 本番環境では AWS Secrets Manager から自動的に取得されます"
echo ""
echo "3. セキュリティのため、このスクリプトの実行履歴をクリアすることを推奨:"
echo "   history -c"
echo ""

# Clear the secret from memory
unset GOOGLE_CLIENT_SECRET