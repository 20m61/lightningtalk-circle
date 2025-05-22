# Issue Creation Execution Steps

This document provides specific executable steps to create all issues defined in the project issue data file. These steps address potential GitHub Actions workflow challenges and provide alternative methods if needed.

## Prerequisites

- GitHub access with appropriate permissions (admin or write access to the repository)
- Node.js installed (v14.x or later) if executing scripts locally
- GitHub Personal Access Token with `repo` scope (for local execution)

## Option 1: Using GitHub Actions Workflow (Recommended)

This is the simplest method but requires proper GitHub Actions configuration.

1. Navigate to the repository on GitHub
2. Go to the "Actions" tab
3. Select the "Create GitHub Issues" workflow
4. Click "Run workflow" button
5. Enter "yes" in the confirmation field
6. Click "Run workflow" to execute

The workflow will:
- Check out the repository
- Set up Node.js environment
- Install required dependencies
- Execute the issue creation script
- Verify issues were created correctly
- Provide a summary of results

### Troubleshooting GitHub Actions

If you encounter a `CAPIError: 400 Bad Request`:

1. Check GitHub Actions logs for detailed error information
2. Ensure the repository has proper permissions set:
   - Go to Settings > Actions > General
   - Under "Workflow permissions", select "Read and write permissions"
   - Save the changes
3. Verify secret access:
   - The workflow uses `GITHUB_TOKEN` which should be provided automatically
   - No manual secret setup should be needed for this token

## Option 2: Local Execution

If GitHub Actions is not working or you prefer local execution:

1. Clone the repository locally
2. Navigate to the repository root directory
3. Install required dependencies:
   ```bash
   npm install @octokit/rest dotenv chalk
   ```

4. Create a `.env` file in the repository root with your GitHub Personal Access Token:
   ```
   GITHUB_TOKEN=your_personal_access_token
   ```

5. Run the issue creation script:
   ```bash
   node scripts/create-issues.js
   ```

6. Run the verification script to confirm issues were created:
   ```bash
   node scripts/verify-issues.js
   ```

## Option 3: Manual Issue Creation

If automation is not working, you can manually create issues:

1. Open `docs/project/issues-data.json` to view issue definitions
2. For each category (infrastructure_foundation_issues, core_feature_issues, etc.):
   - Open GitHub repository Issues page
   - Click "New issue"
   - Choose the appropriate template
   - Fill in details from the corresponding issue in the JSON file
   - Add labels as specified in the "labels" array
   - Submit the issue

## Verification Process

To verify that all issues were created correctly:

1. Run the verification script:
   ```bash
   node scripts/verify-issues.js
   ```

2. Check the output for any missing issues or issues with incorrect labels
3. For any missing issues, create them using Option 3 (manual creation)
4. For any issues with incorrect labels, update the labels on GitHub

## Handling Firewall Blocks

If you encounter firewall blocks during script execution:

1. For local execution:
   - Ensure your network allows connections to GitHub API endpoints
   - Check if your system needs proxy configuration

2. For GitHub Actions:
   - Configure Actions setup steps to run before the firewall is enabled
   - Add required URLs to the firewall allow list: 
     - `api.github.com` 
     - Other URLs listed in the error message

## Issue Creation Workflow Summary

1. Set up GitHub issue labels (using `setup-labels.yml` workflow)
2. Create all issues (using one of the options above)
3. Verify issues were created correctly
4. Address any missing or incorrectly configured issues
5. Organize issues into GitHub project boards (if applicable)

Following these steps will ensure all required issues are created correctly, even if GitHub Actions encounters temporary problems.