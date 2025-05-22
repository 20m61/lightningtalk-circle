#!/usr/bin/env node

/**
 * Issue Verification Script
 * 
 * This script verifies that all expected issues have been created in the GitHub repository
 * and checks if they have the appropriate labels and content.
 * 
 * Prerequisites:
 * - Node.js installed
 * - GitHub Personal Access Token with 'repo' scope
 * - npm packages: octokit, dotenv
 * 
 * Setup:
 * 1. npm install @octokit/rest dotenv chalk
 * 2. Create a .env file with GITHUB_TOKEN=your_personal_access_token
 * 3. Run: node verify-issues.js
 */

require('dotenv').config();
const { Octokit } = require('@octokit/rest');
const chalk = require('chalk');

// Configuration
const REPO_OWNER = '20m61';
const REPO_NAME = 'lightningtalk-circle';
const ISSUES_DATA_PATH = './docs/project/issues-data.json';

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function verifyIssues() {
  try {
    // Load expected issues data
    const issuesData = require(ISSUES_DATA_PATH);
    
    console.log(chalk.blue('Starting issue verification process...'));
    
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
        issue: issue
      });
    });
    
    // Add core feature issues
    issuesData.core_feature_issues.forEach(issue => {
      expectedIssues.set(issue.title, {
        category: 'Core Feature',
        issue: issue
      });
    });
    
    // Add enhancement/optimization issues
    issuesData.enhancement_optimization_issues.forEach(issue => {
      expectedIssues.set(issue.title, {
        category: 'Enhancement/Optimization',
        issue: issue
      });
    });
    
    // Add compliance/maintenance issues
    issuesData.compliance_maintenance_issues.forEach(issue => {
      expectedIssues.set(issue.title, {
        category: 'Compliance/Maintenance',
        issue: issue
      });
    });
    
    console.log(`Expected issues: ${expectedIssues.size}`);
    console.log(`Repository issues: ${repoIssues.length}`);
    
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
          title: title,
          category: data.category
        });
      }
    }
    
    // Print verification results
    console.log('\n--- Verification Results ---');
    
    if (missingIssues.length === 0) {
      console.log(chalk.green('✓ All expected issues are created'));
    } else {
      console.log(chalk.red(`✗ Missing issues: ${missingIssues.length}`));
      missingIssues.forEach(issue => {
        console.log(chalk.yellow(`  - [${issue.category}] ${issue.title}`));
      });
    }
    
    if (mismatchedIssues.length === 0) {
      console.log(chalk.green('✓ All issues have the expected labels'));
    } else {
      console.log(chalk.red(`✗ Issues with label mismatches: ${mismatchedIssues.length}`));
      mismatchedIssues.forEach(issue => {
        console.log(chalk.yellow(`  - #${issue.number} ${issue.title}: ${issue.problem}`));
      });
    }
    
    console.log('\n--- Summary ---');
    console.log(`Expected issues: ${expectedIssues.size}`);
    console.log(`Found issues: ${foundIssues.size}`);
    console.log(`Missing issues: ${missingIssues.length}`);
    console.log(`Issues with problems: ${mismatchedIssues.length}`);
    
    if (missingIssues.length === 0 && mismatchedIssues.length === 0) {
      console.log(chalk.green('\n✅ All issues verified successfully!'));
    } else {
      console.log(chalk.red('\n❌ Some issues are missing or have problems.'));
    }
    
  } catch (error) {
    console.error('Error verifying issues:', error);
  }
}

// Main execution
async function main() {
  console.log(chalk.blue('GitHub Issue Verification Script'));
  console.log(chalk.blue('==============================='));
  
  // Verify GitHub token
  if (!process.env.GITHUB_TOKEN) {
    console.error(chalk.red('Error: GITHUB_TOKEN environment variable is not set.'));
    console.log('Please create a .env file with your GitHub token or set it in your environment.');
    process.exit(1);
  }
  
  await verifyIssues();
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});