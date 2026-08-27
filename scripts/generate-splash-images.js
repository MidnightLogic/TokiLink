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
  const puckSize = Math.min(width, height) * 0.36;
  const puckRadius = puckSize / 2;
  const centerX = width / 2;
  const centerY = height / 2 - (isPortrait ? height * 0.05 : height * 0.03);

  const titleFontSize = Math.max(22, Math.round(puckSize * 0.26));
  const subFontSize = Math.max(12, Math.round(puckSize * 0.11));
  const footerFontSize = Math.max(12, Math.round(puckSize * 0.09));

  const textY = centerY + puckRadius + titleFontSize * 1.6;
  const subY = textY + subFontSize * 1.7;
  const footerY = height - Math.max(30, height * 0.06);

  const plasmaRadius = puckRadius * 1.18;

  const svgOverlay = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <!-- Halo Gradient -->
      <radialGradient id="splashHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#a855f7" stop-opacity="0.55"/>
        <stop offset="45%" stop-color="#6366f1" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
      </radialGradient>

      <!-- Button Puck Gradient -->
      <linearGradient id="puckGrad" x1="15%" y1="10%" x2="85%" y2="90%">
        <stop offset="0%" stop-color="#2a1b44"/>
        <stop offset="55%" stop-color="#131124"/>
        <stop offset="100%" stop-color="#0b0d18"/>
      </linearGradient>

      <!-- Border Gradient -->
      <linearGradient id="borderGrad" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="#e9d5ff"/>
        <stop offset="45%" stop-color="#c084fc"/>
        <stop offset="100%" stop-color="#6366f1"/>
      </linearGradient>

      <!-- Specular Highlight -->
      <linearGradient id="specularGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
        <stop offset="35%" stop-color="#ffffff" stop-opacity="0.07"/>
        <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>

      <!-- Icon / Text Gradient -->
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#f3e8ff"/>
        <stop offset="100%" stop-color="#c084fc"/>
      </linearGradient>

      <filter id="puckShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="${puckSize * 0.05}" stdDeviation="${puckSize * 0.08}" flood-color="#000000" flood-opacity="0.95"/>
        <feDropShadow dx="0" dy="0" stdDeviation="${puckSize * 0.06}" flood-color="#a855f7" flood-opacity="0.4"/>
      </filter>

      <filter id="plasmaGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="${Math.max(4, puckSize * 0.03)}" flood-color="#c084fc" flood-opacity="0.85"/>
        <feDropShadow dx="0" dy="0" stdDeviation="${Math.max(2, puckSize * 0.015)}" flood-color="#a855f7" flood-opacity="0.9"/>
      </filter>
    </defs>

    <!-- Deep Space Background -->
    <rect width="${width}" height="${height}" fill="#0a0e17"/>

    <!-- Halo Glow -->
    <circle cx="${centerX}" cy="${centerY}" r="${puckRadius * 1.4}" fill="url(#splashHalo)"/>

    <!-- Outer Static Plasma Ring -->
    <circle cx="${centerX}" cy="${centerY}" r="${plasmaRadius}" fill="none" stroke="rgba(168, 85, 247, 0.75)" stroke-width="${Math.max(2, puckSize * 0.016)}" filter="url(#plasmaGlow)"/>
    <circle cx="${centerX}" cy="${centerY}" r="${plasmaRadius}" fill="none" stroke="#ffffff" stroke-width="${Math.max(1, puckSize * 0.006)}"/>

    <!-- Plasma Sparks & Orbiting Spark Dots -->
    <circle cx="${centerX - plasmaRadius * 0.88}" cy="${centerY - plasmaRadius * 0.45}" r="${Math.max(1.5, puckSize * 0.012)}" fill="#c084fc"/>
    <circle cx="${centerX + plasmaRadius * 0.92}" cy="${centerY - plasmaRadius * 0.35}" r="${Math.max(1.8, puckSize * 0.014)}" fill="#ffffff"/>
    <circle cx="${centerX - plasmaRadius * 0.6}" cy="${centerY + plasmaRadius * 0.75}" r="${Math.max(1.4, puckSize * 0.01)}" fill="#e9d5ff"/>
    <circle cx="${centerX + plasmaRadius * 0.7}" cy="${centerY + plasmaRadius * 0.7}" r="${Math.max(1.6, puckSize * 0.013)}" fill="#c084fc"/>

    <!-- Puck Base -->
    <circle cx="${centerX}" cy="${centerY}" r="${puckRadius}" fill="url(#puckGrad)" stroke="url(#borderGrad)" stroke-width="${Math.max(2, puckSize * 0.02)}" filter="url(#puckShadow)"/>

    <!-- Inner Highlight -->
    <circle cx="${centerX}" cy="${centerY}" r="${puckRadius * 0.97}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="${Math.max(1, puckSize * 0.008)}"/>

    <!-- Top Specular Sheen -->
    <path d="M ${centerX - puckRadius * 0.83} ${centerY} A ${puckRadius * 0.83} ${puckRadius * 0.83} 0 0 1 ${centerX + puckRadius * 0.83} ${centerY} Z" fill="url(#specularGrad)"/>

    <!-- Puck Center Bold Typography (LOADING) -->
    <text x="${centerX}" y="${centerY + puckSize * 0.045}" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="${puckSize * 0.13}" font-weight="800" fill="url(#textGrad)" text-anchor="middle" letter-spacing="${Math.max(1, puckSize * 0.025)}">
      LOADING
    </text>

    <!-- Brand Typography Row (TokiLink™ FOR SEIKO) Centered Group -->
    <g transform="translate(${centerX}, ${textY})" font-family="'Segoe UI', Arial, Helvetica, sans-serif">
      <text x="0" y="0" text-anchor="middle">
        <tspan fill="#ffffff" font-size="${titleFontSize}" font-weight="700">TokiLink</tspan>
        <tspan fill="#ffffff" font-size="${titleFontSize * 0.44}" font-weight="700" dy="-${titleFontSize * 0.42}">™</tspan>
        <tspan dy="${titleFontSize * 0.42}" fill="#c084fc" font-size="${titleFontSize * 0.48}" font-weight="700" letter-spacing="2">  FOR SEIKO</tspan>
      </text>
    </g>

    <!-- Subtitle -->
    <text x="${centerX}" y="${subY}" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="${subFontSize}" font-weight="500" fill="#94a3b8" text-anchor="middle">
      Universal Web Bluetooth Clock Sync
    </text>

    <!-- Footer with GitHub Logo & MidnightLogic -->
    <g transform="translate(${centerX - footerFontSize * 4.2}, ${footerY - footerFontSize * 0.85}) scale(${footerFontSize / 20})">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="#94a3b8"/>
    </g>
    <text x="${centerX + footerFontSize * 0.8}" y="${footerY}" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="${footerFontSize}" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="1.5">
      MidnightLogic
    </text>
  </svg>`;

  const buffer = Buffer.from(svgOverlay);
  await sharp(buffer).jpeg({ quality: 92 }).toFile(path.join(pwaAssetsDir, file));
}

console.log('✅ Generated all Apple splash screens with crisp sans-serif branding and static plasma ring!');
