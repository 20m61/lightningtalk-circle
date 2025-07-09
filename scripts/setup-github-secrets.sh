#!/bin/bash

# GitHub Secrets Setup Script
# This script helps you set up GitHub Actions secrets for deployment

echo "🔐 GitHub Secrets Setup for Lightning Talk Circle"
echo "================================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "📦 Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub."
    echo "🔑 Run: gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
if [ -z "$REPO" ]; then
    echo "❌ Not in a GitHub repository directory."
    exit 1
fi

echo "📂 Repository: $REPO"
echo ""

# Function to set a secret
set_secret() {
    local name=$1
    local value=$2
    local description=$3
    
    echo "Setting $name - $description"
    echo "$value" | gh secret set "$name" -R "$REPO"
}

# Read secrets
echo "Please enter the following values:"
echo ""

read -p "AWS_ACCESS_KEY_ID: " AWS_ACCESS_KEY_ID
read -p "AWS_SECRET_ACCESS_KEY: " AWS_SECRET_ACCESS_KEY
read -p "AWS Region (e.g., us-east-1): " AWS_REGION
read -p "JWT_SECRET (generate with: node scripts/generate-secrets.js): " JWT_SECRET
read -p "SESSION_SECRET (generate with: node scripts/generate-secrets.js): " SESSION_SECRET
read -p "GITHUB_TOKEN (with repo permissions): " GITHUB_TOKEN_VALUE

echo ""
echo "📝 Setting GitHub Secrets..."
echo ""

# Set AWS credentials
set_secret "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "AWS Access Key"
set_secret "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" "AWS Secret Key"
set_secret "AWS_REGION" "$AWS_REGION" "AWS Region"

# Set application secrets
set_secret "JWT_SECRET" "$JWT_SECRET" "JWT signing secret"
set_secret "SESSION_SECRET" "$SESSION_SECRET" "Session secret"
set_secret "GITHUB_TOKEN" "$GITHUB_TOKEN_VALUE" "GitHub API token"

# Optional secrets
echo ""
echo "Optional secrets (press Enter to skip):"
read -p "EMAIL_USER (for email service): " EMAIL_USER
read -p "EMAIL_PASSWORD (for email service): " EMAIL_PASSWORD
read -p "SENDGRID_API_KEY (if using SendGrid): " SENDGRID_API_KEY

if [ ! -z "$EMAIL_USER" ]; then
    set_secret "EMAIL_USER" "$EMAIL_USER" "Email service user"
fi

if [ ! -z "$EMAIL_PASSWORD" ]; then
    set_secret "EMAIL_PASSWORD" "$EMAIL_PASSWORD" "Email service password"
fi

if [ ! -z "$SENDGRID_API_KEY" ]; then
    set_secret "SENDGRID_API_KEY" "$SENDGRID_API_KEY" "SendGrid API key"
fi

echo ""
echo "✅ GitHub Secrets have been set successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Verify secrets in: https://github.com/$REPO/settings/secrets/actions"
echo "2. Run: git push origin main (to trigger deployment)"
echo "3. Monitor Actions: https://github.com/$REPO/actions"
echo ""
echo "🔒 Security reminder: Never commit secrets to your repository!"