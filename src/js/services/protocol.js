/**
 * ═══════════════════════════════════════════════════════════════
 *  Device Protocol Engine
 *  Pure byte packet builders & model configuration
 *  Reverse-engineered from Seiko App APK
 * ═══════════════════════════════════════════════════════════════
 */

export const DeviceProtocol = {
  NAME_FILTERS: [
    'STCC', 'stcc', 'Stcc',
    'DL', 'dl', 'Dl',
    'SS', 'ss', 'Ss',
    'SS201', 'SS501', 'SSUSE',
    'NGAN', 'ngan',
    'OPTEK', 'optek',
    'SQ', 'sq', 'SQ820',
    'SEIKO', 'Seiko', 'seiko',
    'Clock', 'clock', 'CLOCK'
  ],

  MODELS: {
    SS201: {
      type: 'SS201',
      displayName: 'Seiko SS201 / SS501 (Multifunction)',
      hasFeatures: true,
      timeServiceUUID: '00001806-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '00002a16-0000-1000-8000-00805f9b34fb',
      controlServiceUUID: '0000ffe0-0000-1000-8000-00805f9b34fb',
      controlWriteCharUUID: '0000ffe3-0000-1000-8000-00805f9b34fb',
      controlNotifyCharUUID: '0000ffe1-0000-1000-8000-00805f9b34fb',
      pingServiceUUID: '00001805-0000-1000-8000-00805f9b34fb',
      pingCharUUID: '00002a2b-0000-1000-8000-00805f9b34fb',
    },
    SSUSE1: {
      type: 'SSUSE1',
      displayName: 'Seiko SSUSE 1',
      hasFeatures: false,
      timeServiceUUID: '0000ffe1-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000fff4-0000-1000-8000-00805f9b34fb',
    },
    SSUSE2: {
      type: 'SSUSE2',
      displayName: 'Seiko SSUSE 2',
      hasFeatures: false,
      timeServiceUUID: '0000fff0-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000fff5-0000-1000-8000-00805f9b34fb',
    },
    SSUSE3: {
      type: 'SSUSE3',
      displayName: 'Seiko SSUSE 3',
      hasFeatures: false,
      timeServiceUUID: '0000ffe3-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000ffe5-0000-1000-8000-00805f9b34fb',
    },
    SSUSE4: {
      type: 'SSUSE4',
      displayName: 'Seiko SSUSE 4',
      hasFeatures: false,
      timeServiceUUID: '0000ffe2-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000ffe5-0000-1000-8000-00805f9b34fb',
    },
    NGAN: {
      type: 'NGAN',
      displayName: 'Seiko STCCKKK1N',
      hasFeatures: false,
      timeServiceUUID: 'd3b55356-91ae-4aaf-ba2d-731e7a450e52',
      timeWriteCharUUID: 'deca31cd-dea3-4dac-b432-d4ab92a62c3f',
    },
    DEFAULT: {
      type: 'DL308',
      displayName: 'Seiko DL308 / STCC Series',
      hasFeatures: false,
      timeServiceUUID: '0000fff0-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000fff2-0000-1000-8000-00805f9b34fb',
    }
  },

  detectModel(deviceName = '') {
    const name = (deviceName || '').toUpperCase();
    if (name.includes('SS201') || name.includes('SS501') || name.includes('OPTEK')) {
      return this.MODELS.SS201;
    }
    if (name.includes('STCCKKK1N') || name.includes('NGAN')) {
      return this.MODELS.NGAN;
    }
    if (name.includes('SSUSE4')) return this.MODELS.SSUSE4;
    if (name.includes('SSUSE3')) return this.MODELS.SSUSE3;
    if (name.includes('SSUSE2')) return this.MODELS.SSUSE2;
    if (name.includes('SSUSE1') || name.includes('SSUSE')) return this.MODELS.SSUSE1;
    return this.MODELS.DEFAULT;
  },

  getConfig(deviceName) {
    return this.detectModel(deviceName);
  },

  allServiceUUIDs() {
    const uuids = new Set();
    Object.values(this.MODELS).forEach(m => {
      if (m.timeServiceUUID) uuids.add(m.timeServiceUUID.toLowerCase());
      if (m.controlServiceUUID) uuids.add(m.controlServiceUUID.toLowerCase());
      if (m.pingServiceUUID) uuids.add(m.pingServiceUUID.toLowerCase());
    });
    return Array.from(uuids);
  },

  // ─── Time Payload Builder (10-byte standard) ──────────────────

  buildTimePayload(date = new Date()) {
    const payload = new Uint8Array(10);
    const year = date.getFullYear();

    payload[0] = year & 0xFF;
    payload[1] = (year >> 8) & 0xFF;
    payload[2] = date.getMonth() + 1; // 1-12
    payload[3] = date.getDate();       // 1-31
    payload[4] = date.getHours();      // 0-23
    payload[5] = date.getMinutes();    // 0-59
    payload[6] = date.getSeconds();    // 0-59
    payload[7] = date.getDay();        // 0=Sun, 1=Mon, ..., 6=Sat
    payload[8] = 0x00;
    payload[9] = 0x00;

    return payload;
  },

  // ─── SS201 Control Payloads (Characteristic 0xFFE3) ───────────

  buildSS201Brightness(level) {
    // Level 0..4 maps to byte values 1..5 in the APK protocol
    return new Uint8Array([2, Math.max(1, Math.min(5, Number(level) + 1))]);
  },

  buildSS201Bass(level) {
    return new Uint8Array([3, Math.max(0, Math.min(3, Number(level)))]);
  },

  buildSS201AutoPowerOff(minutes) {
    return new Uint8Array([5, Math.max(0, Math.min(60, Number(minutes)))]);
  },

  buildSS201Sleep(minutes, countdown = 0) {
    return new Uint8Array([4, Math.max(0, Math.min(120, Number(minutes))), countdown]);
  },

  buildSS201PowerMode(mode) {
    // 0=Off, 1=Clock, 2=Music, 3=FM, 4=Drowsy, 5=Relax
    return new Uint8Array([0, Number(mode)]);
  },

  buildSS201Volume(vol) {
    const v = Math.max(0, Math.min(30, Number(vol)));
    return new Uint8Array([1, v, v, v, v]);
  },

  buildSS201FMTuning(freqFloat) {
    const freq10x = Math.round(Number(freqFloat) * 10);
    return new Uint8Array([9, (freq10x >> 8) & 0xFF, freq10x & 0xFF]);
  },

  buildSS201FMChannelSelect(channelIndex, freqFloat) {
    const freq10x = Math.round(Number(freqFloat) * 10);
    return new Uint8Array([12, Number(channelIndex) + 1, (freq10x >> 8) & 0xFF, freq10x & 0xFF]);
  },

  buildSS201FMChannelSave(channelIndex, freqFloat) {
    const freq10x = Math.round(Number(freqFloat) * 10);
    return new Uint8Array([22, Number(channelIndex) + 1, (freq10x >> 8) & 0xFF, freq10x & 0xFF]);
  },

  buildSS201FMStationName(channelIndex, nameString = '') {
    // 20 bytes total: byte[0] = channelIndex + 23, bytes[1..19] = ASCII name string
    const buf = new Uint8Array(20);
    buf[0] = Number(channelIndex) + 23;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(nameString.slice(0, 18));
    buf.set(encoded, 1);
    return buf;
  },

  buildSS201FMSeek(isNext, isStart = true) {
    return new Uint8Array([isNext ? 10 : 11, isStart ? 1 : 0]);
  },

  buildSS201Alarm(alarm) {
    // [7, alarmNo, on/off, hour, min, volume, sound, repeatFlags, snooze]
    return new Uint8Array([
      7,
      Number(alarm.alarmNo) || 1,
      alarm.on ? 1 : 0,
      Number(alarm.hour) || 7,
      Number(alarm.minute) || 0,
      Number(alarm.volume) !== undefined ? Number(alarm.volume) : 15,
      Number(alarm.sound) || 0,
      Number(alarm.repeatFlags) || 0x3E,
      alarm.snooze ? 1 : 0
    ]);
  },

  buildSS201DeleteAlarm(alarmNo) {
    return new Uint8Array([7, Number(alarmNo), 0, 0, 0, 0, 0, 0, 0]);
  },

  formatPayload(buf) {
    return Array.from(buf).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ');
  }
};
