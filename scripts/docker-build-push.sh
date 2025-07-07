#!/bin/bash

# Docker Build and Push Script for Lightning Talk Circle
# Usage: ./docker-build-push.sh [environment] [tag]

set -e

# Parameters
ENVIRONMENT=${1:-dev}
TAG=${2:-latest}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Invalid environment. Must be dev, staging, or prod."
    exit 1
fi

# Load environment-specific configuration
source "$(dirname "$0")/../.env.${ENVIRONMENT}" 2>/dev/null || true

# AWS configuration
AWS_REGION=${AWS_REGION:-ap-northeast-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="lightningtalk-circle-api"
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${ECR_URL}/${ECR_REPOSITORY}:${TAG}"

echo "🚀 Starting Docker build and push process..."
echo "Environment: ${ENVIRONMENT}"
echo "Tag: ${TAG}"
echo "ECR Repository: ${ECR_URL}/${ECR_REPOSITORY}"

# Authenticate Docker to ECR
echo "🔐 Authenticating with ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}

# Create ECR repository if it doesn't exist
echo "📦 Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} >/dev/null 2>&1 || \
    aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION}

# Build Docker image
echo "🔨 Building Docker image..."
docker build \
    --build-arg NODE_ENV=${ENVIRONMENT} \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg VERSION=${TAG} \
    -t ${ECR_REPOSITORY}:${TAG} \
    -t ${IMAGE_URI} \
    -f docker/Dockerfile.production \
    .

# Tag image for ECR
echo "🏷️  Tagging image..."
docker tag ${ECR_REPOSITORY}:${TAG} ${IMAGE_URI}

# Push image to ECR
echo "📤 Pushing image to ECR..."
docker push ${IMAGE_URI}

# Optional: Tag as latest if not already
if [ "${TAG}" != "latest" ]; then
    echo "🏷️  Tagging as latest..."
    docker tag ${IMAGE_URI} ${ECR_URL}/${ECR_REPOSITORY}:latest
    docker push ${ECR_URL}/${ECR_REPOSITORY}:latest
fi

echo "✅ Docker build and push completed successfully!"
echo "Image URI: ${IMAGE_URI}"

# Clean up local images (optional)
read -p "Clean up local Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker rmi ${ECR_REPOSITORY}:${TAG} ${IMAGE_URI} || true
    echo "🧹 Local cleanup completed"
fi