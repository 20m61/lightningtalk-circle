#!/usr/bin/env node

/**
 * Security Setup Script
 * Generates secure random values for production environment
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

class SecuritySetup {
  constructor() {
    this.envFile = path.join(projectRoot, '.env');
    this.templateFile = path.join(projectRoot, '.env.production.template');
  }

  /**
   * Generate secure random string
   */
  generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Generate secure hex string
   */
  generateSecureHex(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Check if running in production environment
   */
  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Generate all required secrets
   */
  generateSecrets() {
    return {
      JWT_SECRET: this.generateSecureSecret(64),
      SESSION_SECRET: this.generateSecureSecret(64),
      API_KEY_SECRET: this.generateSecureSecret(32),
      WEBHOOK_SECRET: this.generateSecureHex(32),
      ENCRYPTION_KEY: this.generateSecureHex(32)
    };
  }

  /**
   * Create production environment file from template
   */
  async createProductionEnv() {
    try {
      // Check if template exists
      const templateExists = await fs
        .access(this.templateFile)
        .then(() => true)
        .catch(() => false);
      if (!templateExists) {
        throw new Error(`Template file not found: ${this.templateFile}`);
      }

      // Read template
      const template = await fs.readFile(this.templateFile, 'utf-8');

      // Generate secrets
      const secrets = this.generateSecrets();

      // Replace placeholders in template
      let envContent = template;

      // Replace security placeholders
      envContent = envContent.replace(
        'JWT_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING_IN_PRODUCTION',
        `JWT_SECRET=${secrets.JWT_SECRET}`
      );

      envContent = envContent.replace(
        'SESSION_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING_IN_PRODUCTION',
        `SESSION_SECRET=${secrets.SESSION_SECRET}`
      );

      // Add deployment timestamp
      envContent = envContent.replace(
        'DEPLOYMENT_TIMESTAMP=',
        `DEPLOYMENT_TIMESTAMP=${new Date().toISOString()}`
      );

      // Write .env file
      await fs.writeFile(this.envFile, envContent);

      console.log('✅ Production environment file created successfully');
      console.log(`📁 Location: ${this.envFile}`);
      console.log('\n🔐 Generated secrets:');
      Object.entries(secrets).forEach(([key, value]) => {
        console.log(`   ${key}: ${value.substring(0, 16)}...`);
      });

      console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
      console.log('1. Store these secrets securely (AWS Secrets Manager recommended)');
      console.log('2. Never commit the .env file to version control');
      console.log('3. Rotate secrets regularly');
      console.log('4. Use environment-specific secrets for each deployment');
      console.log('5. Configure Google OAuth Client Secret in AWS Secrets Manager');
      console.log('6. Update GitHub token if using issue automation');

      return secrets;
    } catch (error) {
      console.error('❌ Error creating production environment file:', error.message);
      throw error;
    }
  }

  /**
   * Validate existing environment file
   */
  async validateEnvironment() {
    try {
      const envExists = await fs
        .access(this.envFile)
        .then(() => true)
        .catch(() => false);
      if (!envExists) {
        console.log('ℹ️  No .env file found');
        return false;
      }

      const envContent = await fs.readFile(this.envFile, 'utf-8');
      const issues = [];

      // Check for weak secrets
      if (envContent.includes('development-jwt-secret')) {
        issues.push('JWT_SECRET is using development value');
      }

      if (envContent.includes('development-session-secret')) {
        issues.push('SESSION_SECRET is using development value');
      }

      if (envContent.includes('CHANGE_THIS_TO_SECURE_RANDOM_STRING_IN_PRODUCTION')) {
        issues.push('Production placeholder values detected');
      }

      // Check for missing required variables in production
      if (this.isProduction()) {
        const requiredVars = [
          'JWT_SECRET',
          'SESSION_SECRET',
          'COGNITO_USER_POOL_ID',
          'COGNITO_CLIENT_ID',
          'GOOGLE_CLIENT_ID'
        ];

        requiredVars.forEach(varName => {
          if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=\n`)) {
            issues.push(`Missing required variable: ${varName}`);
          }
        });
      }

      if (issues.length > 0) {
        console.log('⚠️  Environment validation issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        return false;
      }

      console.log('✅ Environment validation passed');
      return true;
    } catch (error) {
      console.error('❌ Error validating environment:', error.message);
      return false;
    }
  }

  /**
   * Setup AWS Secrets Manager integration
   */
  async setupSecretsManager() {
    console.log('\n🔒 AWS Secrets Manager Setup:');
    console.log('For production deployment, store sensitive values in AWS Secrets Manager:');
    console.log('');
    console.log('1. Google OAuth Client Secret:');
    console.log(
      '   aws secretsmanager create-secret --name "lightningtalk/google-oauth-client-secret" --secret-string "your-client-secret"'
    );
    console.log('');
    console.log('2. GitHub Token (if using):');
    console.log(
      '   aws secretsmanager create-secret --name "lightningtalk/github-token" --secret-string "your-github-token"'
    );
    console.log('');
    console.log('3. Database credentials (if using RDS):');
    console.log(
      '   aws secretsmanager create-secret --name "lightningtalk/database-credentials" --secret-string \'{"username":"user","password":"password"}\''
    );
    console.log('');
    console.log('Update your Lambda/ECS configuration to retrieve these secrets at runtime.');
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations() {
    console.log('\n🛡️  Security Recommendations:');
    console.log('');
    console.log('1. Environment Security:');
    console.log('   - Use different secrets for each environment (dev/staging/prod)');
    console.log('   - Rotate secrets every 90 days');
    console.log('   - Use AWS Secrets Manager for production secrets');
    console.log('   - Enable CloudTrail for audit logging');
    console.log('');
    console.log('2. Application Security:');
    console.log('   - Enable HTTPS only (FORCE_HTTPS=true)');
    console.log('   - Configure CSP headers properly');
    console.log('   - Use rate limiting (already configured)');
    console.log('   - Enable HSTS (already configured)');
    console.log('');
    console.log('3. AWS Security:');
    console.log('   - Use IAM roles with least privilege');
    console.log('   - Enable GuardDuty for threat detection');
    console.log('   - Configure WAF for API protection');
    console.log('   - Enable VPC Flow Logs');
    console.log('');
    console.log('4. Monitoring:');
    console.log('   - Set up CloudWatch alerts for security events');
    console.log('   - Monitor failed authentication attempts');
    console.log('   - Track API usage patterns');
    console.log('   - Enable AWS Config for compliance');
  }
}

async function main() {
  const setup = new SecuritySetup();

  console.log('🔐 Lightning Talk Circle - Security Setup\n');

  try {
    // Check current environment
    const isValid = await setup.validateEnvironment();

    if (!isValid || process.argv.includes('--force')) {
      console.log('\n📝 Creating new production environment configuration...');
      await setup.createProductionEnv();
    }

    // Show AWS Secrets Manager setup
    await setup.setupSecretsManager();

    // Show security recommendations
    setup.generateSecurityRecommendations();

    console.log('\n✅ Security setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Security setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SecuritySetup;
