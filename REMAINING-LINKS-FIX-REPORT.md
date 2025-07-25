# 残りのリンク修正レポート

**実行日時**: 2025-07-25T19:57:34.139Z **修正数**: 29

## 修正内容

### docs/BACKUP-PLAN.md

- `../security/INCIDENT-RESPONSE.md` → `./security/INCIDENT-RESPONSE.md`

### docs/BACKUP-PLAN.md

- `../security/SECURITY-POLICY.md` → `./security/SECURITY-POLICY.md`

### docs/BACKUP-PLAN.md

- `../monitoring/MONITORING-SETUP.md` → `./monitoring/MONITORING-SETUP.md`

### docs/OPERATIONS-MANUAL.md

- `../security/SECURITY-POLICY.md` → `./security/SECURITY-POLICY.md`

### docs/USER-GUIDE.md

- `../guides/DEVELOPER-GUIDE.md` → `./guides/DEVELOPER-GUIDE.md`

### docs/deployment/DEPLOYMENT-GUIDE.md

- `../guides/wordpress-development-guide.md` →
  `../guides/wordpress-development-guide.md`

### docs/deployment/DEVELOPMENT-FLOW-GUIDE.md

- `../../guides/ENVIRONMENT-GUIDE.md` → `../guides/ENVIRONMENT-GUIDE.md`

### docs/development/README-WordPress.md

- `../guides/wordpress-development-guide.md` →
  `../guides/wordpress-development-guide.md`

### docs/development/README-WordPress.md

- `../technical/wordpress/shortcodes.md` →
  `../technical/wordpress/shortcodes.md`

### docs/development/README-WordPress.md

- `../api/reference.md` → `../api/reference.md`

### docs/development/README-WordPress.md

- `../guides/customization.md` → `../guides/customization.md`

### docs/development/onboarding-checklist.md

- `../security/README.md` → `../security/README.md`

### docs/development/quick-start.md

- `../../CONTRIBUTING.md` → `../../CONTRIBUTING.md`

### docs/development/quick-start.md

- `../guides/troubleshooting.md` → `../guides/troubleshooting.md`

### docs/docker-development.md

- `./environment-variables.md` → `./guides/environment-variables.md`

### docs/production-logging-system.md

- `../security/monitoring-best-practices.md` →
  `./security/monitoring-best-practices.md`

### docs/project/complete-issue-implementation-guide.md

- `../project/guides/issue-creation-process.md` → `./issue-creation-process.md`

### docs/project/initial-issues.md

- `../project/planning/issue-creation-plan.md` → `./issue-creation-plan.md`

### docs/project/initial-issues.md

- `../technical/development/ci-cd.md` → `../technical/ci-cd.md`

### docs/project/initial-issues.md

- `../technical/guides/documentation-guidelines.md` →
  `../technical/documentation-guidelines.md`

### docs/project/issue-creation-workflow.md

- `../project/planning/issue-creation-plan.md` → `./issue-creation-plan.md`

### docs/project/issue-management-guide.md

- `../project/planning/issue-creation-plan.md` → `./issue-creation-plan.md`

### docs/project/issue-management-guide.md

- `../project/guides/issue-execution-guide.md` → `./issue-execution-guide.md`

### docs/project/issue-verification-checklist.md

- `../project/planning/issue-creation-plan.md` → `./issue-creation-plan.md`

### docs/usage/automated-workflow-guide.md

- `../api/technical-specifications.md` →
  `../technical/technical-specifications.md`

### docs/usage/automated-workflow-guide.md

- `../api/reference.md` → `../api/reference.md`

### docs/usage/automated-workflow-guide.md

- `../guides/troubleshooting.md` → `../guides/troubleshooting.md`

### README.md

- `../project/guides/issue-execution-guide.md` →
  `docs/project/issue-execution-guide.md`

### README.md

- `../project/guides/issue-creation-tutorial.md` →
  `docs/project/issue-creation-tutorial.md`

## 修正戦略

1. **security/ と monitoring/ への参照**
   - `../security/` → `./security/` (docsディレクトリ内から)
   - `../monitoring/` → `./monitoring/` (docsディレクトリ内から)

2. **guides/ への参照**
   - `../guides/` → `./guides/` (docsディレクトリ内から)
   - `../../guides/` → `../guides/` (サブディレクトリから)

3. **project/ 内の相対パス**
   - `../project/planning/` → `./` (同じディレクトリ内)
   - `../project/guides/` → `./` (同じディレクトリ内)

4. **README.md からの参照**
   - `../project/guides/` → `docs/project/` (ルートから)

## 次のステップ

1. `npm run docs:check-links` で再検証
2. まだ壊れているリンクがあれば手動で修正
3. ドキュメント移行の実行を検討

---

自動生成: Lightning Talk Circle Remaining Link Fixer
