#!/bin/bash

# Build script for Lambda Layer dependencies
# This script installs production dependencies for the Lambda layer

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Building Lambda Layer dependencies...${NC}"

# Change to nodejs directory
cd nodejs

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf node_modules package-lock.json

# Install production dependencies
echo -e "${YELLOW}Installing production dependencies...${NC}"
npm install --production --no-package-lock

# Remove unnecessary files to reduce layer size
echo -e "${YELLOW}Optimizing layer size...${NC}"
find node_modules -name "*.md" -delete
find node_modules -name "*.txt" -delete
find node_modules -name "*.yml" -delete
find node_modules -name "*.yaml" -delete
find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name ".github" -type d -exec rm -rf {} + 2>/dev/null || true

# Display layer size
LAYER_SIZE=$(du -sh node_modules | cut -f1)
echo -e "${GREEN}Layer size: ${LAYER_SIZE}${NC}"

# Check if layer size is within Lambda limits (250MB unzipped)
LAYER_SIZE_BYTES=$(du -sb node_modules | cut -f1)
MAX_SIZE_BYTES=$((250 * 1024 * 1024))

if [ ${LAYER_SIZE_BYTES} -gt ${MAX_SIZE_BYTES} ]; then
    echo -e "${RED}Warning: Layer size exceeds Lambda limit of 250MB${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Lambda Layer build completed successfully!${NC}"