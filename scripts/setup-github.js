#!/usr/bin/env node

/**
 * GitHub Integration Setup Script
 * Configures GitHub integration for issue automation and workflows
 */

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

class GitHubSetup {
  constructor() {
    this.envPath = path.join(__dirname, '..', '.env');
    this.config = {
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO
    };
  }

  async setup() {
    console.log('🔧 GitHub Integration Setup\n');

    // Check current configuration
    await this.checkCurrentConfig();

    // Interactive setup if needed
    if (!this.isConfigComplete()) {
      await this.interactiveSetup();
    }

    // Validate configuration
    await this.validateConfig();

    console.log('\n✅ GitHub integration setup completed!');
  }

  async checkCurrentConfig() {
    console.log('📋 Current Configuration:');
    console.log(`   GITHUB_TOKEN: ${this.config.token ? '✅ Set' : '❌ Not set'}`);
    console.log(`   GITHUB_OWNER: ${this.config.owner || '❌ Not set'}`);
    console.log(`   GITHUB_REPO: ${this.config.repo || '❌ Not set'}`);
    console.log('');
  }

  isConfigComplete() {
    return this.config.token && this.config.owner && this.config.repo;
  }

  async interactiveSetup() {
    console.log('🔧 Interactive Setup\n');

    const questions = [];

    if (!this.config.token) {
      questions.push({
        type: 'password',
        name: 'token',
        message: 'Enter your GitHub Personal Access Token:',
        mask: '*',
        validate: input => {
          if (!input || input.length < 10) {
            return 'Please enter a valid GitHub token';
          }
          return true;
        }
      });
    }

    if (!this.config.owner) {
      questions.push({
        type: 'input',
        name: 'owner',
        message: 'Enter GitHub repository owner (username or organization):',
        default: '20m61',
        validate: input => {
          if (!input || input.length < 1) {
            return 'Please enter a repository owner';
          }
          return true;
        }
      });
    }

    if (!this.config.repo) {
      questions.push({
        type: 'input',
        name: 'repo',
        message: 'Enter GitHub repository name:',
        default: 'lightningtalk-circle',
        validate: input => {
          if (!input || input.length < 1) {
            return 'Please enter a repository name';
          }
          return true;
        }
      });
    }

    if (questions.length > 0) {
      const answers = await inquirer.prompt(questions);

      // Update configuration
      this.config = { ...this.config, ...answers };

      // Update .env file
      await this.updateEnvFile();
    }
  }

  async updateEnvFile() {
    console.log('📝 Updating .env file...');

    let envContent = '';
    if (fs.existsSync(this.envPath)) {
      envContent = fs.readFileSync(this.envPath, 'utf8');
    }

    // Update or add GitHub configuration
    const updates = [
      { key: 'GITHUB_TOKEN', value: this.config.token },
      { key: 'GITHUB_OWNER', value: this.config.owner },
      { key: 'GITHUB_REPO', value: this.config.repo }
    ];

    for (const { key, value } of updates) {
      if (value) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const newLine = `${key}="${value}"`;

        if (envContent.includes(`${key}=`)) {
          envContent = envContent.replace(regex, newLine);
        } else {
          envContent += `\n${newLine}`;
        }
      }
    }

    fs.writeFileSync(this.envPath, envContent);
    console.log('✅ Environment variables updated');
  }

  async validateConfig() {
    console.log('🔍 Validating GitHub configuration...');

    try {
      const octokit = new Octokit({ auth: this.config.token });

      // Test GitHub API access
      const { data: user } = await octokit.rest.users.getAuthenticated();
      console.log(`✅ GitHub API access verified (logged in as: ${user.login})`);

      // Test repository access
      const { data: repo } = await octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo
      });
      console.log(`✅ Repository access verified: ${repo.full_name}`);

      // Check permissions
      const { permissions } = repo;
      console.log('📋 Repository permissions:');
      console.log(`   Admin: ${permissions.admin ? '✅' : '❌'}`);
      console.log(`   Push: ${permissions.push ? '✅' : '❌'}`);
      console.log(`   Pull: ${permissions.pull ? '✅' : '❌'}`);

      if (!permissions.push) {
        console.log('⚠️  Warning: Push access required for full functionality');
      }
    } catch (error) {
      console.error('❌ GitHub configuration validation failed:');

      if (error.status === 401) {
        console.error('   Invalid token or insufficient permissions');
        console.error('   Please check your Personal Access Token');
      } else if (error.status === 404) {
        console.error('   Repository not found or no access');
        console.error('   Please check repository owner and name');
      } else {
        console.error('   Error:', error.message);
      }

      throw error;
    }
  }

  async testIssueCreation() {
    console.log('🧪 Testing issue creation...');

    try {
      const octokit = new Octokit({ auth: this.config.token });

      const testIssue = {
        title: '[TEST] GitHub Integration Test',
        body: `This is a test issue created by the GitHub setup script.
                
**Test Details:**
- Created at: ${new Date().toISOString()}
- Purpose: Verify issue creation functionality
- Status: This issue can be safely closed

This issue will be automatically closed.`,
        labels: ['test', 'setup']
      };

      const { data: issue } = await octokit.rest.issues.create({
        owner: this.config.owner,
        repo: this.config.repo,
        ...testIssue
      });

      console.log(`✅ Test issue created: #${issue.number}`);
      console.log(`   URL: ${issue.html_url}`);

      // Close the test issue immediately
      await octokit.rest.issues.update({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: issue.number,
        state: 'closed'
      });

      console.log('✅ Test issue closed automatically');
    } catch (error) {
      console.error('❌ Issue creation test failed:', error.message);
      throw error;
    }
  }

  async showUsageInstructions() {
    console.log('\n📚 Usage Instructions:');
    console.log('');
    console.log('Available commands:');
    console.log('  npm run create-issues     - Create GitHub issues from data');
    console.log('  npm run verify-issues     - Verify existing issues');
    console.log('  npm run auto-workflow     - Run automated workflow');
    console.log('');
    console.log('Environment variables configured:');
    console.log(`  GITHUB_TOKEN: ${this.config.token ? 'Set' : 'Not set'}`);
    console.log(`  GITHUB_OWNER: ${this.config.owner}`);
    console.log(`  GITHUB_REPO: ${this.config.repo}`);
    console.log('');
    console.log('For more information, see: docs/github-integration.md');
  }
}

// Run setup if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new GitHubSetup();

  try {
    await setup.setup();

    // Ask if user wants to test issue creation
    const { testIssues } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'testIssues',
        message: 'Would you like to test issue creation? (creates and closes a test issue)',
        default: false
      }
    ]);

    if (testIssues) {
      await setup.testIssueCreation();
    }

    await setup.showUsageInstructions();
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

export default GitHubSetup;
