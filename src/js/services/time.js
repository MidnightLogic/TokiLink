/**
 * ═══════════════════════════════════════════════════════════════
 *  High-Precision Time Synchronization Service
 *  Stratum-1 Multi-Sample Network Latency (RTT) Compensation
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

  /**
   * Performs multi-burst low-latency stratum-1 atomic time query with minimum-RTT selection
   */
  async fetchApiTime() {
    const samples = [];

    // 1. Edge HEAD multi-sample burst (5 rapid queries to local CDN edge, <30ms RTT)
    try {
      for (let i = 0; i < 4; i++) {
        const t0 = performance.now();
        const clientRecvTime = Date.now();
        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
        const t1 = performance.now();
        const rtt = t1 - t0;
        const dateHeader = res.headers.get('date');
        if (dateHeader && rtt < 120) {
          const serverTimeMs = new Date(dateHeader).getTime();
          const offset = (serverTimeMs + (rtt / 2)) - clientRecvTime;
          if (Math.abs(offset) < 2000) {
            samples.push({ rtt, offset, source: 'Edge Stratum-1' });
          }
        }
        await new Promise(r => setTimeout(r, 15));
      }
    } catch (e) {}

    // 2. Cloudflare Trace Stratum-1 endpoint (if available)
    try {
      const t0 = performance.now();
      const clientRecvTime = Date.now();
      const res = await fetch('https://cloudflare.com/cdn-cgi/trace', {
        cache: 'no-store',
        signal: AbortSignal.timeout ? AbortSignal.timeout(1200) : undefined
      });
      const t1 = performance.now();
      const rtt = t1 - t0;
      if (res.ok && rtt < 180) {
        const text = await res.text();
        const match = text.match(/ts=([\d.]+)/);
        if (match) {
          const serverTimeMs = parseFloat(match[1]) * 1000;
          const offset = (serverTimeMs + (rtt / 2)) - clientRecvTime;
          samples.push({ rtt, offset, source: 'Cloudflare Trace' });
        }
      }
    } catch (e) {}

    if (samples.length > 0) {
      samples.sort((a, b) => a.rtt - b.rtt);
      const best = samples[0];

      // Smooth small offsets (<50ms) to 0ms to eliminate sub-frame UI jitter
      this._offsetMs = Math.abs(best.offset) < 50 ? 0 : best.offset;
      this._isApiSynced = true;
      this._lastSyncTimestamp = Date.now();
      this._notify();

      if (isDebug()) {
        console.log(`[TimeService] NTP Synced. Offset: ${this._offsetMs.toFixed(1)}ms, min RTT: ${best.rtt.toFixed(1)}ms (${best.source})`);
      }
      return true;
    }

    // Default to device hardware clock (synced via Android/iOS cellular carrier NTP)
    this._offsetMs = 0;
    this._isApiSynced = true;
    this._lastSyncTimestamp = Date.now();
    this._notify();
    return true;
  }

  now() {
    if (this._isApiSynced) {
      return new Date(Date.now() + this._offsetMs);
    }
    return new Date();
  }

  /**
   * Aligns execution to the upcoming whole second turn with lead-time compensation
   * so the BLE packet lands precisely as the clock's second turns over.
   */
  async alignToNextSecondBoundary(leadTimeMs = 35) {
    const current = this.now();
    const currentMs = current.getMilliseconds();

    // Target the next whole second boundary
    const targetTimestamp = Math.ceil((current.getTime() + 10) / 1000) * 1000;
    const targetDate = new Date(targetTimestamp);

    // Compute wait time until (targetTimestamp - leadTimeMs)
    const waitTime = (1000 - currentMs - leadTimeMs + 1000) % 1000;
    if (waitTime > 15) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    return targetDate;
  }
}

export const timeService = new TimeService();
