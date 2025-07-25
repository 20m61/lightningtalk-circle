#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Simple color functions
const colors = {
  blue: text => `\x1b[34m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  gray: text => `\x1b[90m${text}\x1b[0m`,
  bold: text => `\x1b[1m${text}\x1b[0m`
};

async function generateApiDocs() {
  console.log(colors.bold('📚 API Documentation Generator'));
  console.log(colors.gray('='.repeat(60)));

  try {
    // APIエンドポイントの情報を収集
    const routesDir = path.join(__dirname, '../server/routes');
    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

    console.log(colors.blue(`\n🔍 ${routeFiles.length}個のAPIルートファイルを発見`));

    // APIドキュメントのテンプレート
    const apiDoc = `# Lightning Talk Circle API Reference

> このドキュメントは、Lightning Talk Circle APIの包括的なリファレンスです。

## 概要

Lightning Talk Circle APIは、ライトニングトークイベントの管理に必要なすべての機能を提供するRESTful APIです。

### ベースURL

\`\`\`
開発環境: http://localhost:3000/api
本番環境: https://api.lightningtalk.example.com/api
\`\`\`

### 認証

ほとんどのAPIエンドポイントはJWT認証が必要です。

\`\`\`http
Authorization: Bearer <your-jwt-token>
\`\`\`

### レート制限

- 一般的なエンドポイント: 15分あたり100リクエスト/IP
- 登録エンドポイント: 1時間あたり5リクエスト/IP

## エンドポイント一覧

### 認証 (Authentication)

#### POST /api/auth/register
新規ユーザー登録

**リクエストボディ:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "User Name"
}
\`\`\`

**レスポンス:**
\`\`\`json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
\`\`\`

#### POST /api/auth/login
ユーザーログイン

**リクエストボディ:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
\`\`\`

#### POST /api/auth/google
Google OAuth認証

**リクエストボディ:**
\`\`\`json
{
  "idToken": "google-id-token"
}
\`\`\`

### イベント管理 (Events)

#### GET /api/events
イベント一覧取得

**クエリパラメータ:**
- \`status\`: active | past | upcoming
- \`limit\`: 取得件数 (デフォルト: 10)
- \`offset\`: オフセット (デフォルト: 0)

**レスポンス:**
\`\`\`json
{
  "events": [
    {
      "id": "event-id",
      "title": "Lightning Talk #1",
      "date": "2025-08-01T19:00:00+09:00",
      "location": "東京",
      "description": "第1回ライトニングトーク",
      "status": "upcoming",
      "capacity": 50,
      "registered": 30
    }
  ],
  "total": 15,
  "limit": 10,
  "offset": 0
}
\`\`\`

#### POST /api/events
新規イベント作成（管理者のみ）

**認証:** 必須（管理者権限）

**リクエストボディ:**
\`\`\`json
{
  "title": "Lightning Talk #2",
  "date": "2025-09-01T19:00:00+09:00",
  "location": "大阪",
  "description": "第2回ライトニングトーク",
  "capacity": 100,
  "registrationDeadline": "2025-08-25T23:59:59+09:00"
}
\`\`\`

#### GET /api/events/:id
イベント詳細取得

**レスポンス:**
\`\`\`json
{
  "id": "event-id",
  "title": "Lightning Talk #1",
  "date": "2025-08-01T19:00:00+09:00",
  "location": "東京",
  "description": "第1回ライトニングトーク",
  "status": "upcoming",
  "capacity": 50,
  "registered": 30,
  "talks": [
    {
      "id": "talk-id",
      "title": "5分で分かるTypeScript",
      "speaker": "山田太郎",
      "duration": 5
    }
  ],
  "venue": {
    "name": "東京カンファレンスセンター",
    "address": "東京都渋谷区...",
    "mapUrl": "https://maps.google.com/..."
  }
}
\`\`\`

### 参加者管理 (Participants)

#### POST /api/events/:eventId/participants
イベント参加登録

**認証:** 必須

**リクエストボディ:**
\`\`\`json
{
  "attendanceType": "in-person" | "online",
  "dietaryRestrictions": "ベジタリアン",
  "emergencyContact": {
    "name": "緊急連絡先名",
    "phone": "090-1234-5678"
  }
}
\`\`\`

#### GET /api/events/:eventId/participants
参加者一覧取得（管理者のみ）

**認証:** 必須（管理者権限）

### トーク管理 (Talks)

#### POST /api/events/:eventId/talks
トーク申し込み

**認証:** 必須

**リクエストボディ:**
\`\`\`json
{
  "title": "5分で分かるTypeScript",
  "description": "TypeScriptの基本を5分で解説します",
  "duration": 5,
  "equipment": ["プロジェクター", "マイク"]
}
\`\`\`

#### GET /api/talks/:id
トーク詳細取得

#### PUT /api/talks/:id
トーク情報更新（発表者本人または管理者）

### 管理機能 (Admin)

#### GET /api/admin/dashboard
管理ダッシュボード情報取得

**認証:** 必須（管理者権限）

**レスポンス:**
\`\`\`json
{
  "stats": {
    "totalEvents": 15,
    "activeEvents": 3,
    "totalParticipants": 450,
    "totalTalks": 120
  },
  "recentActivity": [
    {
      "type": "registration",
      "user": "user@example.com",
      "event": "Lightning Talk #1",
      "timestamp": "2025-07-25T10:30:00Z"
    }
  ]
}
\`\`\`

### モニタリング (Monitoring)

#### GET /api/monitoring/health
ヘルスチェック

**レスポンス:**
\`\`\`json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "email": "operational",
    "github": "connected"
  }
}
\`\`\`

#### GET /api/monitoring/metrics
メトリクス取得

**認証:** 必須（管理者権限）

## エラーレスポンス

すべてのエラーレスポンスは以下の形式に従います：

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "人間が読めるエラーメッセージ",
    "details": {
      "field": "詳細情報"
    }
  }
}
\`\`\`

### 一般的なエラーコード

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| UNAUTHORIZED | 401 | 認証が必要です |
| FORBIDDEN | 403 | アクセス権限がありません |
| NOT_FOUND | 404 | リソースが見つかりません |
| VALIDATION_ERROR | 400 | 入力検証エラー |
| RATE_LIMIT_EXCEEDED | 429 | レート制限を超過しました |
| INTERNAL_ERROR | 500 | サーバー内部エラー |

## SDKとツール

### JavaScript/TypeScript SDK

\`\`\`javascript
import { LightningTalkClient } from '@lightningtalk/sdk';

const client = new LightningTalkClient({
  baseUrl: 'https://api.lightningtalk.example.com',
  apiKey: 'your-api-key'
});

// イベント一覧取得
const events = await client.events.list({ status: 'upcoming' });

// イベント参加登録
await client.events.register(eventId, {
  attendanceType: 'in-person'
});
\`\`\`

### cURL サンプル

\`\`\`bash
# ログイン
curl -X POST https://api.lightningtalk.example.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"password"}'

# イベント一覧取得
curl https://api.lightningtalk.example.com/api/events \\
  -H "Authorization: Bearer <token>"
\`\`\`

## Webhook

イベント発生時に指定されたURLに通知を送信します。

### 対応イベント

- \`event.created\` - 新規イベント作成
- \`participant.registered\` - 参加登録
- \`talk.submitted\` - トーク申し込み
- \`talk.approved\` - トーク承認

### Webhookペイロード

\`\`\`json
{
  "event": "participant.registered",
  "timestamp": "2025-07-25T10:30:00Z",
  "data": {
    "eventId": "event-id",
    "participantId": "participant-id",
    "email": "user@example.com"
  }
}
\`\`\`

## 変更履歴

### v1.0.0 (2025-07-25)
- 初回リリース
- 基本的なイベント管理機能
- Google OAuth認証対応
- 管理者機能

## サポート

- GitHub Issues: https://github.com/your-org/lightningtalk-circle/issues
- Email: support@lightningtalk.example.com
`;

    // ファイルを保存
    const outputPath = path.join(__dirname, '../docs/api/reference.md');
    fs.writeFileSync(outputPath, apiDoc);

    console.log(colors.green(`✅ APIドキュメントを生成しました: ${outputPath}`));

    // OpenAPI仕様も生成
    console.log(colors.blue('\n🔧 OpenAPI仕様を生成中...'));

    try {
      // サーバーが起動している場合は実際のスペックを取得
      const { stdout } = await execPromise('curl -s http://localhost:3000/api/docs/openapi.json');
      const openApiPath = path.join(__dirname, '../docs/api/openapi.json');
      fs.writeFileSync(openApiPath, stdout);
      console.log(colors.green(`✅ OpenAPI仕様を保存しました: ${openApiPath}`));
    } catch (error) {
      console.log(
        colors.yellow('⚠️  サーバーが起動していないため、OpenAPI仕様の取得をスキップしました')
      );
    }
  } catch (error) {
    console.error(colors.red(`❌ エラー: ${error.message}`));
    process.exit(1);
  }
}

// 実行
generateApiDocs();
