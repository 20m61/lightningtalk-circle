# 本番環境デプロイメントチェックリスト

## 🔍 事前確認事項

### 1. AWS環境設定

- [ ] AWS CLIが設定済み (`aws sts get-caller-identity`で確認)
- [ ] 本番用AWSアカウントIDの確認
- [ ] リージョン設定の確認 (ap-northeast-1)
- [ ] 必要なIAM権限の確認

### 2. ドメイン設定

- [ ] Route53でホストゾーンが設定済み (発表.com / xn--6wym69a.com)
- [ ] SSL証明書がACMで発行済み
- [ ] ドメインのDNS設定準備

### 3. シークレット管理

- [ ] AWS Secrets Managerでの認証情報設定
  - [ ] データベース認証情報
  - [ ] JWT/セッションシークレット
  - [ ] GitHub Token
  - [ ] Google OAuth認証情報
  - [ ] メール設定

### 4. 環境変数設定

```bash
# 本番環境用環境変数
export AWS_ACCOUNT_ID=822063948773
export AWS_REGION=ap-northeast-1
export CDK_DEFAULT_ACCOUNT=822063948773
export CDK_DEFAULT_REGION=ap-northeast-1
export STACK_ENV=prod
```

### 5. コードベース確認

- [x] 最新コードがmainブランチにマージ済み
- [x] テストが通過している（主要サービス）
- [ ] セキュリティスキャン実行
- [ ] 依存関係の脆弱性チェック

## 📋 デプロイメント手順

### Step 1: 本番用設定ファイルの確認

```bash
# 本番用環境設定の確認
cat cdk/config/prod-config.json
```

### Step 2: シークレットの設定

```bash
# データベース認証情報
aws secretsmanager create-secret \
  --name "lightningtalk-prod/database/credentials" \
  --description "Production database credentials" \
  --secret-string '{
    "username": "admin",
    "password": "GENERATE_SECURE_PASSWORD",
    "dbname": "lightningtalk"
  }'

# アプリケーションシークレット
aws secretsmanager create-secret \
  --name "lightningtalk-prod/app/secrets" \
  --description "Production application secrets" \
  --secret-string '{
    "jwt_secret": "GENERATE_JWT_SECRET",
    "session_secret": "GENERATE_SESSION_SECRET",
    "github_token": "YOUR_GITHUB_TOKEN"
  }'

# Google OAuth認証情報
aws secretsmanager create-secret \
  --name "lightningtalk-google-oauth-prod" \
  --description "Google OAuth credentials for production" \
  --secret-string '{
    "client_id": "YOUR_GOOGLE_CLIENT_ID",
    "client_secret": "YOUR_GOOGLE_CLIENT_SECRET"
  }'
```

### Step 3: CDKブートストラップ（初回のみ）

```bash
cd cdk
cdk bootstrap aws://822063948773/ap-northeast-1
```

### Step 4: スタックのデプロイ

```bash
# 1. Cognitoスタック（認証基盤）
cdk deploy LightningTalkCognito-prod --require-approval never

# 2. メインスタック（アプリケーション）
cdk deploy LightningTalkCircle-prod --require-approval never

# 3. WebSocketスタック（リアルタイム機能）
cdk deploy LightningTalkWebSocket-prod --require-approval never

# 4. 監視スタック（オプション）
cdk deploy LightningTalkMonitoring-prod --require-approval never
```

### Step 5: デプロイ後の検証

- [ ] CloudFormationスタックの確認
- [ ] API Gatewayエンドポイントの動作確認
- [ ] CloudFrontディストリビューションの確認
- [ ] DynamoDBテーブルの作成確認
- [ ] Cognito User Poolの設定確認
- [ ] WebSocket APIの接続テスト

## 🔒 セキュリティチェック

- [ ] WAFルールの有効化
- [ ] セキュリティグループの確認
- [ ] IAMロールの最小権限確認
- [ ] シークレットローテーションの設定
- [ ] バックアップ設定の確認
- [ ] 監視アラートの設定

## 📊 パフォーマンスとコスト

- [ ] オートスケーリング設定の確認
- [ ] CloudFrontキャッシュ設定
- [ ] DynamoDBのオンデマンド課金設定
- [ ] 予算アラートの設定（月額上限）
- [ ] コスト配分タグの設定

## 🚀 本番切り替え

- [ ] Route53でDNS切り替え準備
- [ ] 現在のTTL値の確認
- [ ] 切り替えタイミングの決定
- [ ] ロールバック手順の確認

## 📝 ドキュメント更新

- [ ] 本番環境URLの記録
- [ ] API仕様書の更新
- [ ] 運用手順書の作成
- [ ] 障害対応手順の作成

## ⚠️ 注意事項

1. **データベース**: 本番環境では DynamoDB を使用
2. **ドメイン**: 国際化ドメイン名 (xn--6wym69a.com) の適切な設定
3. **認証**: Google OAuth認証情報は Issue #104 で設定予定
4. **コスト**: 予算アラートを必ず設定すること

---

最終更新: 2025-07-18
