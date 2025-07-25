#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Simple color functions
const colors = {
  blue: text => `\x1b[34m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  gray: text => `\x1b[90m${text}\x1b[0m`,
  bold: text => `\x1b[1m${text}\x1b[0m`
};

class DuplicateFinder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.duplicates = [];
    this.emptyDirs = [];
    this.placeholders = [];
  }

  getFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  isPlaceholder(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('このドキュメントはプレースホルダーです');
    } catch (error) {
      return false;
    }
  }

  findDuplicates() {
    console.log(colors.bold('🔍 重複ファイル検索ツール'));
    console.log(colors.gray('='.repeat(60)));

    // 既知の重複ファイル
    const knownDuplicates = [
      {
        original: 'CLAUDE.md',
        duplicates: [
          'docs/project/CLAUDE.md',
          'docs-new/development/claude-instructions.md',
          'docs-new/legacy/project/CLAUDE.md'
        ]
      },
      {
        original: 'docs/api/reference.md',
        duplicates: ['docs-new/api/reference.md']
      }
    ];

    // プロジェクト固有のファイルを収集
    const projectFiles = ['docs/project/*.md', 'docs-new/legacy/project/*.md'];

    // ファイルハッシュマップを作成
    const fileHashes = new Map();

    console.log(colors.blue('\n📊 ファイル分析中...'));

    // 既知の重複をチェック
    knownDuplicates.forEach(dup => {
      const originalPath = path.join(this.projectRoot, dup.original);
      if (fs.existsSync(originalPath)) {
        const originalHash = this.getFileHash(originalPath);

        dup.duplicates.forEach(dupPath => {
          const fullDupPath = path.join(this.projectRoot, dupPath);
          if (fs.existsSync(fullDupPath)) {
            const dupHash = this.getFileHash(fullDupPath);
            if (originalHash === dupHash) {
              this.duplicates.push({
                original: dup.original,
                duplicate: dupPath,
                type: 'exact'
              });
            }
          }
        });
      }
    });

    // プレースホルダーファイルを検出
    const checkPlaceholders = dir => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          checkPlaceholders(fullPath);
        } else if (item.endsWith('.md') && this.isPlaceholder(fullPath)) {
          const relativePath = path.relative(this.projectRoot, fullPath);
          this.placeholders.push(relativePath);
        }
      });
    };

    checkPlaceholders(path.join(this.projectRoot, 'docs'));
    checkPlaceholders(path.join(this.projectRoot, 'docs-new'));

    // 空のディレクトリを検出
    const checkEmptyDirs = dir => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      if (items.length === 0) {
        const relativePath = path.relative(this.projectRoot, dir);
        this.emptyDirs.push(relativePath);
        return;
      }

      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          checkEmptyDirs(fullPath);
        }
      });
    };

    checkEmptyDirs(path.join(this.projectRoot, 'docs'));
    checkEmptyDirs(path.join(this.projectRoot, 'docs-new'));
  }

  generateReport() {
    console.log(colors.bold('\n📋 重複ファイルレポート'));
    console.log(colors.gray('='.repeat(60)));

    if (this.duplicates.length > 0) {
      console.log(colors.yellow('\n⚠️  重複ファイル:'));
      this.duplicates.forEach(dup => {
        console.log(`  ${colors.gray(dup.original)} → ${colors.red(dup.duplicate)}`);
      });
    } else {
      console.log(colors.green('\n✓ 重複ファイルは見つかりませんでした'));
    }

    if (this.placeholders.length > 0) {
      console.log(colors.yellow(`\n📝 プレースホルダーファイル (${this.placeholders.length}個):`));
      this.placeholders.forEach(file => {
        console.log(`  ${colors.gray(file)}`);
      });
    }

    if (this.emptyDirs.length > 0) {
      console.log(colors.yellow(`\n📁 空のディレクトリ (${this.emptyDirs.length}個):`));
      this.emptyDirs.forEach(dir => {
        console.log(`  ${colors.gray(dir)}`);
      });
    }

    // クリーンアップスクリプトを生成
    const cleanupScript = `#!/bin/bash
# 重複ファイルクリーンアップスクリプト
# 生成日: ${new Date().toISOString()}

echo "🧹 クリーンアップを開始します..."

# 重複ファイルの削除
${this.duplicates.map(dup => `rm -f "${dup.duplicate}"`).join('\n')}

# 空ディレクトリの削除
${this.emptyDirs.map(dir => `rmdir "${dir}" 2>/dev/null`).join('\n')}

echo "✅ クリーンアップ完了"
`;

    const scriptPath = path.join(this.projectRoot, 'scripts/cleanup-duplicates.sh');
    fs.writeFileSync(scriptPath, cleanupScript);
    fs.chmodSync(scriptPath, '755');

    console.log(colors.gray('\n' + '='.repeat(60)));
    console.log(colors.bold('📊 サマリー:'));
    console.log(`  重複ファイル: ${colors.red(this.duplicates.length + '個')}`);
    console.log(`  プレースホルダー: ${colors.yellow(this.placeholders.length + '個')}`);
    console.log(`  空ディレクトリ: ${colors.yellow(this.emptyDirs.length + '個')}`);
    console.log(colors.blue(`\nクリーンアップスクリプト: scripts/cleanup-duplicates.sh`));
    console.log(colors.gray('実行前に内容を確認してください'));
  }
}

// 実行
const finder = new DuplicateFinder();
finder.findDuplicates();
finder.generateReport();
