# Partner Admin inbox and owner email — release 2026-09-13

## Outcome and boundary
The existing Admin now provides /partner-applications: paginated list, status filter,
detail, status updates and notification state. Existing admin/superadmin roles only;
no Firebase claims, Security Rules, mobile code, dependencies, accounts or DNS changed.
Owner authorised implementation and online publication. Email recipient uses the
owner's already-verified destination in Cloudflare, stored as a Worker secret.

## Implementation
- src/server/partner-admin.ts: signed POST /api/internal/partner-applications,
  60-second HMAC freshness, strict bounded body, fixed allowlisted list/update commands.
- migrations/0002_partner_admin_notifications.sql: additive version/indexes,
  atomic optimistic status changes plus idempotent audit, durable notification outbox.
- src/server/partner-applications.ts: new submissions and outbox intent commit together;
  duplicate/retried submissions and old applications do not generate additional intent.
- src/server/partner-email.ts: fixed sender and configured recipient; minimal record ID
  and authenticated Admin link, no applicant fields; no candidate email.
- src/worker.ts, wrangler.jsonc: email cron every5minutes, retention daily03:17UTC.
- src/pages/privacy.astro: describes Admin hosting/auth and minimised internal alerts.
- tests/partner-{admin,email,intake,worker-routing}.test.mjs: behavioural regression tests.

Admin source is /Users/gianfilipposcirerisichella/Developer/ProtCityApp/protcity-admin:
app/(admin)/partner-applications/page.tsx, app/api/admin/partner-applications/route.ts,
src/lib/{partner-application-types,client-partner-applications,server-partner-applications}.ts,
src/components/{Sidebar,RouteGuard}.tsx, src/lib/rbac.ts and tests/partner-applications.test.mjs.
Its browser sends existing Firebase bearer tokens; the server verifies revoked tokens
and role permissions before signing. Body4096bytes, backend reply512000bytes,
list1..50, no URL PII, no caching or browser storage. Audit and concurrent update
commit in one D1 transaction. The browser reuses operationId after ambiguous failures
and blocks stale edits until reload.

## Delivery behaviour and operations
Statuses: new, reviewing, qualified, contacted, rejected, approved. Approval only marks
an internal evaluation; it does not activate a partner. Review new records regularly,
contact candidates manually when appropriate and update their status.
Email state sent means accepted by Cloudflare, not proof of inbox receipt. Every cron
claims at most10records; maximum6attempts, bounded exponential backoff60s..1h,
120-second lease recovery, provider20-second timeout. At-least-once sending can duplicate
an email after an ambiguous timeout; X-Protcity-Application is correlation, not provider
deduplication. The provider generates Message-ID. No historical email backfill.
Failed email cannot discard a saved application. After the sixth failure, investigate
Cloudflare and configuration; no automatic retry forever. Logs contain only stable
partner_email_batch counts / partner_email_batch_failed events, no applicant/provider
error contents. Recipient changes require an authorised configuration operation.

Existing180-day application retention cascades to its audit/outbox. Receipts are removed
on expiry or authorised deletion. Email contains only a record reference; mailbox
retention is separately controlled by the owner. No data export or real applicant
records were used in testing. No legal compliance certification is implied.

## Verification
Website npm run build:43pages, Astro0errors/0warnings/0hints; existing3Dchunk Vite warning.
Website npm test:75/75, including real SQLite atomicity/concurrency and6email tests.
Admin node --test tests/partner-applications.test.mjs:11/11. Targeted eslint and
TypeScript pass, npm run build pass in working source and isolated release source.
Independent review checked Admin/core/provider and reran tests; no material finding.
Browser: actual Admin page and CSS with synthetic auth/API fixtures,320/390/768/1440,
focus, no overflow, detail, pagination, empty/error/offline recovery, same-operation
retry, stale conflict, forbidden role without data/API. No physical device/screen reader.

## Publication isolation and rollback
Production Vercel baseline dpl_CCzfGuBufuUNBZt1NyR2oKcHvtcR had gitDirty=1. Its186
Admin source hashes were compared with local files. Isolated release restored the one
unrelated global-publish route from deployed source, retained all other matching files,
and overlaid only9feature paths. Local unrelated dirty changes were preserved.
No Admin-wide source rollback or unrelated mobile/backend changes were published.

Applied migration0002 before Worker, preserving applications and original secrets.
Worker ca80b9a9-64d8-4e86-853e-057cdcb2bed1; Vercel
 dpl_CuNdRDZR4xmHZWNcASzwF8CUGWQ5
 https://protcity-6luyyx7ad-protcitys-projects.vercel.app
built with production configuration under --skip-domain, unauthenticated API401 verified,
then promoted to admin.protcity.com. Final route200, API401/no-store/VaryAuthorization.

Rollback Admin using Vercel rollback to dpl_CCzfGuBufuUNBZt1NyR2oKcHvtcR. Rollback Worker
with wrangler rollback ad0c6d49-75e5-4a20-acb2-abdf0c6204e4 and a descriptive message.
Keep additive D1 schema and records; never restore/delete applicant data to undo code.
Alternatively disable PARTNER_EMAIL_ENABLED and publish reviewed config to pause email.
Align source to chosen version to prevent automated deployments restoring unwanted code.

## Live acceptance checks
Public EN browser form displayed success for one clearly synthetic application;
exact-marker D1 query confirmed one application and one pending outbox intent.
Node runtime signed endpoint: unsigned401, update200/version1, exact retry200/version1,
stale new operation409. Only that synthetic record was touched. Python's generic
HTTP client was denied403 by the edge; normal Node request succeeded unchanged.
No edge/auth protections were relaxed. Provider REST test to owner accepted without
errors. Actual cron at12:00UTC processed the synthetic outbox: sent, attempts1,
provider acceptance at12:00:08UTC. This verifies the configured scheduled Worker
and Email binding, not mailbox placement. GitHub CI succeeded:
https://github.com/proTcity/protcity-website/actions/runs/34755828363
Code commit7a684fa is aligned to origin/main.
Full live Firebase login-to-inbox UI was not exercised against real applicant data;
Firebase boundary was unit-stubbed and shared verifier reviewed, live unauth401 verified.

References checked:
https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
https://developers.cloudflare.com/email-service/configuration/send-bindings/
https://developers.cloudflare.com/email-service/reference/headers/

Synthetic cleanup used an exact ID + synthetic email + company predicate; receipt
and application deleted transactionally, audit/outbox cascade. No real submissions
were selected or changed. Generated temporary credential file was removed after tests.


## Navigation visibility correction — 2026-09-13
User could not discover the page: live /partner-network worked, but only the footer
linked it. Added Diventa partner / Become a partner to the shared primary navigation
in src/data/navigation.ts and src/data/languages.ts; avoided a duplicate English footer
entry. src/components/common/Header.astro uses the compact menu through1360px to keep
all links within the viewport, and a scrollable height-limited phone menu. Local browser
verified320x568 menu/link click and1280/1366/1440 header bounds plus English link click.
Build43pages and75tests pass; existing3Dchunk warning unchanged. No backend, data,
permissions, mobile or form changes. No new form submissions/emails used in this check.
Physical devices/screen-reader not retested for this navigation-only correction.
Rollback this navigation change by restoring these three source files from commit98b1d07
and rebuilding/deploying while preserving subsequent unrelated changes.

The GitHub email supplied by the owner referenced old run34752875474 /9d8ba58
(10:50UTC): Node22.12 required --experimental-sqlite. Fixed in1821280; the four
subsequent checked runs through98b1d07 passed. It was not a new incident or a page outage.
