/**
 * ═══════════════════════════════════════════════════════════════
 *  Radio View Component
 *  Digital FM tuner, continuous seek, preset station manager
 * ═══════════════════════════════════════════════════════════════
 */

import { radioStore, activeDeviceStore } from '../store.js';
import { bleService } from '../services/bluetooth.js';
import { DeviceProtocol } from '../services/protocol.js';
import { i18n } from '../i18n.js';

export class RadioView {
  constructor(dom, renderIcons) {
    this.dom = dom;
    this.renderIcons = renderIcons;
    this.currentEditingPresetIdx = 0;
    this.init();
  }

  init() {
    i18n.onLocaleChange(() => {
      this.renderRadio(radioStore.get());
    });

    radioStore.subscribe(radio => {
      this.renderRadio(radio);
    });

    // Power toggle
    this.dom.radioPowerToggle?.addEventListener('change', (e) => {
      this.setPower(e.target.checked);
    });

    // Direct typed frequency input
    this.dom.radioFreqInput?.addEventListener('change', (e) => {
      this.setFrequency(e.target.value);
    });

    // Slider input
    this.dom.radioFreqSlider?.addEventListener('input', (e) => {
      this.setFrequency(e.target.value);
    });

    // Stepper continuous seek on hold
    this.setupHoldSeek(this.dom.radioSeekDownBtn, false);
    this.setupHoldSeek(this.dom.radioSeekUpBtn, true);

    // Volume slider
    this.dom.radioVolumeSlider?.addEventListener('input', (e) => {
      this.setVolume(Number(e.target.value));
    });

    // Preset Modal Controls
    this.dom.presetModalCloseBtn?.addEventListener('click', () => this.closePresetModal());
    this.dom.presetModalCancelBtn?.addEventListener('click', () => this.closePresetModal());
    this.dom.presetModalSaveBtn?.addEventListener('click', () => this.savePresetFromModal());
    this.dom.presetUseCurrentFreqBtn?.addEventListener('click', () => {
      const current = radioStore.get().frequency || '89.5';
      if (this.dom.presetModalFreqInput) this.dom.presetModalFreqInput.value = current;
    });

    this.dom.editPresetsBtn?.addEventListener('click', () => {
      this.openPresetModal(radioStore.get().activePreset || 0);
    });
  }

  setupHoldSeek(btn, isUp) {
    if (!btn) return;
    let interval = null;
    let timeout = null;

    const step = () => {
      const current = parseFloat(radioStore.get().frequency || '89.5');
      const next = isUp ? Math.min(108.0, current + 0.1) : Math.max(76.0, current - 0.1);
      this.setFrequency(next);
    };

    const start = (e) => {
      e.preventDefault();
      step();
      timeout = setTimeout(() => {
        interval = setInterval(step, 75);
      }, 300);
    };

    const stop = () => {
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
      timeout = null;
      interval = null;
    };

    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    btn.addEventListener('touchend', stop);
  }

  async sendToBle(payload) {
    const activeDevice = activeDeviceStore.get();
    if (!activeDevice) return;
    try {
      await bleService.sendControlPayload(activeDevice, payload);
    } catch (err) {
      console.warn('[RadioView] Error sending radio command:', err);
    }
  }

  setPower(power) {
    const state = radioStore.get();
    radioStore.set({ ...state, power });
    const payload = DeviceProtocol.buildSS201PowerMode(power ? 3 : 0);
    this.sendToBle(payload);
  }

  setFrequency(freqFloat) {
    const val = Math.max(76.0, Math.min(108.0, parseFloat(freqFloat))).toFixed(1);
    const state = radioStore.get();
    radioStore.set({ ...state, frequency: val });

    const payload = DeviceProtocol.buildSS201FMTuning(val);
    this.sendToBle(payload);
  }

  setVolume(volume) {
    const v = Math.max(0, Math.min(30, volume));
    const state = radioStore.get();
    radioStore.set({ ...state, volume: v });

    const payload = DeviceProtocol.buildSS201Volume(v);
    this.sendToBle(payload);
  }

  selectPreset(idx) {
    const state = radioStore.get();
    const preset = state.presets[idx];
    if (!preset) return;

    radioStore.set({ ...state, frequency: preset.freq, activePreset: idx });
    const payload = DeviceProtocol.buildSS201FMChannelSelect(idx, preset.freq);
    this.sendToBle(payload);
  }

  openPresetModal(chIndex) {
    const state = radioStore.get();
    const preset = state.presets[chIndex] || { ch: chIndex + 1, freq: '89.5', name: '' };
    this.currentEditingPresetIdx = chIndex;

    const modal = this.dom.presetModalOverlay;
    if (!modal) return;

    const presetPrefix = i18n.t('ss201.radio.preset') || 'Preset';
    const isDefault = !preset.name || /^(Preset|Station|Préréglage|Speicher|Presintonía|プリセット|预设)\s*\d+$/i.test(preset.name);
    const defaultName = isDefault ? `${presetPrefix} ${chIndex + 1}` : preset.name;

    if (this.dom.presetModalTitle) {
      const editTitleTemplate = i18n.t('modal.preset.title') || 'Edit Preset Channel';
      this.dom.presetModalTitle.textContent = `${editTitleTemplate} (CH ${chIndex + 1})`;
    }
    if (this.dom.presetModalNameInput) this.dom.presetModalNameInput.value = defaultName;
    if (this.dom.presetModalFreqInput) this.dom.presetModalFreqInput.value = preset.freq || '89.5';

    modal.classList.remove('hidden');
    if (this.renderIcons) this.renderIcons();
  }

  closePresetModal() {
    this.dom.presetModalOverlay?.classList.add('hidden');
  }

  async savePresetFromModal() {
    const state = radioStore.get();
    const presetPrefix = i18n.t('ss201.radio.preset') || 'Preset';
    const name = this.dom.presetModalNameInput?.value.trim() || `${presetPrefix} ${this.currentEditingPresetIdx + 1}`;
    const freq = Math.max(76.0, Math.min(108.0, parseFloat(this.dom.presetModalFreqInput?.value) || 89.5)).toFixed(1);

    const presets = [...state.presets];
    presets[this.currentEditingPresetIdx] = {
      ch: this.currentEditingPresetIdx + 1,
      freq,
      name
    };

    radioStore.set({ ...state, presets, frequency: freq, activePreset: this.currentEditingPresetIdx });
    this.closePresetModal();

    // 1. Send station name packet (Command 23..27)
    const namePayload = DeviceProtocol.buildSS201FMStationName(this.currentEditingPresetIdx, name);
    await this.sendToBle(namePayload);

    // 2. Send station channel save packet (Command 22)
    setTimeout(() => {
      const channelPayload = DeviceProtocol.buildSS201FMChannelSave(this.currentEditingPresetIdx, freq);
      this.sendToBle(channelPayload);
    }, 100);
  }

  renderRadio(radio) {
    if (this.dom.radioPowerToggle) this.dom.radioPowerToggle.checked = radio.power;
    if (this.dom.radioFreqInput) this.dom.radioFreqInput.value = radio.frequency;
    if (this.dom.radioFreqSlider) this.dom.radioFreqSlider.value = radio.frequency;
    if (this.dom.radioVolumeSlider) this.dom.radioVolumeSlider.value = radio.volume;
    if (this.dom.radioVolumeVal) this.dom.radioVolumeVal.textContent = radio.volume;

    const grid = this.dom.presetGrid;
    if (!grid) return;

    grid.innerHTML = '';
    const currentFreq = parseFloat(radio.frequency).toFixed(1);
    const presetPrefix = i18n.t('ss201.radio.preset') || 'Preset';

    radio.presets.forEach((p, idx) => {
      const isCurrent = parseFloat(p.freq).toFixed(1) === currentFreq;
      const isDefault = !p.name || /^(Preset|Station|Préréglage|Speicher|Presintonía|プリセット|预设)\s*\d+$/i.test(p.name);
      const displayName = isDefault ? `${presetPrefix} ${idx + 1}` : p.name;

      const btn = document.createElement('button');
      btn.className = `preset-btn ${isCurrent ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="preset-num">CH ${idx + 1}</span>
        <span class="preset-freq">${p.freq}</span>
        <span class="preset-name">${displayName}</span>
      `;
      btn.addEventListener('click', () => {
        this.selectPreset(idx);
      });
      grid.appendChild(btn);
    });

    if (this.renderIcons) this.renderIcons();
  }
}
