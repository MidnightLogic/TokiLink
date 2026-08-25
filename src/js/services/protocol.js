/**
 * ═══════════════════════════════════════════════════════════════
 *  Device Protocol Engine
 *  Pure byte packet builders & model configuration
 *  Reverse-engineered from Seiko App APKs:
 *   - Multi-Sound Clock App (com.useinc.ss501k.clocksync)
 *   - ClockSyncApp (com.spark.reac.seikoclock)
 *   - NexTime App (com.spark.reac.seikoclock_b01)
 * ═══════════════════════════════════════════════════════════════
 */

export const DeviceProtocol = {
  NAME_FILTERS: [
    'STCC', 'stcc', 'Stcc',
    'DL', 'dl', 'Dl',
    'SS', 'ss', 'Ss',
    'SS201', 'SS501', 'SSUSE',
    'SQ', 'sq', 'SQ820', 'SQ821',
    'ZS', 'zs', 'ZS450', 'ZS451', 'ZS250', 'ZS251', 'ZS252', 'ZS253', 'ZS254', 'ZS255', 'ZS256',
    'QHB', 'qhb',
    'NGAN', 'ngan',
    'OPTEK', 'optek',
    'SEIKO', 'Seiko', 'seiko',
    'Clock', 'clock', 'CLOCK'
  ],

  SERIES: {
    MULTI_SOUND: 'multiSound',
    SERIES_C3: 'seriesC3',
    STANDARD_DIGITAL: 'standardDigital',
    NEXTIME: 'nexTime'
  },

  MODELS: {
    // ─── 1. Multi-Sound Clocks (SS Series) ───────────────────────
    SS501: {
      type: 'SS501',
      series: 'multiSound',
      displayName: 'Seiko SS501 (Multi-Sound Wide)',
      hasFeatures: true,
      protocol: 'cts_ffe0',
      timeServiceUUID: '00001806-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '00002a16-0000-1000-8000-00805f9b34fb',
      controlServiceUUID: '0000ffe0-0000-1000-8000-00805f9b34fb',
      controlWriteCharUUID: '0000ffe3-0000-1000-8000-00805f9b34fb',
      controlNotifyCharUUID: '0000ffe1-0000-1000-8000-00805f9b34fb',
      pingServiceUUID: '00001805-0000-1000-8000-00805f9b34fb',
      pingCharUUID: '00002a2b-0000-1000-8000-00805f9b34fb',
    },
    SS201: {
      type: 'SS201',
      series: 'multiSound',
      displayName: 'Seiko SS201 (Multi-Sound Upright)',
      hasFeatures: true,
      protocol: 'cts_ffe0',
      timeServiceUUID: '00001806-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '00002a16-0000-1000-8000-00805f9b34fb',
      controlServiceUUID: '0000ffe0-0000-1000-8000-00805f9b34fb',
      controlWriteCharUUID: '0000ffe3-0000-1000-8000-00805f9b34fb',
      controlNotifyCharUUID: '0000ffe1-0000-1000-8000-00805f9b34fb',
      pingServiceUUID: '00001805-0000-1000-8000-00805f9b34fb',
      pingCharUUID: '00002a2b-0000-1000-8000-00805f9b34fb',
    },

    // ─── 2. Series C3 (Gradient LED Digital Clocks) ─────────────
    DL308: {
      type: 'DL308',
      series: 'seriesC3',
      displayName: 'Seiko DL308K (Series C3 LED)',
      hasFeatures: false,
      protocol: 'cts_fff0',
      timeServiceUUID: '0000fff0-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000fff2-0000-1000-8000-00805f9b34fb',
      altTimeServiceUUID: '0000ffe1-0000-1000-8000-00805f9b34fb',
      altTimeWriteCharUUID: '0000fff4-0000-1000-8000-00805f9b34fb',
    },

    // ─── 3. Standard Digital (SQ Series) ────────────────────────
    SQ820: {
      type: 'SQ820',
      series: 'standardDigital',
      displayName: 'Seiko SQ820W / SQ820K (Digital Alarm)',
      hasFeatures: false,
      protocol: 'cts_fff0',
      timeServiceUUID: '0000fff0-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000fff2-0000-1000-8000-00805f9b34fb',
    },
    SQ821: {
      type: 'SQ821',
      series: 'standardDigital',
      displayName: 'Seiko SQ821W / SQ821K (Desktop Digital)',
      hasFeatures: false,
      protocol: 'cts_fff0',
      timeServiceUUID: '0000fff0-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000fff2-0000-1000-8000-00805f9b34fb',
    },

    // ─── 4. NexTime Series (Hybrid Multi-Sync Clocks) ───────────
    ZS450: {
      type: 'ZS450',
      series: 'nexTime',
      displayName: 'Seiko ZS450S (NexTime Digital Wall)',
      hasFeatures: false,
      protocol: 'lpwise_5301',
      timeServiceUUID: '00005301-0000-0041-4c50-574953450000',
      timeWriteCharUUID: '00005302-0000-0041-4c50-574953450000',
      timeNotifyCharUUID: '00005303-0000-0041-4c50-574953450000',
    },
    ZS451: {
      type: 'ZS451',
      series: 'nexTime',
      displayName: 'Seiko ZS451S (NexTime Wall & Calendar)',
      hasFeatures: false,
      protocol: 'lpwise_5301',
      timeServiceUUID: '00005301-0000-0041-4c50-574953450000',
      timeWriteCharUUID: '00005302-0000-0041-4c50-574953450000',
      timeNotifyCharUUID: '00005303-0000-0041-4c50-574953450000',
    },
    ZS250: {
      type: 'ZS250',
      series: 'nexTime',
      displayName: 'Seiko ZS250S / ZS250W (NexTime)',
      hasFeatures: false,
      protocol: 'lpwise_5301',
      timeServiceUUID: '00005301-0000-0041-4c50-574953450000',
      timeWriteCharUUID: '00005302-0000-0041-4c50-574953450000',
      timeNotifyCharUUID: '00005303-0000-0041-4c50-574953450000',
    },
    ZS251: {
      type: 'ZS251',
      series: 'nexTime',
      displayName: 'Seiko ZS251S / ZS251W (NexTime)',
      hasFeatures: false,
      protocol: 'lpwise_5301',
      timeServiceUUID: '00005301-0000-0041-4c50-574953450000',
      timeWriteCharUUID: '00005302-0000-0041-4c50-574953450000',
      timeNotifyCharUUID: '00005303-0000-0041-4c50-574953450000',
    },
    ZS252: {
      type: 'ZS252',
      series: 'nexTime',
      displayName: 'Seiko ZS252S / ZS252W / ZS252B (NexTime)',
      hasFeatures: false,
      protocol: 'lpwise_5301',
      timeServiceUUID: '00005301-0000-0041-4c50-574953450000',
      timeWriteCharUUID: '00005302-0000-0041-4c50-574953450000',
      timeNotifyCharUUID: '00005303-0000-0041-4c50-574953450000',
    },
    ZS253: {
      type: 'ZS253',
      series: 'nexTime',
      displayName: 'Seiko ZS253S / ZS253W (NexTime)',
      hasFeatures: false,
      protocol: 'lpwise_5301',
      timeServiceUUID: '00005301-0000-0041-4c50-574953450000',
      timeWriteCharUUID: '00005302-0000-0041-4c50-574953450000',
      timeNotifyCharUUID: '00005303-0000-0041-4c50-574953450000',
    },
    NEXTIME_GENERIC: {
      type: 'NEXTIME_GENERIC',
      series: 'nexTime',
      displayName: 'Seiko NexTime Clock',
      hasFeatures: false,
      protocol: 'lpwise_5301',
      timeServiceUUID: '00005301-0000-0041-4c50-574953450000',
      timeWriteCharUUID: '00005302-0000-0041-4c50-574953450000',
      timeNotifyCharUUID: '00005303-0000-0041-4c50-574953450000',
    },

    // ─── 5. Universal Fallback ──────────────────────────────────
    DEFAULT: {
      type: 'GENERIC_CLOCK',
      series: 'generic',
      displayName: 'Seiko Bluetooth Clock',
      hasFeatures: false,
      protocol: 'auto_detect',
    }
  },

  // ─── Multi-Type Protocol Candidates (for adaptive probing & fallbacks) ───
  CANDIDATE_PROTOCOLS: [
    {
      id: 'lpwise_5301',
      name: 'NexTime LPWISE (0x5301)',
      series: 'nexTime',
      timeServiceUUID: '00005301-0000-0041-4c50-574953450000',
      timeWriteCharUUID: '00005302-0000-0041-4c50-574953450000',
      timeNotifyCharUUID: '00005303-0000-0041-4c50-574953450000',
      payloadType: 'nexTime_8byte',
    },
    {
      id: 'cts_1806',
      name: 'Multi-Sound CTS (0x1806)',
      series: 'multiSound',
      timeServiceUUID: '00001806-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '00002a16-0000-1000-8000-00805f9b34fb',
      payloadType: 'cts_10byte',
    },
    {
      id: 'cts_fff0',
      name: 'Series C3 & SQ Digital (0xFFF0)',
      series: 'seriesC3',
      timeServiceUUID: '0000fff0-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000fff2-0000-1000-8000-00805f9b34fb',
      payloadType: 'cts_10byte',
    },
    {
      id: 'cts_ffe1',
      name: 'Alternative Digital (0xFFE1)',
      series: 'seriesC3',
      timeServiceUUID: '0000ffe1-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '0000fff4-0000-1000-8000-00805f9b34fb',
      payloadType: 'cts_10byte',
    },
    {
      id: 'cts_1805',
      name: 'SIG Current Time (0x1805)',
      series: 'standardDigital',
      timeServiceUUID: '00001805-0000-1000-8000-00805f9b34fb',
      timeWriteCharUUID: '00002a2b-0000-1000-8000-00805f9b34fb',
      payloadType: 'cts_10byte',
    }
  ],

  detectModel(deviceName = '') {
    const name = (deviceName || '').toUpperCase().trim();

    // 1. Multi-Sound Clocks
    if (name.includes('SS501')) return this.MODELS.SS501;
    if (name.includes('SS201') || name.includes('OPTEK') || name.includes('SSUSE')) return this.MODELS.SS201;

    // 2. NexTime Clocks
    if (name.includes('ZS450')) return this.MODELS.ZS450;
    if (name.includes('ZS451')) return this.MODELS.ZS451;
    if (name.includes('ZS250')) return this.MODELS.ZS250;
    if (name.includes('ZS251')) return this.MODELS.ZS251;
    if (name.includes('ZS252')) return this.MODELS.ZS252;
    if (name.includes('ZS253')) return this.MODELS.ZS253;
    if (name.includes('ZS254') || name.includes('ZS255') || name.includes('ZS256') || name.includes('QHB')) {
      return this.MODELS.NEXTIME_GENERIC;
    }
    if (name.startsWith('ZS')) return this.MODELS.NEXTIME_GENERIC;

    // 3. Standard Digital (SQ)
    if (name.includes('SQ821')) return this.MODELS.SQ821;
    if (name.includes('SQ820') || name.includes('SQ')) return this.MODELS.SQ820;

    // 4. Series C3 (DL)
    if (name.includes('DL308') || name.includes('DL') || name.includes('STCC')) {
      return this.MODELS.DL308;
    }

    return this.MODELS.DEFAULT;
  },

  getConfig(deviceName) {
    return this.detectModel(deviceName);
  },

  allServiceUUIDs() {
    const uuids = new Set();
    Object.values(this.MODELS).forEach(m => {
      if (m.timeServiceUUID) uuids.add(m.timeServiceUUID.toLowerCase());
      if (m.altTimeServiceUUID) uuids.add(m.altTimeServiceUUID.toLowerCase());
      if (m.controlServiceUUID) uuids.add(m.controlServiceUUID.toLowerCase());
      if (m.pingServiceUUID) uuids.add(m.pingServiceUUID.toLowerCase());
    });
    // Add 16-bit shorthand services as well for maximum Web Bluetooth compatibility
    uuids.add('00001805-0000-1000-8000-00805f9b34fb');
    uuids.add('00001806-0000-1000-8000-00805f9b34fb');
    uuids.add('0000ffe0-0000-1000-8000-00805f9b34fb');
    uuids.add('0000fff0-0000-1000-8000-00805f9b34fb');
    uuids.add('00005301-0000-0041-4c50-574953450000');
    return Array.from(uuids);
  },

  // ─── Standard CTS Time Payload Builder (10-byte) ──────────────
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

  // ─── NexTime LPWISE Time Payload Builder (8-byte) ─────────────
  buildNexTimePayload(date = new Date()) {
    // Structure from APK h3/m.java:
    // [0x31, sec, min, hour, day, month, year%100, 0x64]
    const payload = new Uint8Array(8);
    payload[0] = 0x31;                 // SEND_RESET_TIME_HEADER
    payload[1] = date.getSeconds();    // 0-59
    payload[2] = date.getMinutes();    // 0-59
    payload[3] = date.getHours();      // 0-23
    payload[4] = date.getDate();       // 1-31
    payload[5] = date.getMonth() + 1;  // 1-12
    payload[6] = date.getFullYear() % 100; // e.g. 26
    payload[7] = 0x64;                 // 100 constant (b.f4466y)
    return payload;
  },

  // ─── NexTime LPWISE Handshake Payloads ────────────────────────
  buildNexTimeAuth() {
    return new Uint8Array([0x38]); // Query paired token / auth request
  },

  buildNexTimePair(tokenBytes = null) {
    // 0x37 followed by 6-byte token
    const payload = new Uint8Array(7);
    payload[0] = 0x37;
    if (tokenBytes && tokenBytes.length >= 6) {
      payload.set(tokenBytes.slice(0, 6), 1);
    } else {
      // Default pseudo client token
      payload[1] = 0x54; // 'T'
      payload[2] = 0x4F; // 'O'
      payload[3] = 0x4B; // 'K'
      payload[4] = 0x49; // 'I'
      payload[5] = 0x01;
      payload[6] = 0x02;
    }
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
