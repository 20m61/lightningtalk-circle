# PR用スクリーンショット添付システム

## 概要

Lightning Talk CircleプロジェクトにPR（Pull
Request）用のスクリーンショット添付機能を実装しました。この機能により、開発者はスクリーンショットを簡単にS3にアップロードし、GitHub
PRコメントとして投稿できます。

## アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Express API    │    │   AWS Lambda    │
│   JavaScript    │───▶│   /screenshots   │───▶│  Presigned URL  │
│                 │    │                  │    │   Generator     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         │              │   GitHub API     │    │      S3         │
         └──────────────▶│   PR Comments    │    │   Screenshot    │
                         │                  │    │    Storage      │
                         └──────────────────┘    └─────────────────┘
```

## 主要コンポーネント

### 1. CDK Stack (cdk/lib/screenshot-storage-stack.js)

- **S3バケット**: スクリーンショット保存用の専用バケット
- **Lambda関数**: 署名付きURL生成用の関数
- **IAMロール**: 適切な権限設定
- **ライフサイクルポリシー**: 自動ファイル削除（dev: 7日、prod: 30日）

### 2. Lambda Function (cdk/lambda/presigned-url/)

- **アップロード用URL生成**: POST /upload-url
- **ダウンロード用URL生成**: GET /download-url
- **ヘルスチェック**: GET /health
- **ファイル形式検証**: PNG, JPG, GIF, WebP対応
- **サイズ制限**: dev 10MB、prod 20MB

### 3. Express API Routes (server/routes/screenshots.js)

- **POST /api/screenshots/upload-url**: 署名付きURL取得
- **GET /api/screenshots/download-url**: ダウンロードURL取得
- **POST /api/screenshots/post-to-pr**: GitHub PRコメント投稿
- **GET /api/screenshots/list**: PR内のスクリーンショット一覧
- **GET /api/screenshots/health**: ヘルスチェック

### 4. Frontend JavaScript (public/js/screenshot-attachment.js)

- **ドラッグ&ドロップ**: スクリーンショットの簡単アップロード
- **ペースト対応**: Ctrl+Vでクリップボードから直接アップロード
- **リアルタイムプレビュー**: アップロード状況の表示
- **Markdown生成**: PR用のMarkdownコード自動生成

## 使用方法

### 1. 基本的な使用手順

1. **Webページを開く**: スクリーンショット添付機能が有効なページにアクセス
2. **ファイル選択**: 以下のいずれかの方法でスクリーンショットを追加
   - ファイル選択ボタンをクリック
   - ドラッグ&ドロップエリアにファイルをドロップ
   - Ctrl+V でクリップボードから貼り付け
3. **アップロード確認**: 進行状況とアップロード完了を確認
4. **Markdownコピー**: 生成されたMarkdownコードをコピー
5. **PRに投稿**: GitHubのPRコメントにMarkdownを貼り付け

### 2. API経由での使用

#### 署名付きURL取得

```javascript
const response = await fetch('/api/screenshots/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'screenshot.png',
    contentType: 'image/png',
    prNumber: 123,
    userId: 'user123'
  })
});

const { data } = await response.json();
// data.uploadUrl, data.downloadUrl が取得できる
```

#### S3へのアップロード

```javascript
await fetch(data.uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
});
```

#### PRコメント投稿

```javascript
await fetch('/api/screenshots/post-to-pr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prNumber: 123,
    screenshots: [{ url: data.downloadUrl, filename: 'screenshot.png' }],
    message: 'スクリーンショットを添付しました',
    userId: 'user123'
  })
});
```

## 設定方法

### 1. 環境変数

```bash
# GitHub統合（必須）
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repository_name

# AWS設定
AWS_REGION=ap-northeast-1
PRESIGNED_URL_FUNCTION_NAME=lightningtalk-circle-dev-presigned-url

# その他の設定
NODE_ENV=development
```

### 2. CDKデプロイ

```bash
# Lambda function依存関係のインストール
cd cdk/lambda/presigned-url
npm install

# CDKスタックのデプロイ
cd ../..
npm run synth:optimized
npm run deploy:optimized

# 特定のスタックのみデプロイ
npx cdk deploy LTC-ScreenshotStorage-dev --app "node bin/cdk-optimized.js" -c env=dev
```

### 3. GitHub Personal Access Token

1. GitHub Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)"を選択
3. 必要な権限を選択:
   - `repo` (リポジトリへのフルアクセス)
   - `write:discussion` (PR discussion への書き込み)
4. 生成されたトークンを`GITHUB_TOKEN`環境変数に設定

## セキュリティ

### 1. アクセス制御

- **S3バケット**: プライベート設定、署名付きURLでのみアクセス可能
- **Lambda関数**: IAMロールベースの最小権限
- **API**: レート制限（アップロード: 15分間20回、コメント: 5分間5回）

### 2. ファイル検証

- **拡張子チェック**: PNG, JPG, JPEG, GIF, WebP のみ許可
- **サイズ制限**: 開発環境10MB、本番環境20MB
- **Content-Type検証**: MIMEタイプの確認

### 3. 自動削除

- **開発環境**: 7日後に自動削除
- **本番環境**: 30日後に自動削除
- **バージョニング**: 本番環境でのみ有効

## コスト最適化

### 1. ストレージクラス

- **標準ストレージ**: アップロード直後
- **IA (Infrequent Access)**: 1日後に自動移行
- **自動削除**: 設定期間後に完全削除

### 2. 転送最適化

- **CloudFront**: 将来的にCDN経由での配信を検討
- **圧縮**: 可能な場合はWebP形式を推奨
- **キャッシュ**: 1年間のCache-Controlヘッダー

## モニタリング

### 1. CloudWatch メトリクス

- Lambda関数の実行回数、エラー率、実行時間
- S3バケットのリクエスト数、ストレージ使用量
- API Gatewayのリクエスト数、レスポンス時間

### 2. ログ

- Lambda関数のログ: CloudWatch Logs
- API リクエストログ: Express.jsログ
- エラー追跡: 詳細なエラーログとスタックトレース

## トラブルシューティング

### 1. よくある問題

#### アップロードが失敗する

```
Error: Failed to generate presigned URL
```

**解決策**:

1. Lambda関数が正しくデプロイされているか確認
2. IAMロールの権限を確認
3. S3バケットが存在するか確認

#### PRコメント投稿が失敗する

```
Error: Pull request not found
```

**解決策**:

1. `GITHUB_TOKEN`が設定されているか確認
2. トークンの権限が適切か確認
3. PR番号が正しいか確認

#### ファイル形式エラー

```
Error: File extension not allowed
```

**解決策**:

1. 対応形式（PNG, JPG, GIF, WebP）を使用
2. ファイル名に特殊文字が含まれていないか確認

### 2. デバッグ手順

1. **ヘルスチェック**: `/api/screenshots/health` でサービス状態確認
2. **Lambda ログ**: CloudWatch Logsでエラー詳細確認
3. **ネットワーク**: ブラウザのDeveloper Toolsでリクエスト/レスポンス確認

## 今後の拡張計画

1. **画像処理**: 自動リサイズ、形式変換
2. **プレビュー機能**: アップロード前のプレビュー
3. **バッチアップロード**: 複数ファイルの一括処理
4. **CloudFront統合**: CDN経由での高速配信
5. **画像最適化**: WebP自動変換、圧縮

## 技術仕様

- **対応ブラウザ**: Chrome, Firefox, Safari, Edge (最新版)
- **Node.js**: 18.x以上
- **AWS Services**: S3, Lambda, IAM, CloudWatch
- **GitHub API**: v4 (REST API)
- **ファイル形式**: PNG, JPG, JPEG, GIF, WebP
