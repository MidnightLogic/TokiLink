/**
 * ═══════════════════════════════════════════════════════════════
 *  Alarm View Component
 *  Interactive alarm manager, live on/off toggles, and modal editor
 * ═══════════════════════════════════════════════════════════════
 */

import { alarmsStore, activeDeviceStore, settingsStore } from '../store.js';
import { bleService } from '../services/bluetooth.js';
import { DeviceProtocol } from '../services/protocol.js';
import { i18n } from '../i18n.js';

export class AlarmView {
  constructor(dom, renderIcons) {
    this.dom = dom;
    this.renderIcons = renderIcons;
    this.currentEditingId = null;
    this.init();
  }

  init() {
    i18n.onLocaleChange(() => {
      this.renderAlarms(alarmsStore.get());
    });

    alarmsStore.subscribe(alarms => {
      this.renderAlarms(alarms);
    });

    this.dom.addAlarmBtn?.addEventListener('click', () => this.addNewAlarm());
    this.dom.alarmModalCloseBtn?.addEventListener('click', () => this.closeModal());
    this.dom.alarmModalCancelBtn?.addEventListener('click', () => this.closeModal());
    this.dom.alarmModalSaveBtn?.addEventListener('click', () => this.saveFromModal());
    this.dom.alarmModalDeleteBtn?.addEventListener('click', () => {
      if (this.currentEditingId) {
        this.deleteAlarm(this.currentEditingId);
        this.closeModal();
      }
    });

    this.dom.alarmModalVolSlider?.addEventListener('input', (e) => {
      if (this.dom.alarmModalVolVal) this.dom.alarmModalVolVal.textContent = e.target.value;
    });

    this.dom.modalDaysGrid?.querySelectorAll('.day-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
      });
    });
  }

  getAlarms() {
    return alarmsStore.get();
  }

  saveAlarms(alarms) {
    alarmsStore.set(alarms);
  }

  async sendAlarmToBle(alarm) {
    const activeDevice = activeDeviceStore.get();
    if (!activeDevice) return;
    const model = DeviceProtocol.detectModel(activeDevice.name);
    const isMultiSound = model.hasFeatures || (activeDevice.name || '').toUpperCase().includes('SS201') || (activeDevice.name || '').toUpperCase().includes('SS501');
    if (!isMultiSound) return; // Skip BLE write on pure digital clocks to prevent stalls
    const payload = DeviceProtocol.buildSS201Alarm(alarm);
    if (isDebug()) console.log(`[AlarmView] Sending Alarm ${alarm.alarmNo} to BLE:`, DeviceProtocol.formatPayload(payload));
    try {
      await bleService.sendControlPayload(activeDevice, payload);
    } catch (err) {
      console.warn('[AlarmView] Error sending alarm payload:', err);
    }
  }

  async sendDeleteToBle(alarmNo) {
    const activeDevice = activeDeviceStore.get();
    if (!activeDevice) return;
    const model = DeviceProtocol.detectModel(activeDevice.name);
    const isMultiSound = model.hasFeatures || (activeDevice.name || '').toUpperCase().includes('SS201') || (activeDevice.name || '').toUpperCase().includes('SS501');
    if (!isMultiSound) return; // Skip BLE write on pure digital clocks to prevent stalls
    const payload = DeviceProtocol.buildSS201DeleteAlarm(alarmNo);
    if (isDebug()) console.log(`[AlarmView] Sending Delete Alarm ${alarmNo} to BLE:`, DeviceProtocol.formatPayload(payload));
    try {
      await bleService.sendControlPayload(activeDevice, payload);
    } catch (err) {
      console.warn('[AlarmView] Error sending delete alarm payload:', err);
    }
  }

  toggleAlarm(id, on) {
    const alarms = this.getAlarms().map(a => a.id === id ? { ...a, on } : a);
    this.saveAlarms(alarms);
    const alarm = alarms.find(a => a.id === id);
    if (alarm) this.sendAlarmToBle(alarm);
  }

  toggleDay(id, dayIndex) {
    const alarms = this.getAlarms().map(a => {
      if (a.id === id) {
        let days = [...a.days];
        if (days.includes(dayIndex)) {
          days = days.filter(d => d !== dayIndex);
        } else {
          days.push(dayIndex);
        }
        const repeatFlags = days.reduce((acc, d) => acc | (1 << d), 0);
        return { ...a, days, repeatFlags };
      }
      return a;
    });

    this.saveAlarms(alarms);
    const alarm = alarms.find(a => a.id === id);
    if (alarm) this.sendAlarmToBle(alarm);
  }

  deleteAlarm(id) {
    const alarm = this.getAlarms().find(a => a.id === id);
    const alarms = this.getAlarms().filter(a => a.id !== id);
    this.saveAlarms(alarms);
    if (alarm) this.sendDeleteToBle(alarm.alarmNo);
  }

  addNewAlarm() {
    const alarms = this.getAlarms();
    if (alarms.length >= 5) {
      alert('Maximum 5 alarms supported.');
      return;
    }

    const activeNos = alarms.map(a => a.alarmNo);
    let nextNo = 1;
    for (let i = 1; i <= 5; i++) {
      if (!activeNos.includes(i)) {
        nextNo = i;
        break;
      }
    }

    const newAlarm = {
      id: Date.now(),
      alarmNo: nextNo,
      hour: 7,
      minute: 0,
      on: true,
      days: [1, 2, 3, 4, 5],
      sound: 0,
      soundName: 'Melody 1',
      volume: 15,
      snooze: true,
      repeatFlags: 0x3E
    };

    this.saveAlarms([...alarms, newAlarm]);
    this.openModal(newAlarm.id);
  }

  openModal(id) {
    const alarm = this.getAlarms().find(a => a.id === id);
    if (!alarm) return;

    this.currentEditingId = id;
    const modal = this.dom.alarmModalOverlay;
    if (!modal) return;

    if (this.dom.alarmModalTitle) {
      this.dom.alarmModalTitle.textContent = i18n.t('modal.alarm.editTitle') || 'Edit Alarm';
    }
    if (this.dom.alarmModalTimeInput) {
      this.dom.alarmModalTimeInput.value = `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`;
    }
    if (this.dom.alarmModalSoundSelect) {
      this.dom.alarmModalSoundSelect.value = alarm.sound !== undefined ? alarm.sound : 0;
    }
    if (this.dom.alarmModalVolSlider) {
      this.dom.alarmModalVolSlider.value = alarm.volume !== undefined ? alarm.volume : 15;
    }
    if (this.dom.alarmModalVolVal) {
      this.dom.alarmModalVolVal.textContent = this.dom.alarmModalVolSlider?.value || '15';
    }
    if (this.dom.alarmModalSnoozeInput) {
      this.dom.alarmModalSnoozeInput.checked = !!alarm.snooze;
    }

    this.dom.modalDaysGrid?.querySelectorAll('.day-chip').forEach(chip => {
      const d = Number(chip.dataset.day);
      if (alarm.days.includes(d)) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    modal.classList.remove('hidden');
  }

  closeModal() {
    this.dom.alarmModalOverlay?.classList.add('hidden');
    this.currentEditingId = null;
  }

  saveFromModal() {
    if (!this.currentEditingId) return;
    const alarm = this.getAlarms().find(a => a.id === this.currentEditingId);
    if (!alarm) return;

    const timeVal = this.dom.alarmModalTimeInput?.value;
    let hour = alarm.hour;
    let minute = alarm.minute;
    if (timeVal) {
      const [h, m] = timeVal.split(':').map(Number);
      hour = h;
      minute = m;
    }

    const selectedDays = [];
    this.dom.modalDaysGrid?.querySelectorAll('.day-chip.active').forEach(chip => {
      selectedDays.push(Number(chip.dataset.day));
    });
    const repeatFlags = selectedDays.reduce((acc, d) => acc | (1 << d), 0);

    const sound = Number(this.dom.alarmModalSoundSelect?.value) || 0;
    const parsedVol = Number(this.dom.alarmModalVolSlider?.value);
    const volume = !isNaN(parsedVol) ? parsedVol : 15;
    const snooze = !!this.dom.alarmModalSnoozeInput?.checked;

    const updated = {
      ...alarm,
      hour,
      minute,
      days: selectedDays,
      repeatFlags,
      sound,
      volume,
      snooze
    };

    const alarms = this.getAlarms().map(a => a.id === this.currentEditingId ? updated : a);
    this.saveAlarms(alarms);
    this.closeModal();
    this.sendAlarmToBle(updated);
  }

  renderAlarms(alarms) {
    const list = this.dom.alarmList;
    if (!list) return;

    list.innerHTML = '';
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const settings = settingsStore.get();
    const is24h = settings.use24h;

    alarms.forEach(alarm => {
      const card = document.createElement('div');
      card.className = 'alarm-card';

      let displayTime = '';
      if (!is24h) {
        const h = alarm.hour % 12 || 12;
        const ampm = alarm.hour >= 12 ? 'PM' : 'AM';
        displayTime = `${String(h).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')} <span class="alarm-ampm">${ampm}</span>`;
      } else {
        displayTime = `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`;
      }

      const soundLabel = ['Melody 1', 'Melody 2', 'Melody 3', 'FM Radio Preset 1', 'FM Radio Preset 2'][alarm.sound] || 'Melody 1';
      const dayOrder = [1, 2, 3, 4, 5, 6, 0];
      const daysHtml = dayOrder.map(d => {
        const isActive = alarm.days.includes(d) ? 'active' : '';
        return `<span class="day-chip ${isActive}" data-alarm-id="${alarm.id}" data-day="${d}">${dayNames[d]}</span>`;
      }).join('');

      card.innerHTML = `
        <div class="alarm-card-top">
          <div class="alarm-time alarm-card-clickable" data-alarm-id="${alarm.id}">${displayTime}</div>
          <div class="alarm-card-actions">
            <button class="alarm-delete-btn" data-alarm-id="${alarm.id}" title="Delete Alarm"><i data-lucide="trash-2" width="16" height="16"></i></button>
            <div class="toggle-switch">
              <input type="checkbox" id="alarmToggle_${alarm.id}" ${alarm.on ? 'checked' : ''}>
              <label class="toggle-slider" for="alarmToggle_${alarm.id}"></label>
            </div>
          </div>
        </div>
        <div class="alarm-days">${daysHtml}</div>
        <div class="alarm-meta">
          <span class="alarm-badge alarm-card-clickable" data-alarm-id="${alarm.id}">${soundLabel}</span>
          ${alarm.snooze ? `<span class="alarm-badge">${i18n.t('ss201.alarm.snooze') || 'Snooze (5 min)'}</span>` : ''}
        </div>
      `;

      list.appendChild(card);
    });

    list.querySelectorAll('.alarm-card-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const id = Number(el.dataset.alarmId);
        this.openModal(id);
      });
    });

    list.querySelectorAll('.day-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(chip.dataset.alarmId);
        const day = Number(chip.dataset.day);
        this.toggleDay(id, day);
      });
    });

    list.querySelectorAll('.alarm-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.alarmId);
        this.deleteAlarm(id);
      });
    });

    list.querySelectorAll('.toggle-switch input').forEach(input => {
      input.addEventListener('change', () => {
        const id = Number(input.id.replace('alarmToggle_', ''));
        this.toggleAlarm(id, input.checked);
      });
    });

    if (this.renderIcons) this.renderIcons();
  }
}
