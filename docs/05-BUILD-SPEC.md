# BUILD SPECIFICATION

Owner of: the technical implementation specification and the Definition of Done.

Strategic constraints come from higher-precedence documents (`/AGENTS.md`, `00`, `03`, `04`, `02`). This document implements them; it never weakens them. Where this spec and a higher document appear to conflict, the higher document wins (`/AGENTS.md` §1). Report the conflict; do not resolve it silently.

## Status

**PHASE 1 ARCHITECTURE LOCKED — approved by the human operator on 2026-09-19.**

This document distinguishes three kinds of items:

| Label | Meaning |
|---|---|
| **LOCKED** | Operator-approved architectural decision. Change only with explicit operator approval, logged in `01-CURRENT-STATE.md` → Last Major Decisions. |
| **IMPLEMENTATION PENDING** | Locked architecture that has not been built. No application code, package, infrastructure, account, or deployment exists yet. |
| **OPEN** | Legal, business, or operational question that is still unresolved. Must not be decided silently by an agent. |

Implementation-level details that this spec leaves unspecified (exact file names, library versions, header values, table column names) may be decided during the build. Record them in the run receipt and, if material, in this document. They must preserve every LOCKED requirement below.

---

## Architecture Principles (Cost / Complexity) — LOCKED

Optimize, in order, for:

1. very fast site
2. excellent technical SEO
3. low maintenance
4. low recurring fixed cost
5. reliable lead capture
6. structured first-party data
7. enforceable Google-resilience gates
8. easy handoff between AI coding agents
9. minimal unnecessary infrastructure

The architecture intentionally avoids at launch:

- a paid headless CMS
- a separate Postgres/Supabase dependency
- a full SaaS authentication product
- CallRail (until multi-number attribution requires it)
- an enterprise backup stack
- an ORM (until schema complexity requires it)

Do not write current third-party prices into permanent requirements. Any price used for planning must be labeled as a dated estimate.

---

## Approved Stack — LOCKED (IMPLEMENTATION PENDING)

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Astro + TypeScript** | Static-first; public editorial pages pre-rendered. Client JS only where real interactivity requires it. React islands allowed later only where functionality justifies them. Next.js not used. |
| Hosting / runtime | **Cloudflare Workers + Static Assets** | Cloudflare DNS/CDN for the production domain. |
| Backend | **Cloudflare Worker request handlers** | Narrow, server-side only. Browsers never receive database credentials. |
| Database | **Cloudflare D1** | SQL migrations; explicit SQL / prepared statements. No ORM at launch. |
| File / media storage | **Private Cloudflare R2** | Optional homeowner camera reports/images/video; internal exports/backups. Short-lived presigned URLs when direct browser upload/download is implemented. |
| Async processing | **Cloudflare Queues** | Lead delivery and notifications (see Queue / Notification Reliability). |
| Abuse protection | **Cloudflare Turnstile** | Server-side token verification required. |
| Operator admin auth | **Cloudflare Access** | No custom username/password system. |
| Email notification | **Resend** | Asynchronous, after lead persistence. |
| SMS / phone | **Twilio** | SMS optional, not a launch dependency. Initial call tracking (see Call Tracking). |
| Analytics | **Cloudflare Web Analytics** + first-party events in D1 + **Google Search Console** | GA4/GTM are not launch dependencies. |
| Similarity QA embeddings | **OpenAI `text-embedding-3-small`** | Plus deterministic duplication checks (see Publication-Quality Enforcement). |
| Content management | **Git** (Markdown/MDX + structured records) | No WordPress, Sanity, Contentful, Strapi, or other headless CMS at launch. |

---

## Repository Structure — LOCKED at responsibility level (IMPLEMENTATION PENDING)

Current contents: `AGENTS.md`, `CLAUDE.md`, `docs/`, `research/` (JSON evidence), `logs/` (run audit trail). No application code.

Intended future organization. Responsibilities are locked; exact folder names are **not** locked unless stated, and are decided at build time following Astro conventions.

| Responsibility | Notes |
|---|---|
| `docs/` | Existing. Authoritative requirements. |
| `research/` | Existing. Supporting evidence (JSON). |
| `logs/` | Existing. Append-only run audit trail. |
| Application source (Astro) | Layouts, components, pages/routes. |
| Page/content source | Markdown/MDX for public page bodies. |
| Structured publication/evidence records | Per-page publication records, claim records, similarity/QA results, index-approval registry. Deterministic JSON (or similar), schema-validated. |
| Server handlers | Worker endpoints (lead intake, admin APIs, queue consumers). |
| Database migrations | Versioned SQL migrations for D1. |
| Shared libraries | Reusable server and client modules, schemas (TypeScript/Zod). |
| QA scripts | Indexing-gate evaluator, similarity QA, sitemap generation checks. |
| Tests | Unit, integration, SEO, performance, security checks (see Testing Requirements). |

---

## Deployment — LOCKED (IMPLEMENTATION PENDING)

- Production deploys only from the protected `main` branch after required CI checks pass.
- Pull requests / non-production branches should get preview deployments once implementation begins.
- **Preview environments are globally non-indexable** (`noindex` on every response, plus no production sitemap).
- No production infrastructure exists. None is created until the build phase, and production publishing waits for Branch / Index Governance to be in place.

## Branch / Index Governance — LOCKED (launch prerequisite; not yet configured)

Before production publishing begins, configure a protected `main` branch or GitHub ruleset with:

- required CI checks
- no unreviewed direct production changes
- an operator-controlled approval boundary for page-indexing decisions
- CODEOWNERS (or equivalent) protection over the index-approval registry and indexing configuration

AI coding agents normally work by branch / pull request, not by unrestricted direct production publishing. **A coding agent's or developer's deploy alone must never make a page indexable.**

Observed 2026-09-19 12:58 EDT (via GitHub API): `main` is **not protected** and the repository has **no rulesets**. This is acceptable for documentation-only work and must be fixed before production publishing.

## Environment Variables / Secrets — LOCKED principles (IMPLEMENTATION PENDING)

- Secrets are never committed.
- Use Cloudflare/Wrangler secret management for Worker secrets (e.g., Resend, Twilio, OpenAI, Turnstile secret keys).
- Browser bundles receive only public, non-secret configuration (e.g., the Turnstile site key).
- The exact variable inventory is decided at build time and documented then.

## Domain / Brand — LOCKED

- **Brand:** **Indy Sewer Resource**.
- **Positioning:** an independent Indianapolis-area sewer intelligence and homeowner decision-support resource focused on residential sewer laterals, diagnosis, repair-method decisions, and legitimate CIPP/trenchless opportunities.
- The site is **not** a plumbing company and must never imply it performs plumbing work (`04-CONTENT-EDITORIAL-SYSTEM.md` → Disclosure). It stays independently owned and editorially controlled, and must remain valuable if the renter changes.
- Lawrence is the SEO beachhead, not the master brand. Brand geography is the Indianapolis metro.
- **Target domain:** `indysewerresource.com` — **approved target, NOT purchased or owned by the project.** Registration is a separate operator action that needs separate authorization.
  - Point-in-time check: Verisign `.com` RDAP returned no registration record (HTTP 404) on 2026-09-19 16:58 UTC. This is not a registrar availability or price check, and availability can change at any time.
- Domain strategy:
  - `.com` is the preferred primary TLD.
  - Use a descriptive brand domain, not a keyword-stuffed exact-match domain.
  - No `lawrence`, `cipp`, `trenchless`, `lateral`, `pipe`, or `renewal` in the primary brand domain.
  - If the approved `.com` becomes unavailable, do not silently settle for another TLD or name. Return to the operator.
  - No defensive domain purchases without explicit operator approval.
- The domain is project-owned and never transferred to the renter (`00-PROJECT-CHARTER.md`).

## Design System

- **LOCKED constraints:** a system font stack at launch (0 custom-font bytes); performance and accessibility budgets below.
- **OPEN (implementation):** visual design, colors, component styling.

## Routes

- **LOCKED constraints:**
  - No route per keyword variant or per municipality unless it passes the gates in `03-GOOGLE-RESILIENCE.md` and the split test in `02-SEO-SERP-BLUEPRINT.md` → Page Strategy.
  - No placeholder municipality routes.
  - Route, page type, and canonical are defined centrally in page configuration/records, not ad hoc.
- **OPEN:** the specific URL plan. It is decided page by page through the content workflow in `04-CONTENT-EDITORIAL-SYSTEM.md`.

## Page Specifications

Every page has a publication record (see Publication / Indexing Architecture) that references its completed workflow outputs from `04-CONTENT-EDITORIAL-SYSTEM.md`. No page specification may skip or redefine that workflow.

## Shared Components — principles LOCKED

- Components render server-side/static by default and ship zero client JS unless interactive.
- Page configuration drives the SEO head (title, meta description, canonical, robots directive, structured data). Individual pages do not hand-write these.
- Partner attribution and disclosure blocks are data-driven components, fed by partner/routing data, so the renter can change without content edits.
- Lead forms are shared components that meet the Lead Funnel, Security, and Performance requirements.

---

## Content / Editorial Storage — LOCKED (IMPLEMENTATION PENDING)

- **Git is the initial CMS.**
- Public page bodies: Markdown / MDX.
- Structured editorial, QA, and evidence records: deterministic JSON (or similar), validated with TypeScript/Zod schemas once implementation begins.
- Git must preserve changes, attribution, review history, diffability, AI-agent handoff, evidence records, and publication-gate state.
- A CMS may be reconsidered only if human editorial throughput actually becomes a bottleneck, and only with operator approval.

## Publication / Indexing Architecture — LOCKED (IMPLEMENTATION PENDING)

**Public availability and Google indexability are separate states.**

Page lifecycle:

1. `draft`: not publicly shipped by default.
2. `review`: under editorial review.
3. `published_noindex`: public and useful, but emits `noindex`; not in the sitemap.
4. `index_candidate`: gates being evaluated; still `noindex`; not in the sitemap.
5. `indexable`: effective indexability computed as below; in the sitemap.

Every new page defaults to **`draft` / `noindex`** (`03-GOOGLE-RESILIENCE.md`). Publishing or deploying a page never makes it indexable.

### Per-page publication record (minimum)

- **Identity:** page ID, route, page type, target intent, responsible editor/owner where relevant.
- **Workflow:** completion/status of every step of the mandatory workflow in `04-CONTENT-EDITORIAL-SYSTEM.md`. That workflow is not weakened or redefined here.
- **Evidence:** evidence package references, primary-source references, source freshness / reverification status.
- **Claims:** per material claim where required: claim ID, `FACT` / `INFERENCE` / `ESTIMATE`, supporting evidence/source IDs.
- **Expert review:** whether it is required, reviewer identity, credential/context, review scope, date, outcome/required changes. Real data only; never invented (`04` → Expert Review).
- **Similarity QA:** see Publication-Quality Enforcement.
- **Publication score:** each criterion score, the system-calculated total, required threshold, scorer, date. Only component scores are entered; the system calculates the total, and a typed total is never accepted.
- **Municipality gate** (location pages): applicability, each qualifying evidence category, which are authoritative local primary-source categories, pass/fail. The requirement is unchanged: at least **5 of 8**, including at least **2** authoritative local primary-source categories (`03`).
- **Other hard gates:** Commodity Content Test, Perfect-AI-Detection Test, Doorway Page Firewall, Technical SEO QA, Internal Linking QA, Conversion QA, expert review where required.

### Indexability calculation

Effective indexability is computed from recorded evidence, never set by a casual toggle:

```text
indexable = hard_gates_passed
        AND publication_threshold_passed
        AND required_evidence_current
        AND operator_index_approval_present
```

- Thresholds are unchanged from `03-GOOGLE-RESILIENCE.md`: general indexable page **≥ 80/100**; money/location page **≥ 85/100**. A hard-gate failure blocks indexing regardless of score.
- Operator index approval is a separate governance requirement, held in an operator-controlled, CODEOWNERS-protected registry (see Branch / Index Governance).
- This calculation implements the Indexing Gate in `03-GOOGLE-RESILIENCE.md` plus the operator-approval requirement. It never replaces or relaxes that gate.

## Sitemap — LOCKED (IMPLEMENTATION PENDING)

Include only effectively `indexable` canonical URLs. `draft`, `review`, `published_noindex`, and `index_candidate` URLs never appear in the production XML sitemap. Only the production canonical site is submitted to Search Console.

## Robots — LOCKED (IMPLEMENTATION PENDING)

- Draft pages are not shipped publicly by default.
- Public pages that have not passed the indexing gates emit `noindex`.
- `robots.txt` blocking is not a substitute for `noindex`.
- Preview environments are globally non-indexable.

## Canonicals — LOCKED (IMPLEMENTATION PENDING)

Canonicals are generated centrally from route/page configuration. No ad hoc per-page canonical strings.

## Internal Linking — implementation constraints LOCKED

- Strategy owner: `02-SEO-SERP-BLUEPRINT.md`. QA requirements: `04-CONTENT-EDITORIAL-SYSTEM.md` step 18.
- Build checks must detect broken internal links and orphan indexable pages.

## Schema / Structured Data — LOCKED

Use structured data only when it accurately describes reality.

- **Permitted where truthful:** `WebSite`, `WebPage`, `Article` (where applicable), `BreadcrumbList`, real `Person` reviewer attribution (consented and accurate), and publisher `Organization` only once accurately established.
- **Prohibited:** presenting the site as a `Plumber`; fake `LocalBusiness`; fake address; fake ratings/reviews or `AggregateRating`; contractor business schema that misrepresents the independent resource as the contractor.

Higher-precedence rules still control (`/AGENTS.md` §4.2, §4.6).

---

## Lead Funnel — LOCKED (IMPLEMENTATION PENDING)

Inherited requirements (unchanged):

- Exclusive partner routing with truthful attribution, without transferring editorial or technical control (`00-PROJECT-CHARTER.md`).
- Routing can be reconfigured (partner change, or no active partner) without rewriting content.
- Partner routing is disclosed at the point of contact (`04` → Disclosure).

### Initial homeowner intake (collect only)

- first name
- phone and/or email (at least one usable contact method required)
- preferred contact method
- municipality
- ZIP code
- problem category
- short optional description
- urgency
- whether a sewer camera inspection has already been performed
- whether the submitter is the homeowner / decision-maker
- **explicit consent** to share/route contact information to the contractor partner

Not initially required: full street address, pipe material, pipe depth, household income, insurance information, exact project value, existing contractor, detailed quote, camera video, or any other unnecessary personal information.

**OPEN:** exact consent wording. It requires legal review before any live lead collection or routing.

### Optional homeowner enrichment (never required to receive help)

Camera inspection date; known camera defect/finding; backup frequency; prior cleaning; pipe material if genuinely known; approximate line/location information; driveway/foundation crossing; voluntarily provided proposed repair method; voluntarily provided quote information; camera images/report/video.

### Contractor / outcome enrichment

Routed contractor; delivery timestamp; first-contact timestamp; response time; appointment scheduled; appointment held; qualified/unqualified; diagnosis; proposed repair method; quote band; won/lost; lost reason; final repair method; voluntarily provided final project value; completion date if useful.

Lifecycle actions are stored as immutable, event-style history rather than by overwriting historical facts. Contractor reporting obligations depend on rental contract terms (OPEN).

## Queue / Notification Reliability — LOCKED (IMPLEMENTATION PENDING)

```text
persist lead first -> enqueue delivery -> notify partner/operator
```

- The D1 lead record is the source of truth.
- A notification-provider or queue outage must never cause loss of the lead record.
- Failed deliveries are retryable and visible to the operator.
- If no partner is active, leads are still persisted and the operator is notified.
- Notifications (email/SMS) carry no unnecessary homeowner PII.

## Lead Database Schema — logical model LOCKED (IMPLEMENTATION PENDING)

Logical data domains. The physical schema may be refined during implementation as long as this separation and these requirements are preserved:

| Domain | Purpose |
|---|---|
| `leads` | Core lead record (non-contact intake fields, status). |
| `lead_contacts` | Contact PII, kept separate from analytical/outcome data. |
| `consents` | Consent captured per lead: wording version, timestamp, scope. |
| `lead_events` | Immutable lifecycle event history. |
| `lead_outcomes` | Qualification, diagnosis, quote band, won/lost, final method/value. |
| `partners` | Contractor partner records. |
| `routing_rules` | Configuration determining which partner receives which leads. |
| `lead_routes` | Immutable record of each lead's routing decision and delivery. |
| `calls` | Call identifiers, timestamps, duration, routing partner, disposition. |
| `uploads` | Metadata for private R2 objects (camera reports/images/video). |

These are logical domains, not migrations. No migration has been created.

## Partner / Renter Switching — LOCKED (IMPLEMENTATION PENDING)

- Partner identity and lead routing are driven by configuration and data (`partners`, `routing_rules`, `lead_routes`).
- A contractor's identity is never hard-coded into editorial content architecture.
- Each lead's historical routing decision stays immutable and auditable.
- Changing the active renter affects only future routing. It requires no content rewrite and transfers no ownership or editorial control. The domain remains project-owned.

## Call Tracking — LOCKED (IMPLEMENTATION PENDING)

- One operator-controlled local Twilio tracking number initially.
- Store call identifiers, timestamps, duration, routing partner, and disposition where available.
- Switching contractors must not require editorial content changes.
- **Call recording is OFF by default.** It is not implemented until legal review and consent requirements are resolved (OPEN).
- CallRail is not used at launch unless future scale/attribution needs justify it.
- Call tracking must not create fake local presence (no fake address or GBP).

## Analytics — LOCKED (IMPLEMENTATION PENDING)

- Cloudflare Web Analytics.
- First-party conversion, lead, and outcome events stored in D1.
- GA4 and Google Tag Manager are not launch dependencies. Add them later only for a concrete requirement that justifies the script and privacy cost.

## Conversion Events — LOCKED principles (IMPLEMENTATION PENDING)

Qualified leads, not raw submissions, are the primary success measure (`02-SEO-SERP-BLUEPRINT.md`). First-party events must support attributing leads and outcomes to pages, and classifying them qualified vs. unqualified. The exact event names are decided at build time.

## Search Console — LOCKED (not configured)

Use a Domain property, preferably verified through DNS, once the domain is registered. Only the production canonical, indexable site belongs in production Search Console and sitemaps.

---

## Performance Budget — LOCKED (testable in CI once implemented)

**Core Web Vitals (mobile, p75):** LCP ≤ 2.0 s; CLS ≤ 0.05; INP ≤ 150 ms.

**JavaScript (first-party, gzip):**

- Editorial/content pages: target **0 KB**; hard budget where justified **≤ 35 KB**.
- Lead/form pages: **≤ 75 KB**. Turnstile is excluded from the first-party number.

**CSS:** initial CSS ≤ 40 KB gzip.

**Images:** responsive images; AVIF/WebP where appropriate; explicit dimensions; below-fold images lazy-loaded; the LCP image generally ≈ 100–120 KB or less; SVG preferred for suitable diagrams.

**Fonts:** system font stack at launch (0 custom-font transfer bytes). If custom fonts are added later: self-hosted, WOFF2, tightly limited weights/files, and no third-party font calls.

**Third-party scripts:**

- Global: only Cloudflare Web Analytics, where technically necessary.
- Lead/form pages: may additionally load Turnstile.
- Not at launch without a justified requirement: Google Tag Manager, chat widgets, heatmaps, review widgets, autoplay video, marketing-script stacks.

## Accessibility

- **Expectations:** semantic HTML, keyboard-operable interactions, visible focus, labeled form fields with accessible error messages, sufficient color contrast, and meaningful alt text (decorative images marked as such). Accessibility is part of Technical SEO QA (`04` step 17).
- **OPEN (agent proposal, awaiting operator confirmation):** adopt WCAG 2.2 AA as the formal conformance target.

## Privacy / Consent

- **LOCKED principles:**
  - Minimize collection.
  - Separate contact PII from analytical/outcome data where practical.
  - Restrict access to homeowner PII.
  - No call recording by default.
  - Any first-party data published later must be real, aggregated/anonymized where appropriate, and reviewed before publication (`/AGENTS.md` §4.1).
- **OPEN (legal review required before live lead collection/routing):**
  - privacy-policy language
  - lead-sharing consent language
  - data retention/deletion periods
  - legal review of homeowner data sharing
  - call-recording legal requirements
  - partner disclosure wording

## Security — LOCKED (IMPLEMENTATION PENDING)

- Secrets are never committed; Cloudflare/Wrangler secret management.
- Cloudflare Access protects operational admin. No custom auth system initially.
- Browser clients never receive D1 credentials.
- R2 lead media stays private.
- Server-side validation of all lead inputs; input size limits.
- Rate limiting and abuse controls; Turnstile verified server-side.
- Idempotency / anti-duplicate protection for lead submission.
- Security headers include an appropriate CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. Exact values are decided at build time.
- No unnecessary PII in notifications or logs.
- No call recording by default.

## Backups / Recovery — LOCKED (IMPLEMENTATION PENDING)

1. D1 Time Travel / point-in-time recovery.
2. Scheduled D1 export to private R2 for longer-lived snapshots.
3. Once lead data becomes economically material, an encrypted backup held outside the Cloudflare account/platform.

**OPEN:** exact retention periods beyond platform PITR, subject to privacy/legal/data-retention decisions.

## First-Party Data Collection — LOCKED separation (IMPLEMENTATION PENDING)

Data is separated into three groups, as specified under Lead Funnel:

- **initial lead data**: minimal intake
- **optional homeowner-supplied information**: voluntary enrichment
- **contractor/outcome enrichment**: partner and internal records

Do not collect enrichment fields through the initial public form. Privacy minimization applies. Retention/deletion is OPEN (see Privacy / Consent).

Optional homeowner media upload (camera images/report/video to private R2) is supported by the architecture but **feature-controlled and off for MVP launch** until retention, security, and legal requirements are settled.

## Admin / Content Workflow — LOCKED (IMPLEMENTATION PENDING)

- Editorial content and publication records live in Git (see Content / Editorial Storage). Changes go through branch/PR review under Branch / Index Governance.
- The operational admin (leads, routing, partners, outcomes) is protected by Cloudflare Access.
- Contractor renters receive no unrestricted editorial administration and no publishing rights (`00-PROJECT-CHARTER.md`, `/AGENTS.md` §4.7).

## Publication-Quality Enforcement — LOCKED (IMPLEMENTATION PENDING)

Inherited requirements from `03-GOOGLE-RESILIENCE.md` (thresholds unchanged):

- Default `noindex` for new pages; indexability blocked unless the Indexing Gate is recorded as passed and operator approval is present.
- Publication Score recorded per page (components only; the system calculates the total).
- Location Page Quality Gate recorded per municipality page.

**Similarity QA tooling (LOCKED):** OpenAI `text-embedding-3-small`, plus deterministic checks for:

- sentence-level near-duplication
- heading-architecture similarity
- site-page cosine similarity
- competitor-page similarity where a competitor dossier exists

Thresholds are exactly those in `03-GOOGLE-RESILIENCE.md` → Semantic Similarity QA.

Every similarity record persists:

- model name
- run date/time
- candidate content hash
- comparison URL/page ID
- comparison content hash where applicable
- cosine score
- sentence-duplication percentage
- heading-architecture result
- manual-review outcome and reason when triggered

Scores from different embedding models are not comparable. If the model changes, rerun the active comparison corpus.

## Testing Requirements — LOCKED (IMPLEMENTATION PENDING)

The build phase must implement and enforce in CI at least:

- **Build / type / schema:** TypeScript typecheck; Astro build; structured-record schema validation; broken internal-link checks; malformed structured-data checks.
- **Indexing gate:** CI fails if any page requests indexability while required gates/records are missing or failed, or operator approval is absent.
- **SEO:**
  - canonical
  - robots/index directive
  - sitemap membership (indexable only)
  - metadata
  - structured-data honesty/validity
  - no orphan indexable page
  - preview environments non-indexable
- **Performance:** automated representative performance-budget checks for the major page types.
- **Forms:**
  - successful persistence
  - duplicate/idempotent submission
  - validation failure
  - Turnstile failure
  - queue failure after successful persistence
  - notification-provider failure
  - partner-switch routing
  - absence of an active partner
- **Security:** no committed secrets; restricted admin paths; private-upload behavior; input-validation behavior.

## Launch Checklist — LOCKED minimum (IMPLEMENTATION PENDING)

Before production publishing / live lead collection:

1. Domain registered by the operator; Cloudflare DNS configured.
2. Branch / Index Governance configured (protected `main` or ruleset, required checks, CODEOWNERS over the index-approval registry).
3. All Testing Requirements passing in CI.
4. Privacy policy, lead-sharing consent, disclosure wording, and data retention legally reviewed (OPEN items resolved).
5. Partner disclosure present; routing verified, including the no-active-partner case.
6. Lead persistence → queue → notification path verified, including provider-failure behavior.
7. Robots/`noindex`, sitemap, and canonicals verified; preview environments non-indexable.
8. Cloudflare Web Analytics and first-party events verified; Search Console Domain property set up for the production domain.
9. Every indexable page passes the Indexing Gate (`03`), has a complete publication record, and has operator index approval.
10. Backups (PITR plus scheduled R2 export) verified.
11. Call recording confirmed OFF (unless legal review has since resolved it).

## Definition of Done

A piece of work is done only when:

1. Relevant tests/checks pass (including the CI checks above once they exist) and the agent has inspected its own output.
2. No non-negotiable in `/AGENTS.md` §4 is violated.
3. Any indexable page has passed the Indexing Gate in `03-GOOGLE-RESILIENCE.md`, with its publication record stored and operator index approval present.
4. Technical SEO, internal-linking, conversion, performance, and accessibility requirements in this document are met for affected pages.
5. No `OPEN` question was decided silently, and no LOCKED decision was changed without operator approval.
6. `01-CURRENT-STATE.md` is updated.
7. A run receipt and a `logs/RUN-LOG.md` entry exist (`/AGENTS.md` §3).
8. Changes, unresolved risks, and the commit SHA are reported.
