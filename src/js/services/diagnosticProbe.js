/**
 * ═══════════════════════════════════════════════════════════════
 *  Bluetooth Hardware Diagnostic & GATT Inspector Engine
 *  Deep service enumeration, characteristic probing, & report generator
 * ═══════════════════════════════════════════════════════════════
 */

import { DeviceProtocol } from './protocol.js';
import { timeService } from './time.js';
import { PlatformService } from './platform.js';
import { syncLogStore, pairedDevicesStore, settingsStore } from '../store.js';

// Common Bluetooth SIG and Seiko GATT UUID dictionary
export const GATT_DICTIONARY = {
  // Services
  '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access (0x1800)',
  '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute (0x1801)',
  '00001805-0000-1000-8000-00805f9b34fb': 'Current Time Service (0x1805)',
  '00001806-0000-1000-8000-00805f9b34fb': 'Seiko Multi-Sound Time Service (0x1806)',
  '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information Service (0x180A)',
  '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service (0x180F)',
  '0000ffe0-0000-1000-8000-00805f9b34fb': 'Seiko Multi-Sound Control Service (0xFFE0)',
  '0000ffe1-0000-1000-8000-00805f9b34fb': 'Seiko Alternative Digital Service (0xFFE1)',
  '0000fff0-0000-1000-8000-00805f9b34fb': 'Seiko Series C3 & SQ Time Service (0xFFF0)',
  '00005301-0000-0041-4c50-574953450000': 'Seiko NexTime LPWISE Service (0x5301)',

  // Characteristics
  '00002a00-0000-1000-8000-00805f9b34fb': 'Device Name (0x2A00)',
  '00002a01-0000-1000-8000-00805f9b34fb': 'Appearance (0x2A01)',
  '00002a16-0000-1000-8000-00805f9b34fb': 'Seiko Time Sync Char (0x2A16)',
  '00002a19-0000-1000-8000-00805f9b34fb': 'Battery Level (0x2A19)',
  '00002a24-0000-1000-8000-00805f9b34fb': 'Model Number String (0x2A24)',
  '00002a25-0000-1000-8000-00805f9b34fb': 'Serial Number String (0x2A25)',
  '00002a26-0000-1000-8000-00805f9b34fb': 'Firmware Revision String (0x2A26)',
  '00002a27-0000-1000-8000-00805f9b34fb': 'Hardware Revision String (0x2A27)',
  '00002a28-0000-1000-8000-00805f9b34fb': 'Software Revision String (0x2A28)',
  '00002a29-0000-1000-8000-00805f9b34fb': 'Manufacturer Name String (0x2A29)',
  '00002a2b-0000-1000-8000-00805f9b34fb': 'Current Time (0x2A2B)',
  '0000ffe1-0000-1000-8000-00805f9b34fb': 'Seiko Multi-Sound Notification (0xFFE1)',
  '0000ffe3-0000-1000-8000-00805f9b34fb': 'Seiko Multi-Sound Control TX (0xFFE3)',
  '0000fff2-0000-1000-8000-00805f9b34fb': 'Seiko C3/SQ Time Write (0xFFF2)',
  '0000fff4-0000-1000-8000-00805f9b34fb': 'Seiko Alt Time Write (0xFFF4)',
  '00005302-0000-0041-4c50-574953450000': 'NexTime LPWISE TX Write (0x5302)',
  '00005303-0000-0041-4c50-574953450000': 'NexTime LPWISE RX Notify (0x5303)',
};

export class DiagnosticProbeService {
  static getServiceLabel(uuid) {
    const key = (uuid || '').toLowerCase();
    return GATT_DICTIONARY[key] || `Custom Service (${key.slice(0, 8)})`;
  }

  static getCharLabel(uuid) {
    const key = (uuid || '').toLowerCase();
    return GATT_DICTIONARY[key] || `Custom Characteristic (${key.slice(0, 8)})`;
  }

  /**
   * Performs an in-depth hardware inspection of a Bluetooth peripheral.
   * @param {BluetoothDevice} bluetoothDevice 
   * @param {Function} onProgress - Callback for scan status updates
   * @returns {Promise<Object>} Full diagnostic report object
   */
  static async runFullDiagnostic(bluetoothDevice, onProgress = () => {}) {
    if (!bluetoothDevice) {
      throw new Error('No Bluetooth device provided for diagnostic scan.');
    }

    const report = {
      timestamp: new Date().toISOString(),
      tokilinkVersion: '1.0.2',
      device: {
        id: bluetoothDevice.id,
        name: bluetoothDevice.name || 'Unknown / Unnamed Clock',
        detectedModel: DeviceProtocol.detectModel(bluetoothDevice.name),
        gattConnected: false,
      },
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ntpOffsetMs: timeService.offsetMs,
        isNtpSynced: timeService.isApiSynced,
        screen: `${window.screen.width}x${window.screen.height} (dpr ${window.devicePixelRatio})`,
      },
      services: [],
      probeResults: [],
      errors: [],
      syncLogSample: syncLogStore.get().slice(0, 10),
    };

    onProgress({ step: 1, text: `Connecting to ${bluetoothDevice.name || 'clock'}...` });

    let server = null;
    try {
      if (bluetoothDevice.gatt.connected) {
        server = bluetoothDevice.gatt;
      } else {
        server = await bluetoothDevice.gatt.connect();
      }
      report.device.gattConnected = true;
    } catch (err) {
      report.errors.push(`GATT connection failed: ${err.message}`);
      throw new Error(`Failed to connect to GATT server: ${err.message}`);
    }

    onProgress({ step: 2, text: 'Enumerating all primary GATT services...' });

    let primaryServices = [];
    try {
      if (server.getPrimaryServices) {
        primaryServices = await server.getPrimaryServices();
      }
    } catch (err) {
      report.errors.push(`getPrimaryServices failed: ${err.message}`);
    }

    // If getPrimaryServices didn't return (some browsers require specific UUIDs), try all known candidate services
    if (primaryServices.length === 0) {
      onProgress({ step: 2, text: 'Scanning candidate Seiko GATT services...' });
      for (const cand of DeviceProtocol.CANDIDATE_PROTOCOLS) {
        try {
          const s = await server.getPrimaryService(cand.timeServiceUUID);
          if (s && !primaryServices.some(existing => existing.uuid === s.uuid)) {
            primaryServices.push(s);
          }
        } catch (e) {}
      }
    }

    onProgress({ step: 3, text: `Found ${primaryServices.length} service(s). Enumerating characteristics...` });

    for (let i = 0; i < primaryServices.length; i++) {
      const service = primaryServices[i];
      const serviceEntry = {
        uuid: service.uuid,
        label: this.getServiceLabel(service.uuid),
        isPrimary: service.isPrimary,
        characteristics: [],
      };

      onProgress({ step: 3, text: `Inspecting service ${i + 1}/${primaryServices.length}: ${serviceEntry.label}...` });

      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          const props = char.properties || {};
          const propList = [];
          if (props.read) propList.push('read');
          if (props.write) propList.push('write');
          if (props.writeWithoutResponse) propList.push('writeWithoutResponse');
          if (props.notify) propList.push('notify');
          if (props.indicate) propList.push('indicate');

          const charEntry = {
            uuid: char.uuid,
            label: this.getCharLabel(char.uuid),
            properties: propList,
            readValueHex: null,
            readValueAscii: null,
          };

          // If characteristic is readable, read current value safely
          if (props.read && char.readValue) {
            try {
              const valDataView = await char.readValue();
              const bytes = new Uint8Array(valDataView.buffer);
              charEntry.readValueHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
              
              // Safe ASCII decoder
              let asciiStr = '';
              for (let b of bytes) {
                asciiStr += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
              }
              charEntry.readValueAscii = asciiStr;
            } catch (readErr) {
              charEntry.readError = readErr.message;
            }
          }

          serviceEntry.characteristics.push(charEntry);
        }
      } catch (charEnumErr) {
        serviceEntry.error = `Failed to get characteristics: ${charEnumErr.message}`;
      }

      report.services.push(serviceEntry);
    }

    onProgress({ step: 4, text: 'Running protocol write probes...' });

    // Test protocol probing capabilities
    for (const cand of DeviceProtocol.CANDIDATE_PROTOCOLS) {
      const probe = {
        protocolId: cand.id,
        name: cand.name,
        serviceUUID: cand.timeServiceUUID,
        charUUID: cand.timeWriteCharUUID,
        serviceFound: false,
        charFound: false,
        writable: false,
        probeError: null,
      };

      try {
        const s = await server.getPrimaryService(cand.timeServiceUUID);
        probe.serviceFound = true;
        const c = await s.getCharacteristic(cand.timeWriteCharUUID);
        probe.charFound = true;
        const props = c.properties || {};
        probe.writable = !!(props.write || props.writeWithoutResponse);
      } catch (err) {
        probe.probeError = err.message;
      }

      report.probeResults.push(probe);
    }

    onProgress({ step: 5, text: 'Diagnostic scan complete.' });

    return report;
  }

  /**
   * Generates a pre-filled mailto link for sending the diagnostic report.
   */
  static generateMailtoUrl(report) {
    const email = 'midnightlogicsoftware@protonmail.com';
    const deviceName = report.device?.name || 'Seiko Clock';
    const subject = encodeURIComponent(`TokiLink Diagnostic Report: ${deviceName}`);
    
    // Create a compact summary for the email body
    const bodyContent = `Hi TokiLink Team,

Here is my Seiko clock diagnostic report for device "${deviceName}":

Clock Name: ${report.device?.name}
Detected Model: ${report.device?.detectedModel?.type || 'Unknown'}
Platform: ${report.environment?.userAgent}
Discovered Services (${report.services?.length || 0}):
${(report.services || []).map(s => ` - ${s.label} (${s.uuid}) [${s.characteristics.length} chars]`).join('\n')}

Probe Matrix:
${(report.probeResults || []).map(p => ` - ${p.name}: Service=${p.serviceFound ? 'YES' : 'NO'}, Char=${p.charFound ? 'YES' : 'NO'}, Writable=${p.writable ? 'YES' : 'NO'}`).join('\n')}

---
FULL JSON REPORT:
${JSON.stringify(report, null, 2)}
`;

    return `mailto:${email}?subject=${subject}&body=${encodeURIComponent(bodyContent.slice(0, 1800))}`;
  }

  /**
   * Triggers a browser download of the diagnostic report as a JSON file.
   */
  static downloadReportJson(report) {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (report.device?.name || 'seiko_clock').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.href = url;
    a.download = `tokilink-diagnostic-${safeName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
