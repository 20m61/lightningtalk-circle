#!/usr/bin/env node
/**
 * Migration script for CDK stack consolidation
 * This script helps transition from multiple individual stacks to consolidated environment stacks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Get environment from command line args
const environment = process.argv[2] || 'dev';
const dryRun = process.argv.includes('--dry-run');

log(`🚀 CDK Stack Migration Tool`, 'cyan');
log(`📍 Environment: ${environment}`, 'blue');
log(`🔍 Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`, dryRun ? 'yellow' : 'green');
log('');

// Old stacks that need to be removed
const oldStacks = [
  'LightningTalkStack',
  'LightningTalkApiOnlyStack',
  'LightningTalkStaticSiteStack',
  'LightningTalkDatabaseStack',
  'LightningTalkSecurityStack',
  'LightningTalkMonitoringStack',
  'LightningTalkCostStack',
  'LightningTalkBackupStack',
  'LightningTalkCiCdStack',
  'LightningTalkNotificationStack',
  'LightningTalkVpcStack',
  'LightningTalkWafStack'
];

// New consolidated stacks
const newStacks = [
  environment === 'prod' ? 'LightningTalkProd' : 'LightningTalkDev',
  'LightningTalkCognito',
  'LightningTalkWebSocket'
];

// Check if CDK is installed
const checkCdkInstallation = () => {
  try {
    execSync('cdk --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    log('❌ CDK CLI not found. Please install it first:', 'red');
    log('   npm install -g aws-cdk', 'yellow');
    return false;
  }
};

// List existing stacks
const listStacks = () => {
  try {
    const result = execSync('cdk list', { encoding: 'utf8' });
    return result.split('\n').filter(line => line.trim());
  } catch (error) {
    log('❌ Failed to list existing stacks', 'red');
    return [];
  }
};

// Check stack status
const checkStackStatus = stackName => {
  try {
    const result = execSync(
      `aws cloudformation describe-stacks --stack-name ${stackName}-${environment}`,
      {
        encoding: 'utf8',
        stdio: 'ignore'
      }
    );
    return 'EXISTS';
  } catch (error) {
    return 'NOT_FOUND';
  }
};

// Export stack resources (for backup)
const exportStackResources = stackName => {
  if (dryRun) {
    log(`  📝 Would export resources from ${stackName}`, 'yellow');
    return;
  }

  try {
    const result = execSync(
      `aws cloudformation describe-stack-resources --stack-name ${stackName}-${environment}`,
      {
        encoding: 'utf8'
      }
    );

    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportFile = path.join(exportDir, `${stackName}-${environment}-resources.json`);
    fs.writeFileSync(exportFile, result);

    log(`  💾 Exported resources to ${exportFile}`, 'green');
  } catch (error) {
    log(`  ⚠️  Failed to export resources from ${stackName}`, 'yellow');
  }
};

// Destroy old stack
const destroyStack = stackName => {
  if (dryRun) {
    log(`  🗑️  Would destroy ${stackName}-${environment}`, 'yellow');
    return;
  }

  try {
    log(`  🗑️  Destroying ${stackName}-${environment}...`, 'red');
    execSync(`cdk destroy ${stackName}-${environment} --force`, { stdio: 'inherit' });
    log(`  ✅ Successfully destroyed ${stackName}-${environment}`, 'green');
  } catch (error) {
    log(`  ❌ Failed to destroy ${stackName}-${environment}`, 'red');
  }
};

// Deploy new stack
const deployStack = stackName => {
  if (dryRun) {
    log(`  🚀 Would deploy ${stackName}-${environment}`, 'yellow');
    return;
  }

  try {
    log(`  🚀 Deploying ${stackName}-${environment}...`, 'blue');
    execSync(`cdk deploy ${stackName}-${environment} --require-approval never`, {
      stdio: 'inherit'
    });
    log(`  ✅ Successfully deployed ${stackName}-${environment}`, 'green');
  } catch (error) {
    log(`  ❌ Failed to deploy ${stackName}-${environment}`, 'red');
  }
};

// Main migration process
const migrate = async () => {
  // Check prerequisites
  if (!checkCdkInstallation()) {
    process.exit(1);
  }

  log('📋 Migration Steps:', 'cyan');
  log('1. List existing stacks', 'blue');
  log('2. Export resources from old stacks', 'blue');
  log('3. Deploy new consolidated stacks', 'blue');
  log('4. Destroy old stacks (after verification)', 'blue');
  log('');

  // Step 1: List existing stacks
  log('🔍 Checking existing stacks...', 'cyan');
  const existingStacks = listStacks();
  log(`Found ${existingStacks.length} CDK stacks`, 'green');

  // Step 2: Check which old stacks exist
  const existingOldStacks = [];
  for (const stackName of oldStacks) {
    const fullStackName = `${stackName}-${environment}`;
    if (existingStacks.includes(fullStackName)) {
      existingOldStacks.push(stackName);
      log(`  ✅ Found: ${fullStackName}`, 'green');
    } else {
      log(`  ⚪ Not found: ${fullStackName}`, 'yellow');
    }
  }

  if (existingOldStacks.length === 0) {
    log('✅ No old stacks found. Migration not needed.', 'green');
    return;
  }

  // Step 3: Export resources from old stacks
  log('', 'cyan');
  log('💾 Exporting resources from old stacks...', 'cyan');
  for (const stackName of existingOldStacks) {
    exportStackResources(stackName);
  }

  // Step 4: Deploy new consolidated stacks
  log('', 'cyan');
  log('🚀 Deploying new consolidated stacks...', 'cyan');
  for (const stackName of newStacks) {
    deployStack(stackName);
  }

  // Step 5: Prompt for old stack destruction
  if (!dryRun) {
    log('', 'cyan');
    log(
      '⚠️  Important: Please verify that the new stacks are working correctly before destroying old stacks.',
      'yellow'
    );
    log('To destroy old stacks after verification, run:', 'yellow');
    log(`  node ${__filename} ${environment} --destroy-old`, 'yellow');
  }

  // Step 6: Destroy old stacks (if --destroy-old flag is provided)
  if (process.argv.includes('--destroy-old')) {
    log('', 'cyan');
    log('🗑️  Destroying old stacks...', 'red');
    for (const stackName of existingOldStacks.reverse()) {
      // Reverse order for dependencies
      destroyStack(stackName);
    }
  }

  log('', 'cyan');
  log('✅ Migration process completed!', 'green');
  log('');
  log('Next steps:', 'cyan');
  log('1. Verify that all services are working correctly', 'blue');
  log('2. Update your deployment scripts to use the new stack names', 'blue');
  log('3. Update documentation with the new architecture', 'blue');
};

// Handle errors
process.on('unhandledRejection', error => {
  log(`❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('CDK Stack Migration Tool', 'cyan');
  log('');
  log('Usage:', 'yellow');
  log('  node migrate-stacks.js [environment] [options]', 'blue');
  log('');
  log('Arguments:', 'yellow');
  log('  environment    Target environment (dev, staging, prod) [default: dev]', 'blue');
  log('');
  log('Options:', 'yellow');
  log('  --dry-run      Show what would be done without executing', 'blue');
  log('  --destroy-old  Destroy old stacks after verification', 'blue');
  log('  --help, -h     Show this help message', 'blue');
  log('');
  log('Examples:', 'yellow');
  log('  node migrate-stacks.js dev --dry-run', 'blue');
  log('  node migrate-stacks.js prod', 'blue');
  log('  node migrate-stacks.js dev --destroy-old', 'blue');
  process.exit(0);
}

// Run migration
migrate().catch(error => {
  log(`❌ Migration failed: ${error.message}`, 'red');
  process.exit(1);
});
