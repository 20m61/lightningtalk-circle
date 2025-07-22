#!/usr/bin/env node
/**
 * UI Testing Package Scripts
 * UIテスト用のNPMスクリプト管理
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// コマンドライン引数の解析
const args = process.argv.slice(2);
const command = args[0];
const options = args.slice(1);

const SCRIPTS = {
  // 基本的なスクリーンショット撮影
  'screenshot': () => {
    console.log('📸 Running screenshot capture...');
    execSync('node screenshot-capture.js', { stdio: 'inherit' });
  },

  // 自動UIテスト実行
  'ui-test': () => {
    console.log('🧪 Running automated UI tests...');
    const testArgs = options.includes('--ci') ? ['--ci'] : [];
    execSync(`node automated-ui-testing.js ${testArgs.join(' ')}`, { stdio: 'inherit' });
  },

  // テスト環境のセットアップ
  'test-setup': () => {
    console.log('🔧 Setting up UI test environment...');
    
    const dirs = [
      'screenshots-automated-ui-tests',
      'screenshots-baseline', 
      'screenshots-diff',
      'screenshots-ui-verification'
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });

    // パッケージ依存関係の確認
    try {
      require.resolve('puppeteer');
      console.log('✅ Puppeteer is installed');
    } catch {
      console.log('⚠️ Installing Puppeteer...');
      execSync('npm install puppeteer --save-dev', { stdio: 'inherit' });
    }
  },

  // ベースライン画像の更新
  'update-baseline': () => {
    console.log('🔄 Updating baseline screenshots...');
    
    const sourceDir = 'screenshots-automated-ui-tests';
    const targetDir = 'screenshots-baseline';
    
    if (!fs.existsSync(sourceDir)) {
      console.error('❌ No screenshots found. Run tests first.');
      process.exit(1);
    }

    // ベースラインディレクトリの作成
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // スクリーンショットのコピー
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.png'));
    files.forEach(file => {
      const source = path.join(sourceDir, file);
      const target = path.join(targetDir, file);
      fs.copyFileSync(source, target);
      console.log(`✅ Updated baseline: ${file}`);
    });

    console.log(`🎉 Updated ${files.length} baseline screenshots`);
  },

  // テストレポートの生成
  'generate-report': () => {
    console.log('📊 Generating UI test report...');
    
    const reportDirs = [
      'screenshots-automated-ui-tests',
      'screenshots-ui-verification'
    ];

    const reports = [];
    
    reportDirs.forEach(dir => {
      const reportFile = path.join(dir, 'automated-ui-test-report.json');
      if (fs.existsSync(reportFile)) {
        const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
        reports.push({ dir, ...report });
      }
    });

    if (reports.length === 0) {
      console.log('⚠️ No test reports found. Run tests first.');
      return;
    }

    // 統合レポートの生成
    const consolidatedReport = {
      timestamp: new Date().toISOString(),
      totalReports: reports.length,
      summary: {
        totalTests: reports.reduce((sum, r) => sum + (r.summary?.totalTests || 0), 0),
        totalPassed: reports.reduce((sum, r) => sum + (r.summary?.totalPassed || 0), 0),
        totalFailed: reports.reduce((sum, r) => sum + (r.summary?.totalFailed || 0), 0)
      },
      reports
    };

    const outputPath = 'ui-test-consolidated-report.json';
    fs.writeFileSync(outputPath, JSON.stringify(consolidatedReport, null, 2));
    
    console.log(`✅ Consolidated report saved: ${outputPath}`);
    console.log(`📊 Total: ${consolidatedReport.summary.totalTests} tests`);
    console.log(`✅ Passed: ${consolidatedReport.summary.totalPassed}`);
    console.log(`❌ Failed: ${consolidatedReport.summary.totalFailed}`);
  },

  // 開発サーバー付きテスト実行
  'test-with-server': () => {
    console.log('🚀 Starting server and running UI tests...');
    
    let serverProcess;
    
    try {
      // 開発サーバーの起動
      console.log('Starting development server...');
      serverProcess = spawn('npm', ['run', 'dev'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true
      });

      // サーバー起動待機
      console.log('Waiting for server to be ready...');
      execSync('timeout 60 bash -c \'until curl -f http://localhost:3000 >/dev/null 2>&1; do sleep 2; done\'', {
        stdio: 'inherit'
      });

      // UIテスト実行
      console.log('Server ready, running UI tests...');
      execSync('node automated-ui-testing.js', { stdio: 'inherit' });

    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    } finally {
      // サーバー停止
      if (serverProcess) {
        console.log('Stopping development server...');
        process.kill(-serverProcess.pid);
      }
    }
  },

  // CI/CD用のテスト実行
  'test-ci': () => {
    console.log('🔄 Running UI tests in CI mode...');
    
    // 環境変数の設定
    process.env.NODE_ENV = 'test';
    process.env.HEADLESS = 'true';
    
    try {
      execSync('node automated-ui-testing.js --ci', { stdio: 'inherit' });
      console.log('✅ All CI tests passed');
    } catch (error) {
      console.error('❌ CI tests failed');
      process.exit(1);
    }
  },

  // ヘルプ表示
  'help': () => {
    console.log(`
🧪 UI Testing Scripts

Usage: node package-scripts/ui-testing.js <command>

Commands:
  screenshot         📸 Take screenshots for verification
  ui-test           🧪 Run comprehensive UI tests
  test-setup        🔧 Set up testing environment
  update-baseline   🔄 Update baseline screenshots
  generate-report   📊 Generate consolidated test report
  test-with-server  🚀 Start server and run tests
  test-ci          🔄 Run tests in CI/CD mode
  help             ❓ Show this help message

Examples:
  node package-scripts/ui-testing.js screenshot
  node package-scripts/ui-testing.js ui-test --ci
  node package-scripts/ui-testing.js test-with-server
`);
  }
};

// コマンド実行
if (!command || !SCRIPTS[command]) {
  console.error('❌ Invalid command. Use "help" to see available commands.');
  process.exit(1);
}

try {
  SCRIPTS[command]();
} catch (error) {
  console.error(`❌ Command "${command}" failed:`, error.message);
  process.exit(1);
}