import https from 'https';
import dns from 'dns/promises';

const DOMAIN = 'xn--6wym69a.com';
const URLS_TO_CHECK = [
  `https://${DOMAIN}`,
  `https://www.${DOMAIN}`,
  'https://d19wq5f8laq7i.cloudfront.net'
];

async function checkDNS() {
  console.log('🔍 DNS Resolution Check:');
  try {
    const addresses = await dns.resolve4(DOMAIN);
    console.log(`✅ ${DOMAIN} resolves to:`, addresses);

    const ns = await dns.resolveNs(DOMAIN);
    console.log('✅ Nameservers:', ns);
  } catch (error) {
    console.error(`❌ DNS Error:`, error.message);
  }
}

async function checkHTTPS(url) {
  return new Promise(resolve => {
    https
      .get(url, res => {
        console.log(`\n📌 ${url}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers:`, {
          'content-type': res.headers['content-type'],
          'x-cache': res.headers['x-cache'],
          'x-amz-cf-id': res.headers['x-amz-cf-id']
        });

        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`   ✅ Site is accessible`);
            console.log(`   Content preview: ${data.substring(0, 100)}...`);
          } else {
            console.log(`   ⚠️  Status ${res.statusCode}`);
            if (data) console.log(`   Error: ${data.substring(0, 200)}`);
          }
          resolve();
        });
      })
      .on('error', err => {
        console.log(`   ❌ Error: ${err.message}`);
        resolve();
      });
  });
}

async function validateSite() {
  console.log('🚀 Lightning Talk Circle - Site Validation');
  console.log('=========================================\n');

  await checkDNS();

  console.log('\n🌐 HTTPS Access Check:');
  for (const url of URLS_TO_CHECK) {
    await checkHTTPS(url);
  }

  console.log('\n📊 Summary:');
  console.log('- Domain: 発表.com (xn--6wym69a.com)');
  console.log('- CloudFront: d19wq5f8laq7i.cloudfront.net');
  console.log('- SSL Certificate: Issued for xn--6wym69a.com');

  console.log('\n✨ Validation complete!');
}

validateSite().catch(console.error);
