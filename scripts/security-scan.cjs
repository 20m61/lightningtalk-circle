#!/usr/bin/env node

/**
 * Security Vulnerability Scanner
 * Lightning Talk Circle のセキュリティ脆弱性をスキャン
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

class SecurityScanner {
  constructor() {
    this.results = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: []
    };
    this.totalFiles = 0;
    this.scannedFiles = 0;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async scanProject() {
    this.log('\n🔍 Lightning Talk Circle Security Scanner', 'blue');
    this.log('=====================================\n', 'blue');

    // 1. Check for security vulnerabilities in dependencies
    await this.scanDependencies();

    // 2. Scan source code for security issues
    await this.scanSourceCode();

    // 3. Check environment configuration
    await this.checkEnvironmentConfig();

    // 4. Verify security headers implementation
    await this.verifySecurityHeaders();

    // 5. Check authentication implementation
    await this.checkAuthentication();

    // 6. Scan for hardcoded secrets
    await this.scanForSecrets();

    // 7. Check file permissions
    await this.checkFilePermissions();

    // 8. Generate report
    this.generateReport();
  }

  async scanDependencies() {
    this.log('\n📦 Scanning Dependencies...', 'yellow');

    try {
      // Run npm audit
      const { stdout } = await execAsync('npm audit --json');
      const audit = JSON.parse(stdout);

      if (audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        this.log(`Found ${vulns.total} vulnerabilities:`, vulns.total > 0 ? 'red' : 'green');
        this.log(`  Critical: ${vulns.critical}`, vulns.critical > 0 ? 'red' : 'green');
        this.log(`  High: ${vulns.high}`, vulns.high > 0 ? 'red' : 'green');
        this.log(`  Moderate: ${vulns.moderate}`, vulns.moderate > 0 ? 'yellow' : 'green');
        this.log(`  Low: ${vulns.low}`, 'green');

        if (vulns.critical > 0) {
          this.results.critical.push({
            type: 'dependencies',
            message: `${vulns.critical} critical vulnerabilities in dependencies`,
            recommendation: 'Run "npm audit fix" to fix vulnerabilities'
          });
        }
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      this.log('  ⚠️  npm audit found issues (this is expected)', 'yellow');
    }

    // Check for outdated packages
    try {
      const { stdout } = await execAsync('npm outdated --json');
      const outdated = JSON.parse(stdout || '{}');
      const outdatedCount = Object.keys(outdated).length;

      if (outdatedCount > 0) {
        this.results.info.push({
          type: 'dependencies',
          message: `${outdatedCount} outdated packages found`,
          recommendation: 'Consider updating packages to latest versions'
        });
      }
    } catch (error) {
      // npm outdated returns non-zero exit code when outdated packages exist
      this.log('  ℹ️  Some packages are outdated', 'yellow');
    }
  }

  async scanSourceCode() {
    this.log('\n🔍 Scanning Source Code...', 'yellow');

    const patterns = [
      {
        pattern: /eval\s*\(/g,
        severity: 'high',
        message: 'Use of eval() detected',
        recommendation: 'Avoid using eval() as it can execute arbitrary code'
      },
      {
        pattern: /innerHTML\s*=/g,
        severity: 'medium',
        message: 'Direct innerHTML assignment detected',
        recommendation: 'Use textContent or sanitize HTML before assignment'
      },
      {
        pattern: /document\.write/g,
        severity: 'medium',
        message: 'document.write usage detected',
        recommendation: 'Use DOM manipulation methods instead'
      },
      {
        pattern: /localStorage\.(setItem|getItem)/g,
        severity: 'low',
        message: 'localStorage usage detected',
        recommendation: 'Ensure sensitive data is not stored in localStorage'
      },
      {
        pattern: /console\.(log|error|warn)/g,
        severity: 'info',
        message: 'Console logging detected',
        recommendation: 'Remove console logs in production'
      },
      {
        pattern: /password\s*[:=]\s*["'][^"']+["']/gi,
        severity: 'critical',
        message: 'Hardcoded password detected',
        recommendation: 'Use environment variables for passwords'
      }
    ];

    const filesToScan = await this.getFilesToScan();
    this.totalFiles = filesToScan.length;

    for (const file of filesToScan) {
      await this.scanFile(file, patterns);
      this.scannedFiles++;

      if (this.scannedFiles % 10 === 0) {
        process.stdout.write(`\r  Progress: ${this.scannedFiles}/${this.totalFiles} files scanned`);
      }
    }

    process.stdout.write(
      `\r  ✓ Scanned ${this.scannedFiles} files                                    \n`
    );
  }

  async getFilesToScan() {
    const files = [];
    const directories = ['server', 'public', 'scripts'];

    for (const dir of directories) {
      if (await this.fileExists(dir)) {
        await this.walkDirectory(dir, files);
      }
    }

    return files.filter(
      file =>
        file.endsWith('.js') ||
        file.endsWith('.mjs') ||
        file.endsWith('.ts') ||
        file.endsWith('.jsx') ||
        file.endsWith('.tsx')
    );
  }

  async walkDirectory(dir, files) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await this.walkDirectory(fullPath, files);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  async scanFile(filePath, patterns) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');

      for (const { pattern, severity, message, recommendation } of patterns) {
        const matches = content.matchAll(pattern);

        for (const match of matches) {
          const lineNumber = content.substring(0, match.index).split('\n').length;

          this.results[severity].push({
            type: 'code',
            file: filePath,
            line: lineNumber,
            message,
            recommendation,
            snippet: lines[lineNumber - 1]?.trim()
          });
        }
      }
    } catch (error) {
      // Ignore file read errors
    }
  }

  async checkEnvironmentConfig() {
    this.log('\n🔐 Checking Environment Configuration...', 'yellow');

    // Check .env file
    if (await this.fileExists('.env')) {
      const envContent = await fs.readFile('.env', 'utf8');

      // Check for weak secrets
      if (envContent.includes('JWT_SECRET=') && !envContent.match(/JWT_SECRET=.{32,}/)) {
        this.results.high.push({
          type: 'config',
          message: 'Weak JWT_SECRET detected',
          recommendation: 'Use a JWT_SECRET with at least 32 characters'
        });
      }

      if (envContent.includes('SESSION_SECRET=') && !envContent.match(/SESSION_SECRET=.{64,}/)) {
        this.results.high.push({
          type: 'config',
          message: 'Weak SESSION_SECRET detected',
          recommendation: 'Use a SESSION_SECRET with at least 64 characters'
        });
      }

      // Check for exposed .env in git
      try {
        await execAsync('git ls-files | grep -q "^\\.env$"');
        this.results.critical.push({
          type: 'config',
          message: '.env file is tracked in git',
          recommendation: 'Remove .env from git and add to .gitignore'
        });
      } catch (error) {
        // .env is not in git (good)
      }
    }

    this.log('  ✓ Environment configuration checked', 'green');
  }

  async verifySecurityHeaders() {
    this.log('\n🛡️  Verifying Security Headers...', 'yellow');

    const requiredHeaders = [
      'helmet',
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Strict-Transport-Security'
    ];

    try {
      const appFile = await fs.readFile('server/app.js', 'utf8');

      for (const header of requiredHeaders) {
        if (!appFile.includes(header)) {
          this.results.medium.push({
            type: 'headers',
            message: `${header} might not be configured`,
            recommendation: `Ensure ${header} is properly configured`
          });
        }
      }

      this.log('  ✓ Security headers verification complete', 'green');
    } catch (error) {
      this.results.high.push({
        type: 'headers',
        message: 'Could not verify security headers',
        recommendation: 'Ensure security headers are properly configured'
      });
    }
  }

  async checkAuthentication() {
    this.log('\n🔑 Checking Authentication...', 'yellow');

    const authFiles = [
      'server/middleware/auth.js',
      'server/middleware/auth.mjs',
      'server/services/auth-service.js'
    ];

    let authImplemented = false;

    for (const file of authFiles) {
      if (await this.fileExists(file)) {
        authImplemented = true;
        const content = await fs.readFile(file, 'utf8');

        // Check for common auth issues
        if (!content.includes('bcrypt') && !content.includes('argon2')) {
          this.results.high.push({
            type: 'auth',
            message: 'Password hashing library not detected',
            recommendation: 'Use bcrypt or argon2 for password hashing'
          });
        }

        if (content.includes('md5') || content.includes('sha1')) {
          this.results.critical.push({
            type: 'auth',
            message: 'Weak hashing algorithm detected',
            recommendation: 'Replace MD5/SHA1 with bcrypt or argon2'
          });
        }
      }
    }

    if (!authImplemented) {
      this.results.info.push({
        type: 'auth',
        message: 'No authentication middleware detected',
        recommendation: 'Implement authentication if needed'
      });
    }

    this.log('  ✓ Authentication check complete', 'green');
  }

  async scanForSecrets() {
    this.log('\n🔍 Scanning for Hardcoded Secrets...', 'yellow');

    const secretPatterns = [
      {
        pattern:
          /[aA][wW][sS]_?[sS][eE][cC][rR][eE][tT]_?[aA][cC][cC][eE][sS][sS]_?[kK][eE][yY]\s*[:=]\s*["'][A-Za-z0-9/+=]{40}["']/g,
        type: 'AWS Secret Key'
      },
      {
        pattern:
          /[aA][wW][sS]_?[aA][cC][cC][eE][sS][sS]_?[kK][eE][yY]_?[iI][dD]\s*[:=]\s*["'][A-Z0-9]{20}["']/g,
        type: 'AWS Access Key'
      },
      {
        pattern: /[aA][pP][iI]_?[kK][eE][yY]\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/g,
        type: 'API Key'
      },
      {
        pattern: /[pP][rR][iI][vV][aA][tT][eE]_?[kK][eE][yY]\s*[:=]\s*["']-----BEGIN/g,
        type: 'Private Key'
      }
    ];

    const files = await this.getFilesToScan();
    let secretsFound = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');

        for (const { pattern, type } of secretPatterns) {
          if (pattern.test(content)) {
            secretsFound++;
            this.results.critical.push({
              type: 'secrets',
              file,
              message: `Potential ${type} found`,
              recommendation: 'Move secrets to environment variables'
            });
          }
        }
      } catch (error) {
        // Ignore file read errors
      }
    }

    this.log(
      `  ✓ Secret scan complete (${secretsFound} potential issues found)`,
      secretsFound > 0 ? 'red' : 'green'
    );
  }

  async checkFilePermissions() {
    this.log('\n📁 Checking File Permissions...', 'yellow');

    const sensitiveDirs = ['.env', 'server/config', 'server/data'];

    for (const path of sensitiveDirs) {
      if (await this.fileExists(path)) {
        try {
          const stats = await fs.stat(path);
          const mode = (stats.mode & parseInt('777', 8)).toString(8);

          if (mode !== '600' && mode !== '700' && mode !== '640' && mode !== '750') {
            this.results.medium.push({
              type: 'permissions',
              message: `${path} has permissive file permissions (${mode})`,
              recommendation: 'Restrict permissions to owner only (chmod 600 or 700)'
            });
          }
        } catch (error) {
          // Ignore permission check errors
        }
      }
    }

    this.log('  ✓ File permissions check complete', 'green');
  }

  async fileExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  generateReport() {
    this.log('\n📊 Security Scan Report', 'blue');
    this.log('======================\n', 'blue');

    const severities = ['critical', 'high', 'medium', 'low', 'info'];
    let totalIssues = 0;

    for (const severity of severities) {
      const issues = this.results[severity];
      if (issues.length > 0) {
        totalIssues += issues.length;
        this.log(
          `\n${this.getSeverityIcon(severity)} ${severity.toUpperCase()} (${issues.length})`,
          this.getSeverityColor(severity)
        );

        for (const issue of issues.slice(0, 5)) {
          // Show first 5 issues per severity
          this.log(`\n  Issue: ${issue.message}`);
          if (issue.file) {
            this.log(`  File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
          }
          if (issue.snippet) {
            this.log(`  Code: ${issue.snippet.substring(0, 60)}...`);
          }
          this.log(`  Fix: ${issue.recommendation}`, 'green');
        }

        if (issues.length > 5) {
          this.log(`\n  ... and ${issues.length - 5} more ${severity} issues`, 'yellow');
        }
      }
    }

    this.log('\n📈 Summary', 'blue');
    this.log('==========', 'blue');
    this.log(`Total Issues Found: ${totalIssues}`);
    this.log(
      `Critical: ${this.results.critical.length}`,
      this.results.critical.length > 0 ? 'red' : 'green'
    );
    this.log(`High: ${this.results.high.length}`, this.results.high.length > 0 ? 'red' : 'green');
    this.log(
      `Medium: ${this.results.medium.length}`,
      this.results.medium.length > 0 ? 'yellow' : 'green'
    );
    this.log(`Low: ${this.results.low.length}`, 'green');
    this.log(`Info: ${this.results.info.length}`, 'blue');

    // Security score
    const score = this.calculateSecurityScore();
    this.log(
      `\n🏆 Security Score: ${score}/100`,
      score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'
    );

    // Recommendations
    this.log('\n💡 Top Recommendations:', 'blue');
    const recommendations = this.getTopRecommendations();
    recommendations.forEach((rec, index) => {
      this.log(`${index + 1}. ${rec}`);
    });

    // Save detailed report
    this.saveDetailedReport();
  }

  getSeverityIcon(severity) {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️',
      info: '💡'
    };
    return icons[severity] || '•';
  }

  getSeverityColor(severity) {
    const colors = {
      critical: 'red',
      high: 'red',
      medium: 'yellow',
      low: 'green',
      info: 'blue'
    };
    return colors[severity] || 'reset';
  }

  calculateSecurityScore() {
    const weights = {
      critical: -20,
      high: -10,
      medium: -5,
      low: -2,
      info: -1
    };

    let score = 100;

    for (const [severity, weight] of Object.entries(weights)) {
      score += this.results[severity].length * weight;
    }

    return Math.max(0, Math.min(100, score));
  }

  getTopRecommendations() {
    const recommendations = [];

    if (this.results.critical.length > 0) {
      recommendations.push('Fix all critical security issues immediately');
    }

    if (this.results.high.find(issue => issue.type === 'dependencies')) {
      recommendations.push('Run "npm audit fix" to fix dependency vulnerabilities');
    }

    if (this.results.high.find(issue => issue.type === 'config')) {
      recommendations.push('Strengthen your JWT and session secrets');
    }

    if (this.results.critical.find(issue => issue.type === 'secrets')) {
      recommendations.push('Remove all hardcoded secrets and use environment variables');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring for security updates');
      recommendations.push('Regularly update dependencies');
      recommendations.push('Perform periodic security audits');
    }

    return recommendations.slice(0, 5);
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      score: this.calculateSecurityScore(),
      summary: {
        critical: this.results.critical.length,
        high: this.results.high.length,
        medium: this.results.medium.length,
        low: this.results.low.length,
        info: this.results.info.length
      },
      issues: this.results,
      recommendations: this.getTopRecommendations()
    };

    try {
      await fs.writeFile('security-scan-report.json', JSON.stringify(report, null, 2));
      this.log('\n📄 Detailed report saved to security-scan-report.json', 'green');
    } catch (error) {
      this.log('\n❌ Failed to save detailed report', 'red');
    }
  }
}

// Run the scanner
const scanner = new SecurityScanner();
scanner.scanProject().catch(error => {
  console.error('Security scan failed:', error);
  process.exit(1);
});
