# Lightning Talk Circle 監視設定ガイド

## 概要

このガイドでは、Lightning Talk Circleアプリケーションの監視とアラート設定について説明します。

## CloudWatch統合

### 必要な設定

```env
# CloudWatch設定
ENABLE_CLOUDWATCH_LOGS=true
ENABLE_CLOUDWATCH_METRICS=true
CLOUDWATCH_LOG_GROUP=/aws/ecs/lightningtalk-circle
CLOUDWATCH_NAMESPACE=LightningTalkCircle/Application
MONITORING_ENABLED=true
MONITORING_INTERVAL=30000
```

### ログ設定

#### アプリケーションログ

```javascript
// server/services/cloudWatchService.js
const cloudWatchLogs = new AWS.CloudWatchLogs({
  region: process.env.AWS_REGION || 'ap-northeast-1'
});

// ログストリーム作成
await cloudWatchLogs.createLogStream({
  logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
  logStreamName: `${process.env.NODE_ENV}-${Date.now()}`
}).promise();
```

### メトリクス設定

#### カスタムメトリクス

- **API呼び出し回数**
- **レスポンス時間**
- **エラー率**
- **同時接続数**
- **登録数**

```javascript
// カスタムメトリクス送信
await cloudWatch.putMetricData({
  Namespace: 'LightningTalkCircle',
  MetricData: [{
    MetricName: 'APICallCount',
    Value: 1,
    Unit: 'Count',
    Dimensions: [
      { Name: 'Environment', Value: process.env.NODE_ENV },
      { Name: 'Endpoint', Value: req.path }
    ]
  }]
}).promise();
```

## アラーム設定

### 重要なアラーム

#### 1. CPU使用率
```yaml
AlarmName: HighCPUUtilization
MetricName: CPUUtilization
Threshold: 80
ComparisonOperator: GreaterThanThreshold
EvaluationPeriods: 2
Period: 300
```

#### 2. メモリ使用率
```yaml
AlarmName: HighMemoryUtilization
MetricName: MemoryUtilization
Threshold: 85
ComparisonOperator: GreaterThanThreshold
EvaluationPeriods: 2
Period: 300
```

#### 3. エラー率
```yaml
AlarmName: HighErrorRate
MetricName: ErrorRate
Threshold: 1
ComparisonOperator: GreaterThanThreshold
EvaluationPeriods: 1
Period: 300
```

#### 4. レスポンス時間
```yaml
AlarmName: SlowResponseTime
MetricName: ResponseTime
Threshold: 1000
ComparisonOperator: GreaterThanThreshold
EvaluationPeriods: 2
Period: 300
Unit: Milliseconds
```

## ダッシュボード

### メインダッシュボード構成

1. **システムヘルス**
   - CPU/メモリ使用率
   - アクティブなコンテナ数
   - ヘルスチェックステータス

2. **アプリケーションメトリクス**
   - API呼び出し数（エンドポイント別）
   - レスポンス時間分布
   - エラー率トレンド

3. **ビジネスメトリクス**
   - イベント作成数
   - 参加登録数
   - アクティブユーザー数

### ダッシュボード作成

```bash
# CDKでダッシュボードを作成
npm run cdk:deploy:monitoring
```

## ログ分析

### CloudWatch Insights クエリ

#### エラーログ検索
```sql
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

#### 遅いAPIリクエスト
```sql
fields @timestamp, method, path, responseTime
| filter responseTime > 1000
| sort responseTime desc
| limit 50
```

#### ユーザーアクティビティ
```sql
fields @timestamp, userId, action
| filter action in ["login", "register", "createEvent"]
| stats count() by action
```

## 外部監視ツール連携

### Datadog連携（オプション）

```javascript
// Datadog APM設定
const tracer = require('dd-trace').init({
  env: process.env.NODE_ENV,
  service: 'lightningtalk-circle',
  version: process.env.APP_VERSION
});
```

### PagerDuty連携（オプション）

CloudWatchアラームからSNS経由でPagerDutyに通知：

1. SNSトピック作成
2. PagerDuty統合エンドポイント設定
3. CloudWatchアラームでSNSトピックを指定

## ローカル開発での監視

### ローカルメトリクス表示

```bash
# 監視ダッシュボードにアクセス
open http://localhost:3000/api/monitoring/dashboard
```

### ログ出力設定

```javascript
// 開発環境用ログ設定
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
```

## トラブルシューティング

### 一般的な問題

1. **ログが表示されない**
   - CloudWatchログ権限を確認
   - ログストリームの存在を確認
   - 環境変数ENABLE_CLOUDWATCH_LOGSを確認

2. **メトリクスが記録されない**
   - CloudWatch権限を確認
   - メトリクス名前空間を確認
   - AWS認証情報を確認

3. **アラームが発火しない**
   - しきい値設定を確認
   - 評価期間を確認
   - SNSトピックのサブスクリプションを確認

## ベストプラクティス

1. **ログレベルの適切な使用**
   - ERROR: エラーと例外
   - WARN: 警告と潜在的な問題
   - INFO: 重要なイベント
   - DEBUG: デバッグ情報（本番では無効化）

2. **メトリクスの粒度**
   - 高頻度メトリクス: 1分間隔
   - 通常メトリクス: 5分間隔
   - 集計メトリクス: 15分間隔

3. **コスト最適化**
   - 不要なログの削減
   - メトリクスの適切な保持期間設定
   - アラームの統合

## 関連ドキュメント

- [CloudWatchサービス実装](../../server/services/cloudWatchService.js)
- [監視サービス実装](../../server/services/monitoringService.js)
- [CDKモニタリングスタック](../../cdk/lib/monitoring-stack.ts)
