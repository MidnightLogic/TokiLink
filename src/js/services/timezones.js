/**
 * ═══════════════════════════════════════════════════════════════
 *  World Timezones Reference Dataset
 *  Covers standard UTC offsets (-12:00 to +14:00) with major cities
 * ═══════════════════════════════════════════════════════════════
 */

export const TIMEZONE_CITIES = [
  { offset: -12, city: 'Baker Island', region: 'UTC-12:00', tzCode: 'BIT', iana: 'Etc/GMT+12' },
  { offset: -11, city: 'Pago Pago / Midway', region: 'Samoa (UTC-11:00)', tzCode: 'SST', iana: 'Pacific/Pago_Pago' },
  { offset: -10, city: 'Honolulu / Papeete', region: 'Hawaii / Tahiti (UTC-10:00)', tzCode: 'HST', iana: 'Pacific/Honolulu' },
  { offset: -9.5, city: 'Taiohae', region: 'Marquesas Islands (UTC-09:30)', tzCode: 'MART', iana: 'Pacific/Marquesas' },
  { offset: -9, city: 'Anchorage', region: 'Alaska (UTC-09:00)', tzCode: 'AKST', iana: 'America/Anchorage' },
  { offset: -8, city: 'Los Angeles / Vancouver / Seattle', region: 'Pacific Time (UTC-08:00)', tzCode: 'PST', iana: 'America/Los_Angeles' },
  { offset: -7, city: 'Denver / Phoenix / Calgary', region: 'Mountain Time (UTC-07:00)', tzCode: 'MST', iana: 'America/Denver' },
  { offset: -6, city: 'Chicago / Mexico City / Dallas', region: 'Central Time (UTC-06:00)', tzCode: 'CST', iana: 'America/Chicago' },
  { offset: -5, city: 'New York / Toronto / Miami / Lima', region: 'Eastern Time (UTC-05:00)', tzCode: 'EST', iana: 'America/New_York' },
  { offset: -4, city: 'Santiago / Halifax / Caracas', region: 'Atlantic / Chile (UTC-04:00)', tzCode: 'AST', iana: 'America/Halifax' },
  { offset: -3.5, city: "St. John's", region: 'Newfoundland (UTC-03:30)', tzCode: 'NST', iana: 'America/St_Johns' },
  { offset: -3, city: 'São Paulo / Buenos Aires / Montevideo', region: 'Brazil / Argentina (UTC-03:00)', tzCode: 'BRT', iana: 'America/Sao_Paulo' },
  { offset: -2, city: 'Fernando de Noronha', region: 'Mid-Atlantic (UTC-02:00)', tzCode: 'FNT', iana: 'America/Noronha' },
  { offset: -1, city: 'Praia / Azores', region: 'Cape Verde (UTC-01:00)', tzCode: 'CVT', iana: 'Atlantic/Cape_Verde' },
  { offset: 0, city: 'London / Dublin / Lisbon / UTC', region: 'GMT / UTC (UTC±00:00)', tzCode: 'UTC', iana: 'Europe/London' },
  { offset: 1, city: 'Paris / Berlin / Rome / Madrid', region: 'Central Europe (UTC+01:00)', tzCode: 'CET', iana: 'Europe/Paris' },
  { offset: 2, city: 'Cairo / Athens / Helsinki / Jerusalem', region: 'Eastern Europe / Egypt (UTC+02:00)', tzCode: 'EET', iana: 'Africa/Cairo' },
  { offset: 3, city: 'Riyadh / Moscow / Nairobi / Istanbul', region: 'Arabia / East Africa (UTC+03:00)', tzCode: 'AST', iana: 'Asia/Riyadh' },
  { offset: 3.5, city: 'Tehran', region: 'Iran (UTC+03:30)', tzCode: 'IRST', iana: 'Asia/Tehran' },
  { offset: 4, city: 'Dubai / Baku / Tbilisi', region: 'Gulf / Caucasus (UTC+04:00)', tzCode: 'GST', iana: 'Asia/Dubai' },
  { offset: 4.5, city: 'Kabul', region: 'Afghanistan (UTC+04:30)', tzCode: 'AFT', iana: 'Asia/Kabul' },
  { offset: 5, city: 'Karachi / Tashkent / Islamabad', region: 'Pakistan / West Asia (UTC+05:00)', tzCode: 'PKT', iana: 'Asia/Karachi' },
  { offset: 5.5, city: 'New Delhi / Mumbai / Kolkata', region: 'India (UTC+05:30)', tzCode: 'IST', iana: 'Asia/Kolkata' },
  { offset: 5.75, city: 'Kathmandu', region: 'Nepal (UTC+05:45)', tzCode: 'NPT', iana: 'Asia/Kathmandu' },
  { offset: 6, city: 'Dhaka / Almaty', region: 'Bangladesh (UTC+06:00)', tzCode: 'BST', iana: 'Asia/Dhaka' },
  { offset: 6.5, city: 'Yangon', region: 'Myanmar (UTC+06:30)', tzCode: 'MMT', iana: 'Asia/Yangon' },
  { offset: 7, city: 'Bangkok / Jakarta / Hanoi', region: 'Indochina (UTC+07:00)', tzCode: 'ICT', iana: 'Asia/Bangkok' },
  { offset: 8, city: 'Singapore / Beijing / Hong Kong / Perth', region: 'China / WA (UTC+08:00)', tzCode: 'CST', iana: 'Asia/Singapore' },
  { offset: 8.75, city: 'Eucla', region: 'ACWST (UTC+08:45)', tzCode: 'ACWST', iana: 'Australia/Eucla' },
  { offset: 9, city: 'Tokyo / Seoul / Osaka', region: 'Japan / Korea (UTC+09:00)', tzCode: 'JST', iana: 'Asia/Tokyo' },
  { offset: 9.5, city: 'Adelaide / Darwin', region: 'Central Australia (UTC+09:30)', tzCode: 'ACST', iana: 'Australia/Adelaide' },
  { offset: 10, city: 'Sydney / Melbourne / Brisbane', region: 'Eastern Australia (UTC+10:00)', tzCode: 'AEST', iana: 'Australia/Sydney' },
  { offset: 10.5, city: 'Lord Howe Island', region: 'Lord Howe (UTC+10:30)', tzCode: 'LHST', iana: 'Australia/Lord_Howe' },
  { offset: 11, city: 'Nouméa / Solomon Islands', region: 'Pacific (UTC+11:00)', tzCode: 'SBT', iana: 'Pacific/Noumea' },
  { offset: 12, city: 'Auckland / Fiji / Wellington', region: 'New Zealand / Fiji (UTC+12:00)', tzCode: 'NZST', iana: 'Pacific/Auckland' },
  { offset: 12.75, city: 'Chatham Islands', region: 'Chatham (UTC+12:45)', tzCode: 'CHAST', iana: 'Pacific/Chatham' },
  { offset: 13, city: 'Nukuʻalofa / Apia', region: 'Tonga / Samoa (UTC+13:00)', tzCode: 'TOT', iana: 'Pacific/Tongatapu' },
  { offset: 14, city: 'Kiritimati (Line Islands)', region: 'Line Islands (UTC+14:00)', tzCode: 'LINT', iana: 'Pacific/Kiritimati' },
];

/**
 * Finds the closest city index matching the browser's local timezone
 */
export function getLocalTimezoneIndex() {
  const localOffsetHours = -new Date().getTimezoneOffset() / 60;
  let closestIdx = 0;
  let minDiff = Infinity;

  TIMEZONE_CITIES.forEach((item, idx) => {
    const diff = Math.abs(item.offset - localOffsetHours);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = idx;
    }
  });

  return closestIdx;
}

/**
 * Calculates the current Date in the target timezone offset
 */
export function getTimeInTimezone(baseDate = new Date(), targetOffsetHours = 0) {
  // Get UTC time in ms
  const utcMs = baseDate.getTime() + (baseDate.getTimezoneOffset() * 60000);
  // Add target offset in ms
  return new Date(utcMs + (targetOffsetHours * 3600000));
}
