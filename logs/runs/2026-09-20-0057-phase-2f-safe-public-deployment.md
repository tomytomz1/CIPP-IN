# RUN RECEIPT — Phase 2F: safe public noindex deployment

## Run Metadata

- Date: 2026-09-20
- Time: 00:49 start, 00:57 receipt written
- Timezone: EDT
- Agent: Claude (Claude Code)
- Model if known: Claude Opus 5
- Repository: https://github.com/tomytomz1/CIPP-IN
- Branch: `phase-2f-safe-public-deployment`
- Starting SHA: `511a7b17484c99710f1cf6db0e1f76313c34437d`
- Ending/work commit: the commit containing this receipt; resolve with `git log -- scripts/verify-production.ts`
- Run result: **PARTIAL** — deployment configuration is complete and verified locally; the site is **not deployed**. Two operator actions remain (Cloudflare authentication, DNS move).

## Operator Request

Put the existing informational site online at https://indysewerresource.com on the locked Cloudflare Workers + Static Assets architecture, keeping the whole site non-indexable and all lead/data functionality disabled. Not an SEO launch and not a lead-funnel launch. Explicitly unauthorized: D1, Queues, R2, Turnstile, Access, lead form, live intake, Resend/Twilio/OpenAI, analytics, Search Console, index approval, content changes.

## Instructions / Requirements Read

`AGENTS.md`, `docs/00-PROJECT-CHARTER.md`, `docs/01-CURRENT-STATE.md`, `logs/RUN-LOG.md`, `logs/runs/2026-09-20-0040-phase-2e-lawrence-evidence-editorial.md`, `docs/02-SEO-SERP-BLUEPRINT.md`, `docs/03-GOOGLE-RESILIENCE.md`, `docs/04-CONTENT-EDITORIAL-SYSTEM.md`, `docs/05-BUILD-SPEC.md`.

Inspected: `astro.config.mjs`, `wrangler.jsonc`, the adapter-generated `dist/server/wrangler.json`, `src/config/site.ts`, `src/config/brand.ts`, `src/layouts/BaseLayout.astro`, `src/lib/publication/*`, `src/lib/seo/firewall.ts`, `src/integrations/response-headers.ts`, the robots.txt and sitemap.xml endpoints, `package.json`, and `.github/workflows/ci.yml`.

## Starting State Observed

- `origin/main` = local HEAD = `511a7b1`, matching the SHA the operator supplied; working tree clean.
- 3 `published_noindex` pages; 0 approvals; 0 effectively indexable; 0 sitemap URLs.
- **Cloudflare authentication: none.** `npx wrangler whoami` reports "You are not authenticated." No `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CF_API_TOKEN`, or `WRANGLER_API_TOKEN` is set in the environment.
- **DNS (checked against 8.8.8.8 on 2026-09-20):** `indysewerresource.com` nameservers are `dns1.registrar-servers.com` and `dns2.registrar-servers.com` (the registrar's own DNS, not Cloudflare). The apex A record is `192.64.119.188`, a registrar parking address. An HTTPS request to the apex timed out after 15 s.
- Conclusion before changing anything: the site cannot be deployed from this environment. Recorded as PARTIAL rather than faked.

## Work Performed

1. Verified the starting SHA, read the required documents, and inspected the deployment-related code.
2. Established the Cloudflare authentication state and the real DNS state (read-only checks).
3. Hardened production indexing safety: the global `X-Robots-Tag` now also applies to production while no page is indexable.
4. Enabled HSTS for production builds.
5. Added production build and live-verification tooling plus npm scripts.
6. Ran a true production build and inspected every output that matters for indexing safety.
7. Updated the header unit tests, ran the full validation chain, and updated the documentation.
8. Wrote this receipt and the run-log entry.

## Files Created

- `scripts/build-production.ts`
- `scripts/verify-production.ts`
- `logs/runs/2026-09-20-0057-phase-2f-safe-public-deployment.md` (this receipt)

## Files Modified

- `src/integrations/response-headers.ts` — `X-Robots-Tag: noindex, nofollow` for every response when the build is non-production **or** 0 pages are effectively indexable; `Strict-Transport-Security: max-age=31536000` in production; new `HeadersOptions`.
- `astro.config.mjs` — computes the effectively-indexable page count from the evaluator at build time and passes it to the headers integration.
- `wrangler.jsonc` — comments now describe the deployment procedure; still no bindings.
- `package.json` — `build:production`, `deploy`, `verify:production`.
- `tests/unit/site-config.test.ts` — covers the new production header behavior.
- `docs/01-CURRENT-STATE.md`, `docs/05-BUILD-SPEC.md`, `logs/RUN-LOG.md`.

## Files Deleted

None.

## Research / Evidence Added

None. No `research/` file was read for new facts or changed.

## Cloudflare / DNS / Deployment State

| Item | State |
|---|---|
| Cloudflare authentication | **None.** `wrangler whoami`: not authenticated. No API token in the environment. |
| Cloudflare account | Not identified (requires authentication). |
| Worker created | **No.** Configured name would be `indy-sewer-resource`. |
| Static assets binding | Configured by the adapter (`ASSETS` → `dist/client`) in `dist/server/wrangler.json`; not deployed. |
| Custom domain | **Not attached.** |
| DNS | Registrar nameservers (`dns1/dns2.registrar-servers.com`); apex parked at `192.64.119.188`; HTTPS does not respond. |
| `www` | Not configured. Recommendation recorded: a zone-level Cloudflare Redirect Rule to the apex, never a second serving host. |
| Deployment identifier/version | None — nothing was deployed. |
| Production URL status | Not live. |

No Cloudflare resource of any kind was created, and no DNS record was changed. `wrangler deploy --temporary` (the throwaway-preview-account path wrangler suggests) was deliberately **not** used: it would deploy to an account the operator does not own.

## Commands / Tools Used

`git fetch`/`switch`, `npx wrangler whoami`, `nslookup` (NS and A records via 8.8.8.8), `curl` (HTTPS probe of the apex), `npm run build:production`, `npm run typecheck`, `npx vitest run`, `npm run validate:records`, `npm run validate:migrations`, `npm run build`, `npm run check:dist`, `npm run check:budgets`, `npm run similarity:qa`, `npm run test:a11y`.

## Validation / Tests Performed

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | 72 files, 0 errors. |
| `npx vitest run` | PASS | 191 tests in 14 files (2 new header tests). |
| `npm run validate:records` | PASS | 3 records, 0 approvals, 0 effectively indexable; Lawrence 63/85. |
| `npm run validate:migrations` | PASS | Unchanged. |
| `npm run build` (development) | PASS | 3 pages. |
| `npm run build:production` | PASS | Production build plus production-mode `check-dist`, budgets, and similarity QA. |
| `npm run check:dist` (both modes) | PASS | 0 sitemap URLs, 0 indexable pages in each. |
| `npm run check:budgets` | PASS | 0 B JS and ~1.8 KB gzip CSS per page. |
| `npm run similarity:qa` | PASS (incomplete by design) | 0%/0% deterministic; embeddings `not_run`. |
| `npm run test:a11y` | PASS | 18 checks. |
| **Production output inspection** | PASS | See the table below. |
| Live production smoke test | **NOT RUN** | The domain does not resolve to the site; `npm run verify:production` exists for when it does. |
| Live visual review | **NOT RUN** | No live site to review. The local production build renders identically to the reviewed development build. |
| CI on PR #11 (commit `2fcc9ab`) | PASS | `build-and-test` 1m3s, `accessibility-and-lab-performance` 45s, `secret-scan` 10s (run 35490517580). Merged without bypass; merge commit `c9da255`. |

**Production build output, inspected directly (`SITE_ENV=production`, origin `https://indysewerresource.com`):**

- `/`, `/about/`, `/lawrence-sewer-lateral-repair/` each carry `<meta name="robots" content="noindex, follow">`.
- Canonicals are apex-only: `https://indysewerresource.com/`, `/about/`, `/lawrence-sewer-lateral-repair/`.
- `_headers` for `/*`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: …`, the existing CSP, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000`, and `X-Robots-Tag: noindex, nofollow`.
- `sitemap.xml`: 0 URLs.
- `robots.txt`: allows crawling (so the noindex directive is visible to crawlers) and advertises the empty sitemap.
- No dev shell, no extra route, no form, no client JavaScript.

## Decisions Made

### Operator-approved / previously locked

- Cloudflare Workers + Static Assets; apex as the canonical host; the site stays public-but-noindex; no unauthorized infrastructure.

### Agent implementation decision

- The global `X-Robots-Tag` now also covers production **while the evaluator reports 0 indexable pages**, computed at build time rather than set by hand, so a real hostname cannot quietly become indexable and the header lifts by itself when a page is genuinely approved.
- HSTS enabled for production only, with no `includeSubDomains` and no `preload`, because subdomain use (including any future mailbox) is undecided.
- Deployment uses the adapter-generated `dist/server/wrangler.json`; the root `wrangler.jsonc` keeps the Worker name, compatibility date, and observability.
- `www` was left unconfigured; the recommendation is a Cloudflare Redirect Rule, not a second custom domain.
- `wrangler deploy --temporary` was rejected outright.

### Proposed / still awaiting operator approval

- Which Cloudflare account to use, and when to move the domain's DNS.

## Previous Conclusions Changed

- `docs/05` → Deployment moves from IMPLEMENTATION PENDING to CONFIGURED (not deployed).
- The production build no longer relies on per-page robots meta alone for non-indexability; the header now covers every response while nothing is indexable.

## Current Risks

- The site is not reachable at the domain, so nothing can be shared or inspected publicly yet.
- Moving nameservers to Cloudflare affects the whole domain. If any DNS records exist at the registrar (for example a parking or future mail record), they must be recreated in Cloudflare before the switch or they will stop resolving. This run changed no DNS and did not enumerate registrar records.
- Unchanged: no expert reviewer, no human editorial pass, legal review outstanding, no mailbox.

## Current Blockers

Two, both operator actions outside this environment:

1. **Cloudflare authentication** — run `npx wrangler login` in this repository and complete the browser authorization (or set a scoped `CLOUDFLARE_API_TOKEN`).
2. **DNS** — add `indysewerresource.com` as a zone in the operator's Cloudflare account and change the nameservers at the registrar from `dns1/dns2.registrar-servers.com` to the pair Cloudflare provides.

After both: `npm run build:production`, `npm run deploy`, attach the custom domain to the `indy-sewer-resource` Worker, then `npm run verify:production`.

## Things Explicitly NOT Done

- **Nothing was deployed.** No Worker, no custom domain, no Cloudflare resource, no DNS record change, no nameserver change.
- No D1, Queue, DLQ, R2, Turnstile, or Access provisioned.
- No analytics, no Search Console, no indexing request, no index approval; no lifecycle changed.
- No lead form, no live intake, no partner routing, no Resend or Twilio activation, no OpenAI key.
- No mail DNS (MX/SPF/DKIM/DMARC) and no mailbox provider selected.
- No content or publication-record change; no new pages.
- The human editorial pass, expert review, and manual accessibility review gates were **not** marked complete.
- No governance change; branch protection was not bypassed.

## Current Project State After This Run

The repository is deployment-ready and verified in production mode, and the site is still not deployed. 3 `published_noindex` pages, 0 approvals, 0 effectively indexable, 0 sitemap URLs, no lead collection, no analytics, no mailbox. The domain resolves to a registrar parking address.

## Next Recommended Step

The operator authenticates Cloudflare and moves the domain's DNS to Cloudflare; then the deploy and verification commands above can run. Nothing else in the project is blocked by this.

## Commit / Push Status

- Branch: `phase-2f-safe-public-deployment`; PR to `main`
- Work committed: YES
- Pushed: YES
- Commit message: `Phase 2F: production deployment configuration (not yet deployed)`
- Merge: PR #11 merged into `main` as `c9da25532e9b5279a2404dba29b6a8de9e167535` after all three required checks passed, with no admin bypass. Read back afterwards: both rulesets active and `governance/index-approvals.json` still empty. Still nothing deployed.
- Commit reference: the commit containing this receipt; resolve with `git log -- logs/runs/2026-09-20-0057-phase-2f-safe-public-deployment.md`

## Final Operator Report

Recorded in the final response and consistent with this receipt: starting SHA `511a7b1`; deployment configuration and tooling merged; production build verified locally with every page `noindex`, apex canonicals, 0 sitemap URLs, and a global `X-Robots-Tag`; **deployment NOT completed** because the environment has no Cloudflare credentials and the domain's DNS is still at the registrar; no infrastructure provisioned; no index approval; no page indexable; run result PARTIAL.
