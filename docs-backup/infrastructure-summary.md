# Lightning Talk Circle - Infrastructure Summary

## 🚀 Storybook環境一覧

### 本番環境 (Production)

- **URL**: https://d167teaukwsg2s.cloudfront.net
- **S3バケット**: `lightning-talk-storybook-dev-822063948773`
- **CloudFront Distribution ID**: `E337IUZ2XC4I1W`
- **ドメイン**: 将来的に `storybook.xn--6wym69a.com`
- **証明書ARN**:
  `arn:aws:acm:us-east-1:822063948773:certificate/8381e1a9-ab88-4928-ac76-a5ba99aafb75`

### ステージング環境 (Staging)

- **URL**: https://dvhjxf2valstu.cloudfront.net
- **S3バケット**: `lightning-talk-storybook-staging`
- **CloudFront Distribution ID**: `E23L45YFTAXZQZ`
- **Origin Access Identity**: `E3PPPRBUKM0GHJ`
- **ドメイン**: 将来的に `storybook-staging.xn--6wym69a.com`

## 📋 GitHub Secrets設定

以下のシークレットをGitHubリポジトリに設定してください：

```
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
CLOUDFRONT_PRODUCTION_DISTRIBUTION_ID=E337IUZ2XC4I1W
CLOUDFRONT_STAGING_DISTRIBUTION_ID=E23L45YFTAXZQZ
```

## 🔧 デプロイメントコマンド

### 手動デプロイ

```bash
# 本番環境
./scripts/deploy-storybook.sh update

# ステージング環境
./scripts/deploy-storybook-staging.sh deploy
```

### 自動デプロイ（GitHub Actions）

- **mainブランチ**: 本番環境へ自動デプロイ
- **developブランチ**: ステージング環境へ自動デプロイ
- **PR**: ビルドとテストのみ

## 🌐 DNS設定状況

### ACM証明書

- **ARN**:
  `arn:aws:acm:us-east-1:822063948773:certificate/8381e1a9-ab88-4928-ac76-a5ba99aafb75`
- **ドメイン**:
  - `storybook.xn--6wym69a.com`
  - `storybook-staging.xn--6wym69a.com`
- **検証状況**: DNS検証レコード設定済み、検証待ち

### Route53設定

- **ホストゾーン**: `Z036564723AZHFOSIARRI`
- **DNS検証レコード**: 設定済み

## 📊 監視・ログ

### CloudFront

- **本番環境**: E337IUZ2XC4I1W
- **ステージング環境**: E23L45YFTAXZQZ

### S3

- **アクセスログ**: 設定なし（コスト削減のため）
- **バックアップ**: バージョニング無効

## 🔒 セキュリティ

### アクセス制御

- **S3**: Origin Access Identity (OAI) による制限アクセス
- **CloudFront**: HTTPS強制リダイレクト
- **IAM**: 最小権限の原則

### 証明書

- **SSL/TLS**: AWS Certificate Manager
- **暗号化**: TLS 1.2以上

## 💰 コスト最適化

### CloudFront

- **Price Class**: 200 (米国、カナダ、ヨーロッパ、アジア、中東、アフリカ)
- **キャッシュ設定**: デフォルト86400秒 (24時間)

### S3

- **ストレージクラス**: Standard
- **ライフサイクル**: 設定なし
- **転送加速**: 無効

## 🚀 次のステップ

1. **ACM証明書の検証完了を待つ**
2. **カスタムドメインをCloudFrontに設定**
3. **Route53でCNAMEレコードを追加**
4. **GitHub Secretsを設定**
5. **CI/CDパイプラインのテスト**

## 📞 トラブルシューティング

### よくある問題

1. **CloudFront 403エラー**: OAI設定を確認
2. **デプロイ失敗**: AWS認証情報を確認
3. **SSL証明書エラー**: DNS検証レコードを確認

### 連絡先

- GitHub Issues: https://github.com/20m61/lightningtalk-circle/issues
- AWS Support: https://console.aws.amazon.com/support/
