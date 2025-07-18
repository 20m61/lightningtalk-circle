#!/usr/bin/env node

/**
 * Image Optimization Script
 * 画像の最適化とWebP変換
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png'];
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 85;
const PNG_QUALITY = 90;
const WEBP_QUALITY = 80;

class ImageOptimizer {
  constructor() {
    this.processedImages = 0;
    this.savedBytes = 0;
    this.errors = [];
  }

  async optimize() {
    console.log('🖼️  Starting image optimization...\n');

    const publicDir = path.join(process.cwd(), 'public');
    const images = await this.findImages(publicDir);

    console.log(`Found ${images.length} images to process\n`);

    for (const imagePath of images) {
      await this.processImage(imagePath);
    }

    this.printSummary();
  }

  async findImages(dir) {
    const images = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subImages = await this.findImages(fullPath);
          images.push(...subImages);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_FORMATS.includes(ext)) {
            images.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }

    return images;
  }

  async processImage(imagePath) {
    try {
      const stats = await fs.stat(imagePath);
      const originalSize = stats.size;

      console.log(`Processing: ${path.relative(process.cwd(), imagePath)}`);

      // Read image metadata
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      // Skip if already optimized (has specific comment)
      if (metadata.exif?.ImageDescription?.includes('Optimized by Lightning Talk Circle')) {
        console.log('  ✓ Already optimized, skipping\n');
        return;
      }

      // Optimize based on format
      let optimizedImage = image;

      // Resize if too large
      if (metadata.width > MAX_WIDTH) {
        optimizedImage = optimizedImage.resize(MAX_WIDTH, null, {
          withoutEnlargement: true,
          fit: 'inside'
        });
        console.log(`  → Resized from ${metadata.width}px to ${MAX_WIDTH}px`);
      }

      // Apply format-specific optimizations
      if (metadata.format === 'jpeg') {
        optimizedImage = optimizedImage.jpeg({
          quality: JPEG_QUALITY,
          progressive: true,
          mozjpeg: true
        });
      } else if (metadata.format === 'png') {
        optimizedImage = optimizedImage.png({
          quality: PNG_QUALITY,
          compressionLevel: 9,
          progressive: true
        });
      }

      // Add optimization marker
      optimizedImage = optimizedImage.withMetadata({
        exif: {
          ImageDescription: 'Optimized by Lightning Talk Circle'
        }
      });

      // Save optimized version
      const tempPath = `${imagePath}.tmp`;
      await optimizedImage.toFile(tempPath);

      // Check new size
      const newStats = await fs.stat(tempPath);
      const newSize = newStats.size;

      // Only replace if smaller
      if (newSize < originalSize) {
        await fs.rename(tempPath, imagePath);
        const saved = originalSize - newSize;
        this.savedBytes += saved;
        console.log(
          `  ✓ Saved ${this.formatBytes(saved)} (${Math.round((saved / originalSize) * 100)}%)`
        );
      } else {
        await fs.unlink(tempPath);
        console.log('  ✓ Already optimal size');
      }

      // Create WebP version
      await this.createWebP(imagePath, metadata);

      this.processedImages++;
      console.log('');
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      this.errors.push({ path: imagePath, error: error.message });
    }
  }

  async createWebP(imagePath, metadata) {
    const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    // Skip if WebP already exists
    try {
      await fs.access(webpPath);
      console.log('  ✓ WebP version already exists');
      return;
    } catch {
      // WebP doesn't exist, create it
    }

    try {
      let webpImage = sharp(imagePath);

      // Resize if needed
      if (metadata.width > MAX_WIDTH) {
        webpImage = webpImage.resize(MAX_WIDTH, null, {
          withoutEnlargement: true,
          fit: 'inside'
        });
      }

      // Convert to WebP
      await webpImage
        .webp({
          quality: WEBP_QUALITY,
          effort: 6, // 0-6, higher = better compression
          smartSubsample: true
        })
        .toFile(webpPath);

      // Check WebP size
      const originalStats = await fs.stat(imagePath);
      const webpStats = await fs.stat(webpPath);

      const saved = originalStats.size - webpStats.size;
      this.savedBytes += saved;

      console.log(
        `  ✓ Created WebP: saved ${this.formatBytes(saved)} (${Math.round((saved / originalStats.size) * 100)}%)`
      );
    } catch (error) {
      console.error(`  ⚠️  WebP creation failed: ${error.message}`);
    }
  }

  formatBytes(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  printSummary() {
    console.log('\n📊 Optimization Summary');
    console.log('======================');
    console.log(`Images processed: ${this.processedImages}`);
    console.log(`Total space saved: ${this.formatBytes(this.savedBytes)}`);

    if (this.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${this.errors.length}`);
      this.errors.forEach(err => {
        console.log(`  - ${path.relative(process.cwd(), err.path)}: ${err.error}`);
      });
    }

    console.log('\n✅ Image optimization complete!');
  }
}

// Check if sharp is installed
try {
  await import('sharp');
} catch (error) {
  console.error('❌ Sharp is not installed. Please run: npm install sharp');
  process.exit(1);
}

// Run the optimizer
const optimizer = new ImageOptimizer();
optimizer.optimize().catch(error => {
  console.error('Image optimization failed:', error);
  process.exit(1);
});
