#!/bin/bash

# Workspace cleanup script
# Usage: ./scripts/cleanup-workspace.sh

echo "🧹 Starting workspace cleanup..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for deleted items
DELETED_COUNT=0

# Function to safely remove files/directories
safe_remove() {
    local target="$1"
    if [ -e "$target" ]; then
        rm -rf "$target"
        ((DELETED_COUNT++))
        echo -e "${GREEN}✓${NC} Removed: $target"
    fi
}

# 1. Remove temporary files
echo -e "\n${YELLOW}Cleaning temporary files...${NC}"
find . -type f \( -name "*.tmp" -o -name "*.temp" -o -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.orig" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./cdk/node_modules/*" \
    -not -path "./lightningtalk-modern/node_modules/*" \
    | while read -r file; do
        safe_remove "$file"
    done

# 2. Remove log files (except important ones)
echo -e "\n${YELLOW}Cleaning log files...${NC}"
find . -type f -name "*.log" \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./logs/*" \
    | while read -r file; do
        safe_remove "$file"
    done

# 3. Remove test artifacts
echo -e "\n${YELLOW}Cleaning test artifacts...${NC}"
safe_remove "error-report.json"
safe_remove "error-check-screenshot.png"
safe_remove "responsive-test-results.md"
safe_remove "test-results.xml"

# 4. Remove screenshot directories
echo -e "\n${YELLOW}Cleaning screenshot directories...${NC}"
for dir in screenshots-temp screenshots-automated-ui-tests screenshots-baseline screenshots-diff screenshots-ui-verification; do
    safe_remove "$dir"
done

# 5. Remove PR documentation
echo -e "\n${YELLOW}Cleaning PR documentation...${NC}"
find . -type f \( -name "PR-*-REVIEW.md" -o -name "PR-SELF-REVIEW-*.md" -o -name "PR-*-DETAILED-REVIEW.md" \) \
    -not -path "./.git/*" \
    | while read -r file; do
        safe_remove "$file"
    done

# 6. Remove OS-specific files
echo -e "\n${YELLOW}Cleaning OS-specific files...${NC}"
find . -type f \( -name ".DS_Store" -o -name "Thumbs.db" -o -name "desktop.ini" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    | while read -r file; do
        safe_remove "$file"
    done

# 7. Clean empty directories
echo -e "\n${YELLOW}Removing empty directories...${NC}"
find . -type d -empty \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./public/*" \
    -not -path "./server/*" \
    -not -path "./scripts/*" \
    -not -path "./docs/*" \
    | while read -r dir; do
        safe_remove "$dir"
    done

# Summary
echo -e "\n${GREEN}✅ Cleanup complete!${NC}"
echo -e "Total items removed: ${DELETED_COUNT}"

# Optional: Show disk usage
echo -e "\n${YELLOW}Current disk usage:${NC}"
du -sh . 2>/dev/null | grep -v "Permission denied"

echo -e "\n💡 Tip: Run 'git status' to see if any important changes need to be committed."