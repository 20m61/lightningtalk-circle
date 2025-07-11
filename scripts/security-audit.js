#!/usr/bin/env node

/**
 * Security Audit Script
 * Performs comprehensive security checks on the Lightning Talk Circle application
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { spawn } from 'child_process';

class SecurityAuditor {
  constructor() {
    this.results = {
      vulnerabilities: [],
      warnings: [],
      info: [],
      passed: []
    };
  }

  async runAudit() {
    console.log('🔒 Starting Security Audit for Lightning Talk Circle\n');

    // 1. Dependency vulnerabilities
    await this.checkDependencies();

    // 2. Code security patterns
    await this.checkCodePatterns();

    // 3. Environment configuration
    await this.checkEnvironmentConfig();

    // 4. Authentication & Authorization
    await this.checkAuthSecurity();

    // 5. Input validation
    await this.checkInputValidation();

    // 6. HTTPS and security headers
    await this.checkSecurityHeaders();

    // 7. Sensitive data exposure
    await this.checkSensitiveData();

    // 8. Rate limiting
    await this.checkRateLimiting();

    // Generate report
    this.generateReport();
  }

  async checkDependencies() {
    console.log('📦 Checking dependency vulnerabilities...');

    try {
      const result = await this.runCommand('npm', ['audit', '--json']);
      const audit = JSON.parse(result);

      if (audit.metadata.vulnerabilities.total > 0) {
        this.results.vulnerabilities.push({
          type: 'dependencies',
          severity: 'high',
          message: `Found ${audit.metadata.vulnerabilities.total} vulnerabilities in dependencies`,
          details: audit.metadata.vulnerabilities
        });
      } else {
        this.results.passed.push('No known vulnerabilities in dependencies');
      }
    } catch (error) {
      this.results.warnings.push({
        type: 'dependencies',
        message: 'Could not check dependencies',
        error: error.message
      });
    }
  }

  async checkCodePatterns() {
    console.log('🔍 Scanning code for security patterns...');

    const patterns = [
      // SQL Injection risks
      {
        pattern: /query\s*\(\s*['"`].*\$\{.*\}.*['"`]\s*\)/,
        risk: 'Potential SQL injection',
        severity: 'critical'
      },
      {
        pattern: /query\s*\(\s*['"`].*\+.*['"`]\s*\)/,
        risk: 'Potential SQL injection',
        severity: 'critical'
      },

      // Command injection
      { pattern: /exec\s*\(.*\$\{.*\}/, risk: 'Potential command injection', severity: 'critical' },
      {
        pattern: /spawn\s*\(.*\$\{.*\}/,
        risk: 'Potential command injection',
        severity: 'critical'
      },

      // Path traversal
      { pattern: /\.\.\//, risk: 'Potential path traversal', severity: 'high' },

      // Hardcoded secrets
      {
        pattern: /password\s*=\s*['"`][^'"`]{8,}['"`]/i,
        risk: 'Hardcoded password',
        severity: 'critical'
      },
      {
        pattern: /api_?key\s*=\s*['"`][^'"`]+['"`]/i,
        risk: 'Hardcoded API key',
        severity: 'critical'
      },
      {
        pattern: /secret\s*=\s*['"`][^'"`]+['"`]/i,
        risk: 'Hardcoded secret',
        severity: 'critical'
      },

      // Unsafe random
      {
        pattern: /Math\.random\(\).*(?:password|token|secret)/i,
        risk: 'Weak random for security',
        severity: 'high'
      },

      // eval usage
      { pattern: /eval\s*\(/, risk: 'Use of eval()', severity: 'high' },

      // Direct DOM manipulation with user input
      { pattern: /innerHTML\s*=.*\$\{/, risk: 'Potential XSS via innerHTML', severity: 'high' },
      { pattern: /document\.write\s*\(/, risk: 'Use of document.write', severity: 'medium' }
    ];

    const files = this.getJavaScriptFiles('./server');
    let issuesFound = 0;

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split('\n');

      patterns.forEach(({ pattern, risk, severity }) => {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            this.results.vulnerabilities.push({
              type: 'code-pattern',
              severity,
              file,
              line: index + 1,
              risk,
              code: line.trim()
            });
            issuesFound++;
          }
        });
      });
    }

    if (issuesFound === 0) {
      this.results.passed.push('No dangerous code patterns detected');
    }
  }

  async checkEnvironmentConfig() {
    console.log('⚙️  Checking environment configuration...');

    // Check if .env exists
    try {
      const envContent = readFileSync('.env', 'utf8');

      // Check for default/weak values
      if (
        envContent.includes('JWT_SECRET=development') ||
        envContent.includes('JWT_SECRET=secret') ||
        envContent.includes('JWT_SECRET=123')
      ) {
        this.results.vulnerabilities.push({
          type: 'config',
          severity: 'critical',
          message: 'Weak JWT_SECRET detected in .env'
        });
      }

      // Check if production credentials are exposed
      if (envContent.includes('AWS_ACCESS_KEY') || envContent.includes('GITHUB_TOKEN')) {
        this.results.warnings.push({
          type: 'config',
          message: 'Production credentials found in .env file'
        });
      }
    } catch (error) {
      // .env doesn't exist - this is good for production
      this.results.passed.push('No .env file in repository (good for production)');
    }

    // Check for proper environment variable usage
    const serverFiles = this.getJavaScriptFiles('./server');
    let hardcodedEnvVars = 0;

    for (const file of serverFiles) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('process.env.NODE_ENV === "production"')) {
        this.results.passed.push(`Proper environment checking in ${file}`);
      }
    }
  }

  async checkAuthSecurity() {
    console.log('🔐 Checking authentication security...');

    // Check JWT implementation
    const authFile = './server/middleware/auth.js';
    try {
      const content = readFileSync(authFile, 'utf8');

      // Check for secure JWT practices
      if (!content.includes('expiresIn')) {
        this.results.warnings.push({
          type: 'auth',
          message: 'JWT tokens might not have expiration'
        });
      }

      if (content.includes('HS256')) {
        this.results.info.push({
          type: 'auth',
          message: 'Using HS256 for JWT (consider RS256 for better security)'
        });
      }

      // Check password hashing
      if (content.includes('bcrypt')) {
        this.results.passed.push('Using bcrypt for password hashing');
      }

      // Check for proper error messages
      if (content.includes('Invalid username or password')) {
        this.results.passed.push('Generic error messages for auth failures');
      }
    } catch (error) {
      this.results.warnings.push({
        type: 'auth',
        message: 'Could not analyze auth middleware'
      });
    }
  }

  async checkInputValidation() {
    console.log('✓ Checking input validation...');

    const validationFiles = [
      './server/middleware/validation-rules.js',
      './server/utils/sanitizer.js'
    ];

    let hasValidation = false;
    let hasSanitization = false;

    for (const file of validationFiles) {
      try {
        const content = readFileSync(file, 'utf8');

        if (content.includes('express-validator')) {
          hasValidation = true;
          this.results.passed.push('Using express-validator for input validation');
        }

        if (content.includes('DOMPurify') || content.includes('sanitize')) {
          hasSanitization = true;
          this.results.passed.push('Input sanitization implemented');
        }
      } catch (error) {
        // File doesn't exist
      }
    }

    if (!hasValidation) {
      this.results.vulnerabilities.push({
        type: 'input-validation',
        severity: 'high',
        message: 'No input validation library detected'
      });
    }

    if (!hasSanitization) {
      this.results.vulnerabilities.push({
        type: 'input-validation',
        severity: 'high',
        message: 'No input sanitization detected'
      });
    }
  }

  async checkSecurityHeaders() {
    console.log('🛡️  Checking security headers...');

    const appFile = './server/app.js';
    try {
      const content = readFileSync(appFile, 'utf8');

      // Check for Helmet
      if (content.includes('helmet')) {
        this.results.passed.push('Using Helmet for security headers');

        // Check for CSP
        if (content.includes('contentSecurityPolicy')) {
          this.results.passed.push('Content Security Policy configured');
        } else {
          this.results.warnings.push({
            type: 'headers',
            message: 'No explicit CSP configuration found'
          });
        }
      } else {
        this.results.vulnerabilities.push({
          type: 'headers',
          severity: 'high',
          message: 'Not using Helmet for security headers'
        });
      }

      // Check CORS configuration
      if (content.includes('cors')) {
        if (content.includes('origin: true') || content.includes('origin: "*"')) {
          this.results.vulnerabilities.push({
            type: 'cors',
            severity: 'medium',
            message: 'CORS allows all origins'
          });
        } else {
          this.results.passed.push('CORS properly configured');
        }
      }
    } catch (error) {
      this.results.warnings.push({
        type: 'headers',
        message: 'Could not analyze security headers'
      });
    }
  }

  async checkSensitiveData() {
    console.log('🔍 Checking for sensitive data exposure...');

    const sensitivePatterns = [
      { pattern: /console\.log.*password/i, risk: 'Password logged to console' },
      { pattern: /console\.log.*token/i, risk: 'Token logged to console' },
      { pattern: /console\.log.*secret/i, risk: 'Secret logged to console' },
      { pattern: /res\.json.*password/i, risk: 'Password in API response' },
      { pattern: /res\.send.*password/i, risk: 'Password in response' }
    ];

    const files = this.getJavaScriptFiles('./server');
    let exposureFound = false;

    for (const file of files) {
      const content = readFileSync(file, 'utf8');

      sensitivePatterns.forEach(({ pattern, risk }) => {
        if (pattern.test(content)) {
          this.results.vulnerabilities.push({
            type: 'data-exposure',
            severity: 'high',
            file,
            risk
          });
          exposureFound = true;
        }
      });
    }

    if (!exposureFound) {
      this.results.passed.push('No obvious sensitive data exposure found');
    }
  }

  async checkRateLimiting() {
    console.log('⏱️  Checking rate limiting...');

    try {
      const appContent = readFileSync('./server/app.js', 'utf8');

      if (appContent.includes('express-rate-limit') || appContent.includes('rateLimit')) {
        this.results.passed.push('Rate limiting implemented');

        // Check for different limits
        if (appContent.includes('registrationLimiter')) {
          this.results.passed.push('Separate rate limiting for registration');
        }
      } else {
        this.results.vulnerabilities.push({
          type: 'rate-limiting',
          severity: 'medium',
          message: 'No rate limiting detected'
        });
      }
    } catch (error) {
      this.results.warnings.push({
        type: 'rate-limiting',
        message: 'Could not check rate limiting'
      });
    }
  }

  getJavaScriptFiles(dir) {
    const files = [];

    function scanDir(currentDir) {
      try {
        const items = readdirSync(currentDir);

        for (const item of items) {
          const fullPath = join(currentDir, item);
          const stat = statSync(fullPath);

          if (stat.isDirectory() && !item.includes('node_modules')) {
            scanDir(fullPath);
          } else if (stat.isFile() && extname(fullPath) === '.js') {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    scanDir(dir);
    return files;
  }

  runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args);
      let output = '';

      proc.stdout.on('data', data => {
        output += data.toString();
      });

      proc.stderr.on('data', data => {
        output += data.toString();
      });

      proc.on('close', code => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(output));
        }
      });
    });
  }

  generateReport() {
    console.log('\n\n📊 Security Audit Report');
    console.log('========================\n');

    const totalIssues = this.results.vulnerabilities.length + this.results.warnings.length;

    // Summary
    console.log('Summary:');
    console.log(`✅ Passed checks: ${this.results.passed.length}`);
    console.log(`❌ Vulnerabilities: ${this.results.vulnerabilities.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    console.log(`ℹ️  Info: ${this.results.info.length}\n`);

    // Critical vulnerabilities
    const critical = this.results.vulnerabilities.filter(v => v.severity === 'critical');
    if (critical.length > 0) {
      console.log('🚨 CRITICAL VULNERABILITIES:');
      critical.forEach(vuln => {
        console.log(`  - ${vuln.message || vuln.risk}`);
        if (vuln.file) console.log(`    File: ${vuln.file}:${vuln.line}`);
      });
      console.log('');
    }

    // High severity
    const high = this.results.vulnerabilities.filter(v => v.severity === 'high');
    if (high.length > 0) {
      console.log('❗ High Severity Issues:');
      high.forEach(vuln => {
        console.log(`  - ${vuln.message || vuln.risk}`);
        if (vuln.file) console.log(`    File: ${vuln.file}`);
      });
      console.log('');
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.results.warnings.forEach(warn => {
        console.log(`  - ${warn.message}`);
      });
      console.log('');
    }

    // Passed checks
    console.log('✅ Passed Security Checks:');
    this.results.passed.forEach(pass => {
      console.log(`  - ${pass}`);
    });

    // Overall grade
    console.log('\n🎯 Security Grade:');
    if (critical.length > 0) {
      console.log('❌ FAIL - Critical vulnerabilities found');
    } else if (high.length > 0) {
      console.log('⚠️  C - High severity issues need attention');
    } else if (this.results.vulnerabilities.length > 0) {
      console.log('⚠️  B - Some security improvements needed');
    } else if (this.results.warnings.length > 0) {
      console.log('✅ A- - Minor security considerations');
    } else {
      console.log('✅ A+ - Excellent security posture');
    }

    // Save detailed report
    const reportPath = join(
      process.cwd(),
      'reports',
      `security-audit-${new Date().toISOString().split('T')[0]}.json`
    );
    try {
      writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Detailed report saved: ${reportPath}`);
    } catch (error) {
      // Ignore save errors
    }
  }
}

// Run audit
const auditor = new SecurityAuditor();
auditor.runAudit().catch(console.error);
