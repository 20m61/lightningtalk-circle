#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple color functions
const colors = {
  blue: text => `\x1b[34m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  gray: text => `\x1b[90m${text}\x1b[0m`,
  bold: text => `\x1b[1m${text}\x1b[0m`
};

class PlaceholderCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.docsDir = path.join(this.projectRoot, 'docs');
    this.createdCount = 0;

    console.log(colors.bold('📝 Lightning Talk Circle - プレースホルダードキュメント作成ツール'));
    console.log(colors.gray(`プロジェクトルート: ${this.projectRoot}`));
    console.log('');
  }

  createPlaceholder(filePath, title, description) {
    const fullPath = path.join(this.projectRoot, filePath);
    const dir = path.dirname(fullPath);

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(colors.gray(`📁 ディレクトリ作成: ${dir}`));
    }

    // ファイルが既に存在する場合はスキップ
    if (fs.existsSync(fullPath)) {
      console.log(colors.yellow(`⏭️  既存: ${filePath}`));
      return;
    }

    const content = `# ${title}

> 📝 このドキュメントはプレースホルダーです。実際の内容は今後追加される予定です。

## 概要

${description}

## 状態

- **作成日**: ${new Date().toISOString().split('T')[0]}
- **ステータス**: 🚧 作成予定
- **優先度**: 中

## 関連ドキュメント

- [プロジェクト概要](../../README.md)
- [CLAUDE.md](../../CLAUDE.md)

---
*このファイルは自動生成されたプレースホルダーです。*
`;

    fs.writeFileSync(fullPath, content);
    console.log(colors.green(`✅ 作成: ${filePath}`));
    this.createdCount++;
  }

  async createAllPlaceholders() {
    console.log(colors.bold('🚀 プレースホルダーファイルの作成を開始...\n'));

    // セキュリティ関連
    this.createPlaceholder(
      'docs/security/INCIDENT-RESPONSE.md',
      'インシデント対応手順',
      'セキュリティインシデント発生時の対応手順と連絡先をまとめたドキュメントです。'
    );

    this.createPlaceholder(
      'docs/security/SECURITY-POLICY.md',
      'セキュリティポリシー',
      'Lightning Talk Circleプロジェクトのセキュリティポリシーと基準を定義します。'
    );

    this.createPlaceholder(
      'docs/security/monitoring-best-practices.md',
      'セキュリティ監視ベストプラクティス',
      'システムのセキュリティ監視に関するベストプラクティスをまとめます。'
    );

    // 監視関連
    this.createPlaceholder(
      'docs/monitoring/MONITORING-SETUP.md',
      '監視ダッシュボード設定',
      'CloudWatchやその他の監視ツールの設定手順を説明します。'
    );

    // ガイド関連
    this.createPlaceholder(
      'docs/guides/DEVELOPER-GUIDE.md',
      '開発者ガイド',
      'Lightning Talk Circle開発者向けの包括的なガイドです。'
    );

    this.createPlaceholder(
      'docs/guides/wordpress-development-guide.md',
      'WordPress開発ガイド',
      'WordPressテーマ開発に関する詳細なガイドです。'
    );

    this.createPlaceholder(
      'docs/guides/ENVIRONMENT-GUIDE.md',
      '環境設定ガイド',
      '開発、ステージング、本番環境の設定方法を説明します。'
    );

    this.createPlaceholder(
      'docs/guides/customization.md',
      'カスタマイズガイド',
      'システムのカスタマイズ方法について説明します。'
    );

    this.createPlaceholder(
      'docs/guides/troubleshooting.md',
      'トラブルシューティングガイド',
      '一般的な問題と解決方法をまとめたガイドです。'
    );

    this.createPlaceholder(
      'docs/guides/environment-variables.md',
      '環境変数リファレンス',
      'すべての環境変数の説明と設定例を提供します。'
    );

    // 技術文書
    this.createPlaceholder(
      'docs/technical/wordpress/shortcodes.md',
      'WordPressショートコードリファレンス',
      'カスタムショートコードの使用方法と実装詳細です。'
    );

    this.createPlaceholder(
      'docs/technical/ci-cd.md',
      'CI/CDプラクティス',
      '継続的インテグレーション・デプロイメントのベストプラクティスです。'
    );

    this.createPlaceholder(
      'docs/technical/documentation-guidelines.md',
      'ドキュメントガイドライン',
      'ドキュメント作成の標準とガイドラインです。'
    );

    this.createPlaceholder(
      'docs/technical/technical-specifications.md',
      '技術仕様書',
      'システムの技術仕様と要件定義です。'
    );

    // API文書
    this.createPlaceholder(
      'docs/api/reference.md',
      'APIリファレンス',
      'REST APIの完全なリファレンスドキュメントです。'
    );

    // プロジェクト関連
    this.createPlaceholder(
      'docs/project/issue-creation-plan.md',
      'イシュー作成計画',
      'GitHubイシューの作成と管理に関する計画書です。'
    );

    this.createPlaceholder(
      'docs/project/issue-creation-process.md',
      'イシュー作成プロセス',
      'イシュー作成の標準プロセスを定義します。'
    );

    this.createPlaceholder(
      'docs/project/issue-creation-tutorial.md',
      'イシュー作成チュートリアル',
      '新規開発者向けのイシュー作成チュートリアルです。'
    );

    // ルートレベル
    this.createPlaceholder(
      'CONTRIBUTING.md',
      'コントリビューションガイド',
      'プロジェクトへの貢献方法を説明するガイドです。'
    );

    this.createPlaceholder(
      'ENVIRONMENT-GUIDE.md',
      '環境ガイド',
      '環境設定の概要とクイックスタートガイドです。'
    );

    console.log(
      colors.bold(
        `\n📊 作成結果: ${colors.green(`${this.createdCount}個`)}のプレースホルダーファイルを作成しました`
      )
    );
    console.log(colors.blue('\n💡 次のステップ:'));
    console.log('1. npm run docs:check-links で再検証');
    console.log('2. 必要に応じて実際のコンテンツを追加');
  }
}

// 実行
const creator = new PlaceholderCreator();
creator.createAllPlaceholders().catch(error => {
  console.error(colors.red(`❌ エラーが発生しました: ${error.message}`));
  process.exit(1);
});
