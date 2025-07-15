# AWS CDK Stack Cleanup Plan

## 概要

Lightning Talk CircleのCDKスタックの整理と統合を行う計画です。

## 現在の状況

### 既存のAWSスタック（削除対象）
1. **LightningTalkApiOnlyStack** - 本番API（重要：慎重な移行が必要）
2. **LightningTalkCognitoStack** - 認証スタック（重複）
3. **LightningTalk-StaticSite-dev** - 開発用静的サイト
4. **LightningTalk-LambdaApi-dev** - 開発用Lambda API
5. **LightningTalk-Database-dev** - 開発用データベース
6. **LightningTalk-Secrets-dev** - 開発用シークレット
7. **LightningTalk-BucketPolicy-Update** - バケットポリシー更新
8. **LightningTalkCognito** - 認証スタック（重複）

### 新しいスタック構成（CDK定義済み）
1. **LightningTalkDev-dev** - 開発環境統合スタック
2. **LightningTalkProd-prod** - 本番環境統合スタック
3. **LightningTalkCognito-dev** - 認証スタック（開発）
4. **LightningTalkCognito-prod** - 認証スタック（本番）
5. **LightningTalkWebSocket-dev** - WebSocketスタック（開発）
6. **LightningTalkWebSocket-prod** - WebSocketスタック（本番）

## 削除されたファイル（完了済み）

### 重複ファイル
- ✅ `cdk/lib/cognito-stack.ts` - JavaScriptバージョンに統合

### 個別コンポーネントスタック
- ✅ `cdk/lib/stacks/api-stack.js` - prod-environment-stackに統合
- ✅ `cdk/lib/stacks/database-stack.js` - 環境スタックに統合
- ✅ `cdk/lib/stacks/lambda-api-stack.js` - dev-environment-stackに統合
- ✅ `cdk/lib/stacks/static-site-stack.js` - 環境スタックに統合
- ✅ `cdk/lib/stacks/cost-monitoring-stack.js` - prod-environment-stackに統合
- ✅ `cdk/lib/stacks/waf-stack.js` - prod-environment-stackに統合

### レガシースタック
- ✅ `cdk/lib/lightning-talk-stack.js` - 統合アプローチ、未使用
- ✅ `cdk/lib/api-only-stack.js` - API専用デプロイ、未使用

### 統合済みスタック
- ✅ `cdk/lib/stacks/secrets-stack.js` - secrets-manager-stack.jsに統合
- ✅ `cdk/lib/stacks/monitoring-stack.js` - monitoring-enhanced-stack.jsに統合

## 残存するスタックファイル

### アクティブなスタック
- `cdk/lib/dev-environment-stack.js` - 開発環境統合スタック
- `cdk/lib/prod-environment-stack.js` - 本番環境統合スタック
- `cdk/lib/cognito-stack.js` - 認証インフラ
- `cdk/lib/websocket-stack.js` - WebSocket API

### 必要に応じて統合可能
- `cdk/lib/stacks/secrets-manager-stack.js` - シークレット管理
- `cdk/lib/stacks/monitoring-enhanced-stack.js` - 拡張監視

## 安全な移行手順

### Phase 1: 新しいスタックのデプロイ（推奨）
```bash
# 開発環境
npx cdk deploy LightningTalkDev-dev --require-approval never

# 本番環境（慎重に）
npx cdk deploy LightningTalkProd-prod --require-approval never

# 認証スタック
npx cdk deploy LightningTalkCognito-dev --require-approval never
npx cdk deploy LightningTalkCognito-prod --require-approval never

# WebSocketスタック
npx cdk deploy LightningTalkWebSocket-dev --require-approval never
npx cdk deploy LightningTalkWebSocket-prod --require-approval never
```

### Phase 2: データとリソースの移行
1. **データベース移行**
   - 既存のDynamoDBテーブルからのデータエクスポート
   - 新しいテーブルへのインポート
   - アプリケーション設定の更新

2. **認証移行**
   - Cognitoユーザープールの移行
   - 既存のユーザーセッションの維持

3. **API移行**
   - 新しいAPI Gatewayへのトラフィック切り替え
   - DNS更新またはALB設定変更

### Phase 3: 既存スタックの削除（検証後）
```bash
# 重要でないスタックから削除
aws cloudformation delete-stack --stack-name LightningTalk-BucketPolicy-Update
aws cloudformation delete-stack --stack-name LightningTalk-Secrets-dev
aws cloudformation delete-stack --stack-name LightningTalk-Database-dev
aws cloudformation delete-stack --stack-name LightningTalk-LambdaApi-dev
aws cloudformation delete-stack --stack-name LightningTalk-StaticSite-dev

# 重複する認証スタック（慎重に）
aws cloudformation delete-stack --stack-name LightningTalkCognitoStack
aws cloudformation delete-stack --stack-name LightningTalkCognito

# 本番APIスタック（最後に、完全な検証後）
aws cloudformation delete-stack --stack-name LightningTalkApiOnlyStack
```

## リスク管理

### 高リスク要素
1. **LightningTalkApiOnlyStack** - 本番APIを含む（慎重な移行が必要）
2. **認証スタック** - ユーザーセッションの維持
3. **データベース** - データ損失の防止

### 推奨事項
1. **バックアップ作成** - 移行前の完全バックアップ
2. **段階的移行** - 開発環境から本番環境への順次移行
3. **ロールバック計画** - 問題発生時の即座の復旧計画
4. **監視強化** - 移行期間中の詳細な監視

## 現在の統合状況

### 削除済みファイル数: 10個
- 重複ファイル: 1個
- 個別コンポーネントスタック: 6個
- レガシースタック: 2個
- 統合済みスタック: 1個

### 残存ファイル数: 6個
- アクティブなスタック: 4個
- 必要に応じて統合可能: 2個

## 次のステップ

1. **新しいスタックの本格デプロイ**
2. **移行スクリプトの作成**
3. **本番環境での検証**
4. **既存スタックの段階的削除**
5. **監視とアラートの設定**