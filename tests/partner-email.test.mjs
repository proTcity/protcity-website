import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { buildSync } from 'esbuild';

// Exercise the real provider wrapper with synthetic bindings only. No remote email,
// Firebase, applicant records or real secrets are loaded by these tests.
const source = buildSync({
  entryPoints: ['src/server/partner-email.ts'], bundle: true,
  format: 'cjs', platform: 'browser', write: false,
}).outputFiles[0].text;
function load({ timers = { setTimeout, clearTimeout } } = {}) {
  const module = { exports: {} }, messages = [];
  vm.runInNewContext(source, {
    module, exports: module.exports, ...timers,
    console: {
      info: (message) => messages.push(message),
      error: (message) => messages.push(message),
    },
  });
  return { ...module.exports, messages };
}
const applicationId = '11111111-1111-4111-8111-111111111111';
const notification = { applicationId, messageId: 'ignored@example.test' };
function environment(send) {
  return {
    PARTNER_EMAIL_ENABLED: 'true',
    PARTNER_NOTIFICATION_TO: 'owner@example.test',
    PARTNER_EMAIL: { send },
  };
}

test('provider uses a fixed envelope and minimal internal content without applicant PII or Message-ID override', async () => {
  const service = load(); let payload;
  await service.sendPartnerNotification(environment(async (input) => {
    payload = input; return { messageId: 'synthetic-provider-id' };
  }), { ...notification, email: 'candidate@example.test', name: 'Synthetic private name', approach: 'Private proposal text' });
  assert.equal(payload.to, 'owner@example.test');
  assert.equal(payload.from, 'notifications@protcity.com');
  assert.equal(payload.subject, 'proTcity - Nuova candidatura partner');
  assert.equal(payload.text.includes(applicationId), true);
  assert.equal(payload.text.includes('https://admin.protcity.com/partner-applications'), true);
  assert.deepEqual(Object.keys(payload).sort(), ['from', 'headers', 'subject', 'text', 'to']);
  assert.equal(payload.headers['Auto-Submitted'], 'auto-generated');
  assert.equal(payload.headers['X-Protcity-Application'], applicationId);
  assert.equal(Object.keys(payload.headers).some((key) => key.toLowerCase() === 'message-id'), false);
  for (const privateText of ['candidate@example.test', 'Synthetic private name', 'Private proposal text', notification.messageId]) {
    assert.equal(JSON.stringify(payload).includes(privateText), false);
  }
  assert.deepEqual(service.messages, []);
});

test('invalid configuration and identifier injection fail before calling the provider', async () => {
  const service = load(); let calls = 0;
  const env = environment(async () => { calls++; });
  for (const recipient of ['', 'invalid', 'a'.repeat(255), 'owner@example.test\r\nBcc: attacker@example.test']) {
    await assert.rejects(service.sendPartnerNotification({ ...env, PARTNER_NOTIFICATION_TO: recipient }, notification), /partner_email_not_configured/);
  }
  await assert.rejects(service.sendPartnerNotification({ ...env, PARTNER_EMAIL: undefined }, notification), /partner_email_not_configured/);
  await assert.rejects(service.sendPartnerNotification(env, { ...notification, applicationId: 'invalid\r\nInjected: yes' }), /partner_email_not_configured/);
  assert.equal(calls, 0);
  assert.deepEqual(service.messages, []);
});

test('disabled or absent email flag performs no provider or database access', async () => {
  const service = load();
  for (const flag of [undefined, 'false', 'TRUE']) {
    await service.runPartnerEmailNotifications({
      PARTNER_EMAIL_ENABLED: flag,
      get PARTNER_EMAIL() { assert.fail('disabled email accessed provider'); },
      get PARTNER_NOTIFICATION_TO() { assert.fail('disabled email accessed recipient'); },
      get PARTNER_APPLICATIONS_DB() { assert.fail('disabled email accessed database'); },
    });
  }
  assert.deepEqual(service.messages, []);
});

test('hung provider fails after a 20-second timeout and clears its timer', async () => {
  let duration, cleared = false;
  const service = load({ timers: {
    setTimeout(callback, milliseconds) { duration = milliseconds; queueMicrotask(callback); return 123; },
    clearTimeout(id) { assert.equal(id, 123); cleared = true; },
  } });
  await assert.rejects(service.sendPartnerNotification(environment(() => new Promise(() => {})), notification), /partner_email_timeout/);
  assert.equal(duration, 20_000);
  assert.equal(cleared, true);
  assert.deepEqual(service.messages, []);
});

test('provider success and rejection both clear the timer, with failure propagated to the outbox', async () => {
  for (const failure of [false, true]) {
    let duration, cleared = false;
    const service = load({ timers: {
      setTimeout(_callback, milliseconds) { duration = milliseconds; return 456; },
      clearTimeout(id) { assert.equal(id, 456); cleared = true; },
    } });
    const env = environment(async () => {
      if (failure) throw new Error('synthetic provider failure');
      return { messageId: 'synthetic-provider-id' };
    });
    const result = service.sendPartnerNotification(env, notification);
    if (failure) await assert.rejects(result, /synthetic provider failure/);
    else await result;
    assert.equal(duration, 20_000);
    assert.equal(cleared, true);
    assert.deepEqual(service.messages, []);
  }
});

test('scheduled wrapper redacts database failures and preserves a failing cron result', async () => {
  const service = load(); let sent = false;
  const env = {
    ...environment(async () => { sent = true; }),
    PARTNER_APPLICATIONS_DB: {
      prepare: () => ({ bind: () => ({}) }),
      batch: async () => { throw new Error('synthetic private provider detail'); },
    },
  };
  await assert.rejects(service.runPartnerEmailNotifications(env), /partner_email_batch_failed/);
  assert.equal(sent, false);
  assert.deepEqual(service.messages, [JSON.stringify({ event: 'partner_email_batch_failed' })]);
});
