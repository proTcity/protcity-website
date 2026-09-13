# Global Partner Network — execution plan

## Scope and baseline
User approved implementation after proposal review; accepts applications worldwide,
activation assessed individually. No publishing, production data, emails or mobile edits.
Source: /Users/gianfilipposcirerisichella/Developer/protcity-website, clean 2979b3c.
Isolated clone: output/protcity-partner-network, branch codex/global-partner-network.
Apply owner's ProtCity/AGENTS.md safety rules. High risk: public intake/personal data.
Baseline npm run build: Astro check 0 errors/warnings; build passes, pre-existing large
3D chunk warning. npm uses existing node_modules via symlink; no installation.

## Acceptance / design
- /partner-network and /en/partner-network, same static Astro MainLayout and tokens.
- Preserve /partner Studio, all existing backend/mobile contracts and deploy config.
- Seven editorial sections, actual product imagery, conditional commercial terms;
  no fabricated coverage, partners, SLAs, exclusivity or paid services.
- Localised seven-field application + privacy acknowledgement, no marketing signup.
- POST /api/partner-applications: same origin, bounded JSON, strict field validation,
  honeypot, Cloudflare rate binding, durable D1 writes with atomic idempotency.
- Fail closed unless feature flag, secret, limiter and D1 are configured. No public
  list/read/update API, no automatic product permissions or CRM.
- No provider exists for email intake in website: persist to D1, manual access through
  existing Cloudflare account; no new mail provider. Document operational owner gate.
- Source URL is server-derived from language, no query, referrer, analytics identifiers
  or third-party contacts. HMAC IP limiter keys never persisted, no raw IP logging.
- Retention proposal 180 days, indexed bounded scheduled purge; requires approval of
  privacy notice and scheduler before launch. Accepted commercial relationships need
  separate handling before expiry; no automatic indefinite retention.

## Files
New: shared PartnerNetwork.astro, partner-network copy/styles/client, two page routes,
server/partner-applications.ts, D1 migration, local-only Wrangler config and generated
types, tests, launch/operating documentation. Modify only worker route+scheduled purge,
footer navigation, languageRoutes, sitemap and package test/dev commands as necessary.
Original production wrangler.jsonc is preserved; activation requires reviewed bindings.

## Verification and rollout
Baseline then behavioural endpoint tests: oversized stream/malformed JSON/unknown fields,
origin/method, persistence failure, missing binding, rate-limit, duplicate/concurrent retry,
conflicting idempotency, SQL hostile strings, no privileges/PII leaks and cleanup.
Build/check, all existing tests, real local Worker/D1 smoke and browser validation for
IT/EN, 320–1920 widths, errors/success, keyboard, consent, links, metadata and visuals.
Independent architecture/security review under AGENTS §16 before completion.
Human launch gate: approve copy/privacy, create/bind D1, apply migration, set secret and
limiter, schedule retention, assign operator, stage smoke, explicit final deploy approval.
Stop for unrelated changes, insecure bindings, unverifiable writes or source mismatch.
Rollback: disable intake flag (503); revert isolated patch/deploy prior Worker; retain
existing applications securely, do not delete live database as rollback.

## Completion evidence
Implemented in isolated clone. Final build and 51 tests pass. Two reviewer expiry findings
fixed and independently rechecked (3 targeted tests pass). Browser IT/EN and16viewport
combinations pass; real local D1 holds one synthetic `new` application per language.
Preserved production config, dependency declarations, Studio and all mobile files.
Canonical source still clean at2979b3c before integration. Publish/provisioning not executed;
see GLOBAL_PARTNER_NETWORK_RUNBOOK.md for configuration and human launch approval gates.

## Authorised production launch — 2026-09-13
User expressly requested complete publication and all necessary Cloudflare setup. This
updates the earlier no-deployment scope. Account verified: Kurbi Labs srls - proTcity
47e82e07c982373e5d7f6a428b46abea. Worker protcity-website on existing two custom domains.
Production baseline c84651e6-eb64-4850-a693-ccdcb6674109, runtime2026-08-12, three
existing secrets preserved. New D1 protcity-partner-applications, EU jurisdiction verified.
Only new schema is migrated; only synthetic launch records are used for end-to-end tests.
Owner Gianfilippo remains the initial reviewer via the existing restricted Cloudflare
account; no role grants or external emails. Review Workers Logs for daily retention
completion/failure and intake failures; automatic email alerts are not configured.
Main privacy policy corrected for forms, purpose/basis, D1 hosting, backup retention.
This is technical/copy review against actual behavior, not a legal compliance certification.
Remote main contains only newer public Observatory snapshots; preserve those before
publication. Keep the authoritative deployment source aligned so daily deployments do
not remove the new feature. Stop on unrelated upstream code changes, missing preserved
secrets, failed database writes, failed checks or regression on existing routes.
Validation: dry-run, full build/test, independent review, live IT/EN page and API checks,
idempotent synthetic submission then exact synthetic-only cleanup, scheduled-event proof.
Rollback: restore the recorded Worker version; retain D1 and fix/redeploy source before
allowing future automated deployment. Never restore or delete live applicant data.
