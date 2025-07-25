#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple color functions
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// 修正対象のマッピング
const linkFixes = [
  // docs-new/legacy/project/ 内のファイルから technical への参照
  {
    pattern: /\.\.\/technical\//g,
    replacement: '../../../docs/technical/',
    files: [
      'docs-new/legacy/project/MODERN-WP-THEME-MASTER-PLAN.md',
      'docs-new/legacy/project/initial-issues.md'
    ]
  },
  // docs-new/legacy/project/ 内のファイルから development への参照
  {
    pattern: /\.\.\/development\//g,
    replacement: '../../../docs/development/',
    files: [
      'docs-new/legacy/project/MODERN-WP-THEME-MASTER-PLAN.md'
    ]
  },
  // プレースホルダーファイルからルートへの参照
  {
    pattern: /\.\.\/\.\.\/README\.md/g,
    replacement: '../../../README.md',
    files: [
      'docs-new/legacy/project/issue-creation-plan.md',
      'docs-new/legacy/project/issue-creation-process.md',
      'docs-new/legacy/project/issue-creation-tutorial.md'
    ]
  },
  {
    pattern: /\.\.\/\.\.\/CLAUDE\.md/g,
    replacement: '../../../CLAUDE.md',
    files: [
      'docs-new/legacy/project/issue-creation-plan.md',
      'docs-new/legacy/project/issue-creation-process.md',
      'docs-new/legacy/project/issue-creation-tutorial.md'
    ]
  },
  // quick-start/00-overview.md の相対パス修正
  {
    pattern: /docs\/project\/issue-execution-guide\.md/g,
    replacement: '../legacy/project/issue-execution-guide.md',
    files: ['docs-new/quick-start/00-overview.md']
  },
  {
    pattern: /docs\/project\/issue-creation-tutorial\.md/g,
    replacement: '../legacy/project/issue-creation-tutorial.md',
    files: ['docs-new/quick-start/00-overview.md']
  }
];

console.log(colors.bold('🔧 移行後リンク修正スクリプト'));
console.log(colors.gray('=' .repeat(60)));

let totalFixed = 0;
let totalErrors = 0;

linkFixes.forEach(fix => {
  fix.files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(colors.yellow(`⚠️  ファイルが見つかりません: ${file}`));
        totalErrors++;
        return;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // パターンを適用
      content = content.replace(fix.pattern, fix.replacement);
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        const matches = originalContent.match(fix.pattern);
        const count = matches ? matches.length : 0;
        console.log(colors.green('✓') + ` ${file} - ${count}個のリンクを修正`);
        totalFixed += count;
      } else {
        console.log(colors.gray(`○ ${file} - 修正対象なし`));
      }
    } catch (error) {
      console.log(colors.red('✗') + ` ${file}: ${error.message}`);
      totalErrors++;
    }
  });
});

console.log(colors.gray('=' .repeat(60)));
console.log(colors.bold(`📊 修正結果: ${colors.green(totalFixed + '個')}のリンクを修正, ${colors.red(totalErrors + '個')}のエラー`));
console.log(colors.blue('\n次のステップ: npm run docs:check-links で修正を確認してください'));