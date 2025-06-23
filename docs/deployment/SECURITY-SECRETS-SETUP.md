# Security Secrets Setup Guide

## 🔐 GitHub Secrets Configuration

本番環境でのセキュリティを確保するため、以下のGitHub Secretsを設定してください。

### 必要なSecrets

#### 認証・セッション管理
```bash
JWT_SECRET=415bf2d0f69d4df63aa5d4392e6a07264ff9077ef27bf0482fab648190697ac3f31c23667a39d4a674c42e46fa42fe8b5f3728442267ec3d6d29b3fdd00d3c86
SESSION_SECRET=3362b7c765d48b4eba0299bcbd5c831bbb61f8c6fcb55c3b4992595f8715580e135757858c6b01ac3f71615e090bac13780a1214fb90dd1776d1d4810d042c4a
```

#### GitHub統合
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=20m61
GITHUB_REPO=lightningtalk-circle
```

#### WordPress統合
```bash
WP_USERNAME=wpmaster
WP_PASSWORD=fytbuh-3repRu-nucbyf
WP_APP_PASSWORD=2XAN B2ud oVHc Y2lE 3hVb PtRd
```

### GitHub Secrets設定手順

1. **リポジトリのSettings**に移動
2. **Secrets and variables > Actions**を選択
3. **New repository secret**をクリック
4. 上記のSecret名と値を順次追加

### 本番環境変数の検証

```bash
# シークレットが正しく設定されているか確認
node -e "
const crypto = require('crypto');
const jwt = process.env.JWT_SECRET;
const session = process.env.SESSION_SECRET;

console.log('JWT_SECRET length:', jwt ? jwt.length : 'NOT SET');
console.log('SESSION_SECRET length:', session ? session.length : 'NOT SET');
console.log('Secrets valid:', jwt && session && jwt.length >= 64 && session.length >= 64);
"
```

### セキュリティベストプラクティス

#### ✅ 実装済み
- 64バイト（512ビット）の強力なランダムシークレット
- 本番・開発環境の分離
- GitHub Secrets経由での安全な管理

#### 🔄 今後の改善点
- シークレットローテーション戦略
- 環境別シークレット管理
- 監査ログの実装

### セキュリティ警告

⚠️ **重要**: 以下のセキュリティ事項を必ず遵守してください

1. **シークレットの保護**
   - .envファイルを本番環境にコミットしない
   - ローカル開発時もシークレットを共有しない
   - 定期的なシークレットローテーション

2. **アクセス制御**
   - GitHub SecretsはRepository Admin権限が必要
   - 最小権限の原則に従った権限設定
   - 開発者アクセスの適切な管理

3. **監査とモニタリング**
   - シークレット使用の監査ログ
   - 不正アクセスの検知
   - セキュリティインシデント対応計画

## 🛡️ Production Security Checklist

### 環境設定
- [ ] JWT_SECRET設定完了
- [ ] SESSION_SECRET設定完了
- [ ] GitHub Secrets設定完了
- [ ] WordPress認証情報設定完了

### セキュリティ強化
- [ ] HTTPS強制設定
- [ ] セキュリティヘッダー設定
- [ ] レート制限実装
- [ ] 入力検証強化

### 監視とログ
- [ ] セキュリティ監視設定
- [ ] エラーログ設定
- [ ] アクセスログ設定
- [ ] 異常検知設定

---

**最終更新**: 2025-06-22  
**作成者**: Claude Code Assistant  
**レビュー**: 本番デプロイ前に必須