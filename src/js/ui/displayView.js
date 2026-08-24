/**
 * ═══════════════════════════════════════════════════════════════
 *  Display & Audio View Component
 *  Brightness, bass boost, auto power off, and sleep timers
 * ═══════════════════════════════════════════════════════════════
 */

import { displayStore, activeDeviceStore } from '../store.js';
import { bleService } from '../services/bluetooth.js';
import { DeviceProtocol } from '../services/protocol.js';
import { i18n } from '../i18n.js';

export class DisplayView {
  constructor(dom, renderIcons) {
    this.dom = dom;
    this.renderIcons = renderIcons;
    this.init();
  }

  init() {
    i18n.onLocaleChange(() => {
      this.renderDisplay(displayStore.get());
    });

    displayStore.subscribe(state => {
      this.renderDisplay(state);
    });

    // Brightness Segmented Buttons
    this.dom.brightnessBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        const level = Number(btn.dataset.brightness);
        this.setBrightness(level);
      });
    });

    // Bass Boost Segmented Buttons
    this.dom.bassBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        const bass = Number(btn.dataset.bass);
        this.setBass(bass);
      });
    });

    // Auto Power Off Select
    this.dom.autoPowerOffSelect?.addEventListener('change', (e) => {
      const mins = Number(e.target.value) || 0;
      this.setAutoPowerOff(mins);
    });
  }

  async sendToBle(payload) {
    const activeDevice = activeDeviceStore.get();
    if (!activeDevice) return;
    try {
      await bleService.sendControlPayload(activeDevice, payload);
    } catch (err) {
      console.warn('[DisplayView] Error sending display command:', err);
    }
  }

  setBrightness(level) {
    const state = displayStore.get();
    displayStore.set({ ...state, brightness: level });
    const payload = DeviceProtocol.buildSS201Brightness(level);
    this.sendToBle(payload);
  }

  setBass(bass) {
    const state = displayStore.get();
    displayStore.set({ ...state, bass });
    const payload = DeviceProtocol.buildSS201Bass(bass);
    this.sendToBle(payload);
  }

  setAutoPowerOff(mins) {
    const state = displayStore.get();
    displayStore.set({ ...state, autoPowerOff: mins });
    const payload = DeviceProtocol.buildSS201AutoPowerOff(mins);
    this.sendToBle(payload);
  }

  renderDisplay(state) {
    // Brightness
    this.dom.brightnessBtns?.forEach(btn => {
      const level = Number(btn.dataset.brightness);
      btn.classList.toggle('active', level === state.brightness);
    });
    if (this.dom.brightnessVal) {
      this.dom.brightnessVal.textContent = `Level ${state.brightness}`;
    }

    // Bass
    this.dom.bassBtns?.forEach(btn => {
      const bass = Number(btn.dataset.bass);
      btn.classList.toggle('active', bass === state.bass);
    });
    if (this.dom.bassVal) {
      this.dom.bassVal.textContent = state.bass === 0 ? (i18n.t('ss201.display.off') || 'OFF') : `+${state.bass}`;
    }

    // Auto Power Off
    if (this.dom.autoPowerOffSelect) {
      this.dom.autoPowerOffSelect.value = state.autoPowerOff;
    }
  }
}
