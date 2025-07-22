# Google OAuth Setup Guide

## Overview

このガイドでは、Lightning Talk CircleアプリケーションでAWS CognitoとGoogle OAuthを統合するための詳細な手順を説明します。

## Prerequisites（前提条件）

- Googleアカウント（Google Cloud Console へのアクセス）
- AWS CLI が設定済み
- CDKのデプロイ権限
- 現在のCognito認証情報：
  - User Pool ID: `ap-northeast-1_IG3yOKBmT`
  - Domain: `lightningtalk-secure-1738054592.auth.ap-northeast-1.amazoncognito.com`

## Step 1: Google Cloud Console でOAuth認証情報を作成

### 1.1 Google Cloud プロジェクトの作成

1. **Google Cloud Console を開く**
   - ブラウザで https://console.cloud.google.com/ にアクセス
   - Googleアカウントでログイン

2. **新しいプロジェクトを作成**
   - 上部のプロジェクト選択ドロップダウンをクリック
   - 「新しいプロジェクト」をクリック
   - プロジェクト名: `Lightning Talk Circle`
   - 場所: 組織がある場合は選択、なければそのまま
   - 「作成」をクリック

3. **プロジェクトの選択**
   - 作成したプロジェクトが自動選択されることを確認
   - されていない場合は、プロジェクト選択ドロップダウンから選択

### 1.2 必要なAPIを有効化

1. **左側メニューから「APIとサービス」→「ライブラリ」をクリック**

2. **Google+ API を有効化**
   - 検索バーに「Google+ API」と入力
   - 「Google+ API」をクリック
   - 「有効にする」をクリック

3. **Google Identity API の確認**
   - 検索バーに「Google Identity」と入力
   - 「Google Identity」をクリック
   - 既に有効になっていることを確認（通常は自動で有効）

### 1.3 OAuth同意画面の設定

1. **左側メニューから「APIとサービス」→「OAuth同意画面」をクリック**

2. **ユーザータイプの選択**
   - 「外部」を選択（個人用アカウントの場合）
   - 「作成」をクリック

3. **OAuth同意画面の設定**
   
   **「OAuth同意画面」タブで以下を入力：**
   - **アプリ名**: `Lightning Talk Circle`
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **アプリのロゴ**: （オプション）アプリのロゴをアップロード
   - **アプリドメイン**:
     - ホームページ: `https://xn--6wym69a.com`（発表.comの punycode）
     - プライバシーポリシー: `https://xn--6wym69a.com/privacy`
     - 利用規約: `https://xn--6wym69a.com/terms`
   - **承認済みドメイン**: 
     - `xn--6wym69a.com` を追加
     - `amazoncognito.com` を追加
   - **デベロッパーの連絡先情報**: あなたのメールアドレス
   - 「保存して次へ」をクリック

4. **「スコープ」タブ**
   - 「スコープを追加または削除」をクリック
   - 以下のスコープにチェック：
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile` 
     - `openid`
   - 「更新」をクリック
   - 「保存して次へ」をクリック

5. **「テストユーザー」タブ**
   - 開発中は「テストユーザーを追加」で自分のメールアドレスを追加
   - 「保存して次へ」をクリック

6. **「概要」タブで内容を確認**
   - 「ダッシュボードに戻る」をクリック

### 1.4 OAuth 2.0 認証情報の作成

1. **左側メニューから「APIとサービス」→「認証情報」をクリック**

2. **認証情報を作成**
   - 「+認証情報を作成」をクリック
   - 「OAuth 2.0 クライアントID」を選択

3. **アプリケーションタイプの選択**
   - 「ウェブアプリケーション」を選択

4. **詳細設定**
   - **名前**: `Lightning Talk Circle OAuth Client`
   
   - **承認済みの JavaScript 生成元**:
     ```
     https://xn--6wym69a.com
     http://localhost:3000
     ```
   
   - **承認済みのリダイレクト URI**:
     ```
     https://lightningtalk-secure-1738054592.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse
     https://xn--6wym69a.com/callback  
     http://localhost:3000/callback
     ```
   
   - 「作成」をクリック

5. **認証情報の保存**
   - 表示されるダイアログで「クライアントID」と「クライアントシークレット」をコピー
   - **重要**: これらの値は後で使用するため、安全な場所に保存
   - 「OK」をクリック

## Step 2: AWS Secrets Manager にGoogle認証情報を保存

### 2.1 AWS Secrets Manager でシークレットを作成

**AWS CLI を使用してシークレットを作成:**

```bash
# Google OAuth認証情報をSecrets Managerに保存
aws secretsmanager create-secret \
  --name "lightningtalk-google-oauth-credentials" \
  --description "Google OAuth credentials for Lightning Talk Circle" \
  --secret-string '{
    "client_id": "your-google-client-id.apps.googleusercontent.com",
    "client_secret": "your-google-client-secret"
  }' \
  --region ap-northeast-1
```

### 2.2 環境変数の設定

**`.env.local`（開発環境）を更新:**

```bash
# Google OAuth Configuration (for development testing)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Existing Cognito Configuration
VITE_USER_POOL_ID=ap-northeast-1_IG3yOKBmT
VITE_USER_POOL_CLIENT_ID=42u3ma63qf01utk4jcd6pn9l8s
VITE_IDENTITY_POOL_ID=ap-northeast-1:f570516d-a516-49ca-bb11-71477a976d8c
VITE_COGNITO_DOMAIN=lightningtalk-secure-1738054592.auth.ap-northeast-1.amazoncognito.com
```

## Step 3: AWS Cognito にGoogleアイデンティティプロバイダーを設定

### 3.1 AWS CLI を使用してGoogleプロバイダーを追加

```bash
# Googleアイデンティティプロバイダーを作成
aws cognito-idp create-identity-provider \
  --user-pool-id ap-northeast-1_IG3yOKBmT \
  --provider-name Google \
  --provider-type Google \
  --provider-details '{
    "client_id": "your-google-client-id.apps.googleusercontent.com",
    "client_secret": "your-google-client-secret",
    "authorize_scopes": "email openid profile"
  }' \
  --attribute-mapping '{
    "email": "email",
    "family_name": "family_name", 
    "given_name": "given_name",
    "name": "name",
    "picture": "picture",
    "username": "sub"
  }' \
  --region ap-northeast-1
```

### 3.2 User Pool Client を更新してGoogleプロバイダーを有効化

```bash
# User Pool ClientにGoogleプロバイダーを追加
aws cognito-idp update-user-pool-client \
  --user-pool-id ap-northeast-1_IG3yOKBmT \
  --client-id 42u3ma63qf01utk4jcd6pn9l8s \
  --supported-identity-providers COGNITO Google \
  --callback-urls https://xn--6wym69a.com/callback http://localhost:3000/callback \
  --logout-urls https://xn--6wym69a.com http://localhost:3000 \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes email openid profile \
  --allowed-o-auth-flows-user-pool-client \
  --region ap-northeast-1
```

## Step 4: CDK スタックの更新（オプション）

既存のCognitoスタックを更新してGoogleプロバイダーをコードで管理したい場合:

### 4.1 CDK コードを更新

`cdk/lib/cognito-stack.ts` を編集してGoogleプロバイダーを追加:

```typescript
// Google Identity Provider
const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
  userPool: userPool,
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  scopes: ['email', 'openid', 'profile'],
  attributeMapping: {
    email: cognito.ProviderAttribute.GOOGLE_EMAIL,
    familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
    givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
    fullname: cognito.ProviderAttribute.GOOGLE_NAME,
    profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
  },
});

// Update User Pool Client
userPoolClient.node.addDependency(googleProvider);
```

### 4.2 CDK デプロイ

```bash
# 環境変数を設定
export GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=your-google-client-secret

# CDKをデプロイ
cd cdk
npm run cdk:deploy:prod
```

## Step 5: フロントエンド認証のテスト

### 5.1 開発環境でのテスト

1. **開発サーバーを起動:**
   ```bash
   npm run dev
   ```

2. **テストページにアクセス:**
   - ブラウザで http://localhost:8000/test-login.html を開く

3. **Google認証をテスト:**
   - 「Cognitoログインをテスト」ボタンをクリック
   - 認証URLリンクをクリック
   - Google OAuth フローを完了

### 5.2 本番環境でのテスト

1. **本番環境にアクセス:**
   - https://xn--6wym69a.com にアクセス

2. **ログイン機能をテスト:**
   - 「イベント管理」→「管理者Googleアカウントでログイン」をクリック
   - Google OAuth フローを完了
   - ログイン成功を確認

## Security Notes

### Environment Variables

- Never commit Google credentials to version control
- Use AWS Secrets Manager or Parameter Store in production
- Rotate credentials regularly

### Domain Configuration

- Ensure all redirect URIs are properly configured
- Use HTTPS in production
- Validate all callback URLs

### User Data Handling

- Review Google's data usage policies
- Implement proper data retention policies
- Ensure GDPR compliance if applicable

## Step 6: 設定確認コマンド

### 6.1 Google Cloud Console での確認

1. **OAuth同意画面の公開設定**
   - 「APIs & Services」→「OAuth同意画面」
   - 「公開ステータス」が「本番環境」になっていることを確認
   - テスト中の場合は「テストユーザー」に対象ユーザーを追加

2. **認証情報の確認**
   - 「APIs & Services」→「認証情報」
   - OAuth 2.0 クライアントIDが正しく設定されていることを確認

### 6.2 AWS での確認コマンド

```bash
# Cognito User Pool の設定確認
aws cognito-idp describe-user-pool \
  --user-pool-id ap-northeast-1_IG3yOKBmT \
  --region ap-northeast-1

# アイデンティティプロバイダー一覧確認  
aws cognito-idp list-identity-providers \
  --user-pool-id ap-northeast-1_IG3yOKBmT \
  --region ap-northeast-1

# User Pool Client 設定確認
aws cognito-idp describe-user-pool-client \
  --user-pool-id ap-northeast-1_IG3yOKBmT \
  --client-id 42u3ma63qf01utk4jcd6pn9l8s \
  --region ap-northeast-1

# Googleプロバイダーの詳細確認
aws cognito-idp describe-identity-provider \
  --user-pool-id ap-northeast-1_IG3yOKBmT \
  --provider-name Google \
  --region ap-northeast-1
```

## トラブルシューティング

### よくある問題と解決方法

1. **「無効なリダイレクトURI」エラー**
   
   **症状**: OAuth認証時に「redirect_uri_mismatch」エラー
   
   **解決方法**:
   - Google Cloud ConsoleとCognito設定のリダイレクトURIが一致していることを確認
   - 国際化ドメイン名は punycode 形式（xn--6wym69a.com）で設定
   - URIの末尾にスラッシュが含まれていないことを確認

2. **「プロバイダーが見つからない」エラー**
   
   **症状**: CognitoでGoogleプロバイダーが認識されない
   
   **解決方法**:
   ```bash
   # プロバイダーの存在確認
   aws cognito-idp list-identity-providers \
     --user-pool-id ap-northeast-1_IG3yOKBmT \
     --region ap-northeast-1
   
   # プロバイダーが見つからない場合は再作成
   aws cognito-idp create-identity-provider \
     --user-pool-id ap-northeast-1_IG3yOKBmT \
     --provider-name Google \
     --provider-type Google \
     --provider-details file://google-provider-config.json
   ```

3. **「スコープエラー」**
   
   **症状**: 認証時にスコープ関連のエラー
   
   **解決方法**:
   - Google Cloud ConsoleのOAuth同意画面でスコープが正しく設定されているか確認
   - Cognitoのプロバイダー設定でスコープが一致していることを確認
   - 必要最小限のスコープ: `email`, `openid`, `profile`

4. **「アプリが確認されていません」警告**
   
   **症状**: Google認証時に警告が表示される
   
   **解決方法**:
   - Google Cloud ConsoleでOAuth同意画面を「本番環境」に変更
   - アプリの確認プロセスを完了（本格運用の場合）
   - テスト段階では「詳細設定」→「安全でないページに移動」で継続可能

5. **認証後のリダイレクトエラー**
   
   **症状**: 認証成功後にコールバックページでエラー
   
   **解決方法**:
   - フロントエンドのコールバック処理が正しく実装されているか確認
   - Cognito Hosted UIの設定確認
   - ブラウザの開発者ツールでエラーログを確認

### デバッグ用ログ取得

```bash
# CloudWatchでCognitoのログを確認（ログ記録が有効な場合）
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/cognito" \
  --region ap-northeast-1

# 最近のログイベントを取得
aws logs get-log-events \
  --log-group-name "/aws/cognito/userpool/ap-northeast-1_IG3yOKBmT" \
  --log-stream-name "google-oauth-debug" \
  --region ap-northeast-1
```

### テスト用 curl コマンド

```bash
# Cognitoの認証エンドポイントへの接続テスト
curl -I "https://lightningtalk-secure-1738054592.auth.ap-northeast-1.amazoncognito.com/login"

# OAuth認証URLの構築テスト
curl -X GET "https://lightningtalk-secure-1738054592.auth.ap-northeast-1.amazoncognito.com/oauth2/authorize?client_id=42u3ma63qf01utk4jcd6pn9l8s&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:3000/callback"
```

## Step 7: 自動設定スクリプト（推奨）

Google Cloud Consoleでの設定完了後、以下のスクリプトを使用してAWS設定を自動化できます：

### 使用方法

```bash
# 1. Google認証情報を環境変数に設定
export GOOGLE_CLIENT_ID='your-google-client-id.apps.googleusercontent.com'
export GOOGLE_CLIENT_SECRET='your-google-client-secret'

# 2. セットアップスクリプトを実行
./scripts/setup-google-oauth.sh
```

### スクリプトが実行する内容

1. **AWS Secrets Manager への認証情報保存**
   - Google OAuth認証情報を安全に保存
   - 既存のシークレットがある場合は更新

2. **Cognito アイデンティティプロバイダー設定**
   - Googleプロバイダーの作成または更新
   - 適切な属性マッピングの設定

3. **User Pool Client の更新**
   - Googleプロバイダーの有効化
   - コールバックURLとログアウトURLの設定
   - OAuth フローとスコープの設定

4. **設定の確認**
   - 作成されたリソースの検証
   - テスト用認証URLの生成

### スクリプト実行例

```bash
$ export GOOGLE_CLIENT_ID='123456789-abc.apps.googleusercontent.com'
$ export GOOGLE_CLIENT_SECRET='GOCSPX-your-secret-here'
$ ./scripts/setup-google-oauth.sh

🚀 Google OAuth セットアップスクリプト
======================================
✅ 使用する設定:
   User Pool ID: ap-northeast-1_IG3yOKBmT
   Client ID: 42u3ma63qf01utk4jcd6pn9l8s
   Region: ap-northeast-1

📋 Step 1: Google認証情報をAWS Secrets Managerに保存...
✅ Step 1 完了: シークレットが保存されました

📋 Step 2: CognitoにGoogleアイデンティティプロバイダーを設定...
✅ Step 2 完了: Googleアイデンティティプロバイダーが設定されました

📋 Step 3: User Pool ClientにGoogleプロバイダーを追加...
✅ Step 3 完了: User Pool Clientが更新されました

🎉 セットアップ完了！
```

## まとめ

このガイドに従って設定を完了すると、Lightning Talk CircleアプリケーションでGoogle OAuthを使用したソーシャルログインが利用できるようになります。

### 重要なポイント

1. **セキュリティ**: Google認証情報は必ずAWS Secrets Managerに保存
2. **ドメイン設定**: 国際化ドメイン名（発表.com）は punycode 形式で設定
3. **テスト**: 開発環境での動作確認を必ず実施
4. **監視**: CloudWatchでの認証ログ監視を推奨

### 次のステップ

- 本番環境でのGoogle OAuth認証テスト
- ユーザー体験の最適化
- エラーハンドリングの強化
- セキュリティ監査の実施

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [AWS Cognito External Identity Providers](https://docs.aws.amazon.com/cognito/latest/developerguide/external-identity-providers.html)
- [Cognito Google Identity Provider](https://docs.aws.amazon.com/cognito/latest/developerguide/google.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [Cognito Hosted UI](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
