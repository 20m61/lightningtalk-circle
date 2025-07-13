#!/usr/bin/env node

/**
 * Dry Run for GitHub Issues Creation
 * Validates and displays the issues that would be created without actually creating them
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROADMAP_DATA_PATH = path.resolve(process.cwd(), 'docs/project/github-issues-roadmap.json');

// Simple chalk replacement
const chalk = {
  blue: text => `\x1b[34m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  bold: text => `\x1b[1m${text}\x1b[0m`,
  cyan: text => `\x1b[36m${text}\x1b[0m`,
  magenta: text => `\x1b[35m${text}\x1b[0m`
};

/**
 * Validate issue structure
 */
function validateIssue(issue, index) {
  const errors = [];

  if (!issue.title || issue.title.trim() === '') {
    errors.push('Missing or empty title');
  }

  if (!issue.body || issue.body.trim() === '') {
    errors.push('Missing or empty body');
  }

  if (!issue.labels || !Array.isArray(issue.labels) || issue.labels.length === 0) {
    errors.push('Missing or invalid labels');
  }

  if (issue.title && issue.title.length > 100) {
    errors.push('Title too long (>100 characters)');
  }

  return errors;
}

/**
 * Analyze roadmap structure
 */
function analyzeRoadmap(roadmapData) {
  console.log(chalk.blue('\n📊 Roadmap Analysis'));
  console.log('='.repeat(50));

  // Meta information
  console.log(chalk.green(`📋 Title: ${roadmapData.meta.title}`));
  console.log(chalk.green(`📅 Created: ${roadmapData.meta.created_at}`));
  console.log(chalk.green(`📦 Version: ${roadmapData.meta.version}`));
  console.log(chalk.green(`🎯 Total Issues: ${roadmapData.meta.total_issues}`));
  console.log(chalk.green(`🏃 Phases: ${roadmapData.meta.phases}`));

  // Milestones
  console.log(chalk.cyan(`\n🎯 Milestones (${roadmapData.milestones.length}):`));
  roadmapData.milestones.forEach(milestone => {
    console.log(`  • ${milestone.title} (due: ${milestone.due_date})`);
  });

  // Labels
  console.log(chalk.magenta(`\n🏷️  Labels (${roadmapData.labels.length}):`));
  const labelsByCategory = {};
  roadmapData.labels.forEach(label => {
    const category = label.name.split(' ')[0];
    if (!labelsByCategory[category]) labelsByCategory[category] = [];
    labelsByCategory[category].push(label.name);
  });

  Object.entries(labelsByCategory).forEach(([category, labels]) => {
    console.log(`  ${category}: ${labels.length} labels`);
  });

  // Issues by milestone
  console.log(chalk.blue(`\n📝 Issues by Milestone:`));
  const issuesByMilestone = {};
  roadmapData.issues.forEach(issue => {
    const milestone = issue.milestone || 'No milestone';
    if (!issuesByMilestone[milestone]) issuesByMilestone[milestone] = [];
    issuesByMilestone[milestone].push(issue);
  });

  Object.entries(issuesByMilestone).forEach(([milestone, issues]) => {
    console.log(`  • ${milestone}: ${issues.length} issues`);
  });

  // Issues by priority
  console.log(chalk.yellow(`\n⚡ Issues by Priority:`));
  const issuesByPriority = { high: 0, medium: 0, low: 0, unknown: 0 };
  roadmapData.issues.forEach(issue => {
    const priorityLabel = issue.labels.find(label => label.includes('priority'));
    if (priorityLabel) {
      const priority = priorityLabel
        .split('-')[0]
        .replace('🎯 ', '')
        .replace('📋 ', '')
        .replace('💡 ', '');
      issuesByPriority[priority] = (issuesByPriority[priority] || 0) + 1;
    } else {
      issuesByPriority.unknown++;
    }
  });

  Object.entries(issuesByPriority).forEach(([priority, count]) => {
    if (count > 0) {
      console.log(`  • ${priority}: ${count} issues`);
    }
  });
}

/**
 * Preview issues that would be created
 */
function previewIssues(issues, phaseFilter = null) {
  console.log(chalk.blue('\n📋 Issue Creation Preview'));
  console.log('='.repeat(50));

  const filteredIssues = phaseFilter
    ? issues.filter(issue => issue.milestone && issue.milestone.includes(phaseFilter))
    : issues;

  if (filteredIssues.length === 0) {
    console.log(chalk.yellow(`No issues found for filter: ${phaseFilter}`));
    return { total: 0, valid: 0, invalid: 0 };
  }

  console.log(chalk.green(`📦 Total issues to create: ${filteredIssues.length}`));

  let validCount = 0;
  let invalidCount = 0;

  filteredIssues.forEach((issue, index) => {
    const errors = validateIssue(issue, index);
    const isValid = errors.length === 0;

    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    const status = isValid ? chalk.green('✓') : chalk.red('✗');
    const priorityLabel = issue.labels.find(l => l.includes('priority')) || '';
    const typeLabel =
      issue.labels.find(
        l =>
          l.includes('🎨') ||
          l.includes('💬') ||
          l.includes('🖼️') ||
          l.includes('🗺️') ||
          l.includes('🔔')
      ) || '';

    console.log(`${status} ${issue.id || `issue-${index + 1}`}: ${issue.title}`);
    console.log(`   📋 Milestone: ${issue.milestone || 'None'}`);
    console.log(`   🏷️  Labels: ${issue.labels.length} (${typeLabel} ${priorityLabel})`);
    console.log(`   📝 Body: ${issue.body.length} characters`);

    if (errors.length > 0) {
      console.log(chalk.red(`   ❌ Errors: ${errors.join(', ')}`));
    }

    console.log('');
  });

  return { total: filteredIssues.length, valid: validCount, invalid: invalidCount };
}

/**
 * Show implementation roadmap
 */
function showImplementationRoadmap(roadmapData) {
  console.log(chalk.blue('\n🗺️  Implementation Roadmap'));
  console.log('='.repeat(50));

  roadmapData.milestones.forEach(milestone => {
    console.log(chalk.bold(`\n📅 ${milestone.title}`));
    console.log(`   📄 ${milestone.description}`);
    console.log(`   📆 Due: ${milestone.due_date}`);

    const milestoneIssues = roadmapData.issues.filter(issue => issue.milestone === milestone.id);

    console.log(chalk.cyan(`   📝 Issues (${milestoneIssues.length}):`));

    // Group by type
    const issuesByType = {};
    milestoneIssues.forEach(issue => {
      const typeLabel = issue.labels.find(
        l =>
          l.includes('🎨') ||
          l.includes('💬') ||
          l.includes('🖼️') ||
          l.includes('🗺️') ||
          l.includes('🔔') ||
          l.includes('⚡') ||
          l.includes('🔒') ||
          l.includes('📱') ||
          l.includes('📊') ||
          l.includes('🧪')
      );
      const type = typeLabel ? typeLabel.split(' ')[1] : 'other';
      if (!issuesByType[type]) issuesByType[type] = [];
      issuesByType[type].push(issue);
    });

    Object.entries(issuesByType).forEach(([type, issues]) => {
      console.log(`      ${type}: ${issues.length} issues`);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log(chalk.bold('Lightning Talk Circle - Issue Creation Dry Run'));
  console.log('='.repeat(50));

  // Check if data file exists
  if (!fs.existsSync(ROADMAP_DATA_PATH)) {
    console.log(chalk.red(`❌ Roadmap data file not found: ${ROADMAP_DATA_PATH}`));
    process.exit(1);
  }

  try {
    // Load roadmap data
    const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_DATA_PATH, 'utf8'));

    // Check for phase filter
    let phaseFilter = null;
    const validPhases = ['phase-1-core', 'phase-2-features', 'phase-3-innovation'];

    if (process.argv.length > 2) {
      const requestedPhase = process.argv[2].toLowerCase();
      if (validPhases.includes(requestedPhase)) {
        phaseFilter = requestedPhase;
        console.log(chalk.blue(`🎯 Filtering to phase: ${phaseFilter}`));
      } else {
        console.log(
          chalk.yellow(
            `⚠️  Invalid phase "${requestedPhase}". Available: ${validPhases.join(', ')}`
          )
        );
      }
    }

    // Analyze roadmap
    analyzeRoadmap(roadmapData);

    // Preview issues
    const previewResult = previewIssues(roadmapData.issues, phaseFilter);

    // Show summary
    console.log(chalk.blue('\n📊 Summary'));
    console.log('='.repeat(30));
    console.log(chalk.green(`✅ Valid issues: ${previewResult.valid}`));

    if (previewResult.invalid > 0) {
      console.log(chalk.red(`❌ Invalid issues: ${previewResult.invalid}`));
    }

    console.log(chalk.cyan(`📦 Total: ${previewResult.total}`));

    const successRate =
      previewResult.total > 0 ? Math.round((previewResult.valid / previewResult.total) * 100) : 100;
    console.log(`🎯 Success rate: ${successRate}%`);

    // Show implementation roadmap
    showImplementationRoadmap(roadmapData);

    // Next steps
    console.log(chalk.blue('\n🚀 Next Steps'));
    console.log('='.repeat(30));
    console.log('1. Review the issue validation results above');
    console.log('2. Set GITHUB_TOKEN environment variable');
    console.log('3. Run: node scripts/create-roadmap-issues.js [phase]');
    console.log('4. Available phases: ' + validPhases.join(', '));

    if (previewResult.invalid > 0) {
      console.log(chalk.red('\n⚠️  Please fix validation errors before creating issues'));
    } else {
      console.log(chalk.green('\n✅ All issues are valid and ready for creation!'));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

main().catch(error => {
  console.log(chalk.red(`💥 Unhandled error: ${error.message}`));
  process.exit(1);
});
