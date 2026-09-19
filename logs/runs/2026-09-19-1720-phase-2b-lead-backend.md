# RUN RECEIPT — Phase 2B: Lead-data / backend foundation

## Run Metadata

- Date: 2026-09-19
- Time: 17:20 (run start, from local system clock)
- Timezone: America/New_York (EDT, UTC−04:00)
- Agent: Claude (Claude Code, desktop app)
- Model if known: Claude Opus 5 (`claude-opus-5`)
- Repository: https://github.com/tomytomz1/CIPP-IN
- Branch: `phase-2b-lead-backend` → PR #3
- Starting SHA: `1cde61f908b02dd2719e6d202cc3fb78a3650d22`
- Ending/work commit: the implementation commit on `phase-2b-lead-backend`; merged into `main` via PR #3 (resolve with `git log -- migrations/0001_lead_data_foundation.sql`)
- Run result: COMPLETE

## Operator Request

"CIPP — PHASE 2B LEAD-DATA / BACKEND FOUNDATION." Build the durable data model and server-side lead processing for the locked architecture, **without** enabling live lead collection, deploying, or making content indexable.

Authorized: D1 migrations for the ten logical domains; PII separation; strict intake contract; idempotency; consent records; event history; partner/routing model; the no-active-partner case; persist-before-queue; the queue message contract; a fail-closed intake endpoint; Turnstile verification abstraction; calls/uploads/outcome schemas; the D1 access layer; local database validation; tests; CI integration; documentation and audit trail; branch/PR workflow.

Prohibited: live intake; public lead form; production infrastructure (D1/R2/Queues/Turnstile/Access/DNS/Worker deploy); Resend/Twilio/OpenAI resources or calls; call recording; real partner seeding; domain registration; substantive frontend or SEO content; making anything indexable; weakening governance or the Phase 2A firewall; resolving open operator decisions.

## Instructions / Requirements Read

Read in full with tools during this run (`cat` into scratch files, then the read tool):

- `AGENTS.md`
- `docs/00-PROJECT-CHARTER.md`
- `docs/01-CURRENT-STATE.md`
- `logs/RUN-LOG.md`
- `logs/runs/2026-09-19-1332-phase-2a-build-foundation.md`
- `docs/03-GOOGLE-RESILIENCE.md`
- `docs/04-CONTENT-EDITORIAL-SYSTEM.md`
- `docs/02-SEO-SERP-BLUEPRINT.md`
- `docs/05-BUILD-SPEC.md`

`CLAUDE.md` was provided in full in the session context. The implementation tree, CI, CODEOWNERS, publication records, and the evaluator were inspected before changes.

## Starting State Observed

- `origin/main` = local `HEAD` = `1cde61f…`; working tree clean; PRs #1 and #2 merged.
- Governance verified read-only and unchanged: `main-protection` (id 23705333, `bypass_actors: []`, PR required, required checks `build-and-test` / `accessibility-and-lab-performance` / `secret-scan`, deletion and non-fast-forward blocked) and `index-governance-code-owner-review` (id 23705344, admin PR-only bypass). `governance/index-approvals.json` was empty.

## Current Implementation Research (official documentation)

- **D1 Worker API:** `batch()` statements "execute and commit, sequentially, non-concurrently" and "are SQL transactions … it aborts or rolls back the entire sequence" on failure. `exec()` is reserved for maintenance/one-shot use. This is why all lead writes go through one `batch()`.
- **Queues JavaScript API:** `send()`/`sendBatch()`; the promise resolves once the message "is confirmed to be written to disk"; errors propagate to the caller; at-least-once delivery; 128 KB per message. This is why enqueue failures are caught and recorded rather than rolled back.
- **D1 local development:** local D1 runs on Miniflare/workerd; `wrangler d1 migrations apply --local` still requires a configured binding with a `database_id`; Miniflare's `getD1Database()` is the documented way to "run queries against it as if it were your real production D1 database".
- **Turnstile server-side validation:** `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret` + `response` (+ optional `remoteip`, `idempotency_key`); tokens are single-use and valid five minutes; fail closed.
- **Astro Cloudflare adapter:** `export const prerender = false` for on-demand endpoints; bindings/vars via `import { env } from 'cloudflare:workers'`; `Astro.locals.runtime` was removed in Astro 6.

## Work Performed

1. Created branch `phase-2b-lead-backend`.
2. Wrote `migrations/0001_lead_data_foundation.sql` (all ten domains, constraints, indexes, append-only triggers, zero seed data).
3. Added `src/lib/leads/`: `contract.ts`, `db.ts`, `repository.ts`, `routing.ts`, `intake.ts`, `enrichment.ts`, `activation.ts`, `turnstile.ts`, `http.ts`, `log.ts`.
4. Added the disabled endpoint `src/pages/api/lead-intake.ts` (`prerender = false`; 503 before reading the body).
5. Added the local D1 test harness (`tests/helpers/d1.ts`) and the migration runner/validator (`scripts/lib/migrations.ts`, `scripts/validate-migrations.ts`).
6. Added synthetic fixtures (`tests/fixtures/leads.ts`) and 58 tests across `lead-intake`, `lead-enrichment`, `lead-activation`, and `lead-schema`.
7. Extended `scripts/check-dist.ts` so server-only markers can never appear in the client bundle.
8. CI: added `npm run validate:migrations` **inside** the existing `build-and-test` job. No required check name changed, so no ruleset change was needed.
9. CODEOWNERS: added `/migrations/`, `/src/lib/leads/`, `/src/pages/api/`.
10. `.env.example`: documented the activation variable names with empty values; no secrets.
11. Updated `docs/05-BUILD-SPEC.md` (section statuses + Implementation Record: Phase 2B) and `docs/01-CURRENT-STATE.md`.
12. Ran the full pipeline, the accessibility suite, and mutation spot-checks; opened PR #3.

## Files Created

- `migrations/0001_lead_data_foundation.sql`
- `src/lib/leads/activation.ts`, `contract.ts`, `db.ts`, `enrichment.ts`, `http.ts`, `intake.ts`, `log.ts`, `repository.ts`, `routing.ts`, `turnstile.ts`
- `src/pages/api/lead-intake.ts`
- `scripts/lib/migrations.ts`, `scripts/validate-migrations.ts`
- `tests/helpers/d1.ts`, `tests/fixtures/leads.ts`
- `tests/unit/lead-intake.test.ts`, `lead-enrichment.test.ts`, `lead-activation.test.ts`, `lead-schema.test.ts`
- `logs/runs/2026-09-19-1720-phase-2b-lead-backend.md` (this file)

## Files Modified

- `package.json` / `package-lock.json`: dev dependency `miniflare` 4.20260730.0; scripts `validate:migrations` and `ci`; `allowScripts` for `workerd`.
- `.github/workflows/ci.yml`: migration validation step inside `build-and-test`.
- `.github/CODEOWNERS`: lead-data paths.
- `.env.example`: activation variable names (empty).
- `scripts/check-dist.ts`: server-marker leak check.
- `src/env.d.ts`: minimal `cloudflare:workers` module declaration.
- `docs/05-BUILD-SPEC.md`, `docs/01-CURRENT-STATE.md`, `logs/RUN-LOG.md`.

## Files Deleted

None.

## Package / Version Changes

- Added dev dependency **`miniflare` 4.20260730.0** (pulls `workerd` 1.20260730.1, install script approved explicitly). Chosen because `@cloudflare/vitest-pool-workers` 0.22 peers Vitest ^4 while this repository uses Vitest 5, and because the Miniflare 5 alpha that ships inside Wrangler has an undocumented, incompatible constructor API.
- No runtime dependency added. Astro 7.3.3, `@astrojs/cloudflare` 14.3.2, Zod 4.6.5, TypeScript 6.0.3, Vitest 5.0.1, Playwright 1.63.0, Wrangler 4.135.0 are unchanged.

## Physical Schema Decisions

- `leads` holds non-contact intake only; `lead_contacts` is the sole home of contact PII, one row per lead, requiring at least one usable channel and a preferred channel consistent with it.
- `submission_key` (client UUID) is UNIQUE: the database, not application logic, enforces idempotency.
- `consents` stores artifact id/version, accepted flag, timestamp, and capture channel — never legal text.
- `lead_events`, `lead_routes`, `lead_outcomes`, `consents` reject UPDATE via triggers. DELETE stays possible because retention/deletion policy is OPEN.
- `lead_routes` snapshots the rule and partner, so a later partner switch cannot rewrite history.
- `calls.recording_enabled` has `CHECK (recording_enabled = 0)`: recording cannot be turned on by data.
- `uploads` has no content column; a storage key must match `leads/<leadId>/<name>`.
- Outcome rows require `value_voluntarily_provided = 1` before a final project value may exist.
- Enum CHECKs, length bounds, JSON validity checks, foreign keys, and 14 indexes for lookup/routing/event/timestamp access.

## Commands / Tools Used

- `git`, `gh api` (rulesets, rules/branches), `gh pr create/checks/view/merge`, `gh run view`
- `npm install --save-exact --save-dev`, `npm approve-scripts`, `npm rebuild`, `npm ci`, `npm run ci`
- `npx astro build/check`, `npx tsc --noEmit`, `npx vitest run`, `npx playwright test`
- `node scripts/validate-migrations.ts`, `node scripts/check-dist.ts`, `node scripts/check-budgets.ts`
- WebFetch (Cloudflare D1/Queues/Turnstile/local-dev docs, Astro adapter docs)
- Node one-liners to probe the Miniflare API; Python/sed edits; file write tool

## Validation / Tests Performed

| Check | Result | Notes |
|---|---|---|
| Clean install from lockfile | PASS | `npm ci` (CI) and local install |
| Typecheck (`astro check` + `tsc`) | PASS | 51 files, 0 errors |
| Unit tests | PASS | **128 passed** (70 Phase 2A + 58 Phase 2B), 10 files |
| Migrations execute | PASS | `validate:migrations`: 28 statements, 10 tables, 14 indexes, 4 triggers, **0 seeded rows** |
| SQL runs on a real local D1 | PASS | Miniflare/workerd; not a mock. D1 `batch()` rollback verified directly |
| Intake contract | PASS | email-only, phone-only, neither rejected, unknown fields rejected (address/income/insurance/pipe depth/contractor/value/media), missing consent rejected, bounded lengths/formats |
| Idempotency | PASS | retry returns one lead; concurrent duplicate resolves to one; DB UNIQUE enforced; a different key creates a new lead |
| PII separation | PASS | no contact columns/values in `leads`; queue payload has ids only and the contract rejects contact fields |
| Consent audit | PASS | artifact id/version/accepted/timestamp/channel persisted; UPDATE blocked |
| Event history | PASS | ordered, append-only, no contact PII in payloads |
| Routing | PASS | active partner; inactive partner/rule/expired/future excluded; municipality-specific preferred; switch affects future only; historical route immutable |
| No-active-partner | PASS | lead + contact + consent persisted, `route_unavailable` recorded, operator follow-up message, follow-up query lists it |
| Persist before queue | PASS | the lead is already durable when `send()` runs |
| Queue failure | PASS | lead retained, `delivery_enqueue_failed` recorded, no `delivery_enqueued`, appears in follow-up query; missing binding behaves the same |
| SQL-injection-like input | PASS | stored verbatim as data; tables intact |
| Outcomes / calls / uploads | PASS | append-only outcomes with derived snapshot; recording impossible (schema + CHECK); uploads reject content fields and path traversal; FK enforced |
| Live intake disabled | PASS | empty env disabled with reasons; endpoint 503 **without reading the body**; `process.env` in CI does not enable it |
| Activation fails closed | PASS | 9 single-requirement-missing cases all disabled; TEST-ONLY artifact rejected in production; Turnstile failure ⇒ 403; missing token ⇒ 400; oversized/malformed body ⇒ 413/400 |
| Turnstile | PASS | fails closed with no secret/token/network; posts to the documented endpoint; no live network call in tests |
| Mutation spot-checks | PASS | removing UNIQUE-violation recovery failed test 8; enqueueing before persisting failed tests 14 and 17; both reverted and re-verified |
| Astro build | PASS | static pages + server bundle for the disabled endpoint |
| Post-build firewall checks | PASS | plus the new check that no server-only marker reaches `dist/client` |
| Performance budgets | PASS | `/`: JS 0 B, CSS 498 B gzip |
| Accessibility + lab performance | PASS | 6/6 Playwright tests |
| Indexing firewall unchanged | PASS | `dev-shell` still `draft`; approvals 0; effectively indexable 0; sitemap 0 URLs; production draft guard still fails as intended |
| Thresholds unchanged | PASS | `docs/03` untouched; Phase 2A threshold tests still pass |
| Secret scan | PASS | CI Gitleaks; no secrets, keys, or cloud ids committed |
| `wrangler d1 migrations apply` | NOT RUN | Requires a binding with a real `database_id`; no remote D1 exists and no id was invented (documented limitation) |
| Queue/notification/live delivery | NOT RUN | No queue, Resend, or Twilio resource exists; nothing was sent |

## CI Result

PR #3 required checks: `build-and-test`, `accessibility-and-lab-performance`, `secret-scan` — all green (see the PR for run ids). No required check was renamed or removed, so no ruleset change was needed.

## Governance State (read back)

Unchanged and still active after the run: `main-protection` (no bypass; PR + 3 required checks; deletion and force-push blocked) and `index-governance-code-owner-review` (admin PR-only bypass). `governance/index-approvals.json` remains empty. The PR was merged through required checks, not by admin bypass.

## Decisions Made

### Operator-approved / previously locked
The whole Phase 1 lead architecture (domains, PII separation, event history, config-driven routing, persist-then-queue, minimum intake fields) implemented unchanged, plus the Phase 2B scope above.

### Agent implementation decision
- Physical schema shape, column names, CHECK constraints, and indexes (spec leaves these to implementation).
- Append-only enforced by triggers on UPDATE only; DELETE deliberately left possible for future lawful deletion.
- Delivery state modeled as events (`delivery_pending` / `delivery_enqueued` / `delivery_enqueue_failed`) rather than a new table, keeping to the approved ten domains.
- Enum vocabularies for problem category, urgency, decision-maker, repair method, and quote band.
- `miniflare` dev dependency and a local statement-by-statement migration runner (see Known limitation).
- Local test runtime pinned to compatibility date `2026-07-30`; `wrangler.jsonc` keeps `2026-09-01`.
- Request limits: 8 KB intake body; US phone normalized to E.164 while the original input is retained.
- Allow-list logging of ids and reason codes only.

### Proposed / still awaiting operator approval
- Contact-PII field-level encryption vs. platform encryption at rest (`01` Open Question 11). **Not implemented and not decided.**
- Retention/deletion mechanics (`01` Open Question 12), dependent on legal review.

## Previous Conclusions Changed

None. Phase 2A conclusions and thresholds stand; `docs/03` and `docs/04` were not modified.

## Current Risks

- Live intake depends on configuration that does not exist; if that configuration were ever set before legal review, the code would accept leads. The gate is technical, not legal advice.
- No remote D1 exists, so migrations have not been exercised by `wrangler d1 migrations apply`; behavior differences are possible when the database is provisioned.
- The queue consumer, notification delivery, and admin surface do not exist, so an enqueued message would currently go nowhere.
- Contact-PII encryption and retention/deletion remain undecided.
- Unchanged: domain unregistered, agent GitHub identity, public repository, expert reviewer, Lawrence confirmations, manual accessibility review.

## Current Blockers

- None for the next implementation phase.
- Before live lead collection: legal review plus provisioning D1/Queues/Turnstile and setting activation configuration.
- Before production publishing: domain registration, replacing the draft shell, gate-passing pages with operator approval, and the Launch Checklist.

## Things Explicitly NOT Done

- No live lead collection; no public lead form; no lead collected; no real homeowner data used anywhere.
- No Cloudflare resources (D1, R2, Queues, KV, Turnstile, Access, DNS), no Worker deployment, no preview deployment.
- No Resend/Twilio/OpenAI resource, account, secret, or API call. No email, SMS, webhook, or contractor notification sent.
- No Twilio number; call recording remains structurally disabled.
- No R2 bucket or upload endpoint; no file content stored.
- No real contractor seeded as a partner; no research candidate (NuFlow, Carter's, SLB, 317 Plumber, Modern Plumbing) appears in code, fixtures, or data.
- No domain registration; no secrets committed; no production environment variables.
- No SEO/Lawrence content, municipality page, homepage, lead form UI, or tool/calculator.
- Nothing made indexable; the approval registry is untouched and empty.
- Did not weaken CI, accessibility, SEO firewall, performance, or secret scanning; did not change `AGENTS.md`, `CLAUDE.md`, `docs/00`, `02`, `03`, `04`, or `research/`.
- Did not change repository visibility, rulesets, or create a GitHub identity.
- Did not resolve any open operator decision; did not write legal consent/privacy wording.
- Did not rewrite history, force-push, or admin-bypass `main-protection`.

## Current Project State After This Run

`main` carries the Phase 2A foundation plus the Phase 2B lead backend: a tested D1 schema, strict contracts, routing, persist-before-queue delivery, and a disabled intake boundary. Nothing is deployed, nothing is indexable, and no lead exists.

## Next Recommended Step

Operator decisions (legal review, domain registration, agent identity, repository visibility, PII encryption/retention). The next build phase could add the queue consumer and notification delivery, or begin content work under the Phase 2A gates. Neither was started.

## Commit / Push Status

- Branch: `phase-2b-lead-backend`; PR #3 → `main`
- Work committed: YES
- Pushed: YES
- Merged: via required checks, no admin bypass
- Commit message: `Phase 2B: lead-data and backend foundation`
- Commit reference: the commit containing this receipt; resolve with `git log -- logs/runs/2026-09-19-1720-phase-2b-lead-backend.md`

## Final Operator Report

- Starting SHA `1cde61f`; implementation commit on `phase-2b-lead-backend`; PR #3; final `main` SHA reported after merge.
- D1 migration 0001: 10 tables, 14 indexes, 4 append-only triggers, 0 seed rows; applied cleanly to a local D1 database in tests and CI. No remote database exists.
- Intake contract: approved minimum fields only, strict rejection of unknown fields, at least one contact channel, explicit consent required.
- Data separation: contact PII only in `lead_contacts`; queue payload carries identifiers only.
- Idempotency: UUID submission key with a database UNIQUE constraint; retries and concurrent duplicates resolve to one lead.
- Routing: configuration-driven and deterministic; partner switch affects future routing only; historical routes immutable; no-active-partner still persists the lead and flags follow-up.
- Persistence before queue: verified, including queue failure and missing-binding cases.
- Tests: 128 unit tests (58 new) plus 6 accessibility/lab tests, all passing; mutation spot-checks confirm the tests detect regressions.
- CI: all three required checks green; migration validation added inside `build-and-test`.
- Indexing firewall unchanged: 0 approvals, 0 indexable pages, empty sitemap, `dev-shell` still draft.
- Governance unchanged and read back after merge.
- Confirmations: no live lead collection, no real homeowner data, no domain purchase, no deployment, no remote D1/R2/Queue/Turnstile, no Resend/Twilio/OpenAI resources, no SEO content indexable, approval registry still empty.
- Closing line: "Phase 2B is complete. The lead-data/backend foundation is tested and auditable, while live lead collection remains disabled pending legal review and production infrastructure provisioning."
