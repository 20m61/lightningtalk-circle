#!/usr/bin/env node

/**
 * UI/UX Screenshots Capture Script
 * UI/UXの改善をキャプチャしてS3にアップロード
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PR_NUMBER = process.env.PR_NUMBER || '2';
const OUTPUT_DIR = path.join(__dirname, '../screenshots-temp');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const screenshots = [
  {
    name: 'progressive-image-loading',
    description: 'Progressive Image Loading with blur-up effect',
    steps: async(page) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      // Clear cache to see progressive loading
      await page.evaluate(() => {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      // Capture while images are loading
      await page.waitForTimeout(500);
    }
  },
  {
    name: 'ripple-effect',
    description: 'Ripple effect on button click',
    steps: async(page) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      const button = await page.$('.btn-primary');
      const box = await button.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200); // Capture during ripple animation
    }
  },
  {
    name: '3d-card-hover',
    description: '3D card hover effect',
    steps: async(page) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      await page.evaluate(() => {
        window.scrollTo(0, document.querySelector('.event-card').offsetTop - 100);
      });
      const card = await page.$('.event-card');
      await card.hover();
      await page.waitForTimeout(300);
    }
  },
  {
    name: 'form-validation',
    description: 'Real-time form validation',
    steps: async(page) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      // Open registration modal
      await page.click('[data-action="register-speaker"]');
      await page.waitForSelector('#registrationForm', { visible: true });
      // Type invalid email
      await page.type('input[type="email"]', 'invalid-email');
      await page.click('input[type="text"]'); // Trigger blur
      await page.waitForTimeout(500);
    }
  },
  {
    name: 'dark-mode',
    description: 'Dark mode theme',
    steps: async(page) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      // Click dark mode toggle
      await page.click('.dark-mode-toggle');
      await page.waitForTimeout(500);
    }
  },
  {
    name: 'mobile-responsive',
    description: 'Mobile responsive design',
    steps: async(page) => {
      await page.setViewport({ width: 375, height: 812 }); // iPhone X
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    },
    fullPage: true
  }
];

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const capturedFiles = [];

  for (const screenshot of screenshots) {
    try {
      console.log(`📸 Capturing: ${screenshot.description}`);

      const page = await browser.newPage();

      // Set viewport
      if (!screenshot.fullPage) {
        await page.setViewport({ width: 1920, height: 1080 });
      }

      // Execute screenshot steps
      await screenshot.steps(page);

      // Take screenshot
      const filename = `${screenshot.name}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);

      await page.screenshot({
        path: filepath,
        fullPage: screenshot.fullPage || false
      });

      capturedFiles.push({
        name: filename,
        path: filepath,
        description: screenshot.description
      });

      console.log(`✅ Captured: ${filename}`);

      await page.close();
    } catch (error) {
      console.error(`❌ Error capturing ${screenshot.name}:`, error.message);
    }
  }

  await browser.close();
  return capturedFiles;
}

async function uploadToS3(files) {
  console.log('\n📤 Uploading screenshots to S3...');

  const uploadedUrls = [];

  for (const file of files) {
    try {
      // Use the screenshot attachment API
      const response = await fetch(`${BASE_URL}/api/screenshots/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: 'image/png',
          prNumber: PR_NUMBER,
          userId: 'ui-ux-demo'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.statusText}`);
      }

      const { data } = await response.json();

      // Upload to S3
      const fileData = fs.readFileSync(file.path);
      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: fileData,
        headers: { 'Content-Type': 'image/png' }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload to S3: ${uploadResponse.statusText}`);
      }

      uploadedUrls.push({
        url: data.downloadUrl,
        description: file.description,
        name: file.name
      });

      console.log(`✅ Uploaded: ${file.name}`);
    } catch (error) {
      console.error(`❌ Error uploading ${file.name}:`, error.message);
    }
  }

  return uploadedUrls;
}

async function generateMarkdown(screenshots) {
  console.log('\n📝 Generating PR comment markdown...');

  let markdown = '## 📸 UI/UX Improvements Screenshots\n\n';

  for (const screenshot of screenshots) {
    markdown += `### ${screenshot.description}\n`;
    markdown += `![${screenshot.description}](${screenshot.url})\n\n`;
  }

  markdown += '---\n';
  markdown += '*Screenshots captured automatically by UI/UX demo script*\n';

  const markdownPath = path.join(OUTPUT_DIR, 'pr-comment.md');
  fs.writeFileSync(markdownPath, markdown);

  console.log(`✅ Markdown saved to: ${markdownPath}`);

  return markdown;
}

async function postToPR(markdown, screenshots) {
  console.log('\n💬 Posting screenshots to PR...');

  try {
    const response = await fetch(`${BASE_URL}/api/screenshots/post-to-pr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prNumber: PR_NUMBER,
        screenshots: screenshots.map(s => ({
          url: s.url,
          filename: s.name
        })),
        message: markdown,
        userId: 'ui-ux-demo'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to post to PR: ${response.statusText}`);
    }

    console.log('✅ Screenshots posted to PR successfully!');
  } catch (error) {
    console.error('❌ Error posting to PR:', error.message);
    console.log('💡 You can manually post the content from:', path.join(OUTPUT_DIR, 'pr-comment.md'));
  }
}

async function main() {
  try {
    // Check if server is running
    try {
      await fetch(BASE_URL);
    } catch (error) {
      console.error('❌ Server is not running. Please start it with: npm run dev');
      process.exit(1);
    }

    // Capture screenshots
    const capturedFiles = await captureScreenshots();

    if (capturedFiles.length === 0) {
      console.error('❌ No screenshots were captured');
      process.exit(1);
    }

    // Upload to S3 (if API is available)
    let uploadedScreenshots = [];
    try {
      uploadedScreenshots = await uploadToS3(capturedFiles);
    } catch (error) {
      console.error('⚠️  S3 upload failed, using local files instead');
      uploadedScreenshots = capturedFiles.map(f => ({
        url: `file://${f.path}`,
        description: f.description,
        name: f.name
      }));
    }

    // Generate markdown
    const markdown = await generateMarkdown(uploadedScreenshots);

    // Post to PR (if API is available)
    if (uploadedScreenshots[0].url.startsWith('http')) {
      await postToPR(markdown, uploadedScreenshots);
    }

    console.log('\n✨ Screenshot capture complete!');
    console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { captureScreenshots, uploadToS3, generateMarkdown };
