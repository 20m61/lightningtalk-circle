# GitHub Secrets Configuration Guide

## 🔐 Critical Security Setup for Lightning Talk Circle

### Generated Security Secrets

**⚠️ IMPORTANT: Configure these secrets in GitHub repository immediately**

#### Required GitHub Repository Secrets

Navigate to: **Settings → Secrets and variables → Actions → New repository
secret**

```bash
# WordPress Production Configuration
WP_SITE_URL=https://xn--6wym69a.com
WP_USERNAME=wpmaster
WP_PASSWORD=fytbuh-3repRu-nucbyf
WP_APP_PASSWORD=2XAN B2ud oVHc Y2lE 3hVb PtRd

# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # ← NEEDS PERSONAL ACCESS TOKEN
GITHUB_OWNER=20m61
GITHUB_REPO=lightningtalk-circle

# Security Secrets (Generated)
JWT_SECRET=b8ca05b8c103189bd8075cd4530f6e9b9449f021e5a0b799a0af475f955f425dfe74f4243f0213e091f11427330f12adf56ef8cee495e305997026dadabdd73b
SESSION_SECRET=a7d5471b5a303616acefc6637ca75f597a6719caeb8ca37b46a4d16903440a90

# Email Configuration (Optional - configure when ready)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Database Configuration (Configure when implementing production DB)
DATABASE_URL=postgresql://prod_user:prod_pass@prod-db:5432/lightningtalk_prod
REDIS_URL=redis://prod-redis:6379

# Optional Service Integrations
SENTRY_DSN=https://xxx@sentry.io/xxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### GitHub Personal Access Token Setup

1. **Create Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens →
     Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
     - ✅ `write:packages` (Write packages to GitHub Package Registry)

2. **Copy token and add to GitHub Secrets as `GITHUB_TOKEN`**

### Deployment Environment Secrets

#### Staging Environment (Optional)

```bash
STAGING_DATABASE_URL=postgresql://staging_user:staging_pass@staging-db:5432/lightningtalk_staging
STAGING_REDIS_URL=redis://staging-redis:6379
STAGING_WP_SITE_URL=https://staging.lightningtalk.com
```

#### Production Environment

```bash
PROD_DATABASE_URL=postgresql://prod_user:prod_pass@prod-db:5432/lightningtalk_prod
PROD_REDIS_URL=redis://prod-redis:6379
```

### Security Best Practices

1. **Never commit these secrets to the repository**
2. **Rotate secrets regularly (every 90 days)**
3. **Use environment-specific secrets**
4. **Monitor secret access in GitHub audit logs**
5. **Implement secret validation in CI/CD**

### Validation

After configuring secrets, verify by running:

```bash
# This should pass once secrets are configured
npm run validate-config
```

### Emergency Procedures

**If secrets are compromised:**

1. Immediately revoke all tokens
2. Generate new secrets using the commands above
3. Update GitHub repository secrets
4. Redeploy all environments
5. Audit access logs for unauthorized usage

---

**Status**: ⚠️ PENDING CONFIGURATION **Priority**: 🚨 CRITICAL - Required before
any deployment **Next Steps**: Configure GitHub Secrets → Test deployment
pipeline
