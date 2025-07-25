#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple color functions
const colors = {
  blue: text => `\x1b[34m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  gray: text => `\x1b[90m${text}\x1b[0m`,
  bold: text => `\x1b[1m${text}\x1b[0m`
};

// 修正対象
const fixes = [
  {
    file: 'docs/development/onboarding-checklist.md',
    lineNumber: 144,
    oldLink: '../security/README.md',
    newLink: '../security/SECURITY-POLICY.md',
    reason: 'セキュリティドキュメントは SECURITY-POLICY.md に存在'
  },
  {
    file: 'docs/technical/wordpress/shortcodes.md',
    lineNumber: 18,
    oldLink: '../../CLAUDE.md',
    newLink: '../../../CLAUDE.md',
    reason: 'CLAUDE.md はプロジェクトルートに存在（パスレベルが1つ不足）'
  }
];

console.log(colors.bold('🔧 最終リンク修正スクリプト'));
console.log(colors.gray('='.repeat(60)));

let successCount = 0;
let errorCount = 0;

fixes.forEach(fix => {
  const filePath = path.join(process.cwd(), fix.file);

  try {
    // ファイルを読み込む
    let content = fs.readFileSync(filePath, 'utf8');

    // リンクを修正
    if (content.includes(fix.oldLink)) {
      content = content.replace(fix.oldLink, fix.newLink);

      // ファイルを書き戻す
      fs.writeFileSync(filePath, content);

      console.log(colors.green('✓') + ` ${fix.file}:${fix.lineNumber}`);
      console.log(colors.gray(`  ${fix.oldLink} → ${fix.newLink}`));
      console.log(colors.gray(`  理由: ${fix.reason}`));
      successCount++;
    } else {
      console.log(colors.yellow('⚠') + ` ${fix.file}:${fix.lineNumber} - リンクが見つかりません`);
      errorCount++;
    }
  } catch (error) {
    console.log(colors.red('✗') + ` ${fix.file}: ${error.message}`);
    errorCount++;
  }
});

console.log(colors.gray('='.repeat(60)));
console.log(
  colors.bold(
    `📊 修正結果: ${colors.green(successCount + '個')}成功, ${colors.red(errorCount + '個')}失敗`
  )
);

// セキュリティREADME.mdも作成（念のため）
const securityReadmePath = path.join(process.cwd(), 'docs/security/README.md');
if (!fs.existsSync(securityReadmePath)) {
  const securityReadmeContent = `# セキュリティドキュメント

## 概要

Lightning Talk Circle のセキュリティ関連ドキュメントです。

## ドキュメント一覧

- [セキュリティポリシー](./SECURITY-POLICY.md) - プロジェクトのセキュリティポリシー
- [API セキュリティガイド](./API-SECURITY-GUIDE.md) - API セキュリティのベストプラクティス
- [インシデント対応](./INCIDENT-RESPONSE.md) - セキュリティインシデント対応手順
- [レート制限ガイド](./RATE-LIMITING-GUIDE.md) - レート制限の実装と設定
- [セキュリティ監査レポート](./SECURITY-AUDIT-PHASE1-5.md) - セキュリティ監査の結果

## 関連ドキュメント

- [プロジェクト概要](../../README.md)
- [CLAUDE.md](../../CLAUDE.md)
`;

  fs.writeFileSync(securityReadmePath, securityReadmeContent);
  console.log(colors.green('\n✓ セキュリティREADME.mdも作成しました'));
}

console.log(colors.blue('\n次のステップ: npm run docs:check-links で修正を確認してください'));
