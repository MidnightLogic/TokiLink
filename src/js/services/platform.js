/**
 * ═══════════════════════════════════════════════════════════════
 *  Platform & Bluetooth Diagnostic Service
 *  Unified, decoupled browser & Web Bluetooth capability detector
 * ═══════════════════════════════════════════════════════════════
 */

export class PlatformService {
  /**
   * Performs an asynchronous, comprehensive browser & Bluetooth check.
   * Handles Brave flags, Chrome/Edge site permission blocks, iOS Safari sandbox,
   * Bluefy native Web Bluetooth, and unsupported desktop/mobile browsers.
   *
   * @returns {Promise<{
   *   os: { isIOS: boolean, isAndroid: boolean, isMac: boolean, isWindows: boolean, isLinux: boolean },
   *   browser: { isBrave: boolean, isBluefy: boolean, isSafari: boolean, isChrome: boolean, isEdge: boolean, isOpera: boolean, isFirefox: boolean },
   *   bluetooth: { hasApi: boolean, isAvailable: boolean, isPermissionDenied: boolean, isSupported: boolean },
   *   diagnostic: 'supported' | 'brave_blocked' | 'ios_safari' | 'permission_blocked' | 'unsupported'
   * }>}
   */
  static async getDiagnostics() {
    const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
    const platform = typeof navigator !== 'undefined' ? (navigator.platform || '') : '';

    const isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(platform) && !isIOS;
    const isWindows = /Win32|Win64|Windows|WinCE/.test(platform);
    const isLinux = /Linux/.test(platform) && !isAndroid;

    // Detect Brave (async API check + fallback)
    let isBrave = false;
    try {
      if (typeof navigator.brave?.isBrave === 'function') {
        isBrave = await navigator.brave.isBrave();
      }
    } catch (e) {
      // Ignore
    }
    if (!isBrave && /Brave/i.test(ua)) {
      isBrave = true;
    }

    // Detect Bluefy (iOS custom Web Bluetooth browser)
    const isBluefy = typeof navigator.bluetooth !== 'undefined' && (/Bluefy/i.test(ua) || typeof window.bluefy !== 'undefined');

    // Other browsers
    const isFirefox = /Firefox|FxiOS/i.test(ua);
    const isEdge = /Edg\//i.test(ua);
    const isOpera = /OPR\//i.test(ua) || /Opera/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Brave/i.test(ua) && !isBluefy;
    const isChrome = (/Chrome|CriOS/i.test(ua) || /Chromium/i.test(ua)) && !isEdge && !isOpera && !isBrave && !isBluefy;

    // Check Web Bluetooth API existence
    const hasBluetoothApi = typeof navigator !== 'undefined' && !!navigator.bluetooth;

    // Check adapter availability via navigator.bluetooth.getAvailability()
    let isAvailable = false;
    if (hasBluetoothApi) {
      if (typeof navigator.bluetooth.getAvailability === 'function') {
        try {
          isAvailable = await navigator.bluetooth.getAvailability();
        } catch (e) {
          isAvailable = true; // fallback if throws
        }
      } else {
        isAvailable = true; // getAvailability() not implemented, assume available if API exists
      }
    }

    // Check browser site permission state (Chrome / Edge / Opera)
    let isPermissionDenied = false;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const permStatus = await navigator.permissions.query({ name: 'bluetooth' });
        if (permStatus.state === 'denied') {
          isPermissionDenied = true;
        }
      } catch (e) {
        // Querying 'bluetooth' is not standard on all browsers, safe to ignore
      }
    }

    // Determine final diagnostic outcome
    let diagnostic = 'supported';

    if (isIOS && !isBluefy && (!hasBluetoothApi || isSafari)) {
      diagnostic = 'ios_safari';
    } else if (isBrave && (!hasBluetoothApi || !isAvailable || isPermissionDenied)) {
      diagnostic = 'brave_blocked';
    } else if (isPermissionDenied) {
      diagnostic = 'permission_blocked';
    } else if (!hasBluetoothApi || (!isAvailable && !isIOS)) {
      // In Brave or desktop browsers where Bluetooth is disabled/blocked
      if (isBrave) {
        diagnostic = 'brave_blocked';
      } else {
        diagnostic = hasBluetoothApi ? 'permission_blocked' : 'unsupported';
      }
    }

    // If in Bluefy, Web Bluetooth is always supported
    if (isBluefy) {
      diagnostic = 'supported';
    }

    return {
      os: { isIOS, isAndroid, isMac, isWindows, isLinux },
      browser: { isBrave, isBluefy, isSafari, isChrome, isEdge, isOpera, isFirefox },
      bluetooth: {
        hasApi: hasBluetoothApi,
        isAvailable,
        isPermissionDenied,
        isSupported: diagnostic === 'supported'
      },
      diagnostic
    };
  }
}
