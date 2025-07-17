# CloudFront OAI 修正デプロイメント手順

## 実行日時: 2025-07-16

## 準備完了事項

1. **CDKスタックの修正**
   - ✅ CloudFront Distribution IDを `DistributionV2` に変更
   - ✅ OAI設定が正しく含まれていることを確認
   - ✅ S3バケットへのOAIアクセス権限付与を確認

2. **現在の状態**
   - OAI ID: `E1JIT7NW7IGZXH`
   - S3バケット: `lightningtalk-dev-static-822063948773`
   - 現在のCloudFront ID: `EA9Q0WKVQIJD` (OAI未設定)

## デプロイメント手順

### ステップ1: 現在の環境確認

```bash
# 作業ディレクトリへ移動
cd /home/ec2-user/workspace/lightningtalk-circle

# 現在のスタック状態を確認
aws cloudformation describe-stacks --stack-name LightningTalkCircle-dev --query "Stacks[0].StackStatus"
```

### ステップ2: CDKデプロイメント実行

```bash
# CDKデプロイメントの実行
npm run cdk:deploy:dev

# または直接CDKコマンド
cd cdk && CDK_STAGE=dev cdk deploy --context stage=dev --require-approval never
```

### ステップ3: 新しいCloudFront IDの取得

デプロイメント後、新しいCloudFront Distribution IDが出力されます：

```
Outputs:
LightningTalkCircle-dev.DistributionId = <新しいID>
```

### ステップ4: DNS設定の更新確認

新しいCloudFrontディストリビューションがRoute53に正しく設定されているか確認：

```bash
# Route53レコードの確認
aws route53 list-resource-record-sets --hosted-zone-id Z036564723AZHFOSIARRI \
  --query "ResourceRecordSets[?Name=='dev.xn--6wym69a.com.']"
```

### ステップ5: 動作確認

```bash
# 1. 新しいCloudFront URLでのアクセステスト
curl -I https://<新しいCloudFront URL>/index.html

# 2. カスタムドメインでのアクセステスト（SSL証明書が有効な場合）
curl -I https://dev.xn--6wym69a.com/index.html

# 3. APIエンドポイントの確認
curl https://<新しいCloudFront URL>/api/health
```

### ステップ6: 古いディストリビューションの削除

新しいディストリビューションが正常に動作することを確認後：

```bash
# 古いCloudFrontディストリビューションを無効化
aws cloudfront update-distribution --id EA9Q0WKVQIJD \
  --if-match <ETag> \
  --distribution-config '{"Enabled": false, ...}'

# 無効化後、削除
aws cloudfront delete-distribution --id EA9Q0WKVQIJD --if-match <ETag>
```

## トラブルシューティング

### エラー: スタックのロールバック

原因と対策：

1. SSL証明書の検証が未完了 → 証明書検証を待つ
2. 既存リソースとの競合 → リソース名を変更
3. IAM権限不足 → 必要な権限を確認

### エラー: CloudFront 403 Forbidden

確認事項：

1. S3バケットポリシーにOAIが含まれているか
2. CloudFrontのオリジン設定でOAIが選択されているか
3. index.htmlファイルがS3に存在するか

### デバッグコマンド

```bash
# CloudFormationイベントの確認
aws cloudformation describe-stack-events --stack-name LightningTalkCircle-dev \
  --query "StackEvents[0:10]" --output table

# S3バケットポリシーの確認
aws s3api get-bucket-policy --bucket lightningtalk-dev-static-822063948773

# CloudFront設定の確認
aws cloudfront get-distribution --id <新しいID> \
  --query "Distribution.DistributionConfig.Origins"
```

## 成功基準

1. ✅ 新しいCloudFrontディストリビューションの作成
2. ✅ OAIが正しく設定されている
3. ✅ https://dev.xn--6wym69a.com でアクセス可能
4. ✅ 静的ファイルが正常に配信される
5. ✅ APIエンドポイントが動作する

## ロールバック手順

問題が発生した場合：

```bash
# CDKスタックのロールバック
cd cdk && cdk destroy --context stage=dev

# 元の設定に戻す
git checkout HEAD -- cdk/lib/main-stack.js
npm run cdk:deploy:dev
```
