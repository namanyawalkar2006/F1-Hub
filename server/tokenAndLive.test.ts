import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenManager } from './tokenManager';
import { openf1Client } from './openf1Client';

test('tokenManager initializes in valid mode and never exposes raw secrets', () => {
  const status = tokenManager.getStatus();
  assert.ok(['UNCONFIGURED', 'AUTHENTICATED', 'COMMUNITY_FALLBACK', 'FAILED'].includes(status.authMode));
  // Ensure no password or token string leaked into status object
  assert.equal(typeof (status as any).password, 'undefined');
  assert.equal(typeof (status as any).accessToken, 'undefined');
});

test('openf1Client successfully fetches real latest session from OpenF1', async () => {
  const session = await openf1Client.getLatestSession();
  assert.ok(session !== null, 'OpenF1 returned valid session');
  assert.ok(typeof session.session_key === 'number', 'session_key is numeric');
  assert.ok(session.session_name.length > 0, 'session_name is present');
  assert.ok(session.circuit_short_name.length > 0, 'circuit_short_name is present');
});

test('OpenF1 headshots request the high-resolution Formula 1 image variant', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify([{
    driver_number: 987,
    headshot_url: 'https://media.formula1.com/example.png.transform/1col/image.png',
  }]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })) as typeof globalThis.fetch;

  try {
    const headshot = await openf1Client.getLatestDriverHeadshot(987);
    assert.ok(headshot);
    assert.match(headshot, /\.transform\/4col\/image\.png$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
