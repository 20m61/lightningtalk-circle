#!/bin/bash

# WordPress Theme Package Builder
# Creates a proper WordPress theme package

echo "🚀 Building WordPress Theme Package..."

# Change to the project root
cd /home/ec2-user/workspace/lightningtalk-circle

# Create clean build directory
rm -rf dist/wordpress-theme
mkdir -p dist/wordpress-theme

# Copy WordPress theme files
echo "📦 Copying theme files..."
cp -r theme/* dist/wordpress-theme/

# Remove non-WordPress files from the theme package
echo "🧹 Cleaning up non-WordPress files..."
rm -f dist/wordpress-theme/index.html
rm -f dist/wordpress-theme/registration-form.html
rm -f dist/wordpress-theme/manifest.json
rm -f dist/wordpress-theme/sw.js
rm -f dist/wordpress-theme/screenshot.txt
rm -f dist/wordpress-theme/package.json
rm -f dist/wordpress-theme/robots.txt
rm -f dist/wordpress-theme/sitemap.xml
rm -f dist/wordpress-theme/DEPLOYMENT.md
rm -f dist/wordpress-theme/deploy.sh
rm -f dist/wordpress-theme/*.zip
rm -f dist/wordpress-theme/*.tar.gz
rm -rf dist/wordpress-theme/dist/

# Ensure proper file permissions
chmod 644 dist/wordpress-theme/*.php
chmod 644 dist/wordpress-theme/*.css
chmod 755 dist/wordpress-theme/

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Create WordPress theme ZIP
echo "📦 Creating WordPress theme package..."
cd dist
zip -r "lightningtalk-wordpress-theme-v${VERSION}.zip" wordpress-theme/
cd ..

echo "✅ WordPress theme package created: dist/lightningtalk-wordpress-theme-v${VERSION}.zip"

# List the contents for verification
echo "📋 Package contents:"
unzip -l "dist/lightningtalk-wordpress-theme-v${VERSION}.zip"

echo "🎉 WordPress theme build completed!"