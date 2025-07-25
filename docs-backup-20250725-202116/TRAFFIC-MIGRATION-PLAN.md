# Lightning Talk Circle - 段階的トラフィック移行計画

## 🎯 概要

本ドキュメントは、Lightning Talk
Circleシステムの本番環境への安全な移行を実現するための段階的トラフィック移行計画を定めています。リスクを最小化しながら、ユーザー影響なく新システムへ移行することを目的としています。

## 📊 移行戦略

### カナリアデプロイメント方式

```
Phase 1: 5% トラフィック（24時間）
Phase 2: 25% トラフィック（48時間）
Phase 3: 50% トラフィック（72時間）
Phase 4: 100% トラフィック（完全移行）
```

### 成功基準

各フェーズで以下の基準を満たした場合のみ次フェーズへ進行：

- エラー率: < 0.1%
- レスポンスタイム P95: < 500ms
- 可用性: > 99.9%
- ユーザークレーム: 0件

## 🚀 Phase 1: カナリアリリース（5%）

### 期間

24時間（最小）～48時間（推奨）

### 対象トラフィック

- 内部テストユーザー
- ベータユーザー
- ランダムに選択された5%の一般ユーザー

### 実装方法

#### Route 53 重み付けルーティング

```json
{
  "ResourceRecordSets": [
    {
      "Name": "xn--6wym69a.com",
      "Type": "A",
      "SetIdentifier": "Legacy",
      "Weight": 95,
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "legacy-alb.ap-northeast-1.elb.amazonaws.com"
      }
    },
    {
      "Name": "xn--6wym69a.com",
      "Type": "A",
      "SetIdentifier": "New",
      "Weight": 5,
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "new-alb.ap-northeast-1.elb.amazonaws.com"
      }
    }
  ]
}
```

#### ALB ターゲットグループ重み付け

```bash
# ALBリスナールールの設定
aws elbv2 modify-rule \
  --rule-arn $RULE_ARN \
  --actions \
    Type=forward,ForwardConfig='{
      "TargetGroups":[
        {"TargetGroupArn":"'$LEGACY_TG_ARN'","Weight":95},
        {"TargetGroupArn":"'$NEW_TG_ARN'","Weight":5}
      ]
    }'
```

### 監視項目

- リアルタイムダッシュボード設定
- エラー率モニタリング
- パフォーマンスメトリクス
- ユーザーセッション追跡

### ロールバック条件

- エラー率 > 1%
- P95レスポンスタイム > 1秒
- 重大なバグ発見
- データ不整合の検出

## 📈 Phase 2: 早期採用者（25%）

### 期間

48時間（最小）～72時間（推奨）

### 対象トラフィック

- Phase 1の全ユーザー
- 追加20%のランダムユーザー
- モバイルアプリユーザーの50%

### 実装更新

```bash
# Route 53の重み更新
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "xn--6wym69a.com",
        "Type": "A",
        "SetIdentifier": "New",
        "Weight": 25,
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "new-alb.ap-northeast-1.elb.amazonaws.com"
        }
      }
    }]
  }'
```

### 追加監視

- データベース負荷分析
- キャッシュヒット率
- WebSocketコネクション安定性
- 外部API連携状況

### A/Bテスト項目

- UI/UXの使いやすさ
- 機能の動作確認
- パフォーマンス体感
- エラー発生頻度

## 🌐 Phase 3: 一般公開（50%）

### 期間

72時間（最小）～1週間（推奨）

### 対象トラフィック

- 全ユーザーの50%
- 地域別段階展開も検討

### 実装

```bash
# CloudFrontディストリビューションでの制御
aws cloudfront create-distribution --distribution-config '{
  "Origins": [{
    "Id": "legacy-origin",
    "DomainName": "legacy.xn--6wym69a.com"
  }, {
    "Id": "new-origin",
    "DomainName": "new.xn--6wym69a.com"
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "origin-group-1"
  },
  "OriginGroups": {
    "Items": [{
      "Id": "origin-group-1",
      "Members": {
        "Items": [
          {"OriginId": "legacy-origin", "Weight": 50},
          {"OriginId": "new-origin", "Weight": 50}
        ]
      }
    }]
  }
}'
```

### 負荷テスト

```bash
# 本番相当の負荷テスト実施
artillery run load-test-50percent.yml
```

### データ同期確認

- 新旧システム間のデータ整合性
- リアルタイム同期の遅延測定
- トランザクション整合性

## ✅ Phase 4: 完全移行（100%）

### 期間

最終確認期間: 24時間

### 事前チェックリスト

- [ ] 全メトリクスが基準値内
- [ ] バックアップ完了確認
- [ ] ロールバック手順の再確認
- [ ] サポートチーム準備完了
- [ ] 緊急連絡体制確立

### 実装

```bash
# 完全切り替えスクリプト
#!/bin/bash
set -euo pipefail

echo "Starting full migration to new system..."

# 1. 最終バックアップ
./scripts/backup-before-migration.sh

# 2. Route 53完全切り替え
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch file://full-migration.json

# 3. レガシーシステムを読み取り専用に
aws rds modify-db-instance \
  --db-instance-identifier legacy-db \
  --backup-retention-period 0 \
  --read-only

# 4. 監視強化モード有効化
./scripts/enable-enhanced-monitoring.sh

echo "Migration completed. Monitoring active."
```

### 移行後の監視（24時間集中監視）

- 1分間隔のヘルスチェック
- リアルタイムアラート設定
- オンコールエンジニア待機
- ユーザーフィードバック収集

## 🔄 ロールバック手順

### 即時ロールバック（5分以内）

```bash
#!/bin/bash
# Emergency rollback script

echo "EMERGENCY ROLLBACK INITIATED"

# 1. トラフィックを旧システムへ
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch file://rollback-immediate.json \
  --change-batch-id $ROLLBACK_ID

# 2. 新システムへのトラフィック遮断
aws elbv2 modify-target-group-attributes \
  --target-group-arn $NEW_TG_ARN \
  --attributes Key=deregistration_delay.timeout_seconds,Value=0

# 3. アラート発報
./scripts/send-rollback-alert.sh "Emergency rollback executed"

# 4. データ同期停止
systemctl stop data-sync-service

echo "Rollback completed. Legacy system active."
```

### 段階的ロールバック（問題部分のみ）

- 特定機能のみ旧システム利用
- APIエンドポイント単位での切り替え
- ユーザーセグメント単位での制御

## 📊 メトリクス監視ダッシュボード

### CloudWatchダッシュボード構成

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "Traffic Distribution",
        "metrics": [
          [
            "Custom",
            "TrafficPercentage",
            { "stat": "Average", "label": "New System" }
          ],
          ["...", { "stat": "Average", "label": "Legacy System" }]
        ]
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Error Rates Comparison",
        "metrics": [
          [
            "AWS/ApplicationELB",
            "HTTPCode_Target_4XX_Count",
            { "label": "4XX New" }
          ],
          ["...", "HTTPCode_Target_5XX_Count", { "label": "5XX New" }]
        ]
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Response Time Comparison",
        "metrics": [
          ["Custom", "ResponseTime", { "stat": "p95", "label": "P95 New" }],
          ["...", { "stat": "p99", "label": "P99 New" }]
        ]
      }
    }
  ]
}
```

## 🚨 緊急時対応

### エスカレーションフロー

1. **L1 Alert** (自動検知)
   - 閾値超過を検知
   - オンコールエンジニアへ通知

2. **L2 Assessment** (5分以内)
   - 影響範囲の特定
   - ロールバック判断

3. **L3 Decision** (10分以内)
   - CTO/リードエンジニア承認
   - ロールバック実行 or 継続判断

### コミュニケーション計画

```yaml
内部連絡:
  - Slackチャンネル: #migration-war-room
  - 電話会議: 常時接続
  - ステータスページ: 5分毎更新

外部連絡:
  - ユーザー通知: 影響発生時のみ
  - サポートチーム: 事前ブリーフィング済み
  - PR対応: 広報チーム待機
```

## 📝 チェックリスト

### 移行前

- [ ] ステージング環境での完全テスト
- [ ] 本番データのバックアップ
- [ ] ロールバック手順の確認
- [ ] 監視ダッシュボードの設定
- [ ] チーム全員への周知

### 各フェーズ開始前

- [ ] 前フェーズの成功基準達成
- [ ] 次フェーズの設定確認
- [ ] 監視体制の確認
- [ ] ロールバック準備

### 移行完了後

- [ ] 全機能の動作確認
- [ ] パフォーマンス基準の達成
- [ ] ユーザーフィードバックの確認
- [ ] レガシーシステムの停止計画

## 🎉 移行成功後のアクション

1. **レガシーシステムの段階的廃止**
   - 1週間: 読み取り専用モード
   - 2週間: バックアップ保持
   - 1ヶ月: 完全廃止

2. **リソース最適化**
   - 不要なインスタンスの削除
   - コスト最適化の実施
   - 監視設定の調整

3. **ドキュメント更新**
   - 運用手順書の更新
   - アーキテクチャ図の更新
   - ランブックの改訂

---

最終更新:
2025-07-11承認者: インフラストラクチャチームリード次回レビュー: 移行開始前
