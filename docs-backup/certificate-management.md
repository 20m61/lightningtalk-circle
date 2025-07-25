# Certificate Management Guide

This guide explains how to manage ACM certificates for the Lightning Talk Circle
project.

## Overview

The project uses AWS Certificate Manager (ACM) to manage SSL/TLS certificates
for all domains and subdomains. The certificate must be deployed in the
`us-east-1` region for use with CloudFront distributions.

## Current Certificate

- **ARN**:
  `arn:aws:acm:us-east-1:822063948773:certificate/42ab57fd-bb00-47c8-b218-fc23216e0f63`
- **Region**: us-east-1 (required for CloudFront)
- **Validation**: DNS validation via Route53

## Included Domains

The new certificate will include all necessary domains:

1. `xn--6wym69a.com` (発表.com) - Primary domain
2. `www.xn--6wym69a.com` - WWW subdomain
3. `storybook.xn--6wym69a.com` - Storybook production
4. `storybook-staging.xn--6wym69a.com` - Storybook staging
5. `dev.xn--6wym69a.com` - Development environment
6. `storybook.dev.xn--6wym69a.com` - Storybook development
7. `api.xn--6wym69a.com` - API subdomain (future use)
8. `staging.xn--6wym69a.com` - Staging environment (future use)

## Certificate Stack

The certificate is managed by a dedicated CDK stack: `CertificateStack`

### Stack Features

- Automatic DNS validation using Route53
- Includes all required domains and subdomains
- Deployed in us-east-1 region (CloudFront requirement)
- Outputs certificate ARN for use in other stacks

## Deployment

### Option 1: Deploy Certificate Only

To deploy just the certificate:

```bash
# Using npm script
npm run cdk:certificate:deploy

# Or manually
cd cdk
npx cdk deploy LightningTalkCertificate-prod -a 'node bin/certificate-only.js'
```

### Option 2: Deploy with All Stacks

The certificate will be automatically deployed when deploying production stacks:

```bash
npm run cdk:deploy:prod
```

### Checking Certificate Status

1. View the synthesized template:

   ```bash
   npm run cdk:certificate:synth
   ```

2. Check differences:

   ```bash
   npm run cdk:certificate:diff
   ```

3. View in AWS Console:
   ```
   https://console.aws.amazon.com/acm/home?region=us-east-1
   ```

## Validation Process

1. After deployment, ACM will create DNS validation records
2. The CDK stack automatically adds these records to Route53
3. Validation typically completes within 5-30 minutes
4. Certificate status will change from "Pending validation" to "Issued"

## Using the Certificate

Once deployed and validated, the certificate ARN will be:

- Automatically used by production stacks
- Available as a CloudFormation export:
  `LightningTalkCertificate-prod-CertificateArn`
- Stored in the environment config for reference

## Updating Existing Stacks

After the new certificate is deployed, existing CloudFront distributions will
automatically use it if deployed through CDK. No manual updates are required.

## Troubleshooting

### Certificate Not Validating

1. Check Route53 for CNAME validation records
2. Ensure the hosted zone ID is correct
3. Wait up to 30 minutes for DNS propagation

### Certificate Region Error

- CloudFront requires certificates in us-east-1
- The certificate stack automatically deploys to us-east-1
- Other resources can be in any region

### Domain Not Working

1. Verify the domain is included in the certificate
2. Check CloudFront distribution settings
3. Ensure DNS records point to CloudFront

## Important Notes

1. **Do not delete** the old certificate until all resources are updated
2. Certificate validation requires control over the domain's DNS
3. The certificate auto-renews before expiration
4. All subdomains must be explicitly listed (no wildcards used)

## Related Documentation

- [AWS ACM Documentation](https://docs.aws.amazon.com/acm/)
- [CloudFront with ACM](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
- [Route53 DNS Validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)
