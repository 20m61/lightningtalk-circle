# Storybook Deployment Summary - July 21, 2025

## What We Accomplished

Due to existing CloudFormation stack conflicts, we deployed the Lightning Talk
Circle Storybook manually to AWS.

### 1. Built Storybook

- Successfully built the Storybook static files from the components package
- Output directory: `lightningtalk-modern/packages/components/storybook-static`

### 2. Created S3 Infrastructure

- **S3 Bucket**: `lightning-talk-storybook-production`
- **Region**: `ap-northeast-1`
- Configured for static website hosting
- Enabled public read access
- Website URL:
  http://lightning-talk-storybook-production.s3-website-ap-northeast-1.amazonaws.com/

### 3. Created CloudFront Distribution

- **Distribution ID**: `E2V8YZFHOG3IG4`
- **CloudFront URL**: https://d3bxpsykeu741s.cloudfront.net/
- Configured with:
  - HTTPS redirect
  - Error page handling (403/404 → index.html)
  - Compression enabled
  - Price class: 200 (US, Canada, Europe, Asia, Middle East, Africa)

### 4. Created Deployment Automation

- **Script**: `/scripts/deploy-storybook.sh`
  - Automates building and deployment
  - Handles S3 bucket creation if needed
  - Performs CloudFront invalidation
- **NPM Scripts** added:
  - `npm run storybook:deploy` - Deploy to production (from root)
  - `npm run storybook:deploy:staging` - Deploy to staging (from root)
  - Component package also has direct deployment commands

### 5. Documentation

- Created `/docs/storybook-deployment.md` with:
  - Deployment instructions
  - Infrastructure details
  - Troubleshooting guide
  - Security and cost considerations

## Access Information

### Production Storybook URLs:

- **Primary (CloudFront)**: https://d3bxpsykeu741s.cloudfront.net/
- **S3 Direct**:
  http://lightning-talk-storybook-production.s3-website-ap-northeast-1.amazonaws.com/

### Deployment Commands:

```bash
# From project root
npm run storybook:deploy

# From components package
cd lightningtalk-modern/packages/components
npm run deploy:storybook

# Using script directly
./scripts/deploy-storybook.sh production
```

## Notes

1. **CloudFront Deployment Time**: The distribution may take 15-20 minutes to
   fully deploy globally.

2. **Future CDK Integration**: While a CDK stack exists
   (`lib/storybook-stack.js`), manual deployment was necessary due to existing
   resources. The CDK stack can be used for fresh deployments in other
   environments.

3. **Cost Considerations**:
   - S3 storage costs are minimal for static files
   - CloudFront charges apply for data transfer and requests
   - Current configuration uses Price Class 200 to balance cost and performance

4. **Security**:
   - S3 bucket is public for static website hosting
   - CloudFront provides HTTPS encryption
   - No sensitive data should be included in Storybook

## Next Steps

1. Monitor CloudFront distribution deployment status
2. Test the Storybook URL once fully deployed
3. Consider adding custom domain (e.g., storybook.xn--6wym69a.com)
4. Set up CloudWatch monitoring for the distribution
5. Configure automated deployments in CI/CD pipeline
