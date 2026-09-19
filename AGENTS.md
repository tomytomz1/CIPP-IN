# AGENTS.md

Master instructions for every AI/coding agent working in this repository. These are active production requirements, not background reading.

Project in one line: an independent Indianapolis-area sewer intelligence and homeowner decision-support resource (beachhead: Lawrence, Indiana) that generates qualified residential sewer/trenchless repair opportunities and is eventually rented exclusively to one legitimate CIPP/trenchless contractor. Full context: `docs/00-PROJECT-CHARTER.md`.

---

## 1. Document Authority / Precedence

If documents conflict, the higher item wins:

1. Explicit instructions from the current human operator
2. `AGENTS.md`
3. `docs/00-PROJECT-CHARTER.md`
4. `docs/03-GOOGLE-RESILIENCE.md`
5. `docs/04-CONTENT-EDITORIAL-SYSTEM.md`
6. `docs/02-SEO-SERP-BLUEPRINT.md`
7. `docs/05-BUILD-SPEC.md`
8. `docs/01-CURRENT-STATE.md`

Clarification: `docs/01-CURRENT-STATE.md` is authoritative for **what currently exists and what has been completed**. It must never silently override a strategic or non-negotiable rule in a higher-precedence document. If CURRENT-STATE records something that violates a higher rule, treat it as a defect to report, not as permission.

If you find a conflict, do not resolve it silently. Follow the higher document, then report the conflict to the operator and log it in `docs/01-CURRENT-STATE.md` → Open Questions.

### Document ownership (one owner per topic)

| Topic | Owner |
|---|---|
| Agent procedure, precedence, enforceable non-negotiables | `AGENTS.md` |
| Mission, business model, rental model, positioning, moats | `docs/00-PROJECT-CHARTER.md` |
| What exists now, progress, decisions log, priorities | `docs/01-CURRENT-STATE.md` |
| Organic strategy, competitors, queries, page strategy, links, SEO metrics | `docs/02-SEO-SERP-BLUEPRINT.md` |
| Publication/indexing gates, AI policy, quality thresholds, update protocol | `docs/03-GOOGLE-RESILIENCE.md` |
| Content workflow, writing rules, sourcing, claim classification, expert review, disclosure | `docs/04-CONTENT-EDITORIAL-SYSTEM.md` |
| Technical implementation specification and Definition of Done | `docs/05-BUILD-SPEC.md` |
| Research evidence (supporting only; does not outrank `/docs/`) | `research/` (JSON; index at `research/index.json`) |

Do not create additional strategy Markdown files unless the operator explicitly instructs it. Store evidence as structured JSON under `research/`, not as new strategy documents. Put new knowledge in the owning document above; cross-reference instead of copying.

---

## 2. Before Work

1. Read `AGENTS.md` completely.
2. Read `docs/00-PROJECT-CHARTER.md`.
3. Read `docs/01-CURRENT-STATE.md`.
4. Read every strategy document relevant to the task.
5. Read `docs/05-BUILD-SPEC.md` before any implementation work.
6. Inspect the current repository and code before changing anything.
7. Never rely on stale summaries (including CURRENT-STATE or your own memory) when the current code contradicts them. Report the discrepancy.

### Additional requirement for any indexable page work

Before creating or modifying any content that is, or could become, indexable, you MUST also read:

- `docs/02-SEO-SERP-BLUEPRINT.md`
- `docs/03-GOOGLE-RESILIENCE.md`
- `docs/04-CONTENT-EDITORIAL-SYSTEM.md`

No page may be indexed until it passes the Indexing Gate in `docs/03-GOOGLE-RESILIENCE.md`. Default state for any new page is **draft / `noindex`**.

### Decisions not yet locked

Anything marked `NOT YET LOCKED` (see `docs/05-BUILD-SPEC.md` and `docs/01-CURRENT-STATE.md`) must not be decided silently. Propose options to the operator; do not pick a stack, domain, brand, vendor, or schema on your own and present it as settled.

---

## 3. After Work

1. Run relevant tests/checks.
2. Inspect your own work (re-read diffs and outputs; do not assume success).
3. Update `docs/01-CURRENT-STATE.md` (status sections, Change Log, and anything now stale).
4. Document material decisions in `docs/01-CURRENT-STATE.md` → Last Major Decisions, and in the owning document if a rule or spec changed.
5. Report what changed.
6. Report unresolved risks.
7. Report the current commit SHA when Git exists.

---

## 4. Non-Negotiable Rules

These apply to code, content, schema, data, outreach, and documentation.

### 4.1 Never invent local facts

- If an authoritative source is unavailable, say the fact is **unverified**.
- Do not infer local plumbing infrastructure from generic regional patterns and present it as fact.
- Never invent:
  - municipal policies
  - permits
  - pricing
  - project values
  - CIPP eligibility
  - pipe materials
  - contractor credentials
  - licenses
  - addresses
  - reviews
  - customer testimonials
  - case studies
  - statistics
  - first-party data

Claim labeling (FACT / INFERENCE / ESTIMATE) and sourcing rules: `docs/04-CONTENT-EDITORIAL-SYSTEM.md`.

### 4.2 No fake local presence

Never create a fake office, fake address, fake Google Business Profile, fake technician, fake contractor identity, fake local photographs, or fake reviews.

### 4.3 No automatic city-page generation

An agent may NOT create a new municipality page solely because a keyword exists. It must first pass the Location Page Quality Gate in `docs/03-GOOGLE-RESILIENCE.md`. Never create placeholder city pages.

### 4.4 No keyword-variation pages by default

Do not create separate pages for, e.g., "CIPP Lawrence", "sewer lining Lawrence", "trenchless Lawrence", "sewer lateral repair Lawrence" merely because they are different keywords. Create a separate URL only when there is a materially different user intent **and** sufficient unique value (see `docs/02-SEO-SERP-BLUEPRINT.md` → Page Strategy).

### 4.5 No mass AI content

Never generate 20 / 50 / 100 SEO pages automatically, or any batch of pages from a template plus a keyword list. Every indexable page goes through the full workflow in `docs/04-CONTENT-EDITORIAL-SYSTEM.md`. AI policy: `docs/03-GOOGLE-RESILIENCE.md`. No AI-humanizer or detection-evasion workflows.

### 4.6 No black-hat SEO

No PBNs, Fiverr/bulk backlink blasts, hacked links, hidden text, keyword stuffing, fake or misleading schema, doorway pages, fake `LocalBusiness` markup, fake review schema, fake ratings, or scraped/repackaged articles.

### 4.7 Preserve independent editorial control

The eventual contractor renter receives leads and exposure. The website remains our owned editorial and technical asset. Never build features, copy, or permissions that transfer domain ownership, editorial control, technical SEO control, or unrestricted publishing rights to a renter. Details: `docs/00-PROJECT-CHARTER.md` → Future Rental Model.

### 4.8 No silent assumptions

If something is not documented, do not assume it. Ask, or record it as an Open Question in `docs/01-CURRENT-STATE.md`.
