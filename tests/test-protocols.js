import { DeviceProtocol } from '../src/js/services/protocol.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('--- Testing DeviceProtocol Model Detection ---');

// 1. Multi-Sound Series
const ss501 = DeviceProtocol.detectModel('SS501 STCC1N');
assert(ss501.type === 'SS501', 'Detects SS501 model');
assert(ss501.hasFeatures === true, 'SS501 has features enabled');
assert(ss501.series === 'multiSound', 'SS501 mapped to multiSound series');

const ss201 = DeviceProtocol.detectModel('SS201 STCC1P');
assert(ss201.type === 'SS201', 'Detects SS201 model');
assert(ss201.hasFeatures === true, 'SS201 has features enabled');

// 2. Series C3
const dl308 = DeviceProtocol.detectModel('DL308 STCC1N');
assert(dl308.type === 'DL308', 'Detects DL308 model');
assert(dl308.hasFeatures === false, 'DL308 has features disabled (pure time clock)');
assert(dl308.series === 'seriesC3', 'DL308 mapped to seriesC3');

// 3. Standard Digital (SQ)
const sq820 = DeviceProtocol.detectModel('SQ820 STCC1N');
assert(sq820.type === 'SQ820', 'Detects SQ820 model');
assert(sq820.series === 'standardDigital', 'SQ820 mapped to standardDigital');

const sq821 = DeviceProtocol.detectModel('SQ821 STCC1P');
assert(sq821.type === 'SQ821', 'Detects SQ821 model');

// 4. NexTime Series
const zs450 = DeviceProtocol.detectModel('ZS450S-M');
assert(zs450.type === 'ZS450', 'Detects ZS450 model');
assert(zs450.series === 'nexTime', 'ZS450 mapped to nexTime series');
assert(zs450.protocol === 'lpwise_5301', 'ZS450 uses LPWISE protocol');

const zs250 = DeviceProtocol.detectModel('ZS250W-M');
assert(zs250.type === 'ZS250', 'Detects ZS250 model');

const zs256 = DeviceProtocol.detectModel('ZS256B-M');
assert(zs256.type === 'NEXTIME_GENERIC', 'Detects generic ZS256 model');
assert(zs256.series === 'nexTime', 'ZS256 mapped to nexTime series');

// 5. Generic Unrecognized Clock
const genericClock = DeviceProtocol.detectModel('Custom Renamed Clock');
assert(genericClock.type === 'GENERIC_CLOCK', 'Unknown clock returns generic fallback model');
assert(genericClock.protocol === 'auto_detect', 'Generic clock uses auto_detect protocol');
assert(Array.isArray(DeviceProtocol.CANDIDATE_PROTOCOLS) && DeviceProtocol.CANDIDATE_PROTOCOLS.length >= 4, 'Candidate protocols are populated');

// 6. Candidate Protocol Resolution
const c3Candidates = DeviceProtocol.getCandidateProtocols('cts_fff0');
assert(Array.isArray(c3Candidates) && c3Candidates.length > 0, 'getCandidateProtocols returns array');
assert(c3Candidates[0].id === 'cts_fff0', 'getCandidateProtocols prioritizes preferred cts_fff0');

const nexTimeCandidates = DeviceProtocol.getCandidateProtocols('lpwise_5301');
assert(nexTimeCandidates[0].id === 'lpwise_5301', 'getCandidateProtocols prioritizes preferred lpwise_5301');

const genericCandidates = DeviceProtocol.getCandidateProtocols('auto_detect');
assert(genericCandidates.length === DeviceProtocol.CANDIDATE_PROTOCOLS.length, 'Auto-detect includes all candidate protocols');

console.log('\n--- Testing Payload Construction ---');

// Test CTS 10-byte payload
const testDate = new Date(2026, 7, 25, 14, 30, 45); // Aug 25, 2026, 14:30:45 (Tuesday, day 2)
const ctsPayload = DeviceProtocol.buildTimePayload(testDate);
assert(ctsPayload.length === 10, 'CTS payload is exactly 10 bytes');
assert(ctsPayload[0] === (2026 & 0xFF), 'CTS year low byte matches');
assert(ctsPayload[1] === ((2026 >> 8) & 0xFF), 'CTS year high byte matches');
assert(ctsPayload[2] === 8, 'CTS month is 8 (August)');
assert(ctsPayload[3] === 25, 'CTS day is 25');
assert(ctsPayload[4] === 14, 'CTS hour is 14');
assert(ctsPayload[5] === 30, 'CTS minute is 30');
assert(ctsPayload[6] === 45, 'CTS second is 45');
assert(ctsPayload[7] === 2, 'CTS day of week is 2 (Tuesday)');

// Test NexTime 8-byte payload
const nexTimePayload = DeviceProtocol.buildNexTimePayload(testDate);
assert(nexTimePayload.length === 8, 'NexTime payload is exactly 8 bytes');
assert(nexTimePayload[0] === 0x31, 'NexTime header is 0x31');
assert(nexTimePayload[1] === 45, 'NexTime second is 45');
assert(nexTimePayload[2] === 30, 'NexTime minute is 30');
assert(nexTimePayload[3] === 14, 'NexTime hour is 14');
assert(nexTimePayload[4] === 25, 'NexTime day is 25');
assert(nexTimePayload[5] === 8, 'NexTime month is 8');
assert(nexTimePayload[6] === 26, 'NexTime 2-digit year is 26');
assert(nexTimePayload[7] === 0x64, 'NexTime trailing constant is 0x64 (100)');

console.log('\n--- Testing Multi-Sound Control Payloads ---');

// Volume packet
const volPayload = DeviceProtocol.buildSS201Volume(20);
assert(volPayload[0] === 1 && volPayload[1] === 20 && volPayload[4] === 20, 'Volume command 1 builds 5 uniform bytes');

// FM Tuning packet: 89.5 MHz -> 895 (0x037F)
const fmPayload = DeviceProtocol.buildSS201FMTuning(89.5);
assert(fmPayload[0] === 9, 'FM Tuning command header is 9');
assert(fmPayload[1] === ((895 >> 8) & 0xFF), 'FM Tuning MSB matches 89.5MHz');
assert(fmPayload[2] === (895 & 0xFF), 'FM Tuning LSB matches 89.5MHz');

// FM Save Preset packet: Channel 3 (index 2) -> 101.1 MHz -> 1011 (0x03F3)
const savePresetPayload = DeviceProtocol.buildSS201FMChannelSave(2, 101.1);
assert(savePresetPayload[0] === 22, 'Preset save command header is 22');
assert(savePresetPayload[1] === 3, 'Preset channel 1-indexed is 3');
assert(savePresetPayload[2] === ((1011 >> 8) & 0xFF) && savePresetPayload[3] === (1011 & 0xFF), 'Preset frequency 101.1MHz packed');

// Dimmer packet
const brightPayload = DeviceProtocol.buildSS201Brightness(3);
assert(brightPayload[0] === 2 && brightPayload[1] === 4, 'Brightness level 3 maps to value 4 with command 2');

console.log('\n--- Testing Service UUID & Discovery Engine ---');
const allUuids = DeviceProtocol.allServiceUUIDs();
assert(Array.isArray(allUuids) && allUuids.length >= 10, 'Universal service UUID pool contains >= 10 GATT services');
assert(allUuids.includes('0000fff0-0000-1000-8000-00805f9b34fb'), 'Includes Series C3 & SQ primary service 0xFFF0');
assert(allUuids.includes('00001806-0000-1000-8000-00805f9b34fb'), 'Includes Multi-Sound CTS service 0x1806');
assert(allUuids.includes('00005301-0000-0041-4c50-574953450000'), 'Includes NexTime LPWISE service 0x5301');

console.log('\n🎉 ALL PROTOCOL & ENGINE TESTS PASSED!');
