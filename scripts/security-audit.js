#!/usr/bin/env node
/**
 * Lightning Talk Circle - Comprehensive Security Audit
 * Git履歴全体の個人情報・機密情報スキャンツール
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
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

// 検出パターン定義
const SENSITIVE_PATTERNS = {
  // API キーとトークン
  apiKeys: [
    /\bAKIA[0-9A-Z]{16}\b/g,                     // AWS Access Key
    /\b[A-Za-z0-9+/]{40}\b/g,                   // AWS Secret Key (base64-like)
    /\bghp_[a-zA-Z0-9]{36}\b/g,                 // GitHub Personal Access Token
    /\bgho_[a-zA-Z0-9]{36}\b/g,                 // GitHub OAuth Token
    /\bghs_[a-zA-Z0-9]{36}\b/g,                 // GitHub App Token
    /\bghr_[a-zA-Z0-9]{36}\b/g,                 // GitHub Refresh Token
    /\bsk-[a-zA-Z0-9]{48}\b/g,                  // OpenAI API Key
    /\bxoxb-[0-9a-zA-Z\-]+/g,                   // Slack Bot Token
    /\bxoxp-[0-9a-zA-Z\-]+/g,                   // Slack User Token
    /\bAIza[0-9A-Za-z\-_]{35}\b/g,              // Google API Key
    /\b[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com\b/g, // Google OAuth Client ID
    /\bEAAC[a-zA-Z0-9]+/g                      // Facebook Access Token
  ],

  // データベース接続情報
  database: [
    /mongodb:\/\/[^\/\s]+:[^\/\s]+@[^\/\s]+/g,  // MongoDB URI with credentials
    /postgres:\/\/[^\/\s]+:[^\/\s]+@[^\/\s]+/g, // PostgreSQL URI with credentials
    /mysql:\/\/[^\/\s]+:[^\/\s]+@[^\/\s]+/g,    // MySQL URI with credentials
    /redis:\/\/[^\/\s]+:[^\/\s]+@[^\/\s]+/g,    // Redis URI with credentials
    /password\s*[:=]\s*["']([^"']+)["']/gi,     // Password assignments
    /pwd\s*[:=]\s*["']([^"']+)["']/gi          // Password assignments (short)
  ],

  // 個人情報
  personalInfo: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    /\b\d{3}-\d{4}-\d{4}\b/g,                   // Phone numbers (JP format)
    /\b\d{10,11}\b/g,                           // Phone numbers (digits only)
    /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g,            // Credit card numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,                  // SSN format
    /\b[0-9]{7,10}\b/g,                         // ID numbers
    /マイナンバー|個人番号/g,                    // Japanese personal number references
    /住所|〒\d{3}-\d{4}/g,                      // Japanese addresses
    /生年月日|誕生日/g                          // Birthday references
  ],

  // サーバー・インフラ情報
  infrastructure: [
    /https?:\/\/[a-zA-Z0-9.-]+\.amazonaws\.com[^\s]*/g, // AWS URLs
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP addresses
    /localhost:\d+/g,                           // Localhost with ports
    /\b[a-zA-Z0-9.-]+\.local\b/g,              // Local domain names
    /\b[a-zA-Z0-9.-]+\.internal\b/g,           // Internal domain names
    /ssh-rsa\s+[A-Za-z0-9+\/=]+/g,            // SSH public keys
    /-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g // Private keys
  ],

  // セッション・認証情報
  session: [
    /session_id\s*[:=]\s*["']([^"']+)["']/gi,  // Session IDs
    /csrf_token\s*[:=]\s*["']([^"']+)["']/gi,  // CSRF tokens
    /auth_token\s*[:=]\s*["']([^"']+)["']/gi,  // Auth tokens
    /bearer\s+[a-zA-Z0-9._-]+/gi,              // Bearer tokens
    /jwt\s*[:=]\s*["']([^"']+)["']/gi         // JWT tokens
  ],

  // 環境・設定情報
  environment: [
    /NODE_ENV\s*[:=]\s*["']?production["']?/gi, // Production environment
    /DEBUG\s*[:=]\s*["']?true["']?/gi,         // Debug flags
    /SECRET\s*[:=]\s*["']([^"']+)["']/gi,      // Secret values
    /PRIVATE\s*[:=]\s*["']([^"']+)["']/gi,     // Private values
    /CONFIDENTIAL\s*[:=]\s*["']([^"']+)["']/gi // Confidential values
  ]
};

// ホワイトリスト（許可される値）
const WHITELIST = [
  'example@example.com',
  'test@example.com',
  'noreply@example.com',
  'admin@example.com',
  'user@example.com',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'example.com',
  'test.com',
  'placeholder',
  'your_token_here',
  'your_secret_here',
  'your_key_here',
  'changeme',
  'password123',
  'secret123',
  'token123',
  'dummy',
  'sample',
  'mock',
  'fake',
  'test123',
  'demo123',
  'noreply@anthropic.com'
];

// スキャン結果格納
const auditResults = {
  totalCommits: 0,
  scannedCommits: 0,
  findings: [],
  summary: {
    apiKeys: 0,
    database: 0,
    personalInfo: 0,
    infrastructure: 0,
    session: 0,
    environment: 0
  }
};

/**
 * 特定のコミットで変更されたファイルを取得
 */
function getChangedFiles(commitHash) {
  try {
    const result = execSync(`git show --pretty="" --name-only ${commitHash}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    return [];
  }
}

/**
 * 特定のコミットでのファイル内容を取得
 */
function getFileContentAtCommit(commitHash, filePath) {
  try {
    const result = execSync(`git show ${commitHash}:${filePath}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result;
  } catch (error) {
    return null;
  }
}

/**
 * 文字列がホワイトリストに含まれているかチェック
 */
function isWhitelisted(value) {
  const cleanValue = value.toLowerCase().trim();
  return WHITELIST.some(whiteItem =>
    cleanValue.includes(whiteItem.toLowerCase()) ||
    whiteItem.toLowerCase().includes(cleanValue)
  );
}

/**
 * パターンマッチングを実行
 */
function scanContent(content, commitHash, filePath, commitMessage) {
  const findings = [];

  Object.entries(SENSITIVE_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // ホワイトリストチェック
          if (!isWhitelisted(match)) {
            findings.push({
              category,
              pattern: pattern.toString(),
              match: match.substring(0, 100), // 最初の100文字のみ
              commitHash,
              filePath,
              commitMessage: commitMessage.substring(0, 100),
              line: getLineNumber(content, match)
            });
            auditResults.summary[category]++;
          }
        });
      }
    });
  });

  return findings;
}

/**
 * マッチした文字列の行番号を取得
 */
function getLineNumber(content, match) {
  const lines = content.substring(0, content.indexOf(match)).split('\n');
  return lines.length;
}

/**
 * 全コミット履歴をスキャン（効率化版）
 */
async function scanGitHistory() {
  log('🔍 Starting comprehensive Git history security audit...', 'blue');

  // 最近の100コミットをスキャン（効率化）
  const commitHashes = execSync('git rev-list --all -n 100', {
    encoding: 'utf8'
  }).trim().split('\n');

  auditResults.totalCommits = commitHashes.length;
  log(`📊 Scanning recent ${auditResults.totalCommits} commits`, 'cyan');

  for (let i = 0; i < commitHashes.length; i++) {
    const commitHash = commitHashes[i];

    if (i % 10 === 0) {
      log(`📈 Progress: ${i}/${commitHashes.length} commits scanned`, 'yellow');
    }

    try {
      // コミット情報を取得
      const commitInfo = execSync(`git show --pretty=format:"%s" -s ${commitHash}`, {
        encoding: 'utf8'
      }).trim();

      // 変更されたファイルを取得（.env, config, credential系ファイルのみ）
      const changedFiles = getChangedFiles(commitHash)
        .filter(file => isSensitiveFile(file));

      for (const filePath of changedFiles) {
        // ファイル内容を取得
        const content = getFileContentAtCommit(commitHash, filePath);
        if (content) {
          const findings = scanContent(content, commitHash, filePath, commitInfo);
          auditResults.findings.push(...findings);
        }
      }

      auditResults.scannedCommits++;
    } catch (error) {
      // エラーを静かに処理
    }
  }
}

/**
 * 機密情報を含む可能性のあるファイルかどうか判定
 */
function isSensitiveFile(filePath) {
  const sensitivePatterns = [
    /\.env/,
    /config/,
    /secret/,
    /credential/,
    /key/,
    /token/,
    /password/,
    /auth/,
    /\.json$/,
    /\.js$/,
    /\.ts$/,
    /\.yaml$/,
    /\.yml$/,
    /\.toml$/,
    /\.ini$/
  ];

  return sensitivePatterns.some(pattern => pattern.test(filePath.toLowerCase()));
}

/**
 * 現在のワーキングディレクトリをスキャン
 */
function scanCurrentWorkspace() {
  log('📂 Scanning current workspace for sensitive files...', 'blue');

  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
    'config.json',
    'secrets.json',
    'credentials.json',
    'private.key',
    'id_rsa',
    'id_rsa.pub'
  ];

  sensitiveFiles.forEach(file => {
    if (existsSync(file)) {
      try {
        const content = readFileSync(file, 'utf8');
        const findings = scanContent(content, 'WORKSPACE', file, 'Current workspace file');
        auditResults.findings.push(...findings);
        log(`🔎 Scanned: ${file}`, 'cyan');
      } catch (error) {
        // エラーを静かに処理
      }
    }
  });
}

/**
 * レポート生成
 */
function generateReport() {
  const reportData = {
    scanDate: new Date().toISOString(),
    repository: process.cwd(),
    summary: {
      totalCommits: auditResults.totalCommits,
      scannedCommits: auditResults.scannedCommits,
      totalFindings: auditResults.findings.length,
      categories: auditResults.summary
    },
    findings: auditResults.findings.slice(0, 50), // 最初の50件のみ
    recommendations: generateRecommendations()
  };

  // JSONレポート
  writeFileSync('security-audit-report.json', JSON.stringify(reportData, null, 2));

  // 人間が読めるレポート
  const readableReport = generateReadableReport(reportData);
  writeFileSync('security-audit-report.md', readableReport);

  log('📄 Reports generated:', 'green');
  log('  - security-audit-report.json', 'cyan');
  log('  - security-audit-report.md', 'cyan');
}

/**
 * 推奨事項を生成
 */
function generateRecommendations() {
  const recommendations = [];

  if (auditResults.summary.apiKeys > 0) {
    recommendations.push('🔑 API keys detected. Use environment variables and AWS Secrets Manager.');
  }

  if (auditResults.summary.database > 0) {
    recommendations.push('🗄️ Database credentials detected. Use connection pooling and credential rotation.');
  }

  if (auditResults.summary.personalInfo > 0) {
    recommendations.push('👤 Personal information detected. Implement data anonymization and GDPR compliance.');
  }

  if (auditResults.summary.infrastructure > 0) {
    recommendations.push('🏗️ Infrastructure details exposed. Review network security and access controls.');
  }

  if (auditResults.findings.length > 0) {
    recommendations.push('🧹 Consider using git-filter-branch or BFG Repo-Cleaner to remove sensitive data from history.');
    recommendations.push('🔒 Implement pre-commit hooks to prevent future commits of sensitive data.');
    recommendations.push('🔄 Rotate any compromised credentials immediately.');
  } else {
    recommendations.push('✅ No sensitive data detected in recent commits. Continue following security best practices.');
  }

  return recommendations;
}

/**
 * 読みやすいMarkdownレポートを生成
 */
function generateReadableReport(data) {
  return `# 🔐 Security Audit Report

**Scan Date:** ${data.scanDate}  
**Repository:** ${data.repository}

## 📊 Summary

- **Total Commits Scanned:** ${data.summary.scannedCommits}/${data.summary.totalCommits}
- **Total Findings:** ${data.summary.totalFindings}

### Findings by Category

| Category | Count | Status |
|----------|-------|--------|
| 🔑 API Keys | ${data.summary.categories.apiKeys} | ${data.summary.categories.apiKeys > 0 ? '❌ CRITICAL' : '✅ Clean'} |
| 🗄️ Database | ${data.summary.categories.database} | ${data.summary.categories.database > 0 ? '⚠️ WARNING' : '✅ Clean'} |
| 👤 Personal Info | ${data.summary.categories.personalInfo} | ${data.summary.categories.personalInfo > 0 ? '⚠️ WARNING' : '✅ Clean'} |
| 🏗️ Infrastructure | ${data.summary.categories.infrastructure} | ${data.summary.categories.infrastructure > 0 ? '⚠️ WARNING' : '✅ Clean'} |
| 🔐 Session | ${data.summary.categories.session} | ${data.summary.categories.session > 0 ? '⚠️ WARNING' : '✅ Clean'} |
| ⚙️ Environment | ${data.summary.categories.environment} | ${data.summary.categories.environment > 0 ? 'ℹ️ INFO' : '✅ Clean'} |

## 🔍 Detailed Findings

${data.findings.length > 0 ? data.findings.map((finding, index) => `
### Finding ${index + 1}: ${finding.category}

- **File:** \`${finding.filePath}\`
- **Commit:** \`${finding.commitHash.substring(0, 8)}\`
- **Message:** ${finding.commitMessage}
- **Line:** ${finding.line}
- **Match:** \`${finding.match}\`

`).join('') : '✅ No sensitive data detected!'}

## 💡 Recommendations

${data.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🚀 Next Steps

1. **Review Findings**: Manually verify each finding to confirm it's a real security issue
2. **Remove Sensitive Data**: Use git-filter-branch or BFG Repo-Cleaner if needed
3. **Rotate Credentials**: Immediately change any exposed passwords, tokens, or keys
4. **Implement Prevention**: Add pre-commit hooks and security scanning
5. **Monitor Continuously**: Regular security audits and automated scanning

---
*Generated by Lightning Talk Circle Security Audit Tool v1.0*  
*🤖 Powered by Claude Code Assistant*
`;
}

/**
 * サマリー表示
 */
function displaySummary() {
  log('\n🎯 Security Audit Complete!', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  log(`📊 Scanned: ${auditResults.scannedCommits} recent commits`, 'blue');
  log(`🔍 Total Findings: ${auditResults.findings.length}`, auditResults.findings.length > 0 ? 'red' : 'green');

  if (auditResults.findings.length > 0) {
    log('\n📋 Findings by Category:', 'yellow');
    Object.entries(auditResults.summary).forEach(([category, count]) => {
      if (count > 0) {
        log(`  ${category}: ${count}`, 'red');
      }
    });

    log('\n⚠️  SECURITY ALERT: Sensitive data detected!', 'red');
    log('📖 Please review the generated reports for details.', 'yellow');
  } else {
    log('\n✅ No sensitive data detected in recent commits!', 'green');
  }

  log('\n📄 Reports saved:', 'cyan');
  log('  - security-audit-report.json (machine-readable)', 'cyan');
  log('  - security-audit-report.md (human-readable)', 'cyan');
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    log('🔐 Lightning Talk Circle - Security Audit', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

    // Git履歴スキャン
    await scanGitHistory();

    // 現在のワークスペーススキャン
    scanCurrentWorkspace();

    // レポート生成
    generateReport();

    // サマリー表示
    displaySummary();

  } catch (error) {
    log(`❌ Security audit failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, scanGitHistory, scanContent, generateReport };
