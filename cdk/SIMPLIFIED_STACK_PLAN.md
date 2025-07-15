# シンプルなスタック構成プラン

## 目標構成（最終的に4つのスタック）

### 1. 開発環境統合スタック

- **名前**: `LightningTalkDev-dev` ✅ (既存)
- **内容**: Lambda API + DynamoDB + S3 + CloudFront
- **用途**: 開発・テスト環境

### 2. 本番環境統合スタック

- **名前**: `LightningTalkApiOnlyStack` ✅ (既存・本番稼働中)
- **内容**: ECS API + ALB + 本番データベース
- **用途**: 本番環境のAPI
- **重要**: 削除しないでください！

### 3. 認証スタック

- **名前**: `LightningTalkCognito-dev` ✅ (既存)
- **内容**: Cognito User Pool + Google OAuth + Identity Pool
- **用途**: 全環境共通の認証

### 4. WebSocketスタック

- **名前**: `LightningTalkWebSocket-dev` ✅ (既存)
- **内容**: WebSocket API + Lambda ハンドラー
- **用途**: リアルタイム通信

## 削除済みスタック（進行中）

- ✅ `LightningTalk-BucketPolicy-Update` - 削除済み
- ✅ `LightningTalk-StaticSite-dev` - 削除済み
- ✅ `LightningTalk-LambdaApi-dev` - 削除進行中
- ✅ `LightningTalk-Database-dev` - 削除進行中
- ✅ `LightningTalk-Secrets-dev` - 削除進行中
- ✅ `LightningTalkCognito` - 削除済み
- ✅ `LightningTalkCognitoStack` - 削除済み

## 完了予定

- **現在**: 11個のスタック → **目標**: 4個のスタック
- **削減率**: 64%削減
- **管理の簡素化**: 各環境に1つの統合スタック + 共通サービス

## 次のステップ

1. 削除完了の確認
2. 本番環境用の統合スタックの作成（必要に応じて）
3. 最終的な動作確認
