#!/usr/bin/env node

/**
 * GitHub Issue Creation Script
 * 
 * This script demonstrates how to programmatically create GitHub issues
 * using the GitHub REST API and the provided issues-data.json file.
 * 
 * Prerequisites:
 * - Node.js installed
 * - GitHub Personal Access Token with 'repo' scope
 * - npm packages: octokit, dotenv
 * 
 * Setup:
 * 1. npm install @octokit/rest dotenv
 * 2. Create a .env file with GITHUB_TOKEN=your_personal_access_token
 * 3. Run: node create-issues.js
 */

require('dotenv').config();
const { Octokit } = require('@octokit/rest');

// Configuration
const REPO_OWNER = '20m61';
const REPO_NAME = 'lightningtalk-circle';
const ISSUES_DATA_PATH = './docs/project/issues-data.json';

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function createIssues() {
  try {
    // Load issues data
    const issuesData = require(ISSUES_DATA_PATH);
    
    console.log('Starting issue creation process...');
    
    // Create infrastructure/foundation issues
    console.log('\n--- Creating Infrastructure/Foundation Issues ---');
    for (const issue of issuesData.infrastructure_foundation_issues) {
      await createIssue(issue);
    }
    
    // Create core feature issues
    console.log('\n--- Creating Core Feature Issues ---');
    for (const issue of issuesData.core_feature_issues) {
      await createIssue(issue);
    }
    
    // Create enhancement/optimization issues
    console.log('\n--- Creating Enhancement/Optimization Issues ---');
    for (const issue of issuesData.enhancement_optimization_issues) {
      await createIssue(issue);
    }
    
    // Create compliance/maintenance issues
    console.log('\n--- Creating Compliance/Maintenance Issues ---');
    for (const issue of issuesData.compliance_maintenance_issues) {
      await createIssue(issue);
    }
    
    console.log('\nIssue creation completed successfully!');
    
  } catch (error) {
    console.error('Error creating issues:', error);
  }
}

async function createIssue(issue) {
  try {
    const response = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: issue.title,
      body: issue.body,
      labels: issue.labels
    });
    
    console.log(`Created issue #${response.data.number}: ${issue.title}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to create issue "${issue.title}":`, error.message);
    throw error;
  }
}

// Verification function to check if issues need to be created
async function verifyExistingIssues() {
  try {
    const issues = await octokit.issues.listForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'all',
      per_page: 100
    });
    
    if (issues.data.length > 0) {
      console.log(`Found ${issues.data.length} existing issues. You may want to review them before creating new ones.`);
      const proceed = await promptUser('Do you want to proceed with creating new issues? (y/n) ');
      return proceed.toLowerCase() === 'y';
    }
    
    return true;
  } catch (error) {
    console.error('Error checking existing issues:', error);
    return false;
  }
}

// Simple prompt utility (in real implementation, use a package like 'prompts')
function promptUser(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Main execution
async function main() {
  console.log('GitHub Issue Creation Script');
  console.log('============================');
  
  // Verify GitHub token
  if (!process.env.GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is not set.');
    console.log('Please create a .env file with your GitHub token or set it in your environment.');
    process.exit(1);
  }
  
  // Check for existing issues
  const shouldProceed = await verifyExistingIssues();
  
  if (shouldProceed) {
    await createIssues();
  } else {
    console.log('Issue creation cancelled.');
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});