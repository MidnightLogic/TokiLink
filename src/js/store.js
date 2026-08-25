/**
 * ═══════════════════════════════════════════════════════════════
 *  Application State (Nano Stores)
 *  Lightweight, reactive state management
 * ═══════════════════════════════════════════════════════════════
 */

import { atom, computed } from 'nanostores';

// Helper for localStorage persistence
function persistentAtom(key, defaultValue) {
  let initial = defaultValue;
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      initial = JSON.parse(item);
    }
  } catch (e) {
    console.warn(`[Store] Error reading ${key} from storage:`, e);
  }

  const store = atom(initial);
  store.subscribe(val => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn(`[Store] Error saving ${key} to storage:`, e);
    }
  });

  return store;
}

// ─── Paired Devices & Active Device ────────────────────────────

export const pairedDevicesStore = persistentAtom('seiko_paired_devices', []);
export const activeDeviceIdStore = persistentAtom('seiko_active_device_id', null);

// Computed store for active device object
export const activeDeviceStore = computed(
  [pairedDevicesStore, activeDeviceIdStore],
  (devices, activeId) => {
    if (!devices || devices.length === 0) return null;
    return devices.find(d => d.id === activeId) || devices[0] || null;
  }
);

// ─── Connection State ──────────────────────────────────────────
// 'disconnected' | 'connecting' | 'connected' | 'syncing'
export const connectionStateStore = atom('disconnected');
export const connectionStatusTextStore = atom('Press to sync your Seiko clock');

// ─── Clock Alarms Store ────────────────────────────────────────

const DEFAULT_ALARMS = [
  { id: 1, alarmNo: 1, hour: 7, minute: 0, on: true, days: [1, 2, 3, 4, 5], sound: 0, soundName: 'Melody 1', volume: 15, snooze: true },
  { id: 2, alarmNo: 2, hour: 8, minute: 30, on: false, days: [6, 0], sound: 3, soundName: 'FM Radio Preset 1', volume: 15, snooze: true },
];
export const alarmsStore = persistentAtom('seiko_alarms', DEFAULT_ALARMS);

// ─── FM Radio Store ────────────────────────────────────────────

const DEFAULT_RADIO = {
  power: true,
  frequency: '89.5',
  volume: 12,
  activePreset: 0,
  presets: [
    { ch: 1, freq: '89.5', name: 'Preset 1' },
    { ch: 2, freq: '91.3', name: 'Preset 2' },
    { ch: 3, freq: '95.8', name: 'Preset 3' },
    { ch: 4, freq: '100.5', name: 'Preset 4' },
    { ch: 5, freq: '104.7', name: 'Preset 5' },
  ]
};
export const radioStore = persistentAtom('seiko_radio', DEFAULT_RADIO);

// ─── Display & Audio Settings Store ────────────────────────────

const DEFAULT_DISPLAY = {
  brightness: 3,
  bass: 0,
  autoPowerOff: 0,
  sleepTimer: 0,
};
export const displayStore = persistentAtom('seiko_display', DEFAULT_DISPLAY);

// ─── Theme Store ('dark' | 'light') ────────────────────────────

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('seiko_theme');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return 'dark';
}
export const themeStore = persistentAtom('seiko_theme', getInitialTheme());

// ─── General Settings Store ────────────────────────────────────

const DEFAULT_SETTINGS = {
  useApi: true,
  use24h: true,
  debug: false,
  forceAllTabs: false,
  manualTime: false,
  manualMode: 'timezone', // 'timezone' or 'exact'
  selectedTzIdx: null,
  manualTimeVal: null,
};
export const settingsStore = persistentAtom('seiko_settings', DEFAULT_SETTINGS);

// ─── Sync History Log Store ────────────────────────────────────

export const syncLogStore = persistentAtom('seiko_sync_log', []);

// ─── Actions & Helpers ─────────────────────────────────────────

export const DeviceActions = {
  addOrUpdateDevice(deviceInfo) {
    const list = [...pairedDevicesStore.get()];
    
    // 1. Exact Bluetooth ID match
    let index = list.findIndex(d => d.id === deviceInfo.id);

    // 2. If ID differs (due to new ephemeral session ID from browser after PWA restart),
    // match by advertised BLE name
    if (index < 0 && deviceInfo.name) {
      index = list.findIndex(d => d.name === deviceInfo.name);
    }

    // 3. If still not matched, but only 1 device is in storage and user didn't explicitly click "Add Clock",
    // update that existing clock rather than creating a duplicate
    if (index < 0 && list.length === 1 && !deviceInfo.isExplicitNew) {
      index = 0;
    }

    if (index >= 0) {
      const oldId = list[index].id;
      list[index] = { ...list[index], ...deviceInfo, id: deviceInfo.id };
      pairedDevicesStore.set(list);
      if (activeDeviceIdStore.get() === oldId || !activeDeviceIdStore.get()) {
        activeDeviceIdStore.set(deviceInfo.id);
      }
    } else {
      list.push(deviceInfo);
      pairedDevicesStore.set(list);
      if (!activeDeviceIdStore.get() || list.length === 1) {
        activeDeviceIdStore.set(deviceInfo.id);
      }
    }
  },

  deduplicateDevices() {
    const list = pairedDevicesStore.get();
    if (!list || list.length <= 1) return;
    
    const seen = new Map();
    const unique = [];
    for (const d of list) {
      const key = d.name || 'Seiko Clock';
      if (!seen.has(key)) {
        seen.set(key, d);
        unique.push(d);
      }
    }

    if (unique.length !== list.length) {
      pairedDevicesStore.set(unique);
      const activeId = activeDeviceIdStore.get();
      if (!unique.some(d => d.id === activeId)) {
        activeDeviceIdStore.set(unique[0]?.id || null);
      }
    }
  },

  removeDevice(deviceId) {
    const list = pairedDevicesStore.get().filter(d => d.id !== deviceId);
    pairedDevicesStore.set(list);
    if (activeDeviceIdStore.get() === deviceId) {
      activeDeviceIdStore.set(list.length > 0 ? list[0].id : null);
    }
  },

  setActiveDevice(deviceId) {
    activeDeviceIdStore.set(deviceId);
  },

  updateSyncTimestamp(deviceId) {
    const list = pairedDevicesStore.get().map(d => {
      if (d.id === deviceId) {
        return { ...d, lastSynced: Date.now() };
      }
      return d;
    });
    pairedDevicesStore.set(list);
  }
};
