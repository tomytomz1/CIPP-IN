# RUN RECEIPT — Phase 2F completion: the site is live at https://indysewerresource.com

> Completion receipt for the run recorded as PARTIAL in
> [`2026-09-20-0057-phase-2f-safe-public-deployment.md`](2026-09-20-0057-phase-2f-safe-public-deployment.md).
> That receipt is historical and is not rewritten (/AGENTS.md §1). Its two blockers — Cloudflare
> authentication and the DNS move — were cleared by the operator, and this run finished the work.

## Run Metadata

- Date: 2026-09-20
- Time: 09:09 start, 09:36 receipt written
- Timezone: EDT
- Agent: Claude (Claude Code)
- Model if known: Claude Opus 5
- Repository: https://github.com/tomytomz1/CIPP-IN
- Branch: `phase-2f-completion-audit` (deployment work merged via `phase-2f-custom-domain-cutover`, `phase-2f-worker-routes`, `phase-2f-www-redirect-fix`)
- Starting SHA: `f1f3dbb4684bb8573c9a5d5395be54297f79f005`
- Ending/work commit: the commit containing this receipt; resolve with `git log -- logs/runs/2026-09-20-0936-phase-2f-deployment-completion.md`
- Run result: COMPLETE

## Operator Request

Resume the unfinished portion of Phase 2F now that the zone is on Cloudflare and wrangler is authenticated: verify auth and zone, rebuild, deploy the existing `indy-sewer-resource` Worker + Static Assets, attach the custom domain, replace only the obsolete web-parking DNS records, make `www` redirect permanently to the apex, preserve all mail records, run the live verification and visual checks, and reconcile the documentation and audit trail through protected-branch governance.

## Instructions / Requirements Read

`AGENTS.md`, `docs/01-CURRENT-STATE.md`, `logs/RUN-LOG.md`, `logs/runs/2026-09-20-0057-phase-2f-safe-public-deployment.md`, and the Deployment / Domain-Brand / Canonicals / Security sections of `docs/05-BUILD-SPEC.md`.

## Starting State Observed

- `origin/main` = local HEAD = `f1f3dbb`; working tree clean.
- `wrangler whoami`: authenticated by OAuth as `tomasbeltran2014@gmail.com`, single account `fece2c9c66f4b137be488d5203b0d4e1`. Token scopes include `workers*` (write) and `zone (read)`; **no DNS-edit scope**.
- Zone `indysewerresource.com` = `02c69ab4f470b4c12521b07a20ebd099`, status **active**, nameservers `harleigh.ns.cloudflare.com` / `leonard.ns.cloudflare.com`.
- Imported DNS as described by the operator: apex `A` → 192.64.119.188 (proxied), `www` CNAME → parkingpage.namecheap.com (proxied), five `eforward` MX records, one SPF TXT record. The apex timed out over HTTPS (dead parking origin).
- 3 pages `published_noindex`, 0 approvals, 0 indexable, 0 sitemap URLs.

## Work Performed

1. Verified authentication, account, and zone (read-only), and confirmed the DNS inventory publicly.
2. Added `src/worker.ts` plus a pure, unit-tested canonical-host policy; declared both hostnames in `wrangler.jsonc`. Merged via PR #13 before deploying.
3. Deployed. The Worker uploaded, but **Custom Domain attachment failed** (error 100117: the hostnames have externally managed DNS records). Retried through the same override path wrangler itself uses (`PUT /accounts/…/workers/scripts/…/domains/records` with `override_existing_dns_record` and `override_existing_origin`); Cloudflare still refused. The session cannot delete the records (`zone:read` only, confirmed by an authentication error on the DNS records endpoint).
4. Switched to zone **routes** on the already-proxied hostnames, which needs only `workers_routes:write`. Merged via PR #14, then deployed: both routes went live.
5. Live verification caught a real defect: `www` returned **200 with site content** instead of a redirect, and plain http was served without upgrade. Cause: static assets are served **before** the Worker by default, so `src/worker.ts` never ran for page URLs.
6. Fixed with `assets.run_worker_first: ["/*"]` and extended the policy to upgrade http → https. Merged via PR #15, redeployed, and re-verified.
7. Ran `npm run verify:production` against the real apex, plus redirect, header, asset, 404, and DNS-integrity checks, and inspected the live site in a browser at desktop and 375 px.
8. Updated `docs/01-CURRENT-STATE.md` and `docs/05-BUILD-SPEC.md`, wrote this completion receipt, and appended the run log.

## Files Created

- `src/worker.ts`
- `src/lib/seo/canonical-host.ts`
- `tests/unit/canonical-host.test.ts`
- `logs/runs/2026-09-20-0936-phase-2f-deployment-completion.md` (this receipt)

## Files Modified

- `wrangler.jsonc` — `main` → `./src/worker.ts`; zone routes for the apex and `www`; `assets.run_worker_first`.
- `src/config/brand.ts` — `APEX_HOST`.
- `src/env.d.ts` — minimal Workers runtime globals.
- `docs/01-CURRENT-STATE.md`, `docs/05-BUILD-SPEC.md`, `logs/RUN-LOG.md`.

## Files Deleted

None. **No DNS record was created, modified, or deleted by this run.**

## Cloudflare / DNS / Deployment State

| Item | State |
|---|---|
| Cloudflare account | `fece2c9c66f4b137be488d5203b0d4e1` (`tomasbeltran2014@gmail.com`), OAuth |
| Zone | `indysewerresource.com` = `02c69ab4f470b4c12521b07a20ebd099`, active |
| Worker | `indy-sewer-resource` (Workers + Static Assets, `ASSETS` binding only) |
| Deployed version | `489d30b2-3e33-4089-b48d-5a34f3c50781` (earlier versions: `261cf32d…` upload-only, `73d1d28f…` first routed deploy) |
| Serving mechanism | Zone routes `indysewerresource.com/*` and `www.indysewerresource.com/*` |
| Custom Domain | **Not attached** — blocked by error 100117 (externally managed DNS records); override path refused; session lacks DNS-edit permission |
| DNS changes made | **None.** Parking records remain but are never reached, because the route answers at the edge |
| Email DNS | Untouched and verified after deployment: 5 `eforward` MX records and the SPF TXT record intact |
| `www` | 301 → apex, single hop, path and query preserved |
| http | 301 → https |
| Bindings | `ASSETS` only. No D1, Queue, R2, Turnstile, or Access |

## Commands / Tools Used

`git fetch`/`switch`, `npx wrangler whoami`, `npx wrangler deploy -c dist/server/wrangler.json`, `npx wrangler deployments list`, `nslookup` (NS/A/CNAME/MX/TXT via 8.8.8.8), `curl` (redirect, header, asset, and 404 checks), Cloudflare API reads for zone identity and the Custom Domain override attempt, `npm run build:production`, `npm run verify:production`, `npx vitest run`, `npm run test:a11y`, and the built-in browser (console, network, layout measurements, screenshots).

## Validation / Tests Performed

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | 75 files, 0 errors. |
| `npx vitest run` | PASS | 195 tests in 15 files (canonical-host suite added, then extended). |
| `npm run build:production` | PASS | Run before each deploy; 0 sitemap URLs, 0 indexable pages. |
| `npm run test:a11y` | PASS | 18 checks. |
| CI on PR #13 / #14 / #15 | PASS | All three required checks green on each; merged without bypass. |
| **`npm run verify:production` (live)** | **PASS** | All three pages: HTTP 200, canonical host, robots meta `noindex, follow`, header `X-Robots-Tag: noindex, nofollow`, apex canonical, security headers, no form, no client JS. Sitemap 0 URLs. robots.txt allows crawling. `POST /api/lead-intake` → 503. |
| `www` redirect (live) | PASS | `https://www…/` → 301 → `https://indysewerresource.com/`; `/about/?x=1` preserves path and query; following redirects ends on the apex after exactly 1 hop. |
| http → https (live) | PASS | `http://indysewerresource.com/` → 301 → `https://indysewerresource.com/`. |
| Headers (live) | PASS | HSTS `max-age=31536000`, CSP, `X-Frame-Options: DENY`, nosniff, referrer policy, permissions policy, `X-Robots-Tag: noindex, nofollow`. |
| Assets and 404 (live) | PASS | CSS 200 `text/css`; unknown path returns 404. |
| Network requests (live) | PASS | Only same-origin: the document and one CSS file. No third-party request completed. |
| Console (live) | **One repeated error** | Cloudflare injects its Web Analytics beacon at the edge; the site's own CSP blocks it, producing a CSP error per page. No analytics request is made. See Current Risks. |
| Layout (live) | PASS | 1280×900: no horizontal overflow (scrollWidth 1265). 375×812: no horizontal overflow, body 17px, both tables are keyboard-focusable scroll regions, 3 nav links, 8 sources listed. |
| Visual review (live) | PARTIAL | Homepage at desktop and the Lawrence page at 375 px captured and reviewed. Further screenshots failed repeatedly because the browser pane stopped drawing (it reported a 178×101 viewport at one point); layout was verified by direct measurement instead. |
| Email DNS after deployment | PASS | 5 `eforward` MX records and SPF TXT still resolving. |

## Decisions Made

### Operator-approved / previously locked

- Cloudflare Workers + Static Assets; apex canonical; `www` permanently redirected; public-but-noindex; preserve mail records; no unauthorized resources.

### Agent implementation decision

- **Zone routes instead of Workers Custom Domains**, because the Custom Domain API refuses to replace externally managed DNS records and this session has no DNS-edit permission. Both hostnames are already proxied, so the route intercepts at the edge and the parking origin is never contacted. Recorded, with the conversion path, in `wrangler.jsonc` and `docs/05`.
- **`assets.run_worker_first: ["/*"]`**, without which the canonical-host policy never executes.
- **The redirect policy lives in a pure, unit-tested module**, so `www` cannot quietly start serving content.
- No DNS record was touched at all, which is stricter than the operator's permission to replace the parking records, and keeps email risk at zero.

### Proposed / still awaiting operator approval

- Deleting the two obsolete parking records and converting to Workers Custom Domains.
- Disabling Cloudflare Web Analytics automatic setup on the zone.

## Previous Conclusions Changed

- Phase 2F moves from PARTIAL to COMPLETE: the site is live and externally verified.
- `docs/05` → Deployment moves from CONFIGURED to IMPLEMENTED, and the status table no longer says nothing is deployed.
- The Phase 2F plan assumed Workers Custom Domains; the live implementation uses zone routes, for the documented reason.

## Current Risks

- **Cloudflare Web Analytics automatic setup is enabled on the zone.** Cloudflare injects `static.cloudflareinsights.com/beacon.min.js` into every HTML response at the edge. The site's CSP (`script-src 'self'`) blocks it — verified live: the script never loads and no request to cloudflareinsights is made — but the tag is injected and logs a CSP error per page, and analytics was not authorized for this phase. The agent session cannot manage RUM settings; disabling it is a dashboard action.
- **Obsolete parking records remain** (apex `A`, `www` CNAME). Harmless while the routes exist; if the routes were ever removed, traffic would fall back to a dead parking origin rather than erroring cleanly.
- The site is now publicly readable. It is non-indexable, but anyone with the URL can read pages that have had no human editorial pass and no expert review.
- Unchanged: no expert reviewer, no human editorial pass, legal review outstanding, no mailbox.

## Current Blockers

None for the next phase.

## Things Explicitly NOT Done

- No DNS record created, changed, or deleted; no nameserver change; no mail DNS touched.
- No D1, Queue, DLQ, R2, Turnstile, or Access provisioned.
- No analytics configured by this project, no Search Console, no indexing request, no index approval, no lifecycle change.
- No lead form, no live intake, no partner routing, no Resend or Twilio activation, no OpenAI key.
- No mailbox provider selected or configured.
- No content or publication-record change; no new pages.
- The human editorial pass, expert review, and manual accessibility review gates were **not** marked complete.
- No governance change; branch protection was not bypassed; every repository change went through a PR with green required checks.

## Current Project State After This Run

`https://indysewerresource.com` is live, served by Cloudflare Worker `indy-sewer-resource` (version `489d30b2-3e33-4089-b48d-5a34f3c50781`) with Static Assets. Three pages, all `published_noindex`; 0 operator approvals; 0 effectively indexable; 0 sitemap URLs; `/api/lead-intake` 503; no form, no client JavaScript, no third-party request; `www` and plain http both 301 to the canonical apex; email forwarding untouched. 195 unit tests and 18 accessibility checks pass.

## Next Recommended Step

Two optional dashboard tidy-ups for the operator (delete the parking records and convert to Custom Domains; disable the Web Analytics auto-injection). The project's critical path is unchanged: a human editorial pass, an expert reviewer, and confirming the remaining Lawrence questions with the utility.

## Commit / Push Status

- Branch: `phase-2f-completion-audit`; PR to `main`
- Work committed: YES
- Pushed: YES
- Commit message: `Phase 2F complete: site live at indysewerresource.com, noindex verified`
- Commit reference: the commit containing this receipt; resolve with `git log -- logs/runs/2026-09-20-0936-phase-2f-deployment-completion.md`

## Final Operator Report

Recorded in the final response and consistent with this receipt: starting SHA `f1f3dbb`; PRs #13, #14, #15 merged with green required checks; the site is live at https://indysewerresource.com on Worker `indy-sewer-resource`, version `489d30b2-3e33-4089-b48d-5a34f3c50781`, served through zone routes because Custom Domain attachment is blocked by the externally managed parking records; `www` and http each 301 to the canonical apex; live verification confirms 200s, `noindex` in meta and header, apex canonicals, 0 sitemap URLs, 0 approvals, a 503 intake endpoint, no form, no client JS, and only same-origin requests; email DNS untouched; two operator dashboard items remain (parking records, Cloudflare Web Analytics auto-injection blocked by CSP).
