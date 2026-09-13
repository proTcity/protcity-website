import type { PartnerWorkerBindings } from '../partner-worker';
/** Public intake only: no user roles, Firebase access or public application reads. */
export type PartnerIntakeEnv = Partial<Pick<PartnerWorkerBindings,
  'PARTNER_APPLICATIONS_DB' | 'PARTNER_RATE_LIMITER' | 'PARTNER_INTAKE_ENABLED' |
  'PARTNER_INTAKE_LOCAL_ONLY' | 'PARTNER_FORM_SECRET'>>;

export const PRIVACY_VERSION = 'partner-intake-2026-09-13';
export const RETENTION_SECONDS = 180 * 24 * 60 * 60;
const MAX_BYTES = 12_288;
const fields = ['name', 'email', 'company', 'market', 'profileUrl', 'collaboration', 'approach', 'language', 'privacyAcknowledged', 'website'];
const roles = ['introductions', 'commercial', 'market-development', 'explore'];
type Application = {
  name: string; email: string; company: string; market: string; profileUrl: string;
  collaboration: string; approach: string; language: 'it' | 'en';
};
class IntakeError extends Error {
  constructor(public status: number, public code: string, public field?: string) { super(code); }
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow',
    ...(status === 429 ? { 'Retry-After': '60' } : {}),
    ...(status === 405 ? { Allow: 'POST' } : {})
  }
});

function validate(input: unknown): Application {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new IntakeError(400, 'invalid_input');
  const data: Record<string, unknown> = Object.fromEntries(Object.entries(input));
  if (Object.keys(data).some(key => !fields.includes(key))) throw new IntakeError(400, 'invalid_input');
  const text = (field: string, min: number, max: number) => {
    const raw = data[field];
    if (typeof raw !== 'string') throw new IntakeError(400, 'invalid_field', field);
    const value = raw.trim().normalize('NFC');
    if (value.length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) throw new IntakeError(400, 'invalid_field', field);
    return value;
  };
  if (data.website !== '') throw new IntakeError(400, 'invalid_input');
  if (data.privacyAcknowledged !== true) throw new IntakeError(400, 'invalid_field', 'privacyAcknowledged');
  if (data.language !== 'it' && data.language !== 'en') throw new IntakeError(400, 'invalid_field', 'language');
  const email = text('email', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) throw new IntakeError(400, 'invalid_field', 'email');
  const profileUrl = text('profileUrl', 0, 400);
  if (profileUrl) {
    let url: URL;
    try { url = new URL(profileUrl); } catch { throw new IntakeError(400, 'invalid_field', 'profileUrl'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new IntakeError(400, 'invalid_field', 'profileUrl');
    // This URL is stored as text, never fetched, embedded or auto-linked by the server.
  }
  const collaboration = text('collaboration', 1, 30);
  if (!roles.includes(collaboration)) throw new IntakeError(400, 'invalid_field', 'collaboration');
  return { name: text('name', 2, 100), email, company: text('company', 2, 150),
    market: text('market', 2, 120), profileUrl, collaboration,
    approach: text('approach', 30, 2000), language: data.language };
}

async function readJson(request: Request): Promise<unknown> {
  if (!request.body) throw new IntakeError(400, 'invalid_input');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0, body = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new IntakeError(413, 'payload_too_large');
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body);
  } catch (error) {
    if (error instanceof IntakeError) throw error;
    throw new IntakeError(400, 'invalid_input');
  } finally { reader.releaseLock(); }
}

async function digest(secret: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(signed), value => value.toString(16).padStart(2, '0')).join('');
}

export async function handlePartnerApplication(request: Request, env: PartnerIntakeEnv): Promise<Response> {
  try {
    if (request.method !== 'POST') throw new IntakeError(405, 'method_not_allowed');
    const url = new URL(request.url);
    const local = env.PARTNER_INTAKE_LOCAL_ONLY === 'true';
    const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (local ? !localHost : url.origin !== 'https://www.protcity.com') throw new IntakeError(403, 'origin_not_allowed');
    if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') throw new IntakeError(403, 'origin_not_allowed');
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new IntakeError(415, 'unsupported_media_type');
    const key = request.headers.get('Idempotency-Key') || '';
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(key)) throw new IntakeError(400, 'invalid_request_key');
    const { PARTNER_APPLICATIONS_DB: db, PARTNER_RATE_LIMITER: limiter, PARTNER_FORM_SECRET: secret } = env;
    if (env.PARTNER_INTAKE_ENABLED !== 'true' || !db || !limiter || !secret || secret.length < 32) throw new IntakeError(503, 'temporarily_unavailable');
    const ip = local ? 'local-test' : request.headers.get('CF-Connecting-IP');
    if (!ip) throw new IntakeError(503, 'temporarily_unavailable');
    const day = Math.floor(Date.now() / 86_400_000);
    const rateKey = await digest(secret, `ip:${day}:${ip}`);
    if (!(await limiter.limit({ key: rateKey })).success) throw new IntakeError(429, 'too_many_requests');
    const app = validate(await readJson(request));
    const keyHash = await digest(secret, `key:${key.toLowerCase()}`);
    const payloadHash = await digest(secret, `application:${JSON.stringify(app)}`);
    const now = Math.floor(Date.now() / 1000), expires = now + RETENTION_SECONDS;
    const applicationId = crypto.randomUUID();
    // Atomic receipt + application. A committed write followed by a lost response can
    // safely be retried; both same-key and same-payload races keep a single application.
    const results = await db.batch([
      db.prepare('DELETE FROM partner_application_receipts WHERE key_hash = ? AND expires_at <= ?').bind(keyHash, now),
      db.prepare('DELETE FROM partner_applications WHERE payload_hash = ? AND expires_at <= ?').bind(payloadHash, now),
      db.prepare('INSERT INTO partner_application_receipts (key_hash, payload_hash, expires_at) VALUES (?, ?, ?) ON CONFLICT(key_hash) DO NOTHING').bind(keyHash, payloadHash, expires),
      db.prepare(`INSERT INTO partner_applications
        (id, payload_hash, created_at, expires_at, language, source_path, name, email, company, market, profile_url, collaboration, approach, privacy_notice_version, status)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new'
        WHERE EXISTS (SELECT 1 FROM partner_application_receipts WHERE key_hash = ? AND payload_hash = ?)
        ON CONFLICT(payload_hash) DO NOTHING`).bind(applicationId, payloadHash, now, expires,
          app.language, app.language === 'en' ? '/en/partner-network' : '/partner-network',
          app.name, app.email, app.company, app.market, app.profileUrl, app.collaboration, app.approach, PRIVACY_VERSION, keyHash, payloadHash),
      db.prepare('SELECT payload_hash FROM partner_application_receipts WHERE key_hash = ?').bind(keyHash),
      // The generated ID exists only on a new insert, never a retry or historic row.
      db.prepare(`INSERT INTO partner_notification_outbox(application_id,next_attempt_at)
        SELECT id, ? FROM partner_applications WHERE id = ?
        ON CONFLICT(application_id) DO NOTHING`).bind(now, applicationId)
    ]);
    if (results.some(result => !result.success)) throw new IntakeError(503, 'temporarily_unavailable');
    const receipt = results[4]?.results[0];
    if (!receipt || typeof receipt !== 'object' || !('payload_hash' in receipt) || receipt.payload_hash !== payloadHash) throw new IntakeError(409, 'request_conflict');
    return json(202, { received: true });
  } catch (error) {
    if (error instanceof IntakeError) return json(error.status, { error: error.code, ...(error.field ? { field: error.field } : {}) });
    // No submitted text, DB exception, identity, URL or IP in logs or public errors.
    console.error(JSON.stringify({ event: 'partner_intake_unavailable' }));
    return json(503, { error: 'temporarily_unavailable' });
  }
}

export async function purgeExpiredPartnerApplications(env: PartnerIntakeEnv) {
  if (!env.PARTNER_APPLICATIONS_DB) return;
  const db = env.PARTNER_APPLICATIONS_DB;
  const now = Math.floor(Date.now() / 1000);
  // Bounded drain; backlog raises a failed cron rather than silently accumulating.
  for (let pass = 0; pass < 10; pass++) {
    const results = await db.batch([
      db.prepare('DELETE FROM partner_applications WHERE id IN (SELECT id FROM partner_applications WHERE expires_at <= ? ORDER BY expires_at LIMIT 1000)').bind(now),
      db.prepare('DELETE FROM partner_application_receipts WHERE key_hash IN (SELECT key_hash FROM partner_application_receipts WHERE expires_at <= ? ORDER BY expires_at LIMIT 1000)').bind(now),
      db.prepare('SELECT 1 AS expired FROM partner_applications WHERE expires_at <= ? LIMIT 1').bind(now),
      db.prepare('SELECT 1 AS expired FROM partner_application_receipts WHERE expires_at <= ? LIMIT 1').bind(now)
    ]);
    if (results.some(result => !result.success)) throw new Error('partner_retention_failed');
    if (!results[2]?.results.length && !results[3]?.results.length) return;
  }
  throw new Error('partner_retention_backlog');
}
