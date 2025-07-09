#!/usr/bin/env node

/**
 * Comprehensive GitHub Issue Creation Script
 * Creates all critical, high-priority, and development issues for Lightning Talk Circle
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  owner: process.env.GITHUB_OWNER || '20m61',
  repo: process.env.GITHUB_REPO || 'lightningtalk-circle',
  token: process.env.GITHUB_TOKEN
};

// Validate configuration
if (!config.token) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is not set.');
  console.error('Please configure GitHub Secrets or set it in your environment.');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({ auth: config.token });

/**
 * Issue creation with Copilot assignment and proper formatting
 */
async function createIssue(issueData) {
  try {
    const response = await octokit.rest.issues.create({
      owner: config.owner,
      repo: config.repo,
      title: issueData.title,
      body: issueData.body,
      labels: issueData.labels || [],
      assignees: ['copilot'] // Assign to GitHub Copilot for autonomous development
    });

    console.log(`✅ Created issue: ${issueData.title}`);
    console.log(`   URL: ${response.data.html_url}`);
    console.log(`   Number: #${response.data.number}`);

    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create issue: ${issueData.title}`);
    console.error(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Load issue data from JSON files
 */
async function loadIssueData() {
  const issueFiles = [
    '../docs/project/issues-critical-fixes.json',
    '../docs/project/deployment-issues.json',
    '../docs/project/wordpress-modern-issues.json'
  ];

  const allIssues = [];

  for (const file of issueFiles) {
    const filePath = path.join(__dirname, file);
    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

      // Flatten all issue categories
      Object.values(data).forEach(category => {
        if (Array.isArray(category)) {
          allIssues.push(...category);
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not read ${filePath}:`, error.message);
    }
  }

  return allIssues;
}

/**
 * Add standard issue template elements
 */
function enhanceIssueForCopilot(issue) {
  const enhanced = { ...issue };

  // Add Copilot-specific instructions to body
  enhanced.body += `

---

## 🤖 Instructions for GitHub Copilot

### Development Guidelines
- **Follow existing code patterns** and architecture established in the codebase
- **Maintain test coverage** - add tests for all new functionality
- **Follow security best practices** - validate inputs, use parameterized queries
- **Document your changes** - update relevant documentation files
- **Use TypeScript** where applicable for type safety

### Implementation Approach
1. **Read existing code** to understand current patterns and conventions
2. **Start with small, incremental changes** to avoid breaking existing functionality
3. **Run tests frequently** to ensure changes don't introduce regressions
4. **Follow the project's coding standards** as defined in CLAUDE.md

### Pull Request Requirements
- Include comprehensive tests for new functionality
- Update documentation for any API or interface changes
- Ensure all existing tests pass
- Follow conventional commit message format
- Request review from @claude for code review

### Success Criteria
- All acceptance criteria in this issue are met
- Code follows project conventions and best practices
- Comprehensive test coverage (>80% for new code)
- Documentation is updated and accurate
- No breaking changes to existing functionality

**Note**: This issue will be reviewed by Claude. Please create a draft pull request early for feedback and guidance.`;

  // Ensure labels include copilot assignment
  if (!enhanced.labels.includes('assignee:copilot')) {
    enhanced.labels.push('assignee:copilot');
  }

  return enhanced;
}

/**
 * Create issues in priority order
 */
async function createAllIssues() {
  console.log('🚀 Lightning Talk Circle - Comprehensive Issue Creation');
  console.log('================================================================');
  console.log(`Repository: ${config.owner}/${config.repo}`);
  console.log('');

  try {
    // Load all issue data
    const issues = await loadIssueData();
    console.log(`📋 Loaded ${issues.length} issues to create`);
    console.log('');

    // Sort by priority (critical first, then high, medium, low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    issues.sort((a, b) => {
      const aPriority = a.labels.find(l => l.startsWith('priority:'))?.split(':')[1] || 'medium';
      const bPriority = b.labels.find(l => l.startsWith('priority:'))?.split(':')[1] || 'medium';
      return (priorityOrder[aPriority] || 2) - (priorityOrder[bPriority] || 2);
    });

    // Create issues with delay to avoid rate limiting
    const createdIssues = [];
    for (let i = 0; i < issues.length; i++) {
      const issue = enhanceIssueForCopilot(issues[i]);

      console.log(`📝 Creating issue ${i + 1}/${issues.length}: ${issue.title}`);

      const createdIssue = await createIssue(issue);
      if (createdIssue) {
        createdIssues.push(createdIssue);
      }

      // Add delay to avoid rate limiting
      if (i < issues.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log('');
    console.log('📊 Issue Creation Summary');
    console.log('========================');
    console.log(`✅ Successfully created: ${createdIssues.length} issues`);
    console.log(`❌ Failed to create: ${issues.length - createdIssues.length} issues`);
    console.log('');

    if (createdIssues.length > 0) {
      console.log('🔗 Created Issues:');
      createdIssues.forEach(issue => {
        console.log(`   #${issue.number}: ${issue.title}`);
        console.log(`   ${issue.html_url}`);
      });
      console.log('');
    }

    console.log('🎯 Next Steps:');
    console.log('1. Configure GitHub Secrets (see docs/deployment/GITHUB-SECRETS-SETUP.md)');
    console.log('2. Review and prioritize issues in GitHub');
    console.log('3. Monitor Copilot progress on assigned issues');
    console.log('4. Review pull requests created by Copilot');
    console.log('');
    console.log('🤖 All issues have been assigned to Copilot for autonomous development.');
    console.log(`📋 Track progress: https://github.com/${config.owner}/${config.repo}/issues`);
  } catch (error) {
    console.error('❌ Error during issue creation:', error.message);
    process.exit(1);
  }
}

/**
 * Add issue creation metadata
 */
async function addProjectMetadata() {
  const metadata = {
    created_at: new Date().toISOString(),
    created_by: 'claude-code',
    project: 'Lightning Talk Circle',
    version: '1.0.0',
    total_issues_created: 0,
    priority_breakdown: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  };

  const metadataPath = path.join(__dirname, '../docs/project/issue-creation-metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  createAllIssues()
    .then(() => addProjectMetadata())
    .then(() => {
      console.log('✨ Issue creation completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}
