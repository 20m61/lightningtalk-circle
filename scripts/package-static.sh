#!/bin/bash

# Static site packaging script
# This script packages the static frontend for deployment

set -e

VERSION=$(node -p "require('./package.json').version")
ARTIFACT_DIR="build-artifacts/static/v${VERSION}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "📦 Packaging static site (v${VERSION})..."

# Create artifact directory
mkdir -p "$ARTIFACT_DIR"

# Build static assets if needed
if [ ! -d "public/js" ] || [ ! -d "public/css" ]; then
    echo "⚠️  Warning: Static assets not found. Building..."
    npm run build:static
fi

# Package static site
echo "📁 Creating static package..."
cd public && zip -r "../${ARTIFACT_DIR}/lightningtalk-static-v${VERSION}.zip" . \
    -x '*.map' \
    -x '*test*' \
    -x '*.development.*' \
    -x 'node_modules/*'

# Create latest symlink
cd ..
rm -rf "build-artifacts/static/latest"
ln -sf "v${VERSION}" "build-artifacts/static/latest"

# Generate package info
cat > "${ARTIFACT_DIR}/package-info.json" << EOF
{
  "name": "lightningtalk-static",
  "version": "${VERSION}",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD)",
  "package_size": "$(du -h ${ARTIFACT_DIR}/lightningtalk-static-v${VERSION}.zip | cut -f1)"
}
EOF

echo "✅ Static package created: ${ARTIFACT_DIR}/lightningtalk-static-v${VERSION}.zip"
echo "📊 Package info: ${ARTIFACT_DIR}/package-info.json"
echo "🔗 Latest symlink: build-artifacts/static/latest -> v${VERSION}"