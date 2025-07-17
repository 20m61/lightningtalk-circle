# CloudFront OAI 設定問題の解決策

## 問題の概要

CloudFront ディストリビューションでOrigin Access Identity
(OAI) が正しく設定されていない問題が発生しています。

### 現在の状況

1. **✅ 完了済み**
   - OAI `E1JIT7NW7IGZXH` の作成
   - S3バケットポリシーでのOAIアクセス許可
   - CDKスタックでのOAI設定実装

2. **❌ 未完了**
   - CloudFrontディストリビューションへのOAI適用
   - S3オリジンでのOAI設定

## 解決策

### オプション1: CloudFrontディストリビューションの再作成

```javascript
// cdk/lib/main-stack.js の修正案

// 既存のディストリビューションを削除し、新しいものを作成
const distribution = new cloudfront.Distribution(this, 'DistributionV2', {
  defaultBehavior: {
    origin: new origins.S3BucketOrigin(staticBucket, {
      originAccessIdentity: originAccessIdentity
    }),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    compress: true
  }
  // ... 他の設定
});
```

### オプション2: AWS CLIでの手動更新

```bash
# 1. 現在の設定を取得
aws cloudfront get-distribution-config --id EA9Q0WKVQIJD > dist-config.json

# 2. ETagを保存
ETAG=$(aws cloudfront get-distribution-config --id EA9Q0WKVQIJD --query "ETag" --output text)

# 3. 設定を修正（JSONファイルを編集）
# Origins.Items[1].S3OriginConfig.OriginAccessIdentity に
# "origin-access-identity/cloudfront/E1JIT7NW7IGZXH" を設定

# 4. 更新を適用
aws cloudfront update-distribution --id EA9Q0WKVQIJD \
  --distribution-config file://dist-config.json \
  --if-match $ETAG
```

### オプション3: AWSコンソールでの手動更新

1. CloudFrontコンソールにアクセス
2. ディストリビューション `EA9Q0WKVQIJD` を選択
3. Origins タブで S3 オリジンを編集
4. Origin Access Identity で `E1JIT7NW7IGZXH` を選択
5. 保存してデプロイ

## 検証手順

OAI設定後の動作確認：

```bash
# 1. CloudFront経由でのアクセステスト
curl -I https://d35333qgzm41tk.cloudfront.net/index.html

# 2. S3直接アクセスの確認（403になるはず）
curl -I https://lightningtalk-dev-static-822063948773.s3.ap-northeast-1.amazonaws.com/index.html
```

## SSL証明書の状況確認

```bash
# 証明書の検証状態を確認
aws acm list-certificates --query "CertificateSummaryList[?contains(DomainName, 'xn--6wym69a.com')]"

# 証明書の詳細を確認
aws acm describe-certificate --certificate-arn <証明書ARN>
```

## 今後の推奨アクション

1. **即時対応**
   - AWSコンソールでCloudFrontのOAI設定を手動更新
   - 設定変更後、キャッシュを無効化

2. **中期対応**
   - CDKスタックでディストリビューションを再作成
   - 新しいディストリビューションIDで全体を更新

3. **長期対応**
   - CDKのバージョンアップグレード
   - CloudFront Origin Access Control (OAC) への移行検討

## トラブルシューティング

### 403エラーが続く場合

1. S3バケットポリシーの確認
2. OAIのS3CanonicalUserIdが正しいか確認
3. CloudFrontのキャッシュ無効化
4. ブラウザキャッシュのクリア

### SSL証明書エラーの場合

1. DNS検証レコードの確認
2. Route53でのCNAMEレコード確認
3. 証明書の検証待ち（最大30分）

## 参考情報

- [AWS CloudFront OAI Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [AWS CDK CloudFront Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html)
- [Troubleshooting CloudFront 403 Errors](https://repost.aws/knowledge-center/cloudfront-403-forbidden-error)
