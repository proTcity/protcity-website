-- Apply only to the dedicated partner-intake database, never an application database.
CREATE TABLE IF NOT EXISTS partner_application_receipts (
  key_hash TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS partner_receipts_expiry ON partner_application_receipts(expires_at);
CREATE TABLE IF NOT EXISTS partner_applications (
  id TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('it', 'en')),
  source_path TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  market TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  collaboration TEXT NOT NULL CHECK (collaboration IN ('introductions', 'commercial', 'market-development', 'explore')),
  approach TEXT NOT NULL,
  privacy_notice_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'qualified', 'contacted', 'rejected', 'approved')),
  assigned_to TEXT,
  next_action_at INTEGER
);
CREATE INDEX IF NOT EXISTS partner_applications_status_created ON partner_applications(status, created_at);
CREATE INDEX IF NOT EXISTS partner_applications_expiry ON partner_applications(expires_at);
