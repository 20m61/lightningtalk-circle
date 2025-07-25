#!/bin/bash

# Lambda packaging script
# This script packages Lambda functions for serverless deployment

set -e

VERSION=$(node -p "require('./package.json').version")
ARTIFACT_DIR="build-artifacts/serverless/v${VERSION}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Packaging Lambda functions (v${VERSION})..."

# Create artifact directory
mkdir -p "$ARTIFACT_DIR"

# Package API Lambda
if [ -d "lambda-deploy" ]; then
    echo "📦 Creating API Lambda package..."
    cd lambda-deploy
    zip -r "../${ARTIFACT_DIR}/api-lambda-v${VERSION}.zip" . \
        -x 'node_modules/.*' \
        -x '*.log' \
        -x '*.test.js' \
        -x 'test/*'
    cd ..
fi

# Package Server Lambda (from server directory)
if [ -d "server" ]; then
    echo "📦 Creating Server Lambda package..."
    cd server
    
    # Create temporary package directory
    TEMP_DIR=$(mktemp -d)
    
    # Copy necessary files
    cp -r . "$TEMP_DIR/"
    
    # Remove development files
    rm -rf "$TEMP_DIR/node_modules"
    rm -rf "$TEMP_DIR/uploads"
    rm -f "$TEMP_DIR"/*.log
    rm -f "$TEMP_DIR"/*.test.js
    
    # Create lambda handler if doesn't exist
    if [ ! -f "$TEMP_DIR/lambda.js" ]; then
        cat > "$TEMP_DIR/lambda.js" << 'EOF'
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./app.js');

exports.handler = serverlessExpress({ app });
EOF
    fi
    
    # Package
    cd "$TEMP_DIR"
    zip -r "${OLDPWD}/${ARTIFACT_DIR}/server-lambda-v${VERSION}.zip" . -x '*.map'
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    cd ..
fi

# Package WebSocket Lambda
if [ -d "server/websocket" ]; then
    echo "📦 Creating WebSocket Lambda package..."
    cd server/websocket
    zip -r "../../${ARTIFACT_DIR}/websocket-lambda-v${VERSION}.zip" . \
        -x 'node_modules/.*' \
        -x '*.log' \
        -x '*.test.js'
    cd ../..
fi

# Create latest symlink
rm -rf "build-artifacts/serverless/latest"
ln -sf "v${VERSION}" "build-artifacts/serverless/latest"

# Generate package info
cat > "${ARTIFACT_DIR}/package-info.json" << EOF
{
  "name": "lightningtalk-serverless",
  "version": "${VERSION}",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD)",
  "packages": [
    $(ls ${ARTIFACT_DIR}/*.zip 2>/dev/null | sed 's/.*\///' | sed 's/^/    "/' | sed 's/$/"/' | paste -sd ',' -)
  ]
}
EOF

echo "✅ Lambda packages created in: ${ARTIFACT_DIR}/"
echo "📊 Package info: ${ARTIFACT_DIR}/package-info.json"
echo "🔗 Latest symlink: build-artifacts/serverless/latest -> v${VERSION}"