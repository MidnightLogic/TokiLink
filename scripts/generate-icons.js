import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Space Background -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#141226"/>
      <stop offset="60%" stop-color="#0a0e17"/>
      <stop offset="100%" stop-color="#06080f"/>
    </radialGradient>

    <!-- Cosmic Outer Halo Glow -->
    <radialGradient id="haloGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.5"/>
      <stop offset="50%" stop-color="#6366f1" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>

    <!-- Button Puck Gradient -->
    <linearGradient id="puckGrad" x1="15%" y1="10%" x2="85%" y2="90%">
      <stop offset="0%" stop-color="#2a1b44"/>
      <stop offset="55%" stop-color="#131124"/>
      <stop offset="100%" stop-color="#0b0d18"/>
    </linearGradient>

    <!-- Puck Border Gradient -->
    <linearGradient id="borderGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#d8b4fe"/>
      <stop offset="45%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>

    <!-- Glass Specular Highlight -->
    <linearGradient id="specularGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Icon Glow / Gradient -->
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f3e8ff"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>

    <filter id="puckShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.9"/>
      <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#a855f7" flood-opacity="0.35"/>
    </filter>

    <filter id="iconGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#c084fc" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#bgGrad)"/>

  <!-- Halo -->
  <circle cx="256" cy="256" r="230" fill="url(#haloGlow)"/>

  <!-- Button Puck Outer Shadow & Glass Base -->
  <circle cx="256" cy="256" r="180" fill="url(#puckGrad)" stroke="url(#borderGrad)" stroke-width="8" filter="url(#puckShadow)"/>

  <!-- Inner Bevel Highlight -->
  <circle cx="256" cy="256" r="176" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>

  <!-- Top Specular Sheen -->
  <path d="M 106 256 A 150 150 0 0 1 406 256 Z" fill="url(#specularGrad)"/>

  <!-- Lucide rotate-cw-fading-clock Scaled to Center (24x24 mapped to 192x192 at offset 160,160) -->
  <g transform="translate(160, 160) scale(8)" stroke="url(#iconGrad)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#iconGlow)">
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
</svg>`;

const publicDir = path.join(rootDir, 'public');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('✅ Wrote public/icon.svg');
