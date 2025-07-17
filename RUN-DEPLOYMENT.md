# CloudFront OAI修正デプロイメント実行手順

## 準備完了確認

✅ **完了した準備作業:**

1. CDKスタックの修正（Distribution → DistributionV2）
2. OAI設定の実装確認
3. デプロイメントスクリプトの作成
4. ドキュメントの整備

## 実行コマンド

```bash
# 1. スクリプトに実行権限を付与
chmod +x /home/ec2-user/workspace/lightningtalk-circle/deploy-cloudfront-fix.sh

# 2. デプロイメントスクリプトを実行
/home/ec2-user/workspace/lightningtalk-circle/deploy-cloudfront-fix.sh
```

## 代替手動実行方法

スクリプトが実行できない場合の手動実行：

```bash
# 1. プロジェクトディレクトリへ移動
cd /home/ec2-user/workspace/lightningtalk-circle

# 2. CDKデプロイメント実行
cd cdk
CDK_STAGE=dev cdk deploy --context stage=dev --require-approval never

# 3. 新しいDistribution IDを取得
aws cloudformation describe-stacks \
  --stack-name LightningTalkCircle-dev \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text

# 4. CloudFront URLを確認
aws cloudfront get-distribution \
  --id <新しいDistribution ID> \
  --query "Distribution.DomainName" \
  --output text
```

## 実行後の確認事項

1. **CloudFront配信テスト**

   ```bash
   curl -I https://<CloudFront Domain>/index.html
   ```

2. **API動作確認**

   ```bash
   curl https://<CloudFront Domain>/api/health
   ```

3. **OAI設定確認**
   - AWS Console → CloudFront → Distribution → Origins
   - S3 OriginでOAIが設定されていることを確認

## トラブルシューティング

### CDKデプロイメントが失敗する場合

1. **SSL証明書エラー**
   - 証明書の検証が完了するまで待つ（最大30分）
   - 一時的にSSL証明書設定をコメントアウト

2. **スタックロールバック**

   ```bash
   # スタックの状態を確認
   aws cloudformation describe-stack-events \
     --stack-name LightningTalkCircle-dev \
     --max-items 10
   ```

3. **権限エラー**
   - AWS認証情報を確認
   - IAMロールの権限を確認

## 成功確認

デプロイメントが成功したら、以下を確認：

- [ ] 新しいCloudFront Distribution IDが出力される
- [ ] CloudFront URLでindex.htmlにアクセスできる
- [ ] APIエンドポイントが正常に動作する
- [ ] S3への直接アクセスが403になる（OAIが機能している）

## 次のステップ

1. 古いCloudFrontディストリビューション（EA9Q0WKVQIJD）の削除
2. DNS設定の更新（必要な場合）
3. SSL証明書の適用（検証完了後）
