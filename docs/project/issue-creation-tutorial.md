# Issue Creation Command Line Tutorial

This tutorial provides step-by-step command line instructions for executing the issue creation process using the provided Node.js script.

## Prerequisites

- Node.js installed (version 14.x or higher)
- GitHub Personal Access Token with `repo` scope
- Git client installed

## Step 1: Clone the Repository

If you haven't already cloned the repository:

```bash
git clone https://github.com/20m61/lightningtalk-circle.git
cd lightningtalk-circle
```

## Step 2: Install Dependencies

Install the required npm packages:

```bash
npm install @octokit/rest dotenv
```

## Step 3: Set Up GitHub Token

Create a `.env` file to store your GitHub token:

```bash
# Create the .env file
touch .env

# Add your token to the file
echo "GITHUB_TOKEN=your_personal_access_token" > .env

# Verify the file has been created with the correct content (without showing the actual token)
cat .env | grep -v "GITHUB_TOKEN"
```

Replace `your_personal_access_token` with your actual GitHub token.

## Step 4: Validate the Issues Data

Check the issues data file to ensure it contains the expected content:

```bash
# View the structure of the issues data
cat docs/project/issues-data.json | grep "title"
```

You should see a list of issue titles from all categories.

## Step 5: Run the Issue Creation Script

Execute the Node.js script to create issues:

```bash
node scripts/create-issues.js
```

The script will:
1. Check for existing issues
2. Prompt for confirmation
3. Create issues sequentially by category
4. Report progress

## Step 6: Verify Issue Creation

Check that the issues were created successfully:

```bash
# If you have the GitHub CLI installed
gh issue list --repo 20m61/lightningtalk-circle

# Alternatively, visit the GitHub website:
# https://github.com/20m61/lightningtalk-circle/issues
```

## Troubleshooting

If you encounter errors:

1. **Authentication Issues**:
   ```bash
   # Check if your token is correctly set
   grep -c "GITHUB_TOKEN" .env
   
   # If needed, recreate the .env file
   echo "GITHUB_TOKEN=your_new_token" > .env
   ```

2. **Script Errors**:
   ```bash
   # Run with Node.js debugging
   NODE_DEBUG=request node scripts/create-issues.js
   ```

3. **Rate Limiting**:
   If you hit GitHub's rate limits, wait a while before trying again.

## Example Full Execution

Here's an example of executing the entire process from start to finish:

```bash
# Clone repository
git clone https://github.com/20m61/lightningtalk-circle.git
cd lightningtalk-circle

# Install dependencies
npm install @octokit/rest dotenv

# Set up token
echo "GITHUB_TOKEN=ghp_your_token_here" > .env

# Run the script
node scripts/create-issues.js

# When prompted, type 'y' to confirm
```

By following this command-line tutorial, you should be able to successfully create all the planned issues in the GitHub repository.