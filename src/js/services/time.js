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
   * Performs multi-sample stratum-1 atomic time query with minimum-RTT selection
   */
  async fetchApiTime() {
    const candidateEndpoints = [
      {
        name: 'Cloudflare Trace NTP',
        url: 'https://cloudflare.com/cdn-cgi/trace',
        isText: true,
        parser: (text) => {
          const match = (text || '').match(/ts=([\d.]+)/);
          return match ? parseFloat(match[1]) * 1000 : null;
        }
      },
      {
        name: 'TimeAPI UTC',
        url: 'https://timeapi.io/api/time/current/zone?timeZone=UTC',
        isText: false,
        parser: (data) => {
          if (data && data.dateTime) {
            const iso = data.dateTime.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(data.dateTime)
              ? data.dateTime
              : data.dateTime + 'Z';
            return new Date(iso).getTime();
          }
          return null;
        }
      }
    ];

    const samples = [];

    // 1. Try high-precision sub-second NTP endpoints (multi-sample)
    for (const endpoint of candidateEndpoints) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const t0 = performance.now();
          const clientSendTime = Date.now();
          const res = await fetch(endpoint.url, {
            cache: 'no-store',
            signal: AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined
          });
          const t1 = performance.now();
          const clientRecvTime = Date.now();

          if (!res.ok) continue;
          let serverTimeMs = null;
          if (endpoint.isText) {
            const text = await res.text();
            serverTimeMs = endpoint.parser(text);
          } else {
            const data = await res.json();
            serverTimeMs = endpoint.parser(data);
          }

          if (serverTimeMs && !isNaN(serverTimeMs)) {
            const rtt = t1 - t0;
            // Standard NTP offset formula: serverTime + (rtt / 2) - clientRecvTime
            const offset = (serverTimeMs + (rtt / 2)) - clientRecvTime;

            if (Math.abs(offset) < 15 * 60 * 1000) {
              samples.push({ rtt, offset, source: endpoint.name });
            }
          }
        } catch (e) {
          // ignore sample error
        }
      }
      if (samples.length >= 2) break; // We have enough clean samples
    }

    if (samples.length > 0) {
      // Pick the sample with the absolute MINIMUM RTT (least network jitter / latency distortion)
      samples.sort((a, b) => a.rtt - b.rtt);
      const best = samples[0];

      this._offsetMs = best.offset;
      this._isApiSynced = true;
      this._lastSyncTimestamp = Date.now();
      this._notify();

      if (isDebug()) {
        console.log(`[TimeService] NTP Synced. Offset: ${this._offsetMs.toFixed(1)}ms, min RTT: ${best.rtt.toFixed(1)}ms (${best.source})`);
      }
      return true;
    }

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
