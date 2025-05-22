#!/usr/bin/env node

/**
 * GitHub Issue Creation Script
 * 
 * This script programmatically creates GitHub issues from the structured data 
 * in the issues-data.json file. It can be run locally or in GitHub Actions.
 * 
 * Prerequisites:
 * - Node.js installed (v14.x or later)
 * - GitHub Personal Access Token with 'repo' scope (for local use)
 * - npm packages: @octokit/rest, dotenv, chalk
 * 
 * Setup:
 * 1. npm install @octokit/rest dotenv chalk
 * 2. Create a .env file with GITHUB_TOKEN=your_personal_access_token (for local use)
 * 3. Run: node create-issues.js
 */

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

// Try to import chalk, but don't fail if it's not available
let chalk;
try {
  chalk = await import('chalk');
  chalk = chalk.default;
} catch (e) {
  // Create a simple chalk replacement
  chalk = {
    blue: (text) => text,
    green: (text) => text,
    yellow: (text) => text,
    red: (text) => text,
    bold: (text) => text
  };
}

// Configuration
const REPO_OWNER = '20m61';
const REPO_NAME = 'lightningtalk-circle';

// Get current file path and directory (ES Module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use process.cwd() to ensure correct path resolution in GitHub Actions environment
const ISSUES_DATA_PATH = path.resolve(process.cwd(), 'docs/project/issues-data.json');

// Debug: Log file path and check if it exists
if (isGitHubActions) {
  console.log(`Debug: Looking for data file at: ${ISSUES_DATA_PATH}`);
  console.log(`Debug: Working directory: ${process.cwd()}`);
  console.log(`Debug: Directory contents: ${fs.readdirSync(path.dirname(ISSUES_DATA_PATH)).join(', ')}`);
  console.log(`Debug: File exists: ${fs.existsSync(ISSUES_DATA_PATH)}`);
}

// Check if running in GitHub Actions
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Statistics for reporting
const stats = {
  total: 0,
  created: 0,
  failed: 0,
  skipped: 0
};

/**
 * Create all issues defined in the data file
 */
async function createIssues(categoryFilter = null) {
  try {
    // Check if data file exists first
    if (!fs.existsSync(ISSUES_DATA_PATH)) {
      throw new Error(`Data file not found: ${ISSUES_DATA_PATH}. Check that the file exists and the path is correct.`);
    }
    
    // Load issues data
    const issuesData = JSON.parse(fs.readFileSync(ISSUES_DATA_PATH, 'utf8'));
    
    log(chalk.blue('Starting issue creation process...'));
    
    // Map category argument to data structure
    const categoryMap = {
      'infrastructure': 'infrastructure_foundation_issues',
      'core': 'core_feature_issues',
      'enhancement': 'enhancement_optimization_issues',
      'compliance': 'compliance_maintenance_issues'
    };

    // Create infrastructure/foundation issues
    if (!categoryFilter || categoryFilter === 'infrastructure') {
      log(chalk.blue('\n--- Creating Infrastructure/Foundation Issues ---'));
      for (const issue of issuesData.infrastructure_foundation_issues) {
        stats.total++;
        await createIssue(issue, 'Infrastructure/Foundation');
      }
    }
    
    // Create core feature issues
    if (!categoryFilter || categoryFilter === 'core') {
      log(chalk.blue('\n--- Creating Core Feature Issues ---'));
      for (const issue of issuesData.core_feature_issues) {
        stats.total++;
        await createIssue(issue, 'Core Feature');
      }
    }
    
    // Create enhancement/optimization issues
    if (!categoryFilter || categoryFilter === 'enhancement') {
      log(chalk.blue('\n--- Creating Enhancement/Optimization Issues ---'));
      for (const issue of issuesData.enhancement_optimization_issues) {
        stats.total++;
        await createIssue(issue, 'Enhancement/Optimization');
      }
    }
    
    // Create compliance/maintenance issues
    if (!categoryFilter || categoryFilter === 'compliance') {
      log(chalk.blue('\n--- Creating Compliance/Maintenance Issues ---'));
      for (const issue of issuesData.compliance_maintenance_issues) {
        stats.total++;
        await createIssue(issue, 'Compliance/Maintenance');
      }
    }
    
    log(chalk.green('\nIssue creation completed!'));
    printSummary();
    
  } catch (error) {
    log(chalk.red(`Error creating issues: ${error.message}`));
    setGitHubActionsFailed(error.message);
    process.exit(1);
  }
}

/**
 * Create a single issue
 */
async function createIssue(issue, category) {
  try {
    const response = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: issue.title,
      body: issue.body,
      labels: issue.labels
    });
    
    log(chalk.green(`✓ Created issue #${response.data.number}: ${issue.title}`));
    stats.created++;
    return response.data;
  } catch (error) {
    log(chalk.red(`✗ Failed to create issue "${issue.title}": ${error.message}`));
    stats.failed++;
    
    // Don't throw the error, just log it and continue with other issues
    if (isGitHubActions) {
      console.log(`::warning::Failed to create issue "${issue.title}": ${error.message}`);
    }
  }
}

/**
 * Check for existing issues and prompt for confirmation if needed
 */
async function verifyExistingIssues() {
  try {
    const issues = await octokit.issues.listForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'all',
      per_page: 100
    });
    
    if (issues.data.length > 0) {
      log(chalk.yellow(`Found ${issues.data.length} existing issues.`));
      
      // If in GitHub Actions, we'll proceed automatically
      if (isGitHubActions) {
        log('Running in GitHub Actions, proceeding with issue creation...');
        return true;
      }
      
      // If in interactive environment, prompt for confirmation
      const proceed = await promptUser('Do you want to proceed with creating new issues? (y/n) ');
      return proceed.toLowerCase() === 'y';
    }
    
    return true;
  } catch (error) {
    log(chalk.red(`Error checking existing issues: ${error.message}`));
    
    if (isGitHubActions) {
      // In GitHub Actions, we'll log the error and continue
      console.log(`::warning::Error checking existing issues: ${error.message}`);
      return true;
    }
    
    return false;
  }
}

/**
 * Prompt user for input (only in interactive mode)
 */
function promptUser(question) {
  // In GitHub Actions, always return 'y'
  if (isGitHubActions) {
    return Promise.resolve('y');
  }
  
  // Using dynamic import for readline
  return import('readline').then(readline => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });
    });
  });
}

/**
 * Print summary of issue creation
 */
function printSummary() {
  log('\n--- Issue Creation Summary ---');
  log(`Total issues: ${stats.total}`);
  log(chalk.green(`Created: ${stats.created}`));
  
  if (stats.failed > 0) {
    log(chalk.red(`Failed: ${stats.failed}`));
  }
  
  if (stats.skipped > 0) {
    log(chalk.yellow(`Skipped: ${stats.skipped}`));
  }
  
  if (isGitHubActions) {
    const summary = `
## Issue Creation Summary

| Category | Count |
|----------|-------|
| Total | ${stats.total} |
| Created | ${stats.created} |
| Failed | ${stats.failed} |
| Skipped | ${stats.skipped} |
`;
    
    // Write to GitHub Actions summary
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
      try {
        fs.appendFileSync(summaryPath, summary);
      } catch (error) {
        console.log(`::warning::Could not write to summary: ${error.message}`);
      }
    }
    
    // Set output if any issues failed
    if (stats.failed > 0) {
      console.log(`::warning::${stats.failed} issues failed to create`);
    }
  }
}

/**
 * Helper for logging with consistent formatting
 */
function log(message) {
  console.log(message);
}

/**
 * Set GitHub Actions step as failed
 */
function setGitHubActionsFailed(message) {
  if (isGitHubActions) {
    console.log(`::error::${message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  log(chalk.blue('GitHub Issue Creation Script'));
  log(chalk.blue('============================'));
  
  // Verify GitHub token
  if (!process.env.GITHUB_TOKEN) {
    log(chalk.red('Error: GITHUB_TOKEN environment variable is not set.'));
    log('Please create a .env file with your GitHub token or set it in your environment.');
    setGitHubActionsFailed('GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }
  
  // Verify data file exists
  if (!fs.existsSync(ISSUES_DATA_PATH)) {
    log(chalk.red(`Error: Data file not found: ${ISSUES_DATA_PATH}`));
    log(`Current working directory: ${process.cwd()}`);
    setGitHubActionsFailed(`Data file not found: ${ISSUES_DATA_PATH}`);
    process.exit(1);
  }
  
  // Check for category filter
  let categoryFilter = null;
  const validCategories = ['infrastructure', 'core', 'enhancement', 'compliance'];
  
  if (process.argv.length > 2) {
    const requestedCategory = process.argv[2].toLowerCase();
    if (validCategories.includes(requestedCategory)) {
      categoryFilter = requestedCategory;
      log(chalk.blue(`Filtering issues to category: ${categoryFilter}`));
    } else {
      log(chalk.yellow(`Warning: Invalid category "${requestedCategory}". Using all categories.`));
      log(chalk.yellow(`Valid categories are: ${validCategories.join(', ')}`));
    }
  }
  
  // Check for existing issues
  const shouldProceed = await verifyExistingIssues();
  
  if (shouldProceed) {
    await createIssues(categoryFilter);
  } else {
    log('Issue creation cancelled.');
  }
}

// Start the script
main().catch(error => {
  log(chalk.red(`Unhandled error: ${error.message}`));
  setGitHubActionsFailed(`Unhandled error: ${error.message}`);
  process.exit(1);
});