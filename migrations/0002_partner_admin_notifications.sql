-- Additive migration on the dedicated partner database. No historical mail backfill.
ALTER TABLE partner_applications ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
CREATE INDEX partner_applications_page ON partner_applications(created_at DESC, id DESC);
CREATE INDEX partner_applications_status_page ON partner_applications(status, created_at DESC, id DESC);
CREATE TABLE partner_application_audit (
  operation_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES partner_applications(id) ON DELETE CASCADE,
  actor_uid TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  target_status TEXT NOT NULL,
  previous_version INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX partner_audit_application ON partner_application_audit(application_id);
CREATE TABLE partner_notification_outbox (
  application_id TEXT PRIMARY KEY REFERENCES partner_applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  last_attempt_at INTEGER,
  lease_token TEXT,
  lease_expires_at INTEGER,
  sent_at INTEGER
);
CREATE INDEX partner_notification_due ON partner_notification_outbox(status,next_attempt_at);
