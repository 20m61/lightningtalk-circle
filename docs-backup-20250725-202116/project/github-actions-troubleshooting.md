# GitHub Actions Troubleshooting Guide

This guide addresses common issues and errors that may occur when running GitHub Actions workflows for issue creation and management.

## Common Errors

### CAPIError: 400 Bad Request

This error typically occurs when GitHub Actions cannot properly connect to the GitHub API or when the request is malformed.

#### Possible Causes and Solutions

1. **Insufficient Permissions**
   - **Problem**: The GITHUB_TOKEN does not have sufficient permissions to create issues.
   - **Solution**: 
     - Go to Repository Settings > Actions > General
     - Under "Workflow permissions", select "Read and write permissions"
     - Save the changes

2. **Firewall Blocking**
   - **Problem**: Firewall rules are blocking connections to required endpoints.
   - **Solution**:
     - Configure [Actions setup steps](https://gh.io/copilot/actions-setup-steps) to run before the firewall is enabled
     - Add required URLs to the [firewall allow list](https://gh.io/copilot/firewall-config):
       - `api.github.com`
       - `cdn.fwupd.org` (if mentioned in error logs)
       - Any other URLs listed in error messages

3. **Workflow YAML Configuration Issues**
   - **Problem**: The workflow YAML file has syntax or configuration errors.
   - **Solution**:
     - Validate the YAML syntax
     - Ensure all required permissions are correctly specified:
       ```yaml
       permissions:
         issues: write
         contents: read
       ```

4. **Rate Limiting**
   - **Problem**: GitHub API rate limits have been exceeded.
   - **Solution**:
     - Implement rate limiting handling in the scripts
     - Add delays between API calls
     - Batch requests where possible

## Verifying Environment Setup

To ensure GitHub Actions can successfully execute the issue creation scripts:

1. **Check Actions Environment**
   ```yaml
   - name: Debug environment
     run: |
       echo "GitHub Actor: ${{ github.actor }}"
       echo "GitHub Token Permissions: ${{ toJSON(github.token_permissions) }}"
       echo "Runner OS: ${{ runner.os }}"
   ```

2. **Verify Node.js Setup**
   ```yaml
   - name: Verify Node.js
     run: |
       node --version
       npm --version
   ```

3. **Check Token Availability**
   ```yaml
   - name: Verify token access
     run: |
       if [ -n "${{ secrets.GITHUB_TOKEN }}" ]; then
         echo "Token is available"
       else
         echo "Token is NOT available"
       fi
   ```

## Modifying the Workflow for Increased Reliability

If you continue to experience issues with the workflow, you can modify it to increase reliability:

1. **Add Retry Logic**
   ```yaml
   - name: Create issues
     uses: nick-invision/retry@v2
     with:
       timeout_minutes: 10
       max_attempts: 3
       retry_on: error
       command: node scripts/create-issues.js
     env:
       GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
       NODE_ENV: production
   ```

2. **Splitting the Workflow**

   If creating all issues at once causes issues, split the workflow:

   ```yaml
   jobs:
     create-infrastructure-issues:
       runs-on: ubuntu-latest
       steps:
         # Setup steps...
         - name: Create infrastructure issues
           run: node scripts/create-issues.js infrastructure
           
     create-core-issues:
       needs: create-infrastructure-issues
       runs-on: ubuntu-latest
       steps:
         # Setup steps...
         - name: Create core issues
           run: node scripts/create-issues.js core
   ```

3. **Use GitHub CLI Instead of API**
   
   As an alternative to the Octokit API:
   
   ```yaml
   - name: Setup GitHub CLI
     uses: cli/cli@v2
     
   - name: Create issues from data
     run: |
       jq -c '.infrastructure_foundation_issues[]' docs/project/issues-data.json | while read issue; do
         title=$(echo $issue | jq -r '.title')
         body=$(echo $issue | jq -r '.body')
         labels=$(echo $issue | jq -r '.labels | join(",")')
         gh issue create --title "$title" --body "$body" --label "$labels"
         sleep 2  # Avoid rate limiting
       done
   ```

## Manual Verification After Workflow Execution

After executing the workflow, manually verify:

1. Go to the Issues tab on GitHub
2. Check that issues were created with the correct:
   - Titles
   - Descriptions
   - Labels
   - Assignees (if specified)

3. If any issues are missing, check the workflow run logs for specific errors related to those issues

## Getting Help

If these troubleshooting steps don't resolve the issue:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Search for similar issues in the [GitHub Community Forum](https://github.community/)
3. Consider reaching out to GitHub Support if you believe it's a platform issue
4. For repository-specific issues, create a new issue in the repository for assistance