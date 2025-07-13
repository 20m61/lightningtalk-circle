#!/usr/bin/env node

/**
 * Bundle Optimization Script
 * JavaScriptとCSSの最小化とバンドル最適化
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { minify as terserMinify } from 'terser';
import CleanCSS from 'clean-css';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BundleOptimizer {
  constructor() {
    this.results = {
      js: {
        processed: 0,
        saved: 0,
        errors: []
      },
      css: {
        processed: 0,
        saved: 0,
        errors: []
      }
    };
  }

  async optimize() {
    console.log('📦 Starting bundle optimization...\n');

    // Optimize JavaScript files
    await this.optimizeJavaScript();

    // Optimize CSS files
    await this.optimizeCSS();

    // Create bundle manifest
    await this.createManifest();

    // Print summary
    this.printSummary();
  }

  async optimizeJavaScript() {
    console.log('🔧 Optimizing JavaScript files...\n');

    const publicJsDir = path.join(process.cwd(), 'public/js');
    const jsFiles = await this.findFiles(publicJsDir, '.js');

    for (const file of jsFiles) {
      // Skip already minified files
      if (file.includes('.min.') || file.includes('-min.')) {
        continue;
      }

      await this.minifyJavaScript(file);
    }
  }

  async minifyJavaScript(filePath) {
    try {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`Processing: ${relativePath}`);

      const code = await fs.readFile(filePath, 'utf8');
      const originalSize = Buffer.byteLength(code);

      // Skip if already minified (simple heuristic)
      const avgLineLength = code.length / code.split('\n').length;
      if (avgLineLength > 200) {
        console.log('  ✓ Already minified, skipping\n');
        return;
      }

      // Terser options
      const terserOptions = {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
          dead_code: true,
          unused: true,
          passes: 2
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        },
        sourceMap: {
          filename: path.basename(filePath),
          url: `${path.basename(filePath)}.map`
        }
      };

      // Minify the code
      const result = await terserMinify(code, terserOptions);

      if (result.code) {
        const minifiedSize = Buffer.byteLength(result.code);
        const saved = originalSize - minifiedSize;

        // Create minified filename
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath, '.js');
        const minifiedPath = path.join(dir, `${basename}.min.js`);

        // Write minified file
        await fs.writeFile(minifiedPath, result.code);

        // Write source map if available
        if (result.map) {
          await fs.writeFile(`${minifiedPath}.map`, result.map);
        }

        this.results.js.processed++;
        this.results.js.saved += saved;

        console.log(`  ✓ Created ${path.basename(minifiedPath)}`);
        console.log(
          `  ✓ Saved ${this.formatBytes(saved)} (${Math.round((saved / originalSize) * 100)}%)\n`
        );
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      this.results.js.errors.push({ file: filePath, error: error.message });
    }
  }

  async optimizeCSS() {
    console.log('🎨 Optimizing CSS files...\n');

    const publicCssDir = path.join(process.cwd(), 'public/css');
    const cssFiles = await this.findFiles(publicCssDir, '.css');

    for (const file of cssFiles) {
      // Skip already minified files
      if (file.includes('.min.') || file.includes('-min.')) {
        continue;
      }

      await this.minifyCSS(file);
    }
  }

  async minifyCSS(filePath) {
    try {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`Processing: ${relativePath}`);

      const code = await fs.readFile(filePath, 'utf8');
      const originalSize = Buffer.byteLength(code);

      // Clean-CSS options
      const cleanCSSOptions = {
        level: {
          1: {
            specialComments: 0
          },
          2: {
            mergeAdjacentRules: true,
            mergeIntoShorthands: true,
            mergeMedia: true,
            mergeNonAdjacentRules: true,
            mergeSemantically: false,
            overrideProperties: true,
            removeEmpty: true,
            reduceNonAdjacentRules: true,
            removeDuplicateFontRules: true,
            removeDuplicateMediaBlocks: true,
            removeDuplicateRules: true,
            removeUnusedAtRules: false
          }
        },
        sourceMap: true,
        sourceMapInlineSources: true
      };

      // Minify the CSS
      const output = new CleanCSS(cleanCSSOptions).minify(code);

      if (output.styles) {
        const minifiedSize = Buffer.byteLength(output.styles);
        const saved = originalSize - minifiedSize;

        // Create minified filename
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath, '.css');
        const minifiedPath = path.join(dir, `${basename}.min.css`);

        // Write minified file
        await fs.writeFile(minifiedPath, output.styles);

        // Write source map if available
        if (output.sourceMap) {
          const sourceMapPath = `${minifiedPath}.map`;
          await fs.writeFile(sourceMapPath, output.sourceMap.toString());

          // Append source map reference
          const mapReference = `\n/*# sourceMappingURL=${path.basename(sourceMapPath)} */`;
          await fs.appendFile(minifiedPath, mapReference);
        }

        this.results.css.processed++;
        this.results.css.saved += saved;

        console.log(`  ✓ Created ${path.basename(minifiedPath)}`);
        console.log(
          `  ✓ Saved ${this.formatBytes(saved)} (${Math.round((saved / originalSize) * 100)}%)`
        );

        // Report warnings
        if (output.warnings && output.warnings.length > 0) {
          console.log(`  ⚠️  Warnings: ${output.warnings.join(', ')}`);
        }

        console.log('');
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      this.results.css.errors.push({ file: filePath, error: error.message });
    }
  }

  async createManifest() {
    console.log('📋 Creating asset manifest...\n');

    const manifest = {
      version: new Date().toISOString(),
      assets: {}
    };

    // Add JS files to manifest
    const jsFiles = await this.findFiles(path.join(process.cwd(), 'public/js'), '.js');
    for (const file of jsFiles) {
      const relativePath = path.relative(path.join(process.cwd(), 'public'), file);
      const content = await fs.readFile(file, 'utf8');
      const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);

      manifest.assets[relativePath] = {
        hash,
        size: Buffer.byteLength(content),
        mtime: (await fs.stat(file)).mtime.toISOString()
      };
    }

    // Add CSS files to manifest
    const cssFiles = await this.findFiles(path.join(process.cwd(), 'public/css'), '.css');
    for (const file of cssFiles) {
      const relativePath = path.relative(path.join(process.cwd(), 'public'), file);
      const content = await fs.readFile(file, 'utf8');
      const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);

      manifest.assets[relativePath] = {
        hash,
        size: Buffer.byteLength(content),
        mtime: (await fs.stat(file)).mtime.toISOString()
      };
    }

    // Write manifest
    const manifestPath = path.join(process.cwd(), 'public/asset-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`  ✓ Created asset manifest with ${Object.keys(manifest.assets).length} assets\n`);
  }

  async findFiles(dir, ...extensions) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
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

  formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  printSummary() {
    console.log('📊 Optimization Summary');
    console.log('======================\n');

    console.log('JavaScript:');
    console.log(`  Files processed: ${this.results.js.processed}`);
    console.log(`  Total saved: ${this.formatBytes(this.results.js.saved)}`);
    if (this.results.js.errors.length > 0) {
      console.log(`  Errors: ${this.results.js.errors.length}`);
    }

    console.log('\nCSS:');
    console.log(`  Files processed: ${this.results.css.processed}`);
    console.log(`  Total saved: ${this.formatBytes(this.results.css.saved)}`);
    if (this.results.css.errors.length > 0) {
      console.log(`  Errors: ${this.results.css.errors.length}`);
    }

    const totalSaved = this.results.js.saved + this.results.css.saved;
    console.log(`\n✅ Total space saved: ${this.formatBytes(totalSaved)}`);
  }
}

// Check if required modules are installed
try {
  await import('terser');
  await import('clean-css');
} catch (error) {
  console.error('❌ Required modules not installed. Please run:');
  console.error('   npm install terser clean-css');
  process.exit(1);
}

// Run the optimizer
const optimizer = new BundleOptimizer();
optimizer.optimize().catch(error => {
  console.error('Bundle optimization failed:', error);
  process.exit(1);
});
