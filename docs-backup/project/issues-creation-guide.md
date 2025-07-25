# Creating GitHub Issues

This document provides instructions for creating GitHub issues for the Lightning
Talk Circle project using the prepared data and scripts.

## Prerequisites

- Node.js 14.x or later
- npm (Node Package Manager)
- GitHub Personal Access Token with `repo` scope

## Setup

1. Install required dependencies:

```bash
npm install @octokit/rest dotenv
```

2. Create a `.env` file in the repository root with your GitHub token:

```
GITHUB_TOKEN=your_personal_access_token
```

Replace `your_personal_access_token` with a valid GitHub token that has
permissions to create issues in the repository.

## Issue Data Structure

All issues to be created are defined in the `/docs/project/issues-data.json`
file. The issues are organized into four categories:

- Infrastructure/Foundation Issues (P0)
- Core Feature Issues (P1)
- Enhancement and Optimization Issues (P2)
- Compliance and Maintenance Issues (P2/P3)

Each issue is defined with the following properties:

- `title`: The issue title
- `body`: The issue description in Markdown format
- `labels`: Array of labels to apply to the issue

## Creating Issues

To create all issues defined in the data file:

```bash
node scripts/create-issues.js
```

The script will:

1. Check for existing issues in the repository
2. Prompt for confirmation before creating new issues
3. Create all issues defined in the data file
4. Apply appropriate labels to each issue

## Verifying Issues

After running the script, verify that:

1. All issues were created successfully
2. Issues have the correct labels applied
3. Issues display correctly in GitHub
4. Issues appear in the project board (if configured)

## Label Setup

Before running the script, ensure that all required labels exist in the
repository. The script does not create missing labels.

Required labels are defined in the [Issue Labels](/docs/project/issue-labels.md)
document.

## Manual Creation Alternative

If you prefer to create issues manually:

1. Go to the GitHub repository and click on "Issues" tab
2. Click "New issue"
3. Select the appropriate template
4. Copy content from the issues-data.json file for each issue
5. Apply appropriate labels
6. Click "Submit new issue"

## Troubleshooting

If issues occur during creation:

- Verify your GitHub token has sufficient permissions
- Check that all required labels exist in the repository
- Ensure you have stable internet connectivity
- Check the console output for specific error messages

For any problems, refer to the
[GitHub REST API documentation](https://docs.github.com/en/rest/reference/issues)
for additional troubleshooting.
