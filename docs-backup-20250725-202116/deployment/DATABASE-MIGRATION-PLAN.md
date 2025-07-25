# Database Migration Plan: File-based → PostgreSQL

## 🎯 Migration Overview

Lightning Talk
CircleのデータベースをファイルベースシステムからPostgreSQLに移行し、本番環境での高性能・高可用性を実現します。

## 📊 Current State Analysis

### File-based Database (Current)

```
server/data/
├── events.json          # イベント情報
├── participants.json    # 参加者情報
├── talks.json          # 発表情報
├── settings.json       # アプリケーション設定
└── analytics.json      # 分析データ
```

**制限事項:**

- 同時アクセス制限
- トランザクション未対応
- スケーラビリティの欠如
- バックアップ・レプリケーション不可
- 複雑クエリの性能不足

### PostgreSQL Database (Target)

```sql
-- Production-ready schema with:
- events              # イベント管理 (ACID準拠)
- participants        # 参加者管理 (制約付き)
- talks              # 発表管理 (リレーション付き)
- settings           # 設定管理 (JSONB対応)
- analytics          # 分析データ (時系列最適化)
```

**改善点:**

- ✅ ACID準拠のトランザクション
- ✅ 高性能インデックス
- ✅ 外部キー制約
- ✅ 同時接続プール
- ✅ レプリケーション対応

## 🚀 Migration Strategy

### Phase 1: Infrastructure Setup

1. **PostgreSQL環境構築**

   ```bash
   # Development environment
   docker-compose up postgres

   # Production environment (example)
   # AWS RDS, Google Cloud SQL, or Azure Database
   ```

2. **Connection Configuration**

   ```env
   # Development
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lightningtalk

   # Production
   DATABASE_URL=postgresql://user:pass@host:5432/lightningtalk?sslmode=require
   ```

### Phase 2: Data Migration Script

```javascript
// scripts/migrate-to-postgresql.js
import { FileDatabase } from '../server/services/database.js';
import { PostgreSQLDatabaseService } from '../server/services/database-postgresql.js';

const migrationSteps = [
  'migrateEvents',
  'migrateParticipants',
  'migrateTalks',
  'migrateSettings',
  'migrateAnalytics',
  'validateIntegrity'
];
```

### Phase 3: Gradual Deployment

1. **Dual-write Period** (1週間)
   - 新データをPostgreSQLとファイルに両方書き込み
   - 読み込みはファイルから継続
2. **Testing Period** (1週間)
   - PostgreSQL読み込みテスト
   - パフォーマンス検証
   - データ整合性確認

3. **Full Migration** (1日)
   - PostgreSQL完全移行
   - ファイルベース無効化

## 🔧 Implementation Plan

### Step 1: Database Service Abstraction

```javascript
// server/services/database-factory.js
export function createDatabaseService() {
  const dbType = process.env.DATABASE_TYPE || 'file';

  switch (dbType) {
    case 'postgresql':
      return new PostgreSQLDatabaseService();
    case 'file':
    default:
      return new FileBasedDatabaseService();
  }
}
```

### Step 2: Migration Script Implementation

```bash
# Create migration script
npm run migrate:prepare    # Backup current data
npm run migrate:execute    # Run migration
npm run migrate:verify     # Verify integrity
npm run migrate:cleanup    # Clean old files
```

### Step 3: Environment Variables

```env
# Migration control
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@host:5432/lightningtalk

# Backup settings
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30

# Performance tuning
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=2000
DB_IDLE_TIMEOUT=30000
```

## 📈 Performance Expectations

### Before (File-based)

- **Concurrent Users**: 1-2
- **Query Time**: 10-100ms
- **Data Size Limit**: ~100MB
- **Backup**: Manual file copy

### After (PostgreSQL)

- **Concurrent Users**: 100+
- **Query Time**: 1-10ms
- **Data Size Limit**: Multi-GB
- **Backup**: Automated + PITR

## 🔒 Security Enhancements

### Connection Security

```javascript
// SSL/TLS encryption
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false
        }
      : false
};
```

### Access Control

```sql
-- Role-based access control
CREATE ROLE lt_readonly;
CREATE ROLE lt_readwrite;
CREATE ROLE lt_admin;

-- Grant specific permissions
GRANT SELECT ON ALL TABLES TO lt_readonly;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES TO lt_readwrite;
GRANT ALL PRIVILEGES ON ALL TABLES TO lt_admin;
```

## 🧪 Testing Strategy

### Unit Tests

```javascript
// tests/integration/database-postgresql.test.js
describe('PostgreSQL Database Service', () => {
  test('should create event with proper constraints');
  test('should handle concurrent participant registration');
  test('should maintain referential integrity');
  test('should perform transaction rollback on error');
});
```

### Performance Tests

```javascript
// Load testing scenarios
- 100 concurrent registrations
- 1000 event queries per second
- Large data export operations
- Connection pool stress testing
```

### Data Integrity Tests

```javascript
// Migration validation
- Row count matching
- Data type verification
- Relationship preservation
- Performance benchmark comparison
```

## 📋 Migration Checklist

### Pre-Migration

- [ ] PostgreSQL環境セットアップ完了
- [ ] バックアップ戦略確立
- [ ] Migration script テスト完了
- [ ] Performance baseline取得
- [ ] Rollback plan準備

### Migration Day

- [ ] メンテナンスモード開始
- [ ] 最終データバックアップ
- [ ] Migration script実行
- [ ] データ整合性検証
- [ ] パフォーマンステスト
- [ ] アプリケーション動作確認
- [ ] メンテナンスモード終了

### Post-Migration

- [ ] 24時間監視強化
- [ ] エラーログ監視
- [ ] パフォーマンスメトリクス確認
- [ ] ユーザーフィードバック収集
- [ ] 旧ファイルアーカイブ

## 🚨 Rollback Strategy

### Immediate Rollback (< 1 hour)

```bash
# Switch back to file database
export DATABASE_TYPE=file
pm2 restart lightningtalk
```

### Data Restoration (1-4 hours)

```bash
# Restore from backup
npm run restore:from-backup --date=2025-06-22
npm run verify:data-integrity
```

### Complete Rollback (4-8 hours)

```bash
# Full system restoration
docker-compose down
docker-compose -f docker-compose.file-db.yml up
npm run restore:complete
```

## 📊 Monitoring & Alerts

### Key Metrics

- Connection pool utilization
- Query execution time
- Transaction throughput
- Error rates
- Data consistency checks

### Alerting Thresholds

- Query time > 100ms
- Connection pool > 80%
- Error rate > 1%
- Disk usage > 85%

---

**Migration Timeline**: 2-3 weeks  
**Estimated Downtime**: < 2 hours  
**Risk Level**: Medium (with proper testing)  
**Business Impact**: High performance improvement
