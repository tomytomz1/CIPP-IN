# BUILD SPECIFICATION

Owner of: the technical implementation specification and the Definition of Done.

Strategic constraints come from higher-precedence documents (`/AGENTS.md`, `00`, `03`, `04`, `02`). Where a section below lists constraints, they are inherited requirements, not technology choices.

## Status

**NOT YET LOCKED**

No stack, vendor, domain, or schema has been chosen. Do not make silent technology decisions: propose options to the operator, record the decision in `01-CURRENT-STATE.md` → Last Major Decisions, then update this file. Target phase for locking: PHASE 1 — Brand, Domain, Technical Architecture & Build Specification.

---

## Approved Stack

NOT YET LOCKED.

## Repository Structure

NOT YET LOCKED.

Current contents: `AGENTS.md`, `CLAUDE.md`, `docs/`. No application code.

## Deployment

NOT YET LOCKED.

## Environment Variables

NOT YET LOCKED. Constraint: secrets must never be committed to the repository.

## Domain / Brand

NOT YET LOCKED.

Constraints: the brand must represent an independent resource, not a fake plumbing company or a contractor identity (`00-PROJECT-CHARTER.md`). The domain is owned by us and is never transferred to the renter as part of the rental.

## Design System

NOT YET LOCKED.

## Routes

NOT YET LOCKED.

Constraint: no route may be created per keyword variant or per municipality without passing the gates in `03-GOOGLE-RESILIENCE.md` and the split test in `02-SEO-SERP-BLUEPRINT.md` → Page Strategy. No placeholder municipality routes.

## Page Specifications

NOT YET LOCKED. Each page specification, once written, must reference its completed workflow record (`04-CONTENT-EDITORIAL-SYSTEM.md`).

## Shared Components

NOT YET LOCKED.

## Lead Funnel

NOT YET LOCKED.

Inherited requirements:

- Lead routing to a single exclusive partner must be supported, with partner attribution, without transferring editorial or technical control (`00-PROJECT-CHARTER.md` → Future Rental Model).
- Routing must be reconfigurable (e.g., partner change or no partner) without rewriting content.
- Disclosure of partner routing at the point of contact (`04-CONTENT-EDITORIAL-SYSTEM.md` → Disclosure).

## Lead Database Schema

NOT YET LOCKED. See First-Party Data Collection for the placeholder data model.

## Call Tracking

NOT YET LOCKED.

Constraint: call tracking must not create fake local presence (no fake addresses or fake Google Business Profile).

## Analytics

NOT YET LOCKED.

## Conversion Events

NOT YET LOCKED. Qualified leads, not raw submissions, are the primary success measure (`02-SEO-SERP-BLUEPRINT.md` → Organic Success Metrics); event design must allow qualified vs. unqualified classification.

## Search Console

NOT YET LOCKED. Not configured.

## Schema / Structured Data

NOT YET LOCKED.

Constraints: structured data must describe only what is true. No `LocalBusiness`/plumber markup presenting the site as a plumbing business, no review/rating markup without genuine, eligible reviews, no fake addresses (`/AGENTS.md` §4.6).

## Sitemap

NOT YET LOCKED. Constraint: only pages that passed the Indexing Gate (`03-GOOGLE-RESILIENCE.md`) may appear in the sitemap.

## Robots

NOT YET LOCKED. Constraint: default for new/draft pages is `noindex`; indexability must be an explicit, per-page decision.

## Canonicals

NOT YET LOCKED.

## Internal Linking

NOT YET LOCKED. Strategy owner: `02-SEO-SERP-BLUEPRINT.md`.

## Performance Budget

NOT YET LOCKED.

## Accessibility

NOT YET LOCKED.

## Privacy / Consent

NOT YET LOCKED.

Open requirements needing legal review before launch: consent for sharing homeowner contact data with a contractor, privacy policy, call recording notice/consent, data retention, and partner disclosure wording.

## Security

NOT YET LOCKED.

## First-Party Data Collection

Placeholder data model — **NOT YET LOCKED**. No fields, storage, or collection mechanism have been approved.

Goal: eventually the architecture should be capable of storing, where appropriate and lawful:

- municipality
- ZIP
- homeowner status
- reported problem
- backup frequency
- previous cleaning
- camera performed?
- known defect
- pipe material if known
- pipe location
- driveway/foundation crossing
- urgency
- proposed repair method
- quote range if voluntarily provided
- contractor routed to
- response time
- appointment
- project won/lost
- final repair method
- final price if voluntarily provided

**Do NOT collect all of this blindly from the public lead form.** Separate the data into:

| Group | Source | Principle |
|---|---|---|
| **Initial lead data** | Homeowner, at first contact | Minimum needed to route and qualify (e.g., contact method, municipality/ZIP, reported problem, urgency). Final field list NOT YET LOCKED. |
| **Optional homeowner-supplied information** | Homeowner, voluntarily, after or beyond first contact | Clearly optional (e.g., camera results, pipe material, quote range). Never required to receive help. |
| **Contractor/outcome enrichment** | Partner contractor and internal records | Routing, response time, appointment, won/lost, final method, final price if voluntarily provided. Requires contractual reporting terms (NOT YET LOCKED). |

Principles:

- **Privacy minimization:** collect only what serves the homeowner or measurable lead quality.
- Any first-party data published or used in content must be aggregated/anonymized and must genuinely exist; never fabricated or extrapolated and presented as data (`/AGENTS.md` §4.1).
- Retention, access control, and deletion rules: NOT YET LOCKED.

## Admin / Content Workflow

NOT YET LOCKED.

Inherited requirement: the system must record, per page, the outputs of the workflow steps in `04-CONTENT-EDITORIAL-SYSTEM.md` (sources, claim labels, expert review, similarity results, publication score, indexability decision). The renter has no unrestricted publishing rights.

## Publication-Quality Enforcement

NOT YET LOCKED (tooling).

Inherited requirements from `03-GOOGLE-RESILIENCE.md`:

- default `noindex` for new pages
- indexability blocked unless the Indexing Gate is recorded as passed
- Similarity QA (embedding model NOT YET LOCKED; record model per score)
- Publication Score recorded per page
- Location Page Quality Gate recorded per municipality page

## Testing Requirements

NOT YET LOCKED.

## Launch Checklist

NOT YET LOCKED. Will include, at minimum: Privacy/Consent legal review complete, disclosure present, tracking verified, robots/sitemap/canonicals verified, and every indexable page passing the Indexing Gate.

## Definition of Done

Full definition NOT YET LOCKED. Minimum, already binding:

A piece of work is done only when:

1. Relevant tests/checks pass and the agent has inspected its own output.
2. No non-negotiable in `/AGENTS.md` §4 is violated.
3. Any indexable page has passed the Indexing Gate in `03-GOOGLE-RESILIENCE.md`, with records stored.
4. No `NOT YET LOCKED` decision was made silently.
5. `01-CURRENT-STATE.md` is updated (status, decisions, change log).
6. Changes, unresolved risks, and the commit SHA (when Git exists) are reported.
