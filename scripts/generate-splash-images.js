import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const pwaAssetsDir = path.join(publicDir, 'pwa-assets');
const iconSvgPath = path.join(publicDir, 'icon.svg');

const splashFiles = fs.readdirSync(pwaAssetsDir).filter(f => f.startsWith('apple-splash-') && f.endsWith('.jpg'));

console.log(`Found ${splashFiles.length} splash images to update with custom icon.svg...`);

const iconSvgBuffer = fs.readFileSync(iconSvgPath);

async function generateAllSplashImages() {
  for (const file of splashFiles) {
    const match = file.match(/apple-splash-(\d+)-(\d+)\.jpg/);
    if (!match) continue;

    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);

    const isPortrait = height >= width;
    // Sized generously to showcase the glowing plasma puck
    const puckSize = Math.round(Math.min(width, height) * (isPortrait ? 0.42 : 0.36));
    const centerX = Math.round(width / 2);
    const centerY = Math.round(height / 2 - (isPortrait ? height * 0.05 : height * 0.02));

    const iconLeft = Math.round(centerX - puckSize / 2);
    const iconTop = Math.round(centerY - puckSize / 2);

    const titleFontSize = Math.max(22, Math.round(puckSize * 0.22));
    const subFontSize = Math.max(12, Math.round(puckSize * 0.095));
    const footerFontSize = Math.max(12, Math.round(puckSize * 0.08));

    const textY = centerY + puckSize / 2 + Math.round(titleFontSize * 1.5);
    const subY = textY + Math.round(subFontSize * 1.7);
    const footerY = height - Math.max(30, Math.round(height * 0.06));

    // 1. Render the custom icon.svg at exact native pixel resolution with full alpha
    const iconPngBuffer = await sharp(iconSvgBuffer)
      .resize(puckSize, puckSize)
      .png()
      .toBuffer();

    // 2. Generate clean SVG background canvas with branding typography
    const svgOverlay = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <!-- Deep Cosmic Background matching icon.svg (#181926) -->
      <rect width="${width}" height="${height}" fill="#181926"/>

      <!-- Ambient Glow Behind Typography -->
      <radialGradient id="textAmbient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#8c40ff" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#181926" stop-opacity="0"/>
      </radialGradient>
      <circle cx="${centerX}" cy="${textY}" r="${puckSize * 0.8}" fill="url(#textAmbient)"/>

      <!-- Brand Typography Row (TokiLink™ FOR SEIKO) Centered -->
      <g transform="translate(${centerX}, ${textY})" font-family="'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif">
        <text x="0" y="0" text-anchor="middle">
          <tspan fill="#ffffff" font-size="${titleFontSize}" font-weight="700" letter-spacing="-0.5">TokiLink</tspan>
          <tspan fill="#ffffff" font-size="${titleFontSize * 0.44}" font-weight="700" dy="-${titleFontSize * 0.42}">™</tspan>
          <tspan dy="${titleFontSize * 0.42}" fill="#c084fc" font-size="${titleFontSize * 0.46}" font-weight="700" letter-spacing="2">  FOR SEIKO</tspan>
        </text>
      </g>

      <!-- Subtitle -->
      <text x="${centerX}" y="${subY}" font-family="'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif" font-size="${subFontSize}" font-weight="500" fill="#94a3b8" text-anchor="middle" letter-spacing="0.2">
        Universal Web Bluetooth Clock Sync
      </text>

      <!-- Footer with GitHub Logo & MidnightLogic -->
      <g transform="translate(${centerX - footerFontSize * 4.2}, ${footerY - footerFontSize * 0.85}) scale(${footerFontSize / 20})">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="#94a3b8"/>
      </g>
      <text x="${centerX + footerFontSize * 0.8}" y="${footerY}" font-family="'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif" font-size="${footerFontSize}" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="1.5">
        MidnightLogic
      </text>
    </svg>`;

    const bgBuffer = Buffer.from(svgOverlay);

    // 3. Composite icon.svg pixel-perfect directly onto the splash canvas
    await sharp(bgBuffer)
      .composite([{
        input: iconPngBuffer,
        top: iconTop,
        left: iconLeft
      }])
      .jpeg({ quality: 92 })
      .toFile(path.join(pwaAssetsDir, file));
  }

  console.log('✅ Generated all 46 Apple splash screens composited with public/icon.svg!');
}

generateAllSplashImages().catch(console.error);
