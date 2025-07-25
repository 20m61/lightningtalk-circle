# Production Logging System

## 概要

Lightning Talk
Circleに実装された本番環境向けの包括的ログ記録システムです。構造化ログ、CloudWatch統合、セキュリティ監視、パフォーマンス追跡を提供します。

## アーキテクチャ

### 1. Production Logger Core (`server/utils/production-logger.js`)

**機能**:

- 構造化JSON ログ出力
- ログレベル制御 (debug, info, warn, error)
- CloudWatch統合対応
- パフォーマンス最適化（バッファリング）
- Lambda環境自動検出

**主要メソッド**:

```javascript
logger.info('メッセージ', { metadata });
logger.error('エラー', { error, stack });
logger.security('セキュリティイベント', { details });
logger.performance('操作名', duration, { metrics });
logger.business('ビジネスイベント', { data });
```

### 2. Express Middleware (`server/middleware/logging.js`)

**ミドルウェア一覧**:

- `httpLoggingMiddleware()` - HTTPリクエスト/レスポンス記録
- `securityLoggingMiddleware()` - セキュリティ脅威検出
- `authLoggingMiddleware()` - 認証イベント記録
- `performanceLoggingMiddleware()` - パフォーマンス監視
- `errorLoggingMiddleware()` - エラーハンドリング

### 3. CloudWatch監視 (`cdk/lib/monitoring-enhanced-stack.ts`)

**監視機能**:

- Lambda関数メトリクス（持続時間、エラー率、スロットル）
- アプリケーションログ分析（エラー、警告、セキュリティイベント）
- カスタムメトリクス（パフォーマンス、ユーザー活動）
- セキュリティ監視（認証失敗、疑わしいリクエスト）
- モバイルパフォーマンス（FPS、メモリ使用量、タッチレイテンシ）

## 設定

### 環境変数

```bash
# ログレベル設定
LOG_LEVEL=info  # debug, info, warn, error

# CloudWatch統合
ENABLE_CLOUDWATCH_LOGS=true
ENABLE_CLOUDWATCH_METRICS=true
CLOUDWATCH_LOG_GROUP=/aws/lambda/lightningtalk-circle-prod
CLOUDWATCH_NAMESPACE=LightningTalkCircle/Application

# パフォーマンス最適化
LOG_BUFFER_ENABLED=true
LOG_BUFFER_INTERVAL=5000  # 5秒
LOG_BUFFER_SIZE=100

# サービス識別
SERVICE_NAME=lightningtalk-circle
```

### Lambda Handler Integration

```javascript
// ES Module (lambda-handler.mjs)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const logger = require('./utils/production-logger.js');

// CommonJS (lambda-handler.cjs)
const logger = require('./utils/production-logger');
```

## 使用方法

### 1. 基本ログ記録

```javascript
// 情報ログ
logger.info('ユーザーログイン成功', {
  userId: 'user-123',
  ip: '192.168.1.1'
});

// エラーログ
logger.error('データベース接続失敗', {
  error: error.message,
  stack: error.stack,
  operation: 'user-lookup'
});
```

### 2. セキュリティイベント

```javascript
// 認証失敗
logger.security('認証失敗', {
  email: 'user@example.com',
  ip: req.ip,
  userAgent: req.get('User-Agent')
});

// 疑わしいリクエスト
logger.security('疑わしいリクエスト検出', {
  pattern: 'XSS attempt',
  url: req.url,
  payload: req.body
});
```

### 3. パフォーマンス監視

```javascript
const startTime = Date.now();
// 処理実行
const duration = Date.now() - startTime;

logger.performance('データベースクエリ', duration, {
  table: 'events',
  operation: 'select',
  rowCount: results.length
});
```

### 4. ビジネスメトリクス

```javascript
logger.business('イベント登録', {
  eventId: 'event-123',
  userId: 'user-456',
  registrationType: 'online'
});
```

### 5. Lambda固有ログ

```javascript
export const lambdaHandler = async (event, context) => {
  try {
    // 処理
    logger.lambda(event, context, result);
  } catch (error) {
    logger.lambda(event, context, null, error);
  }
};
```

## CloudWatch統合

### 1. ログストリーム構造

```
/aws/lambda/lightningtalk-circle-prod
├── [RequestId] Lambda実行ログ
├── structured-logs/
│   ├── application.log
│   ├── security.log
│   └── performance.log
```

### 2. メトリクスフィルター

**エラーカウント**:

```
[$.level = "ERROR"]
```

**セキュリティイベント**:

```
[$.securityEvent EXISTS]
```

**パフォーマンス警告**:

```
[$.level = "WARN" && $.operation EXISTS]
```

### 3. カスタムメトリクス

- `LightningTalkCircle/Application/ErrorCount`
- `LightningTalkCircle/Security/SecurityEventCount`
- `LightningTalkCircle/Performance/RequestDuration`
- `LightningTalkCircle/Business/UserActivity`

## アラート設定

### 1. 重要度別アラート

**Critical** (即座に対応が必要):

- Lambda関数エラー率 > 5%
- セキュリティイベント検出
- 認証失敗 > 5回/分

**Warning** (監視が必要):

- レスポンス時間 > 2秒
- メモリ使用量 > 100MB
- モバイルFPS < 30

**Info** (情報として):

- 新規ユーザー登録
- イベント作成
- パフォーマンス改善

### 2. SNS通知設定

```typescript
// CDKでのアラート設定例
const highErrorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
  metric: errorCountMetric,
  threshold: 10,
  evaluationPeriods: 2
});

highErrorRateAlarm.addAlarmAction(new cloudwatch.SnsAction(alertTopic));
```

## セキュリティ考慮事項

### 1. 機密情報のマスキング

```javascript
// 自動マスキング
logger.security('ログイン試行', {
  email: email?.substring(0, 3) + '***', // 部分マスク
  ip: req.ip
});
```

### 2. ログアクセス制御

- CloudWatch Logs: IAM権限による制御
- 本番ログ: 管理者のみアクセス可能
- 開発ログ: 開発チームアクセス可能

### 3. データ保持ポリシー

- 本番環境: 1ヶ月間保持
- 開発環境: 1週間保持
- セキュリティログ: 3ヶ月間保持

## パフォーマンス最適化

### 1. ログバッファリング

```javascript
// 高頻度ログの最適化
LOG_BUFFER_ENABLED = true; // バッファリング有効
LOG_BUFFER_INTERVAL = 5000; // 5秒間隔でフラッシュ
LOG_BUFFER_SIZE = 100; // 100件でフラッシュ
```

### 2. 非同期ログ記録

```javascript
// 非ブロッキングログ
logger.info('処理完了', metadata); // 即座にreturn
// CloudWatchへの送信は別スレッドで実行
```

### 3. ログレベル制御

```javascript
// 本番環境では不要なデバッグログを自動除外
if (logger.enabledLevels.includes('debug')) {
  logger.debug('詳細デバッグ情報', largeObject);
}
```

## トラブルシューティング

### 1. ログが表示されない

**確認項目**:

- `LOG_LEVEL`環境変数の設定
- CloudWatch IAM権限
- ログバッファリング設定

**デバッグ**:

```javascript
// ローカルテスト
logger.debug('テストログ', { test: true });
console.log('Logger enabled levels:', logger.enabledLevels);
```

### 2. CloudWatch統合エラー

**確認項目**:

- AWS認証情報
- CloudWatch Logs権限
- ロググループ存在確認

**解決方法**:

```bash
# AWS CLI での確認
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/lightningtalk"
```

### 3. パフォーマンス問題

**確認項目**:

- ログバッファリング設定
- 大きなオブジェクトのログ記録
- 高頻度ログの最適化

**最適化**:

```javascript
// 大きなオブジェクトの場合
logger.info('大きなデータ処理', {
  dataSize: data.length,
  summary: data.slice(0, 10) // サマリーのみログ
});
```

## 移行ガイド

### console.log からの移行

**Before**:

```javascript
console.log('User login:', { email });
console.error('Database error:', error);
```

**After**:

```javascript
logger.info('User login', { email });
logger.error('Database error', { error: error.message, stack: error.stack });
```

### 段階的移行

1. **Phase 1**: Production Logger導入
2. **Phase 2**: console.log文置換
3. **Phase 3**: CloudWatch統合
4. **Phase 4**: アラート設定
5. **Phase 5**: ダッシュボード構築

## ベストプラクティス

### 1. ログメッセージ設計

```javascript
// Good: 明確で検索可能
logger.info('User authentication successful', {
  userId: user.id,
  method: 'google-oauth',
  ip: req.ip
});

// Bad: 曖昧で検索困難
logger.info('User logged in');
```

### 2. エラーハンドリング

```javascript
try {
  // 処理
} catch (error) {
  logger.error('Operation failed', {
    operation: 'user-creation',
    error: error.message,
    stack: error.stack,
    input: { ...sanitizedInput }
  });
  throw error;
}
```

### 3. メタデータ設計

```javascript
// 構造化されたメタデータ
logger.business('Event registration', {
  event: {
    id: eventId,
    title: event.title,
    date: event.date
  },
  user: {
    id: userId,
    type: 'member'
  },
  registration: {
    type: 'online',
    timestamp: new Date().toISOString()
  }
});
```

## 関連ドキュメント

- [CloudWatch Logs ユーザーガイド](https://docs.aws.amazon.com/cloudwatch/latest/logs/WhatIsCloudWatchLogs.html)
- [AWS Lambda ログ記録](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-logging.html)
- [Express.js ミドルウェア](https://expressjs.com/en/guide/using-middleware.html)
- [セキュリティ監視ベストプラクティス](./security/monitoring-best-practices.md)
