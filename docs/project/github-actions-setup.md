# GitHub Actions AWS Configuration Guide

This guide provides step-by-step instructions for configuring GitHub Actions to
deploy the Lightning Talk Circle infrastructure using AWS CDK.

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository settings:

### Development/Staging Environment

- `AWS_ACCESS_KEY_ID` - AWS IAM access key for dev/staging deployments
- `AWS_SECRET_ACCESS_KEY` - AWS IAM secret access key for dev/staging
  deployments

### Production Environment

- `AWS_ACCESS_KEY_ID_PROD` - AWS IAM access key for production deployments
- `AWS_SECRET_ACCESS_KEY_PROD` - AWS IAM secret access key for production
  deployments

### Optional Secrets

- `SLACK_WEBHOOK_URL` - Slack webhook for deployment notifications (optional)

## Step-by-Step Setup

### 1. Create IAM Users

Create separate IAM users for different environments:

#### Development/Staging IAM User

1. Go to AWS IAM Console
2. Create a new user: `lightningtalk-github-actions-dev`
3. Enable programmatic access
4. Attach the following policies:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cloudformation:*",
           "s3:*",
           "iam:*",
           "lambda:*",
           "ecs:*",
           "ec2:*",
           "elasticloadbalancing:*",
           "autoscaling:*",
           "cloudwatch:*",
           "logs:*",
           "route53:*",
           "acm:*",
           "cloudfront:*",
           "wafv2:*",
           "secretsmanager:*",
           "ssm:*",
           "ecr:*",
           "rds:*",
           "elasticache:*",
           "budgets:*",
           "ce:*",
           "sns:*"
         ],
         "Resource": "*",
         "Condition": {
           "StringEquals": {
             "aws:RequestedRegion": "ap-northeast-1"
           }
         }
       },
       {
         "Effect": "Allow",
         "Action": ["cloudfront:*", "wafv2:*", "acm:*", "route53:*"],
         "Resource": "*",
         "Condition": {
           "StringEquals": {
             "aws:RequestedRegion": "us-east-1"
           }
         }
       }
     ]
   }
   ```

#### Production IAM User

1. Create a new user: `lightningtalk-github-actions-prod`
2. Enable programmatic access
3. Attach a more restrictive policy with additional conditions
4. Consider using AWS Organizations SCPs for additional protection

### 2. Configure GitHub Secrets

1. Navigate to your GitHub repository
2. Go to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:

#### AWS_ACCESS_KEY_ID

```
Name: AWS_ACCESS_KEY_ID
Value: [Your dev/staging IAM access key]
```

#### AWS_SECRET_ACCESS_KEY

```
Name: AWS_SECRET_ACCESS_KEY
Value: [Your dev/staging IAM secret key]
```

#### AWS_ACCESS_KEY_ID_PROD

```
Name: AWS_ACCESS_KEY_ID_PROD
Value: [Your production IAM access key]
```

#### AWS_SECRET_ACCESS_KEY_PROD

```
Name: AWS_SECRET_ACCESS_KEY_PROD
Value: [Your production IAM secret key]
```

### 3. Configure Branch Protection

Set up branch protection rules for production deployments:

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators
   - Restrict who can push to matching branches

### 4. Environment Configuration

Create GitHub environments for better control:

1. Go to Settings → Environments
2. Create environments:
   - `development`
   - `staging`
   - `production`

3. For production environment:
   - Add required reviewers
   - Set wait timer (optional)
   - Add environment secrets if needed

### 5. Update Workflow Permissions

Ensure the workflow has correct permissions:

1. Go to Settings → Actions → General
2. Under "Workflow permissions":
   - Select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

## Testing the Configuration

### 1. Test CDK Diff on Pull Request

1. Create a feature branch
2. Make a small change to CDK code
3. Create a pull request
4. Verify CDK diff runs and comments on PR

### 2. Test Development Deployment

1. Push to a feature branch
2. Check Actions tab for deployment status
3. Verify resources in AWS Console

### 3. Test Production Deployment

1. Merge PR to main branch
2. Verify production deployment requires approval (if configured)
3. Check deployment status

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check IAM user has necessary permissions
   - Verify secrets are correctly set
   - Check AWS region settings

2. **CDK Bootstrap Required**
   - Run manually first time: `npx cdk bootstrap aws://ACCOUNT/REGION`
   - Ensure bootstrap stack has correct permissions

3. **Docker Build Failures**
   - Check ECR repository exists
   - Verify GitHub Actions runner has Docker access
   - Check Dockerfile path is correct

### Security Best Practices

1. **Rotate Credentials Regularly**
   - Set calendar reminder for quarterly rotation
   - Use AWS IAM Access Analyzer

2. **Use Least Privilege**
   - Restrict IAM policies to minimum required
   - Use resource-level permissions where possible

3. **Enable AWS CloudTrail**
   - Monitor API calls from GitHub Actions
   - Set up alerts for suspicious activity

4. **Use Temporary Credentials**
   - Consider using OIDC provider with GitHub
   - Use AWS IAM roles instead of long-lived keys

## Additional Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [CDK Deployment Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
