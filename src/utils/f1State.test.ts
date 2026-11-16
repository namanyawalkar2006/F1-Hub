import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFreshness,
  formatLapTime,
  formatGap,
  normalizeTyreCompound,
  getTeamColor,
} from './f1State';

test('calculateFreshness marks missing timestamp as DATA UNAVAILABLE', () => {
  const res = calculateFreshness(null);
  assert.equal(res.status, 'DATA UNAVAILABLE');
  assert.equal(res.displayText, 'LIVE DATA UNAVAILABLE');
  assert.equal(res.ageSeconds, null);
});

test('calculateFreshness marks fresh timestamp as LIVE with age in seconds', () => {
  const now = '2026-10-31T15:00:10.000Z';
  const source = '2026-10-31T15:00:07.600Z';
  const res = calculateFreshness(source, now, 15);
  assert.equal(res.status, 'LIVE');
  assert.equal(res.ageSeconds, 2.4);
  assert.equal(res.displayText, 'LIVE • Updated 2.4s ago');
});

test('calculateFreshness marks old timestamp as DELAYED with UTC timestamp', () => {
  const now = '2026-10-31T15:00:30.000Z';
  const source = '2026-10-31T14:32:18.000Z';
  const res = calculateFreshness(source, now, 15);
  assert.equal(res.status, 'DELAYED');
  assert.equal(res.ageSeconds, 1692);
  assert.match(res.displayText, /DATA DELAYED • Last update: 14:32:18 UTC/);
});

test('formatLapTime handles valid seconds and missing values correctly', () => {
  assert.equal(formatLapTime(77.382), '1:17.382');
  assert.equal(formatLapTime('83.05'), '1:23.050');
  assert.equal(formatLapTime(null), '—');
  assert.equal(formatLapTime(undefined), '—');
  assert.equal(formatLapTime(0), '—');
  assert.equal(formatLapTime('invalid'), '—');
});

test('formatGap renders LEADER and formatted gap with plus sign or dash', () => {
  assert.equal(formatGap(null, true), 'LEADER');
  assert.equal(formatGap(1.842, false), '+1.842');
  assert.equal(formatGap('+4.281', false), '+4.281');
  assert.equal(formatGap('4.281', false), '+4.281');
  assert.equal(formatGap(null, false), '—');
  assert.equal(formatGap('', false), '—');
});

test('normalizeTyreCompound normalizes compounds accurately', () => {
  assert.equal(normalizeTyreCompound('SOFT'), 'SOFT');
  assert.equal(normalizeTyreCompound('medium'), 'MEDIUM');
  assert.equal(normalizeTyreCompound('HARD'), 'HARD');
  assert.equal(normalizeTyreCompound('intermediate'), 'INTERMEDIATE');
  assert.equal(normalizeTyreCompound('WET'), 'WET');
  assert.equal(normalizeTyreCompound(''), 'UNKNOWN');
});

test('getTeamColor extracts hex color or defaults gracefully', () => {
  assert.equal(getTeamColor('McLaren'), '#F47600');
  assert.equal(getTeamColor('Scuderia Ferrari'), '#E80020');
  assert.equal(getTeamColor('Ferrari', 'E80020'), '#E80020');
  assert.equal(getTeamColor('Unknown Team', null), '#94A3B8');
});
