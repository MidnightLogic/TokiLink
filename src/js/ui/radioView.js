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
      this.setFrequency(e.target.value, false);
      this.flushBleFrequency();
    });

    // Slider input (immediate UI + throttled BLE during drag, flushed on change)
    this.dom.radioFreqSlider?.addEventListener('input', (e) => {
      this.setFrequency(e.target.value, true);
    });
    this.dom.radioFreqSlider?.addEventListener('change', (e) => {
      this.setFrequency(e.target.value, false);
      this.flushBleFrequency();
    });

    // Stepper continuous seek on hold with PointerEvents + release flush
    this.setupHoldAction(
      this.dom.radioSeekDownBtn,
      () => this.stepFrequency(false),
      () => this.flushBleFrequency()
    );
    this.setupHoldAction(
      this.dom.radioSeekUpBtn,
      () => this.stepFrequency(true),
      () => this.flushBleFrequency()
    );

    // Volume slider (immediate UI + throttled BLE during drag, flushed on change)
    this.dom.radioVolumeSlider?.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      if (val > 0) this.lastNonZeroVolume = val;
      this.setVolume(val, true);
    });
    this.dom.radioVolumeSlider?.addEventListener('change', (e) => {
      const val = Number(e.target.value);
      if (val > 0) this.lastNonZeroVolume = val;
      this.setVolume(val, false);
      this.flushBleVolume();
    });

    // Volume steppers with press-and-hold PointerEvents + release flush & Mute
    this.dom.radioMuteBtn?.addEventListener('click', () => this.toggleMute());
    this.setupHoldAction(
      this.dom.radioVolDownBtn,
      () => this.stepVolume(-1),
      () => this.flushBleVolume()
    );
    this.setupHoldAction(
      this.dom.radioVolUpBtn,
      () => this.stepVolume(1),
      () => this.flushBleVolume()
    );

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

  stepFrequency(isUp) {
    const current = parseFloat(radioStore.get().frequency || '89.5');
    const next = isUp ? Math.min(108.0, current + 0.1) : Math.max(76.0, current - 0.1);
    this.setFrequency(next, true);
  }

  stepVolume(delta) {
    const cur = radioStore.get().volume || 0;
    const next = Math.max(0, Math.min(30, cur + delta));
    if (next > 0) this.lastNonZeroVolume = next;
    this.setVolume(next, true);
  }

  toggleMute() {
    const current = radioStore.get().volume || 0;
    if (current > 0) {
      this.lastNonZeroVolume = current;
      this.setVolume(0, false);
      this.flushBleVolume();
    } else {
      this.setVolume(this.lastNonZeroVolume || 12, false);
      this.flushBleVolume();
    }
  }

  setupHoldAction(btn, stepFn, onRelease) {
    if (!btn) return;
    let interval = null;
    let timeout = null;
    let activePointerId = null;

    const stop = (e) => {
      if (activePointerId === null) return;
      if (btn.hasPointerCapture && btn.hasPointerCapture(activePointerId)) {
        try {
          btn.releasePointerCapture(activePointerId);
        } catch (err) {}
      }
      activePointerId = null;
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
      timeout = null;
      interval = null;
      btn.classList.remove('active-pressed');
      if (onRelease) onRelease();
    };

    const start = (e) => {
      // Ignore right clicks or secondary touches
      if (e.button !== undefined && e.button !== 0) return;
      if (activePointerId !== null) stop();

      activePointerId = e.pointerId;
      if (btn.setPointerCapture) {
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (err) {}
      }

      if (e.cancelable) e.preventDefault();
      btn.classList.add('active-pressed');
      stepFn();

      timeout = setTimeout(() => {
        if (activePointerId === null) return;
        interval = setInterval(() => {
          if (activePointerId !== null) {
            stepFn();
          } else {
            stop();
          }
        }, 85);
      }, 280);
    };

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('lostpointercapture', stop);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());

    // Window-level safety listeners
    window.addEventListener('pointerup', stop, { passive: true });
    window.addEventListener('pointercancel', stop, { passive: true });
    window.addEventListener('blur', stop, { passive: true });
  }

  async sendToBle(payload) {
    const activeDevice = activeDeviceStore.get();
    if (!activeDevice) return;
    const model = DeviceProtocol.detectModel(activeDevice.name);
    const isMultiSound = model.hasFeatures || (activeDevice.name || '').toUpperCase().includes('SS201') || (activeDevice.name || '').toUpperCase().includes('SS501');
    if (!isMultiSound) return; // Skip BLE write on pure digital clocks to prevent stalls
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

  setFrequency(freqFloat, throttleBle = false) {
    const val = Math.max(76.0, Math.min(108.0, parseFloat(freqFloat))).toFixed(1);
    const state = radioStore.get();
    radioStore.set({ ...state, frequency: val });

    if (throttleBle) {
      this.throttleBleFrequency(val);
    }
  }

  throttleBleFrequency(val) {
    const now = Date.now();
    this._pendingBleFreq = val;

    if (!this._lastBleFreqTime || now - this._lastBleFreqTime >= 220) {
      this._lastBleFreqTime = now;
      const payload = DeviceProtocol.buildSS201FMTuning(val);
      this.sendToBle(payload);
    } else {
      if (this._freqBleTimeout) clearTimeout(this._freqBleTimeout);
      this._freqBleTimeout = setTimeout(() => {
        this._lastBleFreqTime = Date.now();
        const payload = DeviceProtocol.buildSS201FMTuning(this._pendingBleFreq);
        this.sendToBle(payload);
      }, 220);
    }
  }

  flushBleFrequency() {
    if (this._freqBleTimeout) clearTimeout(this._freqBleTimeout);
    const val = radioStore.get().frequency || '89.5';
    const payload = DeviceProtocol.buildSS201FMTuning(val);
    this.sendToBle(payload);
  }

  setVolume(volume, throttleBle = false) {
    const v = Math.max(0, Math.min(30, volume));
    const state = radioStore.get();
    radioStore.set({ ...state, volume: v });

    if (throttleBle) {
      this.throttleBleVolume(v);
    }
  }

  throttleBleVolume(v) {
    const now = Date.now();
    this._pendingBleVol = v;

    if (!this._lastBleVolTime || now - this._lastBleVolTime >= 200) {
      this._lastBleVolTime = now;
      const payload = DeviceProtocol.buildSS201Volume(v);
      this.sendToBle(payload);
    } else {
      if (this._volBleTimeout) clearTimeout(this._volBleTimeout);
      this._volBleTimeout = setTimeout(() => {
        this._lastBleVolTime = Date.now();
        const payload = DeviceProtocol.buildSS201Volume(this._pendingBleVol);
        this.sendToBle(payload);
      }, 200);
    }
  }

  flushBleVolume() {
    if (this._volBleTimeout) clearTimeout(this._volBleTimeout);
    const v = radioStore.get().volume || 0;
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

    const isMuted = radio.volume === 0;
    if (this.dom.radioVolumeVal) {
      this.dom.radioVolumeVal.textContent = isMuted ? 'Muted' : radio.volume;
      this.dom.radioVolumeVal.classList.toggle('muted', isMuted);
    }

    if (this.dom.radioMuteBtn) {
      this.dom.radioMuteBtn.classList.toggle('active', isMuted);
    }
    if (this.dom.radioMuteLabel) {
      this.dom.radioMuteLabel.textContent = isMuted ? 'Unmute' : 'Mute';
    }

    const currentFreq = parseFloat(radio.frequency).toFixed(1);
    const presetSig = JSON.stringify(radio.presets) + '_' + (i18n.locale || '');

    if (this._lastPresetSig !== presetSig) {
      this._lastPresetSig = presetSig;
      this.renderPresetGrid(radio.presets, currentFreq);
    } else {
      this.updatePresetHighlight(currentFreq);
    }
  }

  updatePresetHighlight(currentFreq) {
    const grid = this.dom.presetGrid;
    if (!grid) return;
    const btns = grid.querySelectorAll('.preset-btn');
    btns.forEach(btn => {
      const freq = btn.dataset.freq;
      btn.classList.toggle('active', freq === currentFreq);
    });
  }

  renderPresetGrid(presets, currentFreq) {
    const grid = this.dom.presetGrid;
    if (!grid) return;

    grid.innerHTML = '';
    const presetPrefix = i18n.t('ss201.radio.preset') || 'Preset';

    presets.forEach((p, idx) => {
      const pFreq = parseFloat(p.freq).toFixed(1);
      const isCurrent = pFreq === currentFreq;
      const isDefault = !p.name || /^(Preset|Station|Préréglage|Speicher|Presintonía|プリセット|预设)\s*\d+$/i.test(p.name);
      const displayName = isDefault ? `${presetPrefix} ${idx + 1}` : p.name;

      const btn = document.createElement('button');
      btn.className = `preset-btn ${isCurrent ? 'active' : ''}`;
      btn.dataset.freq = pFreq;
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
  }
}
