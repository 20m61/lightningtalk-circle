# 本番環境デプロイメント競合解決プラン

## 現在の状況

CDKスタックのデプロイ時に以下のリソースが既に存在することが判明：

### 既存リソース

- ✅ S3バケット: lightningtalk-prod-static-822063948773
  (静的ファイルアップロード済み)
- ✅ S3バケット: lightningtalk-prod-uploads-822063948773
- ✅ DynamoDBテーブル: lightningtalk-prod-events
- ✅ DynamoDBテーブル: lightningtalk-prod-participants
- ✅ DynamoDBテーブル: lightningtalk-prod-talks
- ✅ DynamoDBテーブル: lightningtalk-prod-users
- ✅ CloudWatch LogGroup: /aws/lambda/lightningtalk-prod-api-v2
- ✅ WebSocketスタック: LightningTalkWebSocket-prod
  (wss://xudy1ik4mi.execute-api.ap-northeast-1.amazonaws.com/prod)

## 解決方針

### オプション1: 既存リソースのインポート（推奨）

CDKでリソースをインポートして管理下に置く

**メリット**:

- データの継続性
- ダウンタイムなし
- 段階的な移行が可能

**手順**:

1. CDKインポート用のリソース識別子を収集
2. `cdk import` コマンドで既存リソースをインポート
3. Lambda関数とAPI Gatewayのみ新規作成
4. CloudFrontディストリビューションを新規作成

### オプション2: 並行環境の構築

新しいスタック名（LightningTalkCircle-prod-v2）で構築

**メリット**:

- 既存環境に影響なし
- 完全なテストが可能
- ロールバックが容易

**デメリット**:

- 一時的なコスト増加
- DNS切り替えが必要

## 推奨アクション

### 即時実行：暫定的な本番環境アクセス

1. **S3 + CloudFront構成で暫定公開**

   ```bash
   # CloudFrontディストリビューション作成
   aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
   ```

2. **Route53 DNS設定**
   ```bash
   # CNAMEレコード追加
   aws route53 change-resource-record-sets --hosted-zone-id Z036564723AZHFOSIARRI --change-batch file://dns-change-batch.json
   ```

### 次のステップ：CDKスタックの整理

1. **既存スタックの確認と削除**

   ```bash
   # 既存のLightningTalkCircle-prodスタックを削除
   aws cloudformation delete-stack --stack-name LightningTalkCircle-prod
   ```

2. **リソースインポート**
   - CDK import機能を使用して既存リソースを管理下に

3. **新規リソースのデプロイ**
   - Lambda関数
   - API Gateway
   - CloudFront (新規)

## 進行中のタスク

- [x] WebSocketスタックデプロイ完了
- [x] 静的ファイルS3アップロード完了
- [ ] CloudFrontディストリビューション作成
- [ ] Route53 DNS設定
- [ ] API Gateway + Lambda デプロイ
- [ ] 既存スタックのクリーンアップ

## 注意事項

- 既存のDynamoDBテーブルにデータが存在する可能性があるため、削除前に確認が必要
- 別プロジェクト（VjUnifiedStack）との関連性を調査中

---

最終更新: 2025-07-18 22:35 JST
