# Google認証とユーザ管理機能の実装

## 概要

このドキュメントでは、Lightning Talk CircleアプリケーションにおけるGoogle
OAuth認証とユーザ管理機能の実装について説明します。

## アーキテクチャ

### 認証フロー

1. **フロントエンド**: AWS Cognitoを使用したGoogle OAuth認証
2. **バックエンド**: CognitoのIDトークンを検証し、独自のJWTトークンを発行
3. **データベース**: Cognitoユーザとローカルデータベースの同期

```
[User] → [Google OAuth] → [AWS Cognito] → [Backend API] → [Database]
                                    ↓
                              [ID Token]
                                    ↓
                            [JWT Token発行]
```

## 実装内容

### 1. バックエンドAPI

#### 新規エンドポイント

- `POST /api/auth/google` - Google OAuth認証
- `POST /api/auth/refresh` - トークンリフレッシュ
- `PUT /api/auth/users/:id` - ユーザ更新（管理者のみ）

#### Cognito認証ミドルウェア (`server/middleware/cognito-auth.js`)

```javascript
// Cognito IDトークンの検証
export async function verifyCognitoToken(idToken)

// Cognitoユーザとローカルデータベースの同期
export async function syncCognitoUser(cognitoUser, database)

// 認証ミドルウェア
export function authenticateCognitoToken(req, res, next)
```

### 2. フロントエンド

#### 認証サービス (`src/services/authService.js`)

- Cognitoとバックエンドの認証フローを統合
- トークン管理とリフレッシュ機能
- ユーザCRUD操作

#### ユーザ管理画面 (`src/components/UserManagement.jsx`)

- 管理者向けユーザ管理インターフェース
- ユーザの作成、編集、削除機能
- Google認証ユーザとメール認証ユーザの区別表示

### 3. セキュリティ対策

- JWKSキャッシング（1時間）
- トークン有効期限の検証
- 管理者権限のチェック
- 自己降格の防止

## セットアップ手順

### 1. 環境変数の設定

```bash
# .env または .env.production
VITE_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_IDENTITY_POOL_ID=ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_COGNITO_DOMAIN=your-domain.auth.ap-northeast-1.amazoncognito.com

# バックエンド用（同じ値）
USER_POOL_ID=ap-northeast-1_xxxxxxxxx
USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Google OAuth設定

1. Google Cloud Consoleでプロジェクトを作成
2. OAuth 2.0クライアントIDを作成
3. リダイレクトURIを設定：
   - `https://your-domain.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse`
   - `https://発表.com/callback`
   - `http://localhost:3000/callback`（開発用）

### 3. AWS Cognito設定

1. Cognitoユーザプールを作成
2. Google IDプロバイダーを追加
3. アプリクライアントを設定

### 4. 依存関係のインストール

```bash
cd server
npm install jwk-to-pem axios
```

## 使用方法

### Google認証でのログイン

1. ログイン画面で「Googleでログイン」をクリック
2. Googleアカウントで認証
3. 初回ログイン時は自動的にユーザが作成される

### ユーザ管理（管理者のみ）

1. `/admin/users.html`にアクセス
2. 新規ユーザの作成、既存ユーザの編集・削除が可能
3. Google認証ユーザはパスワード変更不可

## トラブルシューティング

### よくある問題

1. **「Google認証が設定されていません」エラー**
   - 環境変数が正しく設定されているか確認
   - `USER_POOL_ID`と`USER_POOL_CLIENT_ID`が設定されているか確認

2. **「無効な認証トークンです」エラー**
   - Cognitoのアプリクライアント設定を確認
   - JWKSエンドポイントへのアクセスを確認

3. **ユーザ同期の失敗**
   - データベースへの書き込み権限を確認
   - Cognitoユーザのメールアドレスが正しいか確認

### デバッグ方法

```javascript
// 認証トークンの確認
const idToken = localStorage.getItem('cognitoIdToken');
console.log('ID Token:', idToken);

// ユーザ情報の確認
const user = JSON.parse(localStorage.getItem('user'));
console.log('User:', user);
```

## セキュリティ考慮事項

1. **トークンの保護**
   - HTTPSでの通信を必須とする
   - トークンをlocalStorageに保存する際は注意が必要

2. **権限管理**
   - 管理者権限の付与は慎重に行う
   - 定期的な権限レビューを実施

3. **監査ログ**
   - ユーザの作成・更新・削除操作をログに記録
   - 異常なアクセスパターンを監視

## 今後の改善案

1. **多要素認証（MFA）の実装**
2. **ソーシャルログインの拡張**（GitHub、Twitter等）
3. **詳細な権限管理**（RBAC）
4. **ユーザアクティビティの可視化**
5. **一括ユーザインポート機能**
