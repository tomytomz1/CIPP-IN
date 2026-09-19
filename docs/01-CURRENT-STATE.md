# CURRENT STATE

Last updated: 2026-09-19
Last verified commit: `1cd02af6b2143d9b7179eb09e1e78f90ae8073ef` (Phase 1 documentation lock). The Phase 1 final documentation-reconciliation commit follows; resolve with `git log` (a file cannot contain its own commit SHA).
Production URL: None — no production deployment exists. Target domain `indysewerresource.com` is approved but NOT registered.
Repository: https://github.com/tomytomz1/CIPP-IN
Current branch: main
Current phase: Phase 1 — Brand, domain target, production architecture, and accessibility target approved and documented; higher-precedence docs reconciled (complete). Next: website implementation / build preparation per `05-BUILD-SPEC.md` (not started). No application code or deployment exists; domain not registered.

> This file is authoritative for what currently exists and what has been completed. It does not override strategic rules in higher-precedence documents (see `/AGENTS.md` §1). Update it after every meaningful piece of work.

## Locked Decisions

Locked by the operator (change only with explicit operator approval):

- **Business model:** independent sewer intelligence / lead-generation asset, eventually rented exclusively to one legitimate CIPP/trenchless contractor (`00-PROJECT-CHARTER.md`).
- **Target rent:** ~$5,000/month — a target, not a guarantee.
- **Market:** Indianapolis metro.
- **Beachhead:** Lawrence, Indiana.
- **Focus:** residential sewer laterals and CIPP/trenchless repair.
- **Initial primary query:** `sewer lateral repair lawrence in` (`02-SEO-SERP-BLUEPRINT.md`).
- **Page strategy:** one strong Lawrence lateral resource first; no one-page-per-keyword; no automatic city pages.
- **Editorial independence:** renter receives leads/exposure, not ownership or editorial/SEO control.
- **Quality system:** publication gates, similarity heuristics, and publication score in `03-GOOGLE-RESILIENCE.md`; content workflow in `04-CONTENT-EDITORIAL-SYSTEM.md`.
- **AI policy:** AI assists; it does not substitute for evidence, local research, expert validation, or editorial judgment. No detection evasion.
- **Documentation structure and precedence:** as defined in `/AGENTS.md`.
- **Research evidence location:** structured JSON under `/research/` (index: `/research/index.json`). Supporting material only; it does not outrank `/docs/`.
- **Brand (Phase 1):** Indy Sewer Resource. It is an independent resource, not a plumbing company. Lawrence is the SEO beachhead, not the master brand.
- **Target domain (Phase 1):** `indysewerresource.com`. Approved target only; not purchased. `.com` preferred; no silent TLD substitution; no defensive purchases without approval.
- **Production architecture (Phase 1):**
  - Astro + TypeScript (static-first)
  - Cloudflare Workers + Static Assets, with D1, private R2, Queues, and Turnstile
  - Cloudflare Access for admin
  - Resend email
  - Twilio: one operator-controlled tracking number; recording OFF by default
  - Cloudflare Web Analytics + first-party D1 events + Search Console
  - OpenAI `text-embedding-3-small` for similarity QA
  - Git (Markdown/MDX + structured records) as the CMS
- **Indexing governance (Phase 1):**
  - Publication and indexability are separate states (`draft` → `review` → `published_noindex` → `index_candidate` → `indexable`).
  - Indexability is computed from recorded gates plus operator index approval. A deploy alone never makes a page indexable.
  - A protected `main` branch is required before production publishing.
- **Lead-data architecture (Phase 1):**
  - minimal initial intake with explicit sharing consent
  - optional enrichment; event-style outcome history
  - config-driven partner routing (`partners` / `routing_rules` / `lead_routes`)
  - persist lead first → queue → notify
- **Performance targets (Phase 1):**
  - mobile p75: LCP ≤ 2.0 s, CLS ≤ 0.05, INP ≤ 150 ms
  - first-party JS: 0 KB target on editorial pages, ≤ 75 KB gzip on form pages
  - CSS ≤ 40 KB gzip
  - system fonts
- **Accessibility target (Phase 1):** WCAG 2.2 Level AA, a release/quality requirement. The standard is selected but not yet implemented (no site exists).
- Full specification: `05-BUILD-SPEC.md`.
- **Run logging:** append-only audit trail in `logs/RUN-LOG.md` (index) and `logs/runs/` (one receipt per meaningful work session), per `/AGENTS.md` §3. History only; this file stays authoritative for current state.

## Current Project Status

Documentation, research evidence, the run-log audit trail, and the locked Phase 1 build specification are in the repository. There is no website, application code, installed framework, database, cloud resource, production deployment, registered domain, analytics or Search Console configuration, Twilio setup, indexing, or collected leads.

## Completed

- Market/competitive research (pre-Phase 0, per operator).
- Phase 0 documentation system: `AGENTS.md`, `CLAUDE.md`, `docs/00`–`docs/05` (2026-09-19).
- Git repository initialized and pushed to `main` at https://github.com/tomytomz1/CIPP-IN (2026-09-19).
- Phase 0.1 research evidence preserved and independently re-verified on 2026-09-19 (`/research/index.json`):
  - Lawrence municipal evidence: `research/sources/lawrence-primary-sources.json`
  - Prospective tenant evidence: `research/sources/prospective-tenants.json`
  - Google Search policy evidence: `research/sources/google-search-policy.json`
  - SERP/competitor snapshot: `research/serps/2026-09-19-competitor-snapshot.json`
- Phase 0.2 run-log system: `logs/RUN-LOG.md`, `logs/RUN-RECEIPT-TEMPLATE.md`, and `logs/runs/`, with receipts backfilled for Phase 0 and Phase 0.1 (2026-09-19).
- Phase 1 decisions approved by the operator and documented (2026-09-19): brand, target domain (not registered), production architecture, publication/indexing architecture, lead-data architecture, performance budget. `05-BUILD-SPEC.md` is now the locked specification.
- Phase 1 final documentation reconciliation (2026-09-19): WCAG 2.2 AA locked; stale "NOT YET LOCKED" pointers in `03` and `04` corrected; `04` step 20 renamed "Index Approval" to match the publication/indexing lifecycle.

## In Progress

- None.

## Not Started

- Domain registration (approved target; requires separate operator authorization)
- Website build / application scaffold (Astro project not created; no packages installed)
- Cloudflare resources (Workers, D1, R2, Queues, Turnstile, Access, DNS)
- Resend, Twilio, and OpenAI accounts/resources for this project
- GitHub branch protection / ruleset and CODEOWNERS for index governance
- Accessibility implementation and verification (WCAG 2.2 AA target selected; nothing built)
- Confirmation of the remaining Lawrence uncertainties with Lawrence Utilities (see Open Questions)
- Content production
- Tools/calculators
- Original visuals
- Expert reviewer recruitment
- Production deployment
- Google Search Console setup
- Analytics setup
- Call tracking setup
- Lead funnel / lead database
- Link building / partnerships
- First-party data collection
- Tenant (renter) outreach

## Research Provenance

The evidence behind the locked strategy is stored under `/research/`. See `/research/index.json` for files, record counts, verification dates, and when each file goes stale. SERP, contractor, hiring, pricing, and Google-policy evidence is dynamic. Re-verify it before relying on it for a material decision.

## Lawrence Municipal Evidence Status

Sources: `research/sources/lawrence-primary-sources.json`. The primary sources are the Lawrence Code of Ordinances (American Legal, "2025 S-18 (current)"), the Lawrence Utilities Unit I Policy and Procedures manual approved 12/23/2019 (the version currently linked by the City), and the Lawrence Lift newsletter, August 2023, Issue 90.

**Verified**

- **Owner responsibility:** The property owner is responsible for repairs and replacement of the private sanitary lateral ("building sewer"). This comes from ordinance §5-1-2-7 together with §5-1-1-2(A)(11), and current City guidance agrees (Lawrence Lift, Aug 2023). The ordinance definition of the building sewer includes the portion within the public right-of-way.
- **Permit framework:** A permit is required to repair, modify, or connect a building sewer (ordinance §5-1-2-1). The policy manual (§1.06) also requires a permit before repair, replacement, or relocation, with the method and materials identified.
- **Lining and bursting allowed:** The currently linked 2019 Utility policy (§1.06) states the Utility allows lateral rehabilitation by pipe-bursting and lining.
- **Post-repair CCTV:** Under the same policy, video of lining or bursting repairs must be submitted for approval. Full rehabilitation video covers the cleanout by the structure to the public main connection; point/sectional repairs are filmed from the cleanout to at least 2 feet beyond the repair. The Utility may withhold approval if the video shows a defective repair.
- **Installation requirements:** The policy (§§1.02–1.04) requires a contractor licensed, bonded, and insured with the City, and sets approved materials, size, depth, and slope, backfill rules near driveways, sidewalks, and roadways, cleanouts, tracer wire, and inspection before backfill.

**Partially verified / still uncertain**

- The policy manual's "from the property line to the point of connection with the public main" wording is reconciled with the ordinance by inference: it assigns the right-of-way segment to the owner and does not create a City-owned segment. Status is `partially_verified`. Confirm with Lawrence Utilities before publishing any responsibility diagram.
- Whether the 2019 policy is still applied without unpublished revisions. No newer revision was found, but this has not been confirmed with the Utility.
- The currently accepted CCTV delivery format (the policy says DVD), permit fees and forms, and the current permit office location.
- Who is responsible for the tap/wye at the main, and how often the Director uses the §5-1-2-7 waiver.
- Whether every Lawrence address is served by Lawrence Utilities sanitary sewer (service-area boundary unverified).
- Whether any City cost-share or assistance program exists (not found; unverified).
- The August 2023 newsletter is no longer at its City URL (404). It was verified via the Internet Archive capture of 2024-08-08.

No finding invalidates Lawrence as the beachhead.

## Current Architecture

None built. The architecture is chosen and locked in `05-BUILD-SPEC.md` (Phase 1), but no application code exists and no framework is installed.

## Current Indexed URLs

None.

## Current SEO State

No site exists. No rankings, impressions, or indexed pages. The competitive landscape as of 2026-09-19 is recorded in `research/serps/2026-09-19-competitor-snapshot.json`.

## Search Console State

Not configured (planned: Domain property verified via DNS once the domain is registered).

## Analytics State

Not configured (planned: Cloudflare Web Analytics + first-party D1 events).

## Current Links / Referring Domains

None. Link acquisition not started.

## Current Leads

None.

## First-Party Dataset Status

None. No first-party data has been collected. Nothing in any document may be presented as first-party data until it genuinely exists.

## Future Tenant Candidates

Evidence: `research/sources/prospective-tenants.json`. These three categories are separate and must not be blurred.

**Research-identified prospective tenant candidates** (status `research_candidate`, re-verified from public sources on 2026-09-19):

1. **NuFlow Indy.** Residential CIPP verified. Expansion signal: April 14, 2026 article on large-diameter UV CIPP. Financial ability plausible.
2. **Carter's My Plumber.** Residential lining and pipe bursting verified. Actively recruiting plumbers. The prior "50+ people" claim was not found on company pages. Financial ability plausible.
3. **SLB Pipe Solutions.** CIPP, bursting, and camera inspection verified. Recruiting field technicians. Headquartered in Bedford, IN; Lawrence not named. Financial ability uncertain.
4. **Modern Plumbing / Indiana Sewer Repair.** Trenchless, lining, bursting, and camera inspection verified, but CIPP is not named explicitly ("partial"). Financial ability uncertain.
5. **317 Plumber.** CIPP-style lining, bursting, and camera diagnosis verified. Has a Lawrence service-area page. Financial ability uncertain.

**Contacted prospective renters:** None yet.

**Confirmed need for leads:** None yet.

**Confirmed willingness to pay approximately $5,000/month:** None yet.

## Open Questions

1. Domain registration: the approved target `indysewerresource.com` is not yet registered, and purchase requires separate operator authorization. (A Verisign RDAP check on 2026-09-19 16:58 UTC returned no registration record. That is not a registrar availability check.)
2. Remaining Lawrence uncertainties (listed under Lawrence Municipal Evidence Status). Confirm them with Lawrence Utilities before any Lawrence page is indexed.
3. Legal review (required before live lead collection/routing and before any call recording):
   - exact privacy-policy language
   - exact lead-sharing consent language
   - data retention/deletion periods
   - homeowner data sharing
   - call recording
   - partner disclosure wording
4. Rental contract terms (pricing, exclusivity boundaries, term, performance and outcome-reporting provisions) — OPEN.
5. Expert reviewer identity — none recruited; must be a real, verifiable professional.
6. Any implementation-level choice not approved in Phase 1 (exact folder names, library versions, header values, physical schema, event names) is decided at build time and recorded in the run receipt.
7. Whether to add an on-page AI-use disclosure ("How" content was made) to `04-CONTENT-EDITORIAL-SYSTEM.md`. Google's people-first and gen-AI guidance suggest considering it (`research/sources/google-search-policy.json` goog-003, goog-005). Operator decision.
8. Wording observation (no rule conflict): `AGENTS.md` §2 "Decisions not yet locked" refers to items marked `NOT YET LOCKED`, but `05-BUILD-SPEC.md` now labels unresolved items `OPEN`. The rule's intent (never decide unresolved items silently) clearly covers `OPEN` items too. Updating the `AGENTS.md` wording needs operator approval.

## Known Risks

- **Doorway/thin-content risk** if expansion to other municipalities is rushed. Mitigated by the Location Page Quality Gate. Google's current spam policy explicitly names city/region doorway pages and scaled AI pages.
- **Residual local-fact uncertainty:** the core Lawrence rules are verified, but the policy manual dates from 2019, and practical details (fees, format, office, service boundary) are unconfirmed.
- **The municipal information is visible in search, but not usable by homeowners:** the City's own scanned policy PDF was the first organic result for the primary query. Our advantage must come from homeowner translation, tools, and verification, not merely from access to the information (inference; see `02-SEO-SERP-BLUEPRINT.md`).
- **Competitive difficulty:** Indianapolis head CIPP terms are held by specialists (NuFlow Indy, SLB Pipe Solutions) and strong brands.
- **Tenant-competitor overlap:** the strongest tenant candidates (NuFlow, SLB, 317 Plumber) also rank for our target queries, which may affect how they value renting the asset.
- **Rental viability uncertainty:** ~$5,000/month depends on demonstrated qualified opportunity volume and contractor economics. No candidate has been contacted.
- **Lead quality risk:** traffic or form fills may not translate into qualified trenchless opportunities.
- **Legal/compliance risk** around sharing homeowner contact data with a contractor and call recording, pending legal review.
- **Evidence staleness:** SERP, contractor, and policy evidence decays. See the `stale_after` guidance in `/research/index.json`.
- **Domain still unregistered:** the approved target could be registered by someone else before the operator buys it.
- **`main` is unprotected:** observed 2026-09-19 (re-checked 13:19 EDT) via GitHub API; no rulesets. Branch protection/ruleset plus CODEOWNERS over the index-approval registry must be configured before production publishing.
- **Privacy/consent legal review** is required before live lead routing.
- **Expert reviewer** is still required for pages where `04-CONTENT-EDITORIAL-SYSTEM.md` requires expert review. Those pages stay `noindex` until one exists.
- **Algorithm-update risk:** handled by protocol in `03-GOOGLE-RESILIENCE.md`.

## Current Blockers

- None block starting website implementation / build preparation.
- Before **production publishing**: domain registration (operator action), branch/index governance, and the Launch Checklist in `05-BUILD-SPEC.md`.
- Before **live lead collection/routing**: legal review of consent/privacy/disclosure/retention.
- The remaining Lawrence uncertainties must be confirmed with Lawrence Utilities before any Lawrence content is indexed. This does not block Phase 1.

## Last Major Decisions

- 2026-09-19 — Operator approved WCAG 2.2 Level AA as the formal accessibility target, and approved correcting the stale Phase 0 wording in `03`/`04` to match the Phase 1 architecture (similarity tooling pointer, page-record pointer, workflow-record storage pointer, `04` step 20 "Index Approval"). No thresholds, gates, or workflow steps changed.
- 2026-09-19 — Phase 1 approved by the operator and locked in `05-BUILD-SPEC.md`:
  - brand Indy Sewer Resource; target domain `indysewerresource.com` (not registered)
  - Astro/TypeScript on Cloudflare Workers + Static Assets, with D1, R2, Queues, Turnstile, and Access
  - Resend and Twilio; Cloudflare Web Analytics + Search Console; OpenAI `text-embedding-3-small` similarity QA; Git as CMS
  - publication vs. indexability separation, with computed indexability plus operator approval
  - minimal lead intake with config-driven partner routing
  - performance budget
- 2026-09-19 — Append-only run log adopted: every meaningful work session needs a receipt in `logs/runs/` and a `logs/RUN-LOG.md` entry before the final report (Phase 0.2).
- 2026-09-19 — Research evidence stored as structured JSON under `/research/`, subordinate to `/docs/` (Phase 0.1).
- 2026-09-19 — Lawrence private-lateral owner responsibility, permit framework, lining/bursting allowance, and post-repair CCTV requirement recorded as verified from current primary sources. Remaining uncertainties listed explicitly.
- 2026-09-19 — Documentation system and precedence hierarchy adopted (`/AGENTS.md`).
- 2026-09-19 — Lawrence confirmed as SEO beachhead; Indianapolis head terms deferred.
- 2026-09-19 — All technical architecture decisions deliberately left NOT YET LOCKED (Phase 0; superseded by the Phase 1 lock above).

## Next 5 Priorities

1. Operator: register `indysewerresource.com` (separate authorization; not done by agents).
2. Website implementation / build preparation per `05-BUILD-SPEC.md` (on operator instruction): scaffold, CI checks, and the publication-record/indexing-gate machinery before any content.
3. Configure branch/index governance (protected `main` or ruleset, CODEOWNERS) before production publishing.
4. Confirm the remaining Lawrence uncertainties directly with Lawrence Utilities and record the results in `research/sources/lawrence-primary-sources.json`. Start legal review of consent/privacy.
5. Begin identifying a real expert reviewer (Indiana-licensed plumber with trenchless/CIPP experience); decide the AI-use disclosure policy (Open Question 7).

## Change Log

- 2026-09-19 — Phase 0: created `AGENTS.md`, `CLAUDE.md`, and `docs/00-PROJECT-CHARTER.md` through `docs/05-BUILD-SPEC.md`. No code, framework, content, domain, or data created.
- 2026-09-19 — Initialized Git repository; pushed Phase 0 documentation to `main` at https://github.com/tomytomz1/CIPP-IN (commit `c8cf100`).
- 2026-09-19 — Phase 0.1: created `/research/` evidence files (index, Lawrence primary sources, prospective tenants, Google policy, SERP snapshot). Re-verified Lawrence rules, competitors, tenant candidates, and Google policy. Reconciled this file and `02-SEO-SERP-BLUEPRINT.md`, added the research row to the ownership table in `AGENTS.md`, and made a narrow repository-contents correction in `05-BUILD-SPEC.md`. No code, framework, content, domain, or fake data created.
- 2026-09-19 — Phase 0.2: added `logs/` run-log system (index, template, receipts incl. backfills for Phase 0 and 0.1), logging rules in `AGENTS.md` §2–§3, and a reminder in `CLAUDE.md`. No strategy, code, or research changes.
- 2026-09-19 — Phase 1 documentation lock: `05-BUILD-SPEC.md` rewritten as the locked Phase 1 specification. This file was reconciled (phase, locked decisions, open questions, risks, blockers, priorities, stale SHA). Run receipt and RUN-LOG entry added. No code, packages, infrastructure, accounts, domain purchase, or deployment.
- 2026-09-19 — Phase 1 final documentation reconciliation:
  - `05-BUILD-SPEC.md`: Accessibility locked to WCAG 2.2 AA, with accessibility test and launch-checklist items.
  - `03-GOOGLE-RESILIENCE.md`: two stale pointers corrected (similarity tooling; page-level classification records).
  - `04-CONTENT-EDITORIAL-SYSTEM.md`: workflow-record storage pointer corrected; step 20 renamed "Index Approval".
  - This file reconciled. Run receipt and RUN-LOG entry added.
  - No code, packages, infrastructure, domain purchase, or deployment.
