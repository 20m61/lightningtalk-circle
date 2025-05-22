#!/bin/bash

# Local Issue Creation Script
# This script provides a simple way to create GitHub issues from the JSON data file
# when GitHub Actions workflows aren't working.

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first:"
    echo "https://cli.github.com/manual/installation"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is not installed. Please install it first:"
    echo "https://stedolan.github.io/jq/download/"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "Please login to GitHub first:"
    echo "gh auth login"
    exit 1
fi

# Variables
REPO="20m61/lightningtalk-circle"
DATA_FILE="$(dirname "$(realpath "$0")")/../docs/project/issues-data.json"
CATEGORIES=("infrastructure_foundation_issues" "core_feature_issues" "enhancement_optimization_issues" "compliance_maintenance_issues")
TOTAL_ISSUES=0
CREATED_ISSUES=0
FAILED_ISSUES=0

# Functions
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

create_issue() {
    local title=$(echo "$1" | jq -r '.title')
    local body=$(echo "$1" | jq -r '.body')
    local labels=$(echo "$1" | jq -r '.labels | join(",")')
    local category="$2"
    
    echo "Creating issue: $title (Category: $category)"
    
    if gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"; then
        echo "✅ Issue created successfully"
        CREATED_ISSUES=$((CREATED_ISSUES + 1))
    else
        echo "❌ Failed to create issue"
        FAILED_ISSUES=$((FAILED_ISSUES + 1))
    fi
    
    # Add a small delay to avoid hitting rate limits
    sleep 1
}

# Main script

echo "======================================"
echo "GitHub Issue Creation Script (Local)"
echo "======================================"
echo 
echo "This script will create GitHub issues from the data file: $DATA_FILE"
echo "Repository: $REPO"
echo 

# Check if data file exists
if [[ ! -f "$DATA_FILE" ]]; then
    echo "Error: Data file not found: $DATA_FILE"
    echo "Make sure you are running this script from the scripts directory"
    exit 1
fi

# Count total issues
for category in "${CATEGORIES[@]}"; do
    count=$(jq -r ".$category | length" "$DATA_FILE")
    echo "Category: $category - $count issues"
    TOTAL_ISSUES=$((TOTAL_ISSUES + count))
done

echo 
echo "Total issues to create: $TOTAL_ISSUES"
echo 

# Confirm creation
if ! confirm "Do you want to proceed with creating these issues?"; then
    echo "Operation cancelled"
    exit 0
fi

echo 
echo "Starting issue creation..."
echo 

# Create issues for each category
for category in "${CATEGORIES[@]}"; do
    echo "======================================"
    echo "Creating issues for category: $category"
    echo "======================================"
    
    # Extract issues for this category
    issues=$(jq -c ".$category[]" "$DATA_FILE")
    
    # Loop through each issue and create it
    echo "$issues" | while read -r issue; do
        create_issue "$issue" "$category"
    done
    
    echo "Completed category: $category"
    echo 
done

# Print summary
echo "======================================"
echo "Issue Creation Summary"
echo "======================================"
echo "Total issues: $TOTAL_ISSUES"
echo "Created: $CREATED_ISSUES"
echo "Failed: $FAILED_ISSUES"
echo 

if [[ $FAILED_ISSUES -gt 0 ]]; then
    echo "⚠️ Some issues failed to create. Please check the output above for errors."
    exit 1
else
    echo "✅ All issues were created successfully!"
    exit 0
fi