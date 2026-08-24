/**
 * ═══════════════════════════════════════════════════════════════
 *  Settings View Component
 *  Theme switching (Dark/Light), preferences, and diagnostics
 * ═══════════════════════════════════════════════════════════════
 */

import { settingsStore, themeStore, syncLogStore } from '../store.js';
import { i18n } from '../i18n.js';

export class SettingsView {
  constructor(dom, onSyncLogClear) {
    this.dom = dom;
    this.onSyncLogClear = onSyncLogClear;
    this.init();
  }

  init() {
    // Re-render logs when language changes
    i18n.onLocaleChange(() => {
      this.renderSyncLog(syncLogStore.get());
    });

    // Theme subscription
    themeStore.subscribe(theme => {
      document.documentElement.classList.toggle('light', theme === 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
      if (this.dom.themeToggleBtn) {
        this.dom.themeToggleBtn.setAttribute('title', theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');
      }
      if (this.dom.themeSelect) {
        this.dom.themeSelect.value = theme;
      }
    });

    this.dom.themeToggleBtn?.addEventListener('click', () => {
      const current = themeStore.get();
      themeStore.set(current === 'light' ? 'dark' : 'light');
    });

    this.dom.themeSelect?.addEventListener('change', (e) => {
      themeStore.set(e.target.value);
    });

    // Open/close panel
    (this.dom.settingsOpenBtn || this.dom.settingsBtn)?.addEventListener('click', () => this.open());
    this.dom.settingsCloseBtn?.addEventListener('click', () => this.close());
    this.dom.settingsOverlay?.addEventListener('click', () => this.close());

    // Form inputs
    this.dom.useApiToggle?.addEventListener('change', (e) => {
      this.updateSetting('useApi', e.target.checked);
    });

    this.dom.use24hToggle?.addEventListener('change', (e) => {
      this.updateSetting('use24h', e.target.checked);
    });

    this.dom.debugToggle?.addEventListener('change', (e) => {
      this.updateSetting('debug', e.target.checked);
    });

    this.dom.manualTimeToggle?.addEventListener('change', (e) => {
      this.updateSetting('manualTime', e.target.checked);
    });

    this.dom.languageSelect?.addEventListener('change', (e) => {
      i18n.setLocale(e.target.value);
    });

    this.dom.logClearBtn?.addEventListener('click', () => {
      syncLogStore.set([]);
      if (this.onSyncLogClear) this.onSyncLogClear();
    });

    syncLogStore.subscribe(logs => {
      this.renderSyncLog(logs);
    });

    // 1-Click Fast Sync Guide Modal wiring
    const guideOverlay = document.getElementById('backendGuideModalOverlay');
    const openGuideBtn = document.getElementById('openBackendGuideBtn');
    const closeGuideBtn = document.getElementById('backendGuideModalCloseBtn');
    const gotItGuideBtn = document.getElementById('backendGuideModalGotItBtn');

    const openGuideModal = () => {
      if (guideOverlay) {
        guideOverlay.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    };

    const closeGuideModal = () => {
      if (guideOverlay) {
        guideOverlay.classList.add('hidden');
      }
    };

    openGuideBtn?.addEventListener('click', openGuideModal);
    closeGuideBtn?.addEventListener('click', closeGuideModal);
    gotItGuideBtn?.addEventListener('click', closeGuideModal);
    guideOverlay?.addEventListener('click', (e) => {
      if (e.target === guideOverlay) closeGuideModal();
    });

    // Copy handlers for flags
    const setupCopyBtn = (btnId, codeId, textId) => {
      const btn = document.getElementById(btnId);
      const code = document.getElementById(codeId);
      const text = document.getElementById(textId);
      if (btn && code) {
        btn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(code.textContent.trim());
            if (text) text.textContent = i18n.t('banner.copied') || 'Copied!';
            setTimeout(() => {
              if (text) text.textContent = i18n.t('banner.copy') || 'Copy';
            }, 2000);
          } catch (err) {
            console.warn('[Clipboard] Copy error:', err);
          }
        });
      }
    };

    setupCopyBtn('copyBackendFlagBtn', 'backendFlagCode', 'copyBackendFlagText');
    setupCopyBtn('copyBraveGuideFlagBtn', 'braveGuideFlagCode', 'copyBraveGuideFlagText');
    setupCopyBtn('copyBraveBackendFlagBtn', 'braveBackendFlagCode', 'copyBraveBackendFlagText');

    // Populate initial
    this.populateForm(settingsStore.get());
  }

  updateSetting(key, val) {
    const current = settingsStore.get();
    settingsStore.set({ ...current, [key]: val });
  }

  populateForm(settings) {
    if (this.dom.useApiToggle) this.dom.useApiToggle.checked = settings.useApi;
    if (this.dom.use24hToggle) this.dom.use24hToggle.checked = settings.use24h;
    if (this.dom.debugToggle) this.dom.debugToggle.checked = settings.debug;
    if (this.dom.manualTimeToggle) this.dom.manualTimeToggle.checked = settings.manualTime;
    if (this.dom.languageSelect) this.dom.languageSelect.value = i18n.locale;
  }

  open() {
    this.dom.settingsOverlay?.classList.add('open');
    this.dom.settingsPanel?.classList.add('open');
  }

  close() {
    this.dom.settingsOverlay?.classList.remove('open');
    this.dom.settingsPanel?.classList.remove('open');
  }

  renderSyncLog(logs) {
    const entries = this.dom.logEntries;
    if (!entries) return;

    if (!logs || logs.length === 0) {
      entries.innerHTML = `<div class="log-empty" data-i18n="log.empty">${i18n.t('log.empty') || 'No sync attempts yet'}</div>`;
      return;
    }

    entries.innerHTML = logs.map(entry => {
      const timeStr = new Date(entry.timestamp).toLocaleTimeString(i18n.locale);
      const statusClass = entry.success ? 'success' : 'fail';
      const statusText = entry.success ? (i18n.t('log.success') || 'Success') : (i18n.t('log.failed') || 'Failed');
      const deviceName = entry.device || 'Seiko Clock';
      const syncedPrefix = i18n.t('sync.status.synced') || 'Synced to';

      let detailText = '';
      if (entry.success) {
        let syncTime = entry.timeSynced;
        if (!syncTime && entry.detail) {
          // Strip existing prefix if stored as a hardcoded string
          const match = entry.detail.match(/(?:Synced to|Synchronisé à|Sincronizado a|Synchronisiert auf|已同步至|同期完了|同期:?)\s*(.+?)(?:\s*→|$)/i);
          if (match) {
            syncTime = match[1].trim();
          } else {
            syncTime = entry.detail.split('→')[0].trim();
          }
        }
        if (!syncTime) syncTime = timeStr;

        detailText = `${syncedPrefix} ${syncTime} → ${deviceName}`;
      } else {
        detailText = entry.detail || `${deviceName}: ${i18n.t('sync.status.error') || 'Error'}`;
      }

      return `
        <div class="log-entry">
          <span class="log-time">${timeStr}</span>
          <span class="log-badge ${statusClass}">${statusText}</span>
          <span class="log-detail">${detailText}</span>
        </div>
      `;
    }).join('');
  }
}
