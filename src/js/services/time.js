/**
 * ═══════════════════════════════════════════════════════════════
 *  High-Precision Time Synchronization Service
 *  NTP Network Latency (RTT) Compensation & Fallback Engine
 * ═══════════════════════════════════════════════════════════════
 */

import { settingsStore } from '../store.js';

function isDebug() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return !!(settingsStore?.get()?.debug || urlParams.get('debug') === 'true');
  } catch (e) {
    return false;
  }
}

export class TimeService {
  constructor() {
    this._offsetMs = 0;
    this._isApiSynced = false;
    this._lastSyncTimestamp = 0;
    this._listeners = new Set();
  }

  get isApiSynced() {
    return this._isApiSynced;
  }

  get offsetMs() {
    return this._offsetMs;
  }

  onSyncChange(cb) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  _notify() {
    this._listeners.forEach(cb => cb({ isApiSynced: this._isApiSynced, offsetMs: this._offsetMs }));
  }

  async fetchApiTime() {
    const endpoints = [
      'https://timeapi.io/api/time/current/zone?timeZone=UTC'
    ];

    for (const url of endpoints) {
      try {
        const t0 = performance.now();
        const res = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout ? AbortSignal.timeout(3500) : undefined
        });
        const t1 = performance.now();

        if (!res.ok) continue;
        const data = await res.json();
        const rtt = (t1 - t0) / 2;

        let serverTimeMs;
        if (typeof data.unixtime === 'number') {
          serverTimeMs = data.unixtime * 1000;
        } else if (typeof data.epochSeconds === 'number') {
          serverTimeMs = data.epochSeconds * 1000;
        } else if (data.utc_datetime) {
          serverTimeMs = new Date(data.utc_datetime).getTime();
        } else if (data.dateTime) {
          const isoUtc = data.dateTime.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(data.dateTime)
            ? data.dateTime
            : data.dateTime + 'Z';
          serverTimeMs = new Date(isoUtc).getTime();
        } else if (res.headers.get('date')) {
          serverTimeMs = new Date(res.headers.get('date')).getTime();
        }

        if (serverTimeMs && !isNaN(serverTimeMs)) {
          const estimatedServerNow = serverTimeMs + rtt;
          const calculatedOffset = estimatedServerNow - Date.now();

          // Sanity check: If offset exceeds +/- 15 minutes, reject anomalous parse
          if (Math.abs(calculatedOffset) > 15 * 60 * 1000) {
            console.warn(`[TimeService] Rejecting anomalous offset (${calculatedOffset}ms) from ${url}`);
            continue;
          }

          this._offsetMs = calculatedOffset;
          this._isApiSynced = true;
          this._lastSyncTimestamp = Date.now();
          this._notify();
          if (isDebug()) {
            console.log(`[TimeService] NTP Synced via ${new URL(url).hostname}. Offset: ${this._offsetMs.toFixed(1)}ms, RTT: ${(rtt * 2).toFixed(1)}ms`);
          }
          return true;
        }
      } catch (err) {
        // Silently try next endpoint
      }
    }

    // Tertiary fallback: HTTP Date header from current origin / CDN edge
    try {
      const t0 = performance.now();
      const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
      const t1 = performance.now();
      const dateHeader = res.headers.get('date');
      if (dateHeader) {
        const serverTimeMs = new Date(dateHeader).getTime();
        const rtt = (t1 - t0) / 2;
        if (!isNaN(serverTimeMs)) {
          this._offsetMs = (serverTimeMs + rtt) - Date.now();
          this._isApiSynced = true;
          this._lastSyncTimestamp = Date.now();
          this._notify();
          if (isDebug()) {
            console.log(`[TimeService] NTP Synced via Edge Date Header. Offset: ${this._offsetMs.toFixed(1)}ms`);
          }
          return true;
        }
      }
    } catch (e) { }

    if (isDebug()) {
      console.warn('[TimeService] All online NTP sources unavailable, falling back to local clock.');
    }
    this._isApiSynced = false;
    this._notify();
    return false;
  }

  now() {
    if (this._isApiSynced) {
      return new Date(Date.now() + this._offsetMs);
    }
    return new Date();
  }

  /**
   * Schedules execution aligned to upcoming second turn with 40ms lead-time compensation
   */
  async waitNextSecondBoundary(leadTimeMs = 40) {
    const currentNow = this.now();
    const currentMs = currentNow.getMilliseconds();
    const waitTime = (1000 - currentMs - leadTimeMs + 1000) % 1000;
    if (waitTime > 10) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    return this.now();
  }
}

export const timeService = new TimeService();
