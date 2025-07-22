# 🔐 新しいAWS Cognito認証情報（ローテーション完了）

## ✅ ローテーション実施日: 2025年7月22日

### 🆕 新しい本番環境認証情報

**User Pool:**

- **User Pool ID**: `ap-northeast-1_IG3yOKBmT`
- **User Pool Name**: `lightningtalk-prod-secure`
- **ARN**:
  `arn:aws:cognito-idp:ap-northeast-1:822063948773:userpool/ap-northeast-1_IG3yOKBmT`

**App Client:**

- **Client ID**: `42u3ma63qf01utk4jcd6pn9l8s`
- **Client Secret**: `16io8ju06t7tjedtg3krhopjg9r3e52v6tefa0lb8sudc12h8ksn` (AWS
  Secrets Managerに保存してください)
- **Client Name**: `lightningtalk-web-client`

**Identity Pool:**

- **Identity Pool ID**: `ap-northeast-1:f570516d-a516-49ca-bb11-71477a976d8c`
- **Identity Pool Name**: `lightningtalk-prod-secure-identity`

**Cognito Domain:**

- **Domain**:
  `lightningtalk-secure-1738054592.auth.ap-northeast-1.amazoncognito.com`

### 📋 環境変数の更新

```bash
# サーバー側環境変数
COGNITO_USER_POOL_ID=ap-northeast-1_IG3yOKBmT
COGNITO_CLIENT_ID=42u3ma63qf01utk4jcd6pn9l8s
COGNITO_REGION=ap-northeast-1
COGNITO_DOMAIN=lightningtalk-secure-1738054592.auth.ap-northeast-1.amazoncognito.com
COGNITO_IDENTITY_POOL_ID=ap-northeast-1:f570516d-a516-49ca-bb11-71477a976d8c

# フロントエンド環境変数
VITE_USER_POOL_ID=ap-northeast-1_IG3yOKBmT
VITE_USER_POOL_CLIENT_ID=42u3ma63qf01utk4jcd6pn9l8s
VITE_IDENTITY_POOL_ID=ap-northeast-1:f570516d-a516-49ca-bb11-71477a976d8c
VITE_COGNITO_DOMAIN=lightningtalk-secure-1738054592.auth.ap-northeast-1.amazoncognito.com
VITE_AWS_REGION=ap-northeast-1
```

### 🔒 セキュリティ強化項目

1. **パスワードポリシー強化**:
   - 最小8文字
   - 大文字必須 ✅
   - 小文字必須 ✅
   - 数字必須 ✅
   - 記号必須 ✅（新規追加）

2. **OAuth設定**:
   - Authorization Codeフローのみ許可
   - スコープ: openid, profile, email
   - コールバックURL: 本番とローカルのみ

3. **タグ付け**:
   - Environment: production
   - Project: lightning-talk-circle
   - RotatedDate: 2025-07-22

### ⚠️ 重要な次のステップ

1. **AWS Secrets Managerに保存**:

   ```bash
   aws secretsmanager create-secret --name lightningtalk-cognito-credentials \
     --secret-string '{"client_secret":"16io8ju06t7tjedtg3krhopjg9r3e52v6tefa0lb8sudc12h8ksn"}'
   ```

2. **デプロイメント環境の更新**:
   - CI/CDパイプラインの環境変数を更新
   - ECS Task Definitionの環境変数を更新
   - Lambda環境変数を更新

3. **アプリケーションのテスト**:
   - ログイン機能の動作確認
   - Google OAuth統合の再設定（必要な場合）

### 🗑️ 古い認証情報の無効化

以下の古い認証情報は既に無効化されています：

- ❌ User Pool: `ap-northeast-1_Wwsw04u84`
- ❌ Client ID: `5s4ogan946f0dc19tklh0s1tim`
- ❌ User Pool: `ap-northeast-1_i4IV8ixyg`
- ❌ Client ID: `4ovq46vkld3t00o0slmr237s0l`

---

**セキュリティローテーション完了** 🎉 Lightning Talk
Circleアプリケーションは新しい認証情報で安全に運用できます。
