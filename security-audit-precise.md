# 🔐 Precise Security Audit Report

⚠️ **Status: FINDINGS DETECTED**  
**Scan Date:** 2025-07-22T06:02:27.488Z  
**Repository:** /home/ec2-user/workspace/lightningtalk-circle  
**Scan Type:** Filtered (False positives removed)

## 📊 Executive Summary

- **Commits Scanned:** 50/50
- **Total Findings:** 254
- **False Positives Filtered:** Yes (package-lock.json hashes, test data, etc.)

### Findings by Category

| Category | Count | Risk Level |
|----------|-------|------------|
| 🚨 Real API Keys | 0 | ✅ Clean |
| 🗄️ Database Credentials | 0 | ✅ Clean |
| 👤 Personal Info | 136 | **MEDIUM** |
| 🏗️ Infrastructure Info | 118 | **MEDIUM** |
| ⚙️ Sensitive Env Vars | 0 | ✅ Clean |

## 🔍 Detailed Findings


### Finding 1: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 2: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 3: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `dev@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> dev@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 4: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `dev@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> dev@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 5: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `staging@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> staging@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 6: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `staging@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> staging@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 7: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 8: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 9: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 10: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 11: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.local`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.local <<<
",
      "commitHash": "85b585ef6c00f4653f6ee93cd75763ef3c013329",
```


### Finding 12: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.local`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.local <<<
",
      "commitHash": "85b585ef6c00f4653f6ee93cd75763ef3c013329",
```


### Finding 13: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.local`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.local <<<
",
      "commitHash": "85b585ef6c00f4653f6ee93cd75763ef3c013329",
```


### Finding 14: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.local`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.local <<<
",
      "commitHash": "85b585ef6c00f4653f6ee93cd75763ef3c013329",
```


### Finding 15: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `dev-alerts@xn--6wym69a.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> dev-alerts@xn--6wym69a.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 16: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `dev-alerts@xn--6wym69a.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> dev-alerts@xn--6wym69a.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 17: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `dev-billing@xn--6wym69a.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> dev-billing@xn--6wym69a.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 18: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `dev-billing@xn--6wym69a.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> dev-billing@xn--6wym69a.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 19: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `alerts@xn--6wym69a.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "dev-
>>> alerts@xn--6wym69a.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 20: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `alerts@xn--6wym69a.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "dev-
>>> alerts@xn--6wym69a.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 21: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `billing-alerts@xn--6wym69a.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> billing-alerts@xn--6wym69a.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 22: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `billing-alerts@xn--6wym69a.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> billing-alerts@xn--6wym69a.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 23: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 24: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 25: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 26: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 27: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 28: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 29: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 30: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 31: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 32: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 33: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 34: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 35: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 36: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 37: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 38: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 39: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 40: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `example@email.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> example@email.com <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 41: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `noreply@lightningtalk.local`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> noreply@lightningtalk.local <<<
",
      "commitHash": "WORKSPACE",
```


### Finding 42: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `noreply@lightningtalk.local`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> noreply@lightningtalk.local <<<
",
      "commitHash": "WORKSPACE",
```


### Finding 43: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `noreply@lightningtalk-circle.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> noreply@lightningtalk-circle.com <<<
",
      "commitHash": "WORKSPACE",
```


### Finding 44: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `noreply@lightningtalk-circle.com`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> noreply@lightningtalk-circle.com <<<
",
      "commitHash": "WORKSPACE",
```


### Finding 45: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `noreply@lightningtalk.local`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> noreply@lightningtalk.local <<<
",
      "commitHash": "WORKSPACE",
```


### Finding 46: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `noreply@lightningtalk.local`
- **Context:**
```
      "pattern": "/[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
      "match": "
>>> noreply@lightningtalk.local <<<
",
      "commitHash": "WORKSPACE",
```


### Finding 47: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 48: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 49: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 50: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 51: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 52: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 53: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 54: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 55: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 56: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 57: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 58: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 59: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 60: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 61: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 62: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 63: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 64: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 65: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 66: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 67: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 68: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 69: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 70: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 71: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 72: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 73: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 74: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 75: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 76: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 77: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 78: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 79: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 80: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 81: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 82: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 83: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 84: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 85: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 86: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 87: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 88: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 89: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 90: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 91: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 92: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 93: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 94: personalInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `080-4540-7479`
- **Context:**
```
      "pattern": "/\\b0[789]0-\\d{4}-\\d{4}\\b/g",
      "match": "
>>> 080-4540-7479 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 95: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health", <<<

      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 96: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
",
      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 97: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health", <<<

      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 98: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
",
      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 99: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health", <<<

      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 100: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
",
      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 101: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health", <<<

      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 102: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
",
      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 103: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health", <<<

      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 104: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
",
      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 105: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health", <<<

      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 106: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health <<<
",
      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 107: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',\",",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',\",", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 108: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',\",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',\", <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 109: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 110: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\", <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 111: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\",",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\",", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 112: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\", <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 113: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\",",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\",", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 114: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\", <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 115: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 116: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\", <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 117: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',\",",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',\",", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 118: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',\",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api',\", <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 119: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 120: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\", <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 121: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\",",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\",", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 122: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\", <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 123: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 124: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/events\", <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 125: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\"],",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\"],", <<<

      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 126: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\"],`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com\"], <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 127: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api'",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api'", <<<

      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 128: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api'`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api' <<<
,\",",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 129: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}", <<<

      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 130: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}`
- **Context:**
```
      "commitMessage": "feat: Implement comprehensive code quality improvements with ESLint, Prettier, and unified design sy",
      "context": "        const response = await fetch(\n          `\n>>> 
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}` <<<
 <<<\n\n        );"
    },
```


### Finding 131: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',", <<<

      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 132: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting', <<<
",
      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 133: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}", <<<

      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 134: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}`
- **Context:**
```
      "commitMessage": "feat: Implement comprehensive code quality improvements with ESLint, Prettier, and unified design sy",
      "context": "        const response = await fetch(\n          `\n>>> 
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}` <<<
 <<<\n\n        );"
    },
```


### Finding 135: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',", <<<

      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 136: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting', <<<
",
      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 137: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}", <<<

      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 138: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}`
- **Context:**
```
      "commitMessage": "feat: Implement comprehensive code quality improvements with ESLint, Prettier, and unified design sy",
      "context": "        const response = await fetch(\n          `\n>>> 
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting/participation/${eventId}` <<<
 <<<\n\n        );"
    },
```


### Finding 139: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',", <<<

      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 140: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting',`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api/voting', <<<
",
      "commitHash": "132a6247916c9908a0d11092ba3579156d96298d",
```


### Finding 141: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api", <<<

      "commitHash": "WORKSPACE",
```


### Finding 142: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api <<<
/health",
      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 143: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api", <<<

      "commitHash": "WORKSPACE",
```


### Finding 144: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api <<<
/health",
      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 145: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api",`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api", <<<

      "commitHash": "WORKSPACE",
```


### Finding 146: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api`
- **Context:**
```
      "pattern": "/https?:\\/\\/(?!localhost|127\\.0\\.0\\.1|example)[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api <<<
/health",
      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 147: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 148: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 149: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `136.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 136.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 150: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `136.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 136.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 151: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 152: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 153: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 154: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `9.1.4.3`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 9.1.4.3 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 155: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `9.1.4.3`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 9.1.4.3 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 156: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `9.1.4.4`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 9.1.4.4 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 157: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `9.1.4.4`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 9.1.4.4 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 158: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `136.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 136.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 159: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `136.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 136.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 160: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 161: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 162: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 163: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `136.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 136.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 164: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `136.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 136.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 165: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 166: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 167: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 168: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `9.1.4.3`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 9.1.4.3 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 169: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `9.1.4.3`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 9.1.4.3 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 170: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `9.4.1.2`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 9.4.1.2 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 171: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `9.4.1.2`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 9.4.1.2 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 172: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `136.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 136.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 173: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `136.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 136.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 174: infrastructureInfo

- **File:** `security-audit-precise.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `138.0.0.0`
- **Context:**
```
      "pattern": "/\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b/g",
      "match": "
>>> 138.0.0.0 <<<
",
      "commitHash": "24afe52d9140746103dba5011910213f993e34d1",
```


### Finding 175: personalInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 176: personalInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `dev@lightningtalk.com`
- **Context:**
```
      "pattern": "/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g",
      "match": "
>>> dev@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 177: personalInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `staging@lightningtalk.com`
- **Context:**
```
      "pattern": "/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g",
      "match": "
>>> staging@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 178: personalInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 179: personalInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.com`
- **Context:**
```
      "pattern": "/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g",
      "match": "
>>> admin@lightningtalk.com <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 180: personalInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `storybook@lightningtalk.local`
- **Context:**
```
      "pattern": "/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g",
      "match": "
>>> storybook@lightningtalk.local <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 181: personalInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `admin@lightningtalk.local`
- **Context:**
```
      "pattern": "/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g",
      "match": "
>>> admin@lightningtalk.local <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 182: personalInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `storybook@lightningtalk.local`
- **Context:**
```
      "pattern": "/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g",
      "match": "
>>> storybook@lightningtalk.local <<<
",
      "commitHash": "ce9dc476c72740ffc51b7176f7c2c12ff6a6f558",
```


### Finding 183: infrastructureInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health",`
- **Context:**
```
      "pattern": "/https?:\\/\\/[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4mz5i3x23c.execute-api.ap-northeast-1.amazonaws.com/prod/api/health", <<<

      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 184: infrastructureInfo

- **File:** `security-audit-report.json`
- **Commit:** `15cbbc89`
- **Message:** feat: comprehensive security audit with Git history analysis
- **Match:** `https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health",`
- **Context:**
```
      "pattern": "/https?:\\/\\/[a-zA-Z0-9.-]+\\.amazonaws\\.com[^\\s]*/g",
      "match": "
>>> https://4ujhkvx000.execute-api.ap-northeast-1.amazonaws.com/prod/api/health", <<<

      "commitHash": "f47ea0203ac5363b921499e16bd57bf02b48690d",
```


### Finding 185: personalInfo

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


### Finding 186: personalInfo

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


### Finding 187: personalInfo

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


### Finding 188: personalInfo

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


### Finding 189: personalInfo

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


### Finding 190: infrastructureInfo

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


### Finding 191: infrastructureInfo

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


### Finding 192: infrastructureInfo

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


### Finding 193: infrastructureInfo

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


### Finding 194: infrastructureInfo

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


### Finding 195: infrastructureInfo

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


### Finding 196: personalInfo

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


### Finding 197: personalInfo

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


### Finding 198: personalInfo

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


### Finding 199: personalInfo

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


### Finding 200: personalInfo

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


### Finding 201: personalInfo

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


### Finding 202: personalInfo

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


### Finding 203: personalInfo

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


### Finding 204: personalInfo

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


### Finding 205: personalInfo

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


### Finding 206: personalInfo

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


### Finding 207: personalInfo

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


### Finding 208: infrastructureInfo

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


### Finding 209: infrastructureInfo

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


### Finding 210: infrastructureInfo

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


### Finding 211: infrastructureInfo

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


### Finding 212: infrastructureInfo

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


### Finding 213: infrastructureInfo

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


### Finding 214: infrastructureInfo

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


### Finding 215: personalInfo

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


### Finding 216: personalInfo

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


### Finding 217: personalInfo

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


### Finding 218: personalInfo

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


### Finding 219: personalInfo

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


### Finding 220: personalInfo

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


### Finding 221: personalInfo

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


### Finding 222: personalInfo

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


### Finding 223: infrastructureInfo

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


### Finding 224: infrastructureInfo

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


### Finding 225: infrastructureInfo

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


### Finding 226: infrastructureInfo

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


### Finding 227: infrastructureInfo

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


### Finding 228: infrastructureInfo

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


### Finding 229: infrastructureInfo

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


### Finding 230: infrastructureInfo

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


### Finding 231: infrastructureInfo

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


### Finding 232: infrastructureInfo

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


### Finding 233: infrastructureInfo

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


### Finding 234: infrastructureInfo

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


### Finding 235: infrastructureInfo

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


### Finding 236: infrastructureInfo

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


### Finding 237: infrastructureInfo

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


### Finding 238: personalInfo

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


### Finding 239: personalInfo

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


### Finding 240: infrastructureInfo

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


### Finding 241: personalInfo

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


### Finding 242: infrastructureInfo

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


### Finding 243: infrastructureInfo

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


### Finding 244: personalInfo

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


### Finding 245: personalInfo

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


### Finding 246: personalInfo

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


### Finding 247: infrastructureInfo

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


### Finding 248: infrastructureInfo

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


### Finding 249: personalInfo

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


### Finding 250: infrastructureInfo

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


### Finding 251: personalInfo

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


### Finding 252: infrastructureInfo

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


### Finding 253: personalInfo

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


### Finding 254: infrastructureInfo

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
