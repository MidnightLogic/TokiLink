import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const localesDir = path.join(rootDir, 'src', 'locales');
const srcJsDir = path.join(rootDir, 'src', 'js');
const indexHtmlPath = path.join(rootDir, 'index.html');

const localeFiles = ['en.json', 'ja.json', 'de.json', 'fr.json', 'es.json', 'zh.json'];

// 1. Load all locale dictionaries
const locales = {};
for (const file of localeFiles) {
  const filePath = path.join(localesDir, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    locales[file.replace('.json', '')] = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed to load locale file ${file}:`, err.message);
    process.exit(1);
  }
}

const enKeys = new Set(Object.keys(locales.en));

// 2. Extract keys from index.html
const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
const usedKeysInHtml = new Set();

const htmlI18nRegex = /data-i18n(?:-placeholder|-title|-aria-label)?="([^"]+)"/g;
let match;
while ((match = htmlI18nRegex.exec(htmlContent)) !== null) {
  usedKeysInHtml.add(match[1]);
}

// 3. Extract keys from all .js files in src/js
const usedKeysInJs = new Set();

function scanJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanJsFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Matches i18n.t('key') or i18n.t("key") or i18n.t(`key`)
      const jsI18nRegex = /i18n\.t\(\s*['"`]([a-zA-Z0-9_.-]+)['"`]/g;
      let jsMatch;
      while ((jsMatch = jsI18nRegex.exec(content)) !== null) {
        usedKeysInJs.add(jsMatch[1]);
      }

      // Dynamic patterns (e.g. sync.status.${state}, radio.genre.${genre}, etc.)
      const dynamicStatusRegex = /i18n\.t\(\s*`sync\.status\.\$\{/g;
      if (dynamicStatusRegex.test(content)) {
        ['idle', 'searching', 'connecting', 'syncing', 'synced', 'error', 'blocked'].forEach(s => usedKeysInJs.add(`sync.status.${s}`));
      }

      const dynamicBtnRegex = /i18n\.t\(\s*`sync\.btn\.\$\{/g;
      if (dynamicBtnRegex.test(content)) {
        ['connecting', 'syncing'].forEach(s => usedKeysInJs.add(`sync.btn.${s}`));
      }

      const dynamicRadioGenreRegex = /i18n\.t\(\s*`radio\.genre\.\$\{/g;
      if (dynamicRadioGenreRegex.test(content)) {
        ['all', 'news', 'pop', 'rock', 'classical', 'jazz', 'talk'].forEach(g => usedKeysInJs.add(`radio.genre.${g}`));
      }

      const dynamicSeriesRegex = /`series\.\$\{/g;
      if (dynamicSeriesRegex.test(content)) {
        ['multiSound', 'seriesC3', 'standardDigital', 'nexTime', 'generic'].forEach(s => usedKeysInJs.add(`series.${s}`));
      }

      const dynamicDeviceStatusRegex = /i18n\.t\(\s*['"`]device\.status\./g;
      if (dynamicDeviceStatusRegex.test(content)) {
        ['connected', 'syncing', 'connecting', 'ready', 'disconnected'].forEach(s => usedKeysInJs.add(`device.status.${s}`));
      }

      const dynamicNoticeRegex = /notice\.(alarmCompat|radioCompat|displayCompat|modelNotice)/g;
      if (dynamicNoticeRegex.test(content)) {
        ['alarmCompat', 'radioCompat', 'displayCompat', 'modelNotice'].forEach(n => usedKeysInJs.add(`notice.${n}`));
      }
    }
  }
}

scanJsFiles(srcJsDir);

const allUsedKeys = new Set([...usedKeysInHtml, ...usedKeysInJs]);

console.log('═══════════════════════════════════════════════════════');
console.log(`🌐 i18n Verification Suite — Checking ${localeFiles.length} Languages`);
console.log(`📊 Found ${allUsedKeys.size} unique keys referenced in HTML & JS`);
console.log(`📖 Base en.json contains ${enKeys.size} keys`);
console.log('═══════════════════════════════════════════════════════\n');

let hasErrors = false;

// 4. Verify that every key used in HTML / JS exists in en.json
console.log('--- Checking for Missing Keys in en.json ---');
const missingInEn = [];
for (const key of allUsedKeys) {
  if (!enKeys.has(key)) {
    missingInEn.push(key);
  }
}

if (missingInEn.length > 0) {
  hasErrors = true;
  console.error(`❌ MISSING in en.json (${missingInEn.length} keys):`);
  missingInEn.forEach(k => console.error(`   - "${k}"`));
} else {
  console.log(`✅ All ${allUsedKeys.size} HTML/JS keys are present in en.json.`);
}

// 5. Verify that all 6 language dictionaries have complete key parity with en.json
console.log('\n--- Checking Parity Across All 6 Locales ---');
for (const lang of Object.keys(locales)) {
  if (lang === 'en') continue;
  const langKeys = new Set(Object.keys(locales[lang]));
  const missingInLang = [];
  const emptyInLang = [];

  for (const key of enKeys) {
    if (!langKeys.has(key)) {
      missingInLang.push(key);
    } else if (typeof locales[lang][key] !== 'string' || locales[lang][key].trim() === '') {
      emptyInLang.push(key);
    }
  }

  if (missingInLang.length > 0 || emptyInLang.length > 0) {
    hasErrors = true;
    console.error(`❌ Issues in ${lang}.json:`);
    if (missingInLang.length > 0) {
      console.error(`   Missing keys (${missingInLang.length}):`, missingInLang);
    }
    if (emptyInLang.length > 0) {
      console.error(`   Empty keys (${emptyInLang.length}):`, emptyInLang);
    }
  } else {
    console.log(`✅ ${lang}.json has 100% key parity with en.json (${langKeys.size} keys).`);
  }
}

// 6. Check for Orphan/Unused keys in en.json
console.log('\n--- Checking for Unused / Orphan Keys in en.json ---');
const unusedKeys = [];
for (const key of enKeys) {
  if (!allUsedKeys.has(key)) {
    unusedKeys.push(key);
  }
}

if (unusedKeys.length > 0) {
  console.warn(`⚠️ Warning: ${unusedKeys.length} keys in en.json are not explicitly referenced in code:`);
  unusedKeys.forEach(k => console.warn(`   - "${k}"`));
} else {
  console.log('✅ No unused keys in en.json.');
}

console.log('\n═══════════════════════════════════════════════════════');
if (hasErrors) {
  console.error('❌ i18n TEST FAILED: Please fix missing translation keys above.');
  process.exit(1);
} else {
  console.log('🎉 ALL i18n INTEGRITY TESTS PASSED!');
  process.exit(0);
}
