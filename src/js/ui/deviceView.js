/**
 * ═══════════════════════════════════════════════════════════════
 *  Device View Component
 *  Manages multi-device switcher, pairing, and connection status
 * ═══════════════════════════════════════════════════════════════
 */

import { pairedDevicesStore, activeDeviceIdStore, activeDeviceStore, connectionStateStore, DeviceActions, settingsStore } from '../store.js';
import { bleService } from '../services/bluetooth.js';
import { DeviceProtocol } from '../services/protocol.js';
import { i18n } from '../i18n.js';

export class DeviceView {
  constructor(dom, onPairNew) {
    this.dom = dom;
    this.onPairNew = onPairNew;
    this.init();
  }

  init() {
    i18n.onLocaleChange(() => {
      this.renderActiveDevice(activeDeviceStore.get());
      this.renderDeviceList(pairedDevicesStore.get());
      this.updateStatusPill(connectionStateStore.get());
    });

    activeDeviceStore.subscribe(device => {
      this.renderActiveDevice(device);
    });

    activeDeviceIdStore.subscribe(() => {
      this.renderDeviceList(pairedDevicesStore.get());
    });

    pairedDevicesStore.subscribe(devices => {
      this.renderDeviceList(devices);
    });

    settingsStore.subscribe(() => {
      this.renderActiveDevice(activeDeviceStore.get());
    });

    connectionStateStore.subscribe(state => {
      this.updateStatusPill(state);
    });

    this.dom.forgetDeviceBtn?.addEventListener('click', async () => {
      const activeDevice = activeDeviceStore.get();
      if (activeDevice) {
        const deviceId = activeDevice.id;
        await bleService.forgetDevice(deviceId);
        DeviceActions.removeDevice(deviceId);
      }
    });

    this.dom.pairNewBtn?.addEventListener('click', () => {
      if (this.onPairNew) this.onPairNew();
    });
  }

  renderActiveDevice(device) {
    const card = this.dom.deviceCard;
    const tabs = this.dom.featureTabs;
    const settings = settingsStore.get();
    const urlParams = new URLSearchParams(window.location.search);
    const isDebugOrMock = settings.debug || urlParams.get('debug') === 'true' || urlParams.get('mock') === 'true';

    if (!device && isDebugOrMock) {
      device = { id: '00:11:22:33:44:55', name: 'SS201 BLE Clock', model: 'SS201' };
    }

    if (!card) return;

    if (device) {
      card.classList.remove('hidden');
      if (this.dom.deviceName) this.dom.deviceName.textContent = device.name || 'Seiko Clock';
      if (this.dom.deviceId) this.dom.deviceId.textContent = device.id || '';

      const model = DeviceProtocol.detectModel(device.name);
      const isMultiSound = model.hasFeatures || (device.name || '').toUpperCase().includes('SS201') || (device.name || '').toUpperCase().includes('SS501');

      const deviceTag = document.querySelector('.device-tag');
      if (deviceTag) {
        const seriesKey = `series.${model.series || 'generic'}`;
        deviceTag.textContent = i18n.t(seriesKey) || model.type || 'BLE Clock';
      }

      if (tabs) {
        if (isMultiSound || isDebugOrMock) {
          tabs.classList.remove('hidden');
        } else {
          tabs.classList.add('hidden');
          const activeTabBtn = document.querySelector('.tab-btn.active');
          if (activeTabBtn && activeTabBtn.dataset.tab !== 'time') {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'time'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-time'));
          }
        }
      }
    } else {
      card.classList.add('hidden');
      if (tabs) tabs.classList.add('hidden');
    }
  }

  renderDeviceList(devices) {
    const container = this.dom.deviceListContainer;
    if (!container) return;

    container.innerHTML = '';
    const activeId = activeDeviceIdStore.get();

    if (!devices || devices.length === 0) {
      return;
    }

    devices.forEach(d => {
      const isSelected = d.id === activeId;
      const item = document.createElement('button');
      item.className = `device-select-chip ${isSelected ? 'active' : ''}`;
      item.innerHTML = `
        <span class="device-chip-dot"></span>
        <span class="device-chip-name">${d.name || 'Seiko Clock'}</span>
      `;
      item.addEventListener('click', () => {
        DeviceActions.setActiveDevice(d.id);
      });
      container.appendChild(item);
    });

    // Add + Pair Clock chip at the end of the list for multi-clock setups
    const addBtn = document.createElement('button');
    addBtn.className = 'device-select-chip';
    addBtn.style.borderStyle = 'dashed';
    addBtn.innerHTML = `<span>+</span> <span>${i18n.t('device.addClock')}</span>`;
    addBtn.addEventListener('click', () => {
      if (this.onPairNew) this.onPairNew();
    });
    container.appendChild(addBtn);
  }

  updateStatusPill(state) {
    const pill = this.dom.deviceStatus;
    const textEl = this.dom.deviceStatusText;
    if (!pill || !textEl) return;

    pill.className = `device-status-pill ${state}`;
    switch (state) {
      case 'connected':
        textEl.textContent = i18n.t('device.status.connected');
        break;
      case 'syncing':
        textEl.textContent = i18n.t('device.status.syncing');
        break;
      case 'connecting':
        textEl.textContent = i18n.t('device.status.connecting') || 'Connecting...';
        break;
      default:
        textEl.textContent = activeDeviceStore.get() ? i18n.t('device.status.ready') : i18n.t('device.status.disconnected');
        break;
    }
  }
}
