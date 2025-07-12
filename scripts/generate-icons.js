import { createCanvas } from 'canvas';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes for various devices
const ICON_SIZES = [
  // Favicon sizes
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 96, name: 'favicon-96x96.png' },

  // Android Chrome
  { size: 36, name: 'android-chrome-36x36.png' },
  { size: 48, name: 'android-chrome-48x48.png' },
  { size: 72, name: 'android-chrome-72x72.png' },
  { size: 96, name: 'android-chrome-96x96.png' },
  { size: 144, name: 'android-chrome-144x144.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 256, name: 'android-chrome-256x256.png' },
  { size: 384, name: 'android-chrome-384x384.png' },
  { size: 512, name: 'android-chrome-512x512.png' },

  // Apple Touch Icons
  { size: 57, name: 'apple-touch-icon-57x57.png' },
  { size: 60, name: 'apple-touch-icon-60x60.png' },
  { size: 72, name: 'apple-touch-icon-72x72.png' },
  { size: 76, name: 'apple-touch-icon-76x76.png' },
  { size: 114, name: 'apple-touch-icon-114x114.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 144, name: 'apple-touch-icon-144x144.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },

  // Microsoft Windows
  { size: 144, name: 'mstile-144x144.png' },
  { size: 150, name: 'mstile-150x150.png' },
  { size: 310, name: 'mstile-310x310.png' },
  { size: 70, name: 'mstile-70x70.png' },

  // Generic icons
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 196, name: 'icon-196x196.png' }
];

async function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - gradient from blue to purple
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4A90E2');
  gradient.addColorStop(1, '#8B5CF6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Lightning bolt design
  ctx.fillStyle = '#FFFFFF';
  const scale = size / 512; // Base design is for 512x512

  ctx.save();
  ctx.scale(scale, scale);

  // Create lightning bolt path
  ctx.beginPath();
  ctx.moveTo(320, 64);
  ctx.lineTo(192, 240);
  ctx.lineTo(256, 240);
  ctx.lineTo(192, 448);
  ctx.lineTo(320, 272);
  ctx.lineTo(256, 272);
  ctx.closePath();
  ctx.fill();

  // Add glow effect
  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = 20;
  ctx.fill();

  ctx.restore();

  // Add rounded corners for modern look
  if (size >= 128) {
    const radius = size * 0.15;

    // Create clipping mask for rounded corners
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
  }

  return canvas.toBuffer('image/png');
}

async function generateAllIcons() {
  const outputDir = path.join(__dirname, '../public/icons');

  // Ensure icons directory exists
  await fs.mkdir(outputDir, { recursive: true });

  console.log('🎨 Generating icons for Lightning Talk Circle...');

  // Generate each icon size
  for (const { size, name } of ICON_SIZES) {
    console.log(`  📐 Creating ${name} (${size}x${size})`);
    const buffer = await generateIcon(size);
    await fs.writeFile(path.join(outputDir, name), buffer);
  }

  console.log('✅ All icons generated successfully!');

  // Create favicon.ico (multi-resolution)
  console.log('🔧 Creating favicon.ico...');
  // For simplicity, we'll copy the 32x32 version as favicon.ico
  const favicon32 = await fs.readFile(path.join(outputDir, 'favicon-32x32.png'));
  await fs.writeFile(path.join(outputDir, '../favicon.ico'), favicon32);

  console.log('✅ favicon.ico created!');
}

// Run the generator
generateAllIcons().catch(console.error);
