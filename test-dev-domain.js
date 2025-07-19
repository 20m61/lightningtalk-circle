import https from 'https';
import { URL } from 'url';

const devUrl = 'https://dev.xn--6wym69a.com';

// Test development domain
console.log('🧪 Testing development domain...\n');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Lightning Talk Circle Test Script'
      }
    };

    https
      .get(options, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
      })
      .on('error', reject);
  });
}

async function runTests() {
  try {
    // Test main page
    console.log('1️⃣ Testing main page...');
    const mainPageRes = await fetchUrl(devUrl);
    console.log(`   Status: ${mainPageRes.status}`);
    console.log(`   Content-Type: ${mainPageRes.headers['content-type']}`);

    // Check for key elements
    const checks = [
      { name: 'Has title', test: mainPageRes.data.includes('なんでもライトニングトーク') },
      {
        name: 'Has logo',
        test: mainPageRes.data.includes('logo.webp') || mainPageRes.data.includes('logo.jpeg')
      },
      { name: 'Has WebSocket config', test: mainPageRes.data.includes('wss://') },
      { name: 'Has API endpoint', test: mainPageRes.data.includes('apiEndpoint') },
      { name: 'Has event cards', test: mainPageRes.data.includes('event-card') }
    ];

    checks.forEach(check => {
      console.log(`   ${check.name}: ${check.test ? '✅' : '❌'}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Development URL: ${devUrl}`);
    console.log(`   Domain: dev.発表.com`);
    console.log(`   Status: ${mainPageRes.status === 200 ? '✅ Accessible' : '❌ Not accessible'}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
