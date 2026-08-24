/**
 * ═══════════════════════════════════════════════════════════════
 *  PWA Version & Service Worker Update Manager
 *  Detects new releases, manages foreground polling, and triggers
 *  seamless client updates.
 * ═══════════════════════════════════════════════════════════════
 */

export class PwaUpdateService {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.onUpdateCallback = null;
    this._refreshing = false;
  }

  async init(onUpdateAvailable) {
    this.onUpdateCallback = onUpdateAvailable;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      this.registration = await navigator.serviceWorker.ready;
      this._listenForUpdates(this.registration);

      // Check for updates on foreground wakeup
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdate(true);
        }
      });

      // Periodic check every 60 minutes
      setInterval(() => {
        this.checkForUpdate(true);
      }, 60 * 60 * 1000);

    } catch (err) {
      console.warn('[PWA Update] Service worker ready listener warning:', err);
    }
  }

  _listenForUpdates(reg) {
    if (!reg) return;

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWA Update] New version detected & installed in background.');
          this.updateAvailable = true;
          if (this.onUpdateCallback) this.onUpdateCallback(reg);
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!this._refreshing) {
        this._refreshing = true;
        window.location.reload();
      }
    });
  }

  async checkForUpdate(silent = false) {
    if (!('serviceWorker' in navigator)) return { status: 'unsupported' };

    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.getRegistration();
      }
      if (!this.registration) return { status: 'no_sw' };

      await this.registration.update();

      if (this.registration.waiting) {
        this.updateAvailable = true;
        if (this.onUpdateCallback) this.onUpdateCallback(this.registration);
        return { status: 'update_available' };
      }
      return { status: 'up_to_date' };
    } catch (err) {
      if (!silent) console.warn('[PWA Update] Check for updates failed:', err);
      return { status: 'error', error: err.message };
    }
  }

  applyUpdate() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }
}

export const pwaUpdateService = new PwaUpdateService();
