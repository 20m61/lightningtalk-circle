# Lightning Talk Circle - Deployment Guide v2

このガイドでは、Lightning Talk CircleのAWS環境へのデプロイ手順を説明します。
RDSからDynamoDBへの移行後の最新手順です。

## 📋 前提条件

- AWS CLIがインストール済み
- AWS CDKがインストール済み（`npm install -g aws-cdk`）
- Node.js 18.x以上
- 適切なAWS権限を持つIAMユーザー

## 🔐 Step 1: 環境変数の設定

### 1.1 シークレットの生成

```bash
# シークレット生成スクリプトを実行
node scripts/generate-secrets.js
```

生成された値を`.env`ファイルに設定：

```env
JWT_SECRET=<生成された値>
SESSION_SECRET=<生成された値>
```

### 1.2 その他の環境変数

`.env.example`を参考に、以下の値を設定：

```env
# 必須設定
NODE_ENV=production
PORT=3000

# GitHub Integration（Issue管理を使用する場合）
GITHUB_TOKEN=<your-github-token>
GITHUB_OWNER=<your-github-username>
GITHUB_REPO=<your-repo-name>

# Email設定（任意）
EMAIL_ENABLED=true
EMAIL_SERVICE=aws-ses
AWS_SES_REGION=us-east-1

# CORS設定（本番環境）
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## 🏗️ Step 2: CDKインフラストラクチャのデプロイ

### 2.1 CDKブートストラップ（初回のみ）

```bash
cd cdk
npm install
npx cdk bootstrap
```

### 2.2 設定ファイルの更新

必要に応じて`cdk/lib/config/`内の設定を更新：

```javascript
// cdk/lib/config/app-config.js
module.exports = {
  app: {
    name: 'lightningtalk-circle',
    stage: 'prod',
    environment: 'production'
  }
  // ... その他の設定
};
```

### 2.3 CDKデプロイ

```bash
# 変更内容を確認
npx cdk diff

# デプロイ実行
npx cdk deploy --all
```

デプロイされるスタック：
- `LightningTalk-Database-Prod` - VPC、DynamoDBテーブル
- `LightningTalk-Api-Prod` - ECS、ALB、ECR
- `LightningTalk-StaticSite-Prod` - CloudFront、S3
- `LightningTalk-Monitoring-Prod` - CloudWatch、アラーム
- `LightningTalk-WAF-Prod` - WAFルール（オプション）

## 🐳 Step 3: Dockerイメージのビルドとプッシュ

### 3.1 ECRへのログイン

```bash
# ECR URLを取得（CDKデプロイ後に表示される）
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
```

### 3.2 Dockerイメージのビルド

```bash
# プロジェクトルートで実行
docker build -t lightningtalk-circle-api .
```

### 3.3 ECRへプッシュ

```bash
# タグ付け
docker tag lightningtalk-circle-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/lightningtalk-circle-api:latest

# プッシュ
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/lightningtalk-circle-api:latest
```

## 📊 Step 4: DynamoDBの初期設定

DynamoDBテーブルは自動的に作成されます：
- `lightningtalk-circle-prod-events` - イベント情報
- `lightningtalk-circle-prod-participants` - 参加者情報
- `lightningtalk-circle-prod-users` - ユーザー情報
- `lightningtalk-circle-prod-talks` - トーク情報

初期データが必要な場合は、AWS CLIまたはコンソールから追加できます。

## 🌐 Step 5: 静的ファイルのデプロイ

```bash
# S3バケット名を取得（CDKデプロイ後に表示される）
aws s3 sync public/ s3://<bucket-name>/ --delete
```

## ✅ Step 6: 動作確認

### 6.1 ヘルスチェック

```bash
# ALB URLを取得（CDKデプロイ後に表示される）
curl https://<alb-url>/api/health
```

### 6.2 CloudFront経由でのアクセス

```bash
# CloudFront URLを取得（CDKデプロイ後に表示される）
open https://<cloudfront-url>
```

## 🔄 Step 7: GitHub Actionsの設定

`.github/workflows/cdk-deploy.yml`用のシークレットを設定：

1. GitHubリポジトリの Settings → Secrets and variables → Actions
2. 以下のシークレットを追加：
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `GITHUB_TOKEN`（自動生成されるものとは別）

## 🚨 トラブルシューティング

### ECSタスクが起動しない場合

```bash
# CloudWatch Logsでログを確認
aws logs tail /aws/ecs/lightningtalk-circle-api --follow
```

### DynamoDBアクセスエラー

- IAMロールの権限を確認
- 環境変数のテーブル名が正しいか確認

### ALBヘルスチェック失敗

- セキュリティグループの設定を確認
- コンテナのヘルスチェックパス（`/api/health`）が正しいか確認

## 📈 モニタリング

### CloudWatchダッシュボード

CDKで自動作成されるダッシュボードで以下を監視：
- ECSタスクのCPU/メモリ使用率
- ALBのリクエスト数とレスポンスタイム
- DynamoDBの読み書きキャパシティ
- エラー率とアラーム

### コストモニタリング

- DynamoDBはPay-per-requestモードで使用量に応じた課金
- 初期費用は最小限（RDS/ElastiCacheと比較して大幅削減）

## 🔄 更新手順

### アプリケーションの更新

```bash
# 新しいDockerイメージをビルド・プッシュ
docker build -t lightningtalk-circle-api .
docker tag lightningtalk-circle-api:latest <ecr-url>:latest
docker push <ecr-url>:latest

# ECSサービスを更新
aws ecs update-service --cluster lightningtalk-circle-api-cluster --service lightningtalk-circle-api-service --force-new-deployment
```

### インフラの更新

```bash
cd cdk
npx cdk diff
npx cdk deploy --all
```

## 🗑️ リソースの削除

```bash
# 注意：本番環境では慎重に実行
cd cdk
npx cdk destroy --all
```

DynamoDBテーブルは本番環境では`RETAIN`ポリシーが設定されているため、手動削除が必要です。

## 📝 注意事項

1. **セキュリティ**: JWT_SECRETは定期的にローテーションしてください
2. **バックアップ**: DynamoDBのポイントインタイムリカバリが本番環境で有効になっています
3. **スケーリング**: DynamoDBはオートスケーリング、ECSは設定に基づいて自動スケール
4. **コスト**: CloudWatchでコストアラームを設定することを推奨

## 🆘 サポート

問題が発生した場合は、以下を確認してください：
- CloudWatch Logs
- ECSタスクの詳細
- DynamoDBのメトリクス
- GitHub Issuesでの報告