#!/usr/bin/env node

/**
 * Issue Verification Script
 *
 * This script verifies that all expected issues have been created in the GitHub repository
 * and checks if they have the appropriate labels and content.
 *
 * Prerequisites:
 * - Node.js installed (v14.x or later)
 * - GitHub Personal Access Token with 'repo' scope (for local use)
 * - npm packages: @octokit/rest, dotenv, chalk
 *
 * Setup:
 * 1. npm install @octokit/rest dotenv chalk
 * 2. Create a .env file with GITHUB_TOKEN=your_personal_access_token (for local use)
 * 3. Run: node verify-issues.js
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
    blue: text => text,
    green: text => text,
    yellow: text => text,
    red: text => text,
    bold: text => text
  };
}

// Configuration - Use environment variables with fallbacks
const REPO_OWNER = process.env.GITHUB_OWNER || '20m61';
const REPO_NAME = process.env.GITHUB_REPO || 'lightningtalk-circle';

// Get current file path and directory (ES Module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running in GitHub Actions
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// Use process.cwd() to ensure correct path resolution in GitHub Actions environment
const ISSUES_DATA_PATH = path.resolve(process.cwd(), 'docs/project/issues-data.json');

// Debug: Log file path and check if it exists
if (isGitHubActions) {
  console.log(`Debug: Looking for data file at: ${ISSUES_DATA_PATH}`);
  console.log(`Debug: Working directory: ${process.cwd()}`);
  console.log(
    `Debug: Directory contents: ${fs.readdirSync(path.dirname(ISSUES_DATA_PATH)).join(', ')}`
  );
  console.log(`Debug: File exists: ${fs.existsSync(ISSUES_DATA_PATH)}`);
}

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function verifyIssues() {
  try {
    // Check if data file exists first
    if (!fs.existsSync(ISSUES_DATA_PATH)) {
      throw new Error(
        `Data file not found: ${ISSUES_DATA_PATH}. Check that the file exists and the path is correct.`
      );
    }

    // Load expected issues data
    const issuesData = JSON.parse(fs.readFileSync(ISSUES_DATA_PATH, 'utf8'));

    log(chalk.blue('Starting issue verification process...'));

    // Get all issues from the repository
    const { data: repoIssues } = await octokit.issues.listForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'all',
      per_page: 100
    });

    // Create a map of expected issues by title
    const expectedIssues = new Map();

    // Add infrastructure/foundation issues
    issuesData.infrastructure_foundation_issues.forEach(issue => {
      expectedIssues.set(issue.title, {
        category: 'Infrastructure/Foundation',
        issue
      });
    });

    // Add core feature issues
    issuesData.core_feature_issues.forEach(issue => {
      expectedIssues.set(issue.title, {
        category: 'Core Feature',
        issue
      });
    });

    // Add enhancement/optimization issues
    issuesData.enhancement_optimization_issues.forEach(issue => {
      expectedIssues.set(issue.title, {
        category: 'Enhancement/Optimization',
        issue
      });
    });

    // Add compliance/maintenance issues
    issuesData.compliance_maintenance_issues.forEach(issue => {
      expectedIssues.set(issue.title, {
        category: 'Compliance/Maintenance',
        issue
      });
    });

    log(`Expected issues: ${expectedIssues.size}`);
    log(`Repository issues: ${repoIssues.length}`);

    // Check for missing issues
    const foundIssues = new Set();
    const missingIssues = [];
    const mismatchedIssues = [];

    // Verify each repository issue
    for (const repoIssue of repoIssues) {
      const expected = expectedIssues.get(repoIssue.title);

      if (expected) {
        foundIssues.add(repoIssue.title);

        // Check labels
        const expectedLabels = expected.issue.labels;
        const repoLabels = repoIssue.labels.map(label => label.name);

        const missingLabels = expectedLabels.filter(label => !repoLabels.includes(label));

        if (missingLabels.length > 0) {
          mismatchedIssues.push({
            title: repoIssue.title,
            number: repoIssue.number,
            problem: `Missing labels: ${missingLabels.join(', ')}`
          });
        }
      }
    }

    // Find missing issues
    for (const [title, data] of expectedIssues.entries()) {
      if (!foundIssues.has(title)) {
        missingIssues.push({
          title,
          category: data.category
        });
      }
    }

    // Print verification results
    log('\n--- Verification Results ---');

    if (missingIssues.length === 0) {
      log(chalk.green('✓ All expected issues are created'));
    } else {
      log(chalk.red(`✗ Missing issues: ${missingIssues.length}`));
      missingIssues.forEach(issue => {
        log(chalk.yellow(`  - [${issue.category}] ${issue.title}`));
      });
    }

    if (mismatchedIssues.length === 0) {
      log(chalk.green('✓ All issues have the expected labels'));
    } else {
      log(chalk.red(`✗ Issues with label mismatches: ${mismatchedIssues.length}`));
      mismatchedIssues.forEach(issue => {
        log(chalk.yellow(`  - #${issue.number} ${issue.title}: ${issue.problem}`));
      });
    }

    log('\n--- Summary ---');
    log(`Expected issues: ${expectedIssues.size}`);
    log(`Found issues: ${foundIssues.size}`);
    log(`Missing issues: ${missingIssues.length}`);
    log(`Issues with problems: ${mismatchedIssues.length}`);

    // Generate summary for GitHub Actions
    if (isGitHubActions) {
      const summary = `
## Issue Verification Summary

| Category | Count |
|----------|-------|
| Expected issues | ${expectedIssues.size} |
| Found issues | ${foundIssues.size} |
| Missing issues | ${missingIssues.length} |
| Issues with problems | ${mismatchedIssues.length} |

${
  missingIssues.length > 0
    ? `### Missing Issues\n\n${missingIssues.map(issue => `- [${issue.category}] ${issue.title}`).join('\n')}\n`
    : ''
}

${
  mismatchedIssues.length > 0
    ? `### Issues With Problems\n\n${mismatchedIssues.map(issue => `- #${issue.number} ${issue.title}: ${issue.problem}`).join('\n')}\n`
    : ''
}
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

      // Set status based on verification results
      if (missingIssues.length > 0 || mismatchedIssues.length > 0) {
        setGitHubActionsWarning(
          `Verification found ${missingIssues.length} missing issues and ${mismatchedIssues.length} issues with problems`
        );
      }
    }

    if (missingIssues.length === 0 && mismatchedIssues.length === 0) {
      log(chalk.green('\n✅ All issues verified successfully!'));
      return true;
    } else {
      log(chalk.red('\n❌ Some issues are missing or have problems.'));
      return false;
    }
  } catch (error) {
    log(chalk.red(`Error verifying issues: ${error.message}`));
    setGitHubActionsFailed(`Error verifying issues: ${error.message}`);
    return false;
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
 * Set GitHub Actions step warning
 */
function setGitHubActionsWarning(message) {
  if (isGitHubActions) {
    console.log(`::warning::${message}`);
  }
}

// Main execution
async function main() {
  log(chalk.blue('GitHub Issue Verification Script'));
  log(chalk.blue('==============================='));

  // Verify GitHub token
  if (!process.env.GITHUB_TOKEN) {
    log(chalk.red('Error: GITHUB_TOKEN environment variable is not set.'));
    log('Please create a .env file with your GitHub token or set it in your environment.');
    setGitHubActionsFailed('GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  const success = await verifyIssues();

  if (!success && isGitHubActions) {
    // In GitHub Actions, we'll exit with a non-zero code if verification failed
    process.exit(1);
  }
}

main().catch(error => {
  log(chalk.red(`Unhandled error: ${error.message}`));
  setGitHubActionsFailed(`Unhandled error: ${error.message}`);
  process.exit(1);
});
