#!/usr/bin/env node

/**
 * Environment Manager
 * Manages environment configuration files for Lightning Talk Circle
 */

const fs = require('fs');
const path = require('path');

// Simple color functions without chalk dependency
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

class EnvironmentManager {
  constructor() {
    this.envDir = path.join(__dirname, '../environments');
    this.currentEnv = process.env.NODE_ENV || 'development';
    this.backupDir = path.join(__dirname, '../.env-backups');
  }

  /**
   * Load environment configuration
   * @param {string} environment - Environment name
   * @param {string} mode - Mode (local, docker, etc.)
   */
  loadEnvironment(environment, mode = 'local') {
    console.log(colors.blue(`🔄 Switching to environment: ${environment}${mode !== 'local' ? ` (${mode})` : ''}`));

    // Backup current .env if it exists
    this.backupCurrentEnv();

    const configs = [
      'shared/base.env',
      'shared/security.env',
      'shared/features.env'
    ];

    // Add environment-specific config
    const envFile = mode === 'local' ? 'local.env' : `${mode}.env`;
    configs.push(`${environment}/${envFile}`);

    let envContent = '';
    const loadedConfigs = [];

    configs.forEach(config => {
      const configPath = path.join(this.envDir, config);
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        envContent += `# From: ${config}\n${content}\n\n`;
        loadedConfigs.push(config);
        console.log(colors.green(`✓ Loaded: ${config}`));
      } else {
        console.log(colors.yellow(`⚠ Skipped: ${config} (not found)`));
      }
    });

    // Add metadata
    envContent += `# Environment Metadata\n`;
    envContent += `ENV_LOADED_AT=${new Date().toISOString()}\n`;
    envContent += `ENV_NAME=${environment}\n`;
    envContent += `ENV_MODE=${mode}\n`;
    envContent += `ENV_LOADED_CONFIGS=${loadedConfigs.join(',')}\n`;

    // Write to .env
    fs.writeFileSync('.env', envContent);

    console.log(colors.green(`✅ Environment switched to: ${colors.bold(environment)}${mode !== 'local' ? ` (${mode})` : ''}`));
    console.log(colors.gray(`📁 Configuration saved to: .env`));
    
    // Show environment info
    this.showEnvironmentInfo(environment, mode);
  }

  /**
   * Backup current .env file
   */
  backupCurrentEnv() {
    if (!fs.existsSync('.env')) {
      return;
    }

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `.env.${timestamp}`);
    
    fs.copyFileSync('.env', backupPath);
    console.log(colors.gray(`💾 Backed up current .env to: ${backupPath}`));
  }

  /**
   * List available environments
   */
  listEnvironments() {
    const environments = fs.readdirSync(this.envDir)
      .filter(dir => {
        const dirPath = path.join(this.envDir, dir);
        return fs.statSync(dirPath).isDirectory() && dir !== 'shared';
      });
    
    console.log(colors.blue('📋 Available environments:'));
    
    environments.forEach(env => {
      const envPath = path.join(this.envDir, env);
      const files = fs.readdirSync(envPath).filter(f => f.endsWith('.env'));
      
      console.log(colors.green(`  ${env}`));
      files.forEach(file => {
        const mode = file.replace('.env', '');
        console.log(colors.gray(`    - ${mode === env ? 'default' : mode}`));
      });
    });

    return environments;
  }

  /**
   * Show current environment info
   */
  showCurrentEnvironment() {
    if (!fs.existsSync('.env')) {
      console.log(colors.yellow('⚠ No .env file found'));
      return;
    }

    const envContent = fs.readFileSync('.env', 'utf8');
    const envName = this.extractEnvVar(envContent, 'ENV_NAME') || 'unknown';
    const envMode = this.extractEnvVar(envContent, 'ENV_MODE') || 'unknown';
    const loadedAt = this.extractEnvVar(envContent, 'ENV_LOADED_AT') || 'unknown';
    const nodeEnv = this.extractEnvVar(envContent, 'NODE_ENV') || 'unknown';

    console.log(colors.blue('📊 Current environment:'));
    console.log(colors.green(`  Environment: ${envName}`));
    console.log(colors.green(`  Mode: ${envMode}`));
    console.log(colors.green(`  NODE_ENV: ${nodeEnv}`));
    console.log(colors.gray(`  Loaded at: ${loadedAt}`));
  }

  /**
   * Show environment information
   */
  showEnvironmentInfo(environment, mode) {
    const envPath = path.join(this.envDir, environment, `${mode === 'local' ? 'local' : mode}.env`);
    
    if (!fs.existsSync(envPath)) {
      return;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const nodeEnv = this.extractEnvVar(content, 'NODE_ENV') || environment;
    const siteUrl = this.extractEnvVar(content, 'SITE_URL') || 'Not set';
    const dbType = this.extractEnvVar(content, 'DATABASE_TYPE') || 'Not set';

    console.log(colors.blue('\n📊 Environment information:'));
    console.log(colors.green(`  NODE_ENV: ${nodeEnv}`));
    console.log(colors.green(`  Site URL: ${siteUrl}`));
    console.log(colors.green(`  Database: ${dbType}`));
  }

  /**
   * Extract environment variable from content
   */
  extractEnvVar(content, varName) {
    const match = content.match(new RegExp(`^${varName}=(.*)$`, 'm'));
    return match ? match[1] : null;
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment(environment) {
    const requiredFiles = [
      'shared/base.env',
      'shared/security.env',
      'shared/features.env',
      `${environment}/${environment}.env`
    ];

    console.log(colors.blue(`🔍 Validating environment: ${environment}`));

    let isValid = true;
    requiredFiles.forEach(file => {
      const filePath = path.join(this.envDir, file);
      if (fs.existsSync(filePath)) {
        console.log(colors.green(`✓ ${file}`));
      } else {
        console.log(colors.red(`✗ ${file} (missing)`));
        isValid = false;
      }
    });

    if (isValid) {
      console.log(colors.green(`✅ Environment ${environment} is valid`));
    } else {
      console.log(colors.red(`❌ Environment ${environment} has missing files`));
    }

    return isValid;
  }

  /**
   * Create template environment
   */
  createTemplate(environment) {
    const envPath = path.join(this.envDir, environment);
    
    if (fs.existsSync(envPath)) {
      console.log(colors.yellow(`⚠ Environment ${environment} already exists`));
      return;
    }

    fs.mkdirSync(envPath, { recursive: true });

    const templateContent = `# ${environment.toUpperCase()} Environment Configuration

# Basic settings
NODE_ENV=${environment}
SITE_URL=http://localhost:3000

# Database settings
DATABASE_TYPE=file

# Security settings
JWT_SECRET=change_this_secret
SESSION_SECRET=change_this_secret

# Feature flags
DEBUG_MODE=false
EMAIL_ENABLED=false

# Add more configuration as needed...
`;

    fs.writeFileSync(path.join(envPath, `${environment}.env`), templateContent);
    console.log(colors.green(`✅ Created template environment: ${environment}`));
    console.log(colors.gray(`📁 Path: ${envPath}/${environment}.env`));
  }

  /**
   * Show help
   */
  showHelp() {
    console.log(colors.blue('🚀 Environment Manager - Lightning Talk Circle\n'));
    console.log('Usage: node env-manager.js <command> [options]\n');
    console.log('Commands:');
    console.log('  switch <env> [mode]  Switch to environment (mode: local, docker)');
    console.log('  list                 List available environments');
    console.log('  current             Show current environment');
    console.log('  validate <env>      Validate environment configuration');
    console.log('  create <env>        Create template environment');
    console.log('  help                Show this help\n');
    console.log('Examples:');
    console.log('  node env-manager.js switch development');
    console.log('  node env-manager.js switch development docker');
    console.log('  node env-manager.js switch production');
    console.log('  node env-manager.js list');
    console.log('  node env-manager.js current');
  }
}

// CLI interface
const manager = new EnvironmentManager();
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
  case 'switch':
    if (!arg1) {
      console.error(colors.red('❌ Error: Environment name required'));
      console.log('Usage: node env-manager.js switch <environment> [mode]');
      process.exit(1);
    }
    manager.loadEnvironment(arg1, arg2);
    break;
    
  case 'list':
    manager.listEnvironments();
    break;

  case 'current':
    manager.showCurrentEnvironment();
    break;
    
  case 'validate':
    if (!arg1) {
      console.error(colors.red('❌ Error: Environment name required'));
      process.exit(1);
    }
    manager.validateEnvironment(arg1);
    break;

  case 'create':
    if (!arg1) {
      console.error(colors.red('❌ Error: Environment name required'));
      process.exit(1);
    }
    manager.createTemplate(arg1);
    break;

  case 'help':
  case '--help':
  case '-h':
    manager.showHelp();
    break;
    
  default:
    if (command) {
      console.error(colors.red(`❌ Unknown command: ${command}`));
    }
    manager.showHelp();
    process.exit(1);
}