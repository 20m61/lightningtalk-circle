#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple color functions for output
const colors = {
  blue: text => `\x1b[34m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  gray: text => `\x1b[90m${text}\x1b[0m`,
  bold: text => `\x1b[1m${text}\x1b[0m`
};

class RemainingLinkFixer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.fixedCount = 0;
    this.fixes = [];

    console.log(colors.bold('🔧 Lightning Talk Circle - 残りのリンク修正ツール'));
    console.log(colors.gray(`プロジェクトルート: ${this.projectRoot}`));
    console.log('');
  }

  async fixRemainingLinks() {
    console.log(colors.bold('🚀 残りの壊れたリンクを修正中...\n'));

    // docs/BACKUP-PLAN.md の修正
    await this.fixFile('docs/BACKUP-PLAN.md', [
      { old: '../security/INCIDENT-RESPONSE.md', new: './security/INCIDENT-RESPONSE.md' },
      { old: '../security/SECURITY-POLICY.md', new: './security/SECURITY-POLICY.md' },
      { old: '../monitoring/MONITORING-SETUP.md', new: './monitoring/MONITORING-SETUP.md' }
    ]);

    // docs/OPERATIONS-MANUAL.md の修正
    await this.fixFile('docs/OPERATIONS-MANUAL.md', [
      { old: '../security/SECURITY-POLICY.md', new: './security/SECURITY-POLICY.md' }
    ]);

    // docs/USER-GUIDE.md の修正
    await this.fixFile('docs/USER-GUIDE.md', [
      { old: '../guides/DEVELOPER-GUIDE.md', new: './guides/DEVELOPER-GUIDE.md' }
    ]);

    // docs/deployment/DEPLOYMENT-GUIDE.md の修正
    await this.fixFile('docs/deployment/DEPLOYMENT-GUIDE.md', [
      {
        old: '../guides/wordpress-development-guide.md',
        new: '../guides/wordpress-development-guide.md'
      }
    ]);

    // docs/deployment/DEVELOPMENT-FLOW-GUIDE.md の修正
    await this.fixFile('docs/deployment/DEVELOPMENT-FLOW-GUIDE.md', [
      { old: '../../guides/ENVIRONMENT-GUIDE.md', new: '../guides/ENVIRONMENT-GUIDE.md' }
    ]);

    // docs/development/README-WordPress.md の修正
    await this.fixFile('docs/development/README-WordPress.md', [
      {
        old: '../guides/wordpress-development-guide.md',
        new: '../guides/wordpress-development-guide.md'
      },
      { old: '../technical/wordpress/shortcodes.md', new: '../technical/wordpress/shortcodes.md' },
      { old: '../api/reference.md', new: '../api/reference.md' },
      { old: '../guides/customization.md', new: '../guides/customization.md' }
    ]);

    // docs/development/onboarding-checklist.md の修正
    await this.fixFile('docs/development/onboarding-checklist.md', [
      { old: '../security/README.md', new: '../security/README.md' }
    ]);

    // docs/development/quick-start.md の修正
    await this.fixFile('docs/development/quick-start.md', [
      { old: '../../CONTRIBUTING.md', new: '../../CONTRIBUTING.md' },
      { old: '../guides/troubleshooting.md', new: '../guides/troubleshooting.md' }
    ]);

    // docs/docker-development.md の修正
    await this.fixFile('docs/docker-development.md', [
      { old: './environment-variables.md', new: './guides/environment-variables.md' }
    ]);

    // docs/production-logging-system.md の修正
    await this.fixFile('docs/production-logging-system.md', [
      {
        old: '../security/monitoring-best-practices.md',
        new: './security/monitoring-best-practices.md'
      }
    ]);

    // docs/project/ 内のファイル修正
    await this.fixFile('docs/project/complete-issue-implementation-guide.md', [
      { old: '../project/guides/issue-creation-process.md', new: './issue-creation-process.md' }
    ]);

    await this.fixFile('docs/project/initial-issues.md', [
      { old: '../project/planning/issue-creation-plan.md', new: './issue-creation-plan.md' },
      { old: '../technical/development/ci-cd.md', new: '../technical/ci-cd.md' },
      {
        old: '../technical/guides/documentation-guidelines.md',
        new: '../technical/documentation-guidelines.md'
      }
    ]);

    await this.fixFile('docs/project/issue-creation-workflow.md', [
      { old: '../project/planning/issue-creation-plan.md', new: './issue-creation-plan.md' }
    ]);

    await this.fixFile('docs/project/issue-management-guide.md', [
      { old: '../project/planning/issue-creation-plan.md', new: './issue-creation-plan.md' },
      { old: '../project/guides/issue-execution-guide.md', new: './issue-execution-guide.md' }
    ]);

    await this.fixFile('docs/project/issue-verification-checklist.md', [
      { old: '../project/planning/issue-creation-plan.md', new: './issue-creation-plan.md' }
    ]);

    // docs/usage/automated-workflow-guide.md の修正
    await this.fixFile('docs/usage/automated-workflow-guide.md', [
      {
        old: '../api/technical-specifications.md',
        new: '../technical/technical-specifications.md'
      },
      { old: '../api/reference.md', new: '../api/reference.md' },
      { old: '../guides/troubleshooting.md', new: '../guides/troubleshooting.md' }
    ]);

    // README.md の修正
    await this.fixFile('README.md', [
      {
        old: '../project/guides/issue-execution-guide.md',
        new: 'docs/project/issue-execution-guide.md'
      },
      {
        old: '../project/guides/issue-creation-tutorial.md',
        new: 'docs/project/issue-creation-tutorial.md'
      }
    ]);

    // 修正レポートの生成
    this.generateReport();
  }

  async fixFile(filePath, replacements) {
    const fullPath = path.join(this.projectRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(colors.red(`❌ ファイルが見つかりません: ${filePath}`));
      return;
    }

    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      for (const { old: oldPath, new: newPath } of replacements) {
        if (content.includes(oldPath)) {
          content = content.replace(new RegExp(escapeRegExp(oldPath), 'g'), newPath);
          console.log(colors.green(`✅ 修正: ${oldPath} → ${newPath}`));
          console.log(colors.gray(`   ファイル: ${filePath}`));
          this.fixedCount++;
          modified = true;

          this.fixes.push({
            file: filePath,
            old: oldPath,
            new: newPath
          });
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
      }
    } catch (error) {
      console.error(colors.red(`❌ エラー: ${filePath} - ${error.message}`));
    }
  }

  generateReport() {
    const timestamp = new Date().toISOString();
    const reportContent = `# 残りのリンク修正レポート

**実行日時**: ${timestamp}
**修正数**: ${this.fixedCount}

## 修正内容

${this.fixes
    .map(
      fix => `### ${fix.file}
- \`${fix.old}\` → \`${fix.new}\`
`
    )
    .join('\n')}

## 修正戦略

1. **security/ と monitoring/ への参照**
   - \`../security/\` → \`./security/\` (docsディレクトリ内から)
   - \`../monitoring/\` → \`./monitoring/\` (docsディレクトリ内から)

2. **guides/ への参照**
   - \`../guides/\` → \`./guides/\` (docsディレクトリ内から)
   - \`../../guides/\` → \`../guides/\` (サブディレクトリから)

3. **project/ 内の相対パス**
   - \`../project/planning/\` → \`./\` (同じディレクトリ内)
   - \`../project/guides/\` → \`./\` (同じディレクトリ内)

4. **README.md からの参照**
   - \`../project/guides/\` → \`docs/project/\` (ルートから)

## 次のステップ

1. \`npm run docs:check-links\` で再検証
2. まだ壊れているリンクがあれば手動で修正
3. ドキュメント移行の実行を検討

---
自動生成: Lightning Talk Circle Remaining Link Fixer
`;

    const reportPath = path.join(this.projectRoot, 'REMAINING-LINKS-FIX-REPORT.md');
    fs.writeFileSync(reportPath, reportContent);

    console.log(colors.blue('\n📊 修正レポートを生成しました: REMAINING-LINKS-FIX-REPORT.md'));
    console.log(
      colors.bold(`\n📊 修正結果: ${colors.green(`${this.fixedCount}個`)}のリンクを修正しました`)
    );
  }
}

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 実行
const fixer = new RemainingLinkFixer();
fixer.fixRemainingLinks().catch(error => {
  console.error(colors.red(`❌ エラーが発生しました: ${error.message}`));
  process.exit(1);
});
