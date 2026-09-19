# CURRENT STATE

Last updated: 2026-09-19
Last verified commit: Initial commit on `main` (Phase 0 documentation) — see `git log` for SHA
Production URL: None — no production deployment exists
Repository: https://github.com/tomytomz1/CIPP-IN
Current branch: main
Current phase: Phase 0 — Project documentation / memory system (complete, pending operator review)

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

## Current Project Status

Documentation architecture has been created. No website, code, framework, domain, content, or data exists. Nothing is deployed or indexed.

## Completed

- Market/competitive research: **substantially complete** (per operator). Note: the underlying research notes, SERP captures, and source citations are **not stored in this repository**. Only the conclusions the operator supplied are recorded in `02-SEO-SERP-BLUEPRINT.md`.
- Phase 0 documentation system: `AGENTS.md`, `CLAUDE.md`, `docs/00`–`docs/05` created (2026-09-19).
- Git repository initialized and Phase 0 documentation pushed to `main` at https://github.com/tomytomz1/CIPP-IN (2026-09-19).

## In Progress

- Operator review of Phase 0 documentation.

## Not Started

- Brand selection
- Domain selection/registration
- Technical architecture / stack selection
- Build specification lock (`05-BUILD-SPEC.md` is a framework only)
- Website build
- Lawrence primary-source (municipal/utility) evidence collection in a citable, stored form
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

## Current Architecture

None. No application code exists. No framework has been chosen or installed. See `05-BUILD-SPEC.md` (status: NOT YET LOCKED).

## Current Indexed URLs

None.

## Current SEO State

No site exists. No rankings, impressions, or indexed pages.

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

None identified or contacted. (Competitors listed in `02-SEO-SERP-BLUEPRINT.md` are SERP competitors, not tenant candidates, unless the operator records otherwise here.)

## Open Questions

1. Brand name and positioning for the independent resource — NOT YET LOCKED.
2. Domain — NOT YET LOCKED.
3. Technical stack, hosting, CMS/content workflow — NOT YET LOCKED.
4. Which utility/authority governs sanitary sewer laterals serving Lawrence, Indiana, and where responsibility splits between property owner and utility/municipality — **unverified**; must be established from primary sources before any Lawrence page is indexed.
5. Lawrence permit, inspection, CCTV, lining, and pipe-bursting requirements — **unverified**; to be collected from primary sources.
6. Where the Phase 0 research evidence (source URLs, SERP captures, municipal documents) should be stored in the repository (e.g., a non-Markdown evidence/data folder) without creating extra strategy documents — operator decision needed.
7. Legal review of lead-sharing consent, privacy policy, call recording, and partner disclosure — NOT YET LOCKED.
8. Rental contract terms (pricing, exclusivity boundaries, term, performance) — NOT YET LOCKED.
9. Embedding model and tooling used for Similarity QA (`03-GOOGLE-RESILIENCE.md`) — NOT YET LOCKED.
10. Expert reviewer identity — none recruited; must be a real, verifiable professional.

## Known Risks

- **Doorway/thin-content risk** if expansion to other municipalities is rushed. Mitigated by the Location Page Quality Gate.
- **Unverified local facts:** Lawrence sewer governance/responsibility is not yet verified; publishing before verification would violate core rules and could mislead homeowners.
- **Competitive difficulty:** Indianapolis head CIPP terms are materially harder (NuFlow Indy has genuine technical topical authority).
- **Rental viability uncertainty:** ~$5,000/month depends on demonstrated qualified opportunity volume and contractor economics; not proven.
- **Lead quality risk:** traffic or form fills may not translate into qualified trenchless opportunities.
- **Legal/compliance risk** around sharing homeowner contact data with a contractor and call recording, pending legal review.
- **Research provenance risk:** research conclusions exist but supporting evidence is not stored in the repository.
- **Algorithm-update risk:** handled by protocol in `03-GOOGLE-RESILIENCE.md`.

## Current Blockers

- Phase 1 decisions (brand, domain, architecture) required before any build work.
- Primary-source verification of Lawrence lateral responsibility and rules required before any Lawrence content can be indexed.

## Last Major Decisions

- 2026-09-19 — Documentation system and precedence hierarchy adopted (`/AGENTS.md`).
- 2026-09-19 — Lawrence confirmed as SEO beachhead; Indianapolis head terms deferred.
- 2026-09-19 — All technical architecture decisions deliberately left NOT YET LOCKED.

## Next 5 Priorities

1. Operator review and approval of the Phase 0 documentation.
2. Decide where and how Phase 0 research evidence and Lawrence primary sources will be stored (Open Question 6), then store them.
3. Begin primary-source verification of Lawrence lateral responsibility and rules (Open Questions 4–5).
4. PHASE 1 — Brand and domain decision.
5. PHASE 1 — Technical architecture decision and lock of `05-BUILD-SPEC.md`.

## Change Log

- 2026-09-19 — Phase 0: created `AGENTS.md`, `CLAUDE.md`, and `docs/00-PROJECT-CHARTER.md` through `docs/05-BUILD-SPEC.md`. No code, framework, content, domain, or data created.
- 2026-09-19 — Initialized Git repository; pushed Phase 0 documentation to `main` at https://github.com/tomytomz1/CIPP-IN.
