# Lightning Talk Circle 開発者ガイド

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [開発環境のセットアップ](#開発環境のセットアップ)
3. [アーキテクチャ](#アーキテクチャ)
4. [開発ワークフロー](#開発ワークフロー)
5. [コーディング規約](#コーディング規約)
6. [テスト戦略](#テスト戦略)
7. [デバッグとトラブルシューティング](#デバッグとトラブルシューティング)
8. [デプロイメント](#デプロイメント)
9. [ベストプラクティス](#ベストプラクティス)

## プロジェクト概要

Lightning Talk Circleは、ライトニングトークイベントを管理するための包括的なWebアプリケーションです。複数のデプロイメントモードをサポートし、柔軟な運用が可能です。

### 主要機能

- イベント管理（作成、編集、公開）
- 参加者登録（オンライン/オフライン）
- トーク申し込みと管理
- リアルタイムチャット
- Google OAuth認証
- 管理者ダッシュボード
- メール通知
- GitHub統合

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- npm 8以上
- Git
- Docker（オプション）
- VS Code（推奨）

### クイックスタート

```bash
# リポジトリのクローン
git clone https://github.com/your-org/lightningtalk-circle.git
cd lightningtalk-circle

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定

# 開発サーバーの起動
npm run dev
```

### 環境変数の設定

必須の環境変数：

```env
# サーバー設定
NODE_ENV=development
PORT=3000

# データベース
DATABASE_TYPE=file  # または dynamodb

# 認証
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# GitHub統合（オプション）
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo
```

### Docker開発

```bash
# Docker環境の初期化
./scripts/docker-dev.sh init

# 開発環境の起動
./scripts/docker-dev.sh up

# コンテナ内でシェルを開く
./scripts/docker-dev.sh shell
```

### VS Code DevContainer

1. VS Codeで「Remote-Containers」拡張機能をインストール
2. プロジェクトを開き、「Reopen in Container」を選択
3. 自動的に開発環境が構築されます

## アーキテクチャ

### ディレクトリ構造

```
lightningtalk-circle/
├── public/              # 静的フロントエンド
│   ├── index.html      # メインページ
│   ├── css/            # スタイルシート
│   └── js/             # クライアントサイドJS
├── server/             # Express.jsバックエンド
│   ├── routes/         # APIエンドポイント
│   ├── services/       # ビジネスロジック
│   ├── middleware/     # Express ミドルウェア
│   └── models/         # データモデル
├── tests/              # テストファイル
│   ├── unit/          # ユニットテスト
│   ├── integration/   # 統合テスト
│   └── e2e/           # E2Eテスト
├── scripts/            # 自動化スクリプト
├── docs/               # ドキュメント
└── build-artifacts/    # ビルド成果物
```

### 技術スタック

#### フロントエンド
- Vanilla JavaScript（ES6+）
- CSS3（レスポンシブデザイン）
- Socket.io（リアルタイム通信）
- Google Maps API
- DOMPurify（XSS対策）

#### バックエンド
- Node.js + Express.js
- JWT認証
- express-validator（入力検証）
- Helmet.js（セキュリティ）
- AWS SDK（オプション）

#### データストレージ
- ファイルベース（開発環境）
- DynamoDB（本番環境）

#### インフラ
- AWS CDK
- Docker
- GitHub Actions

## 開発ワークフロー

### ブランチ戦略

```
main
├── develop
│   ├── feature/issue-123-add-feature
│   ├── bugfix/issue-456-fix-bug
│   └── hotfix/issue-789-critical-fix
```

### 新機能の開発

1. **イシュー作成**
   ```bash
   npm run create-issue
   ```

2. **フィーチャーブランチ作成**
   ```bash
   git checkout -b feature/issue-123-description
   ```

3. **開発とテスト**
   ```bash
   npm run dev
   npm test
   ```

4. **コミット**
   ```bash
   git add .
   git commit -m "feat: add new feature (#123)"
   ```

5. **プルリクエスト作成**
   ```bash
   gh pr create --title "Feature: Description" --body "Closes #123"
   ```

### コミットメッセージ規約

```
<type>(<scope>): <subject>

<body>

<footer>
```

タイプ：
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: その他

例：
```
feat(auth): add Google OAuth integration

- Implement Google OAuth flow
- Add user profile sync
- Update authentication middleware

Closes #123
```

## コーディング規約

### JavaScript

```javascript
// Good
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Bad
function calc(i) {
  var t = 0;
  for(var x = 0; x < i.length; x++) {
    t += i[x].price;
  }
  return t;
}
```

### 命名規則

- 変数・関数: camelCase
- 定数: UPPER_SNAKE_CASE
- クラス: PascalCase
- ファイル: kebab-case

### エラーハンドリング

```javascript
// Good
try {
  const result = await someAsyncOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed:', error);
  return { 
    success: false, 
    error: {
      code: 'OPERATION_FAILED',
      message: 'Operation could not be completed'
    }
  };
}
```

## テスト戦略

### テストピラミッド

- ユニットテスト: 70%
- 統合テスト: 25%
- E2Eテスト: 5%

### テストの実行

```bash
# すべてのテスト
npm test

# ユニットテストのみ
npm run test:unit

# カバレッジレポート
npm run test:coverage

# ウォッチモード
npm run test:watch
```

### テストの書き方

```javascript
describe('EventService', () => {
  describe('createEvent', () => {
    it('should create a new event with valid data', async () => {
      const eventData = {
        title: 'Test Event',
        date: '2025-08-01',
        location: 'Tokyo'
      };
      
      const result = await eventService.createEvent(eventData);
      
      expect(result).toHaveProperty('id');
      expect(result.title).toBe(eventData.title);
    });
    
    it('should throw error for invalid data', async () => {
      const invalidData = { title: '' };
      
      await expect(eventService.createEvent(invalidData))
        .rejects.toThrow('Validation error');
    });
  });
});
```

## デバッグとトラブルシューティング

### ログレベル

```javascript
logger.debug('Detailed debug info');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred', error);
```

### 一般的な問題と解決策

#### ポート競合
```bash
# ポートを使用しているプロセスを確認
lsof -i :3000

# 別のポートで起動
PORT=3001 npm run dev
```

#### ES Modules エラー
```bash
# ES Modulesサポートを有効にして実行
NODE_OPTIONS='--experimental-vm-modules' npm test
```

#### データベース接続エラー
```bash
# 環境変数を確認
echo $DATABASE_TYPE

# ファイルベースに切り替え
DATABASE_TYPE=file npm run dev
```

### デバッグツール

1. **VS Code デバッガー**
   - `.vscode/launch.json`を使用
   - ブレークポイントの設定

2. **Chrome DevTools**
   - `--inspect`フラグでNode.js起動
   - chrome://inspect でアタッチ

3. **ログ分析**
   ```bash
   # ログの確認
   tail -f logs/app.log
   
   # エラーログのみ
   grep ERROR logs/app.log
   ```

## デプロイメント

### ビルド

```bash
# すべてのアーティファクトをビルド
npm run build:all

# 個別ビルド
npm run build:static
npm run build:lambda
npm run build:wordpress
```

### デプロイメントオプション

1. **静的ホスティング**
   ```bash
   npm run deploy:static
   ```

2. **AWS Lambda**
   ```bash
   npm run deploy:lambda
   ```

3. **Docker**
   ```bash
   npm run deploy:docker
   ```

4. **CDK（AWS）**
   ```bash
   npm run cdk:deploy:dev
   ```

## ベストプラクティス

### セキュリティ

1. **入力検証**
   ```javascript
   router.post('/api/events',
     body('title').notEmpty().trim().escape(),
     body('date').isISO8601(),
     validateRequest,
     eventController.create
   );
   ```

2. **認証・認可**
   ```javascript
   router.use('/api/admin/*', authenticateToken, requireAdmin);
   ```

3. **環境変数**
   - センシティブな情報は環境変数で管理
   - `.env`ファイルはgitignoreに追加

### パフォーマンス

1. **キャッシング**
   ```javascript
   const cache = new Map();
   
   const getCachedData = (key) => {
     if (cache.has(key)) {
       return cache.get(key);
     }
     const data = fetchData(key);
     cache.set(key, data);
     return data;
   };
   ```

2. **非同期処理**
   ```javascript
   // Good - 並列処理
   const [events, participants] = await Promise.all([
     getEvents(),
     getParticipants()
   ]);
   
   // Bad - 順次処理
   const events = await getEvents();
   const participants = await getParticipants();
   ```

### コードレビュー

1. **チェックリスト**
   - [ ] テストが追加されているか
   - [ ] ドキュメントが更新されているか
   - [ ] セキュリティ考慮がされているか
   - [ ] パフォーマンスへの影響は？
   - [ ] エラーハンドリングは適切か

2. **レビューのポイント**
   - 可読性とメンテナンス性
   - DRY原則の遵守
   - 適切な抽象化レベル

## 継続的な改善

### 監視とロギング

```javascript
// CloudWatch統合
const cloudWatch = require('./services/cloudWatchService');

cloudWatch.logMetric('API_CALL_COUNT', 1);
cloudWatch.logError('API_ERROR', error);
```

### フィードバックループ

1. ユーザーフィードバックの収集
2. パフォーマンスメトリクスの分析
3. エラーレートの監視
4. 改善案の実装

## リソース

- [プロジェクトREADME](../../README.md)
- [API リファレンス](../api/reference.md)
- [デプロイメントガイド](../deployment/DEPLOYMENT-GUIDE.md)
- [トラブルシューティング](./troubleshooting.md)
- [CLAUDE.md](../../CLAUDE.md) - AI開発支援ガイド

## サポート

問題や質問がある場合：

1. [GitHub Issues](https://github.com/your-org/lightningtalk-circle/issues)
2. Slackチャンネル: #lightning-talk-dev
3. メール: dev-support@lightningtalk.example.com