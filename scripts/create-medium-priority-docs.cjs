#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple color functions
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// 中優先度ドキュメントの定義
const mediumPriorityDocs = [
  {
    path: 'docs/monitoring/MONITORING-SETUP.md',
    title: 'Lightning Talk Circle 監視設定ガイド',
    content: `# Lightning Talk Circle 監視設定ガイド

## 概要

このガイドでは、Lightning Talk Circleアプリケーションの監視とアラート設定について説明します。

## CloudWatch統合

### 必要な設定

\`\`\`env
# CloudWatch設定
ENABLE_CLOUDWATCH_LOGS=true
ENABLE_CLOUDWATCH_METRICS=true
CLOUDWATCH_LOG_GROUP=/aws/ecs/lightningtalk-circle
CLOUDWATCH_NAMESPACE=LightningTalkCircle/Application
MONITORING_ENABLED=true
MONITORING_INTERVAL=30000
\`\`\`

### ログ設定

#### アプリケーションログ

\`\`\`javascript
// server/services/cloudWatchService.js
const cloudWatchLogs = new AWS.CloudWatchLogs({
  region: process.env.AWS_REGION || 'ap-northeast-1'
});

// ログストリーム作成
await cloudWatchLogs.createLogStream({
  logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
  logStreamName: \`\${process.env.NODE_ENV}-\${Date.now()}\`
}).promise();
\`\`\`

### メトリクス設定

#### カスタムメトリクス

- **API呼び出し回数**
- **レスポンス時間**
- **エラー率**
- **同時接続数**
- **登録数**

\`\`\`javascript
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
\`\`\`

## アラーム設定

### 重要なアラーム

#### 1. CPU使用率
\`\`\`yaml
AlarmName: HighCPUUtilization
MetricName: CPUUtilization
Threshold: 80
ComparisonOperator: GreaterThanThreshold
EvaluationPeriods: 2
Period: 300
\`\`\`

#### 2. メモリ使用率
\`\`\`yaml
AlarmName: HighMemoryUtilization
MetricName: MemoryUtilization
Threshold: 85
ComparisonOperator: GreaterThanThreshold
EvaluationPeriods: 2
Period: 300
\`\`\`

#### 3. エラー率
\`\`\`yaml
AlarmName: HighErrorRate
MetricName: ErrorRate
Threshold: 1
ComparisonOperator: GreaterThanThreshold
EvaluationPeriods: 1
Period: 300
\`\`\`

#### 4. レスポンス時間
\`\`\`yaml
AlarmName: SlowResponseTime
MetricName: ResponseTime
Threshold: 1000
ComparisonOperator: GreaterThanThreshold
EvaluationPeriods: 2
Period: 300
Unit: Milliseconds
\`\`\`

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

\`\`\`bash
# CDKでダッシュボードを作成
npm run cdk:deploy:monitoring
\`\`\`

## ログ分析

### CloudWatch Insights クエリ

#### エラーログ検索
\`\`\`sql
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
\`\`\`

#### 遅いAPIリクエスト
\`\`\`sql
fields @timestamp, method, path, responseTime
| filter responseTime > 1000
| sort responseTime desc
| limit 50
\`\`\`

#### ユーザーアクティビティ
\`\`\`sql
fields @timestamp, userId, action
| filter action in ["login", "register", "createEvent"]
| stats count() by action
\`\`\`

## 外部監視ツール連携

### Datadog連携（オプション）

\`\`\`javascript
// Datadog APM設定
const tracer = require('dd-trace').init({
  env: process.env.NODE_ENV,
  service: 'lightningtalk-circle',
  version: process.env.APP_VERSION
});
\`\`\`

### PagerDuty連携（オプション）

CloudWatchアラームからSNS経由でPagerDutyに通知：

1. SNSトピック作成
2. PagerDuty統合エンドポイント設定
3. CloudWatchアラームでSNSトピックを指定

## ローカル開発での監視

### ローカルメトリクス表示

\`\`\`bash
# 監視ダッシュボードにアクセス
open http://localhost:3000/api/monitoring/dashboard
\`\`\`

### ログ出力設定

\`\`\`javascript
// 開発環境用ログ設定
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
\`\`\`

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
`
  },
  {
    path: 'docs/security/SECURITY-POLICY.md',
    title: 'セキュリティポリシー',
    content: `# セキュリティポリシー

## サポートされているバージョン

以下のバージョンに対してセキュリティアップデートを提供しています：

| バージョン | サポート状況 |
| ------- | ------------------ |
| 1.8.x   | :white_check_mark: |
| 1.7.x   | :white_check_mark: |
| 1.6.x   | :x:                |
| < 1.6   | :x:                |

## 脆弱性の報告

Lightning Talk Circleプロジェクトのセキュリティを向上させるため、脆弱性の報告を歓迎します。

### 報告方法

1. **報告先**: security@lightningtalk.example.com
2. **暗号化**: 可能であればPGP暗号化を使用してください
3. **必要情報**:
   - 脆弱性の詳細な説明
   - 再現手順
   - 影響範囲
   - 可能であれば修正案

### 対応プロセス

1. **初回応答**: 48時間以内
2. **問題確認**: 7日以内
3. **修正リリース**: 重要度に応じて14-30日以内

## セキュリティ基準

### 認証・認可

- **パスワードポリシー**
  - 最小8文字
  - 大文字・小文字・数字・記号を含む
  - 過去3回のパスワードの再利用禁止

- **セッション管理**
  - JWT有効期限: 24時間
  - リフレッシュトークン: 7日間
  - 非アクティブタイムアウト: 30分

### データ保護

- **暗号化**
  - 通信: TLS 1.2以上
  - 保存: AWS KMS（AES-256）
  - パスワード: bcrypt（ラウンド数: 10）

- **データ分類**
  - 機密: 個人情報、認証情報
  - 内部: イベント情報、統計
  - 公開: 公開イベント情報

### アクセス制御

- **最小権限の原則**
- **役割ベースアクセス制御（RBAC）**
  - 管理者
  - イベント主催者
  - 参加者
  - ゲスト

### 入力検証

- **サーバーサイド検証必須**
- **SQLインジェクション対策**
- **XSS対策（DOMPurify使用）**
- **CSRFトークン**

## セキュリティチェックリスト

### 開発時

- [ ] 依存関係の脆弱性スキャン（npm audit）
- [ ] コードの静的解析
- [ ] セキュリティヘッダーの確認
- [ ] 認証・認可のテスト

### デプロイ前

- [ ] セキュリティテストの実行
- [ ] ペネトレーションテスト（年1回）
- [ ] SSL/TLS設定の確認
- [ ] ログ設定の確認

### 運用時

- [ ] セキュリティパッチの適用
- [ ] ログの定期監査
- [ ] アクセスパターンの監視
- [ ] インシデント対応訓練

## インシデント対応

### 優先度レベル

1. **Critical**: 即座に対応
   - データ漏洩
   - システム侵害
   - サービス停止

2. **High**: 24時間以内
   - 認証バイパス
   - 権限昇格

3. **Medium**: 7日以内
   - XSS脆弱性
   - 情報漏洩（低リスク）

4. **Low**: 次回リリース
   - ベストプラクティス違反
   - 設定の改善

### 対応手順

1. **検知と分析**
2. **封じ込めと根絶**
3. **復旧**
4. **事後分析**

## コンプライアンス

### 準拠基準

- OWASP Top 10
- CIS Controls
- NIST Cybersecurity Framework

### プライバシー

- 個人情報保護法準拠
- データ最小化原則
- 利用目的の明確化
- 同意に基づく処理

## セキュリティ連絡先

- **一般的な質問**: security@lightningtalk.example.com
- **緊急連絡**: security-urgent@lightningtalk.example.com
- **PGP Key**: https://lightningtalk.example.com/pgp-key.asc

## 更新履歴

- 2025-07-25: 初版作成
- 2025-07-01: パスワードポリシー更新
- 2025-06-15: インシデント対応手順追加
`
  },
  {
    path: 'docs/guides/troubleshooting.md',
    title: 'トラブルシューティングガイド',
    content: `# トラブルシューティングガイド

## 目次

1. [一般的な問題](#一般的な問題)
2. [開発環境の問題](#開発環境の問題)
3. [本番環境の問題](#本番環境の問題)
4. [パフォーマンスの問題](#パフォーマンスの問題)
5. [セキュリティの問題](#セキュリティの問題)
6. [デバッグツール](#デバッグツール)

## 一般的な問題

### ポート競合

**症状**: \`Error: listen EADDRINUSE: address already in use :::3000\`

**解決方法**:
\`\`\`bash
# 使用中のポートを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または別のポートで起動
PORT=3001 npm run dev
\`\`\`

### 依存関係エラー

**症状**: \`npm ERR! peer dep missing\`

**解決方法**:
\`\`\`bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# または npm 7以上の場合
npm install --legacy-peer-deps
\`\`\`

### ES Modules エラー

**症状**: \`SyntaxError: Cannot use import statement outside a module\`

**解決方法**:
\`\`\`bash
# ES Modulesサポートを有効化
NODE_OPTIONS='--experimental-vm-modules' npm test

# またはpackage.jsonに追加
"type": "module"
\`\`\`

## 開発環境の問題

### Docker権限エラー

**症状**: \`permission denied while trying to connect to the Docker daemon socket\`

**解決方法**:
\`\`\`bash
# Dockerグループに追加
sudo usermod -aG docker $USER

# 再ログインまたは
newgrp docker

# 権限の初期化
./scripts/docker-dev.sh init
\`\`\`

### データベース接続エラー

**症状**: \`ECONNREFUSED 127.0.0.1:5432\`

**解決方法**:
\`\`\`bash
# PostgreSQLが起動しているか確認
docker ps | grep postgres

# コンテナを再起動
docker-compose restart postgres

# または環境変数を確認
echo $DATABASE_URL
\`\`\`

### ホットリロードが動作しない

**症状**: ファイル変更が反映されない

**解決方法**:
\`\`\`bash
# nodemonの設定を確認
cat nodemon.json

# ファイルシステムの監視制限を増やす
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
\`\`\`

## 本番環境の問題

### AWS認証エラー

**症状**: \`UnauthorizedError: Missing credentials\`

**解決方法**:
\`\`\`bash
# AWS認証情報を確認
aws sts get-caller-identity

# 環境変数を設定
export AWS_PROFILE=production
export AWS_REGION=ap-northeast-1

# またはIAMロールを確認
aws iam get-role --role-name lightningtalk-app-role
\`\`\`

### CloudFrontキャッシュ問題

**症状**: 更新が反映されない

**解決方法**:
\`\`\`bash
# キャッシュを無効化
aws cloudfront create-invalidation \\
  --distribution-id YOUR_DISTRIBUTION_ID \\
  --paths "/*"

# または特定のパスのみ
--paths "/index.html" "/css/*" "/js/*"
\`\`\`

### DynamoDB容量エラー

**症状**: \`ProvisionedThroughputExceededException\`

**解決方法**:
\`\`\`bash
# 現在の容量を確認
aws dynamodb describe-table --table-name Events

# オートスケーリングを有効化
aws application-autoscaling register-scalable-target \\
  --service-namespace dynamodb \\
  --resource-id "table/Events" \\
  --scalable-dimension "dynamodb:table:WriteCapacityUnits" \\
  --min-capacity 5 \\
  --max-capacity 500
\`\`\`

## パフォーマンスの問題

### 遅いAPI応答

**診断**:
\`\`\`javascript
// パフォーマンス測定ミドルウェア
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`\${req.method} \${req.path} - \${duration}ms\`);
  });
  next();
});
\`\`\`

**最適化**:
1. データベースクエリの最適化
2. Redis キャッシングの実装
3. N+1クエリの解消
4. インデックスの追加

### メモリリーク

**診断**:
\`\`\`bash
# Node.jsヒープダンプ
node --inspect server.js
# Chrome DevToolsで chrome://inspect にアクセス

# またはプロセスメモリを監視
npm install clinic -g
clinic doctor -- node server.js
\`\`\`

**対策**:
- イベントリスナーの適切な削除
- 大きなオブジェクトの参照解放
- ストリームの適切なクローズ

### 高CPU使用率

**診断**:
\`\`\`bash
# CPU プロファイリング
node --prof server.js
# プロファイル結果を分析
node --prof-process isolate-*.log > profile.txt
\`\`\`

**対策**:
- 重い計算処理のWorker Thread化
- 非効率なループの最適化
- 正規表現の最適化

## セキュリティの問題

### CORS エラー

**症状**: \`Access to fetch at '...' from origin '...' has been blocked by CORS policy\`

**解決方法**:
\`\`\`javascript
// CORS設定を確認
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
\`\`\`

### JWT検証エラー

**症状**: \`JsonWebTokenError: invalid signature\`

**解決方法**:
1. JWT_SECRETが環境間で一致しているか確認
2. トークンの有効期限を確認
3. トークンの形式を確認（Bearer prefix）

### レート制限エラー

**症状**: \`429 Too Many Requests\`

**解決方法**:
\`\`\`javascript
// レート制限の設定を調整
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // リクエスト数
  skipSuccessfulRequests: true // 成功したリクエストはカウントしない
});
\`\`\`

## デバッグツール

### ログ分析

\`\`\`bash
# エラーログの抽出
grep ERROR logs/app.log | tail -100

# 特定のユーザーの活動を追跡
grep "userId:12345" logs/app.log

# レスポンス時間の分析
awk '/Response time:/ {sum+=$3; count++} END {print sum/count}' logs/app.log
\`\`\`

### API テスト

\`\`\`bash
# cURL でAPIテスト
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password"}'

# HTTPie でより見やすく
http POST localhost:3000/api/auth/login \\
  email=test@example.com \\
  password=password
\`\`\`

### データベース診断

\`\`\`bash
# DynamoDB テーブルスキャン
aws dynamodb scan \\
  --table-name Events \\
  --filter-expression "attribute_exists(#s)" \\
  --expression-attribute-names '{"#s":"status"}'

# クエリパフォーマンス
aws dynamodb query \\
  --table-name Events \\
  --key-condition-expression "eventId = :id" \\
  --expression-attribute-values '{":id":{"S":"event-123"}}' \\
  --return-consumed-capacity TOTAL
\`\`\`

## 緊急時の対応

### サービス停止時

1. **ヘルスチェック確認**
   \`\`\`bash
   curl http://localhost:3000/api/health
   \`\`\`

2. **ログ確認**
   \`\`\`bash
   tail -f logs/error.log
   \`\`\`

3. **サービス再起動**
   \`\`\`bash
   pm2 restart all
   # または
   docker-compose restart
   \`\`\`

### データ復旧

1. **最新バックアップの確認**
2. **ポイントインタイムリカバリの実行**
3. **データ整合性の確認**

## サポート

解決できない問題がある場合：

1. [GitHub Issues](https://github.com/your-org/lightningtalk-circle/issues)
2. Slackサポートチャンネル: #lightningtalk-support
3. メール: support@lightningtalk.example.com

必要な情報：
- エラーメッセージ
- 再現手順
- 環境情報（OS、Node.jsバージョンなど）
- 関連するログ
`
  }
];

console.log(colors.bold('📚 中優先度ドキュメント作成'));
console.log(colors.gray('=' .repeat(60)));

let successCount = 0;
let errorCount = 0;

mediumPriorityDocs.forEach(doc => {
  try {
    const fullPath = path.join(process.cwd(), doc.path);
    const dir = path.dirname(fullPath);
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // ファイルを作成
    fs.writeFileSync(fullPath, doc.content);
    
    console.log(colors.green('✓') + ` ${doc.path}`);
    console.log(colors.gray(`  タイトル: ${doc.title}`));
    successCount++;
  } catch (error) {
    console.log(colors.red('✗') + ` ${doc.path}: ${error.message}`);
    errorCount++;
  }
});

console.log(colors.gray('=' .repeat(60)));
console.log(colors.bold(`📊 作成結果: ${colors.green(successCount + '個')}成功, ${colors.red(errorCount + '個')}エラー`));