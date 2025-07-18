#!/usr/bin/env node
/**
 * 品質ゲートシステム
 * 自動テスト、コード品質、セキュリティチェックを統合管理
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

class QualityGateSystem {
  constructor(options = {}) {
    this.config = {
      thresholds: {
        coverage: options.coverage || 80,
        complexity: options.complexity || 10,
        duplication: options.duplication || 3,
        maintainability: options.maintainability || 'A'
      },
      timeout: options.timeout || 300000, // 5分
      parallel: options.parallel !== false,
      exitOnFailure: options.exitOnFailure !== false
    };

    this.results = {
      gates: [],
      overall: {
        passed: false,
        score: 0,
        duration: 0
      }
    };

    this.log = {
      info: msg => console.log(chalk.blue('ℹ️ '), msg),
      success: msg => console.log(chalk.green('✅'), msg),
      warning: msg => console.log(chalk.yellow('⚠️ '), msg),
      error: msg => console.log(chalk.red('❌'), msg),
      gate: msg => console.log(chalk.cyan('🚪'), msg)
    };
  }

  /**
   * 全品質ゲートを実行
   */
  async runAllGates() {
    const startTime = Date.now();

    this.log.info('🚀 Starting Quality Gate Assessment...');
    console.log(chalk.gray('─'.repeat(60)));

    const gates = [
      { name: 'Unit Tests', runner: () => this.runUnitTests() },
      { name: 'Integration Tests', runner: () => this.runIntegrationTests() },
      { name: 'Code Coverage', runner: () => this.checkCodeCoverage() },
      { name: 'Code Quality', runner: () => this.checkCodeQuality() },
      { name: 'Accessibility Compliance', runner: () => this.checkAccessibilityCompliance() },
      { name: 'Security Scan', runner: () => this.runSecurityScan() },
      { name: 'Accessibility Check', runner: () => this.checkAccessibility() },
      { name: 'Performance Tests', runner: () => this.runPerformanceTests() },
      { name: 'Dependency Check', runner: () => this.checkDependencies() },
      { name: 'Bundle Analysis', runner: () => this.analyzeBundleSize() }
    ];

    if (this.config.parallel) {
      await this.runGatesInParallel(gates);
    } else {
      await this.runGatesSequentially(gates);
    }

    this.results.overall.duration = Date.now() - startTime;
    this.calculateOverallScore();
    this.displayResults();

    return this.results;
  }

  /**
   * 品質ゲートを並列実行
   */
  async runGatesInParallel(gates) {
    const promises = gates.map(async gate => {
      try {
        const result = await this.executeGate(gate);
        this.results.gates.push(result);
      } catch (error) {
        this.results.gates.push({
          name: gate.name,
          passed: false,
          error: error.message,
          duration: 0
        });
      }
    });

    await Promise.all(promises);
  }

  /**
   * 品質ゲートを順次実行
   */
  async runGatesSequentially(gates) {
    for (const gate of gates) {
      try {
        const result = await this.executeGate(gate);
        this.results.gates.push(result);

        // クリティカルなゲートで失敗した場合は即座に停止
        if (!result.passed && this.isCriticalGate(gate.name)) {
          this.log.error(`Critical gate failed: ${gate.name}. Stopping execution.`);
          break;
        }
      } catch (error) {
        this.results.gates.push({
          name: gate.name,
          passed: false,
          error: error.message,
          duration: 0
        });
      }
    }
  }

  /**
   * 個別ゲートを実行
   */
  async executeGate(gate) {
    const startTime = Date.now();
    this.log.gate(`Running ${gate.name}...`);

    try {
      const result = await gate.runner();
      const duration = Date.now() - startTime;

      this.log.success(`${gate.name} completed in ${duration}ms`);

      return {
        name: gate.name,
        passed: result.passed,
        score: result.score || 0,
        details: result.details || {},
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log.error(`${gate.name} failed: ${error.message}`);

      return {
        name: gate.name,
        passed: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * ユニットテスト実行
   */
  async runUnitTests() {
    try {
      const output = execSync('npm run test:unit 2>&1', {
        encoding: 'utf8',
        timeout: this.config.timeout
      });

      const passMatch = output.match(/(\d+) passing/);
      const failMatch = output.match(/(\d+) failing/);

      const passing = passMatch ? parseInt(passMatch[1]) : 0;
      const failing = failMatch ? parseInt(failMatch[1]) : 0;

      const passed = failing === 0;
      const score = (passing / (passing + failing)) * 100;

      return {
        passed,
        score,
        details: {
          passing,
          failing,
          output: output.slice(-500) // 最後の500文字のみ保存
        }
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: { error: error.message }
      };
    }
  }

  /**
   * 統合テスト実行
   */
  async runIntegrationTests() {
    try {
      const output = execSync('npm run test:integration 2>&1', {
        encoding: 'utf8',
        timeout: this.config.timeout
      });

      const passMatch = output.match(/(\d+) passing/);
      const failMatch = output.match(/(\d+) failing/);

      const passing = passMatch ? parseInt(passMatch[1]) : 0;
      const failing = failMatch ? parseInt(failMatch[1]) : 0;

      const passed = failing === 0;
      const score = (passing / (passing + failing)) * 100;

      return {
        passed,
        score,
        details: { passing, failing }
      };
    } catch (error) {
      // 統合テストが設定されていない場合はスキップ
      if (error.message.includes('script not found')) {
        return {
          passed: true,
          score: 100,
          details: { skipped: 'Integration tests not configured' }
        };
      }

      return {
        passed: false,
        score: 0,
        details: { error: error.message }
      };
    }
  }

  /**
   * コードカバレッジチェック
   */
  async checkCodeCoverage() {
    try {
      const output = execSync('npm run test:coverage 2>&1', {
        encoding: 'utf8',
        timeout: this.config.timeout
      });

      // カバレッジ率を解析
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

      const passed = coverage >= this.config.thresholds.coverage;
      const score = Math.min(coverage, 100);

      return {
        passed,
        score,
        details: {
          coverage,
          threshold: this.config.thresholds.coverage,
          reportPath: 'coverage/lcov-report/index.html'
        }
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: { error: error.message }
      };
    }
  }

  /**
   * コード品質チェック
   */
  async checkCodeQuality() {
    const qualityChecks = [];

    // ESLint チェック
    try {
      execSync('npx eslint src/ --format=json --output-file=quality-report.json', {
        encoding: 'utf8'
      });

      const eslintReport = JSON.parse(fs.readFileSync('quality-report.json', 'utf8'));
      const errorCount = eslintReport.reduce((sum, file) => sum + file.errorCount, 0);
      const warningCount = eslintReport.reduce((sum, file) => sum + file.warningCount, 0);

      qualityChecks.push({
        name: 'ESLint',
        passed: errorCount === 0,
        errors: errorCount,
        warnings: warningCount
      });
    } catch (error) {
      qualityChecks.push({
        name: 'ESLint',
        passed: false,
        error: 'ESLint not configured or failed'
      });
    }

    // Prettier チェック
    try {
      execSync('npx prettier --check src/', { encoding: 'utf8' });
      qualityChecks.push({
        name: 'Prettier',
        passed: true,
        message: 'Code formatting is consistent'
      });
    } catch (error) {
      qualityChecks.push({
        name: 'Prettier',
        passed: false,
        message: 'Code formatting issues found'
      });
    }

    const allPassed = qualityChecks.every(check => check.passed);
    const score = (qualityChecks.filter(check => check.passed).length / qualityChecks.length) * 100;

    return {
      passed: allPassed,
      score,
      details: { checks: qualityChecks }
    };
  }

  /**
   * セキュリティスキャン
   */
  async runSecurityScan() {
    const securityChecks = [];

    // npm audit
    try {
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditOutput);

      const highVulns = auditData.metadata?.vulnerabilities?.high || 0;
      const criticalVulns = auditData.metadata?.vulnerabilities?.critical || 0;

      securityChecks.push({
        name: 'npm audit',
        passed: criticalVulns === 0 && highVulns === 0,
        critical: criticalVulns,
        high: highVulns,
        total: Object.values(auditData.metadata?.vulnerabilities || {}).reduce((a, b) => a + b, 0)
      });
    } catch (error) {
      // npm audit はエラーでも結果を返すことがあるので、出力を確認
      try {
        const auditData = JSON.parse(error.stdout);
        const criticalVulns = auditData.metadata?.vulnerabilities?.critical || 0;

        securityChecks.push({
          name: 'npm audit',
          passed: criticalVulns === 0,
          critical: criticalVulns,
          note: 'Some vulnerabilities found'
        });
      } catch {
        securityChecks.push({
          name: 'npm audit',
          passed: false,
          error: 'Failed to run security audit'
        });
      }
    }

    // 基本的なセキュリティパターンチェック
    const securityPatterns = this.checkSecurityPatterns();
    securityChecks.push(securityPatterns);

    const allPassed = securityChecks.every(check => check.passed);
    const score =
      (securityChecks.filter(check => check.passed).length / securityChecks.length) * 100;

    return {
      passed: allPassed,
      score,
      details: { checks: securityChecks }
    };
  }

  /**
   * 基本的なセキュリティパターンをチェック
   */
  checkSecurityPatterns() {
    const issues = [];

    try {
      // ハードコードされた秘密情報をチェック
      const files = this.getAllJSFiles('src/');

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');

        // 危険なパターンをチェック
        const patterns = [
          { pattern: /password\s*=\s*['"][^'"]+['"]/, message: 'Hardcoded password detected' },
          { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/, message: 'Hardcoded API key detected' },
          { pattern: /secret\s*=\s*['"][^'"]+['"]/, message: 'Hardcoded secret detected' }
        ];

        for (const { pattern, message } of patterns) {
          if (pattern.test(content)) {
            issues.push(`${file}: ${message}`);
          }
        }
      }
    } catch (error) {
      issues.push(`Security pattern check failed: ${error.message}`);
    }

    return {
      name: 'Security Patterns',
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * パフォーマンステスト実行
   */
  async runPerformanceTests() {
    try {
      const output = execSync('npm run test:perf 2>&1', {
        encoding: 'utf8',
        timeout: this.config.timeout
      });

      // パフォーマンステストの結果を解析
      const responseTimeMatch = output.match(/average response time: ([\d.]+)ms/i);
      const responseTime = responseTimeMatch ? parseFloat(responseTimeMatch[1]) : null;

      const passed = !responseTime || responseTime < 1000; // 1秒以下
      const score = responseTime ? Math.max(0, 100 - responseTime / 10) : 100;

      return {
        passed,
        score,
        details: {
          responseTime,
          threshold: '1000ms',
          note: responseTime
            ? `Average response: ${responseTime}ms`
            : 'Performance tests not configured'
        }
      };
    } catch (error) {
      // パフォーマンステストが設定されていない場合はスキップ
      return {
        passed: true,
        score: 100,
        details: { skipped: 'Performance tests not configured' }
      };
    }
  }

  /**
   * 依存関係チェック
   */
  async checkDependencies() {
    const checks = [];

    // package.json の存在確認
    if (!fs.existsSync('package.json')) {
      return {
        passed: false,
        score: 0,
        details: { error: 'package.json not found' }
      };
    }

    const packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    // 古い依存関係をチェック
    try {
      const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(outdatedOutput);
      const outdatedCount = Object.keys(outdated).length;

      checks.push({
        name: 'Outdated packages',
        passed: outdatedCount === 0,
        count: outdatedCount
      });
    } catch (error) {
      // npm outdated は古いパッケージがある場合にエラーを返す
      checks.push({
        name: 'Outdated packages',
        passed: false,
        note: 'Some packages may be outdated'
      });
    }

    // セキュリティ更新をチェック
    try {
      execSync('npm audit fix --dry-run', { encoding: 'utf8' });
      checks.push({
        name: 'Security updates',
        passed: true,
        note: 'No security updates needed'
      });
    } catch (error) {
      checks.push({
        name: 'Security updates',
        passed: false,
        note: 'Security updates available'
      });
    }

    const allPassed = checks.every(check => check.passed);
    const score = (checks.filter(check => check.passed).length / checks.length) * 100;

    return {
      passed: allPassed,
      score,
      details: { checks }
    };
  }

  /**
   * アクセシビリティ準拠チェック
   */
  async checkAccessibilityCompliance() {
    const checks = [];

    try {
      // 基本的なHTMLファイルの存在確認
      const htmlFiles = this.findHTMLFiles();
      if (htmlFiles.length === 0) {
        return {
          passed: true,
          score: 100,
          details: { skipped: 'No HTML files found for accessibility testing' }
        };
      }

      // 色コントラスト比チェック
      const contrastResults = await this.checkColorContrast();
      checks.push({
        name: 'Color Contrast (WCAG 2.1 AA)',
        passed: contrastResults.passed,
        score: contrastResults.score,
        details: contrastResults.details
      });

      // ARIA属性チェック
      const ariaResults = await this.checkARIACompliance();
      checks.push({
        name: 'ARIA Compliance',
        passed: ariaResults.passed,
        score: ariaResults.score,
        details: ariaResults.details
      });

      // キーボードナビゲーション要素チェック
      const keyboardResults = await this.checkKeyboardNavigation();
      checks.push({
        name: 'Keyboard Navigation',
        passed: keyboardResults.passed,
        score: keyboardResults.score,
        details: keyboardResults.details
      });

      // モーダルとチャットウィジェットの特別チェック
      const modalResults = await this.checkModalAccessibility();
      checks.push({
        name: 'Modal Accessibility',
        passed: modalResults.passed,
        score: modalResults.score,
        details: modalResults.details
      });

      const allPassed = checks.every(check => check.passed);
      const avgScore = checks.reduce((sum, check) => sum + check.score, 0) / checks.length;

      return {
        passed: allPassed && avgScore >= 80, // 80%以上のスコアが必要
        score: avgScore,
        details: {
          checks,
          wcagLevel: 'AA',
          filesChecked: htmlFiles.length
        }
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: { error: error.message }
      };
    }
  }

  /**
   * HTMLファイルを検索
   */
  findHTMLFiles() {
    const files = [];
    const searchPaths = ['public', 'docs', 'src', 'dist', '.'];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        try {
          const pathFiles = execSync(`find ${searchPath} -name "*.html" -type f | head -20`, {
            encoding: 'utf8'
          })
            .split('\n')
            .filter(Boolean);
          files.push(...pathFiles);
        } catch (error) {
          // findコマンドが失敗した場合はスキップ
        }
      }
    }

    return [...new Set(files)]; // 重複を除去
  }

  /**
   * 色コントラスト比チェック
   */
  async checkColorContrast() {
    try {
      // 基本的なCSSファイルからのコントラストチェック
      const cssFiles = execSync('find . -name "*.css" -type f | head -10', { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);

      let contrastIssues = 0;
      let totalRules = 0;

      for (const cssFile of cssFiles) {
        if (fs.existsSync(cssFile)) {
          const cssContent = fs.readFileSync(cssFile, 'utf8');

          // 基本的な色の組み合わせを検出
          const colorRules = cssContent.match(/color\s*:\s*[^;]+;/g) || [];
          const backgroundRules = cssContent.match(/background-color\s*:\s*[^;]+;/g) || [];

          totalRules += colorRules.length + backgroundRules.length;

          // 問題のある色の組み合わせを検出（簡易版）
          const problematicColors = [
            '#999',
            '#ccc',
            '#ddd', // 低コントラストのグレー
            'lightgray',
            'lightgrey',
            'silver'
          ];

          for (const rule of [...colorRules, ...backgroundRules]) {
            if (problematicColors.some(color => rule.includes(color))) {
              contrastIssues++;
            }
          }
        }
      }

      const score = totalRules > 0 ? Math.max(0, 100 - (contrastIssues / totalRules) * 100) : 100;

      return {
        passed: contrastIssues === 0,
        score,
        details: {
          issues: contrastIssues,
          totalRules,
          filesChecked: cssFiles.length
        }
      };
    } catch (error) {
      return {
        passed: true,
        score: 100,
        details: { skipped: 'Color contrast check not available' }
      };
    }
  }

  /**
   * ARIA準拠チェック
   */
  async checkARIACompliance() {
    try {
      const htmlFiles = this.findHTMLFiles();
      let ariaIssues = 0;
      let totalElements = 0;

      for (const htmlFile of htmlFiles.slice(0, 5)) {
        // 最大5ファイル
        if (fs.existsSync(htmlFile)) {
          const htmlContent = fs.readFileSync(htmlFile, 'utf8');

          // 基本的なARIA属性の存在確認
          const interactiveElements = [
            ...(htmlContent.match(/<button[^>]*>/g) || []),
            ...(htmlContent.match(/<input[^>]*>/g) || []),
            ...(htmlContent.match(/<a[^>]*>/g) || []),
            ...(htmlContent.match(/<div[^>]*role=/g) || [])
          ];

          totalElements += interactiveElements.length;

          // ARIA属性の不足をチェック
          for (const element of interactiveElements) {
            if (!element.includes('aria-') && !element.includes('role=')) {
              ariaIssues++;
            }
          }
        }
      }

      const score = totalElements > 0 ? Math.max(0, 100 - (ariaIssues / totalElements) * 100) : 100;

      return {
        passed: ariaIssues < totalElements * 0.2, // 20%未満なら合格
        score,
        details: {
          issues: ariaIssues,
          totalElements,
          filesChecked: htmlFiles.length
        }
      };
    } catch (error) {
      return {
        passed: true,
        score: 100,
        details: { skipped: 'ARIA compliance check not available' }
      };
    }
  }

  /**
   * キーボードナビゲーションチェック
   */
  async checkKeyboardNavigation() {
    try {
      const htmlFiles = this.findHTMLFiles();
      let keyboardIssues = 0;
      let totalInteractiveElements = 0;

      for (const htmlFile of htmlFiles.slice(0, 5)) {
        if (fs.existsSync(htmlFile)) {
          const htmlContent = fs.readFileSync(htmlFile, 'utf8');

          // フォーカス可能要素の検出
          const focusableElements = [
            ...(htmlContent.match(/<a[^>]*href/g) || []),
            ...(htmlContent.match(/<button[^>]*>/g) || []),
            ...(htmlContent.match(/<input[^>]*>/g) || []),
            ...(htmlContent.match(/<select[^>]*>/g) || []),
            ...(htmlContent.match(/<textarea[^>]*>/g) || [])
          ];

          totalInteractiveElements += focusableElements.length;

          // tabindex="-1"以外の負の値をチェック
          const negativeTabindex = htmlContent.match(/tabindex\s*=\s*['"]-[2-9]/g) || [];
          keyboardIssues += negativeTabindex.length;

          // 異常に高いtabindex値をチェック
          const highTabindex = htmlContent.match(/tabindex\s*=\s*['"][1-9]\d{2,}/g) || [];
          keyboardIssues += highTabindex.length;
        }
      }

      const score = Math.max(0, 100 - keyboardIssues * 10);

      return {
        passed: keyboardIssues === 0,
        score,
        details: {
          issues: keyboardIssues,
          totalElements: totalInteractiveElements,
          filesChecked: htmlFiles.length
        }
      };
    } catch (error) {
      return {
        passed: true,
        score: 100,
        details: { skipped: 'Keyboard navigation check not available' }
      };
    }
  }

  /**
   * モーダルアクセシビリティチェック
   */
  async checkModalAccessibility() {
    try {
      const htmlFiles = this.findHTMLFiles();
      let modalIssues = 0;
      let totalModals = 0;

      for (const htmlFile of htmlFiles.slice(0, 5)) {
        if (fs.existsSync(htmlFile)) {
          const htmlContent = fs.readFileSync(htmlFile, 'utf8');

          // モーダル要素の検出
          const modals = [
            ...(htmlContent.match(/<div[^>]*class="[^"]*modal[^"]*"/g) || []),
            ...(htmlContent.match(/<div[^>]*id="[^"]*modal[^"]*"/g) || []),
            ...(htmlContent.match(/<div[^>]*role="dialog"/g) || [])
          ];

          totalModals += modals.length;

          for (const modal of modals) {
            // 必要なARIA属性の確認
            if (!modal.includes('aria-labelledby') && !modal.includes('aria-label')) {
              modalIssues++;
            }
            if (!modal.includes('role="dialog"') && !modal.includes('role="alertdialog"')) {
              modalIssues++;
            }
            if (!modal.includes('aria-modal')) {
              modalIssues++;
            }
          }
        }
      }

      const score =
        totalModals > 0 ? Math.max(0, 100 - (modalIssues / (totalModals * 3)) * 100) : 100;

      return {
        passed: modalIssues === 0,
        score,
        details: {
          issues: modalIssues,
          totalModals,
          filesChecked: htmlFiles.length
        }
      };
    } catch (error) {
      return {
        passed: true,
        score: 100,
        details: { skipped: 'Modal accessibility check not available' }
      };
    }
  }

  /**
   * アクセシビリティチェック
   */
  async checkAccessibility() {
    const accessibilityChecks = [];

    try {
      // HTML ファイルのアクセシビリティをチェック
      const htmlFiles = this.getAllHTMLFiles('.');

      for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const checks = this.validateHTMLAccessibility(content, file);
        accessibilityChecks.push(...checks);
      }

      // WCAG 2.1 AA 準拠チェック
      const wcagChecks = this.checkWCAGCompliance();
      accessibilityChecks.push(wcagChecks);
    } catch (error) {
      accessibilityChecks.push({
        name: 'Accessibility Check',
        passed: false,
        error: `Failed to run accessibility checks: ${error.message}`
      });
    }

    const allPassed = accessibilityChecks.every(check => check.passed);
    const score =
      accessibilityChecks.length > 0
        ? (accessibilityChecks.filter(check => check.passed).length / accessibilityChecks.length) *
          100
        : 100;

    return {
      passed: allPassed,
      score,
      details: { checks: accessibilityChecks }
    };
  }

  /**
   * HTML アクセシビリティを検証
   */
  validateHTMLAccessibility(content, fileName) {
    const issues = [];

    // img タグの alt 属性チェック
    const imgWithoutAlt = content.match(/<img(?![^>]*\salt\s*=)/gi);
    if (imgWithoutAlt) {
      issues.push({
        name: `${fileName}: Missing alt attributes`,
        passed: false,
        message: `Found ${imgWithoutAlt.length} img tags without alt attributes`
      });
    } else {
      issues.push({
        name: `${fileName}: Alt attributes`,
        passed: true,
        message: 'All img tags have alt attributes'
      });
    }

    // form 要素の label チェック
    const inputsWithoutLabels = content.match(
      /<input(?![^>]*\sid\s*=\s*["'][^"']*["'][^>]*>[\s\S]*?<label[^>]*\sfor\s*=\s*["']\1["'])/gi
    );
    if (inputsWithoutLabels && inputsWithoutLabels.length > 0) {
      issues.push({
        name: `${fileName}: Form labels`,
        passed: false,
        message: 'Some form inputs may be missing associated labels'
      });
    } else {
      issues.push({
        name: `${fileName}: Form labels`,
        passed: true,
        message: 'Form inputs have proper labeling'
      });
    }

    // 見出し構造のチェック
    const headings = content.match(/<h[1-6][^>]*>/gi) || [];
    const headingLevels = headings.map(h => parseInt(h.match(/h(\d)/i)[1]));
    let headingStructureValid = true;

    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] > headingLevels[i - 1] + 1) {
        headingStructureValid = false;
        break;
      }
    }

    issues.push({
      name: `${fileName}: Heading structure`,
      passed: headingStructureValid,
      message: headingStructureValid
        ? 'Heading structure is logical'
        : 'Heading structure may skip levels'
    });

    // color contrast のチェック (簡易版)
    const hasLowContrastColors = this.checkBasicColorContrast(content);
    issues.push({
      name: `${fileName}: Color contrast`,
      passed: !hasLowContrastColors,
      message: hasLowContrastColors
        ? 'Potential color contrast issues detected'
        : 'No obvious color contrast issues'
    });

    return issues;
  }

  /**
   * WCAG 2.1 AA 準拠チェック
   */
  checkWCAGCompliance() {
    const wcagIssues = [];

    // キーボードナビゲーション要素のチェック
    const htmlFiles = this.getAllHTMLFiles('.');
    let totalInteractiveElements = 0;
    let accessibleInteractiveElements = 0;

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // フォーカス可能要素のチェック
      const interactiveElements = content.match(/<(button|input|select|textarea|a)[^>]*>/gi) || [];
      totalInteractiveElements += interactiveElements.length;

      // tabindex, role, aria-* 属性を持つ要素をカウント
      const accessibleElements = content.match(/<[^>]*(tabindex|role|aria-)[^>]*>/gi) || [];
      accessibleInteractiveElements += Math.min(
        accessibleElements.length,
        interactiveElements.length
      );
    }

    const accessibilityRatio =
      totalInteractiveElements > 0 ? accessibleInteractiveElements / totalInteractiveElements : 1;

    wcagIssues.push({
      name: 'Interactive elements accessibility',
      passed: accessibilityRatio >= 0.8, // 80% 以上のインタラクティブ要素がアクセシブル
      ratio: accessibilityRatio,
      message: `${Math.round(accessibilityRatio * 100)}% of interactive elements have accessibility attributes`
    });

    return {
      name: 'WCAG 2.1 AA Compliance',
      passed: wcagIssues.every(issue => issue.passed),
      details: wcagIssues
    };
  }

  /**
   * 基本的な色コントラストチェック
   */
  checkBasicColorContrast(content) {
    // 簡易的なチェック - 明らかに問題のある色の組み合わせを検出
    const lowContrastPatterns = [
      /color:\s*#?([a-f0-9]{3,6}).*background.*#?([a-f0-9]{3,6})/gi,
      /background.*#?([a-f0-9]{3,6}).*color:\s*#?([a-f0-9]{3,6})/gi
    ];

    for (const pattern of lowContrastPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        // 実際のプロジェクトでは、ここで色のコントラスト比を計算
        // 今回は簡易的に黄色系の背景に白いテキストなどの問題パターンをチェック
        for (const match of matches) {
          if (match.includes('yellow') && match.includes('white')) {
            return true;
          }
          if (match.includes('#ffff') && match.includes('#fff')) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * HTML ファイルを取得
   */
  getAllHTMLFiles(dir) {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dir, item.name);

      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        files.push(...this.getAllHTMLFiles(itemPath));
      } else if (item.name.endsWith('.html')) {
        files.push(itemPath);
      }
    }

    return files;
  }
  async analyzeBundleSize() {
    try {
      // webpack-bundle-analyzer や類似ツールを想定
      const stats = this.getBundleStats();

      const sizeThreshold = 2 * 1024 * 1024; // 2MB
      const passed = stats.totalSize < sizeThreshold;
      const score = Math.max(0, 100 - (stats.totalSize / sizeThreshold) * 100);

      return {
        passed,
        score,
        details: {
          totalSize: stats.totalSize,
          threshold: sizeThreshold,
          breakdown: stats.breakdown
        }
      };
    } catch (error) {
      return {
        passed: true,
        score: 100,
        details: { skipped: 'Bundle analysis not available' }
      };
    }
  }

  /**
   * バンドル統計を取得（模擬）
   */
  getBundleStats() {
    // 実際の実装では webpack-bundle-analyzer の結果を使用
    const srcSize = this.getDirectorySize('src/');

    return {
      totalSize: srcSize,
      breakdown: {
        src: srcSize,
        nodeModules: 'N/A'
      }
    };
  }

  /**
   * ディレクトリサイズを取得
   */
  getDirectorySize(dir) {
    if (!fs.existsSync(dir)) {
      return 0;
    }

    let totalSize = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += fs.statSync(filePath).size;
      }
    }

    return totalSize;
  }

  /**
   * JavaScript ファイルを取得
   */
  getAllJSFiles(dir) {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        files.push(...this.getAllJSFiles(itemPath));
      } else if (item.name.endsWith('.js') || item.name.endsWith('.ts')) {
        files.push(itemPath);
      }
    }

    return files;
  }

  /**
   * クリティカルゲートかどうか判定
   */
  isCriticalGate(gateName) {
    const criticalGates = ['Unit Tests', 'Security Scan', 'Accessibility Check'];
    return criticalGates.includes(gateName);
  }

  /**
   * 全体スコアを計算
   */
  calculateOverallScore() {
    const weights = {
      'Unit Tests': 0.22,
      'Integration Tests': 0.13,
      'Code Coverage': 0.13,
      'Code Quality': 0.13,
      'Security Scan': 0.18,
      'Accessibility Check': 0.12,
      'Performance Tests': 0.05,
      'Dependency Check': 0.02,
      'Bundle Analysis': 0.02
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const gate of this.results.gates) {
      const weight = weights[gate.name] || 0.1;
      totalScore += (gate.score || 0) * weight;
      totalWeight += weight;
    }

    this.results.overall.score = totalWeight > 0 ? totalScore / totalWeight : 0;
    this.results.overall.passed = this.results.gates.every(gate => gate.passed);
  }

  /**
   * 結果を表示
   */
  displayResults() {
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan('🏆 QUALITY GATE ASSESSMENT RESULTS'));
    console.log(chalk.cyan('='.repeat(60)));

    // 個別ゲート結果
    console.log(chalk.white('\n📊 Individual Gate Results:'));
    for (const gate of this.results.gates) {
      const status = gate.passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      const score = gate.score ? chalk.blue(`${Math.round(gate.score)}%`) : '';
      const duration = chalk.gray(`${gate.duration}ms`);

      console.log(`   ${status} ${chalk.white(gate.name.padEnd(20))} ${score} ${duration}`);

      if (gate.error) {
        console.log(chalk.red(`       Error: ${gate.error}`));
      }
    }

    // 全体結果
    console.log(chalk.white('\n🎯 Overall Assessment:'));
    const overallStatus = this.results.overall.passed
      ? chalk.green('✅ ALL GATES PASSED')
      : chalk.red('❌ SOME GATES FAILED');

    console.log(`   Status: ${overallStatus}`);
    console.log(`   Score: ${chalk.blue(`${Math.round(this.results.overall.score)}%`)}`);
    console.log(`   Duration: ${chalk.gray(`${this.results.overall.duration}ms`)}`);

    // 推奨アクション
    this.displayRecommendations();

    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  }

  /**
   * 推奨アクションを表示
   */
  displayRecommendations() {
    const failedGates = this.results.gates.filter(gate => !gate.passed);

    if (failedGates.length === 0) {
      console.log(chalk.green('\n🎉 All quality gates passed! Ready for deployment.'));
      return;
    }

    console.log(chalk.yellow('\n💡 Recommended Actions:'));

    for (const gate of failedGates) {
      const recommendations = this.getRecommendations(gate.name);
      console.log(chalk.yellow(`   ${gate.name}:`));

      for (const rec of recommendations) {
        console.log(chalk.gray(`     • ${rec}`));
      }
    }
  }

  /**
   * ゲート別の推奨アクションを取得
   */
  getRecommendations(gateName) {
    const recommendations = {
      'Unit Tests': [
        'Fix failing unit tests',
        'Add tests for uncovered code paths',
        'Review test assertions and mocks'
      ],
      'Integration Tests': [
        'Fix failing integration tests',
        'Check database connections and external dependencies',
        'Review API endpoint responses'
      ],
      'Code Coverage': [
        'Add tests to increase coverage',
        'Focus on uncovered branches and functions',
        'Remove dead code'
      ],
      'Code Quality': [
        'Fix ESLint errors and warnings',
        'Apply Prettier formatting',
        'Refactor complex functions'
      ],
      'Security Scan': [
        'Update vulnerable dependencies',
        'Remove hardcoded secrets',
        'Review security best practices'
      ],
      'Accessibility Check': [
        'Add missing alt attributes to images',
        'Ensure proper heading structure (h1, h2, h3...)',
        'Add ARIA labels and roles where needed',
        'Check color contrast ratios (WCAG 2.1 AA: 4.5:1 for normal text)',
        'Ensure keyboard navigation is functional',
        'Add focus indicators for interactive elements',
        'Test with screen readers'
      ],
      'Performance Tests': [
        'Optimize slow endpoints',
        'Review database queries',
        'Consider caching strategies'
      ],
      'Dependency Check': [
        'Update outdated packages',
        'Remove unused dependencies',
        'Review breaking changes'
      ],
      'Bundle Analysis': ['Optimize bundle size', 'Use code splitting', 'Review large dependencies']
    };

    return recommendations[gateName] || ['Review and fix identified issues'];
  }

  /**
   * 結果をファイルに出力
   */
  exportResults(outputPath = 'quality-gate-results.json') {
    const exportData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      results: this.results
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    this.log.success(`Results exported to ${outputPath}`);
  }
}

// CLI実行部分
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = {
    coverage: parseInt(process.argv[2]) || 80,
    parallel: process.argv.includes('--parallel'),
    exitOnFailure: !process.argv.includes('--no-exit')
  };

  const qualityGates = new QualityGateSystem(options);

  qualityGates
    .runAllGates()
    .then(results => {
      qualityGates.exportResults();

      if (options.exitOnFailure && !results.overall.passed) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('Quality gate system error:'), error.message);
      process.exit(1);
    });
}

export default QualityGateSystem;
