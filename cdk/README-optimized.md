# Lightning Talk Circle - Optimized CDK Infrastructure

## 概要

Lightning Talk
CircleのCDKインフラストラクチャを統合・最適化したバージョンです。従来の6スタック構成から4スタック構成に統合し、コスト削減と管理性向上を実現しました。

## スタック構成

### 1. BaseInfrastructureStack (本番環境のみ)

- Route53 ホストゾーン管理
- ACM証明書（us-east-1リージョン）
- 全環境共通のタグ戦略

### 2. SharedResourcesStack

- Cognito User Pool & Identity Pool
- DynamoDB テーブル（Events, Participants, Talks, Users）
- S3 バケット（Uploads, Assets）
- Secrets Manager
- SSM パラメータストア

### 3. ApplicationStack

- Lambda 関数
- API Gateway
- CloudFront Distribution
- 静的ホスティング用S3
- Route53 レコード

### 4. OperationsStack

- CloudWatch Dashboard
- アラーム設定
- コスト予算管理
- SNS通知

## 使用方法

### 前提条件

- AWS CLI設定済み
- Node.js 18.x以上
- CDK 2.x インストール済み

### インストール

```bash
cd cdk
npm install
```

### デプロイコマンド

#### 開発環境

```bash
# すべてのスタックをデプロイ
npm run deploy:optimized

# 特定のスタックのみデプロイ
npx cdk deploy LTC-SharedResources-dev --app "node bin/cdk-optimized.js" -c env=dev
```

#### 本番環境

```bash
# すべてのスタックをデプロイ（承認必要）
npm run deploy:optimized:prod

# 差分確認
CDK_STAGE=prod npm run diff:optimized
```

### 合成（Synth）

```bash
# 開発環境
npm run synth:optimized

# 本番環境
CDK_STAGE=prod npm run synth:optimized
```

### 削除

```bash
# 開発環境のスタックを削除
npm run destroy:optimized

# 本番環境のスタックを削除（要注意）
CDK_STAGE=prod npm run destroy:optimized
```

## 環境設定

環境設定は `lib/config/environment.js` で管理されています。

### 主な設定項目

- `domainName`: ドメイン名
- `hostedZoneId`: Route53ホストゾーンID
- `certificateArn`: ACM証明書ARN（既存の場合）
- `alertEmail`: アラート通知先メールアドレス

## コスト最適化

### 開発環境

- DynamoDB: On-Demand課金
- Lambda: 512MBメモリ
- CloudFront: PriceClass_100
- S3: 30日後に自動削除

### 本番環境

- DynamoDB: Provisioned Capacity (Auto Scaling)
- Lambda: 1024MBメモリ
- CloudFront: PriceClass_All
- S3: バージョニング有効、古いバージョンは90日後に削除

## 移行ガイド

### 既存環境からの移行

1. **バックアップ作成**

   ```bash
   ./scripts/backup-existing-resources.sh
   ```

2. **並行環境の構築**

   ```bash
   npm run deploy:optimized -- --context newEnvironment=true
   ```

3. **データ移行**

   ```bash
   ./scripts/migrate-data.sh source-env target-env
   ```

4. **DNS切り替え**
   - Route53でAレコードを更新

5. **旧環境の削除**
   ```bash
   cdk destroy LightningTalkCircle-dev
   ```

## トラブルシューティング

### よくある問題

#### 1. SSMパラメータが見つからない

```
Error: Unable to fetch SSM parameter
```

**解決策**: SharedResourcesStackが先にデプロイされていることを確認

#### 2. Lambda Layerエラー

```
Error: Cannot find asset at layers/dependencies
```

**解決策**: Lambda Layerのディレクトリを作成するか、該当部分をコメントアウト

#### 3. 既存リソースとの競合

```
Error: Resource already exists
```

**解決策**: 既存リソースをインポートするか、異なる名前を使用

## 監視とアラート

### CloudWatchダッシュボード

デプロイ後、以下のURLでダッシュボードにアクセス可能：

```
https://ap-northeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=Lightning-Talk-Circle-dev
```

### アラート通知

以下の条件でアラートが発生：

- Lambda関数エラー率: 5%以上
- API Gateway 5xxエラー: 1%以上
- Lambda実行時間: 5秒以上（開発）、3秒以上（本番）

## 参考資料

- [CDK Stack Optimization Analysis](./docs/stack-optimization-analysis.md)
- [Cost Optimization Report](./docs/cost-optimization-report.md)
- [Deployment Issues Analysis](./docs/deployment-issues-analysis.md)

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください：
https://github.com/20m61/lightningtalk-circle/issues
