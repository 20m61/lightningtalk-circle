# Lightning Talk Circle - ロールバック手順書

## 📋 概要

本ドキュメントは、Lightning Talk
Circleシステムにおける各種ロールバック手順を定めています。デプロイメントやシステム変更で問題が発生した場合に、迅速かつ安全に以前の状態に戻すための包括的なガイドです。

## 🎯 ロールバック原則

1. **迅速性**: 問題検知から15分以内にロールバック判断
2. **安全性**: データ整合性を保持しながらロールバック
3. **透明性**: 全ての操作を記録し、関係者に通知
4. **検証性**: ロールバック後の動作確認を必須とする

## 🚨 ロールバックトリガー

### 自動ロールバック条件

- エラー率が5%を超過（5分間継続）
- 応答時間P95が2秒を超過（10分間継続）
- ヘルスチェック失敗率50%以上
- メモリ使用率95%超過

### 手動ロールバック判断基準

- 重大なバグの発見
- データ不整合の検出
- セキュリティ脆弱性の発見
- ビジネスロジックの重大な誤り

## 📊 ロールバックタイプ

### Type A: アプリケーションロールバック

#### 対象

- API サービス
- WebSocketサービス
- Lambda関数
- 静的アセット

#### 所要時間

5-10分

#### 手順

```bash
#!/bin/bash
# app-rollback.sh

# 1. 現在のバージョン確認
CURRENT_VERSION=$(aws ecs describe-services \
  --cluster lightningtalk-prod \
  --services api-service \
  --query 'services[0].taskDefinition' \
  --output text | rev | cut -d: -f1 | rev)

echo "Current version: $CURRENT_VERSION"

# 2. 前バージョンの特定
PREVIOUS_VERSION=$((CURRENT_VERSION - 1))
PREVIOUS_TASK_DEF="lightningtalk-prod-api:${PREVIOUS_VERSION}"

echo "Rolling back to: $PREVIOUS_TASK_DEF"

# 3. ECSサービス更新
aws ecs update-service \
  --cluster lightningtalk-prod \
  --service api-service \
  --task-definition "$PREVIOUS_TASK_DEF" \
  --force-new-deployment

# 4. WebSocketサービスも同様に更新
aws ecs update-service \
  --cluster lightningtalk-prod \
  --service websocket-service \
  --task-definition "lightningtalk-prod-websocket:${PREVIOUS_VERSION}" \
  --force-new-deployment

# 5. デプロイメント監視
echo "Monitoring rollback progress..."
./scripts/monitor-deployment.sh --wait-stable
```

### Type B: データベーススキーマロールバック

#### 対象

- DynamoDBテーブル構造
- GSI（グローバルセカンダリインデックス）
- データ形式

#### 所要時間

30分-2時間（データ量による）

#### 手順

```bash
#!/bin/bash
# db-schema-rollback.sh

# 1. 現在のスキーマバックアップ
echo "Backing up current schema state..."
./scripts/backup-schema.sh --output current-schema-backup.json

# 2. 移行スクリプトの逆適用
echo "Reverting schema changes..."
node scripts/migrations/rollback-latest.js

# 3. データ整合性チェック
echo "Verifying data integrity..."
node scripts/verify-data-integrity.js

# 4. インデックス再構築（必要な場合）
if [ "$REBUILD_INDEX" = "true" ]; then
  echo "Rebuilding indexes..."
  aws dynamodb update-table \
    --table-name lightningtalk-prod-events \
    --global-secondary-index-updates file://gsi-rollback.json
fi

# 5. アプリケーション再起動
echo "Restarting applications with old schema..."
./scripts/restart-all-services.sh
```

### Type C: インフラストラクチャロールバック

#### 対象

- CDKスタック
- ネットワーク設定
- セキュリティグループ
- IAMポリシー

#### 所要時間

15-30分

#### 手順

```bash
#!/bin/bash
# infra-rollback.sh

# 1. 現在のスタック状態確認
echo "Current stack status:"
aws cloudformation describe-stacks \
  --stack-name lightningtalk-prod \
  --query 'Stacks[0].StackStatus'

# 2. 変更セットの作成（前バージョンへ）
cd cdk
git checkout HEAD~1 -- cdk/
npm install
npx cdk diff

# 3. ロールバック実行
echo "Rolling back infrastructure..."
npx cdk deploy --all --require-approval never

# 4. リソース確認
echo "Verifying resources..."
aws cloudformation describe-stack-resources \
  --stack-name lightningtalk-prod \
  --query 'StackResources[?ResourceStatus!=`CREATE_COMPLETE`]'
```

### Type D: 設定ロールバック

#### 対象

- 環境変数
- Secrets Manager
- Parameter Store
- 設定ファイル

#### 所要時間

5分

#### 手順

```bash
#!/bin/bash
# config-rollback.sh

# 1. 現在の設定バックアップ
echo "Backing up current configuration..."
aws secretsmanager get-secret-value \
  --secret-id lightningtalk-prod-env \
  --query SecretString \
  --output text > current-config-backup.json

# 2. 前バージョンの復元
PREVIOUS_VERSION=$(aws secretsmanager list-secret-version-ids \
  --secret-id lightningtalk-prod-env \
  --query 'Versions[1].VersionId' \
  --output text)

echo "Restoring configuration version: $PREVIOUS_VERSION"
aws secretsmanager update-secret-version-stage \
  --secret-id lightningtalk-prod-env \
  --version-stage AWSCURRENT \
  --move-to-version-id "$PREVIOUS_VERSION"

# 3. サービス再起動
echo "Restarting services with old configuration..."
aws ecs update-service \
  --cluster lightningtalk-prod \
  --service api-service \
  --force-new-deployment
```

## 🔄 段階的ロールバック

### Blue/Greenロールバック

```bash
#!/bin/bash
# blue-green-rollback.sh

# 現在のアクティブ環境確認
ACTIVE_ENV=$(aws ssm get-parameter \
  --name /lightningtalk/prod/active-environment \
  --query 'Parameter.Value' \
  --output text)

echo "Current active environment: $ACTIVE_ENV"

# 環境切り替え
if [ "$ACTIVE_ENV" = "green" ]; then
  NEW_ENV="blue"
else
  NEW_ENV="green"
fi

echo "Switching to: $NEW_ENV"

# 1. ヘルスチェック
if ! curl -sf "https://${NEW_ENV}.xn--6wym69a.com/health"; then
  echo "ERROR: $NEW_ENV environment is not healthy!"
  exit 1
fi

# 2. トラフィック切り替え（段階的）
for weight in 10 25 50 75 100; do
  echo "Shifting $weight% traffic to $NEW_ENV..."

  aws route53 change-resource-record-sets \
    --hosted-zone-id $ZONE_ID \
    --change-batch "{
      \"Changes\": [{
        \"Action\": \"UPSERT\",
        \"ResourceRecordSet\": {
          \"Name\": \"xn--6wym69a.com\",
          \"Type\": \"A\",
          \"SetIdentifier\": \"$NEW_ENV\",
          \"Weight\": $weight,
          \"AliasTarget\": {
            \"HostedZoneId\": \"Z35SXDOTRQ7X7K\",
            \"DNSName\": \"${NEW_ENV}-alb.ap-northeast-1.elb.amazonaws.com\"
          }
        }
      }]
    }"

  # モニタリング
  sleep 60
  ERROR_RATE=$(./scripts/get-error-rate.sh)
  if (( $(echo "$ERROR_RATE > 1" | bc -l) )); then
    echo "ERROR: High error rate detected. Aborting rollback."
    break
  fi
done

# 3. アクティブ環境の更新
aws ssm put-parameter \
  --name /lightningtalk/prod/active-environment \
  --value "$NEW_ENV" \
  --overwrite
```

### カナリアロールバック

```bash
#!/bin/bash
# canary-rollback.sh

# Lambda関数のカナリアロールバック
FUNCTION_NAME="lightningtalk-api-handler"
CURRENT_VERSION=$(aws lambda get-alias \
  --function-name $FUNCTION_NAME \
  --name prod \
  --query 'FunctionVersion' \
  --output text)

PREVIOUS_VERSION=$((CURRENT_VERSION - 1))

echo "Rolling back Lambda from version $CURRENT_VERSION to $PREVIOUS_VERSION"

# トラフィックを徐々に前バージョンへ
aws lambda update-alias \
  --function-name $FUNCTION_NAME \
  --name prod \
  --function-version $PREVIOUS_VERSION \
  --routing-config AdditionalVersionWeights={\"$CURRENT_VERSION\"=0.9}

# 監視期間
echo "Monitoring for 5 minutes..."
sleep 300

# 完全切り替え
aws lambda update-alias \
  --function-name $FUNCTION_NAME \
  --name prod \
  --function-version $PREVIOUS_VERSION
```

## 📝 ロールバックチェックリスト

### 事前確認

- [ ] 影響範囲の特定
- [ ] ロールバックタイプの決定
- [ ] 必要な権限の確認
- [ ] バックアップの存在確認
- [ ] 関係者への通知

### 実行中

- [ ] ロールバック開始の記録
- [ ] 各ステップの実行確認
- [ ] エラーメッセージの記録
- [ ] リアルタイム監視
- [ ] 進捗の定期報告

### 事後確認

- [ ] サービス正常性確認
- [ ] データ整合性確認
- [ ] パフォーマンス確認
- [ ] エラー率の確認
- [ ] ユーザー影響の確認

## 🚑 緊急ロールバック

### 完全停止時の緊急手順

```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED 🚨"

# 1. 全トラフィックを停止
aws elbv2 modify-target-group-attributes \
  --target-group-arn $TG_ARN \
  --attributes Key=deregistration_delay.timeout_seconds,Value=0

# 2. メンテナンスモード有効化
aws s3 cp s3://lightningtalk-emergency/maintenance.html \
  s3://lightningtalk-static/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

aws cloudfront create-invalidation \
  --distribution-id $CF_DIST_ID \
  --paths "/*"

# 3. 最後の正常なバックアップから復元
LAST_GOOD_BACKUP=$(aws s3 ls s3://lightningtalk-backups/verified/ \
  | grep "VERIFIED" | sort | tail -n 1 | awk '{print $4}')

echo "Restoring from backup: $LAST_GOOD_BACKUP"

# 4. データベース復元
./scripts/restore-from-backup.sh --backup-id "$LAST_GOOD_BACKUP"

# 5. アプリケーション再デプロイ（安定版）
STABLE_VERSION=$(aws ssm get-parameter \
  --name /lightningtalk/stable-version \
  --query 'Parameter.Value' \
  --output text)

aws ecs update-service \
  --cluster lightningtalk-prod \
  --service api-service \
  --task-definition "lightningtalk-prod-api:${STABLE_VERSION}" \
  --desired-count 5 \
  --force-new-deployment

# 6. 段階的復旧
echo "Waiting for service stability..."
./scripts/wait-for-stable.sh

# 7. メンテナンスモード解除
aws s3 cp s3://lightningtalk-static/index.html.backup \
  s3://lightningtalk-static/index.html

echo "Emergency rollback completed"
```

## 📊 ロールバック後の検証

### 機能検証スクリプト

```bash
#!/bin/bash
# post-rollback-validation.sh

echo "Starting post-rollback validation..."

# 1. APIエンドポイント検証
endpoints=(
  "/health"
  "/api/events"
  "/api/events/current"
  "/api/participants"
)

for endpoint in "${endpoints[@]}"; do
  response=$(curl -s -w "\n%{http_code}" "https://api.xn--6wym69a.com${endpoint}")
  http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" = "200" ]; then
    echo "✓ $endpoint - OK"
  else
    echo "✗ $endpoint - Failed (HTTP $http_code)"
  fi
done

# 2. データ整合性検証
node scripts/verify-data-integrity.js --deep-check

# 3. パフォーマンス検証
artillery run tests/load/basic-scenario.yml

# 4. セキュリティ検証
./scripts/security-scan.sh --quick

# 5. ログ分析
aws logs filter-log-events \
  --log-group-name /aws/ecs/lightningtalk-prod \
  --start-time $(date -d '30 minutes ago' +%s)000 \
  --filter-pattern "ERROR" \
  --query 'events | length(@)'
```

## 📋 ロールバック記録テンプレート

```markdown
## ロールバック報告書

### 基本情報

- 実施日時: YYYY-MM-DD HH:MM JST
- 実施者: [名前]
- ロールバックタイプ: [Type A/B/C/D]
- 所要時間: XX分

### ロールバック理由

[問題の詳細説明]

### 実施内容

1. [実施したステップ1]
2. [実施したステップ2] ...

### 結果

- ロールバック: [成功/部分的成功/失敗]
- サービス状態: [正常/一部機能制限/停止]
- データ影響: [なし/あり（詳細）]

### フォローアップ

- [ ] 根本原因の調査
- [ ] 再発防止策の策定
- [ ] テストケースの追加
- [ ] ドキュメントの更新

### 教訓

[今回のインシデントから得られた教訓]
```

## 🔗 関連ツール

### ロールバック支援ツール

```bash
# rollback-toolkit/
├── check-rollback-readiness.sh    # ロールバック可能性チェック
├── backup-current-state.sh         # 現在状態のバックアップ
├── compare-versions.sh             # バージョン間の差分確認
├── simulate-rollback.sh            # ロールバックシミュレーション
└── generate-rollback-report.sh     # レポート生成
```

### モニタリングツール

```bash
# ロールバック中のリアルタイム監視
watch -n 5 './scripts/rollback-monitor.sh'

# ロールバックメトリクス表示
./scripts/show-rollback-metrics.sh --dashboard
```

## ⚠️ 注意事項

1. **データベースロールバック**: マイグレーションの逆適用が不可能な場合がある
2. **依存関係**: 外部サービスとの互換性を必ず確認
3. **キャッシュ**: CDNやアプリケーションキャッシュのクリアを忘れない
4. **セッション**: ユーザーセッションへの影響を考慮
5. **通知**: ユーザーへの事前・事後通知を適切に実施

## 📚 付録

### よくある質問

**Q: ロールバック判断は誰が行うべきか？** A:
P1/P2インシデントはオンコールエンジニア、P3以下はチームリード承認

**Q: 部分的なロールバックは可能か？** A: 可能。機能フラグやAPI
Gatewayでの制御により特定機能のみロールバック可能

**Q: ロールバック後のデータはどうなるか？**
A: ロールバック前の全データをバックアップし、必要に応じて手動マージ

---

最終更新:
2025-07-11承認者: インフラストラクチャチームリード次回レビュー: 四半期ごと
