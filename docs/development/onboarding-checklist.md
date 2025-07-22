# Developer Onboarding Checklist

Lightning Talk Circle プロジェクトへようこそ！🎉

このチェックリストに従って、開発環境をセットアップしてください。

## 📋 事前準備

### 必須ツール

- [ ] **Node.js 18+** がインストールされている
- [ ] **Git** がインストールされている
- [ ] **GitHub CLI (gh)** がインストールされている
- [ ] **VSCode** または好みのエディタがセットアップされている

### 推奨ツール

- [ ] **Docker** がインストールされている（Dockerベース開発の場合）
- [ ] **AWS CLI** がインストールされている（CDKデプロイの場合）

## 🚀 初期セットアップ

### 1. リポジトリのセットアップ

- [ ] リポジトリをクローン:
      `git clone https://github.com/20m61/lightningtalk-circle.git`
- [ ] プロジェクトディレクトリに移動: `cd lightningtalk-circle`
- [ ] developerブランチにチェックアウト: `git checkout developer`

### 2. 依存関係のインストール

- [ ] 依存関係をインストール: `npm ci`
- [ ] 依存関係の脆弱性チェック: `npm audit`

### 3. 環境設定

- [ ] 環境変数ファイルを作成: `cp .env.example .env`
- [ ] `.env`ファイルを編集して必要な値を設定
- [ ] 環境設定を検証: `npm run env:validate`

### 4. 開発環境のテスト

- [ ] 環境情報を確認: `npm run dev:env`
- [ ] ヘルスチェックを実行: `npm run dev:health`
- [ ] テストスイートを実行: `npm test`

## 🛠️ 開発ツールの設定

### VSCode 設定（推奨）

- [ ] 推奨拡張機能をインストール:
  - [ ] ESLint
  - [ ] Prettier
  - [ ] Jest
  - [ ] GitLens
  - [ ] AWS Toolkit

### Git 設定

- [ ] Git設定を確認:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```
- [ ] GitHub CLIをセットアップ: `gh auth login`

### 開発ワークフローの理解

- [ ] [開発ワークフローガイド](./workflow-guide.md)を読む
- [ ] [クイックスタートガイド](./quick-start.md)を読む
- [ ] ブランチ戦略を理解する（main → developer → feature/xxx）

## 🧪 テスト実行

### 基本テスト

- [ ] ユニットテスト: `npm run test:unit`
- [ ] 統合テスト: `npm run test:integration`
- [ ] テストカバレッジ: `npm run test:coverage`

### コード品質チェック

- [ ] ESLint: `npm run lint`
- [ ] Prettier: `npm run format:check`
- [ ] セキュリティ監査: `npm audit`

## 🌐 ローカル開発サーバー

### 開発サーバーの起動

- [ ] 基本サーバー: `npm run dev`
- [ ] ホットリロードサーバー: `npm run dev:hot`
- [ ] サンプルデータ付きサーバー: `npm run dev:seed`

### アクセス確認

- [ ] フロントエンド: http://localhost:3000
- [ ] API ドキュメント: http://localhost:3000/api/docs
- [ ] ヘルスチェック: http://localhost:3000/api/health

## 🚀 初回機能開発

### フィーチャーブランチの作成

- [ ] 新しいフィーチャーブランチを作成: `npm run dev:feature onboarding-test`
- [ ] ブランチが正しく作成されたことを確認: `git branch --show-current`

### 簡単な変更

- [ ] `README.md`に自分の名前を追加
- [ ] 変更をコミット: `git commit -m "docs: add developer name to README"`
- [ ] プルリクエストを作成: `npm run dev:pr`

### PR作成とレビュー

- [ ] GitHub上でPRが作成されていることを確認
- [ ] PR テンプレートが適用されていることを確認
- [ ] CI/CDパイプラインが実行されていることを確認

## 🐳 Docker環境（オプション）

### Docker開発環境

- [ ] Docker開発環境を起動: `./scripts/docker-dev.sh up`
- [ ] コンテナ内でシェルを開く: `./scripts/docker-dev.sh shell`
- [ ] Docker環境をテスト: `./scripts/docker-dev.sh logs`

## ☁️ AWS開発環境（オプション）

### CDK環境

- [ ] AWS認証情報を設定
- [ ] CDK依存関係をインストール: `npm run cdk:install`
- [ ] CDKスタックを合成: `npm run cdk:synth:dev`
- [ ] 開発環境にデプロイ: `npm run cdk:deploy:dev`

## 📚 ドキュメント理解

### 必読ドキュメント

- [ ] [プロジェクト概要](../../CLAUDE.md)
- [ ] [API ドキュメント](http://localhost:3000/api/docs)
- [ ] [開発ワークフローガイド](./workflow-guide.md)
- [ ] [セキュリティガイド](../security/security-guidelines.md)

### アーキテクチャ理解

- [ ] フロントエンド構造（public/）
- [ ] バックエンド構造（server/）
- [ ] CDK インフラ構造（cdk/）
- [ ] テスト構造（tests/）

## 🔧 便利なコマンドの確認

### 開発支援コマンド

- [ ] `npm run dev:aliases` - 利用可能なコマンド一覧
- [ ] `npm run dev:env` - 環境情報表示
- [ ] `npm run dev:health` - ヘルスチェック
- [ ] `npm run dev:clean` - クリーンアップ

### トラブルシューティング

- [ ] `npm run dev:reset` - developerブランチにリセット
- [ ] 開発環境の完全リセット手順を理解

## ✅ 最終確認

### 開発準備完了チェック

- [ ] すべてのテストが通る
- [ ] 開発サーバーが正常に起動する
- [ ] GitHub Actions が正常に動作する
- [ ] 初回PRが正常に作成できる

### チーム統合

- [ ] Slack/Discord などのコミュニケーションツールに参加
- [ ] プロジェクトの定期ミーティングスケジュールを確認
- [ ] メンターまたはリードデベロッパーとの初回ミーティング

## 🎯 次のステップ

おめでとうございます！開発環境のセットアップが完了しました。🎉

### 推奨する学習パス

1. **簡単なタスクから始める**: バグ修正や小さな機能追加
2. **コードレビューに参加**: 他の開発者のPRをレビュー
3. **アーキテクチャの理解**: システム全体の設計を学習
4. **高度な機能開発**: 複雑な機能の実装

### サポートリソース

- 📚 [ドキュメント](../README.md)
- 🐞 [Issues](https://github.com/20m61/lightningtalk-circle/issues)
- 💬 チームチャット
- 🆘 メンターサポート

---

## ✨ Welcome to the Team!

Lightning Talk
Circle の開発チームへようこそ！素晴らしいプロダクトを一緒に作りましょう！🚀

**困ったときは遠慮なく質問してください。** チーム全体でサポートします！💪
