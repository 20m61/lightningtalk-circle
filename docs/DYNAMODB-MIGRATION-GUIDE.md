# DynamoDB Migration Guide

Lightning Talk CircleのデータをファイルベースからDynamoDBへ移行するためのガイドです。

## 📊 テーブル構造

### 1. Events Table
- **テーブル名**: `lightningtalk-circle-{stage}-events`
- **パーティションキー**: `id` (String)
- **ソートキー**: `createdAt` (String)
- **GSI**: `date-index` (status, date)

```json
{
  "id": "event-123",
  "title": "第1回 なんでもライトニングトーク",
  "description": "5分間で世界を変える！",
  "date": "2025-06-25T19:00:00+09:00",
  "endDate": "2025-06-25T22:00:00+09:00",
  "venue": {
    "name": "新宿会場",
    "address": "西新宿8-14-19",
    "capacity": 50,
    "online": true,
    "onlineUrl": "https://meet.google.com/xxx"
  },
  "status": "upcoming",
  "registrationOpen": true,
  "talkSubmissionOpen": true,
  "maxTalks": 20,
  "talkDuration": 5,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### 2. Participants Table
- **テーブル名**: `lightningtalk-circle-{stage}-participants`
- **パーティションキー**: `id` (String)
- **ソートキー**: `eventId` (String)
- **GSI**: `event-index` (eventId, createdAt)

```json
{
  "id": "participant-456",
  "eventId": "event-123",
  "name": "山田太郎",
  "email": "yamada@example.com",
  "participationType": "offline",
  "emergencyContact": "090-1234-5678",
  "dietaryRestrictions": "アレルギー: 卵",
  "createdAt": "2025-01-02T10:00:00Z",
  "updatedAt": "2025-01-02T10:00:00Z"
}
```

### 3. Users Table
- **テーブル名**: `lightningtalk-circle-{stage}-users`
- **パーティションキー**: `id` (String)
- **GSI**: `email-index` (email)

```json
{
  "id": "user-789",
  "email": "admin@example.com",
  "name": "管理者",
  "passwordHash": "$2b$10$...",
  "role": "admin",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### 4. Talks Table
- **テーブル名**: `lightningtalk-circle-{stage}-talks`
- **パーティションキー**: `id` (String)
- **ソートキー**: `eventId` (String)
- **GSI**: `event-index` (eventId, order)

```json
{
  "id": "talk-101",
  "eventId": "event-123",
  "title": "5分でわかるDocker入門",
  "description": "Dockerの基本を実演デモ付きで紹介",
  "speakerName": "田中花子",
  "speakerEmail": "tanaka@example.com",
  "category": "tech",
  "status": "approved",
  "order": 1,
  "rating": 4.5,
  "createdAt": "2025-01-03T14:00:00Z",
  "updatedAt": "2025-01-03T14:00:00Z"
}
```

## 🔧 移行手順

### Step 1: 既存データのエクスポート

```bash
# 既存のJSONファイルをバックアップ
cp -r server/data/ ./backup-$(date +%Y%m%d)/
```

### Step 2: 移行スクリプトの実行

```javascript
// scripts/migrate-to-dynamodb.js
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');

const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

async function migrateEvents() {
  const eventsFile = path.join(__dirname, '../server/data/events.json');
  const events = JSON.parse(await fs.readFile(eventsFile, 'utf-8'));
  
  for (const event of events) {
    const params = {
      TableName: `lightningtalk-circle-${process.env.STAGE}-events`,
      Item: {
        ...event,
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    try {
      await dynamodb.put(params).promise();
      console.log(`✅ Migrated event: ${event.id}`);
    } catch (error) {
      console.error(`❌ Failed to migrate event ${event.id}:`, error);
    }
  }
}

// 同様に他のテーブルも移行
async function migrate() {
  console.log('🚀 Starting DynamoDB migration...');
  
  await migrateEvents();
  await migrateParticipants();
  await migrateUsers();
  await migrateTalks();
  
  console.log('✅ Migration completed!');
}

migrate().catch(console.error);
```

### Step 3: アプリケーションコードの更新

既存の`DatabaseService`をDynamoDB対応に更新：

```javascript
// server/services/dynamodb-database.js
const AWS = require('aws-sdk');

class DynamoDBDatabaseService {
  constructor() {
    this.dynamodb = new AWS.DynamoDB.DocumentClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.tables = {
      events: process.env.DYNAMODB_EVENTS_TABLE,
      participants: process.env.DYNAMODB_PARTICIPANTS_TABLE,
      users: process.env.DYNAMODB_USERS_TABLE,
      talks: process.env.DYNAMODB_TALKS_TABLE
    };
  }
  
  async findOne(collection, id) {
    const params = {
      TableName: this.tables[collection],
      Key: { id }
    };
    
    const result = await this.dynamodb.get(params).promise();
    return result.Item;
  }
  
  async find(collection, filter = {}) {
    // クエリまたはスキャンの実装
    // GSIを使用した効率的なクエリ
  }
  
  async insert(collection, data) {
    const item = {
      ...data,
      id: data.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const params = {
      TableName: this.tables[collection],
      Item: item
    };
    
    await this.dynamodb.put(params).promise();
    return item;
  }
  
  // その他のメソッドも実装
}
```

## 🔄 ロールバック手順

問題が発生した場合のロールバック：

1. アプリケーションを旧バージョンに戻す
2. 環境変数`DATABASE_TYPE=file`に設定
3. バックアップからデータを復元

```bash
# データの復元
cp -r ./backup-20250106/* server/data/
```

## 📝 注意事項

### コスト最適化
- DynamoDBはPay-per-requestモードで設定
- 使用量に応じた課金のため、初期コストは最小限
- 必要に応じてプロビジョンドキャパシティに変更可能

### パフォーマンス考慮事項
- GSIを活用して効率的なクエリを実行
- バッチ処理にはBatchWriteItemを使用
- 大量データの場合はDynamoDB Streamsでの非同期処理を検討

### セキュリティ
- IAMロールで最小権限の原則を適用
- VPCエンドポイントを使用してプライベート接続
- 保管時・転送時の暗号化が有効

## 🧪 テスト方法

### ローカルテスト
DynamoDB Localを使用：

```bash
# DynamoDB Localの起動
docker run -p 8000:8000 amazon/dynamodb-local

# 環境変数の設定
export AWS_ENDPOINT_URL=http://localhost:8000
export AWS_REGION=local
```

### 統合テスト
```javascript
// tests/dynamodb-integration.test.js
describe('DynamoDB Integration', () => {
  test('should create and retrieve event', async () => {
    const event = {
      id: 'test-event-1',
      title: 'Test Event',
      date: '2025-07-01T10:00:00Z'
    };
    
    await db.insert('events', event);
    const retrieved = await db.findOne('events', 'test-event-1');
    
    expect(retrieved.title).toBe('Test Event');
  });
});
```

## 🚀 本番移行チェックリスト

- [ ] バックアップ完了
- [ ] DynamoDBテーブル作成確認
- [ ] IAMロール権限確認
- [ ] 移行スクリプトのテスト実行
- [ ] アプリケーションコードの更新
- [ ] 環境変数の設定
- [ ] CloudWatchアラームの設定
- [ ] ロードテストの実施
- [ ] ロールバック手順の確認

## 📊 モニタリング

移行後の監視項目：
- ConsumedReadCapacityUnits
- ConsumedWriteCapacityUnits
- UserErrors (スロットリング)
- SystemErrors
- レイテンシメトリクス

CloudWatchダッシュボードで可視化されます。