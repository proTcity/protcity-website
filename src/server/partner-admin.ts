import type { PartnerIntakeEnv } from './partner-applications';

export interface PartnerAdminEnv extends PartnerIntakeEnv {
  PARTNER_ADMIN_SECRET?: string;
  PARTNER_EMAIL_ENABLED?: string;
}
const PATH = '/api/internal/partner-applications';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const STATUSES = ['new', 'reviewing', 'qualified', 'contacted', 'rejected', 'approved'];
const MAX_BYTES = 4096;
class AdminError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
const response = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow',
    ...(status === 405 ? { Allow: 'POST' } : {}) }
});
async function readBody(request: Request) {
  if (!request.body) throw new AdminError(400, 'invalid_input');
  const reader = request.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true });
  let length = 0, raw = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > MAX_BYTES) { await reader.cancel(); throw new AdminError(413, 'payload_too_large'); }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    return raw + decoder.decode();
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError(400, 'invalid_input');
  } finally { reader.releaseLock(); }
}
type ListAction = { action: 'list'; operatorUid: string; status: string | null; limit: number; cursor: [number, string] | null };
type UpdateAction = { action: 'update'; operatorUid: string; id: string; targetStatus: string; expectedVersion: number; operationId: string };
function validate(raw: string): ListAction | UpdateAction {
  let input: unknown;
  try { input = JSON.parse(raw); } catch { throw new AdminError(400, 'invalid_input'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AdminError(400, 'invalid_input');
  const data: Record<string, unknown> = Object.fromEntries(Object.entries(input));
  const allowed = data.action === 'list' ? ['action','operatorUid','status','limit','cursor'] : ['action','operatorUid','id','targetStatus','expectedVersion','operationId'];
  if (Object.keys(data).some(key => !allowed.includes(key)) || typeof data.operatorUid !== 'string' || !data.operatorUid.trim() || data.operatorUid.length > 128 || /[\u0000-\u001f\u007f]/u.test(data.operatorUid)) throw new AdminError(400, 'invalid_input');
  if (data.action === 'list') {
    if (!(data.status === null || typeof data.status === 'string' && STATUSES.includes(data.status)) || typeof data.limit !== 'number' || !Number.isInteger(data.limit) || data.limit < 1 || data.limit > 50) throw new AdminError(400, 'invalid_input');
    let cursor: [number,string] | null = null;
    if (data.cursor !== null) {
      if (typeof data.cursor !== 'string' || data.cursor.length > 256 || !/^[a-zA-Z0-9_-]+$/.test(data.cursor)) throw new AdminError(400, 'invalid_cursor');
      try {
        const decoded: unknown = JSON.parse(atob(data.cursor.replace(/-/g, '+').replace(/_/g, '/')));
        if (!Array.isArray(decoded) || decoded.length !== 2 || !Number.isSafeInteger(decoded[0]) || decoded[0] < 0 || typeof decoded[1] !== 'string' || !UUID.test(decoded[1])) throw new Error('invalid');
        cursor = [decoded[0], decoded[1]];
      } catch { throw new AdminError(400, 'invalid_cursor'); }
    }
    return { action: 'list', operatorUid: data.operatorUid, status: data.status, limit: data.limit, cursor };
  }
  if (data.action !== 'update' || typeof data.id !== 'string' || !UUID.test(data.id) || typeof data.operationId !== 'string' || !UUID.test(data.operationId) || typeof data.targetStatus !== 'string' || !STATUSES.includes(data.targetStatus) || typeof data.expectedVersion !== 'number' || !Number.isSafeInteger(data.expectedVersion) || data.expectedVersion < 0) throw new AdminError(400, 'invalid_input');
  return { action: 'update', operatorUid: data.operatorUid, id: data.id, operationId: data.operationId, targetStatus: data.targetStatus, expectedVersion: data.expectedVersion };
}
const columns = `a.id,a.name,a.email,a.company,a.market,a.profile_url,a.collaboration,a.approach,a.language,
  a.created_at,a.expires_at,a.status,a.version, COALESCE(n.status,'not_scheduled') AS notification_status,
  COALESCE(n.attempts,0) AS notification_attempts,n.last_attempt_at`;
const from = 'FROM partner_applications a LEFT JOIN partner_notification_outbox n ON n.application_id=a.id';
type Row = {id:string;name:string;email:string;company:string;market:string;profile_url:string;collaboration:string;approach:string;language:string;created_at:number;expires_at:number;status:string;version:number;notification_status:string;notification_attempts:number;last_attempt_at:number|null};
const item = (row: Row) => ({ id: row.id, name: row.name, email: row.email, company: row.company,
  market: row.market, profileUrl: row.profile_url, collaboration: row.collaboration, approach: row.approach,
  language: row.language, createdAt: row.created_at, expiresAt: row.expires_at, status: row.status, version: row.version,
  notification: { status: row.notification_status, attempts: row.notification_attempts, lastAttemptAt: row.last_attempt_at } });

/** Only the trusted Admin server may call this endpoint. Its Firebase RBAC check is
 * required before signing; this shared secret never appears in the browser. */
export async function handlePartnerAdmin(request: Request, env: PartnerAdminEnv): Promise<Response> {
  try {
    if (request.method !== 'POST') throw new AdminError(405, 'method_not_allowed');
    const url = new URL(request.url);
    const localHost = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
    if (url.pathname !== PATH || url.search || (env.PARTNER_INTAKE_LOCAL_ONLY === 'true' ? !localHost : url.origin !== 'https://www.protcity.com')) throw new AdminError(403, 'forbidden');
    const secret = env.PARTNER_ADMIN_SECRET, db = env.PARTNER_APPLICATIONS_DB;
    if (!secret || secret.length < 32 || !db) throw new AdminError(503, 'temporarily_unavailable');
    const stamp = request.headers.get('x-partner-timestamp') || '', signature = request.headers.get('x-partner-signature') || '';
    const now = Math.floor(Date.now() / 1000);
    if (!/^\d{10}$/.test(stamp) || Math.abs(now - Number(stamp)) > 60 || !/^[0-9a-f]{64}$/.test(signature)) throw new AdminError(401, 'unauthorized');
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new AdminError(415, 'unsupported_media_type');
    const raw = await readBody(request), encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const bytes = Uint8Array.from(signature.match(/../g) || [], part => parseInt(part,16));
    if (!await crypto.subtle.verify('HMAC', key, bytes, encoder.encode(`${stamp}.${PATH}.${raw}`))) throw new AdminError(401, 'unauthorized');
    const action = validate(raw);
    if (action.action === 'list') {
      const values: (string|number)[] = [now], filters = ['a.expires_at > ?'];
      if (action.status !== null) { filters.push('a.status = ?'); values.push(action.status); }
      if (action.cursor) { filters.push('(a.created_at < ? OR (a.created_at = ? AND a.id < ?))'); values.push(action.cursor[0],action.cursor[0],action.cursor[1]); }
      const results = await db.batch<Row>([db.prepare(`SELECT ${columns} ${from} WHERE ${filters.join(' AND ')} ORDER BY a.created_at DESC,a.id DESC LIMIT ?`).bind(...values,action.limit+1)]);
      if (!results[0]?.success) throw new AdminError(503, 'temporarily_unavailable');
      const rows = results[0].results.slice(0,action.limit), last = rows.at(-1);
      const nextCursor = results[0].results.length > action.limit && last ? btoa(JSON.stringify([last.created_at,last.id])).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'') : null;
      return response(200,{ items: rows.map(item), nextCursor });
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(action)));
    const hash = Array.from(new Uint8Array(hashBuffer), byte => byte.toString(16).padStart(2,'0')).join('');
    // Audit insert, optimistic mutation and authoritative read commit together. An
    // operation ID can never be reused for a different actor, target or intent.
    const results = await db.batch<Row & { request_hash: string }>([
      db.prepare(`INSERT INTO partner_application_audit(operation_id,application_id,actor_uid,request_hash,previous_status,target_status,previous_version,created_at)
        SELECT ?,id,?,?,status,?,version,? FROM partner_applications
        WHERE id=? AND version=? AND expires_at>? ON CONFLICT(operation_id) DO NOTHING`)
        .bind(action.operationId,action.operatorUid,hash,action.targetStatus,now,action.id,action.expectedVersion,now),
      db.prepare(`UPDATE partner_applications SET status=?,version=version+1 WHERE id=? AND version=? AND expires_at>?
        AND EXISTS(SELECT 1 FROM partner_application_audit WHERE operation_id=? AND application_id=? AND request_hash=?)`)
        .bind(action.targetStatus,action.id,action.expectedVersion,now,action.operationId,action.id,hash),
      db.prepare('SELECT request_hash FROM partner_application_audit WHERE operation_id=?').bind(action.operationId),
      db.prepare(`SELECT ${columns} ${from} WHERE a.id=? AND a.expires_at>?`).bind(action.id,now)
    ]);
    if (results.some(result => !result.success)) throw new AdminError(503, 'temporarily_unavailable');
    const audit = results[2]?.results[0], current = results[3]?.results[0];
    if (!current) throw new AdminError(404, 'not_found');
    if (!audit || audit.request_hash !== hash) throw new AdminError(409, 'version_conflict');
    if (current.id !== action.id || typeof current.version !== 'number') throw new AdminError(503, 'temporarily_unavailable');
    return response(200,{item:item(current)});
  } catch (error) {
    if (error instanceof AdminError) return response(error.status,{error:error.code});
    console.error(JSON.stringify({event:'partner_admin_unavailable'}));
    return response(503,{error:'temporarily_unavailable'});
  }
}

export type PartnerNotification = { applicationId: string; messageId: string };
/** Fixed recipient/content lives in the provider wrapper, never in D1 or caller input.
 * Provider acceptance is at-least-once; a timeout can lead to a later duplicate. */
export async function processPartnerNotifications(env: PartnerAdminEnv, send: (notification: PartnerNotification) => Promise<void>) {
  const db = env.PARTNER_APPLICATIONS_DB;
  if (env.PARTNER_EMAIL_ENABLED !== 'true' || !db) return {sent:0,failed:0};
  const now = Math.floor(Date.now()/1000), maxAttempts = 6;
  // Recover exhausted leases without issuing an unbounded seventh provider call.
  const ready = await db.batch<{application_id:string}>([
    db.prepare(`UPDATE partner_notification_outbox SET status='failed',lease_token=NULL,lease_expires_at=NULL
      WHERE status='sending' AND lease_expires_at<=? AND attempts>=?`).bind(now,maxAttempts),
    db.prepare(`SELECT n.application_id FROM partner_notification_outbox n JOIN partner_applications a ON a.id=n.application_id
      WHERE a.expires_at>? AND n.attempts<? AND ((n.status='pending' AND n.next_attempt_at<=?) OR (n.status='sending' AND n.lease_expires_at<=?))
      ORDER BY n.next_attempt_at,n.application_id LIMIT 10`).bind(now,maxAttempts,now,now)
  ]);
  if (ready.some(result=>!result.success)) throw new Error('partner_notification_storage_failed');
  let sent=0,failed=0;
  for (const candidate of ready[1].results) {
    const lease = crypto.randomUUID(), claimedAt = Math.floor(Date.now()/1000);
    const claim = await db.batch<{attempts:number}>([
      db.prepare(`UPDATE partner_notification_outbox SET status='sending',attempts=attempts+1,last_attempt_at=?,lease_token=?,lease_expires_at=?
        WHERE application_id=? AND attempts<? AND ((status='pending' AND next_attempt_at<=?) OR (status='sending' AND lease_expires_at<=?))
        AND EXISTS(SELECT 1 FROM partner_applications WHERE id=? AND expires_at>?) RETURNING attempts`)
        .bind(claimedAt,lease,claimedAt+120,candidate.application_id,maxAttempts,claimedAt,claimedAt,candidate.application_id,claimedAt)
    ]);
    if (!claim[0]?.success) throw new Error('partner_notification_storage_failed');
    const row = claim[0].results[0]; if (!row) continue;
    let accepted=false;
    try {
      await send({applicationId:candidate.application_id,messageId:`partner-${candidate.application_id}@protcity.com`}); accepted=true;
    } catch { /* Only stable status is retained; provider errors may contain PII. */ }
    const finishedAt=Math.floor(Date.now()/1000);
    const result=await db.batch([
      db.prepare(`UPDATE partner_notification_outbox SET status=?,next_attempt_at=?,sent_at=?,lease_token=NULL,lease_expires_at=NULL
        WHERE application_id=? AND status='sending' AND lease_token=?`).bind(accepted?'sent':row.attempts>=maxAttempts?'failed':'pending',
          finishedAt+Math.min(3600,60*2**(row.attempts-1)),accepted?finishedAt:null,candidate.application_id,lease)
    ]);
    if (!result[0]?.success) throw new Error('partner_notification_storage_failed');
    if(accepted) sent++; else failed++;
  }
  return {sent,failed};
}
