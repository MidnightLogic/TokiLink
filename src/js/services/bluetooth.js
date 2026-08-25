/**
 * ═══════════════════════════════════════════════════════════════
 *  Bluetooth Service (Decoupled GATT Layer)
 *  Zero DOM references — pure Web Bluetooth communication
 * ═══════════════════════════════════════════════════════════════
 */

import { DeviceProtocol } from './protocol.js';
import { settingsStore, activeDeviceStore, pairedDevicesStore } from '../store.js';

function isDebug() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return !!(settingsStore?.get()?.debug || urlParams.get('debug') === 'true');
  } catch (e) {
    return false;
  }
}

const debug = {
  log: (...args) => { if (isDebug()) console.log(...args); },
  warn: (...args) => { if (isDebug()) console.warn(...args); },
  info: (...args) => { if (isDebug()) console.info(...args); },
};

export class BluetoothService {
  constructor() {
    this._device = null;
    this._server = null;
    this._services = new Map();
    this._characteristics = new Map();
    this._listeners = new Map();
    this._sessionDeviceCache = new Map(); // id -> BluetoothDevice, survives within a single session
    this._failedDirectConnectDevices = new Set(); // IDs of devices where direct GATT connect failed

    if (typeof navigator !== 'undefined' && navigator.bluetooth && typeof navigator.bluetooth.addEventListener === 'function') {
      try {
        navigator.bluetooth.addEventListener('availabilitychanged', (e) => {
          debug.log('[BLE] Bluetooth adapter availability changed:', e.value);
          this.emit('availabilitychanged', { available: e.value });
        });
      } catch (err) {}
    }
  }

  static isSupported() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  }

  static async isAvailable() {
    if (typeof navigator !== 'undefined' && navigator.bluetooth && typeof navigator.bluetooth.getAvailability === 'function') {
      try {
        return await navigator.bluetooth.getAvailability();
      } catch (e) {
        return true;
      }
    }
    return true;
  }

  // ─── Event Emitter ───────────────────────────────────────────

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(callback);
    }
  }

  emit(event, payload) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[BLE Error] in listener for ${event}:`, err);
        }
      });
    }
  }

  // ─── Device Discovery & Permission Persistence ───────────────

  /**
   * Retrieves previously authorized devices without prompting the user.
   */
  async getPermittedDevices() {
    if (!BluetoothService.isSupported()) {
      return [];
    }

    let devices = [];
    const hasGetDevices = typeof navigator.bluetooth.getDevices === 'function';
    debug.log(`[BLE Debug] navigator.bluetooth.getDevices available: ${hasGetDevices}`);

    if (hasGetDevices) {
      try {
        devices = (await navigator.bluetooth.getDevices()) || [];
        debug.log(`[BLE Debug] navigator.bluetooth.getDevices() returned ${devices.length} device(s):`, devices.map(d => ({ id: d.id, name: d.name })));
      } catch (err) {
        debug.warn('[BLE Debug] getDevices() call threw error:', err);
      }
    }

    // Include session-cached BluetoothDevice instances (survives within a tab session)
    for (const [id, cachedDevice] of this._sessionDeviceCache) {
      if (!devices.some(d => d.id === id)) {
        devices.push(cachedDevice);
      }
    }

    // Also include currently active BluetoothDevice instance
    if (this._device && !devices.some(d => d.id === this._device.id)) {
      devices.unshift(this._device);
    }

    if (devices.length === 0) {
      if (hasGetDevices) {
        debug.info('[BLE Debug] Note: Desktop Chrome requires "chrome://flags/#enable-web-bluetooth-new-permissions-backend" enabled to persist device permissions across page reloads.');
      }
      return [];
    }

    const matched = devices.filter(d => {
      if (!d.name) return true;
      const lower = d.name.toLowerCase();
      return DeviceProtocol.NAME_FILTERS.some(filter => lower.includes(filter.toLowerCase()));
    });
    const candidateDevices = matched.length > 0 ? matched : devices;

    // Filter out devices where direct GATT connection has failed, forcing discovery picker recovery
    const validPermitted = candidateDevices.filter(d => !this.hasDirectConnectFailed(d.id));
    debug.log(`[BLE Debug] Eligible permitted devices for direct sync: ${validPermitted.length} (filtered ${candidateDevices.length - validPermitted.length} failed direct-connect candidates)`);
    return validPermitted;
  }

  /**
   * Prompts the browser native device picker (requires user gesture).
   */
  async requestDevice() {
    if (!BluetoothService.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser.');
    }

    const filters = DeviceProtocol.NAME_FILTERS.map(name => ({ namePrefix: name }));
    const optionalServices = DeviceProtocol.allServiceUUIDs();

    debug.log('[BLE] Scanning with filters:', filters.map(f => f.namePrefix));

    const device = await navigator.bluetooth.requestDevice({
      filters,
      optionalServices,
    });

    this._device = device;
    this._sessionDeviceCache.set(device.id, device);
    this.clearDirectConnectFailed(device.id); // Fresh picker selection resets failure counter
    this._bindDeviceEvents(device);
    return device;
  }

  /**
   * Reconnects to a previously stored device by showing a picker with
   * stored device name and all Seiko clock prefixes. Once selected, caches
   * the BluetoothDevice for the rest of the session so subsequent syncs
   * don't trigger the picker again.
   */
  async reconnectStoredDevice(storedDevice) {
    if (!BluetoothService.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser.');
    }

    // Check session cache first — avoids any popup
    if (this._sessionDeviceCache.has(storedDevice.id)) {
      const cached = this._sessionDeviceCache.get(storedDevice.id);
      this._device = cached;
      this._bindDeviceEvents(cached);
      debug.log(`[BLE] Reconnecting from session cache: ${cached.name}`);
      return cached;
    }

    const name = storedDevice.name || '';
    const filters = [];

    if (name && name !== 'Seiko Clock') {
      filters.push({ namePrefix: name });
    }

    // Always include all Seiko model filters to ensure clock is discovered
    DeviceProtocol.NAME_FILTERS.forEach(n => {
      if (!filters.some(f => f.namePrefix === n)) {
        filters.push({ namePrefix: n });
      }
    });

    const optionalServices = DeviceProtocol.allServiceUUIDs();

    debug.log(`[BLE] Reconnect picker for "${name}" with filters:`, filters.map(f => f.namePrefix));
    const device = await navigator.bluetooth.requestDevice({
      filters,
      optionalServices,
    });

    this._device = device;
    this._sessionDeviceCache.set(device.id, device);
    this._bindDeviceEvents(device);
    return device;
  }

  _bindDeviceEvents(device) {
    if (!device) return;
    device.removeEventListener('gattserverdisconnected', this._onDisconnected);
    this._onDisconnected = (event) => {
      debug.log('[BLE] Device disconnected (power-save / idle sleep):', device.name);
      this._server = null;
      this._services.clear();
      this._characteristics.clear();
      this.emit('disconnected', { device, event });
    };
    device.addEventListener('gattserverdisconnected', this._onDisconnected);
  }

  // ─── Connection Management ───────────────────────────────────

  get connectedDevice() {
    return this._server && this._server.connected ? this._device : null;
  }

  get isConnected() {
    return !!(this._server && this._server.connected);
  }

  async connect(device, timeoutMs = 6000) {
    if (!device) throw new Error('No device provided for connection.');

    this._device = device;
    this._bindDeviceEvents(device);
    this.emit('connecting', { device });

    // If already connected, reuse existing GATT server
    if (device.gatt && device.gatt.connected && this._server) {
      debug.log('[BLE Debug] Device is already connected, reusing GATT server.');
      this.emit('connected', { device });
      return this._server;
    }

    // Allow 200ms settling window for OS Bluetooth HCI controller between rapid reconnects
    await new Promise(r => setTimeout(r, 200));

    const connectWithTimeout = (targetDevice, ms) => {
      let timer;
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`GATT connection timed out after ${ms / 1000}s. Check if clock is in range and Bluetooth is on.`));
        }, ms);
      });
      return Promise.race([
        targetDevice.gatt.connect(),
        timeoutPromise
      ]).finally(() => clearTimeout(timer));
    };

    try {
      debug.log(`[BLE Debug] Connecting to GATT server for: ${device.name || device.id}...`);
      this._server = await connectWithTimeout(device, timeoutMs);
      debug.log('[BLE Debug] GATT connected successfully.');
      this.emit('connected', { device });
      return this._server;
    } catch (err) {
      debug.log(`[BLE Debug] Initial connect caught busy socket or timeout (${err.message}), retrying in 250ms...`);
      await new Promise(r => setTimeout(r, 250));
      this._server = await connectWithTimeout(device, timeoutMs);
      debug.log('[BLE Debug] GATT connected on retry.');
      this.emit('connected', { device });
      return this._server;
    }
  }

  async disconnect(device = null) {
    const dev = device || this._device;
    if (dev && dev.gatt && dev.gatt.connected) {
      try {
        dev.gatt.disconnect();
      } catch (err) {
        debug.warn('[BLE Debug] Error during device disconnect:', err);
      }
    }
    if (this._server && this._server.connected) {
      try {
        this._server.disconnect();
      } catch (err) {}
    }
    this._server = null;
    this._services.clear();
    this._characteristics.clear();
    if (this._device) {
      this.emit('disconnected', { device: this._device });
    }
  }

  markDirectConnectFailed(deviceId) {
    if (deviceId) {
      this._failedDirectConnectDevices.add(deviceId);
      debug.log(`[BLE] Device marked as failed direct connect: ${deviceId}`);
    }
  }

  hasDirectConnectFailed(deviceId) {
    return deviceId ? this._failedDirectConnectDevices.has(deviceId) : false;
  }

  clearDirectConnectFailed(deviceId = null) {
    if (deviceId) {
      this._failedDirectConnectDevices.delete(deviceId);
    } else {
      this._failedDirectConnectDevices.clear();
    }
  }

  /**
   * Clears in-memory session device references and resets GATT socket maps.
   */
  clearSessionCache(deviceId = null) {
    if (deviceId) {
      this._sessionDeviceCache.delete(deviceId);
      this.markDirectConnectFailed(deviceId);
      if (this._device && this._device.id === deviceId) {
        this._device = null;
      }
    } else {
      this._sessionDeviceCache.clear();
      this._device = null;
    }
    this._server = null;
    this._services.clear();
    this._characteristics.clear();
  }

  /**
   * Forgets a device, disconnecting GATT, invoking BluetoothDevice.forget()
   * in the browser permissions database, and clearing all local caches.
   */
  async forgetDevice(deviceId) {
    let targetBleDevice = null;

    if (this._device && (this._device.id === deviceId || !deviceId)) {
      targetBleDevice = this._device;
    } else if (deviceId && this._sessionDeviceCache.has(deviceId)) {
      targetBleDevice = this._sessionDeviceCache.get(deviceId);
    }

    if (!targetBleDevice && typeof navigator !== 'undefined' && navigator.bluetooth?.getDevices) {
      try {
        const permitted = await navigator.bluetooth.getDevices();
        targetBleDevice = permitted.find(d => d.id === deviceId);
      } catch (e) {
        debug.warn('[BLE] getDevices error during forget:', e);
      }
    }

    // 1. Disconnect GATT if currently connected
    await this.disconnect();

    // 2. Revoke browser origin permission via Web Bluetooth forget() API
    if (targetBleDevice && typeof targetBleDevice.forget === 'function') {
      try {
        debug.log(`[BLE] Calling device.forget() on: ${targetBleDevice.name || targetBleDevice.id}`);
        await targetBleDevice.forget();
      } catch (err) {
        debug.warn('[BLE] device.forget() warning:', err);
      }
    }

    // 3. Purge from internal session caches
    if (deviceId) {
      this._sessionDeviceCache.delete(deviceId);
    }
    if (this._device && (this._device.id === deviceId || !deviceId)) {
      this._device = null;
    }
  }

  // ─── GATT Characteristic Operations ──────────────────────────

  async getCharacteristic(serviceUuid, charUuid) {
    const key = `${serviceUuid}:${charUuid}`.toLowerCase();
    if (this._characteristics.has(key) && this._server && this._server.connected) {
      return this._characteristics.get(key);
    }

    if (!this._server || !this._server.connected) {
      if (this.isConnected && this._device && this._device.gatt) {
        debug.log('[BLE Debug] Establishing fresh GATT connection for service...');
        await new Promise(r => setTimeout(r, 100));
        this._server = await this._device.gatt.connect();
      } else {
        throw new Error('Not connected to any GATT server.');
      }
    }

    try {
      const service = await this._server.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(charUuid);
      this._characteristics.set(key, characteristic);
      return characteristic;
    } catch (err) {
      // If service or characteristic does not exist on this peripheral, do NOT reconnect GATT!
      const isNotFound = err.name === 'NotFoundError' || (err.message && (
        err.message.includes('not found') ||
        err.message.includes('No Services matching') ||
        err.message.includes('No Characteristics matching')
      ));
      if (isNotFound) {
        throw err;
      }

      // If device is already disconnected or disconnecting, abort cleanly
      if (!this.isConnected || !this._device?.gatt?.connected) {
        throw new Error('GATT Server disconnected.');
      }

      debug.log('[BLE Debug] Stale socket detected, re-establishing fresh channel...');
      await new Promise(r => setTimeout(r, 150));
      this._server = await this._device.gatt.connect();
      const service = await this._server.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(charUuid);
      this._characteristics.set(key, characteristic);
      return characteristic;
    }
  }

  /**
   * Writes byte array to characteristic using the characteristic's native supported mode.
   */
  async write(serviceUuid, charUuid, data) {
    const characteristic = await this.getCharacteristic(serviceUuid, charUuid);
    const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
    const props = characteristic.properties || {};

    // Check supported write modes from GATT descriptor properties
    if (props.writeWithoutResponse && characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(buffer);
      return;
    }

    if (props.write && characteristic.writeValueWithResponse) {
      await characteristic.writeValueWithResponse(buffer);
      return;
    }

    // Fallback if properties not populated
    if (characteristic.writeValueWithoutResponse) {
      try {
        await characteristic.writeValueWithoutResponse(buffer);
        return;
      } catch (e) {
        console.warn('[BLE] writeValueWithoutResponse failed, trying writeValue:', e);
      }
    }

    if (characteristic.writeValueWithResponse) {
      await characteristic.writeValueWithResponse(buffer);
      return;
    }

    if (characteristic.writeValue) {
      await characteristic.writeValue(buffer);
    }
  }

  // ─── Adaptive Protocol Synchronization Engine ─────────────────

  /**
   * Universal Clock Time Sync method supporting all Seiko clock series:
   *  - Multi-Sound Series (SS501, SS201)
   *  - Series C3 (DL308K)
   *  - Standard Digital SQ Series (SQ820, SQ821)
   *  - NexTime Hybrid Series (ZS450, ZS451, ZS250..256, QHB201)
   *  - Generic / Custom-named Seiko Bluetooth Clocks
   */
  async syncClockTime(device, targetDate = new Date()) {
    let bleDevice = this._device;

    if (!this.isConnected || this._device?.id !== device.id) {
      if (this._sessionDeviceCache.has(device.id)) {
        bleDevice = this._sessionDeviceCache.get(device.id);
        await this.connect(bleDevice);
      } else {
        bleDevice = await this.reconnectStoredDevice(device);
        await this.connect(bleDevice);
      }
    }

    const config = DeviceProtocol.getConfig(device.name);
    const candidates = DeviceProtocol.getCandidateProtocols(config.protocol);

    let lastError = null;

    for (const proto of candidates) {
      try {
        debug.log(`[BLE Sync] Attempting time sync via protocol: ${proto.name}...`);

        if (proto.payloadType === 'nexTime_8byte') {
          // NexTime LPWISE 8-byte write
          const payload = DeviceProtocol.buildNexTimePayload(targetDate);

          // Optional notify setup on RX characteristic
          try {
            const notifyChar = await this.getCharacteristic(proto.timeServiceUUID, proto.timeNotifyCharUUID);
            if (notifyChar?.startNotifications) {
              await notifyChar.startNotifications();
            }
          } catch (e) {
            debug.warn('[BLE Sync] NexTime notification subscribe skipped/unsupported:', e);
          }

          // Optional auth query packet
          try {
            const authPayload = DeviceProtocol.buildNexTimeAuth();
            await this.write(proto.timeServiceUUID, proto.timeWriteCharUUID, authPayload);
            await new Promise(r => setTimeout(r, 60));
          } catch (e) {
            debug.warn('[BLE Sync] Auth pre-packet skipped:', e);
          }

          // Write time packet
          await this.write(proto.timeServiceUUID, proto.timeWriteCharUUID, payload);
          await new Promise(r => setTimeout(r, 60));
          debug.log(`[BLE Sync] SUCCESS via ${proto.name}!`);

          // Background battery telemetry query only for battery-supported clock series
          if (config.series !== 'seriesC3' && config.series !== 'standardDigital') {
            if (this.isConnected && this._device?.gatt?.connected) {
              this.readBatteryLevel(device).catch(() => {});
            }
          }

          return { success: true, protocol: proto.id, series: proto.series, payload };
        } else {
          // Standard CTS 10-byte write
          const payload = DeviceProtocol.buildTimePayload(targetDate);
          await this.write(proto.timeServiceUUID, proto.timeWriteCharUUID, payload);
          await new Promise(r => setTimeout(r, 60));
          debug.log(`[BLE Sync] SUCCESS via ${proto.name}!`);

          // Background battery telemetry query only for battery-supported clock series
          if (config.series !== 'seriesC3' && config.series !== 'standardDigital') {
            if (this.isConnected && this._device?.gatt?.connected) {
              this.readBatteryLevel(device).catch(() => {});
            }
          }

          return { success: true, protocol: proto.id, series: proto.series, payload };
        }
      } catch (err) {
        debug.log(`[BLE Sync] Candidate ${proto.name} not available on peripheral (${err.message}). Trying next candidate...`);
        lastError = err;
      }
    }

    throw lastError || new Error(`No compatible Seiko time synchronization service found on "${device?.name || 'clock'}".`);
  }

  /**
   * Alias for syncClockTime
   */
  async syncTime(device, targetDate = new Date()) {
    return this.syncClockTime(device, targetDate);
  }

  /**
   * Safely reads battery level percentage from standard Bluetooth Battery Service (0x180F / 0x2A19).
   */
  async readBatteryLevel(device) {
    if (!device || !this.isConnected || !this._device?.gatt?.connected) return null;
    try {
      const char = await this.getCharacteristic('0000180f-0000-1000-8000-00805f9b34fb', '00002a19-0000-1000-8000-00805f9b34fb');
      if (char && char.readValue) {
        const val = await char.readValue();
        const bytes = new Uint8Array(val.buffer);
        if (bytes.length >= 1) {
          const levelStr = `${bytes[0]}%`;
          debug.log(`[BLE] Battery level read: ${levelStr}`);
          
          // Update active device store
          const currentActive = activeDeviceStore.get();
          if (currentActive && currentActive.id === device.id) {
            activeDeviceStore.set({ ...currentActive, batteryLevel: levelStr });
          }
          
          // Update paired devices store
          const paired = pairedDevicesStore.get() || [];
          const updated = paired.map(d => d.id === device.id ? { ...d, batteryLevel: levelStr } : d);
          pairedDevicesStore.set(updated);
          
          return levelStr;
        }
      }
    } catch (e) {
      // Expected for clocks without battery service
    }
    return null;
  }

  /**
   * Sends SS201 / SS501 control packet (Characteristic 0xFFE3, Service 0xFFE0)
   * Serializes GATT writes and coalesces rapid requests to protect BLE stack bandwidth.
   */
  async sendControlPayload(device, payload) {
    const config = DeviceProtocol.getConfig(device?.name || '');
    if (!config.controlWriteCharUUID) {
      return;
    }

    if (this._isControlWriting) {
      // Coalesce into next pending write
      this._pendingControlPayload = { device, payload };
      return;
    }

    this._isControlWriting = true;
    try {
      let bleDevice = this._device;
      if (!this.isConnected || this._device?.id !== device.id) {
        if (this._sessionDeviceCache.has(device.id)) {
          bleDevice = this._sessionDeviceCache.get(device.id);
          await this.connect(bleDevice);
        } else {
          bleDevice = await this.reconnectStoredDevice(device);
          await this.connect(bleDevice);
        }
      }

      await this.write(config.controlServiceUUID, config.controlWriteCharUUID, payload);
    } catch (err) {
      debug.warn('[BLE] sendControlPayload warning:', err);
    } finally {
      this._isControlWriting = false;
      if (this._pendingControlPayload) {
        const next = this._pendingControlPayload;
        this._pendingControlPayload = null;
        this.sendControlPayload(next.device, next.payload);
      }
    }
  }
}

export const bleService = new BluetoothService();
