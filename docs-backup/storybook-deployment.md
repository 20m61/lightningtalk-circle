# Storybook Deployment Guide

This guide documents how to deploy the Lightning Talk Circle Storybook to AWS.

## Current Deployment Status

- **Production Storybook URL**: https://d3bxpsykeu741s.cloudfront.net/
- **S3 Website URL**:
  http://lightning-talk-storybook-production.s3-website-ap-northeast-1.amazonaws.com/
- **CloudFront Distribution ID**: E2V8YZFHOG3IG4

## Manual Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js and npm installed
- Access to the Lightning Talk Circle AWS account

### Deployment Steps

1. Navigate to the components package:

   ```bash
   cd lightningtalk-modern/packages/components
   ```

2. Build Storybook:

   ```bash
   npm run build-storybook
   ```

3. Deploy to production:

   ```bash
   npm run deploy:storybook
   ```

   Or deploy to staging:

   ```bash
   npm run deploy:storybook:staging
   ```

### Using the Deployment Script

The deployment script (`scripts/deploy-storybook.sh`) handles:

- Building Storybook
- Creating S3 bucket if it doesn't exist
- Configuring bucket for static website hosting
- Uploading files to S3
- Creating CloudFront invalidation

You can run it directly:

```bash
./scripts/deploy-storybook.sh production
```

## Infrastructure Details

### S3 Bucket Configuration

- Bucket Name: `lightning-talk-storybook-production`
- Region: `ap-northeast-1`
- Public Access: Enabled for static website hosting
- Website Endpoint: Configured with index.html as default

### CloudFront Distribution

- Distribution ID: `E2V8YZFHOG3IG4`
- Origin: S3 bucket
- Custom Error Pages: 403/404 redirect to index.html
- Compression: Enabled
- HTTPS: Enforced with redirect

## CDK Stack (Future)

The Storybook infrastructure can also be deployed using CDK:

```bash
cd cdk
cdk deploy LightningTalkStorybook-prod
```

However, due to existing resources, manual deployment is currently recommended.

## Troubleshooting

### Deployment Fails

- Check AWS credentials: `aws sts get-caller-identity`
- Verify bucket doesn't already exist with different configuration
- Ensure you have necessary IAM permissions

### CloudFront Not Updating

- CloudFront distributions can take 15-20 minutes to fully deploy
- Use invalidation to force cache refresh:
  ```bash
  aws cloudfront create-invalidation --distribution-id E2V8YZFHOG3IG4 --paths "/*"
  ```

### Access Denied Errors

- Ensure S3 bucket policy allows public read access
- Check CloudFront origin settings match S3 bucket configuration

## Monitoring

- Check CloudFront logs in the logs bucket (if configured)
- Monitor S3 bucket metrics in AWS Console
- Use CloudWatch for distribution metrics

## Cost Considerations

- S3 storage: Minimal for static files
- CloudFront: Pay per request and data transfer
- Consider using CloudFront price class to limit geographic distribution

## Security Notes

- S3 bucket is public for static website hosting
- CloudFront provides HTTPS encryption
- Consider adding WAF rules for additional protection
- No sensitive data should be included in Storybook
