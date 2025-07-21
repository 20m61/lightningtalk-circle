# マルチ環境開発ワークフロー

本ドキュメントでは、発表.com（本番環境）とdev.発表.com（開発環境）を使った開発フローについて説明します。

## 環境概要

### 1. 開発環境 (dev.発表.com)

- **URL**: https://dev.xn--6wym69a.com (https://dev.発表.com)
- **用途**: 新機能の開発、テスト、デバッグ
- **デプロイ**: feature/\*ブランチからの自動デプロイ
- **データベース**: DynamoDB開発用テーブル
- **CloudFront**: E3U9O7A93IDYO4

### 2. 本番環境 (発表.com)

- **URL**: https://xn--6wym69a.com (https://発表.com)
- **用途**: エンドユーザー向けの本番サービス
- **デプロイ**: mainブランチからの手動承認デプロイ
- **データベース**: DynamoDB本番用テーブル
- **CloudFront**: 本番用ディストリビューション

## 開発フロー

### 1. ローカル開発

```bash
# 新機能開発用ブランチの作成
git checkout -b feature/new-feature

# ローカル環境での開発
npm run dev

# テストの実行
npm test
```

### 2. 開発環境へのデプロイ

```bash
# 変更をコミット
git add .
git commit -m "feat: 新機能の実装"

# リモートにプッシュ（自動的にdev環境にデプロイ）
git push origin feature/new-feature
```

### 3. 開発環境での確認

- https://dev.発表.com で動作確認
- フィードバックの収集
- 必要に応じて修正

### 4. Pull Requestの作成

```bash
# GitHub CLIを使用
gh pr create --title "feat: 新機能の実装" --body "## 概要\n新機能の説明\n\n## テスト\n- [ ] dev環境でテスト完了"
```

### 5. レビューとマージ

- コードレビューの実施
- dev環境での最終確認
- mainブランチへのマージ

### 6. 本番環境へのデプロイ

```bash
# mainブランチに切り替え
git checkout main
git pull origin main

# 本番デプロイ（手動承認が必要）
npm run deploy:production
```

## 環境別設定管理

### 環境変数の切り替え

```bash
# 開発環境用
npm run env:dev

# 本番環境用
npm run env:production
```

### 設定ファイル

- `.env.development` - 開発環境設定
- `.env.production` - 本番環境設定
- `.env.local` - ローカル開発用（gitignore対象）

## CDKによるインフラ管理

### 開発環境のデプロイ

```bash
cd cdk
npm run deploy:dev
```

### 本番環境のデプロイ

```bash
cd cdk
npm run deploy:prod -- --require-approval broadening
```

## 監視とログ

### CloudWatchログの確認

```bash
# 開発環境のログ
aws logs tail /aws/lambda/lightningtalk-circle-dev --follow

# 本番環境のログ
aws logs tail /aws/lambda/lightningtalk-circle-prod --follow
```

### メトリクスの確認

- 開発環境: CloudWatchダッシュボード（dev-metrics）
- 本番環境: CloudWatchダッシュボード（prod-metrics）

## トラブルシューティング

### 環境別の問題切り分け

1. ローカル環境で再現するか確認
2. dev環境でのみ発生する場合は環境固有の設定を確認
3. 本番環境でのみ発生する場合はスケーリングやリソース制限を確認

### ロールバック手順

```bash
# 開発環境のロールバック（手動プロセス）
npm run rollback:dev
echo "Follow manual rollback procedures in documentation"

# 本番環境のロールバック（承認必要・慎重に実施）
npm run rollback:prod  
echo "Contact operations team for production rollback"
```

## セキュリティ考慮事項

### 環境別のアクセス制御

- 開発環境: 社内IPアドレスからのみアクセス可能（WAF設定）
- 本番環境: 全世界からアクセス可能、DDoS対策有効

### シークレット管理

- AWS Secrets Managerで一元管理
- 環境別に異なるシークレットを使用
- ローテーション自動化

## ベストプラクティス

### 1. ブランチ戦略

- `main` - 本番環境
- `develop` - 開発環境のベース
- `feature/*` - 機能開発
- `hotfix/*` - 緊急修正

### 2. コミットメッセージ

- feat: 新機能
- fix: バグ修正
- docs: ドキュメント更新
- chore: その他の変更

### 3. テスト戦略

- ユニットテスト: 全環境で実行
- 統合テスト: dev環境で実行
- E2Eテスト: dev環境で自動実行、本番前に手動実行

### 4. デプロイ前チェックリスト

- [ ] テストが全て通過
- [ ] コードレビュー完了
- [ ] dev環境での動作確認
- [ ] ドキュメント更新
- [ ] 監視設定の確認
