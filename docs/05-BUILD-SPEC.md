# BUILD SPECIFICATION

Owner of: the technical implementation specification and the Definition of Done.

Strategic constraints come from higher-precedence documents (`/AGENTS.md`, `00`, `03`, `04`, `02`). This document implements them; it never weakens them. Where this spec and a higher document appear to conflict, the higher document wins (`/AGENTS.md` §1). Report the conflict; do not resolve it silently.

## Status

**PHASE 1 ARCHITECTURE LOCKED — approved by the human operator on 2026-09-19.**

This document distinguishes three kinds of items:

| Label | Meaning |
|---|---|
| **LOCKED** | Operator-approved architectural decision. Change only with explicit operator approval, logged in `01-CURRENT-STATE.md` → Last Major Decisions. |
| **IMPLEMENTATION PENDING** | Locked architecture that has not been built yet. |
| **IMPLEMENTED (Phase 2A/2B/2C/2D/2E/2F)** / **PARTIALLY IMPLEMENTED** | Built and tested in the repository (see the Implementation Records below). Not deployed; no cloud or vendor resources exist. |
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

## Approved Stack — LOCKED (PARTIALLY IMPLEMENTED — Phase 2A: Astro, TypeScript, Cloudflare adapter/config, Zod records)

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

## Repository Structure — LOCKED at responsibility level (PARTIALLY IMPLEMENTED — Phase 2A)

Current contents: `AGENTS.md`, `CLAUDE.md`, `docs/`, `research/` (JSON evidence), `logs/` (run audit trail), and the Phase 2A application foundation. Paths chosen in Phase 2A are listed in Implementation Record: Phase 2A.

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

## Deployment — LOCKED (CONFIGURED — Phase 2F; not yet deployed)

- Production deploys only from the protected `main` branch after required CI checks pass.
- Pull requests / non-production branches should get preview deployments once implementation begins.
- **Preview environments are globally non-indexable** (`noindex` on every response, plus no production sitemap).
- **The production deployment is also globally non-indexable while no page is indexable.** See Implementation Record: Phase 2F.

**Deployment procedure (Cloudflare Workers + Static Assets):**

```text
npm run build:production     # SITE_ENV=production build + production-mode checks
npm run deploy               # wrangler deploy -c dist/server/wrangler.json
npm run verify:production    # live smoke test of the deployed site
```

`astro build` writes the deployable Worker config to `dist/server/wrangler.json`, inheriting the Worker name, compatibility date, and observability setting from `wrangler.jsonc` and adding the static-assets binding for `dist/client`. No D1, R2, Queue, Turnstile, or Access binding exists in either file.

**Not yet done (operator actions):** Cloudflare authentication, moving the domain's DNS to Cloudflare, creating the Worker, and attaching the custom domain. See `01-CURRENT-STATE.md` for the current state.

## Branch / Index Governance — LOCKED (CONFIGURED — Phase 2A, 2026-09-19)

Before production publishing begins, configure a protected `main` branch or GitHub ruleset with:

- required CI checks
- no unreviewed direct production changes
- an operator-controlled approval boundary for page-indexing decisions
- CODEOWNERS (or equivalent) protection over the index-approval registry and indexing configuration

AI coding agents normally work by branch / pull request, not by unrestricted direct production publishing. **A coding agent's or developer's deploy alone must never make a page indexable.**

Configured 2026-09-19 and read back through the GitHub API:

- **Ruleset `main-protection`** (id 23705333; active; default branch; **no bypass actors**):
  - block deletion
  - block non-fast-forward (force) pushes
  - require a pull request
  - require the status checks `build-and-test`, `accessibility-and-lab-performance`, and `secret-scan` from GitHub Actions (integration 15368), with the branch up to date
- **Ruleset `index-governance-code-owner-review`** (id 23705344; active; default branch):
  - requires code-owner review for changes to CODEOWNERS paths (`.github/CODEOWNERS`: approval registry, evaluator, firewall, config, CI, docs)
  - bypass: the repository **admin role, pull-request-only** (`bypass_mode: pull_request`). A sole owner cannot approve their own PR, so without this bypass the owner could never merge governance changes. Bypass is only possible through a PR that has passed `main-protection`'s required checks.
- **Known limitation (observed on PR #2):** a PR authored by the sole code owner was mergeable without any code-owner review (`reviewDecision: null`; no bypass needed). GitHub cannot distinguish an AI agent from the operator while the agent uses the operator's own credentials, so the code-owner rule does not currently constrain agents. `main-protection` (PR + required CI, no bypass) is the effective control. Making the index-approval boundary binding on agents requires a separate non-admin GitHub identity for agents (OPEN; operator decision).

## Environment Variables / Secrets — LOCKED principles (PARTIALLY IMPLEMENTED — Phase 2A)

- Secrets are never committed.
- Use Cloudflare/Wrangler secret management for Worker secrets (e.g., Resend, Twilio, OpenAI, Turnstile secret keys).
- Browser bundles receive only public, non-secret configuration (e.g., the Turnstile site key).
- The exact variable inventory is decided at build time and documented then.

## Domain / Brand — LOCKED

- **Brand:** **Indy Sewer Resource**.
- **Positioning:** an independent Indianapolis-area sewer intelligence and homeowner decision-support resource focused on residential sewer laterals, diagnosis, repair-method decisions, and legitimate CIPP/trenchless opportunities.
- The site is **not** a plumbing company and must never imply it performs plumbing work (`04-CONTENT-EDITORIAL-SYSTEM.md` → Disclosure). It stays independently owned and editorially controlled, and must remain valuable if the renter changes.
- Lawrence is the SEO beachhead, not the master brand. Brand geography is the Indianapolis metro.
- **Domain:** `indysewerresource.com` — **registered and owned by the operator** (reported 2026-09-19). It is the canonical production origin used by the build (`src/config/brand.ts` → `PRODUCTION_ORIGIN`). No DNS change, hosting, Cloudflare configuration, or deployment has been made, and owning the domain does not make any page indexable: the evaluator still decides that.
- Domain strategy:
  - `.com` is the preferred primary TLD.
  - Use a descriptive brand domain, not a keyword-stuffed exact-match domain.
  - No `lawrence`, `cipp`, `trenchless`, `lateral`, `pipe`, or `renewal` in the primary brand domain.
  - If the approved `.com` becomes unavailable, do not silently settle for another TLD or name. Return to the operator.
  - No defensive domain purchases without explicit operator approval.
- The domain is project-owned and never transferred to the renter (`00-PROJECT-CHARTER.md`).

## Design System — (IMPLEMENTED — Phase 2D)

- **LOCKED constraints:** a system font stack at launch (0 custom-font bytes); performance and accessibility budgets below.
- Implemented in `src/styles/global.css`: one token set with a light and a dark theme, a reading measure for prose, and the shared components (evidence notes, cards, numbered steps, scrollable tables, figures). No CSS framework, no client JavaScript, no custom fonts, no icon set.

## Routes

- **LOCKED constraints:**
  - No route per keyword variant or per municipality unless it passes the gates in `03-GOOGLE-RESILIENCE.md` and the split test in `02-SEO-SERP-BLUEPRINT.md` → Page Strategy.
  - No placeholder municipality routes.
  - Route, page type, and canonical are defined centrally in page configuration/records, not ad hoc.
- **Decided in Phase 2D** (each through the workflow in `04-CONTENT-EDITORIAL-SYSTEM.md`):
  - `/` — homepage (general)
  - `/lawrence-sewer-lateral-repair/` — flagship Lawrence resource (location)
  - `/about/` — methodology / trust page (general)
- **OPEN:** every later URL. Routes are added page by page, never generated per keyword or per municipality.

## Page Specifications

Every page has a publication record (see Publication / Indexing Architecture) that references its completed workflow outputs from `04-CONTENT-EDITORIAL-SYSTEM.md`. No page specification may skip or redefine that workflow.

## Shared Components — principles LOCKED

- Components render server-side/static by default and ship zero client JS unless interactive.
- Page configuration drives the SEO head (title, meta description, canonical, robots directive, structured data). Individual pages do not hand-write these.
- Partner attribution and disclosure blocks are data-driven components, fed by partner/routing data, so the renter can change without content edits.
- Lead forms are shared components that meet the Lead Funnel, Security, and Performance requirements.

---

## Content / Editorial Storage — LOCKED (PARTIALLY IMPLEMENTED — Phase 2A: structured records; no page bodies yet)

- **Git is the initial CMS.**
- Public page bodies: Markdown / MDX.
- Structured editorial, QA, and evidence records: deterministic JSON (or similar), validated with TypeScript/Zod schemas once implementation begins.
- Git must preserve changes, attribution, review history, diffability, AI-agent handoff, evidence records, and publication-gate state.
- A CMS may be reconsidered only if human editorial throughput actually becomes a bottleneck, and only with operator approval.

## Publication / Indexing Architecture — LOCKED (IMPLEMENTED — Phase 2A)

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

## Sitemap — LOCKED (IMPLEMENTED — Phase 2A)

Include only effectively `indexable` canonical URLs. `draft`, `review`, `published_noindex`, and `index_candidate` URLs never appear in the production XML sitemap. Only the production canonical site is submitted to Search Console.

## Robots — LOCKED (IMPLEMENTED — Phase 2A)

- Draft pages are not shipped publicly by default.
- Public pages that have not passed the indexing gates emit `noindex`.
- `robots.txt` blocking is not a substitute for `noindex`.
- Preview environments are globally non-indexable.

## Canonicals — LOCKED (IMPLEMENTED — Phase 2A; no production origin configured)

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

## Lead Funnel — LOCKED (PARTIALLY IMPLEMENTED — Phase 2B: intake contract + service; live collection DISABLED, no public form)

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

## Queue / Notification Reliability — LOCKED (IMPLEMENTED — Phase 2B: persist-first + typed message contract; Phase 2C: idempotent queue consumer + provider adapters. No queue resource, no provider account, nothing sent.)

```text
persist lead first -> enqueue delivery -> notify partner/operator
```

- The D1 lead record is the source of truth.
- A notification-provider or queue outage must never cause loss of the lead record.
- Failed deliveries are retryable and visible to the operator.
- If no partner is active, leads are still persisted and the operator is notified.
- Notifications (email/SMS) carry no unnecessary homeowner PII.

## Lead Database Schema — logical model LOCKED (IMPLEMENTED — Phase 2B: migration 0001)

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

Phase 2B implements all ten domains as physical tables in `migrations/0001_lead_data_foundation.sql`. No remote D1 database exists; the migration is exercised against a local database in tests and CI.

## Partner / Renter Switching — LOCKED (IMPLEMENTED — Phase 2B; Phase 2C adds notification destinations and delivery against the historical route; no real partner configured)

- Partner identity and lead routing are driven by configuration and data (`partners`, `routing_rules`, `lead_routes`).
- A contractor's identity is never hard-coded into editorial content architecture.
- Each lead's historical routing decision stays immutable and auditable.
- Changing the active renter affects only future routing. It requires no content rewrite and transfers no ownership or editorial control. The domain remains project-owned.

## Call Tracking — LOCKED (PARTIALLY IMPLEMENTED — Phase 2B: metadata schema only; Phase 2C: Twilio messaging adapter for SMS notifications only. No Twilio account or number; recording structurally disabled.)

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

## Performance Budget — LOCKED (build-time checks IMPLEMENTED — Phase 2A; field CWV after launch)

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

## Accessibility — LOCKED (PARTIALLY IMPLEMENTED — Phase 2A: baseline shell + automated CI checks)

**Target conformance: WCAG 2.2 Level AA** (operator-approved 2026-09-19). AA is the formal target. AAA improvements may be made opportunistically where low-cost, but AAA is not a requirement.

Accessibility is a release and quality requirement, not optional polish. It is part of Technical SEO QA (`04-CONTENT-EDITORIAL-SYSTEM.md` step 17) and the Definition of Done.

- Prefer native semantic HTML before ARIA.
- All meaningful functionality is keyboard operable.
- Visible keyboard focus is preserved.
- Form labels, errors, instructions, and validation feedback are programmatically associated and understandable.
- Images have appropriate alternative-text handling (meaningful alt text; decorative images marked as such).
- Color is never the sole means of conveying information.
- Contrast meets the applicable WCAG 2.2 AA criteria.
- Interactive targets and controls meet the applicable WCAG 2.2 requirements.
- Motion and animation must not create avoidable accessibility problems.
- Automated accessibility checks are useful but do not replace manual keyboard- and screen-reader-oriented review of important workflows (especially lead forms).
- Accessibility work must preserve the locked Performance Budget. Do not introduce a heavy accessibility framework or overlay merely to satisfy the requirement.

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

## Security — LOCKED (PARTIALLY IMPLEMENTED — Phase 2A: headers, secret scanning; Phase 2B: input validation, prepared statements, idempotency, fail-closed intake; Phase 2C: fail-closed provider activation, server-only provider modules, no PII in provider payloads)

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

## First-Party Data Collection — LOCKED separation (IMPLEMENTED — Phase 2B: three-way separation in the physical schema; no data collected)

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

## Publication-Quality Enforcement — LOCKED (PARTIALLY IMPLEMENTED — Phase 2A: records + evaluator; Phase 2E: similarity runner, deterministic checks in CI; embedding runs require an API key that does not exist)

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

## Testing Requirements — LOCKED (PARTIALLY IMPLEMENTED — Phase 2A)

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
- **Accessibility:** automated WCAG 2.2 AA checks for the major page types, plus documented manual keyboard/screen-reader review of important workflows (automated checks alone are insufficient).

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
12. WCAG 2.2 AA verified for the major page types and lead workflows (automated checks plus manual keyboard/screen-reader review).

## Implementation Record: Phase 2A (build foundation + indexing firewall)

Implemented 2026-09-19 on branch `phase-2a-build-foundation` (see `logs/runs/` for the receipt, PR, and CI results). Implementation-level choices below were permitted by the Status section; none changes a LOCKED decision.

**Versions (exact, from `package-lock.json`):** Node ≥ 22.12 (CI uses Node 24); `astro` 7.3.3; `@astrojs/cloudflare` 14.3.2; `wrangler` 4.135.0; `zod` 4.6.5; `typescript` 6.0.3 (TypeScript 7 is not yet supported by `@astrojs/check` 0.9.10); `vitest` 5.0.1; `@playwright/test` 1.63.0; `@axe-core/playwright` 4.13.0; `@types/node` 24.13.6. No UI framework, CMS, ORM, analytics, or tag manager.

**Paths chosen:**

| Responsibility | Path |
|---|---|
| Publication records (one JSON file per page) | `content/publication-records/*.json` |
| Operator index-approval registry | `governance/index-approvals.json` (CODEOWNERS: `@tomytomz1`) |
| Locked constants, schema, evaluator, registry | `src/lib/publication/` |
| Robots / canonical / sitemap / robots.txt firewall | `src/lib/seo/firewall.ts` |
| Structured-data guardrails | `src/lib/seo/structured-data.ts` |
| Site environment config | `src/config/site.ts` |
| Only permitted page layout (central SEO head) | `src/layouts/BaseLayout.astro` |
| Build/QA scripts | `scripts/` |
| Unit tests (fixtures clearly marked artificial) | `tests/unit/`, `tests/fixtures/` |
| Accessibility + lab performance tests | `tests/a11y/` |
| CI | `.github/workflows/ci.yml`; ownership in `.github/CODEOWNERS` |
| Cloudflare Worker config (no bindings) | `wrangler.jsonc` |

**Firewall behavior:**

- **Environment:** `SITE_ENV` is `development`, `preview`, or `production`, and anything missing or unknown means `development`. Only `production` can index.
- **Production origin:** production requires `PUBLIC_SITE_ORIGIN`: https, a bare origin, and not a test host. There is no default, because the domain is unregistered.
- **Draft pages:** a production build fails if any page in lifecycle `draft` is built. This means the Phase 2A development shell blocks production builds until it is replaced.
- **Robots meta:** always derived from the evaluator plus the environment. Non-production is `noindex, nofollow`. Production pages that are not effectively indexable get `noindex, follow`.
- **Non-production headers:** every non-production build also writes `X-Robots-Tag: noindex, nofollow` for all responses (`_headers`).
- **robots.txt:** never `Disallow`s as a substitute for `noindex`. A sitemap is advertised only in production with an origin.
- **Sitemap:** exactly the evaluator's effectively indexable canonical URLs. At Phase 2A that is zero.
- **Indexing requests:** a record that requests lifecycle `indexable` but fails the gate fails CI; it is never silently downgraded.
- **Approvals:** the approval registry accepts only `approved: true` by `tomytomz1`. Anything else fails validation. A missing approval means not indexable.

**Implementation-level decisions:**

- **Page type `utility`:** added for support/legal/development pages. It is never indexable, matching the Site Quality Firewall `NOINDEX` class. The five-state lifecycle is unchanged.
- **Workflow step 13:** may be `not_applicable` only when expert review is not required. No other step may be.
- **Similarity records:** a record must use the locked model `text-embedding-3-small`. No embedding API calls exist yet; similarity results are recorded data.
- **Adapter:** Astro `output` stays static (all current routes prerendered). `session: false` disables the adapter's default KV session binding (no KV exists). `imageService: 'passthrough'` is used until images exist.
- **Headers:** CSP is `default-src 'self'` with `style-src`/`script-src 'self'`, and `build.inlineStylesheets: 'never'` keeps it satisfiable. HSTS is deferred until the production domain exists.
- **npm install scripts:** allowed only for `esbuild` and `workerd` (`allowScripts` in `package.json`).

**CI checks (stable names; required on `main`):**

- `build-and-test`: `npm ci`, typecheck (`astro check` + `tsc`), unit tests, record validation, build, post-build SEO/firewall/link/structured-data checks, and build-time budgets.
- `accessibility-and-lab-performance`: axe WCAG 2.0/2.1/2.2 A+AA, landmarks and skip-link keyboard check, and lab LCP ≤ 2.0 s / CLS ≤ 0.05 under 4× CPU throttling (desktop and Pixel 7 profiles).
- `secret-scan`: Gitleaks.

**Performance measurement boundary:**

- Enforced now at build time: first-party JS (editorial target 0 B, hard 35 KB gzip), CSS ≤ 40 KB gzip, no custom fonts, and third-party requests limited to Cloudflare Web Analytics and Turnstile.
- Lab LCP/CLS are synthetic. They are not Core Web Vitals.
- Field p75 LCP/CLS/INP can only be measured from real users after launch. INP has no lab substitute here. No RUM data exists or is simulated.

**Manual accessibility review (required; automated checks are not sufficient):** before any page is `index_candidate`, and for every lead workflow:

1. Complete the page's main tasks using only the keyboard; focus order is logical and focus is always visible.
2. Check with a screen reader (NVDA or VoiceOver): headings, landmarks, link text, form labels, errors, and instructions are announced correctly.
3. Zoom to 200% and view at 320 CSS px width with no loss of content or function.
4. Check that color is never the only signal, and that text and non-text contrast meet AA.
5. Check that targets meet the WCAG 2.2 target-size minimum.
6. Check that reduced motion is respected.

Record the result in the page's Technical SEO QA gate note.

**Not implemented in Phase 2A (still IMPLEMENTATION PENDING):**

- the lead backend: D1 tables, intake endpoint, queues, Resend, Twilio, uploads, admin UI
- partner routing
- the embedding/similarity runner
- analytics and Search Console
- any deployment or Cloudflare resource

## Implementation Record: Phase 2B (lead-data / backend foundation)

Implemented 2026-09-19 on branch `phase-2b-lead-backend`. Live homeowner lead collection remains **disabled**; nothing is deployed and no Cloudflare, Resend, Twilio, or OpenAI resource exists.

**Added dependency:** `miniflare` 4.20260730.0 (dev only), to run the real SQL against a local D1 database in tests. No runtime dependency was added.

**Physical schema** (`migrations/0001_lead_data_foundation.sql`, 28 statements, 10 tables, 14 indexes, 4 triggers, zero seed rows):

| Table | Holds | Notes |
|---|---|---|
| `leads` | non-contact intake fields | `submission_key` is UNIQUE (idempotency) |
| `lead_contacts` | first name, phone, email, preferred channel | the only table with contact PII; one row per lead; at least one channel required |
| `consents` | consent artifact id/version, accepted flag, timestamp, capture channel | no legal text is stored (wording is OPEN) |
| `lead_events` | append-only lifecycle history | JSON payloads, validated, no contact PII |
| `lead_routes` | immutable routing decisions with a rule/partner snapshot | |
| `lead_outcomes` | append-only outcome entries | a final value requires `value_voluntarily_provided = 1` |
| `partners`, `routing_rules` | partner configuration | active/inactive, priority, optional municipality, effective dates |
| `calls` | future call metadata | `CHECK (recording_enabled = 0)`: recording is structurally impossible |
| `uploads` | future media metadata | storage key only; there is no column for file content |

Triggers reject `UPDATE` on `consents`, `lead_events`, `lead_routes`, and `lead_outcomes`. `DELETE` is deliberately **not** blocked, because retention/deletion policy is OPEN and lawful deletion must stay possible.

**Server modules** (`src/lib/leads/`, server-only; a build check fails if any marker reaches the client bundle):

- `contract.ts`: strict Zod contracts. Intake contains only the approved minimum fields and rejects unknown fields, so address, income, insurance, pipe depth, project value, existing contractor, and media can never enter through intake. Also holds the queue message, outcome, call, and upload contracts.
- `db.ts`: the narrow D1 interface used here (prepare/bind/first/all/run/batch) plus an injectable clock and id generator.
- `repository.ts`: prepared statements only; every value is bound, so homeowner input is always data.
- `routing.ts`: deterministic selection (municipality-specific rule first, then priority, then oldest), reading only current configuration.
- `intake.ts`: the core service. Persist-first, then enqueue.
- `enrichment.ts`: outcome/call/upload recording and a derived outcome snapshot (response time is derived, never stored twice).
- `activation.ts`, `turnstile.ts`, `http.ts`: the activation boundary, fail-closed Turnstile verification, and the thin HTTP adapter.
- `log.ts`: allow-list logging; only ids and reason codes are ever logged.

**Persistence and delivery order:** one D1 `batch()` (a single transaction) writes the lead, contact, consent, routing decision, and events. Only after it succeeds is a queue message attempted. A queue failure records `delivery_enqueue_failed` and leaves the lead intact; the lead then appears in the operator follow-up query. The queue message carries only `leadId`, `routeId`, and `deliveryId`: the contract rejects any contact field.

**Idempotency:** the client supplies a UUID `submissionKey`. A retry returns the original lead, and a concurrent duplicate loses the UNIQUE race and is resolved by re-reading. Contact details alone are never used as an idempotency key, so a genuinely new submission from the same household still creates a new lead.

**Live-intake activation boundary (`src/lib/leads/activation.ts`):** intake is enabled only when ALL of these exist, and none does today:

1. `LEAD_INTAKE_ENABLED` exactly `"true"`
2. `LEAD_LEGAL_REVIEW_REF` (reference to the completed legal review)
3. `LEAD_CONSENT_ARTIFACT_ID` and `LEAD_CONSENT_ARTIFACT_VERSION`
4. `TURNSTILE_SECRET_KEY`
5. the `DB` (D1) and `LEAD_QUEUE` bindings

A `TEST-ONLY-` consent artifact is rejected when `SITE_ENV=production`. The endpoint `POST /api/lead-intake` returns 503 before reading the request body, so deploying the repository does not start collecting leads. There is no public lead form.

**Testing:** 58 Phase 2B tests run real SQL against a local D1 (Miniflare) database: no mock database, no remote resource, no network. They cover the required scenarios, including validation, idempotency (incl. concurrent), PII separation, consent audit, event history, routing (active/inactive/switch/history immutability), no-active-partner, persistence-before-queue, queue failure, queue-payload PII rejection, SQL-injection-like input, outcomes, calls, uploads, and the disabled-by-default activation boundary.

**Known limitation:** `wrangler d1 migrations apply` is the production path for migrations, but it requires a configured binding with a real `database_id`, which does not exist and was not invented. Until D1 is provisioned, CI applies the same `.sql` files statement-by-statement to a local database (`npm run validate:migrations`). The local test runtime pins compatibility date `2026-07-30` (the newest its `workerd` supports); `wrangler.jsonc` keeps `2026-09-01`.

**Not implemented in Phase 2B:** any Cloudflare/Resend/Twilio/OpenAI resource or secret; the queue consumer worker; notification sending; R2 uploads; the admin UI; a public lead form; deployment.

## Implementation Record: Phase 2C (queue consumer + notification delivery)

Implemented 2026-09-19 on branch `phase-2c-delivery-foundation`. The path `persist lead -> route -> enqueue identifier-only message -> queue consumer -> delivery provider` is now complete and tested end to end against a local database with injected providers. Nothing is activated: no Cloudflare Queue, D1 database, Resend account or key, Twilio account or number exists, no message was sent, and nothing is deployed. No dependency was added.

**Migration `0002_delivery_foundation.sql`** (smallest change inside the already-approved logical domains; no new domain):

| Change | Why |
|---|---|
| `lead_events` rebuilt with an `idempotency_key TEXT` column and `idx_lead_events_idempotency` (UNIQUE) | durable, database-enforced delivery idempotency. SQLite cannot alter a CHECK constraint, so the table is recreated, its rows copied, and its indexes plus the no-UPDATE trigger restored. History stays append-only. |
| `lead_events.event_type` CHECK extended | `delivery_attempt_started`, `delivery_succeeded`, `delivery_failed_retryable`, `delivery_failed_permanent`, `delivery_duplicate_suppressed` |
| `partners` gains `notification_email`, `notification_phone_e164`, `notify_email_enabled`, `notify_sms_enabled` (both flags default `0`) | notification destinations. Two triggers reject a channel that is enabled without a usable destination. |

Still zero seed rows: the migration cannot enable delivery for anyone, and no contractor appears in the schema or in source code.

**Delivery idempotency (the exact decision).** Cloudflare Queues deliver at least once, so exactly-once is enforced in the database, never in memory:

- A **claim** row (`delivery_attempt_started`, key `claim:<deliveryId>:<channel>:<lease>`) is inserted *before* the provider is called. A concurrent duplicate loses the UNIQUE race and does not send.
- **Success** (`delivery_succeeded`, key `success:<deliveryId>:<channel>`) and **terminal failure** (`delivery_failed_permanent`, key `terminal:<deliveryId>:<channel>`) can each exist only once; a later redelivery short-circuits before any provider call, including after a Worker restart or a fresh service instance.
- An unfinished claim is treated as in flight for `ATTEMPT_LEASE_SECONDS` (120); after that another consumer may take over, so a crashed attempt cannot wedge a lead forever.
- Every provider call carries a **stable provider-side idempotency key** (`isr-delivery-<deliveryId>-<channel>`; Resend `Idempotency-Key`, Twilio `I-Twilio-Idempotency-Token`), so a retry after an uncertain timeout is deduplicated by the provider rather than becoming a second notification.

**Routing integrity.** The consumer resolves the partner from the immutable `lead_routes` row selected at intake and never re-runs `decideRoute`. If that partner is now inactive, missing, or has no usable destination, the delivery fails to durable operator-follow-up state. A lead is never handed to a different contractor.

**Retry / failure model.** `processDeliveryMessage` returns `delivered | duplicate | retry | terminal`; `handleDeliveryBatch` acks the first two and the last, and calls `message.retry({ delaySeconds })` with a 30s→30m backoff otherwise. Retrying stops at `MAX_DELIVERY_ATTEMPTS` (5), which records a permanent failure instead of looping. Malformed messages are terminal and never touch lead data. An unexpected exception retries rather than dropping a lead.

**Future queue infrastructure (not created).** Wiring requires a real queue plus a Worker entrypoint: `wrangler.jsonc` would set `main` to a worker module exporting `queue()` alongside the Astro `fetch` handler (the adapter's documented custom-entrypoint path), with `queues.producers` (`LEAD_QUEUE`) and a consumer entry (`max_retries`, and a `dead_letter_queue` — without one, messages that exhaust retries are deleted permanently). None of this is configured, and no binding or id was invented.

**Provider adapters (no network call in this repository):**

- `src/lib/leads/providers/resend.ts` — documented API (`POST https://api.resend.com/emails`, bearer key, JSON body, `Idempotency-Key`). Injected `fetch`, abort-based timeout, strict response parsing, documented error codes mapped to retryable vs terminal. A 2xx that cannot be parsed is terminal, because retrying might duplicate an accepted message.
- `src/lib/leads/providers/twilio.ts` — documented Messaging API (`POST .../Accounts/{AccountSid}/Messages.json`, basic auth, form-encoded `To`/`From`/`Body`). SMS content is minimal by contract: identifiers plus an operator prompt.
- `src/lib/leads/notifications.ts` — templates marked `[NON-PRODUCTION TEST TEMPLATE]`. They carry identifiers and an action prompt only; homeowner details are retrieved through the protected operational layer, so no contact PII reaches a provider. Final partner-disclosure and consent wording remains OPEN.

**Provider activation boundary (fails closed, separate from intake).** `resolveNotificationActivation` requires `NOTIFICATIONS_ENABLED="true"`, `RESEND_API_KEY`, a valid `NOTIFICATION_FROM_EMAIL` and `OPERATOR_NOTIFICATION_EMAIL`, and the `DB` binding; SMS requires all three Twilio values together or none. In production it rejects test-only keys and reserved test domains. Notification sending is deliberately NOT governed by the homeowner intake flag: enabling one must never implicitly enable the other.

**Operator follow-up.** `listLeadsNeedingAttention` returns safe structured records (lead id, reason, timestamp, reason code) for `no_active_partner`, `delivery_not_enqueued`, `delivery_failed_permanently`, and `delivery_retry_pending`. Contact PII is reachable only through the explicit, separate `getLeadContactForOperator` call. There is still no admin UI.

## Implementation Record: Phase 2D (Lawrence MVP asset)

Implemented 2026-09-19 on branch `phase-2d-lawrence-mvp`. This is the first homeowner-facing content, and all of it is `published_noindex`. Nothing is deployed, no lead path exists, and the operator index-approval registry is still empty. No dependency was added; the site still ships **0 bytes of client JavaScript**.

**Operator decisions reconciled in this phase:** the operator registered `indysewerresource.com`, and decided the GitHub repository stays public. Neither changes any gate.

**Pages** (the Phase 2A development shell and its record were removed):

| Route | Record | Type / lifecycle | Purpose |
|---|---|---|---|
| `/` | `home` | general / `published_noindex` | What the resource is, the decisions it covers, and an honest statement of project status |
| `/lawrence-sewer-lateral-repair/` | `lawrence-sewer-lateral-repair` | location / `published_noindex` | The flagship resource: responsibility, permit, diagnosis, repair methods, post-repair video, replacement standards, and what is not established |
| `/about/` | `about` | general / `published_noindex` | Independence, source hierarchy, claim classification, expert-review policy, corrections, future contractor disclosure |

**Paths added:** `src/config/brand.ts` (brand strings, production origin, navigation), `src/components/` (`EvidenceNote.astro`, `SourceList.astro`, `DecisionFlow.astro`), `src/lib/content/sources.ts`, and the three page files. `src/layouts/BaseLayout.astro` gained navigation, the site-wide disclosure footer, a pre-publication status line, and minimal truthful JSON-LD (`WebSite` on the homepage, `WebPage` elsewhere; the prohibited business/review types remain impossible).

**Evidence discipline.** Every Lawrence statement traces to `research/sources/lawrence-primary-sources.json` (ordinance Title 5 Article 1, the 2019 Utility policy manual, and the August 2023 Lawrence Lift). The page states plainly what this project has **not** established — current permit fee, forms, and issuing office; the currently accepted video format; responsibility for the tap/wye at the main; the utility service boundary; waiver practice; assistance programs; local pipe prevalence; local prices — and prints no phone number, because the 2023 number was never re-verified. General repair-method mechanics are recorded as an INFERENCE with no engineering-standard citation yet, and the page says so.

**Original assets.** One original diagram (the homeowner decision flow) that is deliberately municipality-neutral. A Lawrence-specific responsibility diagram was **not** created: research record `law-009` leaves the tap/wye question open, and a diagram would imply an answer the evidence does not support.

**Publication state (honest, not engineered):**

- Lawrence publication score **55/100** against the 85 money/location threshold, with 0 for expert verification and 0 for first-party data.
- Location Page Quality Gate: **3 of 8** categories qualify (lateral responsibility, permit/repair requirement, lining/bursting rule), all three authoritative local primary-source. Five are required. The gate FAILS, as it should.
- Expert review is **required and absent**. No reviewer, credential, scope, or date was invented.
- Workflow steps 1–19: complete where they genuinely are, `in_progress` for the human editorial pass and technical SEO QA (manual accessibility review outstanding), `not_started` for expert review, similarity QA (no embedding runner), and conversion QA (no lead path by design).
- Effectively indexable pages: **0**. Operator approvals: **0**. Sitemap URLs: **0**.

**Production origin.** `resolveSiteConfig` now falls back to `https://indysewerresource.com` when `PUBLIC_SITE_ORIGIN` is unset in a production build, instead of throwing. Indexability is unaffected: `robotsDirective` returns `noindex, follow` for every current page even in a production build on the real domain, and a unit test asserts exactly that.

**Tests.** `tests/unit/site-pages.test.ts` guards the real records: three pages, none a fixture, none indexable in a production build, the Lawrence gaps recorded as described above, FACT claims all cited, and navigation that cannot point at a non-existent page. The accessibility and lab-performance suite covers every built page automatically (18 checks across desktop and Pixel 7 profiles).

## Implementation Record: Phase 2E (Lawrence evidence enrichment, editorial QA, similarity runner)

Implemented 2026-09-20 on branch `phase-2e-lawrence-evidence-editorial`. No page became indexable, nothing was deployed, and no dependency was added.

**Similarity QA runner** (the piece of the locked workflow that was missing):

| Part | Where | Behavior |
|---|---|---|
| Primitives | `scripts/lib/similarity.ts` | content hashing (SHA-256), main-content extraction, sentence segmentation and normalization, sentence near-duplication (token Jaccard at or above 0.8), heading-architecture comparison by level and wording, cosine similarity, and the embedding transport |
| Runner | `scripts/similarity-qa.ts` (`npm run similarity:qa`) | compares every built page against every other built page, and optionally against competitor URLs listed in an uncommitted local file |
| CI | inside `build-and-test` | deterministic checks run on every push; a flagged comparison fails the job |

- The locked model `text-embedding-3-small` is the only model accepted; any other model is refused rather than substituted.
- The embedding check **fails closed**: with no `OPENAI_API_KEY` it reports `not_run`, so workflow step 14 stays unsatisfied and no page can pass the Indexing Gate on the deterministic checks alone. No OpenAI account or key exists.
- Site chrome is excluded by comparing the `<main>` element, because navigation and the site-wide disclosure are identical on every page by design.
- Competitor handling stores only a reference, a content hash, and scores. Page bodies are fetched into memory and never written to the repository, and a test asserts competitor text cannot appear in a report.
- Deterministic result on 2026-09-20: 0% sentence near-duplication and 0% heading-architecture overlap between all three pages.

**Evidence added** (`research/`): four City of Lawrence sources verified directly from the City's document library (current permit application form; Lawrence Lift August 2024 and July 2025; 2026 46th and Post I/I Removal pre-bid minutes) and ten new records, plus a new `research/sources/technical-standards.json` holding two government-issued engineering specifications that source the mechanics of CIPP lateral lining and pipe bursting. Those specifications are issued for another jurisdiction: they explain the methods and never count toward the Location Page Quality Gate, which requires municipality-specific evidence.

**Gate and score, reassessed rather than targeted:** the Location Page Quality Gate moved from 3 of 8 to **5 of 8** (lateral responsibility, permit/repair requirement, lining/bursting rule, municipal infrastructure information, and housing/pipe/failure evidence), all five supported by authoritative local primary sources, so the gate passes. Categories 6 (local cost/permit/project evidence), 7 (original municipal visual/data asset) and 8 (first-party data) remain **false**: the compiled table of the City's own rehabilitation projects restates City documents rather than producing new data, and claiming it as category 7 would be padding. The publication score moved from 55 to **63** against the 85 money/location threshold, with expert verification and first-party data still scored 0.

**Still blocking indexability:** expert review (absent), the human editorial pass (an AI revision does not satisfy it), the embedding half of similarity QA, manual accessibility review, conversion QA (no lead path exists by design), the score gap, and operator index approval.

## Implementation Record: Phase 2F (deployment configuration; deployment not completed)

Prepared 2026-09-20 on branch `phase-2f-safe-public-deployment`. **Nothing is deployed**: the environment has no Cloudflare credentials, and the domain's DNS is still at the registrar, so both remaining steps are operator actions.

**Indexing safety hardened for a public deployment.** `X-Robots-Tag: noindex, nofollow` is now written for every response whenever the build is non-production **or** no page is effectively indexable — so a real production hostname is still globally non-indexable at the header level, not only through each page's robots meta tag. The count comes from the evaluator at build time (`astro.config.mjs`), so the header lifts on its own if and when a page genuinely passes the Indexing Gate with operator approval. It is never toggled by hand.

**HSTS** (`Strict-Transport-Security: max-age=31536000`, no `includeSubDomains`, no `preload`) is now emitted in production builds, which docs/05 deferred until the production domain existed.

**Verified production build output** (`SITE_ENV=production`, origin `https://indysewerresource.com`):

| Output | Result |
|---|---|
| Pages built | 3, each `<meta name="robots" content="noindex, follow">` |
| Canonicals | apex host only (`https://indysewerresource.com/…`) |
| `_headers` | CSP, nosniff, referrer policy, permissions policy, `X-Frame-Options: DENY`, HSTS, and the global `X-Robots-Tag: noindex, nofollow` |
| `sitemap.xml` | 0 URLs |
| `robots.txt` | allows crawling (so the noindex directive is visible) and advertises the empty sitemap |

**Tooling added:** `scripts/build-production.ts` (production build plus production-mode `check-dist`, budgets, and similarity QA), `scripts/verify-production.ts` (live smoke test asserting HTTPS, 200s, robots meta **and** header, canonical host, 0 sitemap URLs, no form, no client JS, security headers, and `503` from `/api/lead-intake`), and the `build:production`, `deploy`, and `verify:production` scripts.

**Canonical host:** the apex is canonical. `www` must not become a second serving host; the recommended configuration is a zone-level Cloudflare Redirect Rule sending `www` to the apex with a 301.

**Not provisioned in Phase 2F:** D1, Queues, R2, Turnstile, Access, analytics, Search Console, any email/mailbox DNS, any lead path, and any index approval.

**Not implemented in Phase 2E:** any deployment, DNS, or hosting change; any Cloudflare, Resend, Twilio, or OpenAI resource, key, or account; a lead form or any data collection; additional municipality pages; a Lawrence responsibility diagram (`law-009` is unresolved); and any index approval.

**Not implemented in Phase 2D:** deployment, DNS, hosting, any Cloudflare/Resend/Twilio resource, a public lead form or any data collection, an admin console, additional municipality pages, calculators or tools, a privacy/legal page (no data is collected, and no legal copy may be invented), the embedding/similarity runner, and index approval.

**Not implemented in Phase 2C:** any Cloudflare, Resend, Twilio, or OpenAI resource, secret, or binding; a real queue or dead-letter queue; a Worker entrypoint wired to a deployment; R2 uploads; the admin UI; a public lead form; deployment. Live intake and live notifications both remain disabled.

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
