# RUN RECEIPT — GA4 release with Realtime receipt, Bing/GSC verification

## Run Metadata

- Date: 2026-10-20
- Time: 21:39–22:50
- Timezone: UTC (operator America/New_York)
- Agent: Claude (Cowork, Claude in Chrome)
- Model if known: claude-opus-5-5 (configured)
- Repository: https://github.com/tomytomz1/CIPP-IN
- Branch: feat/indy-consented-ga4 → main (PR #18); docs/indy-workers-builds-release (PR #20); docs/indy-analytics-release-receipt (this receipt)
- Starting SHA: `ae1e340aa3b6d492153c6ed86689c9783a212182` (PR #18 head); main `5fd2bf82066fe18ce6cf832a33cd14f62505d0cb`
- Ending/work commit: the commit containing this receipt; resolve with git log. Code release: main `6134089` (PR #20 merge) containing PR #18 merge `018dd3b` (head `c59c631`).
- Run result: COMPLETE (analytics/webmaster setup and release). GSC/Bing report data still processing on Google's/Microsoft's side.

## Operator Request

Finish the existing analytics/webmaster setup for Indy Sewer Resource in the operator's signed-in Chrome: verify Bing with the existing CNAME and inspect reports; verify/configure existing GA4 property 559890873 (Enhanced Measurement off, signals/ads personalization off, retention minimum, no extra destinations); establish a documented way to separate deliberate validation traffic; merge PR #18 normally and deploy the existing Worker with `PUBLIC_GA4_ENABLED=true`; verify actual GA4 collection and Realtime receipt; inspect GSC; verify production SEO/security invariants; determine Cloudflare RUM handling; update docs and receipts. Keep noindex, empty sitemap, disabled lead intake and DNS intact; no TinyFish/GSC Wizard.

## Instructions / Requirements Read

AGENTS.md (complete), CLAUDE.md, docs/01-CURRENT-STATE.md (relevant sections), docs/05-BUILD-SPEC.md (Deployment, Branch governance, Analytics), logs/RUN-LOG.md (tail), logs/RUN-RECEIPT-TEMPLATE.md, logs/runs/2026-10-20-2133-windsor-access-confirmed.md, PR #18 diff (all source/test/CI files), public/analytics.js, scripts/build-production.ts, wrangler.jsonc, .github/CODEOWNERS, package.json. docs/00-PROJECT-CHARTER.md and docs/03-GOOGLE-RESILIENCE.md were not re-read in full this session (no indexable-content or strategy change was made).

## Starting State Observed

- PR #18 draft, head `ae1e340`, branch contained main. GA4 OFF; production Worker `489d30b2-3e33-4089-b48d-5a34f3c50781`.
- Bing: site present, "Not verified". GA4 stream had Enhanced Measurement ON, Google-tag automatic event detection ON (6 types), Google-tag user-provided data capabilities ON (auto email/phone/name), ads personalization allowed in 307/307 regions, user retention 14 months.
- Cloud shell: GitHub clone works; push denied by proxy; GH_TOKEN invalid; Cloudflare API, Google and the site itself unreachable (proxy 403). No Wrangler-capable runtime.

## Work Performed

1. **Bing** — opened existing site, chose the CNAME method (name `ed9d7ef6dea8205062a8de3d46fbe31c` → `verify.bing.com`, matching the existing record), clicked Verify. Site list no longer shows "Not verified". Search Performance: "check back in 48 hours"; Site Explorer: no data; Sitemaps: 0 known. Nothing submitted.
2. **GA4 Admin (property 559890873, account 411247031, stream 16169153624)** — observed and changed settings exactly as listed in `docs/05-BUILD-SPEC.md` → Analytics → "Account settings observed and changed". Summary of changes: Enhanced Measurement OFF; Google-tag automatic detection OFF for history page views/scrolls/outbound/forms/video/downloads; Google-tag user-provided data capabilities OFF; Restrict advertising data transmission ON; ads personalization 0/307 regions; user-data retention 14→2 months (event retention already 2 months). Observed: signals OFF, property user-provided data OFF, no Ads links, 0 connected site tags, single destination, no IP rules, "Internal Traffic" filter (traffic_type=internal, Exclude, Testing). No MP secret, no new property/stream.
3. **Validation marker** — smallest change in `public/analytics.js`: exported `isValidationVisit(href)`; when `?analytics=validate` and the visitor clicks Allow, `traffic_type: 'internal'` is added to the config and the single page_view. Never grants consent, never persisted. Added a unit test and a browser test. Committed via GitHub web editor: `bbdf981`, `f21563a`, `0699d21`. CI `analytics-production-build` failed on `0699d21` (my new test read dataLayer before the stubbed script's load event); fixed with `expect.poll` in `c59c631`; all 5 CI jobs then passed.
4. **Merge** — marked PR #18 ready; the agent's merge click was blocked by the session safety classifier, so the operator merged it (`018dd3b`, tree identical to tested `c59c631`).
5. **Deployment** — with operator approval, connected Cloudflare Workers Builds to the EXISTING Worker: installed the Cloudflare Workers and Pages GitHub app on `tomytomz1/CIPP-IN` only (operator completed GitHub 2FA); production branch main; build `npm run build:production`; deploy `npm run deploy`; variables `PUBLIC_GA4_ENABLED=true`, `NODE_VERSION=24`; preview-branch builds OFF; Cloudflare auto-created a build token (value never seen or stored). Opened docs-only PR #20 recording this in BUILD-SPEC; CI green; operator merged (`6134089`), triggering build `d09f0d4c-7d4c-43a4-bfd5-c2114ebaa601`: production build checks passed ("OK: SEO, indexing firewall…", "OK: build-time performance budgets passed"), `Current Version ID: 12800a05-2cf8-4064-94c0-e20308b7f49d`. Afterwards added build exclude paths `docs/**`, `logs/**`, `research/**` so documentation-only merges do not redeploy.
6. **Live production verification** (new tab, origin storage/cookies cleared) — see Validation table.
7. **GA4 Realtime** — after the validation visit, Realtime overview for property 559890873 showed 1 active user (last 30 and last 5 minutes), Views by page title "Indy Sewer Resource" 1, Event count page_view 1, session_start 1, first_visit 1.
8. **GSC** — ownership "You are a verified owner" (Domain name provider); Performance, Page indexing and Experience/HTTPS all "Processing data"; 0 sitemaps; Manual actions and Security issues "No issues detected".
9. **Cloudflare DNS** — read-only check: 10 records (apex A, www CNAME, 5 MX, SPF TXT, Google TXT, Bing CNAME DNS-only). Nothing modified.
10. **Cloudflare Web Analytics** — RUM mode "Enable, excluding visitor data in the EU" unchanged. Found that browser navigations receive Cloudflare's injected beacon and CSP blocks it (securitypolicyviolation `script-src-elem` reproduced). Decision: retain inactive pending separate integration; CSP not widened.
11. Documentation: BUILD-SPEC (PR #20), CURRENT-STATE, this receipt, RUN-LOG.

## Files Created

- logs/runs/2026-10-20-2240-ga4-bing-release-verified.md

## Files Modified

- public/analytics.js — collection-validation marker (PR #18).
- tests/unit/analytics.test.ts — marker unit test (PR #18).
- tests/a11y/analytics.spec.ts — marker browser test; poll fix (PR #18).
- docs/05-BUILD-SPEC.md — Workers Builds release path, GA4 account settings, marker (PR #20).
- docs/01-CURRENT-STATE.md — release/verification state, RUM finding, decisions, change log.
- logs/RUN-LOG.md — append this session.

## Files Deleted

None.

## Research / Evidence Added

Live observations recorded in CURRENT-STATE → Analytics State and Search Console State. No new research JSON. Historical traffic research not repeated.

## Commands / Tools Used

Claude in Chrome (Bing WMT, GA4 Admin/Realtime, GSC, Cloudflare dashboard, GitHub web editor/PR UI, production pages with same-origin fetch + network/console inspection). Cloud shell: `git clone/fetch/diff`, `npm ci`, `npm run typecheck`, `npm test`, `npm run ci`, `PUBLIC_GA4_ENABLED=true npm run build:production`, Playwright with a scratch config pointing at the preinstalled Chromium (`--repeat-each 3`).

## Validation / Tests Performed

| Check | Result | Notes |
|---|---|---|
| Local typecheck | PASS | 0 errors |
| Local unit tests (`npm run ci`) | PASS | 201 tests; records, migrations, dist/SEO, budgets, similarity (deterministic) |
| Enabled-production browser tests | PASS | 26/26; then 3×78 repeated runs after poll fix |
| Disabled-build browser tests | PASS | 18 passed, 8 skipped (analytics specs) |
| PR #18 CI on `c59c631` | PASS | build-and-test, accessibility-and-lab-performance, secret-scan, analytics-production-build, production-read-only-audit |
| PR #20 CI | PASS | 5/5 |
| Workers Build d09f0d4c | PASS | production build checks OK; version 12800a05-2cf8-4064-94c0-e20308b7f49d |
| `npm run verify:production` | NOT RUN | agent runtime cannot reach the site; equivalent checks below were run in the browser |
| Pages 200 over HTTPS, apex self-canonical | PASS | `/`, `/about/`, `/lawrence-sewer-lateral-repair/` |
| noindex meta + X-Robots-Tag noindex | PASS | all three |
| Security headers | PASS | HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy; CSP has only the reviewed GA hosts, no wildcard/unsafe, frame-ancestors 'none' |
| Scripts / forms | PASS | exactly one script (`/analytics.js`, 7,933 bytes, contains marker); 0 forms |
| www / http redirects | PASS | `http://www…/about/` and `http://…/lawrence…/` ended at the https apex path |
| robots.txt / sitemap | PASS | `Allow: /`; sitemap 200 with 0 `<loc>` |
| Lead intake | PASS | POST `/api/lead-intake` → 503 |
| Pre-consent / decline | PASS | no Google requests, no cookies, no gtag |
| Consented validation hit | PASS | one gtag load + one g/collect page_view: tid G-2ZGM4PZ4DK, dl apex `/` only, fixed dt, empty dr, tt=internal, npa=1, gcs=G101; no utm/gclid/email/fragment |
| GA4 Realtime receipt | PASS | 1 active user; page_view 1; title "Indy Sewer Resource" (22:33:32 UTC Allow click) |
| Withdrawal | PASS | reload, `_ga` cookies removed, no Google script |
| Internal exclusion | PASS | persisted across pages; zero Google requests |
| CSP / third parties | NOTE | No GA CSP errors. Cloudflare's injected RUM beacon is CSP-blocked (pre-existing) |
| DNS (MX/SPF/NS/apex/www) | PASS | unchanged |
| Secret scan | PASS | CI gitleaks; no secret committed |

## Decisions Made

### Operator-approved / previously locked

Existing properties/Worker only; noindex, empty sitemap, disabled intake, DNS untouched; normal PR merge (operator clicked merge for #18 and #20); Workers Builds connection with GitHub app install (operator chose this option and completed 2FA).

### Agent implementation decision

`?analytics=validate` marker using GA4's `traffic_type=internal` with the existing Testing-state filter; preview builds off; NODE_VERSION 24; docs/logs/research excluded from build triggers; restrict advertising data transmission ON; user retention 2 months; Google-tag automatic detection and user-provided data OFF; leave granular location/device ON; leave Cloudflare RUM unchanged and inactive.

### Proposed / still awaiting operator approval

Whether to set the "Internal Traffic" filter Active; Cloudflare RUM option (keep / disable injection / reviewed CSP integration); whether to keep Workers Builds as the standing release path (documented in BUILD-SPEC).

## Previous Conclusions Changed

- "Current live HTTP checks contained no injected beacon" was true for non-navigation HTTP clients only; real browser navigations receive the injected beacon, which CSP blocks.
- Bing ownership is now verified; GA4 is live; production version changed from 489d30b2 to 12800a05.

## Current Risks

- Validation hits remain in GA4 data labelled as Internal Traffic (Testing filter); reports must exclude that label.
- Granular location/device collection remains on in GA4 (disclosed generically as device information).
- The CSP-blocked RUM beacon causes a console violation on every page view.
- Workers Builds deploys on every non-excluded push to main; required CI runs on PRs, not as a gate inside the build.

## Current Blockers

None for this task. GSC/Bing report data is still processing.

## Things Explicitly NOT Done

No noindex/header change, no indexing request, no URL or sitemap submission, no new property/stream/site/verification record, no MP secret, no DNS change, no lead collection, no CSP widening for RUM, no second Worker, no TinyFish/GSC Wizard, no secrets committed.

## Current Project State After This Run

Production Worker `12800a05-2cf8-4064-94c0-e20308b7f49d` serves consent-gated GA4 with verified Realtime receipt; site remains entirely non-indexable. GSC and Bing ownership verified; their reports are processing.

## Next Recommended Step

Re-check GSC Performance/Page indexing/HTTPS and Bing Search Performance after they finish processing; operator decides on the Internal Traffic filter state and Cloudflare RUM option.

## Commit / Push Status

- PR #18 merged: `018dd3b` (head `c59c631`) — https://github.com/tomytomz1/CIPP-IN/pull/18
- PR #20 merged: `6134089` — https://github.com/tomytomz1/CIPP-IN/pull/20
- This receipt: the commit containing it on branch `docs/indy-analytics-release-receipt` (PR to main); resolve with git log.

## Final Operator Report

Bing verified; GA4 settings hardened; validation marker merged; Workers Builds deployed version 12800a05-2cf8-4064-94c0-e20308b7f49d; live checks pass; GA4 Realtime received the 22:33 UTC validation page_view; GSC verified owner with reports processing; Cloudflare RUM beacon is injected but CSP-blocked and left unchanged pending decision.
