# CDK Deployment Guide

This guide explains how to deploy Lightning Talk Circle using AWS CDK with custom domain support.

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Node.js 18+** installed
3. **AWS CDK v2** installed globally (`npm install -g aws-cdk`)
4. **Domain registered** in Route53 (optional, for custom domain)

## Quick Start

### 1. Install Dependencies

```bash
cd cdk
npm install
```

### 2. Configure Environment

Create environment-specific configuration:

```bash
# Copy example configuration
cp config/domain-config.example.json config/production.json

# Edit with your domain settings
nano config/production.json
```

### 3. Bootstrap CDK (first time only)

```bash
npx cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

### 4. Deploy

```bash
# Deploy to development
npm run cdk:deploy:dev

# Deploy to production
npm run cdk:deploy:prod
```

## Custom Domain Configuration

### Domain Configuration Options

The domain configuration supports the following options:

```json
{
  "domain": {
    "domainName": "your-domain.com",           // Primary domain
    "zoneName": "your-domain.com",             // Route53 hosted zone
    "hostedZoneId": "Z1234567890ABC",          // Optional: specific zone ID
    "certificateArn": "arn:aws:acm:...",       // Optional: existing certificate
    "alternativeNames": ["www.your-domain.com"], // Additional domains
    "redirectWww": true,                       // Redirect www to apex
    "enableIPv6": true                         // Enable IPv6 support
  }
}
```

### Setting Up Custom Domain

#### Option 1: New Certificate (Recommended)

1. **Domain in Route53**: Ensure your domain is managed by Route53
2. **Configure domain**: Edit your config file with domain details
3. **Deploy**: CDK will automatically create SSL certificate and DNS records

```json
{
  "domain": {
    "domainName": "lightningtalk.example.com",
    "zoneName": "example.com"
  }
}
```

#### Option 2: Existing Certificate

If you already have an SSL certificate:

```json
{
  "domain": {
    "domainName": "lightningtalk.example.com",
    "certificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/...",
    "hostedZoneId": "Z1234567890ABC"
  }
}
```

#### Option 3: External Domain (No Route53)

For domains not managed by Route53:

1. Deploy without domain configuration
2. Note the CloudFront distribution domain from outputs
3. Create CNAME record manually in your DNS provider

### SSL Certificate Requirements

- **Region**: Certificate must be in `us-east-1` for CloudFront
- **Validation**: DNS validation is used automatically
- **Domains**: Include all alternative names in certificate

## Architecture Overview

### Infrastructure Components

1. **S3 Bucket**: Static asset storage with versioning
2. **CloudFront**: Global CDN with custom domain support
3. **Route53**: DNS management and health checks
4. **ACM**: SSL certificate management
5. **IAM**: Least-privilege access policies

### Security Features

- **S3 Private**: No public access, CloudFront-only
- **HTTPS Only**: Automatic HTTP to HTTPS redirect
- **Security Headers**: CSP, HSTS, and other security headers
- **Origin Access Identity**: Secure S3 access

## Deployment Environments

### Development

- **Domain**: Uses CloudFront default domain
- **Caching**: Disabled for development
- **Removal Policy**: Delete resources on stack deletion

```bash
npm run cdk:deploy:dev
```

### Staging

- **Domain**: Optional subdomain (staging.your-domain.com)
- **Caching**: Optimized for testing
- **Removal Policy**: Retain important resources

```bash
npm run cdk:deploy:staging
```

### Production

- **Domain**: Primary custom domain
- **Caching**: Full optimization enabled
- **Removal Policy**: Retain all resources
- **Monitoring**: CloudWatch alarms enabled

```bash
npm run cdk:deploy:prod
```

## Configuration Examples

### Basic Setup (No Custom Domain)

```json
{
  "app": {
    "name": "lightningtalk",
    "stage": "dev"
  },
  "cdn": {
    "priceClass": "PriceClass_100"
  }
}
```

### Production with Custom Domain

```json
{
  "app": {
    "name": "lightningtalk",
    "stage": "production"
  },
  "domain": {
    "domainName": "talks.company.com",
    "zoneName": "company.com",
    "alternativeNames": ["www.talks.company.com"],
    "enableIPv6": true
  },
  "cdn": {
    "priceClass": "PriceClass_200",
    "compression": true,
    "httpVersion": "http2and3"
  },
  "security": {
    "minimumProtocolVersion": "TLSv1.2_2021"
  }
}
```

### Multi-Region Setup

```json
{
  "app": {
    "name": "lightningtalk",
    "stage": "global"
  },
  "domain": {
    "domainName": "lightningtalk.global.com",
    "zoneName": "global.com"
  },
  "cdn": {
    "priceClass": "PriceClass_All",
    "geoRestriction": {
      "restrictionType": "none"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Certificate Validation**: DNS records may take time to propagate
2. **Domain Not Found**: Ensure hosted zone exists in Route53
3. **Permission Denied**: Check AWS credentials and IAM policies

### Debugging Commands

```bash
# Check stack status
npx cdk list

# View differences
npx cdk diff

# Synthesize templates
npx cdk synth

# Check bootstrap
npx cdk doctor
```

### Certificate Issues

If SSL certificate validation fails:

1. Check DNS propagation: `dig _acme-challenge.your-domain.com`
2. Verify hosted zone: `aws route53 list-hosted-zones`
3. Check certificate status: `aws acm list-certificates --region us-east-1`

### CloudFront Propagation

- **Deployment time**: 15-20 minutes for global propagation
- **Cache invalidation**: Use `aws cloudfront create-invalidation`
- **Testing**: Use different geographic locations

## Monitoring and Maintenance

### CloudWatch Metrics

Monitor these key metrics:

- **CloudFront**: Cache hit ratio, error rates
- **S3**: Request metrics, error rates  
- **Route53**: Health check status

### Cost Optimization

1. **Price Class**: Use appropriate CloudFront price class
2. **Caching**: Optimize cache policies for your content
3. **Compression**: Enable for better performance and lower costs

### Updates and Maintenance

```bash
# Update CDK
npm update -g aws-cdk

# Update dependencies
cd cdk && npm update

# Deploy updates
npm run cdk:deploy:prod
```

## Cleanup

To remove all resources:

```bash
# Destroy stack
npx cdk destroy

# Note: Some resources (like custom domains) may need manual cleanup
```

**Important**: Production resources with `RETAIN` policy will not be deleted automatically.