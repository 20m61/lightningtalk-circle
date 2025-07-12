# Secret Management Guide

## Overview

This guide explains how to manage sensitive information (credentials, API keys, etc.) for the Lightning Talk Circle project across different environments.

## Environment Strategy

### 1. Local Development

For local development, use `.env.local` (not tracked by git):

```bash
# Create local environment file
./scripts/setup-local-env.sh

# This will:
# - Copy .env.example to .env.local
# - Generate secure JWT and SESSION secrets
# - Prompt you to add other credentials
```

### 2. Team Development

For team collaboration, consider these options:

#### Option A: Password Manager (Recommended for small teams)
- Use a team password manager (1Password, Bitwarden, etc.)
- Share credentials securely with team members
- Each developer creates their own `.env.local`

#### Option B: Encrypted Vault
```bash
# Using git-crypt (example)
git-crypt init
git-crypt add-gpg-user YOUR_GPG_KEY
# Add .env.vault to .gitattributes for encryption
```

#### Option C: Environment Variables
```bash
# Set in your shell profile
export LIGHTNINGTALK_JWT_SECRET="your-secret"
export LIGHTNINGTALK_WP_PASSWORD="your-password"
# Application reads from process.env
```

### 3. CI/CD (GitHub Actions)

Secrets are stored in GitHub repository settings:

```yaml
# Already configured in workflows
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  WP_PASSWORD: ${{ secrets.WP_PASSWORD }}
```

To add/update secrets:
1. Go to Settings → Secrets and variables → Actions
2. Add repository secrets
3. Use in workflows with `${{ secrets.SECRET_NAME }}`

### 4. Production (AWS)

Production secrets are managed via AWS Secrets Manager:

```javascript
// Reference in .env.production
JWT_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:name

// Application code retrieves at runtime
const secret = await secretsManager.getSecretValue({ SecretId: JWT_SECRET_ARN });
```

## Credential Types and Storage

| Credential Type | Local Dev | CI/CD | Production |
|----------------|-----------|--------|------------|
| JWT/Session Secrets | `.env.local` | GitHub Secrets | AWS Secrets Manager |
| WordPress Credentials | `.env.local` | GitHub Secrets | AWS Secrets Manager |
| Database Credentials | `.env.local` | GitHub Secrets | AWS RDS IAM Auth |
| API Keys (External) | `.env.local` | GitHub Secrets | AWS Secrets Manager |
| Emergency Contact | `.env.local` | GitHub Secrets | AWS Parameter Store |

## Security Best Practices

### 1. Credential Rotation
- Rotate production secrets every 90 days
- Use different credentials for each environment
- Automate rotation where possible

### 2. Access Control
- Limit access to production secrets
- Use IAM roles for AWS access
- Enable MFA for GitHub accounts

### 3. Monitoring
- Enable AWS CloudTrail for secret access logs
- Monitor GitHub audit logs
- Set up alerts for unauthorized access

### 4. Emergency Procedures
If credentials are exposed:
1. Immediately rotate affected credentials
2. Review access logs
3. Update all environments
4. Notify team members

## Quick Reference

### Generate New Secrets
```bash
# JWT and Session secrets
npm run generate-secrets

# WordPress app password
# Generate from WordPress admin panel

# Random password
openssl rand -base64 32
```

### Check Current Configuration
```bash
# Verify environment (without showing secrets)
node -e "console.log(Object.keys(process.env).filter(k => k.includes('SECRET')).map(k => k + '=' + (process.env[k] ? '[SET]' : '[NOT SET]')).join('\n'))"
```

### Migration from .env files
```bash
# After removing .env files from git
./scripts/setup-local-env.sh

# For production, migrate to AWS Secrets Manager
aws secretsmanager create-secret --name lightningtalk/prod/jwt --secret-string "your-secret"
```

## Tools and Resources

- **1Password CLI**: `op` - Integrate with password manager
- **AWS CLI**: `aws secretsmanager` - Manage AWS secrets
- **GitHub CLI**: `gh secret` - Manage GitHub secrets
- **direnv**: Automatically load environment variables
- **dotenv-vault**: Encrypted .env file management

## Troubleshooting

### Common Issues

1. **Missing credentials in development**
   - Run `./scripts/setup-local-env.sh`
   - Check `.env.local` exists and is populated

2. **CI/CD failures due to missing secrets**
   - Verify secrets are set in GitHub repository settings
   - Check secret names match workflow references

3. **Production credential errors**
   - Verify IAM role has access to Secrets Manager
   - Check secret ARNs are correct
   - Ensure secrets exist in the correct region

## Conclusion

By following this guide, you can securely manage credentials across all environments while maintaining security and ease of development. Remember: never commit real credentials to git, always use environment-specific secrets, and rotate credentials regularly.