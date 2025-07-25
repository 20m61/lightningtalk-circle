#!/bin/bash

# Docker image packaging script
# This script builds and packages Docker images

set -e

VERSION=$(node -p "require('./package.json').version")
ARTIFACT_DIR="build-artifacts/docker/v${VERSION}"
IMAGE_NAME="lightningtalk-circle"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🐳 Packaging Docker images (v${VERSION})..."

# Create artifact directory
mkdir -p "$ARTIFACT_DIR"

# Build Docker image
echo "🔧 Building Docker image..."
docker build -t "${IMAGE_NAME}:${VERSION}" .

# Tag as latest
docker tag "${IMAGE_NAME}:${VERSION}" "${IMAGE_NAME}:latest"

# Save Docker image to tar file
echo "💾 Saving Docker image to tar file..."
docker save "${IMAGE_NAME}:${VERSION}" | gzip > "${ARTIFACT_DIR}/${IMAGE_NAME}-v${VERSION}.tar.gz"

# Build production Docker image if Dockerfile.production exists
if [ -f "docker/Dockerfile.production" ]; then
    echo "🔧 Building production Docker image..."
    docker build -f docker/Dockerfile.production -t "${IMAGE_NAME}-prod:${VERSION}" .
    docker tag "${IMAGE_NAME}-prod:${VERSION}" "${IMAGE_NAME}-prod:latest"
    docker save "${IMAGE_NAME}-prod:${VERSION}" | gzip > "${ARTIFACT_DIR}/${IMAGE_NAME}-prod-v${VERSION}.tar.gz"
fi

# Create latest symlink
rm -rf "build-artifacts/docker/latest"
ln -sf "v${VERSION}" "build-artifacts/docker/latest"

# Generate package info
cat > "${ARTIFACT_DIR}/package-info.json" << EOF
{
  "name": "lightningtalk-docker",
  "version": "${VERSION}",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD)",
  "images": [
    $(ls ${ARTIFACT_DIR}/*.tar.gz 2>/dev/null | sed 's/.*\///' | sed 's/^/    "/' | sed 's/$/"/' | paste -sd ',' -)
  ],
  "docker_version": "$(docker --version)",
  "base_image_size": "$(docker images ${IMAGE_NAME}:${VERSION} --format 'table {{.Size}}' | tail -n 1)"
}
EOF

# Create deployment script
cat > "${ARTIFACT_DIR}/deploy-docker.sh" << 'EOF'
#!/bin/bash
# Docker deployment script

set -e

VERSION="$1"
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

IMAGE_NAME="lightningtalk-circle"
ARTIFACT_FILE="${IMAGE_NAME}-v${VERSION}.tar.gz"

if [ ! -f "$ARTIFACT_FILE" ]; then
    echo "Error: Artifact file not found: $ARTIFACT_FILE"
    exit 1
fi

echo "🚀 Deploying Docker image v${VERSION}..."

# Load Docker image
gunzip -c "$ARTIFACT_FILE" | docker load

# Run container
docker run -d \
    --name "lightningtalk-${VERSION}" \
    -p 3000:3000 \
    "${IMAGE_NAME}:${VERSION}"

echo "✅ Container deployed successfully"
echo "🌐 Application available at: http://localhost:3000"
EOF

chmod +x "${ARTIFACT_DIR}/deploy-docker.sh"

echo "✅ Docker packages created in: ${ARTIFACT_DIR}/"
echo "📊 Package info: ${ARTIFACT_DIR}/package-info.json"
echo "🚀 Deployment script: ${ARTIFACT_DIR}/deploy-docker.sh"
echo "🔗 Latest symlink: build-artifacts/docker/latest -> v${VERSION}"