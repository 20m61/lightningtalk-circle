# Scripts for Lightning Talk Circle

This directory contains utility scripts for managing the Lightning Talk Circle project.

## Available Scripts

### `create-issues.js`

This script automates the creation of GitHub issues based on the structured data in `docs/project/issues-data.json`.

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

#### Customization

If you need to modify the issues to be created:

1. Edit the `docs/project/issues-data.json` file
2. Follow the existing structure for each issue type
3. Ensure all required fields are included (title, body, labels)

## Additional Resources

For more information about issue management in this project, see:

- [Issue Execution Guide](/docs/project/issue-execution-guide.md)
- [Issue Implementation Guide](/docs/project/issue-implementation-guide.md)
- [Issue Management Guide](/docs/project/issue-management-guide.md)