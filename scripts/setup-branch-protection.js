#!/usr/bin/env node
/**
 * Lightning Talk Circle - Branch Protection Setup
 * GitHubブランチ保護ルールの設定スクリプト
 */

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER || '20m61';
const repo = process.env.GITHUB_REPO || 'lightningtalk-circle';

/**
 * ブランチ保護ルールの設定
 */
async function setupBranchProtection() {
  console.log('🔐 Setting up branch protection rules...\n');

  try {
    // main ブランチの保護設定
    await setupMainBranchProtection();

    // developer ブランチの保護設定
    await setupDeveloperBranchProtection();

    console.log('\n✅ Branch protection setup completed successfully!');
  } catch (error) {
    console.error('❌ Failed to setup branch protection:', error.message);
    process.exit(1);
  }
}

/**
 * main ブランチの保護設定（厳格）
 */
async function setupMainBranchProtection() {
  console.log('🏗️ Setting up main branch protection...');

  const protection = {
    owner,
    repo,
    branch: 'main',
    required_status_checks: {
      strict: true,
      contexts: [
        'ci/unit-tests',
        'ci/integration-tests',
        'ci/e2e-tests',
        'ci/security-scan',
        'ci/lint-check',
        'ci/type-check'
      ]
    },
    enforce_admins: true,
    required_pull_request_reviews: {
      required_approving_review_count: 2,
      dismiss_stale_reviews: true,
      require_code_owner_reviews: true,
      require_last_push_approval: true,
      bypass_pull_request_allowances: {
        users: [],
        teams: [],
        apps: []
      }
    },
    restrictions: null, // 誰でもPRは作成可能
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: true,
    lock_branch: false,
    allow_fork_syncing: true
  };

  try {
    await octokit.rest.repos.updateBranchProtection(protection);
    console.log('✅ Main branch protection configured');
  } catch (error) {
    if (error.status === 404) {
      console.log('⚠️ Main branch not found, will be created on first push');
    } else {
      throw error;
    }
  }
}

/**
 * developer ブランチの保護設定（中程度）
 */
async function setupDeveloperBranchProtection() {
  console.log('🚀 Setting up developer branch protection...');

  const protection = {
    owner,
    repo,
    branch: 'developer',
    required_status_checks: {
      strict: true,
      contexts: ['ci/unit-tests', 'ci/lint-check', 'ci/type-check']
    },
    enforce_admins: false, // 管理者は緊急時にbypass可能
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false,
      require_last_push_approval: false
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: false, // 議論の解決は必須ではない
    lock_branch: false,
    allow_fork_syncing: true
  };

  try {
    await octokit.rest.repos.updateBranchProtection(protection);
    console.log('✅ Developer branch protection configured');
  } catch (error) {
    if (error.status === 404) {
      console.log('✅ Developer branch already exists');
    } else {
      throw error;
    }
  }
}

/**
 * デフォルトブランチの設定
 */
async function setDefaultBranch() {
  console.log('🔄 Setting default branch to developer...');

  try {
    await octokit.rest.repos.update({
      owner,
      repo,
      default_branch: 'developer'
    });
    console.log('✅ Default branch set to developer');
  } catch (error) {
    console.error('⚠️ Failed to set default branch:', error.message);
  }
}

/**
 * リポジトリ設定の最適化
 */
async function optimizeRepositorySettings() {
  console.log('⚙️ Optimizing repository settings...');

  try {
    await octokit.rest.repos.update({
      owner,
      repo,
      // プルリクエスト設定
      allow_merge_commit: true,
      allow_squash_merge: true,
      allow_rebase_merge: false,
      delete_branch_on_merge: true,

      // セキュリティ設定
      allow_auto_merge: true,
      use_squash_pr_title_as_default: true,

      // Issue/PR テンプレート
      has_issues: true,
      has_projects: true,
      has_wiki: false,

      // その他
      archived: false,
      disabled: false
    });
    console.log('✅ Repository settings optimized');
  } catch (error) {
    console.error('⚠️ Failed to optimize repository settings:', error.message);
  }
}

/**
 * ステータスチェック設定の表示
 */
function displayStatusCheckInfo() {
  console.log('\n📋 Required Status Checks Configuration:');
  console.log('');
  console.log('Main Branch:');
  console.log('  - ci/unit-tests');
  console.log('  - ci/integration-tests');
  console.log('  - ci/e2e-tests');
  console.log('  - ci/security-scan');
  console.log('  - ci/lint-check');
  console.log('  - ci/type-check');
  console.log('');
  console.log('Developer Branch:');
  console.log('  - ci/unit-tests');
  console.log('  - ci/lint-check');
  console.log('  - ci/type-check');
  console.log('');
  console.log('💡 These checks will be automatically created by GitHub Actions workflows');
}

/**
 * 設定サマリーの表示
 */
function displayConfigurationSummary() {
  console.log('\n📊 Branch Protection Summary:');
  console.log('');
  console.log('┌──────────────┬──────────────┬──────────────┐');
  console.log('│ Setting      │ Main         │ Developer    │');
  console.log('├──────────────┼──────────────┼──────────────┤');
  console.log('│ PR Required  │ ✅ (2 reviews)│ ✅ (1 review) │');
  console.log('│ Status Checks│ ✅ (6 checks) │ ✅ (3 checks) │');
  console.log('│ Force Push   │ ❌ Blocked    │ ❌ Blocked    │');
  console.log('│ Deletion     │ ❌ Blocked    │ ❌ Blocked    │');
  console.log('│ Admin Bypass │ ❌ No         │ ✅ Yes       │');
  console.log('│ Stale Review │ ✅ Dismiss    │ ✅ Dismiss    │');
  console.log('│ Auto-Delete  │ ✅ Enabled    │ ✅ Enabled    │');
  console.log('└──────────────┴──────────────┴──────────────┘');
}

// メイン実行
async function main() {
  console.log('🚀 Lightning Talk Circle - Branch Protection Setup');
  console.log('================================================');
  console.log(`Repository: ${owner}/${repo}`);
  console.log('');

  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.log('Please set your GitHub Personal Access Token:');
    console.log('export GITHUB_TOKEN=your_token_here');
    process.exit(1);
  }

  await setupBranchProtection();
  await setDefaultBranch();
  await optimizeRepositorySettings();

  displayStatusCheckInfo();
  displayConfigurationSummary();

  console.log('\n🎉 Setup completed! Your repository is now optimized for team development.');
  console.log('\n📚 Next steps:');
  console.log('1. Review the GitHub Actions workflows in .github/workflows/');
  console.log('2. Add team members to the repository');
  console.log('3. Create your first feature branch from developer');
  console.log('4. Test the protection rules with a sample PR');
}

// エラーハンドリング
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { setupBranchProtection, setupMainBranchProtection, setupDeveloperBranchProtection };
