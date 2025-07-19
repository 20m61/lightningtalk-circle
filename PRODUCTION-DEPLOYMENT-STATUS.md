# 本番環境デプロイメント状況

## 🔍 現在の状況

### 既存の本番環境リソース

本番環境にはすでに以下のリソースが存在しています：

#### DynamoDBテーブル

- ✅ lightningtalk-prod-events
- ✅ lightningtalk-prod-participants
- ✅ lightningtalk-prod-talks
- ✅ lightningtalk-prod-users

#### S3バケット

- ✅ lightningtalk-prod-static-822063948773
- ✅ lightningtalk-prod-uploads-822063948773

#### CloudFormationスタック

- ✅ VjUnifiedStack-prod (別プロジェクト)

#### その他

- ✅ CloudWatch LogGroup: /aws/lambda/lightningtalk-prod-api-v2
- ✅ SSL証明書: 発表.com用 (us-east-1)
- ✅ Route53ホストゾーン: xn--6wym69a.com

## 📋 デプロイメントオプション

### オプション1: 既存リソースの再利用（推奨）

既存のDynamoDBテーブルとS3バケットを再利用して、新しいアプリケーションをデプロイ

**メリット**:

- データの継続性
- コスト効率
- 既存のドメイン設定を活用

**手順**:

1. CDKスタックを既存リソースのインポートモードで更新
2. Lambda関数とAPI Gatewayのみ新規作成
3. CloudFrontディストリビューションを更新

### オプション2: 新しいスタック名でデプロイ

`LightningTalkCircle-prod-v2` などの新しいスタック名で完全に新規デプロイ

**メリット**:

- クリーンな環境
- 既存環境に影響なし
- ロールバックが容易

**デメリット**:

- リソース名の変更が必要
- DNS切り替えが必要
- 一時的なコスト増加

### オプション3: 既存スタックの削除後に再デプロイ

**注意**: データ損失のリスクあり

## 🎯 推奨アクション

### 即時実行可能なアクション

1. **WebSocketスタックのデプロイ** (新規リソース)

   ```bash
   cd cdk
   cdk deploy LightningTalkWebSocket-prod --context stage=prod --require-approval never
   ```

2. **静的ファイルの本番環境へのアップロード**

   ```bash
   aws s3 sync public/ s3://lightningtalk-prod-static-822063948773 --delete
   ```

3. **CloudFrontキャッシュの無効化**
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

## 📝 既存環境の確認結果

### API Gateway

- 既存API: https://izn3rhan4m.execute-api.ap-northeast-1.amazonaws.com/prod/
- CloudFront: d3q3r63w16fgpo.cloudfront.net

### 推測される状況

- 別のプロジェクト（VjUnifiedStack）が同じリソース名を使用
- Lightning Talk Circleプロジェクトの以前のデプロイメント

## ⚠️ 注意事項

1. **データの確認**: 既存のDynamoDBテーブルにデータが存在する可能性
2. **ドメイン設定**: 現在のDNS設定を確認する必要あり
3. **コスト**: 重複リソースによるコスト増加に注意

## 🔄 次のステップ

1. 既存リソースの所有者・用途を確認
2. データのバックアップ（必要に応じて）
3. デプロイメント戦略の決定
4. 段階的なデプロイメント実行

---

最終更新: 2025-07-18 22:25 JST
