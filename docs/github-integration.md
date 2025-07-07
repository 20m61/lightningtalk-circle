# GitHub Integration Guide

Lightning Talk Circle includes automated GitHub integration for issue management and workflow automation. This guide explains how to set up and use these features.

## Features

- **Automated Issue Creation**: Create GitHub issues from structured data
- **Issue Verification**: Verify that expected issues exist and have correct labels
- **Workflow Automation**: Automated worktree creation, development, and PR management
- **Integration Testing**: Validate GitHub API access and permissions

## Setup

### Prerequisites

1. **GitHub Repository**: You need a GitHub repository with appropriate permissions
2. **Personal Access Token**: Create a token with the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows) - if using GitHub Actions

### Quick Setup

Run the interactive setup script:

```bash
npm run setup:github
```

This script will:
1. Check your current configuration
2. Prompt for missing values
3. Update your `.env` file
4. Validate GitHub API access
5. Test repository permissions
6. Optionally test issue creation

### Manual Setup

1. **Create GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `workflow` (if needed)
   - Copy the generated token

2. **Configure Environment Variables**:
   Add to your `.env` file:
   ```env
   GITHUB_TOKEN="your_personal_access_token"
   GITHUB_OWNER="your_username_or_org"
   GITHUB_REPO="your_repository_name"
   ```

3. **Verify Configuration**:
   ```bash
   npm run setup:github
   ```

## Available Commands

### Issue Management

```bash
# Create all issues from data
npm run create-issues

# Verify existing issues
npm run verify-issues

# Create issues for specific category
node scripts/create-issues.js backend
node scripts/create-issues.js frontend
```

### Workflow Automation

```bash
# Run automated workflow
npm run auto-workflow

# Interactive workflow CLI
npm run workflow
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | Personal Access Token | Required |
| `GITHUB_OWNER` | Repository owner/organization | `20m61` |
| `GITHUB_REPO` | Repository name | `lightningtalk-circle` |
| `AUTO_MERGE` | Enable automatic PR merging | `false` |
| `REQUIRE_REVIEW` | Require PR reviews | `true` |
| `REQUIRE_STATUS_CHECKS` | Require status checks | `true` |

### Issue Data Structure

Issues are defined in `docs/project/issues-data.json`:

```json
{
  "categories": {
    "backend": {
      "name": "Backend Development",
      "color": "0075ca",
      "issues": [
        {
          "title": "Issue Title",
          "priority": "high",
          "labels": ["backend", "enhancement"],
          "description": "Issue description",
          "acceptanceCriteria": ["Criteria 1", "Criteria 2"]
        }
      ]
    }
  }
}
```

## Workflow Features

### Automated Worktree Management

The system can automatically:
1. Create git worktrees for feature development
2. Manage multiple parallel development streams
3. Clean up completed worktrees

### Pull Request Automation

- Automatic PR creation with standardized templates
- Auto-assignment of reviewers
- Integration with status checks
- Optional auto-merge for approved PRs

### Issue Tracking

- Link PRs to issues automatically
- Update issue status based on PR state
- Add progress comments to issues

## Security Best Practices

1. **Token Security**:
   - Never commit tokens to version control
   - Use environment variables or GitHub Secrets
   - Rotate tokens regularly
   - Use minimal required scopes

2. **Repository Access**:
   - Limit token permissions to necessary repositories
   - Use organization tokens for team projects
   - Monitor token usage in GitHub settings

3. **Automation Safety**:
   - Review automation rules before enabling auto-merge
   - Test in development repositories first
   - Monitor automated actions

## Troubleshooting

### Common Issues

1. **401 Unauthorized**:
   - Check if token is valid and not expired
   - Verify token has required scopes
   - Ensure token is correctly set in environment

2. **404 Repository Not Found**:
   - Verify repository owner and name
   - Check if repository is private and token has access
   - Confirm repository exists

3. **403 Forbidden**:
   - Token may not have sufficient permissions
   - Repository may have restrictions
   - Check organization settings

### Debugging

Enable debug logging:
```bash
DEBUG=github:* npm run create-issues
```

Check configuration:
```bash
npm run setup:github
```

### Support

1. Check GitHub API status: https://githubstatus.com
2. Review GitHub API documentation: https://docs.github.com/en/rest
3. Check repository settings and permissions
4. Verify token scopes and expiration

## Integration with CI/CD

### GitHub Actions

Example workflow for automated issue management:

```yaml
name: Issue Management
on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly on Mondays
  workflow_dispatch:

jobs:
  manage-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run create-issues
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_OWNER: ${{ github.repository_owner }}
          GITHUB_REPO: ${{ github.event.repository.name }}
```

### Local Development

For local development, the integration works with your personal access token and provides immediate feedback on issue creation and management.