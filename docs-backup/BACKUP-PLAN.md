# Lightning Talk Circle - バックアップ・災害復旧計画

## 📋 概要

Lightning Talk
Circleシステムの継続的な運用を保証するため、包括的なバックアップおよび災害復旧（DR）計画を策定しています。この計画は、データ損失の防止、迅速なサービス復旧、および事業継続性の確保を目的としています。

## 🎯 目標

- **RPO (Recovery Point Objective)**: 最大1時間のデータ損失
- **RTO (Recovery Time Objective)**: 最大4時間でのサービス復旧
- **データ保持期間**: 30日間
- **可用性目標**: 99.9%（月間ダウンタイム約43分以内）

## 🔄 バックアップ戦略

### 1. DynamoDBデータバックアップ

#### 自動バックアップ（本番環境）

```yaml
バックアップタイプ: Point-in-Time Recovery (PITR)
頻度: 継続的
保持期間: 35日間
対象テーブル:
  - lightningtalk-circle-prod-events
  - lightningtalk-circle-prod-participants
  - lightningtalk-circle-prod-users
  - lightningtalk-circle-prod-talks
  - lightningtalk-circle-prod-participation-votes
  - lightningtalk-circle-prod-voting-sessions
```

#### 日次スナップショット

```bash
# 日次バックアップスクリプト（cron: 0 2 * * *）
#!/bin/bash
TABLES=(
  "lightningtalk-circle-prod-events"
  "lightningtalk-circle-prod-participants"
  "lightningtalk-circle-prod-users"
  "lightningtalk-circle-prod-talks"
  "lightningtalk-circle-prod-participation-votes"
  "lightningtalk-circle-prod-voting-sessions"
)

DATE=$(date +%Y%m%d)
for TABLE in "${TABLES[@]}"; do
  aws dynamodb create-backup \
    --table-name "$TABLE" \
    --backup-name "${TABLE}-backup-${DATE}" \
    --region ap-northeast-1
done
```

### 2. 静的アセットバックアップ

#### S3クロスリージョンレプリケーション

```yaml
ソースバケット: lightningtalk-circle-prod-static
レプリケーション先: lightningtalk-circle-prod-static-dr
レプリケーション先リージョン: us-west-2
レプリケーションルール:
  - 全オブジェクト対象
  - 削除マーカーレプリケーション: 有効
  - メトリクス: 有効
```

#### S3ライフサイクルポリシー

```json
{
  "Rules": [
    {
      "Id": "BackupLifecycle",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

### 3. アプリケーションコード・設定

#### Gitリポジトリバックアップ

```yaml
プライマリ: GitHub (github.com/username/lightningtalk-circle)
ミラー: AWS CodeCommit (lightningtalk-circle-mirror)
同期頻度: push時自動同期
```

#### 環境設定バックアップ

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name "lightningtalk-prod-env-backup-$(date +%Y%m%d)" \
  --secret-string file://.env.production \
  --region ap-northeast-1
```

### 4. Dockerイメージバックアップ

```yaml
プライマリレジストリ: ECR (lightningtalk-circle-prod)
バックアップレジストリ: ECR (lightningtalk-circle-prod-backup)
保持ポリシー:
  - 最新10バージョン保持
  - 30日以上経過したイメージは削除
```

## 🚨 災害復旧手順

### レベル1: サービス一時停止（1-2時間復旧）

#### 原因例

- ECSタスクの異常終了
- ロードバランサーの設定ミス
- 一時的なネットワーク障害

#### 復旧手順

```bash
# 1. 問題の特定
aws ecs describe-services \
  --cluster lightningtalk-circle-prod \
  --services lightningtalk-circle-prod-api

# 2. サービスの再起動
aws ecs update-service \
  --cluster lightningtalk-circle-prod \
  --service lightningtalk-circle-prod-api \
  --force-new-deployment

# 3. ヘルスチェック確認
curl https://api.xn--6wym69a.com/health

# 4. ログ確認
aws logs tail /aws/ecs/lightningtalk-circle --follow
```

### レベル2: データベース障害（2-4時間復旧）

#### 原因例

- DynamoDBテーブルの破損
- 誤ったデータ削除
- スロットリング問題

#### 復旧手順

```bash
# 1. PITRからの復旧
aws dynamodb restore-table-to-point-in-time \
  --source-table-name lightningtalk-circle-prod-events \
  --target-table-name lightningtalk-circle-prod-events-restored \
  --restore-date-time "2025-07-11T10:00:00Z"

# 2. テーブル名の切り替え
# CDK環境変数を更新してデプロイ
export DYNAMODB_EVENTS_TABLE=lightningtalk-circle-prod-events-restored
npm run cdk:deploy:prod

# 3. データ整合性確認
node scripts/verify-data-integrity.js
```

### レベル3: リージョン障害（4-8時間復旧）

#### 原因例

- AWSリージョン全体の障害
- 大規模ネットワーク障害

#### 復旧手順

```bash
# 1. DRリージョンへの切り替え準備
export AWS_REGION=us-west-2
export CDK_DEPLOY_REGION=us-west-2

# 2. DRスタックのデプロイ
cd cdk
npm run cdk:deploy:dr

# 3. データ復元（S3は自動レプリケーション済み）
# DynamoDBバックアップから復元
./scripts/restore-dynamodb-dr.sh

# 4. DNS切り替え
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dr-dns-failover.json

# 5. 監視再開
./scripts/enable-dr-monitoring.sh
```

### レベル4: 完全障害（8時間以上復旧）

#### 原因例

- 複数コンポーネントの同時障害
- セキュリティインシデント
- 人為的な重大ミス

#### 復旧手順

1. 緊急対策本部の設置
2. ステークホルダーへの通知
3. 最小構成でのサービス再開
4. 段階的な機能復旧
5. インシデント後レビュー

## 📊 バックアップ監視

### 自動監視項目

```yaml
DynamoDBバックアップ:
  - 日次バックアップ成功率
  - PITRステータス
  - バックアップサイズ推移

S3レプリケーション:
  - レプリケーション遅延
  - 失敗オブジェクト数
  - ストレージコスト

Dockerイメージ:
  - 最新イメージの存在確認
  - バックアップレジストリ同期状態
```

### アラート設定

```json
{
  "BackupFailureAlarm": {
    "MetricName": "BackupSuccess",
    "Threshold": 0,
    "ComparisonOperator": "LessThanThreshold",
    "Actions": ["arn:aws:sns:ap-northeast-1:123456789012:backup-alerts"]
  },
  "ReplicationLagAlarm": {
    "MetricName": "ReplicationLatency",
    "Threshold": 3600,
    "ComparisonOperator": "GreaterThanThreshold"
  }
}
```

## 🧪 復旧テスト計画

### 月次テスト

- DynamoDB PITRからの単一テーブル復元
- ECSタスクの強制再起動
- S3オブジェクトの復元確認

### 四半期テスト

- 完全バックアップからの環境復元
- DRリージョンへの切り替えテスト
- データ整合性の検証

### 年次テスト

- 完全障害シミュレーション
- 全スタッフ参加の復旧訓練
- 外部監査

## 📝 連絡体制

### エスカレーション手順

1. **L1サポート**: 初期対応、基本的な復旧作業
2. **L2エンジニア**: 技術的な問題解決、データ復元
3. **インフラチーム**: AWS環境の復旧、DR実行
4. **マネジメント**: 重大インシデントの判断、対外連絡

### 緊急連絡先

```yaml
インシデント管理者:
  - 主担当: incident-manager@example.com
  - 副担当: backup-manager@example.com

AWS サポート:
  - ケース作成: https://console.aws.amazon.com/support
  - 緊急度: Production system down

ステークホルダー:
  - プロダクトオーナー: po@example.com
  - カスタマーサポート: support@example.com
```

## 🔐 セキュリティ考慮事項

### バックアップの暗号化

- DynamoDB: AWS管理キーによる暗号化
- S3: SSE-S3による暗号化
- Secrets Manager: KMS暗号化

### アクセス制御

- バックアップ実行: 専用IAMロール
- 復元権限: 限定されたエンジニアのみ
- 監査ログ: CloudTrailで全操作記録

### コンプライアンス

- GDPR準拠: 個人データの適切な管理
- データ保持ポリシー: 法的要件の遵守
- 定期的な監査実施

## 📈 改善計画

### 短期（3ヶ月）

- [ ] 自動復旧スクリプトの拡充
- [ ] バックアップ検証の自動化
- [ ] インシデント対応プレイブックの作成

### 中期（6ヶ月）

- [ ] マルチリージョンアクティブ構成の検討
- [ ] AIによる異常検知システムの導入
- [ ] バックアップコストの最適化

### 長期（1年）

- [ ] 完全自動復旧システムの構築
- [ ] グローバルDR体制の確立
- [ ] ゼロダウンタイムデプロイメント

## 📚 関連ドキュメント

- [運用手順書](./OPERATIONS-MANUAL.md)
- [インシデント対応手順](./security/INCIDENT-RESPONSE.md)
- [セキュリティポリシー](./security/SECURITY-POLICY.md)
- [監視ダッシュボード設定](./monitoring/MONITORING-SETUP.md)

---

最終更新: 2025-07-11次回レビュー:
2025-08-11（月次）承認者: インフラストラクチャチームリード
