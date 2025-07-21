# デプロイメント実践で発見された課題

## 実行日時

2025-07-21 12:06

## 発見された課題

### 1. Analyticsテスト - performance.timing未定義エラー

**問題**: `tests/unit/analytics/analytics.test.js`でperformance.timingが未定義

```
TypeError: Cannot read properties of undefined (reading 'loadEventEnd')
at UserActionTracker.trackPageView (public/js/analytics.js:384:38)
```

**原因**: JSDOMテスト環境でperformance.timingが適切にモックされていない

**影響**:

- テストが失敗するがデプロイスクリプトのfallback処理でデプロイは継続
- 実際のブラウザ環境では問題なし

**修正方針**:

- performance.timingの存在チェック追加
- テスト環境でのperformance APIのモック改善

### 2. CDKデプロイタイムアウト問題

**問題**: CDKデプロイが2分のタイムアウト制限を超過

**状況**:

- CDKスタックは実際には正常にデプロイ完了 (UPDATE_COMPLETE)
- deploy-dev.shスクリプトがタイムアウトで中断

**影響**:

- S3同期とCloudFront無効化ステップが未実行
- エラー表示により成功が分からない

**修正方針**:

- デプロイスクリプトのタイムアウト時間延長
- CDKデプロイ完了チェックの改善
- プロセス分離検討

### 3. 依存関係の脆弱性

**問題**: CDK依存関係で3つの脆弱性検出

```
3 vulnerabilities (1 low, 2 moderate)
```

**修正方針**:

- npm audit fixの実行
- 定期的な依存関係更新

### 4. GitHub Secrets未設定

**問題**: GitHub ActionsでのAWS認証に必要なSecretsが未設定

```
現在のSecrets:
- ANTHROPIC_API_KEY
- CLAUDE_CODE_OAUTH_TOKEN

不足Secrets:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
```

**影響**: GitHub Actionsによる自動デプロイが実行できない

**修正方針**:

- リポジトリ管理者によるAWS認証情報の追加
- IAM ユーザーの作成と適切な権限付与

## 現在の状況

### ✅ 成功した項目

- AWS認証確認
- 環境切り替え機能
- CDKスタック合成
- CDKスタックデプロイ (LightningTalkCircle-dev, LightningTalkWebSocket-dev)
- アプリケーションビルド
- **S3静的ファイル同期** (手動実行で成功)
- **CloudFront無効化** (ID: I9HLXLKYOR0Q75GGKAOTXV6S5H)
- **スモークテスト** (サイト・API両方正常応答)

### ✅ 実際のデプロイメント結果

- **開発サイト**: https://dev.xn--6wym69a.com (正常表示)
- **API エンドポイント**:
  https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/health
  (正常応答)
- **CloudFront Distribution**: ESY18KIDPJK68
- **S3バケット**: lightningtalk-dev-static-822063948773

## 修正実施済み項目

### ✅ 実施した修正

1. **deploy-dev.sh スクリプト修正**
   - CloudFront Distribution ID 修正: `E3U9O7A93IDYO4` → `ESY18KIDPJK68`
   - S3同期パス修正: `./public` → `./dist` (Viteビルド出力)
   - HTMLファイルのキャッシュ設定改善

2. **Analytics.js performance.timing 修正**
   - 存在チェック追加:
     `performance.timing?.loadEventEnd && performance.timing?.fetchStart`
   - テスト環境でのundefinedエラー対策

### ⚠️ 未解決課題

1. **CDKデプロイタイムアウト** - コマンドライン実行時の2分制限
2. **GitHub Secrets未設定** - AWS認証情報がGitHub Actionsで利用不可
3. **依存関係脆弱性** - CDK関連で3件検出

### 🎯 完了した実際のデプロイメント

- **開発環境URL**: https://dev.発表.com (https://dev.xn--6wym69a.com)
- **API健全性**: 正常応答確認済み
- **CloudFront**: キャッシュ無効化完了
- **S3**: 静的アセット同期完了

## 次のステップ

1. ✅ 手動でS3同期とCloudFront無効化を実行 (完了)
2. ✅ 実際のデプロイメント動作確認 (完了)
3. ✅ 発見された課題の修正 (部分完了)
4. ❌ GitHub Actionsでの自動デプロイテスト (Secrets設定待ち)
