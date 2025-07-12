#!/bin/bash
# Script to remove sensitive files from Git history
# WARNING: This will rewrite Git history!

set -euo pipefail

echo "⚠️  WARNING: This script will rewrite Git history!"
echo "This action cannot be undone. Make sure you have a backup."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo "🔍 Checking for sensitive files in Git history..."

# Files to remove from history
FILES_TO_REMOVE=(
    ".env.backup.20250710-063618"
    ".env.backup.20250710-063629"
    ".env.backup.20250710-063640"
)

# Check if git-filter-repo is available
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo is not installed."
    echo "Installing git-filter-repo..."
    
    # Try to install git-filter-repo
    if command -v pip3 &> /dev/null; then
        pip3 install --user git-filter-repo
    else
        echo "❌ pip3 not found. Please install git-filter-repo manually:"
        echo "   pip3 install git-filter-repo"
        echo "   or"
        echo "   https://github.com/newren/git-filter-repo/blob/main/INSTALL.md"
        exit 1
    fi
fi

echo "📝 Creating list of files to remove..."
rm -f /tmp/paths-to-remove.txt
for file in "${FILES_TO_REMOVE[@]}"; do
    echo "$file" >> /tmp/paths-to-remove.txt
done

echo "🚀 Running git-filter-repo to remove files from history..."
git-filter-repo --invert-paths --paths-from-file /tmp/paths-to-remove.txt --force

echo "✅ Files removed from Git history!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Force push to all branches:"
echo "   git push origin --all --force"
echo "   git push origin --tags --force"
echo ""
echo "2. All team members must:"
echo "   - Delete their local repositories"
echo "   - Re-clone the repository"
echo ""
echo "3. Consider rotating any credentials that may have been exposed"
echo ""
echo "🎉 Done!"

# Clean up
rm -f /tmp/paths-to-remove.txt