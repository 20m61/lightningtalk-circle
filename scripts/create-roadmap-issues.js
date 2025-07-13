#!/usr/bin/env node

/**
 * GitHub Issues Creation Script for Roadmap
 * Creates issues from the roadmap JSON structure
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
  chalk = {
    blue: text => text,
    green: text => text,
    yellow: text => text,
    red: text => text,
    bold: text => text
  };
}

// Configuration
const REPO_OWNER = process.env.GITHUB_OWNER || '20m61';
const REPO_NAME = process.env.GITHUB_REPO || 'lightningtalk-circle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROADMAP_DATA_PATH = path.resolve(process.cwd(), 'docs/project/github-issues-roadmap.json');

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Statistics
const stats = {
  total: 0,
  created: 0,
  failed: 0,
  milestones: 0
};

/**
 * Create milestones if they don't exist
 */
async function createMilestones(milestones) {
  console.log(chalk.blue('\n--- Creating Milestones ---'));

  for (const milestone of milestones) {
    try {
      // Check if milestone exists
      const existingMilestones = await octokit.issues.listMilestones({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        state: 'all'
      });

      const exists = existingMilestones.data.find(m => m.title === milestone.title);

      if (exists) {
        console.log(
          chalk.yellow(`⚠ Milestone "${milestone.title}" already exists (${exists.state})`)
        );
        continue;
      }

      const response = await octokit.issues.createMilestone({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: milestone.title,
        description: milestone.description,
        due_on: milestone.due_date ? new Date(milestone.due_date).toISOString() : undefined,
        state: milestone.state || 'open'
      });

      console.log(chalk.green(`✓ Created milestone: ${milestone.title}`));
      stats.milestones++;
    } catch (error) {
      console.log(chalk.red(`✗ Failed to create milestone "${milestone.title}": ${error.message}`));
    }
  }
}

/**
 * Create labels if they don't exist
 */
async function createLabels(labels) {
  console.log(chalk.blue('\n--- Creating Labels ---'));

  for (const label of labels) {
    try {
      // Check if label exists
      const existingLabels = await octokit.issues.listLabelsForRepo({
        owner: REPO_OWNER,
        repo: REPO_NAME
      });

      const exists = existingLabels.data.find(l => l.name === label.name);

      if (exists) {
        // Update if color is different
        if (exists.color.toLowerCase() !== label.color.toLowerCase()) {
          await octokit.issues.updateLabel({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            name: label.name,
            color: label.color,
            description: label.description
          });
          console.log(chalk.yellow(`↻ Updated label: ${label.name}`));
        } else {
          console.log(chalk.yellow(`⚠ Label "${label.name}" already exists`));
        }
        continue;
      }

      await octokit.issues.createLabel({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        name: label.name,
        color: label.color,
        description: label.description
      });

      console.log(chalk.green(`✓ Created label: ${label.name}`));
    } catch (error) {
      console.log(chalk.red(`✗ Failed to create label "${label.name}": ${error.message}`));
    }
  }
}

/**
 * Get milestone number by title
 */
async function getMilestoneNumber(title) {
  if (!title) return undefined;

  try {
    const milestones = await octokit.issues.listMilestones({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'all'
    });

    const milestone = milestones.data.find(m => m.title === title);
    return milestone ? milestone.number : undefined;
  } catch (error) {
    console.log(chalk.yellow(`Warning: Could not fetch milestone "${title}"`));
    return undefined;
  }
}

/**
 * Create a single issue
 */
async function createIssue(issue) {
  try {
    // Check if issue already exists (by title)
    const existingIssues = await octokit.issues.listForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'all',
      per_page: 100
    });

    const exists = existingIssues.data.find(i => i.title === issue.title);

    if (exists) {
      console.log(chalk.yellow(`⚠ Issue "${issue.title}" already exists (#${exists.number})`));
      stats.total++;
      return exists;
    }

    // Get milestone number if specified
    const milestoneNumber = await getMilestoneNumber(issue.milestone);

    const issueData = {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: issue.title,
      body: issue.body,
      labels: issue.labels || [],
      assignees: issue.assignees || []
    };

    if (milestoneNumber) {
      issueData.milestone = milestoneNumber;
    }

    const response = await octokit.issues.create(issueData);

    console.log(chalk.green(`✓ Created issue #${response.data.number}: ${issue.title}`));
    stats.created++;
    stats.total++;
    return response.data;
  } catch (error) {
    console.log(chalk.red(`✗ Failed to create issue "${issue.title}": ${error.message}`));
    stats.failed++;
    stats.total++;
    return null;
  }
}

/**
 * Create all issues from roadmap
 */
async function createRoadmapIssues(phaseFilter = null) {
  try {
    // Load roadmap data
    if (!fs.existsSync(ROADMAP_DATA_PATH)) {
      throw new Error(`Roadmap data file not found: ${ROADMAP_DATA_PATH}`);
    }

    const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_DATA_PATH, 'utf8'));

    console.log(chalk.blue('Starting roadmap issue creation...'));
    console.log(chalk.blue(`Total planned issues: ${roadmapData.meta.total_issues}`));

    // Create milestones first
    if (roadmapData.milestones) {
      await createMilestones(roadmapData.milestones);
    }

    // Create labels
    if (roadmapData.labels) {
      await createLabels(roadmapData.labels);
    }

    // Wait a bit for GitHub to process milestones and labels
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create issues
    console.log(chalk.blue('\n--- Creating Issues ---'));

    const issuesToCreate = phaseFilter
      ? roadmapData.issues.filter(issue => issue.milestone && issue.milestone.includes(phaseFilter))
      : roadmapData.issues;

    if (issuesToCreate.length === 0) {
      console.log(chalk.yellow(`No issues found for filter: ${phaseFilter}`));
      return;
    }

    console.log(chalk.blue(`Creating ${issuesToCreate.length} issues...`));

    // Sort issues by priority and type
    const sortedIssues = issuesToCreate.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = a.labels.find(l => l.includes('priority')) || 'medium-priority';
      const bPriority = b.labels.find(l => l.includes('priority')) || 'medium-priority';

      const aLevel = priorityOrder[aPriority.split('-')[0]] || 1;
      const bLevel = priorityOrder[bPriority.split('-')[0]] || 1;

      return aLevel - bLevel;
    });

    for (const issue of sortedIssues) {
      await createIssue(issue);

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(chalk.green('\nRoadmap issue creation completed!'));
    printSummary();
  } catch (error) {
    console.log(chalk.red(`Error creating roadmap issues: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Print creation summary
 */
function printSummary() {
  console.log('\n--- Issue Creation Summary ---');
  console.log(`Total issues: ${stats.total}`);
  console.log(chalk.green(`Created: ${stats.created}`));
  console.log(chalk.blue(`Milestones: ${stats.milestones}`));

  if (stats.failed > 0) {
    console.log(chalk.red(`Failed: ${stats.failed}`));
  }

  const successRate = stats.total > 0 ? Math.round((stats.created / stats.total) * 100) : 0;
  console.log(`Success rate: ${successRate}%`);
}

/**
 * Main execution
 */
async function main() {
  console.log(chalk.blue('Lightning Talk Circle - Roadmap Issues Creation'));
  console.log(chalk.blue('==============================================='));

  // Verify GitHub token
  if (!process.env.GITHUB_TOKEN) {
    console.log(chalk.red('Error: GITHUB_TOKEN environment variable is not set.'));
    console.log('Please create a .env file with your GitHub token.');
    process.exit(1);
  }

  // Check for phase filter
  let phaseFilter = null;
  const validPhases = ['phase-1-core', 'phase-2-features', 'phase-3-innovation'];

  if (process.argv.length > 2) {
    const requestedPhase = process.argv[2].toLowerCase();
    if (validPhases.includes(requestedPhase)) {
      phaseFilter = requestedPhase;
      console.log(chalk.blue(`Filtering issues to phase: ${phaseFilter}`));
    } else {
      console.log(chalk.yellow(`Warning: Invalid phase "${requestedPhase}". Using all phases.`));
      console.log(chalk.yellow(`Valid phases are: ${validPhases.join(', ')}`));
    }
  }

  await createRoadmapIssues(phaseFilter);
}

// Start the script
main().catch(error => {
  console.log(chalk.red(`Unhandled error: ${error.message}`));
  process.exit(1);
});
