#!/usr/bin/env node
/**
 * Lightning Talk Circle - Filtered Security Audit
 * 偽陽性を排除した精密なセキュリティスキャン
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 実際の機密情報パターン（偽陽性を排除）
const SENSITIVE_PATTERNS = {
  // 本物のAPI キーのパターン
  realApiKeys: [
    /\bAKIA[0-9A-Z]{16}\b/g,                     // AWS Access Key
    /\bghp_[a-zA-Z0-9]{36}\b/g,                 // GitHub Personal Access Token
    /\bgho_[a-zA-Z0-9]{36}\b/g,                 // GitHub OAuth Token
    /\bghs_[a-zA-Z0-9]{36}\b/g,                 // GitHub App Token
    /\bghr_[a-zA-Z0-9]{36}\b/g,                 // GitHub Refresh Token
    /\bsk-[a-zA-Z0-9]{48}\b/g,                  // OpenAI API Key
    /\bxoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/g, // Slack Bot Token (precise)
    /\bxoxp-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/g, // Slack User Token (precise)
    /\bAIza[0-9A-Za-z\-_]{35}\b/g,              // Google API Key
    /[0-9]{12}-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g, // Google OAuth Client ID
  ],

  // データベース認証情報
  databaseCredentials: [
    /mongodb:\/\/[a-zA-Z0-9_]+:[^@\s]+@[^\/\s]+/g,  // MongoDB URI with credentials
    /postgres:\/\/[a-zA-Z0-9_]+:[^@\s]+@[^\/\s]+/g, // PostgreSQL URI with credentials
    /mysql:\/\/[a-zA-Z0-9_]+:[^@\s]+@[^\/\s]+/g,    // MySQL URI with credentials
    /password\s*[:=]\s*["'][^"']{8,}["']/gi,        // Strong passwords (8+ chars)
    /DATABASE_PASSWORD\s*[:=]\s*["'][^"']+["']/gi,  // Database password env vars
    /DB_PASS\s*[:=]\s*["'][^"']+["']/gi,            // Database password env vars
  ],

  // 実際の個人情報（日本の形式）
  personalInfo: [
    /[a-zA-Z0-9._%+-]+@(?!example|test|noreply|mock)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Real emails (excluding examples)
    /\b0[789]0-\d{4}-\d{4}\b/g,                    // Japanese mobile numbers
    /\b\d{3}-\d{4}-\d{4}\b/g,                     // Japanese phone numbers
    /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g,              // Credit card numbers
    /〒\d{3}-\d{4}/g,                              // Japanese postal codes
    /\b[0-9]{6}-[0-9]{6}\b/g,                     // Japanese ID patterns
  ],

  // 実際のサーバー・インフラ情報
  infrastructureInfo: [
    /https?:\/\/(?!localhost|127\.0\.0\.1|example)[a-zA-Z0-9.-]+\.amazonaws\.com[^\s]*/g, // Real AWS URLs
    /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, // Real IP addresses (excluding common test IPs)
    /-----BEGIN (RSA )?PRIVATE KEY-----[\s\S]*?-----END (RSA )?PRIVATE KEY-----/g, // Private keys
    /ssh-rsa AAAA[0-9A-Za-z+/]+[=]{0,3}( [^@]+@[^@]+)?/g, // SSH public keys
  ],

  // 実際の機密環境変数
  sensitiveEnvVars: [
    /JWT_SECRET\s*[:=]\s*["'][^"']{16,}["']/gi,    // JWT secrets (16+ chars)
    /SESSION_SECRET\s*[:=]\s*["'][^"']{16,}["']/gi, // Session secrets (16+ chars)
    /ENCRYPTION_KEY\s*[:=]\s*["'][^"']{16,}["']/gi, // Encryption keys
    /PRIVATE_KEY\s*[:=]\s*["'][^"']{16,}["']/gi,   // Private keys
    /API_SECRET\s*[:=]\s*["'][^"']{16,}["']/gi,    // API secrets
  ]
};

// より精密なホワイトリスト
const ENHANCED_WHITELIST = [
  // テスト・サンプル値
  'example@example.com', 'test@test.com', 'noreply@example.com',
  'admin@example.com', 'user@example.com', 'demo@demo.com',
  'localhost', '127.0.0.1', '0.0.0.0', '192.168.', '10.0.0.',
  'example.com', 'test.com', 'demo.com', 'localhost.com',
  
  // プレースホルダー
  'your_token_here', 'your_secret_here', 'your_key_here',
  'changeme', 'replace_with_actual', 'placeholder',
  'dummy', 'sample', 'mock', 'fake', 'test',
  
  // 開発環境の値
  'development_secret', 'test_secret', 'local_secret',
  'dev_token', 'test_token', 'mock_token',
  
  // 特定の安全な値
  'noreply@anthropic.com', 'lightningtalk.example.com',
  'なんでもライトニングトーク',
  
  // package-lock.json のハッシュパターンを除外
  'integrity', 'resolved', 'version',
];

const auditResults = {
  totalCommits: 0,
  scannedCommits: 0,
  findings: [],
  summary: {
    realApiKeys: 0,
    databaseCredentials: 0,
    personalInfo: 0,
    infrastructureInfo: 0,
    sensitiveEnvVars: 0
  }
};

/**
 * ファイルパスが除外すべきファイルかどうか判定
 */
function shouldExcludeFile(filePath) {
  const excludePatterns = [
    /package-lock\.json$/,        // npm lock files
    /yarn\.lock$/,                // yarn lock files
    /node_modules\//,             // dependencies
    /\.git\//,                    // git directory
    /dist\//,                     // build output
    /build\//,                    // build output
    /coverage\//,                 // test coverage
    /\.log$/,                     // log files
    /\.(png|jpg|jpeg|gif|ico|svg|webp|pdf|zip|tar|gz)$/i, // binary files
  ];
  
  return excludePatterns.some(pattern => pattern.test(filePath));
}

/**
 * より精密なホワイトリストチェック
 */
function isWhitelistedEnhanced(value, filePath, context) {
  const cleanValue = value.toLowerCase().trim();
  
  // package-lock.json のハッシュ値を除外
  if (filePath.includes('package-lock.json') && /^[A-Za-z0-9+/=]{20,}$/.test(value)) {
    return true;
  }
  
  // テストファイル内の値を除外
  if (filePath.includes('test') || filePath.includes('spec') || filePath.includes('mock')) {
    return true;
  }
  
  // ホワイトリストの値をチェック
  return ENHANCED_WHITELIST.some(whiteItem => 
    cleanValue.includes(whiteItem.toLowerCase()) || 
    whiteItem.toLowerCase().includes(cleanValue) ||
    value.includes(whiteItem)
  );
}

/**
 * コンテンツスキャン（精密版）
 */
function scanContentEnhanced(content, commitHash, filePath, commitMessage) {
  const findings = [];
  
  // 除外ファイルはスキャンしない
  if (shouldExcludeFile(filePath)) {
    return findings;
  }

  Object.entries(SENSITIVE_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // 精密なホワイトリストチェック
          if (!isWhitelistedEnhanced(match, filePath, content)) {
            findings.push({
              category,
              pattern: pattern.toString(),
              match: match.substring(0, 100),
              commitHash,
              filePath,
              commitMessage: commitMessage.substring(0, 100),
              context: getContextAroundMatch(content, match, 2)
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
 * マッチ周辺のコンテキストを取得
 */
function getContextAroundMatch(content, match, linesAround = 2) {
  const matchIndex = content.indexOf(match);
  if (matchIndex === -1) return '';
  
  const beforeContent = content.substring(0, matchIndex);
  const afterContent = content.substring(matchIndex + match.length);
  
  const beforeLines = beforeContent.split('\n').slice(-linesAround);
  const afterLines = afterContent.split('\n').slice(0, linesAround);
  
  return [...beforeLines, `>>> ${match} <<<`, ...afterLines].join('\n');
}

/**
 * 現在のワークスペースの詳細スキャン
 */
function scanWorkspaceDetailed() {
  log('📂 Detailed workspace scan...', 'blue');
  
  const sensitiveFiles = [
    '.env', '.env.local', '.env.production', '.env.development',
    'config.json', 'config.js', 'config.ts',
    '.aws/credentials', '.ssh/config',
    'secrets.json', 'private.key', 'id_rsa'
  ];
  
  sensitiveFiles.forEach(file => {
    if (existsSync(file)) {
      try {
        const content = readFileSync(file, 'utf8');
        const findings = scanContentEnhanced(content, 'WORKSPACE', file, 'Current workspace');
        auditResults.findings.push(...findings);
        log(`🔎 Scanned: ${file} (${findings.length} findings)`, findings.length > 0 ? 'red' : 'green');
      } catch (error) {
        log(`⚠️ Could not read ${file}`, 'yellow');
      }
    }
  });
}

/**
 * Git履歴の精密スキャン
 */
async function scanGitHistoryPrecise() {
  log('🔍 Precise Git history scan (recent 50 commits)...', 'blue');
  
  const commitHashes = execSync('git rev-list --all -n 50', { 
    encoding: 'utf8' 
  }).trim().split('\n');

  auditResults.totalCommits = commitHashes.length;
  
  for (let i = 0; i < commitHashes.length; i++) {
    const commitHash = commitHashes[i];
    
    if (i % 10 === 0) {
      log(`📈 Progress: ${i}/${commitHashes.length}`, 'yellow');
    }

    try {
      const commitInfo = execSync(`git show --pretty=format:"%s" -s ${commitHash}`, { 
        encoding: 'utf8' 
      }).trim();

      const changedFiles = getChangedFiles(commitHash);
      
      for (const filePath of changedFiles) {
        // 機密情報を含む可能性のあるファイルのみスキャン
        if (isSensitiveFile(filePath) && !shouldExcludeFile(filePath)) {
          const content = getFileContentAtCommit(commitHash, filePath);
          if (content) {
            const findings = scanContentEnhanced(content, commitHash, filePath, commitInfo);
            auditResults.findings.push(...findings);
          }
        }
      }

      auditResults.scannedCommits++;
    } catch (error) {
      // エラーを静かに処理
    }
  }
}

/**
 * ヘルパー関数群
 */
function getChangedFiles(commitHash) {
  try {
    const result = execSync(`git show --pretty="" --name-only ${commitHash}`, { 
      encoding: 'utf8', stdio: 'pipe' 
    });
    return result.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    return [];
  }
}

function getFileContentAtCommit(commitHash, filePath) {
  try {
    const result = execSync(`git show ${commitHash}:${filePath}`, { 
      encoding: 'utf8', stdio: 'pipe' 
    });
    return result;
  } catch (error) {
    return null;
  }
}

function isSensitiveFile(filePath) {
  const sensitivePatterns = [
    /\.env/, /config/, /secret/, /credential/, /key/, /token/, /password/, /auth/,
    /\.json$/, /\.js$/, /\.ts$/, /\.yaml$/, /\.yml$/, /\.toml$/, /\.ini$/
  ];
  return sensitivePatterns.some(pattern => pattern.test(filePath.toLowerCase()));
}

/**
 * 精密レポート生成
 */
function generatePreciseReport() {
  const reportData = {
    scanDate: new Date().toISOString(),
    repository: process.cwd(),
    scanType: 'PRECISE_FILTERED',
    summary: {
      totalCommits: auditResults.totalCommits,
      scannedCommits: auditResults.scannedCommits,
      totalFindings: auditResults.findings.length,
      categories: auditResults.summary,
      falsePositivesFiltered: true
    },
    findings: auditResults.findings,
    recommendations: generatePreciseRecommendations()
  };

  // JSONレポート
  writeFileSync('security-audit-precise.json', JSON.stringify(reportData, null, 2));
  
  // 人間が読めるレポート
  const readableReport = generatePreciseMarkdownReport(reportData);
  writeFileSync('security-audit-precise.md', readableReport);
  
  return reportData;
}

function generatePreciseRecommendations() {
  const recommendations = [];
  
  if (auditResults.findings.length === 0) {
    recommendations.push('✅ No real sensitive data detected in recent commits.');
    recommendations.push('🔒 Continue following security best practices.');
    recommendations.push('📋 Consider regular security audits.');
  } else {
    if (auditResults.summary.realApiKeys > 0) {
      recommendations.push('🚨 CRITICAL: Real API keys detected! Rotate immediately.');
    }
    if (auditResults.summary.databaseCredentials > 0) {
      recommendations.push('⚠️ Database credentials found. Move to secure storage.');
    }
    if (auditResults.summary.personalInfo > 0) {
      recommendations.push('👤 Personal information detected. Review data handling policies.');
    }
    if (auditResults.summary.infrastructureInfo > 0) {
      recommendations.push('🏗️ Infrastructure details exposed. Review access controls.');
    }
    if (auditResults.summary.sensitiveEnvVars > 0) {
      recommendations.push('⚙️ Sensitive environment variables found. Use secret management.');
    }
  }
  
  recommendations.push('🔧 Implement pre-commit hooks with security scanning.');
  recommendations.push('📊 Schedule regular automated security audits.');
  
  return recommendations;
}

function generatePreciseMarkdownReport(data) {
  const statusIcon = data.summary.totalFindings > 0 ? '⚠️' : '✅';
  const statusText = data.summary.totalFindings > 0 ? 'FINDINGS DETECTED' : 'CLEAN';
  
  return `# 🔐 Precise Security Audit Report

${statusIcon} **Status: ${statusText}**  
**Scan Date:** ${data.scanDate}  
**Repository:** ${data.repository}  
**Scan Type:** Filtered (False positives removed)

## 📊 Executive Summary

- **Commits Scanned:** ${data.summary.scannedCommits}/${data.summary.totalCommits}
- **Total Findings:** ${data.summary.totalFindings}
- **False Positives Filtered:** Yes (package-lock.json hashes, test data, etc.)

### Findings by Category

| Category | Count | Risk Level |
|----------|-------|------------|
| 🚨 Real API Keys | ${data.summary.categories.realApiKeys || 0} | ${(data.summary.categories.realApiKeys || 0) > 0 ? '**CRITICAL**' : '✅ Clean'} |
| 🗄️ Database Credentials | ${data.summary.categories.databaseCredentials || 0} | ${(data.summary.categories.databaseCredentials || 0) > 0 ? '**HIGH**' : '✅ Clean'} |
| 👤 Personal Info | ${data.summary.categories.personalInfo || 0} | ${(data.summary.categories.personalInfo || 0) > 0 ? '**MEDIUM**' : '✅ Clean'} |
| 🏗️ Infrastructure Info | ${data.summary.categories.infrastructureInfo || 0} | ${(data.summary.categories.infrastructureInfo || 0) > 0 ? '**MEDIUM**' : '✅ Clean'} |
| ⚙️ Sensitive Env Vars | ${data.summary.categories.sensitiveEnvVars || 0} | ${(data.summary.categories.sensitiveEnvVars || 0) > 0 ? '**LOW**' : '✅ Clean'} |

## 🔍 Detailed Findings

${data.findings.length > 0 ? data.findings.map((finding, index) => `
### Finding ${index + 1}: ${finding.category}

- **File:** \`${finding.filePath}\`
- **Commit:** \`${finding.commitHash.substring(0, 8)}\`
- **Message:** ${finding.commitMessage}
- **Match:** \`${finding.match}\`
- **Context:**
\`\`\`
${finding.context}
\`\`\`

`).join('') : '✅ No sensitive data detected after filtering false positives!'}

## 💡 Recommendations

${data.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit .env files with real values
2. **API Keys**: Use environment variables and secret management services
3. **Database Credentials**: Use connection strings with environment variables
4. **Pre-commit Hooks**: Implement automated security scanning
5. **Regular Audits**: Schedule monthly security reviews

---
*Generated by Lightning Talk Circle Precise Security Audit v2.0*  
*🤖 Powered by Claude Code Assistant*  
*⚡ False positives filtered for accuracy*
`;
}

/**
 * 結果表示
 */
function displayPreciseResults() {
  log('\n🎯 Precise Security Audit Complete!', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  log(`📊 Scanned: ${auditResults.scannedCommits} recent commits`, 'blue');
  log(`🔍 Findings: ${auditResults.findings.length} (false positives filtered)`, 
      auditResults.findings.length > 0 ? 'red' : 'green');
  
  if (auditResults.findings.length > 0) {
    log('\n⚠️ SECURITY ISSUES DETECTED:', 'red');
    Object.entries(auditResults.summary).forEach(([category, count]) => {
      if (count > 0) {
        const riskLevel = category === 'realApiKeys' ? 'CRITICAL' : 
                         category === 'databaseCredentials' ? 'HIGH' : 'MEDIUM';
        log(`  ${category}: ${count} (${riskLevel})`, 'red');
      }
    });
  } else {
    log('\n✅ Repository is SECURE!', 'green');
    log('No real sensitive data found in recent commits.', 'green');
  }
  
  log('\n📄 Detailed reports:', 'cyan');
  log('  - security-audit-precise.json', 'cyan');
  log('  - security-audit-precise.md', 'cyan');
}

/**
 * メイン実行
 */
async function main() {
  try {
    log('🔐 Lightning Talk Circle - Precise Security Audit', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    // 精密Git履歴スキャン
    await scanGitHistoryPrecise();
    
    // ワークスペース詳細スキャン
    scanWorkspaceDetailed();
    
    // レポート生成
    const report = generatePreciseReport();
    
    // 結果表示
    displayPreciseResults();
    
    return report;
    
  } catch (error) {
    log(`❌ Precise security audit failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };