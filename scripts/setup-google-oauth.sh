#!/bin/bash

# Google OAuth Setup Script for Lightning Talk Circle
# このスクリプトは、Google Cloud Consoleでの設定完了後に実行します

set -e

echo "🚀 Google OAuth セットアップスクリプト"
echo "======================================"

# 必要な変数の確認
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ エラー: 環境変数が設定されていません"
    echo "以下の環境変数を設定してください:"
    echo "export GOOGLE_CLIENT_ID='your-google-client-id.apps.googleusercontent.com'"
    echo "export GOOGLE_CLIENT_SECRET='your-google-client-secret'"
    exit 1
fi

# Cognito設定
USER_POOL_ID="ap-northeast-1_IG3yOKBmT"
CLIENT_ID="42u3ma63qf01utk4jcd6pn9l8s"
REGION="ap-northeast-1"
COGNITO_DOMAIN="lightningtalk-secure-1738054592.auth.ap-northeast-1.amazoncognito.com"

echo "✅ 使用する設定:"
echo "   User Pool ID: $USER_POOL_ID"
echo "   Client ID: $CLIENT_ID"
echo "   Region: $REGION"
echo ""

# Step 1: AWS Secrets Manager にGoogle認証情報を保存
echo "📋 Step 1: Google認証情報をAWS Secrets Managerに保存..."

SECRET_VALUE=$(cat <<EOF
{
  "client_id": "$GOOGLE_CLIENT_ID",
  "client_secret": "$GOOGLE_CLIENT_SECRET"
}
EOF
)

# 既存のシークレットを確認
if aws secretsmanager describe-secret --secret-id "lightningtalk-google-oauth-credentials" --region $REGION &>/dev/null; then
    echo "   既存のシークレットを更新します..."
    aws secretsmanager update-secret \
        --secret-id "lightningtalk-google-oauth-credentials" \
        --secret-string "$SECRET_VALUE" \
        --region $REGION
else
    echo "   新しいシークレットを作成します..."
    aws secretsmanager create-secret \
        --name "lightningtalk-google-oauth-credentials" \
        --description "Google OAuth credentials for Lightning Talk Circle" \
        --secret-string "$SECRET_VALUE" \
        --region $REGION
fi

echo "✅ Step 1 完了: シークレットが保存されました"

# Step 2: Cognitoアイデンティティプロバイダーを作成
echo ""
echo "📋 Step 2: CognitoにGoogleアイデンティティプロバイダーを設定..."

# 既存のプロバイダーを確認
if aws cognito-idp describe-identity-provider \
    --user-pool-id $USER_POOL_ID \
    --provider-name Google \
    --region $REGION &>/dev/null; then
    
    echo "   既存のGoogleプロバイダーを更新します..."
    aws cognito-idp update-identity-provider \
        --user-pool-id $USER_POOL_ID \
        --provider-name Google \
        --provider-details "{
            \"client_id\": \"$GOOGLE_CLIENT_ID\",
            \"client_secret\": \"$GOOGLE_CLIENT_SECRET\",
            \"authorize_scopes\": \"email openid profile\"
        }" \
        --attribute-mapping "{
            \"email\": \"email\",
            \"family_name\": \"family_name\",
            \"given_name\": \"given_name\",
            \"name\": \"name\",
            \"picture\": \"picture\",
            \"username\": \"sub\"
        }" \
        --region $REGION
else
    echo "   新しいGoogleプロバイダーを作成します..."
    aws cognito-idp create-identity-provider \
        --user-pool-id $USER_POOL_ID \
        --provider-name Google \
        --provider-type Google \
        --provider-details "{
            \"client_id\": \"$GOOGLE_CLIENT_ID\",
            \"client_secret\": \"$GOOGLE_CLIENT_SECRET\",
            \"authorize_scopes\": \"email openid profile\"
        }" \
        --attribute-mapping "{
            \"email\": \"email\",
            \"family_name\": \"family_name\",
            \"given_name\": \"given_name\",
            \"name\": \"name\",
            \"picture\": \"picture\",
            \"username\": \"sub\"
        }" \
        --region $REGION
fi

echo "✅ Step 2 完了: Googleアイデンティティプロバイダーが設定されました"

# Step 3: User Pool Clientを更新
echo ""
echo "📋 Step 3: User Pool ClientにGoogleプロバイダーを追加..."

aws cognito-idp update-user-pool-client \
    --user-pool-id $USER_POOL_ID \
    --client-id $CLIENT_ID \
    --supported-identity-providers COGNITO Google \
    --callback-urls "https://xn--6wym69a.com/callback" "http://localhost:3000/callback" \
    --logout-urls "https://xn--6wym69a.com" "http://localhost:3000" \
    --allowed-o-auth-flows code \
    --allowed-o-auth-scopes email openid profile \
    --allowed-o-auth-flows-user-pool-client \
    --region $REGION

echo "✅ Step 3 完了: User Pool Clientが更新されました"

# Step 4: 設定の確認
echo ""
echo "📋 Step 4: 設定の確認..."

echo "   Googleプロバイダーの確認:"
aws cognito-idp describe-identity-provider \
    --user-pool-id $USER_POOL_ID \
    --provider-name Google \
    --region $REGION \
    --query 'IdentityProvider.{ProviderName:ProviderName,ProviderType:ProviderType}' \
    --output table

echo ""
echo "   User Pool Clientの確認:"
aws cognito-idp describe-user-pool-client \
    --user-pool-id $USER_POOL_ID \
    --client-id $CLIENT_ID \
    --region $REGION \
    --query 'UserPoolClient.{ClientName:ClientName,SupportedIdentityProviders:SupportedIdentityProviders}' \
    --output table

# Step 5: テストURL生成
echo ""
echo "📋 Step 5: テストURL..."

AUTH_URL="https://$COGNITO_DOMAIN/login?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:3000/callback"

echo "認証テストURL:"
echo "$AUTH_URL"
echo ""

echo "🎉 セットアップ完了！"
echo ""
echo "次のステップ:"
echo "1. 開発サーバーを起動: npm run dev"
echo "2. テストページにアクセス: http://localhost:8000/test-login.html"
echo "3. 上記の認証URLでGoogle OAuth をテスト"
echo ""
echo "本番環境での認証URL:"
echo "https://$COGNITO_DOMAIN/login?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=https://xn--6wym69a.com/callback"