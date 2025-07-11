import { build } from 'vite';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildStaticAssets() {
  console.log('🚀 Building Lightning Talk Circle with Tailwind CSS...');

  // Build Tailwind CSS
  console.log('🎨 Processing Tailwind CSS...');
  const cssInput = await fs.readFile(path.join(__dirname, '../src/main.css'), 'utf8');

  const result = await postcss([tailwindcss, autoprefixer]).process(cssInput, {
    from: path.join(__dirname, '../src/main.css'),
    to: path.join(__dirname, '../public/css/tailwind.css')
  });

  await fs.writeFile(path.join(__dirname, '../public/css/tailwind.css'), result.css);

  console.log('✅ Tailwind CSS built successfully');

  // Build React components with Vite
  console.log('⚛️ Building React components...');
  await build({
    configFile: path.join(__dirname, '../vite.config.js'),
    mode: 'production'
  });

  console.log('✅ React components built successfully');

  // Update HTML files to include new assets
  console.log('📝 Updating HTML files...');

  const htmlFiles = [
    'index.html',
    'event-live.html',
    'speaker-dashboard.html',
    'presentations.html'
  ];

  for (const file of htmlFiles) {
    const filePath = path.join(__dirname, '../public', file);
    let html = await fs.readFile(filePath, 'utf8');

    // Add Tailwind CSS before existing styles
    if (!html.includes('tailwind.css')) {
      html = html.replace(
        '<link rel="stylesheet" href="css/style.css" />',
        '<link rel="stylesheet" href="css/tailwind.css" />\n    <link rel="stylesheet" href="css/style.css" />'
      );
    }

    // Add React and our components before closing body
    if (!html.includes('LightningTalk.init()')) {
      const buildFiles = await fs.readdir(path.join(__dirname, '../public/build/js'));
      const mainFile = buildFiles.find(f => f.startsWith('main-') && f.endsWith('.js'));

      if (mainFile) {
        const scriptTag = `
    <!-- Lightning Talk React Components -->
    <script type="module" src="/build/js/${mainFile}"></script>
    <script>
      // Initialize Lightning Talk components when ready
      window.addEventListener('DOMContentLoaded', () => {
        if (window.LightningTalk) {
          window.LightningTalk.init();
        }
      });
    </script>`;

        html = html.replace('</body>', `${scriptTag}\n  </body>`);
      }
    }

    await fs.writeFile(filePath, html);
    console.log(`✅ Updated ${file}`);
  }

  console.log(
    '\n🎉 Build complete! Lightning Talk Circle is ready with Tailwind CSS and React components.'
  );
}

// Run the build
buildStaticAssets().catch(console.error);
