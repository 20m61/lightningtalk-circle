# 🔐 Precise Security Audit Report

⚠️ **Status: FINDINGS DETECTED**  
**Scan Date:** 2025-07-22T05:48:45.347Z  
**Repository:** /home/ec2-user/workspace/lightningtalk-circle  
**Scan Type:** Filtered (False positives removed)

## 📊 Executive Summary

- **Commits Scanned:** 50/50
- **Total Findings:** 73
- **False Positives Filtered:** Yes (package-lock.json hashes, test data, etc.)

### Findings by Category

| Category | Count | Risk Level |
|----------|-------|------------|
| 🚨 Real API Keys | 0 | ✅ Clean |
| 🗄️ Database Credentials | 0 | ✅ Clean |
| 👤 Personal Info | 35 | **MEDIUM** |
| 🏗️ Infrastructure Info | 38 | **MEDIUM** |
| ⚙️ Sensitive Env Vars | 0 | ✅ Clean |

## 🔍 Detailed Findings


### Finding 1: personalInfo

- **File:** `cdk/bin/cdk.js`
- **Commit:** `ce9dc476`
- **Message:** 🚀 Complete Lightning Talk Circle Storybook CI/CD Pipeline (#113)
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
    enableCostMonitoring: true,
    alertEmail: config.alertEmail || '
>>> admin@lightningtalk.com <<<
',
    tags: {
```


### Finding 2: personalInfo

- **File:** `cdk/lib/config/environment.js`
- **Commit:** `ce9dc476`
- **Message:** 🚀 Complete Lightning Talk Circle Storybook CI/CD Pipeline (#113)
- **Match:** `dev@lightningtalk.com`
- **Context:**
```
      },
      alertEmail: process.env.DEV_ALERT_EMAIL || '
>>> dev@lightningtalk.com <<<
',
    },
```


### Finding 3: personalInfo

- **File:** `cdk/lib/config/environment.js`
- **Commit:** `ce9dc476`
- **Message:** 🚀 Complete Lightning Talk Circle Storybook CI/CD Pipeline (#113)
- **Match:** `staging@lightningtalk.com`
- **Context:**
```
      },
      alertEmail: process.env.STAGING_ALERT_EMAIL || '
>>> staging@lightningtalk.com <<<
',
    },
```


### Finding 4: personalInfo

- **File:** `cdk/lib/config/environment.js`
- **Commit:** `ce9dc476`
- **Message:** 🚀 Complete Lightning Talk Circle Storybook CI/CD Pipeline (#113)
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      },
      alertEmail: process.env.PROD_ALERT_EMAIL || '
>>> admin@lightningtalk.com <<<
',
      hostedZoneId: process.env.HOSTED_ZONE_ID || 'Z036564723AZHFOSIARRI',
```


### Finding 5: personalInfo

- **File:** `cdk/lib/prod-environment-stack.js`
- **Commit:** `ce9dc476`
- **Message:** 🚀 Complete Lightning Talk Circle Storybook CI/CD Pipeline (#113)
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      enableCostMonitoring = true,
      alertEmail = '
>>> admin@lightningtalk.com <<<
'
    } = props;
```


### Finding 6: infrastructureInfo

- **File:** `.github/workflows/multi-environment-deploy.yml`
- **Commit:** `f47ea020`
- **Message:** fix: デプロイメント実践課題の包括的解決 (#112)
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
          curl -f https://dev.xn--6wym69a.com || exit 1
          curl -f 
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
 || exit 1

```


### Finding 7: infrastructureInfo

- **File:** `.github/workflows/multi-environment-deploy.yml`
- **Commit:** `f47ea020`
- **Message:** fix: デプロイメント実践課題の包括的解決 (#112)
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
          curl -f https://xn--6wym69a.com || exit 1
          curl -f 
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
 || exit 1

```


### Finding 8: infrastructureInfo

- **File:** `.github/workflows/multi-environment-deploy.yml`
- **Commit:** `07871c51`
- **Message:** fix: レビュー指摘事項の修正
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
          curl -f https://dev.xn--6wym69a.com || exit 1
          curl -f 
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
 || exit 1

```


### Finding 9: infrastructureInfo

- **File:** `.github/workflows/multi-environment-deploy.yml`
- **Commit:** `07871c51`
- **Message:** fix: レビュー指摘事項の修正
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
          curl -f https://xn--6wym69a.com || exit 1
          curl -f 
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
 || exit 1

```


### Finding 10: infrastructureInfo

- **File:** `.github/workflows/multi-environment-deploy.yml`
- **Commit:** `1063550c`
- **Message:** feat: 発表.com/dev.発表.comを使った開発フローの整備
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
          curl -f https://dev.xn--6wym69a.com || exit 1
          curl -f 
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
 || exit 1

```


### Finding 11: infrastructureInfo

- **File:** `.github/workflows/multi-environment-deploy.yml`
- **Commit:** `1063550c`
- **Message:** feat: 発表.com/dev.発表.comを使った開発フローの整備
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
          curl -f https://xn--6wym69a.com || exit 1
          curl -f 
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
 || exit 1

```


### Finding 12: personalInfo

- **File:** `.devcontainer/docker-compose.yml`
- **Commit:** `85b585ef`
- **Message:** fix: Address PR #109 review feedback for devcontainer setup
- **Match:** `admin@lightningtalk.local`
- **Context:**
```
    environment:
      PGADMIN_DEFAULT_EMAIL: 
>>> admin@lightningtalk.local <<<

      PGADMIN_DEFAULT_PASSWORD: admin
```


### Finding 13: personalInfo

- **File:** `.devcontainer/docker-compose.yml`
- **Commit:** `aee12c9e`
- **Message:** fix: Fix devcontainer setup and canvas dependency issues
- **Match:** `admin@lightningtalk.local`
- **Context:**
```
    environment:
      PGADMIN_DEFAULT_EMAIL: 
>>> admin@lightningtalk.local <<<

      PGADMIN_DEFAULT_PASSWORD: admin
```


### Finding 14: personalInfo

- **File:** `cdk/config/dev-config.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `dev-alerts@xn--6wym69a.com`
- **Context:**
```
    "logRetentionDays": 30,
    "alertEmail": "
>>> dev-alerts@xn--6wym69a.com <<<
",
    "enableDetailedMonitoring": false,
```


### Finding 15: personalInfo

- **File:** `cdk/config/dev-config.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `dev-billing@xn--6wym69a.com`
- **Context:**
```
    "alertThresholds": [80, 100],
    "notificationEmail": "
>>> dev-billing@xn--6wym69a.com <<<
"
  },
```


### Finding 16: personalInfo

- **File:** `cdk/config/prod-config.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `alerts@xn--6wym69a.com`
- **Context:**
```
    "logRetentionDays": 365,
    "alertEmail": "
>>> alerts@xn--6wym69a.com <<<
",
    "enableDetailedMonitoring": true,
```


### Finding 17: personalInfo

- **File:** `cdk/config/prod-config.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `billing-alerts@xn--6wym69a.com`
- **Context:**
```
    "alertThresholds": [50, 80, 100],
    "notificationEmail": "
>>> billing-alerts@xn--6wym69a.com <<<
"
  },
```


### Finding 18: personalInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `example@email.com`
- **Context:**
```
            "index": "529",
            "line": "            <input type=\"email\" id=\"voteEmail\" name=\"email\" placeholder=\"
>>> example@email.com <<<
\" maxlength=\"100\" />",
            "message": "Syntax not understood"
```


### Finding 19: personalInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
            "index": "587",
            "line": "            <p>パスワードをお忘れの場合は<a href=\"mailto:
>>> admin@lightningtalk.com <<<
\">管理者</a>までご連絡ください</p>",
            "message": "Unknown directive"
```


### Finding 20: personalInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
            "index": "291",
            "line": "              <a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
            "message": "Unknown directive"
```


### Finding 21: personalInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
            "index": "291",
            "line": "              <a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
            "message": "Unknown directive"
```


### Finding 22: personalInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
            "index": "291",
            "line": "              <a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
            "message": "Unknown directive"
```


### Finding 23: personalInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
            "index": "291",
            "line": "              <a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
            "message": "Unknown directive"
```


### Finding 24: infrastructureInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',",`
- **Context:**
```
            "index": "92",
            "line": "        apiEndpoint: '
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',", <<<

            "message": "Unknown directive"
```


### Finding 25: infrastructureInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `138.0.0.0`
- **Context:**
```
  "runWarnings": [],
  "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/
>>> 138.0.0.0 <<<
 Safari/537.36",
  "environment": {
```


### Finding 26: infrastructureInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `136.0.0.0`
- **Context:**
```
  "environment": {
    "networkUserAgent": "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/
>>> 136.0.0.0 <<<
 Mobile Safari/537.36",
    "hostUserAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/138.0.0.0 Safari/537.36",
```


### Finding 27: infrastructureInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `138.0.0.0`
- **Context:**
```
  "runWarnings": [],
  "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/
>>> 138.0.0.0 <<<
 Safari/537.36",
  "environment": {
```


### Finding 28: infrastructureInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `9.1.4.3`
- **Context:**
```
            "EN-301-549",
            "EN-
>>> 9.1.4.3 <<<
",
            "ACT"
```


### Finding 29: infrastructureInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `9.1.4.4`
- **Context:**
```
            "EN-301-549",
            "EN-
>>> 9.1.4.4 <<<
",
            "ACT"
```


### Finding 30: infrastructureInfo

- **File:** `lighthouse-mobile-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `136.0.0.0`
- **Context:**
```
  "environment": {
    "networkUserAgent": "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/
>>> 136.0.0.0 <<<
 Mobile Safari/537.36",
    "hostUserAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/138.0.0.0 Safari/537.36",
```


### Finding 31: personalInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `example@email.com`
- **Context:**
```
            "index": "529",
            "line": "            <input type=\"email\" id=\"voteEmail\" name=\"email\" placeholder=\"
>>> example@email.com <<<
\" maxlength=\"100\" />",
            "message": "Syntax not understood"
```


### Finding 32: personalInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
            "index": "587",
            "line": "            <p>パスワードをお忘れの場合は<a href=\"mailto:
>>> admin@lightningtalk.com <<<
\">管理者</a>までご連絡ください</p>",
            "message": "Unknown directive"
```


### Finding 33: personalInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
              },
              "snippet": "<a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
              "nodeLabel": "☎️\n080-4540-7479"
```


### Finding 34: personalInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
              },
              "snippet": "<a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
              "nodeLabel": "☎️\n080-4540-7479"
```


### Finding 35: personalInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
              },
              "snippet": "<a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
              "nodeLabel": "☎️\n080-4540-7479"
```


### Finding 36: personalInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
              },
              "snippet": "<a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
              "nodeLabel": "☎️\n080-4540-7479"
```


### Finding 37: personalInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
              },
              "snippet": "<a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
              "nodeLabel": "☎️\n080-4540-7479"
```


### Finding 38: personalInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `080-4540-7479`
- **Context:**
```
              },
              "snippet": "<a href=\"tel:
>>> 080-4540-7479 <<<
\" class=\"phone-link\">",
              "nodeLabel": "☎️\n080-4540-7479"
```


### Finding 39: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events",`
- **Context:**
```
          {
            "url": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events", <<<

            "sessionTargetType": "page",
```


### Finding 40: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com",`
- **Context:**
```
          {
            "origin": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com", <<<

            "rtt": 0.29499999999999993
```


### Finding 41: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com",`
- **Context:**
```
          {
            "origin": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com", <<<

            "rtt": 0.29499999999999993
```


### Finding 42: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events",`
- **Context:**
```
          {
            "url": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events", <<<

            "sessionTargetType": "page",
```


### Finding 43: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',",`
- **Context:**
```
            "index": "92",
            "line": "        apiEndpoint: '
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',", <<<

            "message": "Unknown directive"
```


### Finding 44: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events",`
- **Context:**
```
          {
            "url": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events", <<<

            "sessionTargetType": "page",
```


### Finding 45: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com",`
- **Context:**
```
          {
            "origin": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com", <<<

            "rtt": 0.29499999999999993
```


### Finding 46: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events",`
- **Context:**
```
          {
            "url": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events", <<<

            "sessionTargetType": "page",
```


### Finding 47: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com"],`
- **Context:**
```
      "homepage": "https://aws.amazon.com/s3/",
      "origins": ["
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com"], <<<

      "category": "other"
```


### Finding 48: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `138.0.0.0`
- **Context:**
```
  "runWarnings": [],
  "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/
>>> 138.0.0.0 <<<
 Safari/537.36",
  "environment": {
```


### Finding 49: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `136.0.0.0`
- **Context:**
```
  "environment": {
    "networkUserAgent": "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/
>>> 136.0.0.0 <<<
 Mobile Safari/537.36",
    "hostUserAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/138.0.0.0 Safari/537.36",
```


### Finding 50: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `138.0.0.0`
- **Context:**
```
  "runWarnings": [],
  "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/
>>> 138.0.0.0 <<<
 Safari/537.36",
  "environment": {
```


### Finding 51: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `9.1.4.3`
- **Context:**
```
            "EN-301-549",
            "EN-
>>> 9.1.4.3 <<<
",
            "ACT"
```


### Finding 52: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `9.4.1.2`
- **Context:**
```
            "EN-301-549",
            "EN-
>>> 9.4.1.2 <<<
",
            "ACT"
```


### Finding 53: infrastructureInfo

- **File:** `lighthouse-report.json`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `136.0.0.0`
- **Context:**
```
  "environment": {
    "networkUserAgent": "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/
>>> 136.0.0.0 <<<
 Mobile Safari/537.36",
    "hostUserAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/138.0.0.0 Safari/537.36",
```


### Finding 54: personalInfo

- **File:** `public/js/main.js`
- **Commit:** `24afe52d`
- **Message:** feat: Complete Lighthouse performance analysis and mobile optimizations
- **Match:** `example@email.com`
- **Context:**
```
                    <input type="email" id="email" name="email" required>
                    <span class="field-hint">例: 
>>> example@email.com <<<
</span>
                    <span class="field-error" id="email-error"></span>
```


### Finding 55: personalInfo

- **File:** `public/js/main.js`
- **Commit:** `2ff201db`
- **Message:** fix: 主要なJavaScriptコンソールエラーを修正
- **Match:** `example@email.com`
- **Context:**
```
                    <input type="email" id="email" name="email" required>
                    <span class="field-hint">例: 
>>> example@email.com <<<
</span>
                    <span class="field-error" id="email-error"></span>
```


### Finding 56: infrastructureInfo

- **File:** `public/js/auth.js`
- **Commit:** `132a6247`
- **Message:** feat: Implement comprehensive code quality improvements with ESLint, Prettier, and unified design sy
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api'`
- **Context:**
```
  redirectUri: `${window.location.origin}/callback`,
  apiEndpoint: '
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api' <<<

};
```


### Finding 57: personalInfo

- **File:** `public/js/main.js`
- **Commit:** `132a6247`
- **Message:** feat: Implement comprehensive code quality improvements with ESLint, Prettier, and unified design sy
- **Match:** `example@email.com`
- **Context:**
```
                    <input type="email" id="email" name="email" required>
                    <span class="field-hint">例: 
>>> example@email.com <<<
</span>
                    <span class="field-error" id="email-error"></span>
```


### Finding 58: infrastructureInfo

- **File:** `public/js/main.js`
- **Commit:** `132a6247`
- **Message:** feat: Implement comprehensive code quality improvements with ESLint, Prettier, and unified design sy
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}`
- **Context:**
```
        const response = await fetch(
          `
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}` <<<

        );
```


### Finding 59: infrastructureInfo

- **File:** `public/js/main.js`
- **Commit:** `132a6247`
- **Message:** feat: Implement comprehensive code quality improvements with ESLint, Prettier, and unified design sy
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',`
- **Context:**
```
    // Also send via API
    fetch('
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting', <<<
 {
      method: 'POST',
```


### Finding 60: personalInfo

- **File:** `scripts/create-sample-event.js`
- **Commit:** `132a6247`
- **Message:** feat: Implement comprehensive code quality improvements with ESLint, Prettier, and unified design sy
- **Match:** `080-4540-7479`
- **Context:**
```
        map_url: process.env.LT_MAP_URL || 'https://maps.app.goo.gl/51TFv825jmuBsjbq5?g_st=ic',
        emergency_phone: process.env.LT_EMERGENCY_PHONE || '
>>> 080-4540-7479 <<<
',
        online_url: process.env.LT_MEET_URL || 'https://meet.google.com/ycp-sdec-xsr',
```


### Finding 61: personalInfo

- **File:** `scripts/create-sample-event.js`
- **Commit:** `132a6247`
- **Message:** feat: Implement comprehensive code quality improvements with ESLint, Prettier, and unified design sy
- **Match:** `080-4540-7479`
- **Context:**
```
        map_url: process.env.LT_MAP_URL || 'https://maps.app.goo.gl/51TFv825jmuBsjbq5?g_st=ic',
        emergency_phone: process.env.LT_EMERGENCY_PHONE || '
>>> 080-4540-7479 <<<
',
        online_url: process.env.LT_MEET_URL || 'https://meet.google.com/ycp-sdec-xsr',
```


### Finding 62: personalInfo

- **File:** `public/js/main.js`
- **Commit:** `e6171530`
- **Message:** feat: Implement comprehensive frontend structured logging system
- **Match:** `example@email.com`
- **Context:**
```
                    <input type="email" id="email" name="email" required>
                    <span class="field-hint">例: 
>>> example@email.com <<<
</span>
                    <span class="field-error" id="email-error"></span>
```


### Finding 63: infrastructureInfo

- **File:** `public/js/main.js`
- **Commit:** `e6171530`
- **Message:** feat: Implement comprehensive frontend structured logging system
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}`
- **Context:**
```
        const response = await fetch(
          `
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}` <<<

        );
```


### Finding 64: infrastructureInfo

- **File:** `public/js/main.js`
- **Commit:** `e6171530`
- **Message:** feat: Implement comprehensive frontend structured logging system
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',`
- **Context:**
```
    // Also send via API
    fetch('
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting', <<<
 {
      method: 'POST',
```


### Finding 65: personalInfo

- **File:** `public/js/main.js`
- **Commit:** `83b1ddee`
- **Message:** feat: Implement comprehensive mobile optimization system v1
- **Match:** `example@email.com`
- **Context:**
```
                    <input type="email" id="email" name="email" required>
                    <span class="field-hint">例: 
>>> example@email.com <<<
</span>
                    <span class="field-error" id="email-error"></span>
```


### Finding 66: infrastructureInfo

- **File:** `public/js/main.js`
- **Commit:** `83b1ddee`
- **Message:** feat: Implement comprehensive mobile optimization system v1
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}`
- **Context:**
```
        const response = await fetch(
          `
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}` <<<

        );
```


### Finding 67: infrastructureInfo

- **File:** `public/js/main.js`
- **Commit:** `83b1ddee`
- **Message:** feat: Implement comprehensive mobile optimization system v1
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',`
- **Context:**
```
    // Also send via API
    fetch('
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting', <<<
 {
      method: 'POST',
```


### Finding 68: personalInfo

- **File:** `.env`
- **Commit:** `WORKSPAC`
- **Message:** Current workspace
- **Match:** `noreply@lightningtalk.local`
- **Context:**
```
EMAIL_SERVICE=mock
EMAIL_FROM="
>>> noreply@lightningtalk.local <<<
"

```


### Finding 69: infrastructureInfo

- **File:** `.env`
- **Commit:** `WORKSPAC`
- **Message:** Current workspace
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api`
- **Context:**
```
# API Configuration
API_ENDPOINT=
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api <<<


```


### Finding 70: personalInfo

- **File:** `.env.production`
- **Commit:** `WORKSPAC`
- **Message:** Current workspace
- **Match:** `noreply@lightningtalk-circle.com`
- **Context:**
```
EMAIL_PROVIDER=ses
EMAIL_FROM=
>>> noreply@lightningtalk-circle.com <<<

AWS_SES_REGION=ap-northeast-1
```


### Finding 71: infrastructureInfo

- **File:** `.env.production`
- **Commit:** `WORKSPAC`
- **Message:** Current workspace
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api`
- **Context:**
```
# Production URLs
API_BASE_URL=
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api <<<

FRONTEND_URL=https://xn--6wym69a.com
```


### Finding 72: personalInfo

- **File:** `.env.development`
- **Commit:** `WORKSPAC`
- **Message:** Current workspace
- **Match:** `noreply@lightningtalk.local`
- **Context:**
```
EMAIL_SERVICE=mock
EMAIL_FROM="
>>> noreply@lightningtalk.local <<<
"

```


### Finding 73: infrastructureInfo

- **File:** `.env.development`
- **Commit:** `WORKSPAC`
- **Message:** Current workspace
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api`
- **Context:**
```
# API Configuration
API_ENDPOINT=
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api <<<


```



## 💡 Recommendations

- 👤 Personal information detected. Review data handling policies.
- 🏗️ Infrastructure details exposed. Review access controls.
- 🔧 Implement pre-commit hooks with security scanning.
- 📊 Schedule regular automated security audits.

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit .env files with real values
2. **API Keys**: Use environment variables and secret management services
3. **Database Credentials**: Use connection strings with environment variables
4. **Pre-commit Hooks**: Implement automated security scanning
5. **Regular Audits**: Schedule monthly security reviews

---
*Generated by Lightning Talk Circle Precise Security Audit v2.0*  
*🤖 Powered by Claude Code Assistant*  
*⚡ False positives filtered for accuracy*
