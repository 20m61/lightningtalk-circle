# Quick Start Guide - Lightning Talk Circle

Lightning Talk Circle の開発を始めるためのクイックスタートガイドです。

## 前提条件

- Node.js 18+ がインストールされていること
- Git がインストールされていること
- GitHub CLI (gh) がインストールされていること（PRの作成に必要）

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/20m61/lightningtalk-circle.git
cd lightningtalk-circle
```

### 2. 依存関係のインストール

```bash
npm ci
```

### 3. 環境設定

```bash
# 環境変数ファイルの作成
cp .env.example .env

# 必要に応じて .env ファイルを編集
```

### 4. 開発環境の確認

```bash
# 環境情報を表示
npm run dev:env

# ヘルスチェック実行
npm run dev:health
```

## 📝 基本的な開発ワークフロー

### 1. フィーチャーブランチの作成

```bash
# 新しい機能の開発を開始
npm run dev:feature my-new-feature

# または手動で
git checkout developer
git checkout -b feature/my-new-feature
```

### 2. 開発サーバーの起動

```bash
# 通常の開発サーバー
npm run dev:hot

# サンプルデータ付きで起動
npm run dev:seed

# または従来の方法
npm run dev
```

### 3. 開発中の便利なコマンド

```bash
# リアルタイムテスト実行
npm run test:watch

# コードフォーマット
npm run format

# リンターチェック
npm run lint:fix

# 環境情報表示
npm run dev:env
```

### 4. プルリクエストの作成

```bash
# 変更をコミット
git add .
git commit -m "feat: add new feature"

# プルリクエスト作成
npm run dev:pr

# または手動で
git push -u origin feature/my-new-feature
gh pr create --base developer --title "feat: add new feature"
```

## 🔧 開発ツールとコマンド

### 開発ワークフロー支援コマンド

| コマンド                     | 説明                             |
| ---------------------------- | -------------------------------- |
| `npm run dev:feature <name>` | 新しいフィーチャーブランチを作成 |
| `npm run dev:hot`            | ホットリロード付き開発サーバー   |
| `npm run dev:health`         | コードベースのヘルスチェック     |
| `npm run dev:pr`             | プルリクエストの作成             |
| `npm run dev:env`            | 環境情報の表示                   |
| `npm run dev:clean`          | ビルドアーティファクトのクリーン |
| `npm run dev:reset`          | developerブランチにリセット      |

### テストコマンド

```bash
# 全テスト実行
npm test

# ユニットテストのみ
npm run test:unit

# 統合テストのみ
npm run test:integration

# E2Eテスト
npm run test:e2e

# テストカバレッジ
npm run test:coverage

# ウォッチモード
npm run test:watch
```

### コード品質チェック

```bash
# ESLint
npm run lint
npm run lint:fix

# Prettier
npm run format
npm run format:check

# セキュリティ監査
npm audit

# ヘルスチェック（全てまとめて）
npm run dev:health
```

## 🌐 デプロイメント

### 開発環境

```bash
# CDK開発環境デプロイ
npm run cdk:deploy:dev

# 開発環境確認
curl https://dev.発表.com/api/health
```

### 本番環境

```bash
# 本番環境デプロイ（mainブランチのみ）
npm run cdk:deploy:prod

# 本番環境確認
curl https://発表.com/api/health
```

## 📁 プロジェクト構成

```
lightningtalk-circle/
├── server/              # Express.js バックエンド
├── public/              # 静的フロントエンド
├── cdk/                 # AWS CDK インフラ
├── scripts/             # 開発ツールとスクリプト
├── tests/               # テストファイル
├── docs/                # ドキュメント
└── .github/workflows/   # CI/CD パイプライン
```

## 🔄 ブランチ戦略

```
main (本番)
 ↑
developer (統合)
 ↑
feature/xxx (機能開発)
fix/xxx (バグ修正)
```

- **feature/xxx**: 新機能開発用ブランチ
- **fix/xxx**: バグ修正用ブランチ
- **developer**: 統合ブランチ（開発環境への自動デプロイ）
- **main**: 本番ブランチ（本番環境への自動デプロイ）

## 🐞 トラブルシューティング

### よくある問題

1. **ポート競合エラー**

   ```bash
   # 他のプロセスがポート3000を使用している場合
   lsof -ti:3000 | xargs kill -9
   ```

2. **Node.js バージョンエラー**

   ```bash
   # Node.js バージョン確認
   node --version  # 18+ が必要
   ```

3. **テスト失敗**

   ```bash
   # キャッシュクリア
   npm run dev:clean
   npm ci
   ```

4. **Git操作エラー**
   ```bash
   # 強制的にdeveloperブランチにリセット
   npm run dev:reset
   ```

### 開発環境リセット

```bash
# 完全リセット
npm run dev:clean
npm run dev:reset
npm ci
npm run dev:health
```

## 🔍 デバッグ

### ログ確認

```bash
# アプリケーションログ
tail -f logs/application.log

# エラーログ
tail -f logs/error.log

# CDKデプロイログ
cd cdk && npm run synth:dev
```

### 環境変数確認

```bash
# 現在の環境設定表示
npm run dev:env

# .env ファイルの妥当性確認
npm run env:validate
```

## 📚 その他のリソース

- [開発ワークフローガイド](./workflow-guide.md)
- [API ドキュメント](http://localhost:3000/api/docs)
- [プロジェクト概要](../../CLAUDE.md)
- [貢献ガイド](../../CONTRIBUTING.md)

## 💡 Tips

- 並行開発には `npm run worktree` でgit worktreeを活用
- IDE設定は `.vscode/settings.json` を参照
- pre-commitフックは自動で品質チェックを実行
- GitHub Actionsで自動テスト・デプロイが実行される

---

## 🆘 サポート

問題が発生した場合：

1. [トラブルシューティングガイド](../guides/troubleshooting.md)を確認
2. `npm run dev:health`でシステム状態を確認
3. GitHub Issuesで報告
4. 開発チームに相談

Happy coding! 🚀
