/**
 * ═══════════════════════════════════════════════════════════════
 *  Diagnostic View Component
 *  Renders GATT hardware inspection tree and handles report export
 * ═══════════════════════════════════════════════════════════════
 */

import { DiagnosticProbeService } from '../services/diagnosticProbe.js';
import { DeviceProtocol } from '../services/protocol.js';
import { bleService } from '../services/bluetooth.js';
import { activeDeviceStore, pairedDevicesStore } from '../store.js';

export class DiagnosticView {
  constructor(dom, renderIcons = () => {}) {
    this.dom = dom;
    this.renderIcons = renderIcons;
    this.currentReport = null;
    this.init();
  }

  init() {
    // Open / Close Modal Handlers
    const openBtn = document.getElementById('openDiagnosticModalBtn');
    const modalOverlay = document.getElementById('diagnosticModalOverlay');
    const closeBtn = document.getElementById('diagnosticModalCloseBtn');

    openBtn?.addEventListener('click', () => {
      if (modalOverlay) {
        modalOverlay.classList.remove('hidden');
        this.resetToIdle();
        this.renderIcons();
      }
    });

    closeBtn?.addEventListener('click', () => {
      if (modalOverlay) {
        modalOverlay.classList.add('hidden');
      }
    });

    modalOverlay?.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.add('hidden');
      }
    });

    // Start Scan Button Handlers
    const startScanBtn = document.getElementById('startDiagnosticScanBtn');
    const rescanBtn = document.getElementById('diagRescanBtn');
    const retryBtn = document.getElementById('diagRetryBtn');
    const cancelBtn = document.getElementById('diagCancelBtn');

    startScanBtn?.addEventListener('click', () => {
      this.cachedDiagnosticDevice = null;
      this.runScan();
    });
    rescanBtn?.addEventListener('click', () => {
      this.cachedDiagnosticDevice = null;
      this.runScan();
    });
    retryBtn?.addEventListener('click', () => this.runScan());
    cancelBtn?.addEventListener('click', () => this.resetToIdle());

    // Deep Discovery Checkbox Toggle & Accordion
    const deepToggle = document.getElementById('diagDeepDiscoveryToggle');
    const unfilteredNotice = document.getElementById('diagUnfilteredNotice');
    const filteredTip = document.getElementById('diagFilteredTip');
    const accordion = document.getElementById('diagAdvancedAccordion');

    deepToggle?.addEventListener('change', (e) => {
      if (e.target.checked) {
        unfilteredNotice?.classList.remove('hidden');
        filteredTip?.classList.add('hidden');
      } else {
        unfilteredNotice?.classList.add('hidden');
        filteredTip?.classList.remove('hidden');
      }
      this.renderIcons();
    });

    accordion?.addEventListener('toggle', () => {
      this.renderIcons();
    });

    // Copy JSON Report Handler
    const copyBtn = document.getElementById('diagCopyJsonBtn');
    const copyText = document.getElementById('diagCopyJsonText');
    copyBtn?.addEventListener('click', async () => {
      if (!this.currentReport) return;
      try {
        await navigator.clipboard.writeText(JSON.stringify(this.currentReport, null, 2));
        if (copyText) copyText.textContent = 'Copied JSON!';
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Copy JSON Report';
        }, 2000);
      } catch (err) {
        console.warn('[Diagnostic] Clipboard copy error:', err);
      }
    });

    // Download JSON Handler
    const downloadBtn = document.getElementById('diagDownloadJsonBtn');
    downloadBtn?.addEventListener('click', () => {
      if (this.currentReport) {
        DiagnosticProbeService.downloadReportJson(this.currentReport);
      }
    });
  }

  resetToIdle() {
    const idleView = document.getElementById('diagnosticIdleView');
    const progressView = document.getElementById('diagnosticProgressView');
    const resultsView = document.getElementById('diagnosticResultsView');
    const errorActions = document.getElementById('diagnosticErrorActions');
    const spinnerWrap = document.getElementById('diagnosticSpinnerWrap');
    const progressWrap = document.getElementById('diagnosticProgressBarWrap');

    this.cachedDiagnosticDevice = null;

    idleView?.classList.remove('hidden');
    progressView?.classList.add('hidden');
    resultsView?.classList.add('hidden');
    if (errorActions) {
      errorActions.classList.add('hidden');
      errorActions.style.display = 'none';
    }
    if (spinnerWrap) spinnerWrap.style.display = '';
    if (progressWrap) progressWrap.style.display = '';
  }

  async runScan() {
    const idleView = document.getElementById('diagnosticIdleView');
    const progressView = document.getElementById('diagnosticProgressView');
    const resultsView = document.getElementById('diagnosticResultsView');
    const progressText = document.getElementById('diagnosticProgressText');
    const progressBar = document.getElementById('diagnosticProgressBarFill');
    const errorActions = document.getElementById('diagnosticErrorActions');
    const spinnerWrap = document.getElementById('diagnosticSpinnerWrap');
    const progressWrap = document.getElementById('diagnosticProgressBarWrap');

    idleView?.classList.add('hidden');
    progressView?.classList.remove('hidden');
    resultsView?.classList.add('hidden');
    if (errorActions) {
      errorActions.classList.add('hidden');
      errorActions.style.display = 'none';
    }
    if (spinnerWrap) spinnerWrap.style.display = '';
    if (progressWrap) progressWrap.style.display = '';
    if (progressBar) progressBar.style.width = '15%';

    try {
      let targetBleDevice = this.cachedDiagnosticDevice || bleService.connectedDevice;

      // If not connected, check session or permitted devices
      if (!targetBleDevice) {
        const permitted = await bleService.getPermittedDevices();
        const activeDev = activeDeviceStore.get();
        if (activeDev) {
          targetBleDevice = permitted.find(d => d.id === activeDev.id || d.name === activeDev.name);
        }
        if (!targetBleDevice && permitted.length > 0) {
          targetBleDevice = permitted[0];
        }
      }

      // If still no device, request from user picker with all services enabled
      if (!targetBleDevice) {
        if (progressText) progressText.textContent = 'Select your clock in the device picker...';
        const isDeepDiscovery = !!document.getElementById('diagDeepDiscoveryToggle')?.checked;
        if (navigator.bluetooth?.requestDevice) {
          if (isDeepDiscovery) {
            targetBleDevice = await navigator.bluetooth.requestDevice({
              acceptAllDevices: true,
              optionalServices: DeviceProtocol.allServiceUUIDs()
            });
          } else {
            targetBleDevice = await navigator.bluetooth.requestDevice({
              filters: DeviceProtocol.NAME_FILTERS.map(name => ({ namePrefix: name })),
              optionalServices: DeviceProtocol.allServiceUUIDs()
            });
          }
        } else {
          targetBleDevice = await bleService.requestDevice();
        }
      }

      // Cache device reference for quick retries
      this.cachedDiagnosticDevice = targetBleDevice;

      const report = await DiagnosticProbeService.runFullDiagnostic(targetBleDevice, (status) => {
        if (progressText) progressText.textContent = status.text;
        if (progressBar) {
          const percent = Math.min(100, Math.max(15, status.step * 20));
          progressBar.style.width = `${percent}%`;
        }
      });

      this.currentReport = report;
      this.renderResults(report);

      progressView?.classList.add('hidden');
      resultsView?.classList.remove('hidden');
      this.renderIcons();
    } catch (err) {
      if (progressText) {
        progressText.textContent = `Diagnostic Error: ${err.message}`;
      }
      if (spinnerWrap) spinnerWrap.style.display = 'none';
      if (progressWrap) progressWrap.style.display = 'none';
      if (errorActions) {
        errorActions.classList.remove('hidden');
        errorActions.style.display = 'flex';
      }
      this.renderIcons();
    }
  }

  renderResults(report) {
    const nameEl = document.getElementById('diagDeviceName');
    const modelEl = document.getElementById('diagDeviceModel');
    const servicesCountEl = document.getElementById('diagServicesCount');
    const charsCountEl = document.getElementById('diagCharsCount');
    const ntpOffsetEl = document.getElementById('diagNtpOffset');
    const probeStatusEl = document.getElementById('diagProbeStatus');
    const treeContainer = document.getElementById('diagGattTree');
    const emailBtn = document.getElementById('diagEmailDevBtn');

    if (nameEl) nameEl.textContent = report.device?.name || 'Unknown Clock';
    
    if (modelEl) {
      if (report.seikoRecognition?.isSeikoHardware) {
        modelEl.textContent = `Model: ${report.device?.detectedModel?.type || 'Auto-detect'}`;
        modelEl.className = 'diagnostic-badge';
      } else {
        modelEl.textContent = 'Non-Seiko Peripheral';
        modelEl.className = 'diagnostic-badge warning';
      }
    }

    let totalChars = 0;
    (report.services || []).forEach(s => {
      totalChars += (s.characteristics || []).length;
    });

    if (servicesCountEl) servicesCountEl.textContent = report.services?.length || 0;
    if (charsCountEl) charsCountEl.textContent = totalChars;
    if (ntpOffsetEl) ntpOffsetEl.textContent = `${Math.round(report.environment?.ntpOffsetMs || 0)} ms`;

    const successfulProbes = (report.probeResults || []).filter(p => p.serviceFound && p.charFound);
    if (probeStatusEl) {
      if (successfulProbes.length > 0) {
        probeStatusEl.textContent = `${successfulProbes.length} Match(es)`;
        probeStatusEl.className = 'diagnostic-meta-val success';
      } else if (report.seikoRecognition?.isSeikoHardware) {
        probeStatusEl.textContent = 'Custom Seiko';
        probeStatusEl.className = 'diagnostic-meta-val warning';
      } else {
        probeStatusEl.textContent = 'Non-Seiko';
        probeStatusEl.className = 'diagnostic-meta-val danger';
      }
    }

    if (emailBtn) {
      emailBtn.href = DiagnosticProbeService.generateMailtoUrl(report);
    }

    if (treeContainer) {
      treeContainer.innerHTML = '';

      if (!report.services || report.services.length === 0) {
        treeContainer.innerHTML = '<div class="diag-tree-empty">No GATT services could be discovered.</div>';
        return;
      }

      report.services.forEach((service, sIdx) => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'diag-service-card';
        
        let charsHtml = '';
        (service.characteristics || []).forEach(char => {
          const propBadges = (char.properties || []).map(p => `<span class="diag-prop-pill ${p}">${p.toUpperCase()}</span>`).join('');
          
          let valRow = '';
          if (char.readValueHex) {
            const parsedBadge = char.parsedValue ? `<span class="diag-val-parsed">➔ ${char.parsedValue}</span>` : '';
            valRow = `
              <div class="diag-val-row">
                <span class="diag-val-label">Raw Hex:</span>
                <code class="diag-val-hex">${char.readValueHex}</code>
                ${parsedBadge}
                ${char.readValueAscii && !char.parsedValue ? `<span class="diag-val-ascii">"${char.readValueAscii}"</span>` : ''}
              </div>
            `;
          }

          charsHtml += `
            <div class="diag-char-item">
              <div class="diag-char-header">
                <span class="diag-char-label">${char.label}</span>
                <div class="diag-props-wrap">${propBadges}</div>
              </div>
              <div class="diag-char-uuid">${char.uuid}</div>
              ${valRow}
            </div>
          `;
        });

        serviceCard.innerHTML = `
          <div class="diag-service-header">
            <div class="diag-service-title-wrap">
              <span class="diag-service-num">#${sIdx + 1}</span>
              <span class="diag-service-label">${service.label}</span>
            </div>
            <span class="diag-service-chars-badge">${service.characteristics?.length || 0} Chars</span>
          </div>
          <div class="diag-service-uuid">${service.uuid}</div>
          <div class="diag-chars-list">
            ${charsHtml}
          </div>
        `;

        treeContainer.appendChild(serviceCard);
      });
    }
  }
}
