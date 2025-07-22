#!/usr/bin/env node
/**
 * Multi-Device Design Validation Tester
 * マルチデバイスデザイン検証ツール
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const VALIDATION_DIR = './device-validation-results';

// デバイス仕様データベース
const DEVICE_PROFILES = {
  // Mobile Devices
  'iPhone 12 Pro': { width: 390, height: 844, dpr: 3, touch: true, name: 'iPhone 12 Pro' },
  'iPhone 14 Pro Max': { width: 430, height: 932, dpr: 3, touch: true, name: 'iPhone 14 Pro Max' },
  'iPhone SE': { width: 375, height: 667, dpr: 2, touch: true, name: 'iPhone SE (3rd gen)' },
  'Galaxy S21': { width: 360, height: 800, dpr: 3, touch: true, name: 'Samsung Galaxy S21' },
  'Pixel 7': { width: 393, height: 851, dpr: 2.75, touch: true, name: 'Google Pixel 7' },

  // Tablets
  'iPad Pro 11"': { width: 834, height: 1194, dpr: 2, touch: true, name: 'iPad Pro 11" (M2)' },
  'iPad Air': { width: 820, height: 1180, dpr: 2, touch: true, name: 'iPad Air (5th gen)' },
  'Galaxy Tab S8': { width: 753, height: 1037, dpr: 2, touch: true, name: 'Galaxy Tab S8' },
  'Surface Pro 9': { width: 912, height: 1368, dpr: 2, touch: true, name: 'Surface Pro 9' },

  // Desktop/Laptop
  'MacBook Air 13"': {
    width: 1440,
    height: 900,
    dpr: 2,
    touch: false,
    name: 'MacBook Air 13" (M2)'
  },
  'MacBook Pro 14"': { width: 1512, height: 982, dpr: 2, touch: false, name: 'MacBook Pro 14"' },
  'Surface Laptop': {
    width: 1536,
    height: 1024,
    dpr: 1.5,
    touch: true,
    name: 'Surface Laptop Studio'
  },
  'Desktop FHD': { width: 1920, height: 1080, dpr: 1, touch: false, name: 'Desktop Full HD' },
  'Desktop QHD': { width: 2560, height: 1440, dpr: 1, touch: false, name: 'Desktop QHD' },
  'Desktop 4K': { width: 3840, height: 2160, dpr: 1, touch: false, name: 'Desktop 4K' }
};

// 検証テスト項目
const VALIDATION_TESTS = {
  navigation: [
    'Header visibility and layout',
    'Navigation menu functionality',
    'Logo and brand consistency',
    'Touch target sizes (minimum 44px)',
    'Mobile menu behavior',
    'Authentication component placement'
  ],
  layout: [
    'Content overflow and wrapping',
    'Typography scaling and readability',
    'Button and form element sizing',
    'Image scaling and aspect ratios',
    'Grid and flexbox layouts',
    'Safe area handling (notches, etc.)'
  ],
  interactions: [
    'Touch/click responsiveness',
    'Hover states (desktop only)',
    'Focus indicators',
    'Gesture support (swipe, pinch)',
    'Keyboard navigation',
    'Animation performance'
  ],
  performance: [
    'Page load time',
    'Time to interactive',
    'Layout shift (CLS)',
    'First contentful paint',
    'JavaScript execution time',
    'Memory usage'
  ]
};

class MultiDeviceValidator {
  constructor() {
    this.browser = null;
    this.results = {
      summary: {
        timestamp: new Date().toISOString(),
        totalDevices: 0,
        passedDevices: 0,
        failedDevices: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      },
      devices: []
    };

    this.setupDirectories();
  }

  setupDirectories() {
    [VALIDATION_DIR, `${VALIDATION_DIR}/screenshots`, `${VALIDATION_DIR}/reports`].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async init() {
    console.log('🚀 Multi-Device Design Validation Starting...\n');

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    console.log('✅ Browser initialized for device validation\n');
  }

  async validateAllDevices() {
    const deviceCategories = {
      'Mobile Devices': Object.keys(DEVICE_PROFILES).filter(d => DEVICE_PROFILES[d].width < 500),
      'Tablet Devices': Object.keys(DEVICE_PROFILES).filter(
        d => DEVICE_PROFILES[d].width >= 500 && DEVICE_PROFILES[d].width < 1200
      ),
      'Desktop Devices': Object.keys(DEVICE_PROFILES).filter(d => DEVICE_PROFILES[d].width >= 1200)
    };

    for (const [category, devices] of Object.entries(deviceCategories)) {
      console.log(`📱 ${category} Validation:`);
      console.log('═'.repeat(50));

      for (const deviceName of devices) {
        await this.validateDevice(deviceName, DEVICE_PROFILES[deviceName]);
      }
      console.log('');
    }

    return this.generateComprehensiveReport();
  }

  async validateDevice(deviceName, deviceSpec) {
    console.log(`🔍 Testing: ${deviceSpec.name} (${deviceSpec.width}×${deviceSpec.height})`);

    const page = await this.browser.newPage();
    const deviceResult = {
      name: deviceName,
      spec: deviceSpec,
      tests: [],
      screenshots: [],
      performance: {},
      issues: [],
      passed: 0,
      failed: 0
    };

    try {
      // Device setup
      await page.setViewport({
        width: deviceSpec.width,
        height: deviceSpec.height,
        deviceScaleFactor: deviceSpec.dpr || 1,
        isMobile: deviceSpec.touch,
        hasTouch: deviceSpec.touch,
        isLandscape: false
      });

      // Performance monitoring
      await page.setCacheEnabled(false);
      const performanceMetrics = await this.measurePerformance(page);
      deviceResult.performance = performanceMetrics;

      // Navigation tests
      await this.testNavigationLayout(page, deviceResult);

      // Layout tests
      await this.testLayoutIntegrity(page, deviceResult);

      // Interaction tests
      await this.testInteractions(page, deviceResult, deviceSpec);

      // Accessibility tests
      await this.testAccessibility(page, deviceResult);

      // Screenshot capture
      const screenshotPath = `${VALIDATION_DIR}/screenshots/${deviceName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      deviceResult.screenshots.push(screenshotPath);

      // Results summary
      const devicePassed = deviceResult.failed === 0;
      console.log(
        `  ${devicePassed ? '✅' : '❌'} ${deviceSpec.name}: ${deviceResult.passed} passed, ${deviceResult.failed} failed`
      );

      if (deviceResult.issues.length > 0) {
        console.log(`    ⚠️  Issues: ${deviceResult.issues.length}`);
        deviceResult.issues.slice(0, 2).forEach(issue => {
          console.log(`       • ${issue}`);
        });
      }
    } catch (error) {
      console.log(`  ❌ ${deviceSpec.name}: Test execution failed - ${error.message}`);
      deviceResult.failed++;
      deviceResult.issues.push(`Test execution failed: ${error.message}`);
    } finally {
      await page.close();
    }

    this.results.devices.push(deviceResult);
    this.results.summary.totalDevices++;
    if (deviceResult.failed === 0) {
      this.results.summary.passedDevices++;
    } else {
      this.results.summary.failedDevices++;
    }
    this.results.summary.totalTests += deviceResult.passed + deviceResult.failed;
    this.results.summary.passedTests += deviceResult.passed;
    this.results.summary.failedTests += deviceResult.failed;
  }

  async measurePerformance(page) {
    console.log('    📊 Measuring performance...');
    const startTime = Date.now();

    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    const metrics = await page.metrics();
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        layoutShift: 0, // Would need additional setup for CLS measurement
        timeToInteractive: navigation.loadEventEnd - navigation.loadEventStart
      };
    });

    return {
      loadTime,
      jsHeapUsedSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024), // MB
      jsHeapTotalSize: Math.round(metrics.JSHeapTotalSize / 1024 / 1024), // MB
      ...performanceMetrics
    };
  }

  async testNavigationLayout(page, result) {
    console.log('    🧭 Testing navigation layout...');

    const tests = [
      {
        name: 'Header visibility',
        test: async () => {
          const header = await page.$('.header');
          return !!header && (await header.isIntersectingViewport());
        }
      },
      {
        name: 'Logo display',
        test: async () => {
          const logo = await page.$('.logo-container');
          return !!logo && (await logo.isIntersectingViewport());
        }
      },
      {
        name: 'Navigation structure',
        test: async () => {
          const nav = await page.$('nav.nav-links, .mobile-menu');
          return !!nav;
        }
      },
      {
        name: 'Mobile menu toggle (mobile only)',
        test: async () => {
          const viewport = await page.viewport();
          if (viewport.width >= 768) return true; // Skip on tablet/desktop

          const toggle = await page.$('.mobile-menu-toggle');
          return !!toggle && (await toggle.isIntersectingViewport());
        }
      }
    ];

    for (const testCase of tests) {
      try {
        const passed = await testCase.test();
        if (passed) {
          result.passed++;
        } else {
          result.failed++;
          result.issues.push(`Navigation: ${testCase.name} failed`);
        }
        result.tests.push({
          category: 'navigation',
          name: testCase.name,
          passed
        });
      } catch (error) {
        result.failed++;
        result.issues.push(`Navigation: ${testCase.name} error - ${error.message}`);
        result.tests.push({
          category: 'navigation',
          name: testCase.name,
          passed: false,
          error: error.message
        });
      }
    }
  }

  async testLayoutIntegrity(page, result) {
    console.log('    📐 Testing layout integrity...');

    const tests = [
      {
        name: 'Content overflow check',
        test: async () => {
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          const viewportWidth = await page.evaluate(() => window.innerWidth);
          return bodyWidth <= viewportWidth + 1; // Allow 1px tolerance
        }
      },
      {
        name: 'Touch target sizes',
        test: async () => {
          const touchTargets = await page.evaluate(() => {
            const elements = document.querySelectorAll('a, button, .mobile-menu-toggle');
            const smallTargets = [];

            elements.forEach(el => {
              const rect = el.getBoundingClientRect();
              if ((rect.width < 44 || rect.height < 44) && rect.width > 0 && rect.height > 0) {
                smallTargets.push({
                  selector: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
                  width: rect.width,
                  height: rect.height
                });
              }
            });

            return smallTargets;
          });

          if (touchTargets.length > 0) {
            result.issues.push(`Touch targets too small: ${touchTargets.length} elements`);
            return false;
          }
          return true;
        }
      },
      {
        name: 'Typography readability',
        test: async () => {
          const fontSizes = await page.evaluate(() => {
            const textElements = document.querySelectorAll(
              'p, span, a, button, h1, h2, h3, h4, h5, h6'
            );
            const smallText = [];

            textElements.forEach(el => {
              const style = window.getComputedStyle(el);
              const fontSize = parseFloat(style.fontSize);
              if (fontSize < 16 && fontSize > 0) {
                // Minimum readable size
                smallText.push({
                  fontSize,
                  element: el.tagName
                });
              }
            });

            return smallText;
          });

          return fontSizes.length === 0;
        }
      }
    ];

    for (const testCase of tests) {
      try {
        const passed = await testCase.test();
        if (passed) {
          result.passed++;
        } else {
          result.failed++;
          result.issues.push(`Layout: ${testCase.name} failed`);
        }
        result.tests.push({
          category: 'layout',
          name: testCase.name,
          passed
        });
      } catch (error) {
        result.failed++;
        result.issues.push(`Layout: ${testCase.name} error - ${error.message}`);
        result.tests.push({
          category: 'layout',
          name: testCase.name,
          passed: false,
          error: error.message
        });
      }
    }
  }

  async testInteractions(page, result, deviceSpec) {
    console.log('    👆 Testing interactions...');

    const tests = [
      {
        name: 'Mobile menu functionality',
        test: async () => {
          if (!deviceSpec.touch || deviceSpec.width >= 768) return true;

          const toggle = await page.$('.mobile-menu-toggle');
          if (!toggle) return false;

          await toggle.click();
          await new Promise(resolve => setTimeout(resolve, 500));

          const menuOpen = await page.evaluate(() => {
            const menu = document.querySelector('.mobile-menu');
            return menu && menu.classList.contains('mobile-menu--active');
          });

          return menuOpen;
        }
      },
      {
        name: 'Keyboard navigation',
        test: async () => {
          if (deviceSpec.touch && deviceSpec.width < 768) return true; // Skip on mobile

          await page.keyboard.press('Tab');
          await new Promise(resolve => setTimeout(resolve, 200));

          const focusedElement = await page.evaluate(() => {
            return document.activeElement && document.activeElement !== document.body;
          });

          return focusedElement;
        }
      },
      {
        name: 'Focus visibility',
        test: async () => {
          const focusVisible = await page.evaluate(() => {
            const style = window.getComputedStyle(document.activeElement, ':focus');
            return style.outline !== 'none' || style.boxShadow !== 'none';
          });

          return focusVisible;
        }
      }
    ];

    for (const testCase of tests) {
      try {
        const passed = await testCase.test();
        if (passed) {
          result.passed++;
        } else {
          result.failed++;
          result.issues.push(`Interaction: ${testCase.name} failed`);
        }
        result.tests.push({
          category: 'interactions',
          name: testCase.name,
          passed
        });
      } catch (error) {
        result.failed++;
        result.issues.push(`Interaction: ${testCase.name} error - ${error.message}`);
        result.tests.push({
          category: 'interactions',
          name: testCase.name,
          passed: false,
          error: error.message
        });
      }
    }
  }

  async testAccessibility(page, result) {
    console.log('    ♿ Testing accessibility...');

    const tests = [
      {
        name: 'ARIA labels',
        test: async () => {
          const ariaElements = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const missingAria = [];

            buttons.forEach(button => {
              if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
                missingAria.push(button.className || button.tagName);
              }
            });

            return missingAria.length === 0;
          });

          return ariaElements;
        }
      },
      {
        name: 'Color contrast',
        test: async () => {
          // Basic contrast check - in production would use axe-core
          const contrastIssues = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            let lowContrastCount = 0;

            // Simplified contrast check
            for (let i = 0; i < Math.min(elements.length, 100); i++) {
              const el = elements[i];
              const style = window.getComputedStyle(el);
              const color = style.color;
              const bgColor = style.backgroundColor;

              // Skip if no text or transparent background
              if (!el.textContent.trim() || bgColor === 'rgba(0, 0, 0, 0)') continue;

              // Very basic contrast estimation
              if (
                color === bgColor ||
                (color === 'rgb(255, 255, 255)' && bgColor === 'rgb(255, 255, 255)')
              ) {
                lowContrastCount++;
              }
            }

            return lowContrastCount < 5; // Allow some false positives
          });

          return contrastIssues;
        }
      }
    ];

    for (const testCase of tests) {
      try {
        const passed = await testCase.test();
        if (passed) {
          result.passed++;
        } else {
          result.failed++;
          result.issues.push(`Accessibility: ${testCase.name} failed`);
        }
        result.tests.push({
          category: 'accessibility',
          name: testCase.name,
          passed
        });
      } catch (error) {
        result.failed++;
        result.issues.push(`Accessibility: ${testCase.name} error - ${error.message}`);
        result.tests.push({
          category: 'accessibility',
          name: testCase.name,
          passed: false,
          error: error.message
        });
      }
    }
  }

  async generateComprehensiveReport() {
    console.log('\n📊 Generating comprehensive validation report...\n');

    const reportData = {
      ...this.results,
      summary: {
        ...this.results.summary,
        successRate:
          Math.round((this.results.summary.passedTests / this.results.summary.totalTests) * 100) ||
          0,
        deviceSuccessRate:
          Math.round(
            (this.results.summary.passedDevices / this.results.summary.totalDevices) * 100
          ) || 0
      }
    };

    // JSON Report
    const jsonPath = `${VALIDATION_DIR}/device-validation-report.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

    // Markdown Report
    const markdownReport = this.generateMarkdownReport(reportData);
    const markdownPath = `${VALIDATION_DIR}/DEVICE_VALIDATION_REPORT.md`;
    fs.writeFileSync(markdownPath, markdownReport);

    // Console summary
    this.printConsoleSummary(reportData);

    return reportData;
  }

  generateMarkdownReport(data) {
    let md = `# 📱 Multi-Device Design Validation Report\n\n`;
    md += `**Generated:** ${data.summary.timestamp}\n`;
    md += `**Total Devices Tested:** ${data.summary.totalDevices}\n`;
    md += `**Device Success Rate:** ${data.summary.deviceSuccessRate}% (${data.summary.passedDevices}/${data.summary.totalDevices})\n`;
    md += `**Test Success Rate:** ${data.summary.successRate}% (${data.summary.passedTests}/${data.summary.totalTests})\n\n`;

    md += `## 📊 Summary Dashboard\n\n`;
    md += `| Metric | Value | Status |\n`;
    md += `|--------|-------|--------|\n`;
    md += `| Devices Passed | ${data.summary.passedDevices}/${data.summary.totalDevices} | ${data.summary.passedDevices === data.summary.totalDevices ? '✅' : '⚠️'} |\n`;
    md += `| Tests Passed | ${data.summary.passedTests}/${data.summary.totalTests} | ${data.summary.successRate >= 90 ? '✅' : data.summary.successRate >= 75 ? '⚠️' : '❌'} |\n`;
    md += `| Critical Issues | ${data.devices.filter(d => d.failed > 3).length} | ${data.devices.filter(d => d.failed > 3).length === 0 ? '✅' : '❌'} |\n\n`;

    // Device Category Results
    const categories = {
      'Mobile Devices': data.devices.filter(d => d.spec.width < 500),
      'Tablet Devices': data.devices.filter(d => d.spec.width >= 500 && d.spec.width < 1200),
      'Desktop Devices': data.devices.filter(d => d.spec.width >= 1200)
    };

    Object.entries(categories).forEach(([category, devices]) => {
      md += `## 📱 ${category}\n\n`;
      md += `| Device | Resolution | Tests | Performance | Issues |\n`;
      md += `|--------|------------|-------|-------------|--------|\n`;

      devices.forEach(device => {
        const status = device.failed === 0 ? '✅' : device.failed <= 2 ? '⚠️' : '❌';
        const loadTime = device.performance.loadTime || 0;
        const perfStatus = loadTime < 2000 ? '🚀' : loadTime < 5000 ? '⚡' : '🐌';

        md += `| ${device.spec.name} | ${device.spec.width}×${device.spec.height} | ${status} ${device.passed}/${device.passed + device.failed} | ${perfStatus} ${loadTime}ms | ${device.issues.length} |\n`;
      });
      md += `\n`;
    });

    // Performance Analysis
    md += `## ⚡ Performance Analysis\n\n`;
    md += `| Device | Load Time | Memory Usage | FCP | TTI |\n`;
    md += `|--------|-----------|--------------|-----|-----|\n`;

    data.devices.forEach(device => {
      const perf = device.performance;
      md += `| ${device.spec.name} | ${perf.loadTime}ms | ${perf.jsHeapUsedSize}MB | ${Math.round(perf.firstContentfulPaint || 0)}ms | ${Math.round(perf.timeToInteractive || 0)}ms |\n`;
    });

    // Issues Summary
    md += `\n## 🚨 Issues Summary\n\n`;
    const allIssues = data.devices.flatMap(d => d.issues);
    const issueGroups = {};

    allIssues.forEach(issue => {
      const category = issue.split(':')[0];
      if (!issueGroups[category]) issueGroups[category] = [];
      issueGroups[category].push(issue);
    });

    Object.entries(issueGroups).forEach(([category, issues]) => {
      md += `### ${category}\n`;
      md += `- ${issues.length} total issues\n`;
      [...new Set(issues)].slice(0, 5).forEach(issue => {
        md += `  - ${issue}\n`;
      });
      md += `\n`;
    });

    md += `## 🎯 Recommendations\n\n`;

    // Dynamic recommendations based on results
    if (data.summary.successRate < 75) {
      md += `⚠️ **Critical**: Success rate below 75%. Immediate fixes required.\n\n`;
    }

    if (allIssues.some(i => i.includes('Touch targets'))) {
      md += `📱 **Mobile UX**: Increase touch target sizes to minimum 44px.\n\n`;
    }

    if (allIssues.some(i => i.includes('overflow'))) {
      md += `📐 **Layout**: Fix horizontal overflow issues on smaller screens.\n\n`;
    }

    md += `---\n\n*Generated by Multi-Device Design Validation System*\n`;

    return md;
  }

  printConsoleSummary(data) {
    console.log('═'.repeat(60));
    console.log('📊 DEVICE VALIDATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(
      `🎯 Success Rate: ${data.summary.successRate}% (${data.summary.passedTests}/${data.summary.totalTests} tests)`
    );
    console.log(`📱 Devices: ${data.summary.passedDevices}/${data.summary.totalDevices} passed`);
    console.log(`⚠️  Issues: ${data.devices.reduce((sum, d) => sum + d.issues.length, 0)} total`);

    console.log('\n📱 Device Category Summary:');
    ['Mobile Devices', 'Tablet Devices', 'Desktop Devices'].forEach(category => {
      const devices = data.devices.filter(d => {
        if (category === 'Mobile Devices') return d.spec.width < 500;
        if (category === 'Tablet Devices') return d.spec.width >= 500 && d.spec.width < 1200;
        return d.spec.width >= 1200;
      });

      const passed = devices.filter(d => d.failed === 0).length;
      const status = passed === devices.length ? '✅' : passed > devices.length / 2 ? '⚠️' : '❌';
      console.log(`  ${status} ${category}: ${passed}/${devices.length} devices passed`);
    });

    console.log(`\n📁 Reports saved to: ${VALIDATION_DIR}`);
    console.log('═'.repeat(60));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔄 Browser closed\n');
    }
  }

  async run() {
    try {
      await this.init();
      const report = await this.validateAllDevices();
      return report;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new MultiDeviceValidator();
  validator
    .run()
    .then(() => {
      console.log('🎉 Multi-device validation completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export default MultiDeviceValidator;
