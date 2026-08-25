/**
 * ═══════════════════════════════════════════════════════════════
 *  TokiLink for Seiko — Application Orchestrator
 *  Decoupled Architecture with Nano Stores & Web Bluetooth Service
 * ═══════════════════════════════════════════════════════════════
 */

import {
  createIcons,
  Clock, Settings as SettingsIcon, AlertTriangle, AlertCircle, Pencil,
  Bluetooth, Bell, Radio, Sun, X, Loader2, Check,
  XCircle, CheckCircle2, Plus, Moon, Volume1, Volume2,
  ChevronsLeft, ChevronsRight, Trash2, Edit2, Download,
  PencilLine, CalendarClock, RotateCcw, Globe, MapPin, Minus,
  Smartphone, ShieldAlert, Copy, ExternalLink, ArrowUpRight, Puzzle,
  Lock, Info, Sparkles, RefreshCw, Zap, ChevronRight, ChevronDown,
  Cpu, ScanSearch, Play, Layers, Send, Mail, Home, Battery, Bookmark
} from 'lucide';

import { registerSW } from 'virtual:pwa-register';
import '@khmyznikov/pwa-install';
import { pwaUpdateService } from './services/pwaUpdate.js';

// Register Service Worker for PWA
try {
  registerSW({ immediate: true });
} catch (e) {
  console.warn('[PWA] SW register error:', e);
}

function isDebug() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return !!(settingsStore?.get()?.debug || urlParams.get('debug') === 'true');
  } catch (e) {
    return false;
  }
}

// Direct beforeinstallprompt holder for instant native install
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (isDebug()) console.log('[PWA] Native beforeinstallprompt captured!');
});

import { BluetoothService, bleService } from './services/bluetooth.js';
import { PlatformService } from './services/platform.js';
import { DeviceProtocol } from './services/protocol.js';
import { timeService } from './services/time.js';
import {
  pairedDevicesStore,
  activeDeviceIdStore,
  activeDeviceStore,
  connectionStateStore,
  connectionStatusTextStore,
  settingsStore,
  syncLogStore,
  DeviceActions
} from './store.js';

import { ClockView } from './ui/clockView.js';
import { DeviceView } from './ui/deviceView.js';
import { AlarmView } from './ui/alarmView.js';
import { RadioView } from './ui/radioView.js';
import { DisplayView } from './ui/displayView.js';
import { SettingsView } from './ui/settingsView.js';
import { DiagnosticView } from './ui/diagnosticView.js';
import { i18n } from './i18n.js';

const LUCIDE_ICONS = {
  Clock, Settings: SettingsIcon, AlertTriangle, AlertCircle, Pencil,
  Bluetooth, Bell, Radio, Sun, X, Loader2, Check,
  XCircle, CheckCircle2, Plus, Moon, Volume1, Volume2,
  ChevronsLeft, ChevronsRight, Trash2, Edit2, Download,
  PencilLine, CalendarClock, RotateCcw, Globe, MapPin, Minus,
  Smartphone, ShieldAlert, Copy, ExternalLink, ArrowUpRight, Puzzle,
  Lock, Info, Sparkles, RefreshCw, Zap, ChevronRight, ChevronDown,
  Cpu, ScanSearch, Play, Layers, Send, Mail, Home, Battery, Bookmark
};

export function renderIcons() {
  createIcons({ icons: LUCIDE_ICONS });
}

// ─── Application Bootstrap ─────────────────────────────────────

class App {
  constructor() {
    this.dom = {};
    this.diagnostics = null;
  }

  cacheDom() {
    this.dom = {
      // Header
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      pwaInstallBtn: document.getElementById('pwaInstallBtn'),
      pwaInstall: document.getElementById('pwaInstall'),
      settingsOpenBtn: document.getElementById('settingsOpenBtn'),
      compatBanner: document.getElementById('compatBanner'),
      permissionBlockedBanner: document.getElementById('permissionBlockedBanner'),
      braveCompatBanner: document.getElementById('braveCompatBanner'),
      iosCompatBanner: document.getElementById('iosCompatBanner'),

      // Multi-device
      deviceListContainer: document.getElementById('deviceListContainer'),
      deviceCard: document.getElementById('deviceCard'),
      deviceName: document.getElementById('deviceName'),
      deviceId: document.getElementById('deviceId'),
      deviceStatus: document.getElementById('deviceStatus'),
      deviceStatusText: document.getElementById('deviceStatusText'),
      pairNewBtn: document.getElementById('pairNewBtn'),
      forgetDeviceBtn: document.getElementById('forgetDeviceBtn'),

      // Feature Tabs
      featureTabs: document.getElementById('featureTabs'),
      tabBtns: document.querySelectorAll('.tab-btn'),
      tabContents: document.querySelectorAll('.tab-content'),

      // Clock View
      clockCard: document.getElementById('clockCard'),
      clockSourceBadge: document.getElementById('clockSourceBadge'),
      clockSourceText: document.getElementById('clockSourceText'),
      clockDate: document.getElementById('clockDate'),
      clockTime: document.getElementById('clockTime'),
      clockTimezone: document.getElementById('clockTimezone'),
      manualTimeSection: document.getElementById('manualTimeSection'),
      manualTimeInput: document.getElementById('manualTimeInput'),
      manualTimeNowBtn: document.getElementById('manualTimeNowBtn'),
      modeTzBtn: document.getElementById('modeTzBtn'),
      modeExactBtn: document.getElementById('modeExactBtn'),
      tzModeView: document.getElementById('tzModeView'),
      exactModeView: document.getElementById('exactModeView'),
      tzCityName: document.getElementById('tzCityName'),
      tzDeltaBadge: document.getElementById('tzDeltaBadge'),
      tzOffsetPill: document.getElementById('tzOffsetPill'),
      tzSlider: document.getElementById('tzSlider'),
      tzStepDownBtn: document.getElementById('tzStepDownBtn'),
      tzStepUpBtn: document.getElementById('tzStepUpBtn'),
      tzResetHomeBtn: document.getElementById('tzResetHomeBtn'),
      tzHomeMarkerWrap: document.getElementById('tzHomeMarkerWrap'),
      tzHomeBadge: document.getElementById('tzHomeBadge'),
      tzHomeBadgeText: document.getElementById('tzHomeBadgeText'),
      directManualTimeToggle: document.getElementById('directManualTimeToggle'),
      plasmaCanvas: document.getElementById('plasmaCanvas'),
      syncBtn: document.getElementById('syncBtn'),
      syncBtnLabel: document.getElementById('syncBtnLabel'),
      syncStatus: document.getElementById('syncStatus'),

      // Sync Log
      logSection: document.getElementById('logSection'),
      logClearBtn: document.getElementById('logClearBtn'),
      logEntries: document.getElementById('logEntries'),

      // Alarms View
      alarmList: document.getElementById('alarmList'),
      addAlarmBtn: document.getElementById('addAlarmBtn'),
      alarmModalOverlay: document.getElementById('alarmModalOverlay'),
      alarmModalTitle: document.getElementById('alarmModalTitle'),
      alarmModalCloseBtn: document.getElementById('alarmModalCloseBtn'),
      alarmModalTimeInput: document.getElementById('alarmModalTimeInput'),
      modalDaysGrid: document.getElementById('modalDaysGrid'),
      alarmModalSoundSelect: document.getElementById('alarmModalSoundSelect'),
      alarmModalVolSlider: document.getElementById('alarmModalVolSlider'),
      alarmModalVolVal: document.getElementById('alarmModalVolVal'),
      alarmModalSnoozeInput: document.getElementById('alarmModalSnoozeInput'),
      alarmModalDeleteBtn: document.getElementById('alarmModalDeleteBtn'),
      alarmModalCancelBtn: document.getElementById('alarmModalCancelBtn'),
      alarmModalSaveBtn: document.getElementById('alarmModalSaveBtn'),

      // Radio View
      radioPowerToggle: document.getElementById('radioPowerToggle'),
      radioFreqInput: document.getElementById('radioFreqInput'),
      radioFreqSlider: document.getElementById('radioFreqSlider'),
      radioSeekDownBtn: document.getElementById('radioSeekDownBtn'),
      radioSeekUpBtn: document.getElementById('radioSeekUpBtn'),
      radioVolumeSlider: document.getElementById('radioVolumeSlider'),
      radioVolumeVal: document.getElementById('radioVolumeVal'),
      radioMuteBtn: document.getElementById('radioMuteBtn'),
      radioMuteBtnIcon: document.getElementById('radioMuteBtnIcon'),
      radioMuteLabel: document.getElementById('radioMuteLabel'),
      radioVolDownBtn: document.getElementById('radioVolDownBtn'),
      radioVolUpBtn: document.getElementById('radioVolUpBtn'),
      radioVolLeftIcon: document.getElementById('radioVolLeftIcon'),
      presetGrid: document.getElementById('presetGrid'),
      editPresetsBtn: document.getElementById('editPresetsBtn'),
      radioSavePresetBtn: document.getElementById('radioSavePresetBtn'),
      presetModalOverlay: document.getElementById('presetModalOverlay'),
      presetModalTitle: document.getElementById('presetModalTitle'),
      presetModalCloseBtn: document.getElementById('presetModalCloseBtn'),
      presetModalSlotBtns: document.querySelectorAll('#presetModalSlotPicker .segment-btn'),
      presetModalNameInput: document.getElementById('presetModalNameInput'),
      presetModalFreqInput: document.getElementById('presetModalFreqInput'),
      presetUseCurrentFreqBtn: document.getElementById('presetUseCurrentFreqBtn'),
      presetModalCancelBtn: document.getElementById('presetModalCancelBtn'),
      presetModalSaveBtn: document.getElementById('presetModalSaveBtn'),

      // Display View
      brightnessBtns: document.querySelectorAll('.brightness-segments .segment-btn'),
      brightnessVal: document.getElementById('brightnessVal'),
      bassBtns: document.querySelectorAll('.bass-segments .segment-btn'),
      bassVal: document.getElementById('bassVal'),
      autoPowerOffSelect: document.getElementById('autoPowerOffSelect'),

      // Settings View
      settingsOverlay: document.getElementById('settingsOverlay'),
      settingsPanel: document.getElementById('settingsPanel'),
      settingsCloseBtn: document.getElementById('settingsCloseBtn'),
      themeSelect: document.getElementById('themeSelect'),
      useApiToggle: document.getElementById('useApiToggle'),
      manualTimeToggle: document.getElementById('manualTimeToggle'),
      use24hToggle: document.getElementById('use24hToggle'),
      debugToggle: document.getElementById('debugToggle'),
      forceAllTabsToggle: document.getElementById('forceAllTabsToggle'),
      languageSelect: document.getElementById('languageSelect'),
    };
  }

  async init() {
    this.cacheDom();

    // Comprehensive platform & Web Bluetooth diagnostics
    const diagnostics = await PlatformService.getDiagnostics();
    this.diagnostics = diagnostics;

    const urlParams = new URLSearchParams(window.location.search);
    const bannerPreview = urlParams.get('banner')?.toLowerCase();

    if (bannerPreview === 'brave' || (!bannerPreview && diagnostics.diagnostic === 'brave_blocked')) {
      this.dom.braveCompatBanner?.classList.remove('hidden');
    } else if (bannerPreview === 'ios' || (!bannerPreview && diagnostics.diagnostic === 'ios_safari')) {
      this.dom.iosCompatBanner?.classList.remove('hidden');
    } else if (bannerPreview === 'blocked' || (!bannerPreview && diagnostics.diagnostic === 'permission_blocked')) {
      this.dom.permissionBlockedBanner?.classList.remove('hidden');
    } else if (bannerPreview === 'unsupported' || bannerPreview === 'standard' || (!bannerPreview && diagnostics.diagnostic === 'unsupported')) {
      this.dom.compatBanner?.classList.remove('hidden');
    }

    // Setup Copy button for Brave Flag
    const braveCopyBtn = document.getElementById('braveCopyFlagBtn');
    const braveFlagCode = document.getElementById('braveFlagCode');
    const braveCopyText = document.getElementById('braveCopyText');
    if (braveCopyBtn && braveFlagCode) {
      braveCopyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(braveFlagCode.textContent.trim());
          if (braveCopyText) braveCopyText.textContent = i18n.t('banner.copied') || 'Copied!';
          setTimeout(() => {
            if (braveCopyText) braveCopyText.textContent = i18n.t('banner.copy') || 'Copy';
          }, 2000);
        } catch (err) {
          console.warn('[Brave] Clipboard error:', err);
        }
      });
    }

    // Setup Open in Bluefy Deep Link for iOS
    const openInBluefyBtn = document.getElementById('openInBluefyBtn');
    if (openInBluefyBtn) {
      openInBluefyBtn.href = `bluefy://open?url=${encodeURIComponent(window.location.href)}`;
    }

    // Initialize multi-language
    i18n.init();
    renderIcons();

    // Clean up any stale duplicate devices from localStorage
    DeviceActions.deduplicateDevices();

    // Initialize UI Views
    this.clockView = new ClockView(this.dom);
    this.deviceView = new DeviceView(this.dom, () => this.pairNewClock(true));
    this.alarmView = new AlarmView(this.dom, renderIcons);
    this.radioView = new RadioView(this.dom, renderIcons);
    this.displayView = new DisplayView(this.dom, renderIcons);
    this.settingsView = new SettingsView(this.dom, () => syncLogStore.set([]), renderIcons);
    this.diagnosticView = new DiagnosticView(this.dom, renderIcons);

    this.initTabs();
    this.bindSyncAction();
    renderIcons();

    i18n.onLocaleChange(() => {
      if (connectionStateStore.get() === 'disconnected') {
        connectionStatusTextStore.set(i18n.t('sync.status.idle'));
      }
      renderIcons();
    });

    // Fetch initial time
    if (settingsStore.get().useApi) {
      timeService.fetchApiTime();
    }

    // PWA Install Prompt Button
    if (this.dom.pwaInstallBtn && this.dom.pwaInstall) {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || !!window.navigator.standalone
        || document.referrer.includes('android-app://')
        || window.location.search.includes('standalone=true');

      // Strict capability check: Only offer PWA installation if Web Bluetooth is supported (Chrome/Edge/Opera or Safari WITH Beacio extension active).
      // Hide on Bluefy (uses in-app bookmarks) and Safari without Beacio (cannot use BLE).
      const isSimulatedIOS = bannerPreview === 'ios';
      const isRealIOSWithoutBLE = this.diagnostics?.diagnostic === 'ios_safari';
      const isBluefy = this.diagnostics?.browser?.isBluefy || /Bluefy/i.test(navigator.userAgent);
      const hasBleWorking = this.diagnostics?.bluetooth?.isSupported;

      const canInstallPwaWithBle = hasBleWorking && !isSimulatedIOS && !isRealIOSWithoutBLE && !isBluefy;

      const pwaEl = this.dom.pwaInstall;
      const btn = this.dom.pwaInstallBtn;

      if (isStandalone || !canInstallPwaWithBle) {
        btn.classList.add('hidden');
        if (pwaEl) pwaEl.style.display = 'none';
      } else {
        btn.classList.remove('hidden');
        if (pwaEl) pwaEl.style.display = '';
      }

      btn.addEventListener('click', async () => {
        if (!canInstallPwaWithBle) return;
        if (deferredInstallPrompt) {
          try {
            await deferredInstallPrompt.prompt();
            const choice = await deferredInstallPrompt.userChoice;
            console.log('[PWA] User choice:', choice);
            if (choice.outcome === 'accepted') {
              deferredInstallPrompt = null;
              btn.classList.add('hidden');
              if (pwaEl) pwaEl.style.display = 'none';
            }
            return;
          } catch (err) {
            console.warn('[PWA] Prompt error:', err);
          }
        }

        try {
          if (pwaEl.isInstallAvailable) {
            await pwaEl.install();
          } else {
            pwaEl.showDialog(true);
          }
        } catch (err) {
          console.warn('[PWA] Native install prompt bypassed or failed:', err);
          pwaEl.showDialog(true);
        }
      });

      pwaEl.addEventListener('pwa-install-available-event', () => {
        if (!isStandalone && canInstallPwaWithBle) {
          btn.classList.remove('hidden');
          pwaEl.style.display = '';
        } else {
          btn.classList.add('hidden');
          pwaEl.style.display = 'none';
        }
      });

      pwaEl.addEventListener('pwa-install-success-event', () => {
        btn.classList.add('hidden');
        if (pwaEl) pwaEl.style.display = 'none';
      });
    }

    // Look up previously permitted Bluetooth devices on page load
    await this.loadPermittedDevices();

    // Watch for PWA updates
    this.initPwaUpdateWatcher();
  }

  initPwaUpdateWatcher() {
    const toast = document.getElementById('pwaUpdateToast');
    const updateBtn = document.getElementById('pwaUpdateNowBtn');
    const dismissBtn = document.getElementById('pwaUpdateDismissBtn');

    pwaUpdateService.init(() => {
      if (toast) {
        toast.classList.remove('hidden');
        renderIcons();
      }
    });

    updateBtn?.addEventListener('click', () => {
      pwaUpdateService.applyUpdate();
    });

    dismissBtn?.addEventListener('click', () => {
      if (toast) toast.classList.add('hidden');
    });
  }

  initTabs() {
    this.dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.tabBtns.forEach(b => b.classList.remove('active'));
        this.dom.tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = `tab-${btn.dataset.tab}`;
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  async loadPermittedDevices() {
    try {
      const permitted = await bleService.getPermittedDevices();
      if (isDebug()) console.log(`[App] Found ${permitted.length} previously permitted device(s) on origin.`);
      permitted.forEach(d => {
        const model = DeviceProtocol.detectModel(d.name);
        DeviceActions.addOrUpdateDevice({
          id: d.id,
          name: d.name || 'Seiko Clock',
          model: model.type,
        });
      });
    } catch (err) {
      console.warn('[App] Error loading permitted devices:', err);
    }
  }

  async pairNewClock(isExplicitNew = false) {
    connectionStateStore.set('searching');
    connectionStatusTextStore.set(i18n.t('sync.status.searching'));

    try {
      const device = await bleService.requestDevice();
      const model = DeviceProtocol.detectModel(device.name);
      DeviceActions.addOrUpdateDevice({
        id: device.id,
        name: device.name || 'Seiko Clock',
        model: model.type,
        isExplicitNew
      });
      DeviceActions.setActiveDevice(device.id);
      connectionStateStore.set('disconnected');
      connectionStatusTextStore.set(i18n.t('sync.status.idle'));
      return device;
    } catch (err) {
      connectionStateStore.set('disconnected');
      const isBlocked = err.name === 'SecurityError' || (err.message && /permission.*blocked|access.*denied.*permanently/i.test(err.message));
      if (isBlocked) {
        connectionStatusTextStore.set(i18n.t('sync.status.blocked'));
        if (this.diagnostics?.browser?.isBrave) {
          this.dom.braveCompatBanner?.classList.remove('hidden');
        } else {
          this.dom.permissionBlockedBanner?.classList.remove('hidden');
        }
      } else {
        connectionStatusTextStore.set(i18n.t('sync.status.idle'));
      }
      if (err.name !== 'NotFoundError' && !isBlocked) {
        console.warn('[App] BLE pairing cancelled or peripheral busy:', err.message || err);
      }
      return null;
    }
  }

  bindSyncAction() {
    this.dom.syncBtn?.addEventListener('click', () => this.performSync());
  }

  async performSync() {
    let activeDevice = activeDeviceStore.get();
    let permittedDevices = await bleService.getPermittedDevices();
    let targetDevice = permittedDevices.find(d => activeDevice && (d.id === activeDevice.id || (d.name && d.name === activeDevice.name)));

    // If no exact match but permitted devices exist in Chrome, use the permitted device directly
    if (!targetDevice && permittedDevices.length > 0) {
      targetDevice = permittedDevices[0];
      const model = DeviceProtocol.detectModel(targetDevice.name);
      DeviceActions.addOrUpdateDevice({
        id: targetDevice.id,
        name: targetDevice.name || 'Seiko Clock',
        model: model.type,
      });
      DeviceActions.setActiveDevice(targetDevice.id);
    }

    // Helper to execute atomic time fetch, GATT connection, immediate time write, and clean disconnect
    const executeSync = async (device) => {
      const config = DeviceProtocol.getConfig(device.name || '');
      connectionStateStore.set('connecting');
      connectionStatusTextStore.set(`${i18n.t('sync.btn.connecting')} ${device.name || 'clock'}...`);

      // 1. Fetch fresh atomic time FIRST (prior to opening BLE GATT connection)
      if (settingsStore.get().useApi) {
        try {
          await timeService.fetchApiTime();
        } catch (e) {
          console.warn('[Sync] Time API pre-fetch warning, continuing:', e);
        }
      }

      // 2. Connect to GATT
      await bleService.connect(device);

      connectionStateStore.set('syncing');
      connectionStatusTextStore.set(`${i18n.t('sync.btn.syncing')}...`);

      // 3. Compute target time AT THE EXACT INSTANT OF TRANSMISSION (eliminates GATT connection latency)
      const targetDate = this.clockView.getImmediateSyncTarget();

      // 4. Perform adaptive clock time sync across Multi-Sound / Series C3 / SQ / NexTime
      await bleService.syncClockTime(device, targetDate);
      if (isDebug()) console.log(`[Sync] SUCCESS! Transmitted time packet to ${device.name}`);

      // 5. Explicit clean GATT disconnect so Seiko clock immediately exits BLE sync mode and renders the new time
      try {
        await bleService.disconnect();
      } catch (e) {
        // Safe to ignore if already dropped by peripheral
      }

      // 6. Update Success State
      const syncTimeStr = targetDate.toLocaleTimeString();
      connectionStateStore.set('connected');
      connectionStatusTextStore.set(`${i18n.t('sync.status.synced')} ${syncTimeStr} → ${device.name}`);

      DeviceActions.updateSyncTimestamp(device.id);

      // Log entry
      const log = syncLogStore.get();
      syncLogStore.set([{
        timestamp: Date.now(),
        success: true,
        device: device.name || 'Seiko Clock',
        timeSynced: syncTimeStr
      }, ...log.slice(0, 29)]);

      setTimeout(() => {
        if (connectionStateStore.get() === 'connected') {
          connectionStateStore.set('disconnected');
          connectionStatusTextStore.set(i18n.t('sync.status.idle'));
        }
      }, 3500);
    };

    // Phase 1: Try direct connection with cached/permitted device (for 1-click zero-dialog sync)
    if (targetDevice) {
      try {
        await executeSync(targetDevice);
        return;
      } catch (err) {
        console.warn(`[Sync] Direct connect to cached device (${targetDevice.name || targetDevice.id}) failed: ${err.message}. Falling back to device picker to re-establish permission...`);
      }
    }

    // Phase 2: If no permitted device or direct connection failed (e.g. permission flag changed ID or device reset),
    // automatically open the native device picker to let the user select/refresh their clock
    try {
      connectionStateStore.set('searching');
      connectionStatusTextStore.set(i18n.t('sync.status.searching'));

      targetDevice = await this.pairNewClock(false);
      if (!targetDevice) {
        return;
      }

      await executeSync(targetDevice);
    } catch (err) {
      console.error('[Sync] Failed:', err);
      connectionStateStore.set('error');
      connectionStatusTextStore.set(`${i18n.t('sync.status.error')} (${err.message})`);

      const log = syncLogStore.get();
      syncLogStore.set([{
        timestamp: Date.now(),
        success: false,
        detail: `${targetDevice?.name || 'Device'}: ${err.message}`
      }, ...log.slice(0, 29)]);

      setTimeout(() => {
        if (connectionStateStore.get() === 'error') {
          connectionStateStore.set('disconnected');
          connectionStatusTextStore.set(i18n.t('sync.status.idle'));
        }
      }, 4000);
    }
  }
}

// Kick off on load
const app = new App();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
