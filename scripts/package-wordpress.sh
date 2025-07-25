#!/bin/bash

# WordPress themes packaging script
# This script packages WordPress themes for deployment

set -e

VERSION=$(node -p "require('./package.json').version")
ARTIFACT_DIR="build-artifacts/wordpress/v${VERSION}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🎨 Packaging WordPress themes (v${VERSION})..."

# Create artifact directory
mkdir -p "$ARTIFACT_DIR"

# Package traditional WordPress child theme
if [ -d "wordpress/lightningtalk-child" ]; then
    echo "📦 Creating traditional WordPress theme package..."
    cd wordpress/lightningtalk-child
    
    # Build theme assets if gulp is available
    if command -v gulp &> /dev/null && [ -f "gulpfile.js" ]; then
        echo "🔧 Building theme assets..."
        npm run wp:build 2>/dev/null || echo "⚠️ Theme build failed, packaging anyway..."
    fi
    
    zip -r "../../${ARTIFACT_DIR}/lightningtalk-child-v${VERSION}.zip" . \
        -x '*.log' \
        -x 'node_modules/*' \
        -x '.git/*' \
        -x '*.development.*' \
        -x 'src/*' \
        -x 'gulpfile.js' \
        -x 'package*.json'
    cd ../..
fi

# Package modern WordPress theme
if [ -d "lightningtalk-modern" ]; then
    echo "📦 Creating modern WordPress theme package..."
    cd lightningtalk-modern
    
    # Build modern theme
    if [ -f "package.json" ]; then
        echo "🔧 Building modern theme..."
        npm run build 2>/dev/null || echo "⚠️ Modern theme build failed, packaging anyway..."
    fi
    
    # Package the built theme
    if [ -d "dist" ]; then
        cd dist
        zip -r "../../${ARTIFACT_DIR}/lightningtalk-modern-v${VERSION}.zip" . \
            -x '*.log' \
            -x 'node_modules/*' \
            -x '.git/*'
        cd ..
    else
        # Package source if no dist directory
        zip -r "../${ARTIFACT_DIR}/lightningtalk-modern-v${VERSION}.zip" . \
            -x '*.log' \
            -x 'node_modules/*' \
            -x '.git/*' \
            -x '*.development.*' \
            -x 'src/*' \
            -x 'tests/*'
    fi
    cd ..
fi

# Create latest symlink
rm -rf "build-artifacts/wordpress/latest"
ln -sf "v${VERSION}" "build-artifacts/wordpress/latest"

# Generate package info
cat > "${ARTIFACT_DIR}/package-info.json" << EOF
{
  "name": "lightningtalk-wordpress-themes",
  "version": "${VERSION}",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD)",
  "themes": [
    $(ls ${ARTIFACT_DIR}/*.zip 2>/dev/null | sed 's/.*\///' | sed 's/^/    "/' | sed 's/$/"/' | paste -sd ',' -)
  ]
}
EOF

echo "✅ WordPress theme packages created in: ${ARTIFACT_DIR}/"
echo "📊 Package info: ${ARTIFACT_DIR}/package-info.json"
echo "🔗 Latest symlink: build-artifacts/wordpress/latest -> v${VERSION}"