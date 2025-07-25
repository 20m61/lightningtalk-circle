# Lightning Talk Circle - Storybookデプロイメントガイド

## 📚 概要

このガイドでは、Lightning Talk
Circle統合デザインシステムのStorybookをAWSにデプロイする手順を説明します。

## 🏗️ インフラストラクチャ構成

### スタック構成

1. **Storybookスタック (本番環境)**
   - URL: `https://storybook.xn--6wym69a.com`
   - S3バケット: `lightning-talk-storybook-production`
   - CloudFront Distribution
   - Route53 CNAMEレコード

2. **Storybookスタック (ステージング環境)**
   - URL: `https://storybook-staging.xn--6wym69a.com`
   - S3バケット: `lightning-talk-storybook-staging`
   - CloudFront Distribution
   - Route53 CNAMEレコード

### 技術スタック

- **ホスティング**: AWS S3 (静的ウェブサイトホスティング)
- **CDN**: AWS CloudFront (グローバル配信)
- **DNS**: Route53 (ドメイン管理)
- **証明書**: AWS Certificate Manager (SSL/TLS)
- **ビルドツール**: Rollup + Storybook
- **CI/CD**: GitHub Actions

## 🚀 デプロイ手順

### 1. CDKインフラストラクチャのデプロイ

```bash
# 本番環境のCDKスタックをデプロイ
cd cdk
CDK_STAGE=prod cdk deploy LightningTalkStorybook-prod LightningTalkStorybook-staging --context env=prod

# デプロイ後、CloudFront Distribution IDを取得
aws cloudformation describe-stacks \
  --stack-name LightningTalkStorybook-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text

aws cloudformation describe-stacks \
  --stack-name LightningTalkStorybook-staging \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text
```

### 2. GitHub Secretsの設定

GitHub リポジトリの Settings → Secrets and variables → Actions で以下を設定:

- `AWS_ACCESS_KEY_ID`: AWSアクセスキー
- `AWS_SECRET_ACCESS_KEY`: AWSシークレットキー
- `CLOUDFRONT_PRODUCTION_DISTRIBUTION_ID`: 本番環境のCloudFront ID
- `CLOUDFRONT_STAGING_DISTRIBUTION_ID`: ステージング環境のCloudFront ID

### 3. Storybookのビルドとデプロイ

```bash
# ローカルでビルドテスト
cd lightningtalk-modern/packages/components
npm run build-storybook

# GitHub Actionsによる自動デプロイ
# mainブランチにマージすると自動的にデプロイされます
git push origin main
```

### 4. 手動デプロイ（緊急時）

```bash
# Storybookのビルド
cd lightningtalk-modern/packages/components
npm run build-storybook

# S3へのアップロード
aws s3 sync storybook-static/ s3://lightning-talk-storybook-production/ \
  --delete \
  --cache-control max-age=31536000

# CloudFrontキャッシュの無効化
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## 📊 監視とメンテナンス

### CloudFrontログの確認

```bash
# ログバケットからログを取得
aws s3 ls s3://lightning-talk-storybook-logs-production/
```

### パフォーマンス監視

- CloudWatch Dashboardでメトリクスを確認
- キャッシュヒット率の監視
- エラー率の追跡

### コスト最適化

- S3ライフサイクルポリシーで古いバージョンを自動削除
- CloudFrontのPrice Class設定で配信地域を最適化
- 不要なログの定期削除

## 🔧 トラブルシューティング

### よくある問題

1. **ページが真っ白になる**
   - S3バケットが存在しない
   - CloudFront設定が不正
   - ビルドファイルがアップロードされていない

2. **404エラー**
   - defaultRootObjectが設定されていない
   - エラーページの設定が不正

3. **アクセス拒否**
   - S3バケットポリシーが不正
   - CloudFront OAIの設定ミス

### デバッグコマンド

```bash
# S3バケットの内容確認
aws s3 ls s3://lightning-talk-storybook-production/

# CloudFront設定の確認
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Route53レコードの確認
aws route53 list-resource-record-sets --hosted-zone-id Z036564723AZHFOSIARRI
```

## 📝 メンテナンスタスク

### 定期的なタスク

- [ ] CloudWatchログの確認（週次）
- [ ] S3ストレージコストの確認（月次）
- [ ] CloudFrontキャッシュ統計の確認（月次）
- [ ] セキュリティアップデートの適用（随時）

### アップデート手順

1. フィーチャーブランチで変更を作成
2. プルリクエストを作成
3. ステージング環境でテスト
4. mainブランチにマージ
5. 本番環境へ自動デプロイ

## 🔒 セキュリティ考慮事項

- S3バケットは直接アクセス不可（CloudFront経由のみ）
- HTTPS強制
- 適切なCORSヘッダー設定
- セキュリティヘッダーの自動付与

## 📞 サポート

問題が発生した場合は、以下のリソースを参照してください：

- [GitHub Issues](https://github.com/20m61/lightningtalk-circle/issues)
- [AWS サポート](https://console.aws.amazon.com/support/)
- プロジェクトドキュメント: `/docs/`
