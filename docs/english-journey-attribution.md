# English journey and acquisition labels

Implemented 30 August 2026 for the international launch preparation.

## Public routes

The five English pages are `/en`, `/en/download`, `/en/partner`, `/en/guestsafe`
and `/en/contact`. `src/data/languages.ts` maps them to the existing Italian
pages for the language switch and reciprocal `hreflang` tags. Each page has a
self-referencing canonical URL without campaign parameters. Other Italian
pages link to the English home, without claiming a direct translation exists.

The English navigation, footer and cookie banner are translated. Legal documents,
Studio registration and the Studio application have not been translated by this
change; links and hand-off copy identify the current Italian destination. Real
product images are retained and labelled as showing an Italian interface.

Studio copy describes editorial publishing, not civic case management or emergency
response. Presenza is free for one location and one operator within plan limits.
GuestSafe uses the existing mobile app; availability depends on plan and setup.
No share-capital information was added. Product Hunt scheduling was not changed.

## Attribution behaviour

- Untagged/direct visits keep neutral App Store and Google Play URLs.
- An explicit `ref=producthunt` becomes `utm_source=producthunt` and
  `utm_medium=referral`, unless an explicit source is already supplied.
- Only `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content` are carried.
  Labels must be 1–100 ASCII slug characters (letters, digits, `.`, `_`, `~`, `-`).
  Invalid labels, free text, email addresses, click IDs and unrelated query data
  are not copied into the campaign. A valid source is required.
- Labels travel in internal link URLs, including language changes. There is no
  campaign cookie or local/session storage. The original campaign is not retained
  across an unrelated new visit. With JavaScript disabled, links remain neutral.
- Existing destination campaign labels are respected. Third-party websites,
  email/telephone links, files and GuestSafe stay/API URLs are not tagged.
- Google Play receives URL-encoded campaign labels in its `referrer` parameter.
  This alone is not proof of an installation or an app-side attribution integration.
- App Store links remain neutral: native Apple campaign attribution requires a
  genuine provider token generated in App Store Connect. None was invented or
  copied from an unrelated account. A later integration must use a verified link.
- GA4 receives the sanitised campaign fields only after analytics consent. The
  page URL sent to GA4 excludes its query string. No advertising pixel was added.
- `store_click` measures clicks, **not installations**. Parameters: `store`,
  `page_path`, `page_language`, and supplied `acquisition_source`,
  `acquisition_medium`, `acquisition_campaign`. No click is queued without consent
  or after revocation. GA4 custom reporting may require custom dimensions; no
  GA4 property settings or conversion definitions were changed.
- Browser blockers, declined consent and JavaScript disabled can prevent website
  measurement. No claim is made that production GA4 events or store installs were
  observed merely because the implementation tests pass.

## Verification and release

Run `npm run build && npm test`, then `wrangler deploy --dry-run --keep-vars --strict`.
The tests check source handling, no forced Meta campaign, consent gating, translated
shells, canonical/alternate URLs, sitemap entries and generated internal links.
Browser checks cover the real Italian/English navigation and official store links.

Integrate `origin/main` before release: the Observatory workflow updates its data
and sitemap independently. Preserve those updates and the existing Worker secrets.
Publish to the existing `protcity-website` Worker using `--keep-vars --strict`.
The Worker routing and configuration are unchanged by this feature.

## Reference documentation

- [Astro pages and file-based routes](https://docs.astro.build/en/basics/astro-pages/)
- [GA4 campaign configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Apple campaign links and provider tokens](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links/)
- [Google Play Install Referrer](https://developer.android.com/google/play/installreferrer)
- [Cloudflare Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)
