#!/bin/bash
# Logo optimization script

cd "$(dirname "$0")/.."

# Install required tools if not present
if ! command -v convert &> /dev/null; then
    echo "Installing ImageMagick..."
    sudo yum install -y ImageMagick
fi

if ! command -v cwebp &> /dev/null; then
    echo "Installing WebP tools..."
    sudo yum install -y libwebp-tools
fi

echo "🎨 Optimizing logo files..."

# Create optimized versions
echo "Creating optimized JPEG..."
convert public/icons/logo.jpeg \
    -resize 512x512 \
    -quality 85 \
    -strip \
    public/icons/logo-optimized.jpg

echo "Creating WebP version..."
cwebp -q 85 public/icons/logo.jpeg -o public/icons/logo.webp

echo "Creating smaller sizes..."
# Header size (45x45)
convert public/icons/logo.jpeg \
    -resize 90x90 \
    -quality 90 \
    -strip \
    public/icons/logo-header.jpg

cwebp -q 90 public/icons/logo-header.jpg -o public/icons/logo-header.webp

# Hero size (240x240 for retina)
convert public/icons/logo.jpeg \
    -resize 240x240 \
    -quality 85 \
    -strip \
    public/icons/logo-hero.jpg

cwebp -q 85 public/icons/logo-hero.jpg -o public/icons/logo-hero.webp

# Footer size (120x120 for retina)
convert public/icons/logo.jpeg \
    -resize 120x120 \
    -quality 90 \
    -strip \
    public/icons/logo-footer.jpg

cwebp -q 90 public/icons/logo-footer.jpg -o public/icons/logo-footer.webp

echo "📊 File sizes:"
ls -lh public/icons/logo* | grep -E "\.(jpg|jpeg|webp)$"

echo "✅ Logo optimization complete!"