#!/bin/bash

# Fix CloudFront OAI configuration

DISTRIBUTION_ID="E337IUZ2XC4I1W"
OAI_ID="E2GER0JZXTD39Q"

echo "Fixing CloudFront distribution OAI configuration..."

# Get current distribution config
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > /tmp/dist-config.json

# Extract ETag
ETAG=$(jq -r '.ETag' /tmp/dist-config.json)

# Update the configuration
jq '.DistributionConfig.Origins.Items[0].S3OriginConfig.OriginAccessIdentity = "origin-access-identity/cloudfront/'$OAI_ID'"' /tmp/dist-config.json | jq '.DistributionConfig' > /tmp/updated-config.json

# Update the distribution
echo "Updating distribution..."
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file:///tmp/updated-config.json --if-match $ETAG

echo "Distribution updated. It may take a few minutes to propagate."
echo "CloudFront URL: https://d167teaukwsg2s.cloudfront.net"