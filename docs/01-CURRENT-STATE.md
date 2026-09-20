# CURRENT STATE

Last updated: 2026-09-20
Last verified commit: `7a76251d2d3d324da5ef2b2e1f225bcf9f8fc00a` (post-Phase-2D reconciliation, PR #8). The Phase 2E merge follows; resolve with `git log` (a file cannot contain its own commit SHA).
Production URL: None — no production deployment exists. The domain `indysewerresource.com` is registered and owned by the operator (2026-09-19). It is configured as the canonical production origin in the build, but nothing is deployed to it and DNS has not been moved to Cloudflare or any other host.
Repository: https://github.com/tomytomz1/CIPP-IN
Current branch: main
Current phase: Phase 2E — Lawrence evidence enrichment and editorial QA (complete). Backend expansion is deliberately paused. Three real homeowner-facing pages exist (homepage, Lawrence sewer-lateral resource, methodology page), all `published_noindex`. No deployment exists; no page is indexable; live lead collection is DISABLED, notification sending is DISABLED, no lead has been collected, and no email or SMS has been sent.

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
- **Domain:** `indysewerresource.com` — **registered and owned by the operator** (2026-09-19). It is the canonical production origin. No DNS change, hosting, or deployment has been made. No defensive domains without approval.
- **Repository visibility (operator decision, 2026-09-19):** the GitHub repository stays **public**. Strategy, research, and documentation are publicly readable by choice. Agents must not change visibility.
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
- **Accessibility target (Phase 1):** WCAG 2.2 Level AA, a release/quality requirement. Implemented and enforced in CI on all three real pages (automated axe checks across desktop and mobile profiles). Manual keyboard and screen-reader review is still outstanding.
- Full specification: `05-BUILD-SPEC.md`.
- **Run logging:** append-only audit trail in `logs/RUN-LOG.md` (index) and `logs/runs/` (one receipt per meaningful work session), per `/AGENTS.md` §3. History only; this file stays authoritative for current state.

## Current Project Status

Documentation, research evidence, the run-log audit trail, the locked build specification, and the Phase 2A application foundation are in the repository.

The foundation includes:
- Astro + TypeScript with the Cloudflare adapter
- the publication-record schema, indexability evaluator, and noindex/sitemap/robots firewall
- CI and `main` governance

Phase 2B adds the lead-data/backend foundation: D1 migrations for all ten logical domains, strict intake contracts, the routing/persistence/queue service, and the fail-closed activation boundary.

Phase 2C completes the delivery path in code: an idempotent queue consumer, database-enforced delivery idempotency, Resend and Twilio provider adapters with injected transports, a separate fail-closed notification activation boundary, and operator follow-up queries.

Phase 2D replaces the development shell with the first real homeowner-facing asset: a branded site shell, a homepage, the flagship Lawrence sewer-lateral resource, and a methodology/trust page. Every page is `published_noindex`.

Phase 2E strengthens the evidence behind the Lawrence page, corrects editorial overclaims on all three pages, and implements the similarity-QA runner the locked workflow requires. The Location Page Quality Gate now passes on evidence (5 of 8 categories), and the page is still not indexable: expert review is absent, the publication score is 63 against 85, the embedding half of similarity QA has not run, manual accessibility review is outstanding, and there is no operator index approval.

The site exists in the repository; no production deployment exists, and no page is indexable. Specifically:

- three real pages (`/`, `/lawrence-sewer-lateral-repair/`, `/about/`), all `published_noindex`; the development shell was removed in Phase 2D;
- 0 effectively indexable pages, 0 operator index approvals, 0 production sitemap URLs;
- the domain `indysewerresource.com` is registered and owned, but DNS has not been configured for production and nothing is deployed;
- no cloud or vendor resource, remote database, queue, analytics or Search Console configuration, Twilio number, Resend key, or notification provider account;
- no public lead form, no lead collected, and no email or SMS ever sent.

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
- Phase 1 decisions approved by the operator and documented (2026-09-19): brand, target domain (not yet registered at that time; registered later the same day), production architecture, publication/indexing architecture, lead-data architecture, performance budget. `05-BUILD-SPEC.md` is now the locked specification.
- Phase 1 final documentation reconciliation (2026-09-19): WCAG 2.2 AA locked; stale "NOT YET LOCKED" pointers in `03` and `04` corrected; `04` step 20 renamed "Index Approval" to match the publication/indexing lifecycle.
- Phase 2A build foundation (2026-09-19; PR #1, merge `b3c60e6`):
  - Astro 7.3.3 + TypeScript 6.0.3 (strictest) with `@astrojs/cloudflare` 14.3.2 (static output; no bindings, sessions, or resources)
  - Zod publication-record schema and operator approval registry (`governance/index-approvals.json`, empty)
  - pure indexability evaluator; central robots/canonical/sitemap/robots.txt firewall
  - non-production builds globally `noindex`; production builds refuse `draft` pages and require a validated origin
  - CI: `build-and-test`, `accessibility-and-lab-performance`, `secret-scan`
  - CODEOWNERS; rulesets `main-protection` and `index-governance-code-owner-review`
  - details: `05-BUILD-SPEC.md` → Implementation Record: Phase 2A
- Phase 2B lead-data/backend foundation (2026-09-19):
  - `migrations/0001_lead_data_foundation.sql`: 10 tables (leads, lead_contacts, consents, lead_events, lead_routes, lead_outcomes, partners, routing_rules, calls, uploads), 14 indexes, 4 append-only triggers, no seed data
  - contact PII isolated in `lead_contacts`; append-only consent/event/route/outcome history
  - strict intake contract (approved minimum fields only), UUID-key idempotency, deterministic partner routing, persist-before-queue, identifier-only queue messages
  - live intake DISABLED and fail-closed; `POST /api/lead-intake` returns 503 before reading a body
  - 58 backend tests against a local D1 database (Miniflare); CI gained `npm run validate:migrations` inside the existing `build-and-test` check
  - details: `05-BUILD-SPEC.md` → Implementation Record: Phase 2B
- Phase 2C queue-consumer / notification-delivery foundation (2026-09-19):
  - `migrations/0002_delivery_foundation.sql`: `lead_events` rebuilt with a UNIQUE `idempotency_key` and the delivery event types; `partners` gained notification destinations with validating triggers; still zero seed rows
  - idempotent consumer (`src/lib/leads/delivery.ts`): claim-before-send, single success/terminal rows, an attempt lease, and stable provider-side idempotency keys
  - delivery uses the immutable historical route only; an inactive or unreachable partner becomes operator follow-up instead of a reroute
  - Resend email adapter and Twilio SMS adapter with injected transports, timeouts, strict response parsing, and retryable/terminal mapping; no account, key, number, or network call
  - notification activation is separate from intake activation and fails closed; test-only values cannot activate production
  - operator follow-up query (`src/lib/leads/operator.ts`) covering unrouted, un-enqueued, retry-pending, and permanently failed leads, with contact PII behind an explicit call
  - 40 new tests (168 unit tests total) against a local D1 database, with fake providers and `fetch` stubbed to throw
  - details: `05-BUILD-SPEC.md` → Implementation Record: Phase 2C
- Phase 2D Lawrence MVP asset (2026-09-19):
  - real branded shell: navigation, site-wide independence disclosure, design system (system fonts, light and dark, 0 client JS)
  - homepage (`/`), flagship Lawrence resource (`/lawrence-sewer-lateral-repair/`), methodology page (`/about/`) — all `published_noindex`
  - the development shell (`dev-shell`) and its record were removed
  - Lawrence content is written only from `research/sources/lawrence-primary-sources.json`; unverified items (permit fee, permit office, current video format, tap/wye responsibility, service boundary, waiver practice, assistance programs, local pipe prevalence, local prices) are named on the page as unresolved, never guessed
  - original homeowner decision-flow diagram; a Lawrence responsibility diagram was deliberately NOT drawn (law-009 unresolved)
  - publication records: Lawrence scores 55/100 against an 85 threshold, location gate 3 of 8 categories, expert review required and absent
  - `indysewerresource.com` configured as the canonical production origin (no deployment, no DNS change)
  - details: `05-BUILD-SPEC.md` → Implementation Record: Phase 2D
- Phase 2E Lawrence evidence enrichment and editorial QA (2026-09-20):
  - four new City of Lawrence sources verified directly from the City's own document library: the current sanitary lateral permit application form, the Lawrence Lift for August 2024 and July 2025, and the 2026 46th and Post I/I Removal pre-bid minutes
  - ten new records in `research/sources/lawrence-primary-sources.json` (now 8 sources, 20 records)
  - new `research/sources/technical-standards.json`: two government-issued engineering specifications that source the general mechanics of CIPP lateral lining and pipe bursting (not Lawrence requirements)
  - Location Page Quality Gate reassessed honestly: **3 of 8 → 5 of 8**, all five authoritative local primary-source. Categories 6, 7, and 8 remain false
  - publication score re-scored after the content changed: **55 → 63** against the 85 threshold
  - editorial corrections on the Lawrence page (unsupported "cheapest step" claim removed, camera-inspection claims narrowed, the "trenchless is not permitted everywhere" framing removed, the "not a complete quote" line replaced with a question to ask, DVD speculation removed, permit-practice assertion removed), on the About page (contractor-evidence and claim-labelling overstatements), and on the homepage (no implied judgement of whether a quote is reasonable)
  - similarity-QA runner implemented (`scripts/similarity-qa.ts`, `scripts/lib/similarity.ts`) and added to CI
  - details: `05-BUILD-SPEC.md` → Implementation Record: Phase 2E

## In Progress

- None.

## Not Started

- DNS and hosting configuration for the registered domain (a deployment decision; not scheduled)
- Additional municipality pages (none; they are added only when a municipality has enough verified local evidence)
- R2 uploads, admin UI, and a deployed Worker entrypoint wiring the queue consumer (the consumer itself is implemented and tested; no queue exists)
- Live partner/operator notifications (Resend and Twilio adapters exist; no account, key, number, or sending is enabled)
- Live lead collection (blocked by legal review and by production bindings; the code path is disabled)
- Embedding half of similarity QA (the runner exists and the deterministic checks run in CI; no OpenAI account, key, or call exists, so the embedding check reports `not_run` and the gate stays unsatisfied)
- Cloudflare resources (Workers, D1, R2, Queues, Turnstile, Access, DNS)
- Resend, Twilio, and OpenAI accounts/resources for this project
- Manual keyboard and screen-reader review of the three real pages (automated axe WCAG 2.2 AA checks already run on all of them in CI)
- Confirmation of the remaining Lawrence uncertainties with Lawrence Utilities (see Open Questions)
- Further content production beyond the three Phase 2D pages
- Tools/calculators
- Further original visuals (one original decision-flow diagram exists; a Lawrence responsibility diagram is deliberately withheld until `law-009` is resolved)
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

**Verified in Phase 2E (2026-09-20)**

- **Current permit form:** the City publishes an Application for Sanitary Building Sewer Lateral Construction Permit covering New Line, Repair/Modification Work, and Replace/Relocate. It requires a plat drawing with the location of work and materials, owner and installing/repairing contractor details including a Lawrence registration number, and an emergency-work application no later than the following business day. It states no permit fee and no submission address.
- **Owner responsibility restated (August 2024):** residents are responsible for maintenance and repair of their sanitary sewer laterals to the point of connection at the city's main sewer line.
- **Local pipe/failure evidence:** the utility asks owners to replace older clay sewer laterals beyond their useful life, saying old clay pipe cracks and breaks easily, letting dirt and roots in. No prevalence figure is published.
- **Third-party damage:** the utility reported an increase in laterals damaged by contractors installing underground fiber optic lines for 5G upgrades.
- **Call the utility first:** the August 2024 issue published an after-hours on-call number (317-260-0220) and repeated that the City does not reimburse contractor costs when the fault turns out to be in the public main.
- **City system rehabilitation:** the 71st Street Lift Station Basin project (approximately 3,000 ft of 8-inch and 12-inch CIPP plus approximately 1,300 ft of 6-inch lateral lining, under a November 2021 EPA Administrative Order on Consent), the Fort Harrison Phase III project (2,155 ft replaced, 2,478 ft CIPP lined), and the 2026 46th and Post I/I Removal project (CIPP of 8- to 15-inch sewers with associated lateral lining). These are public-system projects and establish nothing about a private lateral.
- **Retrieval note:** cityoflawrence.org returns HTTP 404 to a default (non-browser) user agent. The August 2023 newsletter is reachable at its original City URL with a browser user agent, which narrows the limitation recorded for it in Phase 0.1.

**Partially verified / still uncertain**

- The policy manual's "from the property line to the point of connection with the public main" wording is reconciled with the ordinance by inference: it assigns the right-of-way segment to the owner and does not create a City-owned segment. Status is `partially_verified`. Confirm with Lawrence Utilities before publishing any responsibility diagram.
- Whether the 2019 policy is still applied without unpublished revisions. No newer revision was found, but this has not been confirmed with the Utility.
- The currently accepted CCTV delivery format (the policy says DVD), the current permit fee, and which office accepts the application today. The current form itself is now verified; it states neither a fee nor an address.
- Who is responsible for the tap/wye at the main, and how often the Director uses the §5-1-2-7 waiver.
- Whether every Lawrence address is served by Lawrence Utilities sanitary sewer (service-area boundary unverified).
- Whether any City cost-share or assistance program exists (not found; unverified).
- The August 2023 newsletter is no longer at its City URL (404). It was verified via the Internet Archive capture of 2024-08-08.

No finding invalidates Lawrence as the beachhead.

## Current Architecture

Astro 7.3.3 static site with the Cloudflare adapter, built from the Phase 2A foundation and carrying the Phase 2D pages and site shell. Built in the repository and verified in CI; not deployed. See `05-BUILD-SPEC.md` → Implementation Records: Phase 2A and Phase 2D.

- **Publication records:** 3 — `home` (general/published_noindex), `lawrence-sewer-lateral-repair` (location/published_noindex), `about` (general/published_noindex).
- **Operator approvals:** 0.
- **Effectively indexable pages:** 0.
- **Production sitemap eligibility:** 0 URLs.
- **Canonical production origin:** `https://indysewerresource.com` (registered; nothing deployed to it).
- **Lawrence page status:** Location Page Quality Gate 5 of 8 (passes); publication score 63/85; expert review required and absent; similarity QA deterministic checks clean, embedding check `not_run`.
- **Client JavaScript:** 0 bytes on every page. CSS: ~1.8 KB gzip.

Phase 2B lead backend built (not deployed, not active): D1 migration for 10 tables, intake/routing/persistence service, and the disabled activation boundary. See `05-BUILD-SPEC.md` → Implementation Record: Phase 2B.

Phase 2C delivery pipeline built (not deployed, not active): queue consumer, delivery idempotency in the database, provider adapters, and operator follow-up. See `05-BUILD-SPEC.md` → Implementation Record: Phase 2C.

- **Remote D1 database:** none (migrations run against a local database in tests/CI).
- **Queue, dead-letter queue, notification provider accounts, uploads:** none.
- **Live intake:** disabled; no public form exists.
- **Live notifications:** disabled; 0 emails and 0 SMS ever sent.
- **Partners configured:** 0 (no contractor exists in data or in code).
- **Leads collected:** 0.

## Current Indexed URLs

None.

## Current SEO State

Three real pages exist in the repository, none published to search engines and none deployed. No rankings, impressions, or indexed pages. The competitive landscape as of 2026-09-19 is recorded in `research/serps/2026-09-19-competitor-snapshot.json`.

## Search Console State

Not configured (planned: a Domain property verified via DNS once DNS is configured and a production deployment exists).

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

1. ~~Domain registration.~~ **Resolved 2026-09-19:** the operator registered `indysewerresource.com`. Remaining sub-question: when to point DNS at a host, which is a deployment decision and is not scheduled.
2. Remaining Lawrence uncertainties (listed under Lawrence Municipal Evidence Status). Confirm them with Lawrence Utilities.

   **Indexing policy (operator-approved reconciliation, 2026-09-19).** An unresolved Lawrence question does not by itself block indexing. It blocks indexing whenever the page makes, or depends on, a material claim about that unresolved fact. A Lawrence page may be indexed only when: it makes no material claim about an unresolved fact; every material claim it does make is verified or explicitly labeled; it passes the Location Page Quality Gate (5 of 8 categories including 2 authoritative local primary-source categories); and every other gate in `03-GOOGLE-RESILIENCE.md` passes, including expert review, publication score, similarity QA, the Commodity Content Test, the Perfect-AI-Detection Test, the Doorway Page Firewall, and operator index approval. Unknown facts are omitted, explicitly qualified, or held as internal TODOs — never guessed. No threshold or gate is weakened by this reconciliation.
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
9. AI-agent GitHub identity: should agents use a separate non-admin GitHub account or token, so the code-owner/index-approval boundary binds them? (Phase 2A limitation.)
10. ~~Repository visibility.~~ **Resolved 2026-09-19:** the operator decided the repository stays **public**. Research, strategy, and documentation are publicly readable by choice.
11. Contact-PII protection beyond the platform: should `lead_contacts` use application-level (field) encryption, or is Cloudflare's platform encryption-at-rest sufficient? Phase 2B did not implement extra encryption, and did not decide this. Operator/legal decision.
12. Retention and deletion mechanics: the append-only triggers block UPDATE but deliberately allow DELETE so lawful deletion stays possible. The actual retention periods and the deletion procedure are still OPEN (Open Question 3).
13. Dead-letter queue: when Cloudflare Queues are provisioned, should the lead-delivery consumer have a dead-letter queue, and with what retention and alerting? Without one, messages that exhaust `max_retries` are deleted permanently. Phase 2C mitigates this in the application (a durable terminal state plus operator follow-up before retries run out) but did not decide the infrastructure. Operator decision.
14. Partner notification content: may a partner notification contain homeowner contact details directly, or must the partner always retrieve them from the protected operational layer? Phase 2C implements the identifier-only option and did not decide the production answer, which also depends on the legal review in Open Question 3. Operator decision.

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
- **Agent identity / inert code-owner rule:** AI agents use the operator's own GitHub account, which is also the sole code owner. As observed on PR #2, GitHub then requires no code-owner review, so `index-governance-code-owner-review` does not currently constrain agents. `main-protection` (PR plus required checks, no bypass) still binds everyone. A separate non-admin identity for agents is needed to make the index-approval boundary binding on agents.
- **Public repository (accepted):** the repository is public by operator decision. Strategy, competitor research, and prospective-tenant research stay publicly readable, including by competitors. This is a known, accepted trade-off rather than an open question.
- **Pre-publication content quality:** three real pages now exist and none has had a human editorial pass by the operator or review by a sewer professional. They are `noindex`, so the exposure is limited to anyone reading the public repository, but the Lawrence page states municipal rules and must be reviewed before it is ever published to search.
- **Privacy/consent legal review** is required before live lead routing. The Phase 2B code path is disabled until that review and the production bindings exist, so this is enforced in code, not only in policy.
- **At-least-once delivery window:** delivery is idempotent through database uniqueness plus provider idempotency keys, but a consumer that crashes mid-send leaves an attempt that another consumer may take over after the lease (120 seconds). That duplicate is then suppressed by the provider's own idempotency window (Resend documents 24 hours), not by this code. A crash plus a retry older than that window could in principle produce a second notification.
- **Lead data protection:** the schema minimizes and separates PII, but field-level encryption and retention/deletion mechanics are undecided (Open Questions 11–12).
- **Expert reviewer** is still required for pages where `04-CONTENT-EDITORIAL-SYSTEM.md` requires expert review. Those pages stay `noindex` until one exists.
- **Algorithm-update risk:** handled by protocol in `03-GOOGLE-RESILIENCE.md`.

## Current Blockers

- None block the next implementation phase.
- Before **production publishing**: DNS and hosting configuration for the registered domain, a deployment, real pages passing the indexing gate with operator approval, and the Launch Checklist in `05-BUILD-SPEC.md`. The domain is owned and branch/index governance is configured; the development shell has been replaced by real pages.
- Before **live lead collection/routing**: legal review of consent/privacy/disclosure/retention, plus provisioning D1/Queues/Turnstile and setting the activation configuration. Until then the intake endpoint fails closed.
- Before the **Lawrence page can be indexed**: a real expert review (none exists), a human editorial pass by the operator, a publication score of 85 (63 today), the embedding half of similarity QA (the runner exists; no API key, so it reports `not_run`), manual accessibility review, and operator index approval. The Location Page Quality Gate now passes on evidence (5 of 8, all authoritative local primary-source). Confirming the open Lawrence questions with Lawrence Utilities is what would raise the evidence categories and the score; an unresolved question only blocks indexing where the page makes or depends on a claim about it (see Open Question 2).

## Last Major Decisions

- 2026-09-20 — Phase 2E implemented (operator-authorized): four new verified City of Lawrence sources and ten new research records; a separate technical-standards evidence file for general method mechanics; the Location Page Quality Gate reassessed from 3 of 8 to 5 of 8; the publication score re-scored from 55 to 63; operator-directed editorial corrections on all three pages; and the similarity-QA runner implemented with the embedding check failing closed. No page became indexable.
- 2026-09-19 — **Operator registered `indysewerresource.com`** and decided the **GitHub repository stays public**. The domain is configured as the canonical production origin; no DNS change, hosting, or deployment followed.
- 2026-09-19 — Operator-approved indexing-policy reconciliation for unresolved Lawrence questions (Open Question 2). No gate or threshold was weakened.
- 2026-09-19 — Phase 2D implemented (operator-authorized): real branded shell, homepage, flagship Lawrence sewer-lateral resource, and methodology page, all `published_noindex`; development shell removed. Details in `05` → Implementation Record: Phase 2D.
- 2026-09-19 — Phase 2C implemented (operator-authorized): idempotent queue consumer, delivery idempotency enforced by a UNIQUE key in `lead_events` (migration 0002), partner notification destinations, Resend/Twilio adapters, a notification activation boundary separate from intake, retry/terminal handling capped at 5 attempts, and operator follow-up queries. No queue, provider account, key, or deployment was created, and nothing was sent. Details in `05` → Implementation Record: Phase 2C.
- 2026-09-19 — Phase 2B implemented (operator-authorized): physical lead schema and migration, intake contract, routing, persist-before-queue delivery, idempotency, enrichment (outcomes/calls/uploads), and a fail-closed live-intake activation boundary. Implementation-level choices are recorded in `05` → Implementation Record: Phase 2B. `miniflare` was added as a dev dependency so tests execute real SQL locally.
- 2026-09-19 — Phase 2A implemented (operator-authorized) and merged via PR #1:
  - Astro 7.3.3 / TypeScript 6.0.3 / `@astrojs/cloudflare` 14.3.2 / Zod 4.6.5
  - publication records in `content/publication-records/`; operator approvals in `governance/index-approvals.json`
  - `utility` page type (never indexable)
  - GitHub rulesets `main-protection` (no bypass) and `index-governance-code-owner-review` (admin bypass via PR only)
  - implementation-level choices recorded in `05` → Implementation Record: Phase 2A
- 2026-09-19 — Operator approved WCAG 2.2 Level AA as the formal accessibility target, and approved correcting the stale Phase 0 wording in `03`/`04` to match the Phase 1 architecture (similarity tooling pointer, page-record pointer, workflow-record storage pointer, `04` step 20 "Index Approval"). No thresholds, gates, or workflow steps changed.
- 2026-09-19 — Phase 1 approved by the operator and locked in `05-BUILD-SPEC.md`:
  - brand Indy Sewer Resource; target domain `indysewerresource.com` (not registered at the time of that decision; registered 2026-09-19)
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

1. Operator: a human editorial pass over the three Phase 2D pages.
2. Begin identifying a real expert reviewer (Indiana-licensed plumber with trenchless/CIPP experience). Expert review is required for the Lawrence page and is currently absent.
3. Confirm the remaining Lawrence uncertainties directly with Lawrence Utilities and record the results in `research/sources/lawrence-primary-sources.json`. That is what raises the location gate above 3 of 8 and the publication score above 55.
4. Operator: start the legal review of consent/privacy/retention/disclosure. It blocks live lead collection, which is currently disabled in code.
5. Operator decisions: a separate non-admin GitHub identity for AI agents; contact-PII encryption and retention mechanics; the AI-use disclosure policy (Open Questions 7, 9, 11–12).

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
- 2026-09-19 — Phase 2A: build foundation and indexing firewall merged via PR #1 (`b3c60e6`). Rulesets `main-protection` and `index-governance-code-owner-review` configured and read back. `05-BUILD-SPEC.md` gained an Implementation Record and governance status. Audit trail in a follow-up PR. No deployment, cloud/vendor resources, domain purchase, leads, or indexable content.
- 2026-09-19 — Phase 2B: lead-data/backend foundation. Added `migrations/0001_lead_data_foundation.sql` (10 tables, 14 indexes, 4 append-only triggers, no seed data), `src/lib/leads/*` (contracts, repository, routing, intake, enrichment, activation, Turnstile, HTTP adapter, logging), the disabled `POST /api/lead-intake` route, 58 backend tests against local D1, and `npm run validate:migrations` in CI. Updated `05-BUILD-SPEC.md` (Implementation Record: Phase 2B and section statuses) and this file. No remote database, queue, notification provider, upload storage, deployment, domain purchase, lead collection, or indexable content.
- 2026-09-19 — Phase 2C: added `migrations/0002_delivery_foundation.sql`, the queue consumer, provider adapters, notification activation, and operator queries under `src/lib/leads/`, plus 40 tests. Updated `05-BUILD-SPEC.md` (Implementation Record: Phase 2C) and this file. No infrastructure, account, key, deployment, content, or indexing change.
- 2026-09-19 — Phase 2D: replaced the development shell with three real pages (`/`, `/lawrence-sewer-lateral-repair/`, `/about/`), added the site shell, design system, evidence components, and the decision-flow diagram, and recorded honest publication records (0 indexable, 0 approvals). Reconciled the registered domain, the public-repository decision, and the Lawrence indexing policy in this file. No deployment, no DNS change, no lead collection, no indexable page.
- 2026-09-20 — Post-Phase-2D reconciliation of this file only: corrected the stale verified-commit pointer, the accessibility wording, the project-status paragraph (registered domain, development shell removed, three real pages), the Not Started list, the architecture and Search Console wording, the production-publishing blocker, and the priorities. Documentation only: no code, content, publication record, research, governance, infrastructure, deployment, or strategy change.
- 2026-09-20 — Phase 2E: verified four new City of Lawrence sources and added ten research records plus a technical-standards evidence file; corrected editorial overclaims on the Lawrence, About, and home pages; reassessed the location gate (3/8 → 5/8) and the publication score (55 → 63); implemented the similarity-QA runner and added it to CI. No deployment, no lead path, no index approval, and no page became indexable.
