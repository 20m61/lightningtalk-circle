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

class BrokenLinkFixer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.reportPath = path.join(this.projectRoot, 'LINK-CHECK-REPORT.md');
    this.fixedCount = 0;
    this.skippedCount = 0;

    // 自動修正マッピング
    this.autoFixMappings = {
      // セキュリティ関連
      './INCIDENT-RESPONSE.md': '../security/INCIDENT-RESPONSE.md',
      './SECURITY-POLICY.md': '../security/SECURITY-POLICY.md',
      './MONITORING-SETUP.md': '../monitoring/MONITORING-SETUP.md',

      // プロジェクト関連
      '/docs/project/issue-creation-plan.md': '../project/planning/issue-creation-plan.md',
      '/docs/project/issue-creation-execution-guide.md':
        '../project/guides/issue-execution-guide.md',
      '/docs/project/issue-creation-tutorial.md': '../project/guides/issue-creation-tutorial.md',
      '/docs/project/issue-creation-process.md': '../project/guides/issue-creation-process.md',

      // 開発ガイド
      'docs/wordpress-development-guide.md': '../guides/wordpress-development-guide.md',
      'DEVELOPER-GUIDE.md': '../guides/DEVELOPER-GUIDE.md',
      './ENVIRONMENT-GUIDE.md': '../../guides/ENVIRONMENT-GUIDE.md',

      // 技術文書
      '/docs/technical/ci-cd.md': '../technical/development/ci-cd.md',
      '/docs/technical/documentation-guidelines.md':
        '../technical/guides/documentation-guidelines.md',
      '/docs/features/content-management.md': '../technical/content-management.md',
      './TECH-STACK-INTEGRATION.md': '../technical/TECH-STACK-INTEGRATION.md',

      // API関連
      './technical-specifications.md': '../api/technical-specifications.md',
      './api-reference.md': '../api/reference.md',
      './troubleshooting.md': '../guides/troubleshooting.md',

      // 監視・セキュリティ
      './security-monitoring-best-practices.md': '../security/monitoring-best-practices.md',

      // CDK関連
      '../cdk/README.md': '../../cdk/README.md'
    };

    console.log(colors.bold('🔧 Lightning Talk Circle - 壊れたリンク自動修正ツール'));
    console.log(colors.gray(`プロジェクトルート: ${this.projectRoot}`));
    console.log('');
  }

  parseReport() {
    if (!fs.existsSync(this.reportPath)) {
      console.error(colors.red('❌ LINK-CHECK-REPORT.md が見つかりません'));
      console.log(colors.yellow('💡 先に npm run docs:check-links を実行してください'));
      process.exit(1);
    }

    const reportContent = fs.readFileSync(this.reportPath, 'utf8');
    const brokenLinks = [];

    // レポートから壊れたリンクを抽出
    const linkPattern = /### (.+?):(\d+)\n- \*\*Link text:\*\* (.+?)\n- \*\*URL:\*\* (.+?)\n/g;
    let match;

    while ((match = linkPattern.exec(reportContent)) !== null) {
      brokenLinks.push({
        file: path.join(this.projectRoot, match[1]),
        line: parseInt(match[2]),
        text: match[3],
        url: match[4]
      });
    }

    return brokenLinks;
  }

  fixLink(brokenLink) {
    const { file, url, text } = brokenLink;

    // 自動修正可能かチェック
    const fixedUrl = this.autoFixMappings[url];
    if (!fixedUrl) {
      console.log(colors.yellow(`⚠️  自動修正マッピングなし: ${url}`));
      this.skippedCount++;
      return false;
    }

    try {
      // ファイルを読み込み
      const content = fs.readFileSync(file, 'utf8');

      // リンクを置換
      const oldLink = `[${text}](${url})`;
      const newLink = `[${text}](${fixedUrl})`;

      if (!content.includes(oldLink)) {
        console.log(colors.red(`❌ リンクが見つかりません: ${oldLink} in ${file}`));
        return false;
      }

      const newContent = content.replace(oldLink, newLink);

      // ファイルを書き戻し
      fs.writeFileSync(file, newContent);

      console.log(colors.green(`✅ 修正完了: ${url} → ${fixedUrl}`));
      console.log(colors.gray(`   ファイル: ${path.relative(this.projectRoot, file)}`));

      this.fixedCount++;
      return true;
    } catch (error) {
      console.error(colors.red(`❌ エラー: ${error.message}`));
      return false;
    }
  }

  generateRedirectMap() {
    const redirects = {};

    // 自動修正マッピングをリダイレクトマップに変換
    Object.entries(this.autoFixMappings).forEach(([oldPath, newPath]) => {
      // 絶対パスに変換
      let redirectFrom = oldPath;
      if (redirectFrom.startsWith('./')) {
        redirectFrom = redirectFrom.substring(2);
      }

      redirects[redirectFrom] = newPath;
    });

    const redirectMapPath = path.join(this.projectRoot, 'docs-redirects.json');
    fs.writeFileSync(redirectMapPath, JSON.stringify(redirects, null, 2));

    console.log(colors.blue(`\n📝 リダイレクトマップを生成しました: docs-redirects.json`));
  }

  generateFixReport() {
    const timestamp = new Date().toISOString();
    const reportContent = `# 壊れたリンク修正レポート

**実行日時**: ${timestamp}
**修正数**: ${this.fixedCount}
**スキップ数**: ${this.skippedCount}

## 修正内容

${this.fixedCount > 0 ? '### 自動修正されたリンク\n' : ''}
${Object.entries(this.autoFixMappings)
  .map(([old, fixed]) => `- \`${old}\` → \`${fixed}\``)
  .join('\n')}

## 手動修正が必要なリンク

スキップされたリンクは手動で修正してください。
詳細は \`LINK-CHECK-REPORT.md\` を参照してください。

## 次のステップ

1. 手動修正が必要なリンクを確認
2. \`npm run docs:check-links\` で再検証
3. すべてのリンクが修正されたことを確認

---
自動生成: Lightning Talk Circle Link Fixer
`;

    const fixReportPath = path.join(this.projectRoot, 'LINK-FIX-REPORT.md');
    fs.writeFileSync(fixReportPath, reportContent);

    console.log(colors.blue(`\n📊 修正レポートを生成しました: LINK-FIX-REPORT.md`));
  }

  async run() {
    console.log(colors.bold('🚀 壊れたリンクの自動修正を開始...\n'));

    // レポートから壊れたリンクを取得
    const brokenLinks = this.parseReport();
    console.log(colors.blue(`📋 ${brokenLinks.length}個の壊れたリンクが見つかりました\n`));

    // 各リンクを修正
    for (const link of brokenLinks) {
      this.fixLink(link);
    }

    // リダイレクトマップを生成
    this.generateRedirectMap();

    // 修正レポートを生成
    this.generateFixReport();

    // サマリー表示
    console.log('\n' + colors.bold('📊 修正結果:'));
    console.log(`自動修正: ${colors.green(this.fixedCount + '個')}`);
    console.log(`スキップ: ${colors.yellow(this.skippedCount + '個')}`);

    if (this.skippedCount > 0) {
      console.log(colors.yellow('\n💡 手動修正が必要なリンクがあります'));
      console.log('詳細は LINK-CHECK-REPORT.md を確認してください');
    }

    if (this.fixedCount > 0) {
      console.log(colors.green('\n✅ 自動修正が完了しました！'));
      console.log('次のコマンドで検証してください: npm run docs:check-links');
    }
  }
}

// 実行
const fixer = new BrokenLinkFixer();
fixer.run().catch(error => {
  console.error(colors.red(`❌ エラーが発生しました: ${error.message}`));
  process.exit(1);
});
