#!/usr/bin/env node

/**
 * 品質ゲートワークフロー統合スクリプト
 * CI/CDパイプラインでの品質チェックとリリース判定
 */

import fs from 'fs/promises';
import { execSync } from 'child_process';

class QualityWorkflowIntegration {
  constructor() {
    this.config = {
      coverageThreshold: 80,
      maxCriticalIssues: 0,
      maxHighIssues: 5,
      maxMediumIssues: 20,
      requiredChecks: ['tests', 'linting', 'security', 'coverage', 'build']
    };

    this.results = {
      overall: false,
      checks: {},
      metrics: {},
      issues: []
    };
  }

  async runQualityChecks() {
    console.log('🔍 品質ゲートチェックを開始します...\n');

    try {
      // 1. テスト実行
      await this.runTests();

      // 2. リンティング
      await this.runLinting();

      // 3. セキュリティ監査
      await this.runSecurityAudit();

      // 4. カバレッジチェック
      await this.checkCoverage();

      // 5. ビルドテスト
      await this.runBuildTest();

      // 6. 総合評価
      this.evaluateOverall();

      // 7. レポート生成
      await this.generateReport();

      return this.results;
    } catch (error) {
      console.error('❌ 品質ゲートエラー:', error.message);
      this.results.overall = false;
      return this.results;
    }
  }

  async runTests() {
    console.log('🧪 テストを実行中...');

    try {
      // ユニットテスト
      const unitResult = this.execCommand('npm run test:unit', { allowFailure: true });
      this.results.checks.unitTests = unitResult.success;

      // 統合テスト
      const integrationResult = this.execCommand('npm run test:integration', {
        allowFailure: true
      });
      this.results.checks.integrationTests = integrationResult.success;

      console.log(`  ✅ ユニットテスト: ${unitResult.success ? 'PASS' : 'FAIL'}`);
      console.log(`  ✅ 統合テスト: ${integrationResult.success ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.log('  ❌ テスト実行エラー');
      this.results.checks.unitTests = false;
      this.results.checks.integrationTests = false;
    }
  }

  async runLinting() {
    console.log('🔧 コード品質チェック中...');

    try {
      const lintResult = this.execCommand('npm run lint', { allowFailure: true });
      this.results.checks.linting = lintResult.success;

      const formatResult = this.execCommand('npm run format:check', { allowFailure: true });
      this.results.checks.formatting = formatResult.success;

      console.log(`  ✅ ESLint: ${lintResult.success ? 'PASS' : 'FAIL'}`);
      console.log(`  ✅ Prettier: ${formatResult.success ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.log('  ❌ リンティングエラー');
      this.results.checks.linting = false;
      this.results.checks.formatting = false;
    }
  }

  async runSecurityAudit() {
    console.log('🔒 セキュリティ監査中...');

    try {
      const auditResult = this.execCommand('npm audit --audit-level=high', { allowFailure: true });
      this.results.checks.security = auditResult.success;

      // セキュリティ問題の詳細を解析
      if (!auditResult.success) {
        const auditOutput = this.execCommand('npm audit --json', {
          allowFailure: true,
          silent: true
        });
        if (auditOutput.success) {
          try {
            const auditData = JSON.parse(auditOutput.output);
            this.results.metrics.securityVulnerabilities = {
              critical: auditData.metadata?.vulnerabilities?.critical || 0,
              high: auditData.metadata?.vulnerabilities?.high || 0,
              moderate: auditData.metadata?.vulnerabilities?.moderate || 0,
              low: auditData.metadata?.vulnerabilities?.low || 0
            };
          } catch (parseError) {
            console.log('  ⚠️  監査結果の解析に失敗');
          }
        }
      }

      console.log(`  ✅ セキュリティ監査: ${auditResult.success ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.log('  ❌ セキュリティ監査エラー');
      this.results.checks.security = false;
    }
  }

  async checkCoverage() {
    console.log('📊 カバレッジチェック中...');

    try {
      // カバレッジ情報を取得
      const coverageFile = 'coverage/coverage-summary.json';

      try {
        const coverageData = JSON.parse(await fs.readFile(coverageFile, 'utf-8'));
        const lineCoverage = coverageData.total?.lines?.pct || 0;

        this.results.metrics.coverage = {
          lines: lineCoverage,
          statements: coverageData.total?.statements?.pct || 0,
          functions: coverageData.total?.functions?.pct || 0,
          branches: coverageData.total?.branches?.pct || 0
        };

        this.results.checks.coverage = lineCoverage >= this.config.coverageThreshold;

        console.log(
          `  ✅ ライン カバレッジ: ${lineCoverage.toFixed(1)}% (閾値: ${this.config.coverageThreshold}%)`
        );
        console.log(`  ✅ カバレッジチェック: ${this.results.checks.coverage ? 'PASS' : 'FAIL'}`);
      } catch (fileError) {
        console.log('  ⚠️  カバレッジファイルが見つかりません');
        this.results.checks.coverage = false;
      }
    } catch (error) {
      console.log('  ❌ カバレッジチェックエラー');
      this.results.checks.coverage = false;
    }
  }

  async runBuildTest() {
    console.log('🏗️  ビルドテスト中...');

    try {
      const buildResult = this.execCommand('npm run build:theme', { allowFailure: true });
      this.results.checks.build = buildResult.success;

      console.log(`  ✅ テーマビルド: ${buildResult.success ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.log('  ❌ ビルドテストエラー');
      this.results.checks.build = false;
    }
  }

  evaluateOverall() {
    console.log('\n📋 総合評価中...');

    // 必須チェックの結果を確認
    const requiredPassed = this.config.requiredChecks.every(check => {
      const passed = this.results.checks[check] !== false;
      if (!passed) {
        this.results.issues.push(`必須チェック失敗: ${check}`);
      }
      return passed;
    });

    // カバレッジチェック
    const coveragePassed = this.results.checks.coverage !== false;
    if (!coveragePassed) {
      this.results.issues.push(
        `カバレッジが閾値を下回っています: ${this.results.metrics.coverage?.lines || 0}% < ${this.config.coverageThreshold}%`
      );
    }

    // セキュリティ問題チェック
    const securityPassed = this.checkSecurityIssues();

    this.results.overall = requiredPassed && coveragePassed && securityPassed;

    console.log(`📊 総合結果: ${this.results.overall ? '✅ PASS' : '❌ FAIL'}`);

    if (this.results.issues.length > 0) {
      console.log('\n⚠️  問題点:');
      this.results.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  }

  checkSecurityIssues() {
    const vulns = this.results.metrics.securityVulnerabilities;
    if (!vulns) {
      return true;
    }

    const criticalIssues = vulns.critical > this.config.maxCriticalIssues;
    const highIssues = vulns.high > this.config.maxHighIssues;
    const mediumIssues = vulns.moderate > this.config.maxMediumIssues;

    if (criticalIssues) {
      this.results.issues.push(
        `重大なセキュリティ問題: ${vulns.critical}件 (許可: ${this.config.maxCriticalIssues}件)`
      );
    }
    if (highIssues) {
      this.results.issues.push(
        `高レベルセキュリティ問題: ${vulns.high}件 (許可: ${this.config.maxHighIssues}件)`
      );
    }
    if (mediumIssues) {
      this.results.issues.push(
        `中レベルセキュリティ問題: ${vulns.moderate}件 (許可: ${this.config.maxMediumIssues}件)`
      );
    }

    return !criticalIssues && !highIssues && !mediumIssues;
  }

  async generateReport() {
    console.log('\n📄 レポート生成中...');

    const report = {
      timestamp: new Date().toISOString(),
      overall: this.results.overall,
      checks: this.results.checks,
      metrics: this.results.metrics,
      issues: this.results.issues,
      config: this.config,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    // JSON レポート
    const reportPath = 'quality-gate-results.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // マークダウンレポート
    const mdReport = this.generateMarkdownReport(report);
    await fs.writeFile('quality-gate-report.md', mdReport);

    console.log(`📊 レポート保存: ${reportPath}`);
    console.log('📝 マークダウン: quality-gate-report.md');
  }

  generateMarkdownReport(report) {
    const checkStatus = status => (status ? '✅ PASS' : '❌ FAIL');
    const timestamp = new Date(report.timestamp).toLocaleString('ja-JP');

    return `# 品質ゲートレポート

**実行日時**: ${timestamp}  
**総合結果**: ${report.overall ? '✅ PASS' : '❌ FAIL'}

## チェック結果

| 項目 | 結果 |
|------|------|
| ユニットテスト | ${checkStatus(report.checks.unitTests)} |
| 統合テスト | ${checkStatus(report.checks.integrationTests)} |
| リンティング | ${checkStatus(report.checks.linting)} |
| フォーマット | ${checkStatus(report.checks.formatting)} |
| セキュリティ | ${checkStatus(report.checks.security)} |
| カバレッジ | ${checkStatus(report.checks.coverage)} |
| ビルド | ${checkStatus(report.checks.build)} |

## メトリクス

### カバレッジ
${
  report.metrics.coverage
    ? `
- **ライン**: ${report.metrics.coverage.lines}%
- **ステートメント**: ${report.metrics.coverage.statements}%
- **関数**: ${report.metrics.coverage.functions}%
- **ブランチ**: ${report.metrics.coverage.branches}%
`
    : '情報なし'
}

### セキュリティ
${
  report.metrics.securityVulnerabilities
    ? `
- **重大**: ${report.metrics.securityVulnerabilities.critical}件
- **高**: ${report.metrics.securityVulnerabilities.high}件
- **中**: ${report.metrics.securityVulnerabilities.moderate}件
- **低**: ${report.metrics.securityVulnerabilities.low}件
`
    : '問題なし'
}

## 問題点

${
  report.issues.length > 0
    ? report.issues.map(issue => `- ${issue}`).join('\n')
    : '問題はありません'
}

## 設定

- **カバレッジ閾値**: ${report.config.coverageThreshold}%
- **最大重大問題**: ${report.config.maxCriticalIssues}件
- **最大高レベル問題**: ${report.config.maxHighIssues}件
- **最大中レベル問題**: ${report.config.maxMediumIssues}件

---
*Generated by Quality Workflow Integration*
`;
  }

  execCommand(command, options = {}) {
    const { allowFailure = false, silent = false } = options;

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: silent ? 'pipe' : 'inherit'
      });

      return { success: true, output };
    } catch (error) {
      if (allowFailure) {
        return { success: false, error: error.message, output: error.stdout || '' };
      }
      throw error;
    }
  }
}

// CLI実行
async function main() {
  const integration = new QualityWorkflowIntegration();

  try {
    const results = await integration.runQualityChecks();

    // CI/CD環境での終了コード設定
    if (process.env.CI) {
      process.exit(results.overall ? 0 : 1);
    }

    return results;
  } catch (error) {
    console.error('品質ワークフロー統合エラー:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default QualityWorkflowIntegration;
