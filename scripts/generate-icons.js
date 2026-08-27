import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const pwaAssetsDir = path.join(publicDir, 'pwa-assets');

async function buildPngIcons() {
  const svgPath = path.join(publicDir, 'icon.svg');
  if (!fs.existsSync(svgPath)) {
    throw new Error('public/icon.svg not found!');
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // Favicon (48x48 & 32x32 & 16x16)
  await sharp(svgBuffer).resize(48, 48).png().toFile(path.join(publicDir, 'favicon.png'));

  // 192x192 PWA Icon
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 512x512 PWA Icon
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));

  // Apple Touch Icon (180x180)
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(pwaAssetsDir, 'apple-icon-180.png'));

  // Maskable Icons with safe-zone padding
  // Maskable icons are placed inside a 512x512 canvas with ~10% safe margin to prevent OS corner clipping
  const maskable192 = await sharp(svgBuffer).resize(160, 160).toBuffer();
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: '#181926'
    }
  })
    .composite([{ input: maskable192, gravity: 'center' }])
    .png()
    .toFile(path.join(pwaAssetsDir, 'manifest-icon-192.maskable.png'));

  const maskable512 = await sharp(svgBuffer).resize(420, 420).toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#181926'
    }
  })
    .composite([{ input: maskable512, gravity: 'center' }])
    .png()
    .toFile(path.join(pwaAssetsDir, 'manifest-icon-512.maskable.png'));

  console.log('✅ Generated all PWA icons & favicon from public/icon.svg successfully!');
}

buildPngIcons().catch(console.error);
