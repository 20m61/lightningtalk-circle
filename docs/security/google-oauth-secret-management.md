# Google OAuth Client Secret 管理ガイド

## 概要

このドキュメントでは、Google OAuth Client
Secret を安全に管理する方法について説明します。

**重要**: Client
Secret は絶対にコードにハードコードしたり、バージョン管理システムにコミットしてはいけません。

## 本番環境での管理

### AWS Secrets Manager を使用

本番環境では AWS Secrets Manager を使用してシークレットを管理します。

#### 1. シークレットの更新

提供されているスクリプトを使用して更新します：

```bash
# スクリプトを実行
./scripts/update-google-secret.sh
```

または AWS CLI を直接使用：

```bash
# 既存のシークレットを更新
aws secretsmanager update-secret \
  --secret-id lightningtalk-google-client-secret \
  --secret-string '{"clientSecret":"your-new-secret"}' \
  --region ap-northeast-1
```

#### 2. アプリケーションでの使用

アプリケーションは自動的に AWS Secrets Manager から取得します：

```javascript
// server/routes/auth.js の実装
try {
  const AWS = await import('aws-sdk');
  const secretsManager = new AWS.SecretsManager({ region: 'ap-northeast-1' });
  const secretResult = await secretsManager
    .getSecretValue({ SecretId: 'lightningtalk-google-client-secret' })
    .promise();
  const secretData = JSON.parse(secretResult.SecretString);
  clientSecret = secretData.clientSecret;
} catch (error) {
  // 開発環境用のフォールバック
  clientSecret = process.env.GOOGLE_CLIENT_SECRET;
}
```

## 開発環境での管理

### 環境変数を使用

開発環境では環境変数を使用します。

#### 1. .env ファイルの設定

```bash
# .env ファイル（.gitignore に含まれていることを確認）
GOOGLE_CLIENT_SECRET=your-development-secret
```

#### 2. .env.example の更新

```bash
# .env.example（実際の値は含めない）
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### セキュリティベストプラクティス

1. **ローテーション**: 定期的にシークレットをローテーション
2. **最小権限**: 必要最小限のスコープのみを要求
3. **監査**: AWS CloudTrail でシークレットへのアクセスを監査
4. **暗号化**: AWS Secrets Manager は自動的に暗号化を提供

## シークレットローテーション手順

### 1. Google Cloud Console での新しいシークレット生成

1. [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. 「APIとサービス」→「認証情報」
3. 該当の OAuth 2.0 クライアント ID をクリック
4. 「シークレットをリセット」をクリック
5. 新しいシークレットをコピー

### 2. AWS Secrets Manager の更新

```bash
# 提供されているスクリプトを使用
./scripts/update-google-secret.sh
```

### 3. アプリケーションの再起動

```bash
# 本番環境（ECS の場合）
aws ecs update-service \
  --cluster your-cluster-name \
  --service your-service-name \
  --force-new-deployment
```

### 4. 古いシークレットの無効化

Google Cloud Console で古いシークレットを削除

## トラブルシューティング

### エラー: "Google Client Secret not configured"

**原因**: シークレットが設定されていない

**解決方法**:

- 本番環境: AWS Secrets Manager を確認
- 開発環境: 環境変数 `GOOGLE_CLIENT_SECRET` を設定

### エラー: "Could not retrieve client secret from AWS Secrets Manager"

**原因**: AWS 認証情報または権限の問題

**解決方法**:

1. AWS 認証情報を確認: `aws sts get-caller-identity`
2. IAM ポリシーで `secretsmanager:GetSecretValue` 権限を確認
3. シークレット名が正しいことを確認

## セキュリティチェックリスト

- [ ] Client Secret がコードにハードコードされていない
- [ ] .env ファイルが .gitignore に含まれている
- [ ] AWS Secrets Manager のアクセスポリシーが適切に設定されている
- [ ] 定期的なシークレットローテーションのスケジュールが設定されている
- [ ] CloudTrail でシークレットアクセスの監査が有効になっている
- [ ] 開発者に最小限の権限のみが付与されている

## 関連リンク

- [AWS Secrets Manager ドキュメント](https://docs.aws.amazon.com/secretsmanager/)
- [Google OAuth 2.0 セキュリティベストプラクティス](https://developers.google.com/identity/protocols/oauth2/security)
- [OWASP シークレット管理チートシート](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_CheatSheet.html)
