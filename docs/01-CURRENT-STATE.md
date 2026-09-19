# CURRENT STATE

Last updated: 2026-09-19
Last verified commit: `c8cf100a85a023b4e03e5dfbfeac094439320507` (Phase 0). Phase 0.1 commit follows; see `git log`.
Production URL: None — no production deployment exists
Repository: https://github.com/tomytomz1/CIPP-IN
Current branch: main
Current phase: Phase 0.1 — Research evidence reconciliation (complete). Next: Phase 1 — Brand, Domain, Technical Architecture & Build Specification (not started).

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

## Current Project Status

Documentation and research evidence are in the repository. There is no website, framework, production deployment, indexing, or collected leads.

## Completed

- Market/competitive research (pre-Phase 0, per operator).
- Phase 0 documentation system: `AGENTS.md`, `CLAUDE.md`, `docs/00`–`docs/05` (2026-09-19).
- Git repository initialized and pushed to `main` at https://github.com/tomytomz1/CIPP-IN (2026-09-19).
- Phase 0.1 research evidence preserved and independently re-verified on 2026-09-19 (`/research/index.json`):
  - Lawrence municipal evidence: `research/sources/lawrence-primary-sources.json`
  - Prospective tenant evidence: `research/sources/prospective-tenants.json`
  - Google Search policy evidence: `research/sources/google-search-policy.json`
  - SERP/competitor snapshot: `research/serps/2026-09-19-competitor-snapshot.json`

## In Progress

- None.

## Not Started

- Brand selection
- Domain selection/registration
- Technical architecture / stack selection
- Build specification lock (`05-BUILD-SPEC.md` is a framework only)
- Website build
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

None. No application code exists. No framework has been chosen or installed. See `05-BUILD-SPEC.md` (status: NOT YET LOCKED).

## Current Indexed URLs

None.

## Current SEO State

No site exists. No rankings, impressions, or indexed pages. The competitive landscape as of 2026-09-19 is recorded in `research/serps/2026-09-19-competitor-snapshot.json`.

## Search Console State

Not configured.

## Analytics State

Not configured.

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

1. Brand name and positioning for the independent resource — NOT YET LOCKED.
2. Domain — NOT YET LOCKED.
3. Technical stack, hosting, CMS/content workflow — NOT YET LOCKED.
4. Remaining Lawrence uncertainties (listed under Lawrence Municipal Evidence Status). Confirm them with Lawrence Utilities before any Lawrence page is indexed.
5. Legal review of lead-sharing consent, privacy policy, call recording, and partner disclosure — NOT YET LOCKED.
6. Rental contract terms (pricing, exclusivity boundaries, term, performance) — NOT YET LOCKED.
7. Embedding model and tooling used for Similarity QA (`03-GOOGLE-RESILIENCE.md`) — NOT YET LOCKED.
8. Expert reviewer identity — none recruited; must be a real, verifiable professional.
9. Whether to add an on-page AI-use disclosure ("How" content was made) to `04-CONTENT-EDITORIAL-SYSTEM.md`. Google's people-first and gen-AI guidance suggest considering it (`research/sources/google-search-policy.json` goog-003, goog-005). Operator decision.

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
- **Algorithm-update risk:** handled by protocol in `03-GOOGLE-RESILIENCE.md`.

## Current Blockers

- Phase 1 decisions (brand, domain, architecture) are required before any build work.
- The remaining Lawrence uncertainties must be confirmed with Lawrence Utilities before any Lawrence content is indexed. This does not block Phase 1.

## Last Major Decisions

- 2026-09-19 — Research evidence stored as structured JSON under `/research/`, subordinate to `/docs/` (Phase 0.1).
- 2026-09-19 — Lawrence private-lateral owner responsibility, permit framework, lining/bursting allowance, and post-repair CCTV requirement recorded as verified from current primary sources. Remaining uncertainties listed explicitly.
- 2026-09-19 — Documentation system and precedence hierarchy adopted (`/AGENTS.md`).
- 2026-09-19 — Lawrence confirmed as SEO beachhead; Indianapolis head terms deferred.
- 2026-09-19 — All technical architecture decisions deliberately left NOT YET LOCKED.

## Next 5 Priorities

1. PHASE 1 — Brand and domain decision.
2. PHASE 1 — Technical architecture decision and lock of `05-BUILD-SPEC.md`.
3. Confirm the remaining Lawrence uncertainties directly with Lawrence Utilities and record the results in `research/sources/lawrence-primary-sources.json`.
4. Decide on AI-use disclosure policy (Open Question 9).
5. Begin identifying a real expert reviewer (Indiana-licensed plumber with trenchless/CIPP experience).

## Change Log

- 2026-09-19 — Phase 0: created `AGENTS.md`, `CLAUDE.md`, and `docs/00-PROJECT-CHARTER.md` through `docs/05-BUILD-SPEC.md`. No code, framework, content, domain, or data created.
- 2026-09-19 — Initialized Git repository; pushed Phase 0 documentation to `main` at https://github.com/tomytomz1/CIPP-IN (commit `c8cf100`).
- 2026-09-19 — Phase 0.1: created `/research/` evidence files (index, Lawrence primary sources, prospective tenants, Google policy, SERP snapshot). Re-verified Lawrence rules, competitors, tenant candidates, and Google policy. Reconciled this file and `02-SEO-SERP-BLUEPRINT.md`, added the research row to the ownership table in `AGENTS.md`, and made a narrow repository-contents correction in `05-BUILD-SPEC.md`. No code, framework, content, domain, or fake data created.
