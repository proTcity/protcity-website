import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
const source = readFileSync('src/server/partner-applications.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { handlePartnerApplication: handle, purgeExpiredPartnerApplications: purge } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const schema = 'PRAGMA foreign_keys=ON;' + readFileSync('migrations/0001_partner_applications.sql', 'utf8') + readFileSync('migrations/0002_partner_admin_notifications.sql', 'utf8');
const valid = () => ({ name: 'Demo Applicant', email: 'applicant@example.test', company: 'Example Studio', market: 'Example market', profileUrl: 'https://example.test', collaboration: 'commercial', approach: 'A synthetic proposal for a local hospitality pilot.', language: 'en', privacyAcknowledged: true, website: '' });
function harness() {
  const sql = new DatabaseSync(':memory:'); sql.exec(schema);
  const calls = [];
  const env = { PARTNER_INTAKE_ENABLED: 'true', PARTNER_FORM_SECRET: 'test-only-secret-at-least-32-characters',
    PARTNER_RATE_LIMITER: { limit: async ({ key }) => { calls.push(key); return { success: true }; } },
    PARTNER_APPLICATIONS_DB: {
      prepare(query) { return { bind(...values) { return { query, values }; } }; },
      async batch(statements) {
        sql.exec('BEGIN');
        try { const result = statements.map(({ query, values }) => ({ success: true, results: sql.prepare(query).all(...values) })); sql.exec('COMMIT'); return result; }
        catch (e) { sql.exec('ROLLBACK'); throw e; }
      }
    }
  };
  return { env, calls, sql, count: () => sql.prepare('SELECT count(*) AS n FROM partner_applications').get().n };
}
const request = (data = valid(), key = crypto.randomUUID(), extra = {}) => new Request('https://www.protcity.com/api/partner-applications', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://www.protcity.com', 'CF-Connecting-IP': '192.0.2.1', 'Idempotency-Key': key, ...extra }, body: JSON.stringify(data) });

test('valid application persists server-owned state and minimal metadata', async () => {
  const h = harness(); const res = await handle(request(), h.env);
  assert.equal(res.status, 202); assert.deepEqual(await res.json(), { received: true }); assert.equal(h.count(), 1);
  const row = h.sql.prepare('SELECT * FROM partner_applications').get();
  assert.equal(row.status, 'new'); assert.equal(row.source_path, '/en/partner-network');
  assert.equal(row.expires_at - row.created_at, 180 * 86400);
  assert.match(row.id, /^[a-f0-9-]{36}$/); assert.equal('ip' in row, false);
  assert.ok(h.calls.every(key => /^[a-f0-9]{64}$/.test(key)));
  assert.equal(res.headers.get('cache-control'), 'no-store');
});
test('retry and concurrent identical requests create one row', async () => {
  const h = harness(); const key = crypto.randomUUID();
  const results = await Promise.all(Array.from({ length: 8 }, () => handle(request(valid(), key), h.env)));
  assert.ok(results.every(r => r.status === 202)); assert.equal(h.count(), 1);
});
test('identical payload with different request keys still creates one application', async () => {
  const h = harness();
  const results = await Promise.all(Array.from({ length: 5 }, () => handle(request(), h.env)));
  assert.ok(results.every(r => r.status === 202)); assert.equal(h.count(), 1);
  assert.equal(h.sql.prepare('SELECT count(*) AS n FROM partner_application_receipts').get().n, 5);
});
test('same key with changed payload returns conflict and cannot overwrite original', async () => {
  const h = harness(); const key = crypto.randomUUID();
  assert.equal((await handle(request(valid(), key), h.env)).status, 202);
  assert.equal((await handle(request({ ...valid(), company: 'Changed company' }, key), h.env)).status, 409);
  assert.equal(h.sql.prepare('SELECT company FROM partner_applications').get().company, 'Example Studio');
});
test('SQL-like free text is stored as text; schema remains intact', async () => {
  const h = harness(); const value = { ...valid(), company: "Example'); DROP TABLE partner_applications; --" };
  assert.equal((await handle(request(value), h.env)).status, 202); assert.equal(h.count(), 1);
  assert.equal(h.sql.prepare('SELECT company FROM partner_applications').get().company, value.company);
});
for (const [name, edit] of Object.entries({
  privilege: d => ({ ...d, status: 'approved' }), role: d => ({ ...d, admin: true }),
  email: d => ({ ...d, email: 'bad@' }), url: d => ({ ...d, profileUrl: 'javascript:alert(1)' }),
  credentials: d => ({ ...d, profileUrl: 'https://user:pass@example.test' }),
  short: d => ({ ...d, approach: 'x' }), long: d => ({ ...d, name: 'x'.repeat(101) }),
  control: d => ({ ...d, name: 'Bad\u0000Name' }), enum: d => ({ ...d, collaboration: 'owner' }),
  locale: d => ({ ...d, language: 'xx' }), privacy: d => ({ ...d, privacyAcknowledged: false }),
  trap: d => ({ ...d, website: 'https://spam.test' }),
  wrongType: d => ({ ...d, market: [] })
})) test(`rejects ${name} without write`, async () => {
  const h = harness(); assert.equal((await handle(request(edit(valid())), h.env)).status, 400); assert.equal(h.count(), 0);
});
test('optional profile may be empty; Unicode names and markets remain valid', async () => {
  const h = harness(); assert.equal((await handle(request({ ...valid(), profileUrl: '', name: '山田 太郎', market: '日本 / 東京', language: 'it' }), h.env)).status, 202);
  assert.equal(h.sql.prepare('SELECT source_path FROM partner_applications').get().source_path, '/partner-network');
});
test('method, cross-origin, missing origin, media type and invalid key rejected', async () => {
  const h = harness();
  assert.equal((await handle(new Request('https://www.protcity.com/api/partner-applications'), h.env)).status, 405);
  assert.equal((await handle(request(valid(), crypto.randomUUID(), { Origin: 'https://evil.test' }), h.env)).status, 403);
  assert.equal((await handle(request(valid(), crypto.randomUUID(), { Origin: '' }), h.env)).status, 403);
  assert.equal((await handle(request(valid(), crypto.randomUUID(), { 'Content-Type': 'text/plain' }), h.env)).status, 415);
  assert.equal((await handle(request(valid(), 'not-a-uuid'), h.env)).status, 400); assert.equal(h.count(), 0);
});
test('malformed and oversized streaming bodies are bounded without Content-Length', async () => {
  const h = harness(); const headers = Object.fromEntries(request().headers);
  for (const [body, status] of [['{', 400], ['x'.repeat(13000), 413]]) {
    const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(body)); c.close(); } });
    const req = new Request('https://www.protcity.com/api/partner-applications', { method: 'POST', headers, body: stream, duplex: 'half' });
    assert.equal((await handle(req, h.env)).status, status);
  }
  assert.equal(h.count(), 0);
});
test('limiter rejects attempts before persistence, with Retry-After', async () => {
  const h = harness(); h.env.PARTNER_RATE_LIMITER.limit = async () => ({ success: false });
  const res = await handle(request(), h.env); assert.equal(res.status, 429); assert.equal(res.headers.get('retry-after'), '60'); assert.equal(h.count(), 0);
});
for (const key of ['PARTNER_INTAKE_ENABLED', 'PARTNER_FORM_SECRET', 'PARTNER_APPLICATIONS_DB', 'PARTNER_RATE_LIMITER']) test(`missing ${key} fails closed`, async () => {
  const h = harness(); delete h.env[key]; assert.equal((await handle(request(), h.env)).status, 503); assert.equal(h.count(), 0);
});
test('local-only configuration cannot accept production requests', async () => {
  const h = harness(); h.env.PARTNER_INTAKE_LOCAL_ONLY = 'true'; assert.equal((await handle(request(), h.env)).status, 403); assert.equal(h.count(), 0);
});
test('database and limiter failures never reveal exceptions or false success', async () => {
  for (const dependency of ['db', 'limiter']) {
    const h = harness();
    if (dependency === 'db') h.env.PARTNER_APPLICATIONS_DB.batch = async () => { throw Error('private-db-detail'); };
    else h.env.PARTNER_RATE_LIMITER.limit = async () => { throw Error('private-limiter-detail'); };
    const res = await handle(request(), h.env); assert.equal(res.status, 503); assert.deepEqual(await res.json(), { error: 'temporarily_unavailable' }); assert.equal(h.count(), 0);
  }
});
test('retention deletes expired records and receipts but keeps active applications', async () => {
  const h = harness(); await handle(request(), h.env);
  h.sql.exec('UPDATE partner_applications SET expires_at = 0; UPDATE partner_application_receipts SET expires_at = 0;');
  await handle(request({ ...valid(), company: 'New application' }), h.env);
  await purge(h.env); assert.equal(h.count(), 1);
  assert.equal(h.sql.prepare('SELECT company FROM partner_applications').get().company, 'New application');
  assert.equal(h.sql.prepare('SELECT count(*) AS n FROM partner_application_receipts').get().n, 1);
});

test('an expired identical application is renewed before the next purge', async () => {
  const h = harness(); const key = crypto.randomUUID(); await handle(request(valid(), key), h.env);
  const original = h.sql.prepare('SELECT id FROM partner_applications').get().id;
  h.sql.exec('UPDATE partner_applications SET expires_at = 0; UPDATE partner_application_receipts SET expires_at = 0;');
  assert.equal((await handle(request(valid(), key), h.env)).status, 202);
  await purge(h.env); assert.equal(h.count(), 1);
  assert.notEqual(h.sql.prepare('SELECT id FROM partner_applications').get().id, original);
});
test('purge drains multiple batches and preserves new rows', async () => {
  const h = harness(); await handle(request(), h.env);
  const receipt = h.sql.prepare('INSERT INTO partner_application_receipts VALUES (?, ?, 0)');
  const application = h.sql.prepare(`INSERT INTO partner_applications
    (id,payload_hash,created_at,expires_at,language,source_path,name,email,company,market,profile_url,collaboration,approach,privacy_notice_version)
    SELECT ?,?,0,0,language,source_path,name,email,company,market,profile_url,collaboration,approach,privacy_notice_version FROM partner_applications LIMIT 1`);
  for (let i = 0; i < 1005; i++) { receipt.run(`old-${i}`, `old-${i}`); application.run(`old-${i}`, `old-${i}`); }
  await purge(h.env); assert.equal(h.count(), 1);
  assert.equal(h.sql.prepare('SELECT count(*) AS n FROM partner_application_receipts').get().n, 1);
});
