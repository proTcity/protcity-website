# Cinematic home — 2026-09-15

## Objective and acceptance
Replace the home page's schematic floating city blocks with a cinematic, realistic urban opening and an intelligible interactive explanation: observe local signals, understand a walking route, discover useful places. Preserve store destinations, consent, navigation, SEO and all application/backend contracts. Italian and English home pages share the same experience and translated copy. No mobile changes.

## Findings and scope
The existing Italian `src/pages/index.astro` mounts `LivingCityExperience.tsx` twice. Its box-only buildings, floating screenshots and 620vh scroll scene obscure the product. English `src/pages/en/index.astro` has a separate static phone hero. Existing React Three Fiber and Three dependencies suffice. No nearer AGENTS exists; owner's designated `ProtCityApp/ProtCity/AGENTS.md` read fully. Original website working tree clean at `18bcf36`; isolated worktree `/private/tmp/protcity-home-cinematic`, branch `codex/cinematic-home`. Risk medium: public visual feature and runtime animation, no public API or protected surface changes.

## Design and boundaries
- Full-width original illustrative city photograph at blue hour: believable facades, warm windows, receding streets. It is AI-generated illustration, not a live city view or actual mapping data.
- HTML headline, actual download links, example signal callouts and route overlay remain legible. Slow camera movement/parallax, differentiated depths, pause and reduced motion.
- Separate on-demand WebGL neighborhood with realistic architectural details, three explicit selectable stories. Static poster before load and on failure; no scroll hijacking or several screenfuls of mandatory cinematic scrolling.
- Existing Studio/GuestSafe shared scene unchanged. No forms, API, authentication, telemetry or database modifications.
- Generated image optimized to responsive AVIF/WebP. Native image source committed only in web formats; prompt and provenance documented. No 8K-resolution or live-data claim.

## Implementation and verification
1. Build/test baseline (tests depend on built dist; first pre-build run found missing dist only).
2. Generate and optimize image, create localized home data, hero, animation controller and explanatory city section.
3. Independent 3D component implementation and regression/performance review.
4. Build/check, full existing tests, diff check. Browser inspection at desktop and phone widths; all story controls, pause, reduced-motion/fallback, menu and store links. Read console logs.
5. Synchronize only task files after verifying upstream state. Production publication uses existing owner's explicit website/Cloudflare authorization, only after concrete local proof. No email/push/data operations.

## Performance, safety and compatibility
Only synthetic scene assets, no location or permission requests. Image loads without JavaScript, WebGL code lazy and bounded DPR; no animation offscreen/hidden/paused and accessible text independent of canvas. Preserve probabilistic decision-support positioning, no guaranteed safety or delivery claims. Renderer failure shows poster plus fully operable story text. All control labels IT/EN, websites' established locale support; mobile app locales untouched.

## Release / rollback / stop conditions
Target existing Cloudflare `protcity-website`, account `47e82e07c982373e5d7f6a428b46abea`, domains protcity.com/www.protcity.com. Preserve all Worker/D1/email/secrets/cron configurations. Inspect current deployment and upstream before publication. Stop on broken route, tests/type errors, unreadable mobile layout, WebGL failure without fallback or unrelated changes. Roll back to verified pre-release Worker version; revert only cinematic home source/assets if future deployment rollback needed. Verify live IT/EN and partner navigation. Do not mutate production applicant data.

## Completion evidence
- Completed both locale home pages, generated responsive assets, original photo facade, progressive WebGL scene and motion lifecycle.
- `npm run build`: Astro check 0 errors / 0 warnings; 43 pages built. Existing Vite large-chunk advisory remains for the Three/R3F bundle.
- `npm test`: 82/82 passed. One earlier run exposed an unchanged partner-admin test timing flake: future timestamp +61 becomes +60 when the second rolls over; isolated rerun 14/14 and full rerun 82/82 passed. Backend/test were not changed.
- Independent review: initial CSS namespace, English contrast and WebGL initialization findings resolved; no remaining P1/P2 identified.
- Browser checks on production build: Italian and English, 320px and 390px iframe viewports, normal 1090px desktop viewport, no horizontal overflow; primary/store/product links, mobile menu, all three step controls and pause. Mobile 3D activation and route camera inspected visually.
- Local injected WebGL-unavailable case: photo and all three story controls remain working, no new browser exception. Reduced-motion JS emulation: hero paused and WebGL requires activation; CSS media rule and motion unit tests also checked. No claim of physical-device or OS-level reduced-motion certification.
- Wrangler dry-run succeeded with unchanged bindings. Deployment target verified as the existing protcity-website Worker, account 47e82e07c982373e5d7f6a428b46abea. Previous version for rollback: ec3e9b35-f1b4-4757-b778-6d2ae4b1cdf2.
- Upstream official observatory data synchronized from origin/main c96e43d before feature publication. No mobile, backend, dependency or infrastructure configuration changes.
