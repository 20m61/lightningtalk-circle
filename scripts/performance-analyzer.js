#!/usr/bin/env node

/**
 * Performance Analyzer for Lightning Talk Circle
 * パフォーマンスの分析と最適化提案
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { gzipSync } from 'zlib';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

class PerformanceAnalyzer {
  constructor() {
    this.results = {
      css: {
        files: [],
        totalSize: 0,
        gzippedSize: 0,
        unusedSelectors: [],
        duplicates: []
      },
      js: {
        files: [],
        totalSize: 0,
        gzippedSize: 0,
        largeFiles: []
      },
      images: {
        files: [],
        totalSize: 0,
        unoptimized: []
      },
      overall: {
        criticalCssSize: 0,
        totalAssetSize: 0,
        recommendations: []
      }
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async analyze() {
    this.log('\n🚀 Lightning Talk Circle Performance Analyzer', 'blue');
    this.log('==========================================\n', 'blue');

    // 1. Analyze CSS files
    await this.analyzeCSSFiles();

    // 2. Analyze JavaScript files
    await this.analyzeJavaScriptFiles();

    // 3. Analyze image assets
    await this.analyzeImages();

    // 4. Check for optimization opportunities
    await this.checkOptimizationOpportunities();

    // 5. Analyze bundle sizes
    await this.analyzeBundleSizes();

    // 6. Check caching strategies
    await this.checkCachingStrategies();

    // 7. Generate performance report
    this.generateReport();
  }

  async analyzeCSSFiles() {
    this.log('📊 Analyzing CSS Files...', 'yellow');

    const cssDir = path.join(process.cwd(), 'public/css');
    const cssFiles = await this.findFiles(cssDir, '.css');

    for (const file of cssFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const stats = await fs.stat(file);
        const gzipped = gzipSync(content);

        const fileInfo = {
          path: path.relative(process.cwd(), file),
          size: stats.size,
          gzippedSize: gzipped.length,
          selectors: this.extractSelectors(content),
          rules: content.match(/{[^}]*}/g)?.length || 0
        };

        this.results.css.files.push(fileInfo);
        this.results.css.totalSize += fileInfo.size;
        this.results.css.gzippedSize += fileInfo.gzippedSize;

        // Check for large CSS files
        if (fileInfo.size > 50000) {
          // 50KB
          this.results.overall.recommendations.push({
            type: 'css',
            severity: 'high',
            message: `Large CSS file: ${fileInfo.path} (${this.formatSize(fileInfo.size)})`,
            recommendation: 'Consider splitting into smaller files or removing unused CSS'
          });
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    // Check for duplicate selectors
    await this.checkDuplicateSelectors();

    this.log(
      `  ✓ Analyzed ${cssFiles.length} CSS files (${this.formatSize(this.results.css.totalSize)})`,
      'green'
    );
  }

  async analyzeJavaScriptFiles() {
    this.log('\n📊 Analyzing JavaScript Files...', 'yellow');

    const jsDirectories = ['public/js', 'public/build/js', 'server'];
    let allJsFiles = [];

    for (const dir of jsDirectories) {
      const fullPath = path.join(process.cwd(), dir);
      const files = await this.findFiles(fullPath, '.js', '.mjs');
      allJsFiles = allJsFiles.concat(files);
    }

    for (const file of allJsFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const stats = await fs.stat(file);
        const gzipped = gzipSync(content);

        const fileInfo = {
          path: path.relative(process.cwd(), file),
          size: stats.size,
          gzippedSize: gzipped.length,
          hasSourceMap: content.includes('//# sourceMappingURL='),
          isMinified: this.isMinified(content)
        };

        this.results.js.files.push(fileInfo);
        this.results.js.totalSize += fileInfo.size;
        this.results.js.gzippedSize += fileInfo.gzippedSize;

        // Check for large JS files
        if (fileInfo.size > 100000) {
          // 100KB
          this.results.js.largeFiles.push(fileInfo);
          this.results.overall.recommendations.push({
            type: 'js',
            severity: 'high',
            message: `Large JavaScript file: ${fileInfo.path} (${this.formatSize(fileInfo.size)})`,
            recommendation: 'Consider code splitting or lazy loading'
          });
        }

        // Check for unminified files in production paths
        if (fileInfo.path.includes('public/') && !fileInfo.isMinified && fileInfo.size > 5000) {
          this.results.overall.recommendations.push({
            type: 'js',
            severity: 'medium',
            message: `Unminified JavaScript: ${fileInfo.path}`,
            recommendation: 'Minify JavaScript files for production'
          });
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    this.log(
      `  ✓ Analyzed ${allJsFiles.length} JavaScript files (${this.formatSize(this.results.js.totalSize)})`,
      'green'
    );
  }

  async analyzeImages() {
    this.log('\n📊 Analyzing Image Assets...', 'yellow');

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const imageDir = path.join(process.cwd(), 'public');
    let allImages = [];

    for (const ext of imageExtensions) {
      const images = await this.findFiles(imageDir, ext);
      allImages = allImages.concat(images);
    }

    for (const image of allImages) {
      try {
        const stats = await fs.stat(image);
        const ext = path.extname(image).toLowerCase();

        const imageInfo = {
          path: path.relative(process.cwd(), image),
          size: stats.size,
          format: ext,
          hasWebP: false
        };

        // Check for WebP alternatives
        const webpPath = image.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        try {
          await fs.access(webpPath);
          imageInfo.hasWebP = true;
        } catch {
          // No WebP alternative
        }

        this.results.images.files.push(imageInfo);
        this.results.images.totalSize += imageInfo.size;

        // Check for large images
        if (imageInfo.size > 500000) {
          // 500KB
          this.results.images.unoptimized.push(imageInfo);
          this.results.overall.recommendations.push({
            type: 'image',
            severity: 'high',
            message: `Large image: ${imageInfo.path} (${this.formatSize(imageInfo.size)})`,
            recommendation: 'Optimize image size and consider WebP format'
          });
        }

        // Check for missing WebP
        if (
          (ext === '.jpg' || ext === '.jpeg' || ext === '.png') &&
          !imageInfo.hasWebP &&
          imageInfo.size > 50000
        ) {
          this.results.overall.recommendations.push({
            type: 'image',
            severity: 'medium',
            message: `No WebP alternative for: ${imageInfo.path}`,
            recommendation: 'Generate WebP version for better compression'
          });
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    this.log(
      `  ✓ Analyzed ${allImages.length} images (${this.formatSize(this.results.images.totalSize)})`,
      'green'
    );
  }

  async checkOptimizationOpportunities() {
    this.log('\n🔍 Checking Optimization Opportunities...', 'yellow');

    // Check for critical CSS
    const criticalCssPath = path.join(process.cwd(), 'public/css/critical.css');
    try {
      const stats = await fs.stat(criticalCssPath);
      this.results.overall.criticalCssSize = stats.size;

      if (stats.size > 14000) {
        // 14KB
        this.results.overall.recommendations.push({
          type: 'critical-css',
          severity: 'medium',
          message: `Critical CSS is large (${this.formatSize(stats.size)})`,
          recommendation: 'Reduce critical CSS to under 14KB for optimal performance'
        });
      }
    } catch {
      this.results.overall.recommendations.push({
        type: 'critical-css',
        severity: 'high',
        message: 'No critical CSS file found',
        recommendation: 'Extract and inline critical CSS for faster initial render'
      });
    }

    // Check for font optimization
    const fontFiles = await this.findFiles(
      path.join(process.cwd(), 'public'),
      '.woff',
      '.woff2',
      '.ttf',
      '.otf'
    );
    const hasWoff2 = fontFiles.some(f => f.endsWith('.woff2'));

    if (fontFiles.length > 0 && !hasWoff2) {
      this.results.overall.recommendations.push({
        type: 'fonts',
        severity: 'medium',
        message: 'No WOFF2 fonts found',
        recommendation: 'Use WOFF2 format for better compression'
      });
    }

    // Check for preload/prefetch
    const indexPath = path.join(process.cwd(), 'public/index.html');
    try {
      const indexContent = await fs.readFile(indexPath, 'utf8');

      if (!indexContent.includes('rel="preload"') && !indexContent.includes('rel="prefetch"')) {
        this.results.overall.recommendations.push({
          type: 'resource-hints',
          severity: 'medium',
          message: 'No preload/prefetch hints found',
          recommendation: 'Add resource hints for critical assets'
        });
      }

      if (!indexContent.includes('loading="lazy"')) {
        this.results.overall.recommendations.push({
          type: 'lazy-loading',
          severity: 'medium',
          message: 'No lazy loading attributes found',
          recommendation: 'Add loading="lazy" to below-the-fold images'
        });
      }
    } catch {
      // Index file not found
    }

    this.log('  ✓ Optimization check complete', 'green');
  }

  async analyzeBundleSizes() {
    this.log('\n📦 Analyzing Bundle Sizes...', 'yellow');

    // Calculate total asset size
    this.results.overall.totalAssetSize =
      this.results.css.totalSize + this.results.js.totalSize + this.results.images.totalSize;

    // Check for vendor bundles
    const vendorFiles = this.results.js.files.filter(
      f => f.path.includes('vendor') || f.path.includes('node_modules')
    );

    if (vendorFiles.length > 0) {
      const vendorSize = vendorFiles.reduce((sum, f) => sum + f.size, 0);
      if (vendorSize > 200000) {
        // 200KB
        this.results.overall.recommendations.push({
          type: 'vendor-bundle',
          severity: 'high',
          message: `Large vendor bundle (${this.formatSize(vendorSize)})`,
          recommendation: 'Review and tree-shake vendor dependencies'
        });
      }
    }

    this.log(
      `  ✓ Total asset size: ${this.formatSize(this.results.overall.totalAssetSize)}`,
      'green'
    );
  }

  async checkCachingStrategies() {
    this.log('\n🗄️  Checking Caching Strategies...', 'yellow');

    // Check for service worker
    const swPath = path.join(process.cwd(), 'public/sw.js');
    const hasServiceWorker = await this.fileExists(swPath);

    if (!hasServiceWorker) {
      this.results.overall.recommendations.push({
        type: 'caching',
        severity: 'medium',
        message: 'No service worker found',
        recommendation: 'Implement service worker for offline functionality and caching'
      });
    }

    // Check for cache headers in server
    const appPath = path.join(process.cwd(), 'server/app.js');
    try {
      const appContent = await fs.readFile(appPath, 'utf8');

      if (!appContent.includes('Cache-Control')) {
        this.results.overall.recommendations.push({
          type: 'caching',
          severity: 'medium',
          message: 'No Cache-Control headers configured',
          recommendation: 'Add appropriate Cache-Control headers for static assets'
        });
      }
    } catch {
      // App file not found
    }

    this.log('  ✓ Caching strategy check complete', 'green');
  }

  // Helper methods
  async findFiles(dir, ...extensions) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.findFiles(fullPath, ...extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory not found
    }

    return files;
  }

  extractSelectors(cssContent) {
    const selectorRegex = /([^{]+){[^}]*}/g;
    const selectors = [];
    let match;

    while ((match = selectorRegex.exec(cssContent)) !== null) {
      const selector = match[1].trim();
      if (selector && !selector.includes('@')) {
        selectors.push(selector);
      }
    }

    return selectors;
  }

  async checkDuplicateSelectors() {
    const allSelectors = [];

    for (const file of this.results.css.files) {
      for (const selector of file.selectors) {
        allSelectors.push({ selector, file: file.path });
      }
    }

    const selectorCounts = {};
    for (const { selector, file } of allSelectors) {
      if (!selectorCounts[selector]) {
        selectorCounts[selector] = [];
      }
      selectorCounts[selector].push(file);
    }

    for (const [selector, files] of Object.entries(selectorCounts)) {
      if (files.length > 2) {
        this.results.css.duplicates.push({
          selector,
          files: [...new Set(files)],
          count: files.length
        });
      }
    }

    if (this.results.css.duplicates.length > 10) {
      this.results.overall.recommendations.push({
        type: 'css',
        severity: 'medium',
        message: `Found ${this.results.css.duplicates.length} duplicate selectors`,
        recommendation: 'Consolidate duplicate CSS rules'
      });
    }
  }

  isMinified(content) {
    // Simple heuristic: minified files have long lines and few newlines
    const lines = content.split('\n');
    const avgLineLength = content.length / lines.length;
    return avgLineLength > 200 || lines.length < 10;
  }

  formatSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async fileExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  generateReport() {
    this.log('\n📊 Performance Analysis Report', 'blue');
    this.log('=============================\n', 'blue');

    // Asset Summary
    this.log('📁 Asset Summary:', 'cyan');
    this.log(
      `  CSS Files: ${this.results.css.files.length} (${this.formatSize(this.results.css.totalSize)} / ${this.formatSize(this.results.css.gzippedSize)} gzipped)`
    );
    this.log(
      `  JS Files: ${this.results.js.files.length} (${this.formatSize(this.results.js.totalSize)} / ${this.formatSize(this.results.js.gzippedSize)} gzipped)`
    );
    this.log(
      `  Images: ${this.results.images.files.length} (${this.formatSize(this.results.images.totalSize)})`
    );
    this.log(`  Total Size: ${this.formatSize(this.results.overall.totalAssetSize)}`);

    // Performance Score
    const score = this.calculatePerformanceScore();
    this.log(
      `\n🏆 Performance Score: ${score}/100`,
      score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'
    );

    // Top Issues
    if (this.results.overall.recommendations.length > 0) {
      this.log('\n⚠️  Top Performance Issues:', 'yellow');

      const highPriority = this.results.overall.recommendations.filter(r => r.severity === 'high');
      const mediumPriority = this.results.overall.recommendations.filter(
        r => r.severity === 'medium'
      );

      if (highPriority.length > 0) {
        this.log('\n🔴 High Priority:', 'red');
        highPriority.slice(0, 5).forEach(rec => {
          this.log(`  • ${rec.message}`);
          this.log(`    → ${rec.recommendation}`, 'green');
        });
      }

      if (mediumPriority.length > 0) {
        this.log('\n🟡 Medium Priority:', 'yellow');
        mediumPriority.slice(0, 5).forEach(rec => {
          this.log(`  • ${rec.message}`);
          this.log(`    → ${rec.recommendation}`, 'green');
        });
      }
    }

    // Quick Wins
    this.log('\n🎯 Quick Performance Wins:', 'blue');
    const quickWins = this.getQuickWins();
    quickWins.forEach((win, index) => {
      this.log(`${index + 1}. ${win}`);
    });

    // Save detailed report
    this.saveDetailedReport();
  }

  calculatePerformanceScore() {
    let score = 100;

    // Penalize for large files
    const largeCSS = this.results.css.files.filter(f => f.size > 50000).length;
    const largeJS = this.results.js.files.filter(f => f.size > 100000).length;
    const largeImages = this.results.images.files.filter(f => f.size > 500000).length;

    score -= largeCSS * 5;
    score -= largeJS * 10;
    score -= largeImages * 3;

    // Penalize for missing optimizations
    const { recommendations } = this.results.overall;
    const highPriority = recommendations.filter(r => r.severity === 'high').length;
    const mediumPriority = recommendations.filter(r => r.severity === 'medium').length;

    score -= highPriority * 10;
    score -= mediumPriority * 3;

    // Bonus for optimizations
    if (this.results.overall.criticalCssSize > 0 && this.results.overall.criticalCssSize < 14000) {
      score += 5;
    }

    const hasWebP = this.results.images.files.some(f => f.hasWebP);
    if (hasWebP) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  getQuickWins() {
    const wins = [];

    if (this.results.js.largeFiles.length > 0) {
      wins.push('Enable code splitting for large JavaScript files');
    }

    if (this.results.images.unoptimized.length > 0) {
      wins.push(`Optimize ${this.results.images.unoptimized.length} large images`);
    }

    const unminifiedCount = this.results.js.files.filter(
      f => !f.isMinified && f.size > 5000
    ).length;
    if (unminifiedCount > 0) {
      wins.push(`Minify ${unminifiedCount} JavaScript files`);
    }

    if (!this.results.overall.criticalCssSize) {
      wins.push('Extract and inline critical CSS');
    }

    if (this.results.css.duplicates.length > 10) {
      wins.push('Remove duplicate CSS selectors');
    }

    return wins.slice(0, 5);
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      score: this.calculatePerformanceScore(),
      summary: {
        css: {
          files: this.results.css.files.length,
          totalSize: this.results.css.totalSize,
          gzippedSize: this.results.css.gzippedSize
        },
        js: {
          files: this.results.js.files.length,
          totalSize: this.results.js.totalSize,
          gzippedSize: this.results.js.gzippedSize,
          largeFiles: this.results.js.largeFiles.length
        },
        images: {
          files: this.results.images.files.length,
          totalSize: this.results.images.totalSize,
          unoptimized: this.results.images.unoptimized.length
        }
      },
      recommendations: this.results.overall.recommendations,
      quickWins: this.getQuickWins()
    };

    try {
      await fs.writeFile('performance-analysis-report.json', JSON.stringify(report, null, 2));
      this.log('\n📄 Detailed report saved to performance-analysis-report.json', 'green');
    } catch (error) {
      this.log('\n❌ Failed to save detailed report', 'red');
    }
  }
}

// Run the analyzer
const analyzer = new PerformanceAnalyzer();
analyzer.analyze().catch(error => {
  console.error('Performance analysis failed:', error);
  process.exit(1);
});
