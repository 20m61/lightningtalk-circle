#!/usr/bin/env node
/**
 * コード品質チェックスクリプト
 * Code Quality Check Script
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import chalk from 'chalk';

const log = {
  info: msg => console.log(chalk.blue('ℹ️'), msg),
  success: msg => console.log(chalk.green('✅'), msg),
  warning: msg => console.log(chalk.yellow('⚠️'), msg),
  error: msg => console.log(chalk.red('❌'), msg),
  title: msg => console.log(chalk.bold.cyan(`\n📋 ${msg}\n`))
};

class CodeQualityChecker {
  constructor() {
    this.hasErrors = false;
    this.hasWarnings = false;
  }

  run(command, description, allowFailure = false) {
    log.info(`Running: ${description}`);
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (output.trim()) {
        console.log(output);
      }

      log.success(`${description} completed successfully`);
      return true;
    } catch (error) {
      if (allowFailure) {
        log.warning(`${description} failed (allowed): ${error.message}`);
        this.hasWarnings = true;
        return false;
      } else {
        log.error(`${description} failed: ${error.message}`);
        this.hasErrors = true;
        return false;
      }
    }
  }

  checkESLint() {
    log.title('ESLint Code Quality Check');

    if (!existsSync('.eslintrc.cjs')) {
      log.warning('ESLint configuration not found');
      return false;
    }

    // まず、主要なディレクトリでの構文チェック
    const directories = ['server/', 'scripts/', 'tests/'];
    let hasIssues = false;

    for (const dir of directories) {
      if (existsSync(dir)) {
        log.info(`Checking ${dir} with ESLint...`);
        const result = this.run(
          `npx eslint ${dir} --config .eslintrc.cjs --ext .js --format compact`,
          `ESLint check for ${dir}`,
          true
        );
        if (!result) {
          hasIssues = true;
        }
      }
    }

    if (hasIssues) {
      log.warning('ESLint found issues. Running auto-fix...');

      for (const dir of directories) {
        if (existsSync(dir)) {
          this.run(
            `npx eslint ${dir} --config .eslintrc.cjs --ext .js --fix --quiet`,
            `ESLint auto-fix for ${dir}`,
            true
          );
        }
      }
    }

    return !hasIssues;
  }

  checkPrettier() {
    log.title('Prettier Formatting Check');

    if (!existsSync('.prettierrc.cjs')) {
      log.warning('Prettier configuration not found');
      return false;
    }

    // フォーマットチェック
    const result = this.run(
      'npx prettier --check server/ scripts/ tests/ *.js *.json *.md',
      'Prettier formatting check',
      true
    );

    if (!result) {
      log.info('Running Prettier auto-format...');
      this.run(
        'npx prettier --write server/ scripts/ tests/ *.js *.json *.md',
        'Prettier auto-format',
        true
      );
    }

    return result;
  }

  checkTests() {
    log.title('Test Suite Check');

    if (!existsSync('tests/')) {
      log.warning('Tests directory not found');
      return false;
    }

    // 単体テストのみ実行（高速）
    return this.run('npm run test:unit -- --passWithNoTests --verbose=false', 'Unit tests', true);
  }

  checkSecurity() {
    log.title('Security Audit');

    return this.run('npm audit --audit-level=moderate', 'Security audit', true);
  }

  checkGitHooks() {
    log.title('Git Hooks Validation');

    const hooks = ['.husky/pre-commit', '.husky/commit-msg', '.husky/pre-push'];
    let allHooksValid = true;

    for (const hook of hooks) {
      if (existsSync(hook)) {
        log.success(`${hook} exists`);
      } else {
        log.warning(`${hook} not found`);
        allHooksValid = false;
      }
    }

    return allHooksValid;
  }

  checkConfiguration() {
    log.title('Configuration Files Check');

    const configs = [
      { file: '.eslintrc.cjs', name: 'ESLint config' },
      { file: '.prettierrc.cjs', name: 'Prettier config' },
      { file: '.editorconfig', name: 'EditorConfig' },
      { file: '.eslintignore', name: 'ESLint ignore' },
      { file: '.prettierignore', name: 'Prettier ignore' },
      { file: '.vscode/settings.json', name: 'VS Code settings' },
      { file: '.vscode/extensions.json', name: 'VS Code extensions' }
    ];

    let allConfigsValid = true;

    for (const config of configs) {
      if (existsSync(config.file)) {
        log.success(`${config.name} exists`);
      } else {
        log.warning(`${config.name} not found`);
        allConfigsValid = false;
      }
    }

    return allConfigsValid;
  }

  async runAll() {
    log.title('Code Quality & Standards Check');

    console.log(chalk.bold('🔍 Lightning Talk Circle - Code Quality Check'));
    console.log(chalk.gray('Checking code quality, formatting, and standards...\n'));

    const results = {
      config: this.checkConfiguration(),
      eslint: this.checkESLint(),
      prettier: this.checkPrettier(),
      tests: this.checkTests(),
      security: this.checkSecurity(),
      gitHooks: this.checkGitHooks()
    };

    // サマリー表示
    log.title('Quality Check Summary');

    Object.entries(results).forEach(([check, passed]) => {
      const status = passed ? '✅' : '⚠️';
      const checkName = check.charAt(0).toUpperCase() + check.slice(1);
      console.log(`${status} ${checkName}: ${passed ? 'Passed' : 'Issues found'}`);
    });

    console.log(`\n${chalk.bold('Overall Status:')}`);

    if (this.hasErrors) {
      console.log(chalk.red('❌ Code quality check failed - critical issues found'));
      process.exit(1);
    } else if (this.hasWarnings) {
      console.log(chalk.yellow('⚠️  Code quality check completed with warnings'));
      console.log(chalk.gray('Issues were automatically fixed where possible'));
    } else {
      console.log(chalk.green('✅ All code quality checks passed!'));
    }

    // 改善提案
    if (this.hasWarnings || this.hasErrors) {
      console.log(`\n${chalk.bold('📝 Recommendations:')}`);
      console.log('• Run git add . && git commit to save auto-fixes');
      console.log('• Check VS Code for additional suggestions');
      console.log('• Consider running npm run lint before commits');
    }
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new CodeQualityChecker();
  checker.runAll().catch(error => {
    console.error(chalk.red('Quality check failed:'), error);
    process.exit(1);
  });
}

export default CodeQualityChecker;
