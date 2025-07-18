# Scripts for Lightning Talk Circle

This directory contains utility scripts for managing the Lightning Talk Circle
project.

## Available Scripts

### `create-issues.js`

This script automates the creation of GitHub issues based on the structured data
in `docs/project/issues-data.json`.

#### Prerequisites

- Node.js (v14.x or later)
- npm packages: `@octokit/rest`, `dotenv`
- GitHub Personal Access Token with `repo` scope

#### Setup

1. Install dependencies:

   ```bash
   npm install @octokit/rest dotenv
   ```

2. Create a `.env` file in the repository root:
   ```
   GITHUB_TOKEN=your_personal_access_token
   ```

#### Usage

Run the script from the repository root:

```bash
node scripts/create-issues.js
```

The script will:

- Check for existing issues in the repository
- Prompt for confirmation before creating new issues
- Create all issues defined in the data file
- Apply appropriate labels to each issue

### `verify-issues.js`

This script verifies that all expected issues have been created in the GitHub
repository and checks if they have the appropriate labels and content.

#### Prerequisites

- Node.js (v14.x or later)
- npm packages: `@octokit/rest`, `dotenv`, `chalk`
- GitHub Personal Access Token with `repo` scope

#### Setup

1. Install dependencies:

   ```bash
   npm install @octokit/rest dotenv chalk
   ```

2. Create a `.env` file in the repository root (if not already created):
   ```
   GITHUB_TOKEN=your_personal_access_token
   ```

#### Usage

Run the script from the repository root:

```bash
node scripts/verify-issues.js
```

The script will:

- Compare expected issues from the data file with the actual issues in the
  repository
- Check for missing issues
- Verify that all issues have the expected labels
- Provide a detailed report of any discrepancies

### `create-issues-local.sh`

This shell script provides a simple way to create GitHub issues using the GitHub
CLI when Node.js scripts or GitHub Actions workflows are not working.

#### Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- `jq` command-line JSON processor
- Permission to create issues in the repository

#### Setup

1. Install GitHub CLI: https://cli.github.com/manual/installation
2. Install jq: https://stedolan.github.io/jq/download/
3. Login to GitHub CLI:
   ```bash
   gh auth login
   ```

#### Usage

Run the script from the scripts directory:

```bash
cd scripts
./create-issues-local.sh
```

The script will:

- Check for prerequisites (gh, jq)
- Count the number of issues to be created
- Prompt for confirmation
- Create each issue using the GitHub CLI
- Report success or failures

## Customization

If you need to modify the issues to be created:

1. Edit the `docs/project/issues-data.json` file
2. Follow the existing structure for each issue type
3. Ensure all required fields are included (title, body, labels)

## Troubleshooting

If you're experiencing problems with issue creation:

1. Check the GitHub Actions troubleshooting guide:
   [GitHub Actions Troubleshooting](/docs/project/github-actions-troubleshooting.md)
2. Try the detailed execution steps:
   [Issue Creation Execution Steps](/docs/project/issue-creation-execution-steps.md)
3. If GitHub Actions is not working, use the `create-issues-local.sh` script as
   an alternative

## Additional Resources

For more information about issue management in this project, see:

- [Issue Implementation Steps](/docs/project/issue-implementation-steps.md)
- [Issue Creation Checklist](/docs/project/issue-creation-checklist.md)
- [Issue Creation Tutorial](/docs/project/issue-creation-tutorial.md)
- [Issue Management Guide](/docs/project/issue-management-guide.md)
