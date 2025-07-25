# トラブルシューティングガイド

## 目次

1. [一般的な問題](#一般的な問題)
2. [開発環境の問題](#開発環境の問題)
3. [本番環境の問題](#本番環境の問題)
4. [パフォーマンスの問題](#パフォーマンスの問題)
5. [セキュリティの問題](#セキュリティの問題)
6. [デバッグツール](#デバッグツール)

## 一般的な問題

### ポート競合

**症状**: `Error: listen EADDRINUSE: address already in use :::3000`

**解決方法**:
```bash
# 使用中のポートを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または別のポートで起動
PORT=3001 npm run dev
```

### 依存関係エラー

**症状**: `npm ERR! peer dep missing`

**解決方法**:
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# または npm 7以上の場合
npm install --legacy-peer-deps
```

### ES Modules エラー

**症状**: `SyntaxError: Cannot use import statement outside a module`

**解決方法**:
```bash
# ES Modulesサポートを有効化
NODE_OPTIONS='--experimental-vm-modules' npm test

# またはpackage.jsonに追加
"type": "module"
```

## 開発環境の問題

### Docker権限エラー

**症状**: `permission denied while trying to connect to the Docker daemon socket`

**解決方法**:
```bash
# Dockerグループに追加
sudo usermod -aG docker $USER

# 再ログインまたは
newgrp docker

# 権限の初期化
./scripts/docker-dev.sh init
```

### データベース接続エラー

**症状**: `ECONNREFUSED 127.0.0.1:5432`

**解決方法**:
```bash
# PostgreSQLが起動しているか確認
docker ps | grep postgres

# コンテナを再起動
docker-compose restart postgres

# または環境変数を確認
echo $DATABASE_URL
```

### ホットリロードが動作しない

**症状**: ファイル変更が反映されない

**解決方法**:
```bash
# nodemonの設定を確認
cat nodemon.json

# ファイルシステムの監視制限を増やす
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 本番環境の問題

### AWS認証エラー

**症状**: `UnauthorizedError: Missing credentials`

**解決方法**:
```bash
# AWS認証情報を確認
aws sts get-caller-identity

# 環境変数を設定
export AWS_PROFILE=production
export AWS_REGION=ap-northeast-1

# またはIAMロールを確認
aws iam get-role --role-name lightningtalk-app-role
```

### CloudFrontキャッシュ問題

**症状**: 更新が反映されない

**解決方法**:
```bash
# キャッシュを無効化
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

# または特定のパスのみ
--paths "/index.html" "/css/*" "/js/*"
```

### DynamoDB容量エラー

**症状**: `ProvisionedThroughputExceededException`

**解決方法**:
```bash
# 現在の容量を確認
aws dynamodb describe-table --table-name Events

# オートスケーリングを有効化
aws application-autoscaling register-scalable-target \
  --service-namespace dynamodb \
  --resource-id "table/Events" \
  --scalable-dimension "dynamodb:table:WriteCapacityUnits" \
  --min-capacity 5 \
  --max-capacity 500
```

## パフォーマンスの問題

### 遅いAPI応答

**診断**:
```javascript
// パフォーマンス測定ミドルウェア
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```

**最適化**:
1. データベースクエリの最適化
2. Redis キャッシングの実装
3. N+1クエリの解消
4. インデックスの追加

### メモリリーク

**診断**:
```bash
# Node.jsヒープダンプ
node --inspect server.js
# Chrome DevToolsで chrome://inspect にアクセス

# またはプロセスメモリを監視
npm install clinic -g
clinic doctor -- node server.js
```

**対策**:
- イベントリスナーの適切な削除
- 大きなオブジェクトの参照解放
- ストリームの適切なクローズ

### 高CPU使用率

**診断**:
```bash
# CPU プロファイリング
node --prof server.js
# プロファイル結果を分析
node --prof-process isolate-*.log > profile.txt
```

**対策**:
- 重い計算処理のWorker Thread化
- 非効率なループの最適化
- 正規表現の最適化

## セキュリティの問題

### CORS エラー

**症状**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**解決方法**:
```javascript
// CORS設定を確認
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### JWT検証エラー

**症状**: `JsonWebTokenError: invalid signature`

**解決方法**:
1. JWT_SECRETが環境間で一致しているか確認
2. トークンの有効期限を確認
3. トークンの形式を確認（Bearer prefix）

### レート制限エラー

**症状**: `429 Too Many Requests`

**解決方法**:
```javascript
// レート制限の設定を調整
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // リクエスト数
  skipSuccessfulRequests: true // 成功したリクエストはカウントしない
});
```

## デバッグツール

### ログ分析

```bash
# エラーログの抽出
grep ERROR logs/app.log | tail -100

# 特定のユーザーの活動を追跡
grep "userId:12345" logs/app.log

# レスポンス時間の分析
awk '/Response time:/ {sum+=$3; count++} END {print sum/count}' logs/app.log
```

### API テスト

```bash
# cURL でAPIテスト
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# HTTPie でより見やすく
http POST localhost:3000/api/auth/login \
  email=test@example.com \
  password=password
```

### データベース診断

```bash
# DynamoDB テーブルスキャン
aws dynamodb scan \
  --table-name Events \
  --filter-expression "attribute_exists(#s)" \
  --expression-attribute-names '{"#s":"status"}'

# クエリパフォーマンス
aws dynamodb query \
  --table-name Events \
  --key-condition-expression "eventId = :id" \
  --expression-attribute-values '{":id":{"S":"event-123"}}' \
  --return-consumed-capacity TOTAL
```

## 緊急時の対応

### サービス停止時

1. **ヘルスチェック確認**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **ログ確認**
   ```bash
   tail -f logs/error.log
   ```

3. **サービス再起動**
   ```bash
   pm2 restart all
   # または
   docker-compose restart
   ```

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
