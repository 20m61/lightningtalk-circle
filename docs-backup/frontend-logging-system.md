# Frontend Structured Logging System

フロントエンド構造化ログシステムは、バックエンドの本番ログシステムと連携し、統一されたログ管理を提供するクライアントサイドログソリューションです。

## 概要

### 主要機能

- **構造化ログ**: JSON形式の構造化ログエントリ
- **環境別ログレベル**: 開発・本番環境での適切なログレベル管理
- **サーバー送信**: バックエンドAPIを通じたログの中央集約
- **ローカルバッファリング**: オフライン対応とパフォーマンス最適化
- **自動エラーキャッチ**: 未処理エラーとPromise拒否の自動ログ記録
- **セキュリティ保護**: 機密情報の自動マスキング
- **ユーザーアクション追跡**: ユーザー行動とビジネスイベントのログ

### バックエンド統合

フロントエンドログは `/api/logs/frontend`
エンドポイントを通じてバックエンドに送信され、本番ログシステムと統合されます。

## 使用方法

### 基本的なセットアップ

```html
<!-- HTMLヘッドセクションに設定 -->
<meta name="environment" content="development" />
<meta name="api-endpoint" content="/api" />
<script>
  window.APP_CONFIG = {
    environment: 'development',
    apiEndpoint: '/api',
    enableLogging: true
  };
</script>

<!-- ロガースクリプトの読み込み（他のスクリプトより先に） -->
<script src="js/logger.js"></script>
```

### ログレベル別の使用

```javascript
// Logger インスタンスを取得
const logger = window.Logger;

// 基本的なログレベル
logger.debug('デバッグメッセージ', { key: 'value' });
logger.info('情報メッセージ', { userId: 123 });
logger.warn('警告メッセージ', { issue: 'performance' });
logger.error('エラーメッセージ', { error: error.message, stack: error.stack });
```

### 特殊ログメソッド

```javascript
// ユーザーアクション
logger.userAction('button_click', { buttonId: 'submit', page: 'registration' });

// パフォーマンス測定
logger.performance('api_call', 250, { endpoint: '/api/events', method: 'GET' });

// APIコール
logger.apiCall('POST', '/api/participants', 320, 201, { bodySize: 1024 });

// ナビゲーション
logger.navigation('/home', '/events', { trigger: 'user_click' });
```

### クラス内での使用例

```javascript
class EventManager {
  constructor() {
    this.logger = window.Logger;
  }

  async loadEvents() {
    try {
      this.logger.info('Loading events', { category: 'event_management' });
      const events = await this.fetchEvents();
      this.logger.business('Events loaded successfully', {
        count: events.length
      });
      return events;
    } catch (error) {
      this.logger.error('Failed to load events', {
        error: error.message,
        stack: error.stack,
        category: 'event_management'
      });
      throw error;
    }
  }
}
```

## 設定オプション

### 環境変数（LocalStorage）

```javascript
// ログレベルの設定
localStorage.setItem('LOG_LEVEL', 'debug'); // debug, info, warn, error

// バッファリング設定
localStorage.setItem('LOG_BUFFER_ENABLED', 'true');
localStorage.setItem('LOG_BUFFER_SIZE', '50');
localStorage.setItem('LOG_BUFFER_INTERVAL', '10000'); // 10秒

// サーバー送信設定
localStorage.setItem('SEND_LOGS_TO_SERVER', 'true');
```

### URL パラメータ（一時的なオーバーライド）

```
http://localhost:3000/?logLevel=debug
```

## ログエントリ構造

### 基本構造

```json
{
  "timestamp": "2024-07-18T12:00:00.000Z",
  "level": "INFO",
  "message": "User registration completed",
  "sessionId": "fe_1721304000000_abc123def",
  "userId": "user123",
  "environment": "production",
  "url": "https://example.com/register",
  "userAgent": "Mozilla/5.0...",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "category": "user_action",
  "customField": "customValue"
}
```

### 専用フィールド

- `timestamp`: ISO 8601形式のタイムスタンプ
- `level`: ログレベル（DEBUG, INFO, WARN, ERROR）
- `sessionId`: セッション識別子
- `userId`: ユーザー識別子（設定されている場合）
- `url`: 現在のページURL
- `userAgent`: ブラウザ情報
- `viewport`: ビューポートサイズ
- `category`: ログカテゴリ（任意）

## バッファリングとオフライン対応

### バッファリング機能

- **有効条件**: `LOG_BUFFER_ENABLED=true` または本番環境
- **バッファサイズ**: デフォルト50エントリ
- **フラッシュ間隔**: デフォルト10秒
- **自動フラッシュ**: バッファサイズ上限時

### オフライン対応

```javascript
// ネットワーク状態の監視
window.addEventListener('online', () => {
  logger.info('Network connection restored');
  // バッファされたログが自動送信される
});

window.addEventListener('offline', () => {
  logger.warn('Network connection lost, logs will be buffered');
});
```

## セキュリティ機能

### 機密情報の自動マスキング

```javascript
// 自動的にマスキングされるフィールド
const sensitiveData = {
  password: 'secret123', // → '***masked***'
  token: 'abc123', // → '***masked***'
  creditCard: '1234-5678' // → '***masked***'
};

logger.info('User data', sensitiveData);
```

### 機密パターンの検出

- `password`、`token`、`secret`、`key`、`auth` を含むフィールド
- URLクエリパラメータ内の機密情報
- メッセージ内の機密パターン

## パフォーマンス最適化

### ログレベルによるフィルタリング

```javascript
// 本番環境では warn レベル以上のみ出力
// 開発環境では debug レベルから出力
```

### バッチ送信

- ログエントリをバッファに蓄積
- 定期的なバッチ送信でHTTPオーバーヘッドを削減
- ページアンロード時の同期送信（`navigator.sendBeacon`）

### ローカルストレージ管理

```javascript
// 日別ログの自動管理
// 7日以上古いログの自動削除
// 最新100件のみ保持
```

## デバッグとトラブルシューティング

### ローカルログの確認

```javascript
// 本日のログを取得
const todayLogs = logger.getStoredLogs();

// 過去3日のログをエクスポート
const recentLogs = logger.exportLogs(3);

// ローカルログのクリア
logger.clearLogs();
```

### ログ送信状況の確認

```javascript
// バッファ状況の確認
console.log('Buffer size:', logger.buffer.length);

// 手動フラッシュ
logger.flushBuffer();
```

## API エンドポイント

### フロントエンドログ受信

**POST** `/api/logs/frontend`

```json
{
  "logs": [
    {
      "timestamp": "2024-07-18T12:00:00.000Z",
      "level": "INFO",
      "message": "User action",
      "sessionId": "fe_123_abc",
      "userId": "user123"
      // ... その他のフィールド
    }
  ]
}
```

**レスポンス**:

```json
{
  "message": "Logs processed successfully",
  "processed": 5,
  "errors": 0
}
```

### ヘルスチェック

**GET** `/api/logs/frontend/health`

```json
{
  "status": "healthy",
  "service": "frontend-logs-api",
  "timestamp": "2024-07-18T12:00:00.000Z"
}
```

## エラーハンドリング

### 自動エラーキャッチ

```javascript
// 未処理エラーの自動ログ
window.addEventListener('error', event => {
  logger.error('Uncaught error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

// Promise拒否の自動ログ
window.addEventListener('unhandledrejection', event => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    stack: event.reason?.stack
  });
});
```

### 循環参照の処理

```javascript
const circular = { name: 'test' };
circular.self = circular;

// 循環参照を安全に処理
logger.info('Circular test', { circular }); // → '[Circular Reference]'
```

## 統合例

### 既存システムとの統合

```javascript
// main.js での例
class LightningTalkApp {
  constructor() {
    this.logger = window.Logger;
  }

  async registerParticipant(data) {
    try {
      this.logger.business('Registration started', { email: data.email });
      const result = await this.apiCall('/api/participants', data);
      this.logger.business('Registration successful', {
        participantId: result.id
      });
      return result;
    } catch (error) {
      this.logger.error('Registration failed', {
        error: error.message,
        email: data.email,
        category: 'registration'
      });
      throw error;
    }
  }
}
```

### React コンポーネントでの使用

```javascript
const EventRegistration = () => {
  const logger = window.Logger;

  const handleSubmit = async formData => {
    logger.userAction('form_submit', { form: 'event_registration' });

    try {
      const result = await submitRegistration(formData);
      logger.business('Registration completed', { eventId: result.eventId });
    } catch (error) {
      logger.error('Registration error', { error: error.message });
    }
  };

  return <form onSubmit={handleSubmit}>{/* フォーム内容 */}</form>;
};
```

## 本番環境での考慮事項

### ログレベル設定

- **本番環境**: `warn` レベル以上を推奨
- **ステージング環境**: `info` レベル
- **開発環境**: `debug` レベル

### プライバシー保護

- ユーザーの個人情報は自動マスキング
- IPアドレスやユーザーエージェントは制限付きで記録
- GDPR準拠のデータ保持期間設定

### パフォーマンス影響

- ログオーバーヘッドは最小限（< 1ms per log）
- バッファリングによるHTTPリクエスト削減
- ローカルストレージ使用量の自動管理

## トラブルシューティング

### よくある問題

1. **ログが送信されない**
   - ネットワーク接続を確認
   - `SEND_LOGS_TO_SERVER` 設定を確認
   - APIエンドポイントのアクセス可能性を確認

2. **バッファがフラッシュされない**
   - `LOG_BUFFER_ENABLED` 設定を確認
   - ブラウザのネットワークタブでAPI呼び出しを確認

3. **ログレベルが適用されない**
   - `LOG_LEVEL` 設定を確認
   - ページリロード後に設定が反映されることを確認

### デバッグ手順

```javascript
// 1. Logger インスタンスの確認
console.log('Logger available:', !!window.Logger);

// 2. 設定の確認
console.log('Log level:', logger.logLevel);
console.log('Environment:', logger.environment);

// 3. バッファ状況の確認
console.log('Buffer size:', logger.buffer.length);
console.log('Buffer enabled:', logger.bufferEnabled);

// 4. 手動ログテスト
logger.info('Test log', { test: true });
```

## まとめ

フロントエンド構造化ログシステムは、本番環境での問題特定とユーザー行動分析を大幅に改善します。バックエンドログシステムとの統合により、フルスタックでの統一されたログ管理が実現され、開発効率とサービス品質の向上に貢献します。
