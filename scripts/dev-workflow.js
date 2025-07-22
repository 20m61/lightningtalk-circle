#!/usr/bin/env node
/**
 * Lightning Talk Circle - Development Workflow Helper
 * 開発ワークフローを支援するCLIツール
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (!options.allowFailure) {
      throw error;
    }
    return null;
  }
}

/**
 * 新しいフィーチャーブランチを作成
 */
function createFeatureBranch(branchName) {
  log('🚀 Creating new feature branch...', 'blue');

  if (!branchName) {
    log('❌ Branch name is required', 'red');
    log('Usage: npm run dev:feature <branch-name>', 'yellow');
    process.exit(1);
  }

  // 現在のブランチが developer かチェック
  const currentBranch = execCommand('git branch --show-current', { silent: true }).trim();

  if (currentBranch !== 'developer') {
    log('⚠️  Switching to developer branch...', 'yellow');
    execCommand('git checkout developer');
    execCommand('git pull origin developer');
  }

  // ブランチ作成
  const featureBranchName = branchName.startsWith('feature/')
    ? branchName
    : `feature/${branchName}`;

  log(`📝 Creating branch: ${featureBranchName}`, 'cyan');
  execCommand(`git checkout -b ${featureBranchName}`);

  log('✅ Feature branch created successfully!', 'green');
  log(`💡 Next steps:`, 'bright');
  log(`   1. Start developing: npm run dev`, 'cyan');
  log(`   2. Make changes and commit`, 'cyan');
  log(`   3. Create PR: npm run dev:pr`, 'cyan');
}

/**
 * 開発サーバーを起動（ホットリロード付き）
 */
function startDevServer(withSeed = false) {
  log('🔥 Starting development server with hot reload...', 'blue');

  const command = withSeed ? 'npm run dev:seed' : 'npm run dev';

  // 並行してテストウォッチャーも起動
  const testWatcher = spawn('npm', ['run', 'test:watch'], {
    stdio: ['ignore', 'pipe', 'inherit'],
    detached: true
  });

  testWatcher.stdout.on('data', data => {
    const output = data.toString();
    if (output.includes('PASS') || output.includes('FAIL')) {
      log(`🧪 ${output.trim()}`, output.includes('PASS') ? 'green' : 'red');
    }
  });

  // メインサーバー起動
  execCommand(command);
}

/**
 * コードベースの健全性チェック
 */
function runHealthCheck() {
  log('🏥 Running codebase health check...', 'blue');

  const checks = [
    {
      name: 'Format Check',
      command: 'npm run format:check',
      required: false
    },
    {
      name: 'Lint Check',
      command: 'npm run lint',
      required: false
    },
    {
      name: 'Type Check',
      command: 'npx tsc --noEmit',
      required: false
    },
    {
      name: 'Security Audit',
      command: 'npm audit --audit-level=moderate',
      required: false
    },
    {
      name: 'Test Coverage',
      command: 'npm run test:coverage',
      required: false
    }
  ];

  const results = [];

  checks.forEach(check => {
    log(`🔍 Running ${check.name}...`, 'cyan');
    try {
      execCommand(check.command, { silent: true });
      log(`✅ ${check.name} passed`, 'green');
      results.push({ name: check.name, status: 'passed' });
    } catch (error) {
      log(`⚠️  ${check.name} failed`, 'yellow');
      results.push({ name: check.name, status: 'failed' });
    }
  });

  // サマリー表示
  log('\n📊 Health Check Summary:', 'bright');
  results.forEach(result => {
    const icon = result.status === 'passed' ? '✅' : '⚠️';
    log(`  ${icon} ${result.name}`, result.status === 'passed' ? 'green' : 'yellow');
  });

  const passedCount = results.filter(r => r.status === 'passed').length;
  log(`\n🎯 Overall Score: ${passedCount}/${results.length}`, 'bright');
}

/**
 * プルリクエストの作成
 */
function createPullRequest() {
  log('📬 Creating pull request...', 'blue');

  const currentBranch = execCommand('git branch --show-current', { silent: true }).trim();

  if (!currentBranch.startsWith('feature/') && !currentBranch.startsWith('fix/')) {
    log('⚠️  You should be on a feature or fix branch to create a PR', 'yellow');
    return;
  }

  // 変更があるかチェック
  const status = execCommand('git status --porcelain', { silent: true });
  if (status.trim()) {
    log('⚠️  You have uncommitted changes. Please commit them first.', 'yellow');
    return;
  }

  // プッシュ
  log('📤 Pushing branch to remote...', 'cyan');
  execCommand(`git push -u origin ${currentBranch}`);

  // PR作成
  const prTemplate = `
## 概要
<!-- 何を変更したかを簡潔に -->

## 変更内容
- [ ] 新機能追加
- [ ] バグ修正
- [ ] パフォーマンス改善
- [ ] リファクタリング
- [ ] ドキュメント更新

## テスト
- [ ] ユニットテスト追加/更新
- [ ] 手動テスト完了

## 確認事項
- [ ] ESLint/Prettier通過
- [ ] TypeScript型チェック通過
- [ ] セキュリティスキャン通過

## 影響範囲
<!-- どの部分に影響するか -->
`;

  try {
    execCommand(
      `gh pr create --base developer --title "${currentBranch.replace(/^(feature|fix)\//, '')}: " --body "${prTemplate}"`
    );
    log('✅ Pull request created successfully!', 'green');
  } catch (error) {
    log('❌ Failed to create PR. Please check gh CLI setup.', 'red');
  }
}

/**
 * 環境情報の表示
 */
function showEnvironmentInfo() {
  log('🌍 Environment Information:', 'bright');

  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const nodeVersion = execCommand('node --version', { silent: true }).trim();
    const npmVersion = execCommand('npm --version', { silent: true }).trim();
    const gitBranch = execCommand('git branch --show-current', { silent: true }).trim();
    const gitStatus = execCommand('git status --porcelain', { silent: true }).trim();

    log(`📦 Project: ${packageJson.name} v${packageJson.version}`, 'cyan');
    log(`🟢 Node.js: ${nodeVersion}`, 'cyan');
    log(`📋 npm: ${npmVersion}`, 'cyan');
    log(`🌿 Branch: ${gitBranch}`, gitBranch === 'main' ? 'red' : 'green');
    log(`📊 Git Status: ${gitStatus ? 'Modified files' : 'Clean'}`, gitStatus ? 'yellow' : 'green');

    // 実行中のサービス確認
    try {
      execCommand('curl -f http://localhost:3000/api/health', { silent: true });
      log('🚀 Dev Server: Running on http://localhost:3000', 'green');
    } catch {
      log('😴 Dev Server: Not running', 'yellow');
    }
  } catch (error) {
    log('❌ Failed to get environment info', 'red');
  }
}

/**
 * 便利なエイリアス
 */
function showAliases() {
  log('🔧 Development Aliases:', 'bright');
  log('');
  log('📝 npm run dev:feature <name>  - Create new feature branch', 'cyan');
  log('🔥 npm run dev:hot             - Start dev server with hot reload', 'cyan');
  log('🧪 npm run dev:test            - Start test watcher', 'cyan');
  log('🏥 npm run dev:health          - Run health checks', 'cyan');
  log('📬 npm run dev:pr              - Create pull request', 'cyan');
  log('🌍 npm run dev:env             - Show environment info', 'cyan');
  log('🧹 npm run dev:clean           - Clean build artifacts', 'cyan');
  log('🔄 npm run dev:reset           - Reset to developer branch', 'cyan');
}

/**
 * クリーンアップ
 */
function cleanBuildArtifacts() {
  log('🧹 Cleaning build artifacts...', 'blue');

  const cleanCommands = [
    'rm -rf node_modules/.cache',
    'rm -rf .next',
    'rm -rf dist',
    'rm -rf build',
    'rm -rf coverage',
    'rm -rf logs/*.log',
    'npm cache clean --force'
  ];

  cleanCommands.forEach(cmd => {
    try {
      execCommand(cmd, { silent: true, allowFailure: true });
    } catch (error) {
      // Ignore errors for cleanup
    }
  });

  log('✅ Build artifacts cleaned', 'green');
}

/**
 * デベロッパーブランチにリセット
 */
function resetToDeveloper() {
  log('🔄 Resetting to developer branch...', 'blue');

  try {
    execCommand('git stash', { allowFailure: true });
    execCommand('git checkout developer');
    execCommand('git pull origin developer');
    log('✅ Reset to developer branch completed', 'green');
  } catch (error) {
    log('❌ Failed to reset to developer branch', 'red');
  }
}

// CLI インターフェース
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'feature':
    createFeatureBranch(args[0]);
    break;
  case 'hot':
    startDevServer(false);
    break;
  case 'seed':
    startDevServer(true);
    break;
  case 'health':
    runHealthCheck();
    break;
  case 'pr':
    createPullRequest();
    break;
  case 'env':
    showEnvironmentInfo();
    break;
  case 'aliases':
    showAliases();
    break;
  case 'clean':
    cleanBuildArtifacts();
    break;
  case 'reset':
    resetToDeveloper();
    break;
  default:
    log('🚀 Lightning Talk Circle - Development Workflow Helper', 'bright');
    log('');
    showAliases();
    log('');
    log('💡 Usage: node scripts/dev-workflow.js <command> [args]', 'yellow');
}

export {
  createFeatureBranch,
  startDevServer,
  runHealthCheck,
  createPullRequest,
  showEnvironmentInfo
};
