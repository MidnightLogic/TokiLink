import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const pwaAssetsDir = path.join(rootDir, 'public', 'pwa-assets');

// All apple splash image dimensions currently in public/pwa-assets
const splashFiles = fs.readdirSync(pwaAssetsDir).filter(f => f.startsWith('apple-splash-') && f.endsWith('.jpg'));

console.log(`Found ${splashFiles.length} splash images to update...`);

for (const file of splashFiles) {
  const match = file.match(/apple-splash-(\d+)-(\d+)\.jpg/);
  if (!match) continue;

  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);

  const isPortrait = height >= width;
  const puckSize = Math.min(width, height) * 0.38;
  const puckRadius = puckSize / 2;
  const centerX = width / 2;
  const centerY = height / 2 - (isPortrait ? height * 0.05 : height * 0.03);

  const titleFontSize = Math.max(24, Math.round(puckSize * 0.28));
  const subFontSize = Math.max(13, Math.round(puckSize * 0.12));
  const footerFontSize = Math.max(12, Math.round(puckSize * 0.1));

  const textY = centerY + puckRadius + titleFontSize * 1.5;
  const subY = textY + subFontSize * 1.6;
  const footerY = height - Math.max(30, height * 0.06);

  const iconScale = puckSize / 512;

  const svgOverlay = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <!-- Halo -->
      <radialGradient id="splashHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#a855f7" stop-opacity="0.45"/>
        <stop offset="50%" stop-color="#6366f1" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
      </radialGradient>

      <!-- Button Puck -->
      <linearGradient id="puckGrad" x1="15%" y1="10%" x2="85%" y2="90%">
        <stop offset="0%" stop-color="#2a1b44"/>
        <stop offset="55%" stop-color="#131124"/>
        <stop offset="100%" stop-color="#0b0d18"/>
      </linearGradient>

      <!-- Border -->
      <linearGradient id="borderGrad" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="#d8b4fe"/>
        <stop offset="45%" stop-color="#a855f7"/>
        <stop offset="100%" stop-color="#4f46e5"/>
      </linearGradient>

      <!-- Specular -->
      <linearGradient id="specularGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/>
        <stop offset="35%" stop-color="#ffffff" stop-opacity="0.06"/>
        <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>

      <!-- Icon -->
      <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="#f3e8ff"/>
        <stop offset="100%" stop-color="#c084fc"/>
      </linearGradient>

      <filter id="puckShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="${puckSize * 0.06}" stdDeviation="${puckSize * 0.1}" flood-color="#000000" flood-opacity="0.9"/>
        <feDropShadow dx="0" dy="0" stdDeviation="${puckSize * 0.07}" flood-color="#a855f7" flood-opacity="0.35"/>
      </filter>
    </defs>

    <!-- Deep Space Background -->
    <rect width="${width}" height="${height}" fill="#0a0e17"/>

    <!-- Halo Glow -->
    <circle cx="${centerX}" cy="${centerY}" r="${puckRadius * 1.35}" fill="url(#splashHalo)"/>

    <!-- Puck Base -->
    <circle cx="${centerX}" cy="${centerY}" r="${puckRadius}" fill="url(#puckGrad)" stroke="url(#borderGrad)" stroke-width="${Math.max(2, puckSize * 0.02)}" filter="url(#puckShadow)"/>

    <!-- Inner Highlight -->
    <circle cx="${centerX}" cy="${centerY}" r="${puckRadius * 0.97}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="${Math.max(1, puckSize * 0.008)}"/>

    <!-- Top Specular Sheen -->
    <path d="M ${centerX - puckRadius * 0.83} ${centerY} A ${puckRadius * 0.83} ${puckRadius * 0.83} 0 0 1 ${centerX + puckRadius * 0.83} ${centerY} Z" fill="url(#specularGrad)"/>

    <!-- Lucide rotate-cw-fading-clock centered -->
    <g transform="translate(${centerX - puckRadius * 0.5}, ${centerY - puckRadius * 0.5}) scale(${puckSize / 24 * 0.5})" stroke="url(#iconGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M12 3a9.75 9.75 0 0 1 6.74 2.74"/>
      <path d="M18.74 5.74 21 8"/>
      <path d="M21 8V3"/>
      <path d="M7.5 19.794c-6-3.464-6-12.124 0-15.588"/>
      <path d="M7.5 4.206A9 9 0 0 1 12 3"/>
      <path d="M12 7v5l4 2"/>
      <path d="M14 20.775A9 9 0 0 1 12 21"/>
      <path d="M19 17.656a9 9 0 0 1-1.5 1.456"/>
      <path d="M21 12a9 9 0 0 1-.228 2"/>
      <path d="M21 8h-5"/>
    </g>

    <!-- Plasma Electric Ring Aura -->
    <circle cx="${centerX}" cy="${centerY}" r="${puckRadius * 1.15}" fill="none" stroke="rgba(192, 132, 252, 0.45)" stroke-width="${Math.max(1.5, puckSize * 0.015)}" stroke-dasharray="8 6"/>
    <circle cx="${centerX}" cy="${centerY}" r="${puckRadius * 1.18}" fill="none" stroke="rgba(168, 85, 247, 0.3)" stroke-width="${Math.max(1, puckSize * 0.01)}" stroke-dasharray="14 10"/>

    <!-- Typography -->
    <text x="${centerX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="${titleFontSize}" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">
      TokiLink <tspan fill="#c084fc" font-size="${titleFontSize * 0.5}" font-weight="600" letter-spacing="1">FOR SEIKO</tspan>
    </text>

    <text x="${centerX}" y="${subY}" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="${subFontSize}" font-weight="400" fill="#94a3b8" text-anchor="middle">
      Universal Web Bluetooth Clock Sync
    </text>

    <!-- Footer with GitHub Logo & MidnightLogic -->
    <g transform="translate(${centerX - footerFontSize * 4.5}, ${footerY - footerFontSize * 0.85}) scale(${footerFontSize / 20})">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="#94a3b8"/>
    </g>
    <text x="${centerX + footerFontSize * 0.8}" y="${footerY}" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="${footerFontSize}" font-weight="500" fill="#94a3b8" text-anchor="middle" letter-spacing="1.5">
      MidnightLogic
    </text>
  </svg>`;

  const buffer = Buffer.from(svgOverlay);
  await sharp(buffer).jpeg({ quality: 90 }).toFile(path.join(pwaAssetsDir, file));
}

console.log('✅ Generated all Apple splash screens with dark theme button puck and branding text!');
