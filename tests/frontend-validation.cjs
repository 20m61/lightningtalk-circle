const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = 'https://xn--6wym69a.com';
const SCREENSHOTS_DIR = path.join(__dirname, '../test-results/screenshots');
const REPORTS_DIR = path.join(__dirname, '../test-results/reports');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  url: BASE_URL,
  tests: [],
  consoleErrors: [],
  networkErrors: [],
  performanceMetrics: {}
};

async function runFrontendValidation() {
  await ensureDirectories();

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.consoleErrors.push({
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Capture network errors
    page.on('requestfailed', request => {
      testResults.networkErrors.push({
        url: request.url(),
        failure: request.failure(),
        timestamp: new Date().toISOString()
      });
    });

    // Test 1: Homepage Load and Basic Elements
    console.log('🔍 Testing homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-homepage-desktop.png'),
      fullPage: true
    });

    const homepageTests = {
      name: 'Homepage Validation',
      url: BASE_URL,
      tests: []
    };

    // Check essential elements
    const essentialElements = [
      { selector: 'header', name: 'Header' },
      { selector: '.hero', name: 'Hero Section' },
      { selector: '.countdown-timer', name: 'Countdown Timer' },
      { selector: '.event-info', name: 'Event Information' },
      { selector: '.survey-section', name: 'Survey Section' },
      { selector: '#chatWidget', name: 'Chat Widget' },
      { selector: 'footer', name: 'Footer' }
    ];

    for (const element of essentialElements) {
      const exists = (await page.locator(element.selector).count()) > 0;
      homepageTests.tests.push({
        name: `${element.name} exists`,
        passed: exists,
        selector: element.selector
      });
    }

    // Check countdown functionality
    const countdownWorking = await page.evaluate(() => {
      const days = document.getElementById('days');
      const hours = document.getElementById('hours');
      return (days && hours && days.textContent !== '00') || hours.textContent !== '00';
    });
    homepageTests.tests.push({
      name: 'Countdown timer is running',
      passed: countdownWorking
    });

    testResults.tests.push(homepageTests);

    // Test 2: Mobile Responsiveness
    console.log('📱 Testing mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.reload();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-homepage-mobile.png'),
      fullPage: true
    });

    const mobileTests = {
      name: 'Mobile Responsiveness',
      tests: []
    };

    // Check mobile menu
    const mobileMenuToggle = await page.locator('.mobile-menu-toggle').isVisible();
    mobileTests.tests.push({
      name: 'Mobile menu toggle visible',
      passed: mobileMenuToggle
    });

    // Check responsive layout
    const heroResponsive = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      return hero && getComputedStyle(hero).display !== 'none';
    });
    mobileTests.tests.push({
      name: 'Hero section responsive',
      passed: heroResponsive
    });

    testResults.tests.push(mobileTests);

    // Test 3: Interactive Features
    console.log('🎯 Testing interactive features...');
    await page.setViewportSize({ width: 1920, height: 1080 });

    const interactiveTests = {
      name: 'Interactive Features',
      tests: []
    };

    // Test registration modal
    await page.click('[data-action="register"]');
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('#registerModal').isVisible();
    interactiveTests.tests.push({
      name: 'Registration modal opens',
      passed: modalVisible
    });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-registration-modal.png') });

    if (modalVisible) {
      await page.click('.modal .close');
      await page.waitForTimeout(500);
    }

    // Test chat widget
    await page.click('#chatToggle');
    await page.waitForTimeout(500);
    const chatVisible = await page.locator('#chatContainer').isVisible();
    interactiveTests.tests.push({
      name: 'Chat widget opens',
      passed: chatVisible
    });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-chat-widget.png') });

    testResults.tests.push(interactiveTests);

    // Test 4: Event Live Page
    console.log('🎥 Testing event live page...');
    await page.goto(`${BASE_URL}/event-live.html`, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-event-live.png'),
      fullPage: true
    });

    const eventLiveTests = {
      name: 'Event Live Page',
      url: `${BASE_URL}/event-live.html`,
      tests: []
    };

    const liveElements = [
      { selector: '.program-sidebar', name: 'Program Sidebar' },
      { selector: '.main-timer', name: 'Timer Display' },
      { selector: '.reactions-section', name: 'Reaction Buttons' },
      { selector: '.voting-section', name: 'Voting Section' },
      { selector: '.qa-sidebar', name: 'Q&A Sidebar' }
    ];

    for (const element of liveElements) {
      const exists = (await page.locator(element.selector).count()) > 0;
      eventLiveTests.tests.push({
        name: `${element.name} exists`,
        passed: exists,
        selector: element.selector
      });
    }

    testResults.tests.push(eventLiveTests);

    // Test 5: Speaker Dashboard
    console.log('👤 Testing speaker dashboard...');
    await page.goto(`${BASE_URL}/speaker-dashboard.html`, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06-speaker-dashboard.png'),
      fullPage: true
    });

    const dashboardTests = {
      name: 'Speaker Dashboard',
      url: `${BASE_URL}/speaker-dashboard.html`,
      tests: []
    };

    const dashboardElements = [
      { selector: '.dashboard-sidebar', name: 'Dashboard Sidebar' },
      { selector: '.stats-grid', name: 'Statistics Grid' },
      { selector: '.upcoming-talks', name: 'Upcoming Talks' },
      { selector: '.recent-feedback', name: 'Recent Feedback' }
    ];

    for (const element of dashboardElements) {
      const exists = (await page.locator(element.selector).count()) > 0;
      dashboardTests.tests.push({
        name: `${element.name} exists`,
        passed: exists,
        selector: element.selector
      });
    }

    testResults.tests.push(dashboardTests);

    // Test 6: Performance Metrics
    console.log('⚡ Collecting performance metrics...');
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    testResults.performanceMetrics = metrics;

    // Test 7: Accessibility Check
    console.log('♿ Testing accessibility...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const accessibilityTests = {
      name: 'Accessibility',
      tests: []
    };

    // Check for alt text on images
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.alt).length;
    });
    accessibilityTests.tests.push({
      name: 'All images have alt text',
      passed: imagesWithoutAlt === 0,
      details: `${imagesWithoutAlt} images without alt text`
    });

    // Check for proper heading hierarchy
    const headingHierarchy = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let lastLevel = 0;
      let proper = true;
      headings.forEach(h => {
        const level = parseInt(h.tagName[1]);
        if (level > lastLevel + 1) proper = false;
        lastLevel = level;
      });
      return proper;
    });
    accessibilityTests.tests.push({
      name: 'Proper heading hierarchy',
      passed: headingHierarchy
    });

    testResults.tests.push(accessibilityTests);

    // Generate report
    const report = generateReport(testResults);
    await fs.writeFile(path.join(REPORTS_DIR, `frontend-validation-${Date.now()}.html`), report);

    console.log('\n✅ Frontend validation completed!');
    console.log(`📊 Report saved to: ${REPORTS_DIR}`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}`);

    // Summary
    let totalTests = 0;
    let passedTests = 0;
    testResults.tests.forEach(suite => {
      suite.tests.forEach(test => {
        totalTests++;
        if (test.passed) passedTests++;
      });
    });

    console.log(`\n📈 Test Summary: ${passedTests}/${totalTests} tests passed`);
    console.log(`⚠️  Console errors: ${testResults.consoleErrors.length}`);
    console.log(`🔌 Network errors: ${testResults.networkErrors.length}`);
  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await browser.close();
  }
}

function generateReport(results) {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Frontend Validation Report - ${results.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .test-suite { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
        .test { margin: 10px 0; padding: 5px 10px; }
        .passed { background: #e8f5e9; color: #2e7d32; }
        .failed { background: #ffebee; color: #c62828; }
        .error { background: #fff3cd; padding: 10px; margin: 10px 0; border: 1px solid #ffeeba; border-radius: 4px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
        .metric .value { font-size: 24px; font-weight: bold; color: #1976d2; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Frontend Validation Report</h1>
        <p><strong>Generated:</strong> ${new Date(results.timestamp).toLocaleString('ja-JP')}</p>
        <p><strong>URL:</strong> ${results.url}</p>
        
        <div class="summary">
            <h2>Summary</h2>
            <p>Total Test Suites: ${results.tests.length}</p>
            <p>Console Errors: ${results.consoleErrors.length}</p>
            <p>Network Errors: ${results.networkErrors.length}</p>
        </div>

        <h2>Performance Metrics</h2>
        <div class="metrics">
            <div class="metric">
                <h3>DOM Content Loaded</h3>
                <div class="value">${results.performanceMetrics.domContentLoaded?.toFixed(2) || 'N/A'} ms</div>
            </div>
            <div class="metric">
                <h3>Page Load Complete</h3>
                <div class="value">${results.performanceMetrics.loadComplete?.toFixed(2) || 'N/A'} ms</div>
            </div>
            <div class="metric">
                <h3>First Paint</h3>
                <div class="value">${results.performanceMetrics.firstPaint?.toFixed(2) || 'N/A'} ms</div>
            </div>
            <div class="metric">
                <h3>First Contentful Paint</h3>
                <div class="value">${results.performanceMetrics.firstContentfulPaint?.toFixed(2) || 'N/A'} ms</div>
            </div>
        </div>

        <h2>Test Results</h2>
        ${results.tests
          .map(
            suite => `
            <div class="test-suite">
                <h3>${suite.name}</h3>
                ${suite.url ? `<p><small>URL: ${suite.url}</small></p>` : ''}
                ${suite.tests
                  .map(
                    test => `
                    <div class="test ${test.passed ? 'passed' : 'failed'}">
                        ${test.passed ? '✅' : '❌'} ${test.name}
                        ${test.details ? `<small> - ${test.details}</small>` : ''}
                    </div>
                `
                  )
                  .join('')}
            </div>
        `
          )
          .join('')}

        ${
          results.consoleErrors.length > 0
            ? `
            <h2>Console Errors</h2>
            ${results.consoleErrors
              .map(
                error => `
                <div class="error">
                    <strong>Error:</strong> ${error.text}<br>
                    <small>Location: ${JSON.stringify(error.location)}</small>
                </div>
            `
              )
              .join('')}
        `
            : ''
        }

        ${
          results.networkErrors.length > 0
            ? `
            <h2>Network Errors</h2>
            ${results.networkErrors
              .map(
                error => `
                <div class="error">
                    <strong>URL:</strong> ${error.url}<br>
                    <strong>Failure:</strong> ${error.failure?.errorText || 'Unknown'}
                </div>
            `
              )
              .join('')}
        `
            : ''
        }
    </div>
</body>
</html>
  `;
  return html;
}

// Run validation
if (require.main === module) {
  runFrontendValidation().catch(console.error);
}

module.exports = { runFrontendValidation };
