# GitHub Secrets Setup Guide for Lightning Talk Circle

## 必要なGitHub Secrets

以下のシークレットをGitHubリポジトリに設定する必要があります。

### 1. AWS認証情報

- `AWS_ACCESS_KEY_ID`: AWSアクセスキーID
- `AWS_SECRET_ACCESS_KEY`: AWSシークレットアクセスキー

### 2. CloudFront Distribution IDs

- `CLOUDFRONT_PRODUCTION_DISTRIBUTION_ID`: `E337IUZ2XC4I1W`
- `CLOUDFRONT_STAGING_DISTRIBUTION_ID`: `E23L45YFTAXZQZ`

### 3. その他の設定

- `CHROMATIC_PROJECT_TOKEN`: Chromatic視覚回帰テスト用（オプション）
- `SLACK_WEBHOOK_URL`: デプロイ通知用（オプション）

## 設定手順

### 1. GitHubリポジトリにアクセス

```
https://github.com/20m61/lightningtalk-circle
```

### 2. Settings → Secrets and variables → Actionsに移動

### 3. "New repository secret"をクリック

### 4. 各シークレットを追加

- Name: シークレット名（上記リスト参照）
- Secret: 実際の値

## 現在のインフラストラクチャ情報

### Production Storybook

- **S3 Bucket**: `lightning-talk-storybook-dev-822063948773`
- **CloudFront Distribution ID**: `E337IUZ2XC4I1W`
- **CloudFront URL**: https://d167teaukwsg2s.cloudfront.net/

### Staging Storybook

- **S3 Bucket**: `lightning-talk-storybook-staging`
- **CloudFront Distribution ID**: `E23L45YFTAXZQZ`
- **CloudFront URL**: https://dvhjxf2valstu.cloudfront.net/

## GitHub Actionsワークフロー

`storybook-deploy.yml`ワークフローは以下のタイミングで実行されます：

1. **mainブランチへのプッシュ**: 本番環境へ自動デプロイ
2. **developブランチへのプッシュ**: ステージング環境へ自動デプロイ
3. **PRの作成**: ビルドとテストのみ実行
4. **手動実行**: workflow_dispatchで環境を選択してデプロイ

## 確認事項

- [ ] AWS_ACCESS_KEY_IDが設定されている
- [ ] AWS_SECRET_ACCESS_KEYが設定されている
- [ ] CLOUDFRONT_PRODUCTION_DISTRIBUTION_IDが設定されている
- [ ] GitHub Actionsワークフローが有効になっている

## トラブルシューティング

### デプロイが失敗する場合

1. **AWS認証エラー**
   - アクセスキーが正しいか確認
   - IAMユーザーに必要な権限があるか確認

2. **S3アクセスエラー**
   - S3バケットが存在するか確認
   - IAMユーザーにS3の権限があるか確認

3. **CloudFrontエラー**
   - Distribution IDが正しいか確認
   - CloudFrontの無効化権限があるか確認

## 必要なIAM権限

GitHub Actions用のIAMユーザーには以下の権限が必要です：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::lightning-talk-storybook-*",
        "arn:aws:s3:::lightning-talk-storybook-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "*"
    }
  ]
}
```
