# 自動リリースガイド

## 🚀 概要

Lightning Talk
Circleプロジェクトは、品質ゲートをパスした際に自動的にビルド・ZIP化・新バージョンリリースを実施する完全自動化されたCI/CDパイプラインを提供します。

## 📋 自動リリースフロー

### 1. トリガー条件

#### 自動リリース（mainブランチ）

- mainブランチへのプッシュ
- 品質ゲートのパス
- 新しいコミットの存在

#### 手動リリース

- GitHub ActionsのWorkflow Dispatch
- リリース種別の選択（patch/minor/major）

### 2. 品質ゲート

以下の条件をすべて満たす場合のみリリースが実行されます：

| チェック項目     | 基準                   |
| ---------------- | ---------------------- |
| ユニットテスト   | すべてパス             |
| 統合テスト       | すべてパス             |
| ESLint           | エラーなし             |
| Prettier         | フォーマット適合       |
| セキュリティ監査 | 重大・高レベル問題なし |
| カバレッジ       | 80%以上                |
| ビルドテスト     | 成功                   |

### 3. バージョニング戦略

#### 自動バージョン判定

コミットメッセージを解析して自動的にバージョンを決定：

```bash
# メジャーバージョン（v1.0.0 → v2.0.0）
feat!: 新しい破壊的変更
BREAKING CHANGE: APIの変更

# マイナーバージョン（v1.0.0 → v1.1.0）
feat: 新機能の追加

# パッチバージョン（v1.0.0 → v1.0.1）
fix: バグ修正
docs: ドキュメント更新
```

#### 手動バージョン指定

GitHub Actions UI から選択可能：

- `patch`: バグ修正・小さな改善
- `minor`: 新機能追加
- `major`: 破壊的変更

## 📦 生成されるパッケージ

### 1. WordPress テーマ

- **lightningtalk-child-theme_vX.X.X.zip**
  - Cocoonベースの子テーマ
  - 完全なLightning Talk機能
  - 本番環境対応

### 2. Modern WordPress テーマ

- **lightningtalk-modern-theme_vX.X.X.zip**
  - TypeScript/React ベース
  - 次世代技術採用
  - 開発者向け

### 3. 静的サイト

- **lightningtalk-static_vX.X.X.zip**
  - サーバー不要
  - 基本機能のみ
  - 簡易デプロイ対応

## 🔧 使用方法

### 自動リリース（推奨）

1. **開発作業**

   ```bash
   git checkout -b feature/new-function
   # 開発作業
   git commit -m "feat: 新機能を追加"
   git push origin feature/new-function
   ```

2. **プルリクエスト**
   - mainブランチへのPR作成
   - レビュー・承認後マージ

3. **自動リリース実行**
   - mainブランチへのマージ後、自動的に：
     - 品質ゲート実行
     - バージョン判定
     - ビルド・パッケージ化
     - GitHub Releasesへの公開

### 手動リリース

1. **GitHub Actionsページへアクセス**

   ```
   https://github.com/[OWNER]/lightningtalk-circle/actions
   ```

2. **Release Workflowを選択**
   - "Run workflow" をクリック
   - リリース種別を選択
   - オプション設定（テストスキップ、プレリリース等）

3. **実行確認**
   - ワークフローの進行状況を監視
   - 完了後、Releasesページで確認

## 📊 品質レポート

各リリースでは以下のレポートが生成されます：

### 1. 品質ゲートレポート

- `quality-gate-results.json`: 機械可読形式
- `quality-gate-report.md`: 人間可読形式

### 2. ビルドマニフェスト

- パッケージ情報
- チェックサム
- デプロイ設定

### 3. リリースノート

- 変更履歴
- インストール手順
- 必要環境
- サポート情報

## 🔒 セキュリティ

### GitHub Secrets設定

以下のシークレットが必要です：

```bash
# 必須
GITHUB_TOKEN          # 自動設定（リポジトリアクセス）

# オプション（通知用）
SLACK_WEBHOOK_URL     # Slack通知
```

### 権限設定

- **リポジトリ**: Actions write権限
- **Releases**: 作成・編集権限
- **Issues**: 作成権限（失敗時の自動Issue作成）

## 🚨 トラブルシューティング

### よくある問題

#### 1. 品質ゲートが失敗する

```bash
# ローカルでチェック実行
npm run quality:workflow

# 個別チェック
npm run test:unit
npm run test:integration
npm run lint
npm audit --audit-level=high
```

#### 2. ビルドエラー

```bash
# ローカルビルドテスト
npm run build:theme
npm run package:static

# 依存関係の確認
npm ci
```

#### 3. バージョニングエラー

- コミットメッセージの形式確認
- 既存タグとの競合確認
- Git履歴の整合性確認

### サポート情報

#### ログ確認

1. GitHub Actions の詳細ログ
2. `quality-gate-results.json` の内容
3. ビルド成果物の確認

#### 手動対応

```bash
# 緊急時の手動リリース
git tag -a v1.0.1 -m "Emergency release"
git push origin v1.0.1

# 失敗したリリースの削除
git tag -d v1.0.1
git push --delete origin v1.0.1
```

## 📈 メトリクス・監視

### 自動監視項目

- リリース成功率
- 品質ゲート通過率
- ビルド時間
- パッケージサイズ

### 通知設定

- Slack通知（成功・失敗）
- GitHub Issues（失敗時自動作成）
- リリースノート自動生成

## 🔄 継続的改善

### 設定のカスタマイズ

#### 品質基準の調整

`scripts/quality-workflow-integration.js`:

```javascript
this.config = {
  coverageThreshold: 80, // カバレッジ閾値
  maxCriticalIssues: 0, // 重大問題許容数
  maxHighIssues: 5 // 高レベル問題許容数
  // ...
};
```

#### リリース条件の変更

`.github/workflows/ci-cd.yml`:

```yaml
if:
  github.ref == 'refs/heads/main' && needs.quality-gates.outputs.quality-passed
  == 'true'
```

### 今後の拡張予定

- [ ] パフォーマンステストの統合
- [ ] 自動デプロイメント（本番環境）
- [ ] ロールバック機能
- [ ] A/Bテスト対応
- [ ] メトリクス ダッシュボード

---

**参考リンク**:

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
