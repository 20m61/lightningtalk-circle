const puppeteer = require('puppeteer');

const testDevices = [
  { name: 'iPhone 12 Pro', width: 390, height: 844 },
  { name: 'iPad Pro 11"', width: 834, height: 1194 },
  { name: 'Desktop HD', width: 1920, height: 1080 }
];

async function testTouchTargets() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  console.log('🔍 Quick Touch Target Test\n');

  for (const device of testDevices) {
    console.log(`📱 Testing: ${device.name} (${device.width}×${device.height})`);

    const page = await browser.newPage();
    await page.setViewport({ width: device.width, height: device.height });

    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });

      const touchTargetResults = await page.evaluate(() => {
        const clickableSelectors = [
          'button',
          'a[href]',
          '[role="button"]',
          '[onclick]',
          'input[type="button"]',
          'input[type="submit"]',
          'input[type="reset"]',
          '.btn',
          '.button',
          '.close',
          '.toggle',
          '[tabindex]'
        ];

        const clickableElements = clickableSelectors.flatMap(selector =>
          Array.from(document.querySelectorAll(selector))
        );

        const results = {
          total: clickableElements.length,
          compliant: 0,
          nonCompliant: []
        };

        clickableElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width >= 44 && rect.height >= 44) {
              results.compliant++;
            } else {
              results.nonCompliant.push({
                tag: el.tagName,
                className: el.className,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                text: el.textContent.trim().substring(0, 20)
              });
            }
          }
        });

        return results;
      });

      const complianceRate = (
        (touchTargetResults.compliant / touchTargetResults.total) *
        100
      ).toFixed(1);

      if (touchTargetResults.nonCompliant.length === 0) {
        console.log(`  ✅ All ${touchTargetResults.total} touch targets are compliant (≥44px)`);
      } else {
        console.log(
          `  ⚠️  Compliance: ${complianceRate}% (${touchTargetResults.compliant}/${touchTargetResults.total})`
        );
        touchTargetResults.nonCompliant.forEach(target => {
          console.log(
            `     ❌ ${target.tag}.${target.className}: ${target.width}×${target.height}px - "${target.text}"`
          );
        });
      }
    } catch (error) {
      console.log(`  ❌ Error testing ${device.name}: ${error.message}`);
    } finally {
      await page.close();
    }
    console.log('');
  }

  await browser.close();
  console.log('✨ Touch target test completed!');
}

testTouchTargets().catch(console.error);
