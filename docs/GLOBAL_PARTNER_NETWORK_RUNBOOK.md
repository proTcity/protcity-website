# Global Partner Network — delivery and launch runbook

## Outcome
Implemented IT `/partner-network` and EN `/en/partner-network` in the existing Astro
site. `/partner` and `/en/partner` still describe Studio. Entry from each footer;
reciprocal language switch, canonical, hreflang, Open Graph/Twitter and sitemap.
International applications are welcome; activation and commercial terms are evaluated
individually. No automatic territory/exclusivity, income guarantees or Studio account.
No mobile, Firebase, existing product data or external email provider changes.

## Source and files
Authoritative source: `/Users/gianfilipposcirerisichella/Developer/protcity-website`.
Baseline commit: `2979b3c`; initial working tree clean. Development/preview in isolated
clone `/Users/gianfilipposcirerisichella/Developer/ProtCityApp/output/protcity-partner-network`.
- `src/components/partners/PartnerNetwork.astro`: common page and seven-field form.
- `src/data/partnerNetwork.ts`: all IT/EN copy, short application notice, error states.
- `src/styles/partner-network.css`: scoped responsive styling and SVG ecosystem.
- `src/pages/{,en/}partner-network.astro`: routes, reuse of MainLayout.
- `src/data/languages.ts`, `src/data/navigation.ts`, `public/sitemap.xml`: discovery/SEO.
- `src/scripts/partner-network.ts`: validation, idempotent retry, focus, gated analytics.
- `src/server/partner-applications.ts`: public intake and bounded retention drain.
- `src/worker.ts`: isolated exact intake route, scheduled cleanup; other routes retained.
- `migrations/0001_partner_applications.sql`: dedicated D1 schema, receipts and indexes.
- `wrangler.partner-network.local.jsonc`: LOCAL ONLY example, no production database ID.
- `src/partner-worker.d.ts`, `scripts/scope-worker-types.mjs`: generated binding/runtime
  types isolated as a module to avoid collisions with the browser DOM.
- `tests/partner-{intake,pages,worker-routing}.test.mjs`: targeted regression coverage.

Website currently has an explicit IT/EN route pair system; reuse that boundary rather
than introducing six new language shells. Production wrangler.jsonc now binds the dedicated intake resources. All package
dependency/lock declarations remain unchanged.

## Application flow and handling
POST `/api/partner-applications`, JSON, Origin matching canonical site; non-POST →405.
12,288-byte streaming limit; strict field allowlist and limits; no HTML interpretation,
URL fetching or client-supplied status. SQL values are bound, not interpolated.
Requires PARTNER_INTAKE_ENABLED=true, D1, Cloudflare limiter and server secret ≥32 chars.
Missing/unavailable dependencies →503; invalid requests →400/403/413/415; limit →429.
Cloudflare rate limiting is per location/eventually consistent, not a hard global quota.
Local example: five requests per minute per daily HMAC IP key (IP never saved in D1).
No honeypot fake-success; no errors expose SQL, data, tokens, IP, URLs or stack traces.

D1 batch atomically writes the hashed idempotency receipt and application. Same key with
changed payload →409; identical normalised payload under new keys is deduplicated for
its active retention window. Expired identical records are replaced on resubmission.
Success →202 only after the awaited batch, with no personal data returned. Lost-response
retry keeps the browser's request key; fields survive failures and clear after success.
There is no application-list/update API, no anonymous database reads and no new CRM.

Applications live in `partner_applications`, status `new`, created/expiry timestamps,
language, server-selected source path, seven fields, notice version. `assigned_to` and
`next_action_at` support manual follow-up. No marketing signup, analytics identifier,
raw referrer/query, raw IP, user agent, device token or third-party contact list is stored.

Initial operational owner: Gianfilippo, through the existing Kurbi Labs Cloudflare
account. No additional memberships or access grants were created. First release uses the
restricted Cloudflare D1 console/account to review records and update status. Grant only
necessary account permissions. Do not export personal data into source or task prompts.
No email is sent by this implementation: no existing website sending service was found.
`partners@protcity.com` remains an explicit visitor-initiated contact link, not a backend.
Future internal mail notifications should use durable delivery state/outbox and must not
be the sole copy of an application.

## Privacy / business approval items
The application and main privacy notices were aligned before publication: 180-day
operative retention plus normally24 hours for cleanup; recovery copies up to30 days.
Individual applicants use requested pre-contractual measures; company representatives
use legitimate professional relationship interests. EU D1 storage does not imply all
Cloudflare traffic processing occurs in the EU. Owner authorised publication.
Technical/copy review is not legal certification; internal vendor/processing governance
remains with Kurbi Labs. Acknowledgement is not marketing or
blanket GDPR consent. Link to existing privacy policy is clearly marked Italian in EN.
Confirm free application, support scope, partner compensation terms and market launch
criteria. The page intentionally does not promise training packages or support SLAs.

Scheduled cleanup processes up to ten batches of 1,000 records per table and raises
`partner_retention_backlog` if expired records remain. Daily cron `17 3 * * *` is configured. The owner reviews Worker Observability logs
for `partner_retention_completed`, `partner_retention_failed` and
`partner_intake_unavailable`, and checks scheduled invocation outcomes. No external
email notification is configured; drain backlog and investigate its cause.
Do not claim exact real-time deletion. Approved applicants still expire: move the necessary
commercial relationship to its separately governed system before application expiry.
Deletion requests require removing receipts linked to the application payload and the
application itself; this must be performed only by an authorised operator.

## Local verification / reproduction
No dependencies installed. Used the already-installed node_modules via symlink in the
isolated clone. Node24.14.1; declared runtime floor Node22.12. Tests use experimental
node:sqlite in this Node version; ensure SQLite is enabled when running on an older Node22.

1. `npm run build` (Astro check + static build).
2. `npm test` (includes compiled-page checks, so build first).
3. `node_modules/.bin/wrangler d1 migrations apply PARTNER_APPLICATIONS_DB --local --config wrangler.partner-network.local.jsonc`
4. `node_modules/.bin/wrangler dev --local --config wrangler.partner-network.local.jsonc --port 8787 --compatibility-date 2026-08-11`
5. Visit `http://localhost:8787/partner-network` and `/en/partner-network`.

Compatibility override is ONLY for this installed workerd: it supports through Aug11,
while the existing project's setting is Aug12. Production setting was not changed.
Exact production runtime/browser-device verification remains a launch gate. Never use
this synthetic LOCAL ONLY config for deployment; the handler rejects non-local hosts.
No .env/secrets from the real site were copied into the clone.

To regenerate runtime types using existing Wrangler:
`node_modules/.bin/wrangler types src/partner-worker.d.ts --config wrangler.jsonc --env-interface PartnerWorkerBindings --strict-vars false`
then `node scripts/scope-worker-types.mjs`. Do not hand-edit generated declarations.

## Evidence
Baseline: build/check pass, 15 existing tests pass.
Final suite: 51 tests pass, build/check zero errors/warnings/hints. A pre-existing Vite
large-chunk warning concerns the existing 3D experience, not the new page (no 3D import).
No separate lint script is declared; Astro check is the available static/type gate.
SQLite tests cover real prepared queries, rollback, concurrent retry, unique constraints,
malformed/oversized stream, hostile fields/URLs, missing/unavailable bindings, rate limit,
expiry resubmission, and deletion across more than 1,000 records.
Routing tests preserve Studio, canonical redirect, GuestSafe landing and Apple association.

Browser: Chromium via existing cached Playwright CLI, no installation. IT and EN at
320/375/390/430/768/1024/1440/1920 widths: no horizontal overflow. IT validation focus,
503 with retained fields, retry to real local D1, success focus verified. English 429 and
network failure with retry to real local D1 verified. Exactly one synthetic application
per language is stored as `new` (confirmed via aggregate local SQL).
Snapshots: `output/playwright/` in isolated clone (not production/repository source).
The deliberately mocked 503/429/offline requests produce expected browser network errors.
No real email, user signup, paid provider, production write, deploy, commit or push.

Independent review: two expiry findings resolved (bounded drain/backlog signal and atomic
resubmission after expiry). Browser verification also fixed first-invalid field focus and
preserved accessible button markup after a failed submission.

## Production activation — authorised 2026-09-13
Account: Kurbi Labs srls - proTcity (`47e82e07c982373e5d7f6a428b46abea`).
Worker: `protcity-website`; existing custom domains `protcity.com`, `www.protcity.com`.
Database: `protcity-partner-applications` (`8fd33135-0ffa-4d2e-b8de-b91f12670734`),
EU jurisdiction verified, read replication disabled. Six-statement initial migration
applied to this newly created empty database only.
Rate namespace202609131043,5 requests per60 seconds. Enabled=true, local_only=false.
Secret PARTNER_FORM_SECRET generated in memory, piped directly into Wrangler, never
stored in source or printed. Three existing Worker secrets retained. Required secret
names are declared for type generation and deployment checks.
Cron03:17UTC daily. Observability enabled, invocation logs and traces disabled.
Stable console event names only; no applicant fields in application logs.

Commands: `wrangler d1 create protcity-partner-applications --jurisdiction eu`,
`wrangler d1 migrations apply PARTNER_APPLICATIONS_DB --remote`,
`wrangler secret put PARTNER_FORM_SECRET` (secure stdin), `wrangler deploy --dry-run`,
then `wrangler deploy --keep-vars` after full checks and independent review.
No account/billing/plan changes, no mobile/Firebase/data access, no email sending.
Existing website daily source updates preserved by integrating origin/main snapshots
before release. Authoritative source must include this feature to prevent future
automated deployments from reverting it.

Rollback target captured before changes: `c84651e6-eb64-4850-a693-ccdcb6674109`.
`wrangler rollback c84651e6-eb64-4850-a693-ccdcb6674109 --message "Rollback partner launch"`
restores the prior site. Retain D1, do not delete real applications or restore the
database as a website rollback. Ensure the source used by future deployments matches
the intended rollback state. Alternatively disable PARTNER_INTAKE_ENABLED for explicit503.

## Operator handoff
Cloudflare dashboard > account Kurbi Labs srls - proTcity > Storage & databases > D1 >
protcity-partner-applications > Console. `partner_applications` contains submissions;
status begins at `new`. Review on business days, assess fit, contact manually when
appropriate. No automatic acceptance, product accounts or emails. Use narrowly scoped
queries and updates by id; keep applicant data out of Git, logs and support prompts.
For deletion, remove receipts by the record's payload_hash and the application in one
transaction. For recovery from Time Travel, reapply deletions/expiry before reopening
access. Do not bulk-export or restore without a specific operational instruction.

Final browser checks additionally passed: basic computed text-contrast checks (no failures
in sampled rendered text), keyboard language switch, CTA analytics blocked before consent
and after revocation using a local stub (no Google requests). This is not a WCAG conformity
certification or a real iOS/Android-device test. No real screen reader audit was performed.
Independent reviewer reran all three targeted retention tests: 3 passed, no remaining
material finding in the reviewed scope.
