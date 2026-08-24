/**
 * ═══════════════════════════════════════════════════════════════
 *  Clock View Component
 *  Renders live atomic clock, synchronisation badge,
 *  interactive World Timezone slider & custom time overrides
 * ═══════════════════════════════════════════════════════════════
 */

import { timeService } from '../services/time.js';
import { TIMEZONE_CITIES, getLocalTimezoneIndex, getTimeInTimezone } from '../services/timezones.js';
import { settingsStore, connectionStateStore, connectionStatusTextStore } from '../store.js';
import { i18n } from '../i18n.js';
import { PlasmaRenderer } from './plasmaEffect.js';

export class ClockView {
  constructor(dom) {
    this.dom = dom;
    this._interval = null;
    this.localTzIdx = getLocalTimezoneIndex();
    
    const settings = settingsStore.get();
    this.selectedTzIdx = settings.selectedTzIdx !== null && settings.selectedTzIdx !== undefined 
      ? Number(settings.selectedTzIdx) 
      : this.localTzIdx;
    this.manualMode = settings.manualMode || 'timezone';

    const canvasEl = this.dom.plasmaCanvas || document.getElementById('plasmaCanvas');
    this.plasmaRenderer = canvasEl ? new PlasmaRenderer(canvasEl) : null;

    this.init();
  }

  init() {
    i18n.onLocaleChange(() => {
      this.updateClock();
      this.updateBadge();
      this.updateSyncButtonState(connectionStateStore.get());
      this.updateTimezoneUI();
    });

    this.startClock();
    this.initTimezoneControls();
    this.initExactTimeControls();

    settingsStore.subscribe(settings => {
      if (this.dom.directManualTimeToggle) {
        this.dom.directManualTimeToggle.checked = !!settings.manualTime;
      }
      if (settings.manualTime) {
        this.dom.manualTimeSection?.classList.remove('hidden');
        if (!this.dom.manualTimeInput?.value) {
          this.dom.manualTimeInput.value = this.formatDatetimeLocal(timeService.now());
        }
      } else {
        this.dom.manualTimeSection?.classList.add('hidden');
      }
      this.updateBadge();
    });

    this.dom.directManualTimeToggle?.addEventListener('change', (e) => {
      const current = settingsStore.get();
      settingsStore.set({ ...current, manualTime: e.target.checked });
    });

    timeService.onSyncChange(() => {
      this.updateBadge();
    });

    connectionStateStore.subscribe(state => {
      this.updateSyncButtonState(state);
    });

    connectionStatusTextStore.subscribe(text => {
      if (this.dom.syncStatus) {
        this.dom.syncStatus.textContent = text;
      }
    });

    this.updateTimezoneUI();
  }

  initTimezoneControls() {
    // Mode Switcher Buttons
    this.dom.modeTzBtn?.addEventListener('click', () => {
      this.setManualMode('timezone');
    });

    this.dom.modeExactBtn?.addEventListener('click', () => {
      this.setManualMode('exact');
    });

    // Timezone Slider
    if (this.dom.tzSlider) {
      this.dom.tzSlider.max = String(TIMEZONE_CITIES.length - 1);
      this.dom.tzSlider.value = String(this.selectedTzIdx);

      const onSliderMove = (e) => {
        this.selectedTzIdx = parseInt(e.target.value, 10);
        this.saveTzSetting();
        this.updateTimezoneUI();
        this.updateClock();
        this.updateBadge();
      };

      this.dom.tzSlider.addEventListener('input', onSliderMove);
      this.dom.tzSlider.addEventListener('change', onSliderMove);
    }

    // Step Buttons
    this.dom.tzStepDownBtn?.addEventListener('click', () => {
      if (this.selectedTzIdx > 0) {
        this.selectedTzIdx--;
        if (this.dom.tzSlider) this.dom.tzSlider.value = String(this.selectedTzIdx);
        this.saveTzSetting();
        this.updateTimezoneUI();
        this.updateClock();
        this.updateBadge();
      }
    });

    this.dom.tzStepUpBtn?.addEventListener('click', () => {
      if (this.selectedTzIdx < TIMEZONE_CITIES.length - 1) {
        this.selectedTzIdx++;
        if (this.dom.tzSlider) this.dom.tzSlider.value = String(this.selectedTzIdx);
        this.saveTzSetting();
        this.updateTimezoneUI();
        this.updateClock();
        this.updateBadge();
      }
    });

    // Reset to Home Timezone Button
    this.dom.tzResetHomeBtn?.addEventListener('click', () => {
      this.selectedTzIdx = this.localTzIdx;
      if (this.dom.tzSlider) this.dom.tzSlider.value = String(this.selectedTzIdx);
      this.saveTzSetting();
      this.updateTimezoneUI();
      this.updateClock();
      this.updateBadge();
    });

    // Setup home indicator label and dynamic track gradient
    if (this.dom.tzHomeLabel) {
      const localItem = TIMEZONE_CITIES[this.localTzIdx];
      const offsetFormatted = this.formatOffsetHours(localItem.offset);
      this.dom.tzHomeLabel.textContent = `Home (${offsetFormatted})`;
    }

    if (this.dom.tzSlider) {
      const localItem = TIMEZONE_CITIES[this.localTzIdx];
      const h = localItem ? localItem.offset : 0;
      const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
      const pMinus1 = clamp(((h - 1 + 12) / 26) * 100, 0, 100).toFixed(1);
      const pHome = clamp(((h + 12) / 26) * 100, 0, 100).toFixed(1);
      const pPlus1 = clamp(((h + 1 + 12) / 26) * 100, 0, 100).toFixed(1);
      this.dom.tzSlider.style.background = `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${pMinus1}%, #22c55e ${pHome}%, #38bdf8 ${pPlus1}%, #38bdf8 100%)`;
    }
  }

  initExactTimeControls() {
    this.dom.manualTimeNowBtn?.addEventListener('click', () => {
      this.dom.manualTimeInput.value = this.formatDatetimeLocal(timeService.now());
      this.updateBadge();
    });

    this.dom.manualTimeInput?.addEventListener('change', () => {
      this.updateBadge();
    });
  }

  setManualMode(mode) {
    this.manualMode = mode;
    const current = settingsStore.get();
    settingsStore.set({ ...current, manualMode: mode });

    if (mode === 'timezone') {
      this.dom.modeTzBtn?.classList.add('active');
      this.dom.modeExactBtn?.classList.remove('active');
      this.dom.tzModeView?.classList.remove('hidden');
      this.dom.exactModeView?.classList.add('hidden');
    } else {
      this.dom.modeTzBtn?.classList.remove('active');
      this.dom.modeExactBtn?.classList.add('active');
      this.dom.tzModeView?.classList.add('hidden');
      this.dom.exactModeView?.classList.remove('hidden');
    }
    this.updateClock();
    this.updateBadge();
  }

  saveTzSetting() {
    const current = settingsStore.get();
    settingsStore.set({ ...current, selectedTzIdx: this.selectedTzIdx });
  }

  formatOffsetHours(offset) {
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const h = Math.floor(abs);
    const m = Math.round((abs - h) * 60);
    return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  updateTimezoneUI() {
    const currentCity = TIMEZONE_CITIES[this.selectedTzIdx] || TIMEZONE_CITIES[this.localTzIdx];
    const localCity = TIMEZONE_CITIES[this.localTzIdx];

    if (this.dom.tzCityName) {
      this.dom.tzCityName.textContent = currentCity.city;
    }

    if (this.dom.tzOffsetPill) {
      this.dom.tzOffsetPill.textContent = `${currentCity.region}`;
    }

    if (this.dom.tzDeltaBadge) {
      const diffHours = currentCity.offset - localCity.offset;
      if (diffHours === 0) {
        this.dom.tzDeltaBadge.textContent = i18n.t('manual.homeTime') || 'Home Time';
        this.dom.tzDeltaBadge.className = 'tz-delta-badge home';
      } else {
        const sign = diffHours > 0 ? '+' : '';
        const formattedDiff = diffHours % 1 === 0 ? diffHours : diffHours.toFixed(1);
        this.dom.tzDeltaBadge.textContent = `${sign}${formattedDiff}h vs Home`;
        this.dom.tzDeltaBadge.className = 'tz-delta-badge different';
      }
    }
  }

  startClock() {
    if (this._interval) clearInterval(this._interval);
    this.updateClock();
    this._interval = setInterval(() => this.updateClock(), 1000);
  }

  getEffectiveTime() {
    const settings = settingsStore.get();
    if (settings.manualTime) {
      if (this.manualMode === 'exact' && this.dom.manualTimeInput?.value) {
        return new Date(this.dom.manualTimeInput.value);
      }
      if (this.manualMode === 'timezone') {
        const targetTz = TIMEZONE_CITIES[this.selectedTzIdx] || TIMEZONE_CITIES[this.localTzIdx];
        return getTimeInTimezone(timeService.now(), targetTz.offset);
      }
    }
    return timeService.now();
  }

  /**
   * Calculates the target Date for zero-idle immediate BLE synchronization
   */
  getImmediateSyncTarget() {
    const settings = settingsStore.get();
    if (settings.manualTime && this.manualMode === 'exact') {
      if (this.dom.manualTimeInput?.value) {
        return new Date(this.dom.manualTimeInput.value);
      }
      return new Date();
    }

    // Atomic time rounding to active second
    const now = timeService.now();
    const ms = now.getMilliseconds();
    const roundedTime = new Date(now.getTime() + (ms >= 500 ? (1000 - ms) : -ms));

    if (settings.manualTime && this.manualMode === 'timezone') {
      const targetTz = TIMEZONE_CITIES[this.selectedTzIdx] || TIMEZONE_CITIES[this.localTzIdx];
      return getTimeInTimezone(roundedTime, targetTz.offset);
    }

    return roundedTime;
  }

  updateClock() {
    const now = this.getEffectiveTime();
    const settings = settingsStore.get();
    const is24h = settings.use24h;

    // Time
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    let ampm = '';

    if (!is24h) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }
    const hoursStr = is24h ? String(hours).padStart(2, '0') : String(hours);

    if (this.dom.clockTime) {
      this.dom.clockTime.innerHTML = `${hoursStr}:${minutes}<span class="seconds">${seconds}</span>${ampm ? `<span class="clock-ampm">${ampm}</span>` : ''}`;
    }

    // Date
    if (this.dom.clockDate) {
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      this.dom.clockDate.textContent = now.toLocaleDateString(i18n.locale, options);
    }

    // Timezone sub-label
    if (this.dom.clockTimezone) {
      if (settings.manualTime && this.manualMode === 'timezone') {
        const targetTz = TIMEZONE_CITIES[this.selectedTzIdx] || TIMEZONE_CITIES[this.localTzIdx];
        this.dom.clockTimezone.textContent = `🌍 ${this.formatOffsetHours(targetTz.offset)}`;
      } else if (settings.manualTime && this.manualMode === 'exact') {
        this.dom.clockTimezone.textContent = `📌 Fixed Timestamp`;
      } else {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          this.dom.clockTimezone.textContent = tz;
        } catch (e) {
          this.dom.clockTimezone.textContent = '';
        }
      }
    }
  }

  updateBadge() {
    const settings = settingsStore.get();
    const badge = this.dom.clockSourceBadge;
    const textEl = this.dom.clockSourceText;
    if (!badge || !textEl) return;

    badge.classList.remove('source-api', 'source-local', 'source-manual');

    if (settings.manualTime) {
      badge.classList.add('source-manual');
      if (this.manualMode === 'timezone') {
        const targetTz = TIMEZONE_CITIES[this.selectedTzIdx] || TIMEZONE_CITIES[this.localTzIdx];
        textEl.textContent = `World Time (${this.formatOffsetHours(targetTz.offset)})`;
      } else {
        textEl.textContent = i18n.t('clock.sourceManual');
      }
    } else if (settings.useApi && timeService.isApiSynced) {
      badge.classList.add('source-api');
      textEl.textContent = i18n.t('clock.sourceApi');
    } else {
      badge.classList.add('source-local');
      textEl.textContent = i18n.t('clock.sourceLocal');
    }
  }

  updateSyncButtonState(state) {
    const btn = this.dom.syncBtn;
    const label = this.dom.syncBtnLabel;
    const iconWrap = document.getElementById('syncIconWrap');
    if (!btn || !label) return;

    btn.className = 'sync-btn';
    btn.disabled = false;

    if (this.plasmaRenderer) {
      this.plasmaRenderer.setState(state === 'disconnected' ? 'ready' : state);
    }

    switch (state) {
      case 'searching':
        btn.classList.add('syncing');
        label.textContent = i18n.t('sync.btn.searching') || 'Searching';
        btn.disabled = true;
        if (iconWrap) iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
        break;
      case 'connecting':
        btn.classList.add('connecting');
        label.textContent = i18n.t('sync.btn.connecting');
        btn.disabled = true;
        if (iconWrap) iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
        break;
      case 'syncing':
        btn.classList.add('syncing');
        label.textContent = i18n.t('sync.btn.syncing');
        btn.disabled = true;
        if (iconWrap) iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
        break;
      case 'connected':
        btn.classList.add('connected');
        label.textContent = i18n.t('sync.btn.done');
        // Pure checkmark tick without outer circle
        if (iconWrap) iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        break;
      case 'error':
        btn.classList.add('error');
        label.textContent = i18n.t('sync.btn.failed');
        // Pure X cross without outer circle
        if (iconWrap) iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        break;
      case 'disconnected':
      default:
        label.textContent = i18n.t('sync.btn.sync');
        if (iconWrap) iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7 7 10 10-5 5V2l5 5L7 17"/></svg>';
        break;
    }
  }

  formatDatetimeLocal(date) {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
  }
}
