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
| Historical run/session audit trail | `logs/RUN-LOG.md` and `logs/runs/` |

Do not create additional strategy Markdown files unless the operator explicitly instructs it. Store evidence as structured JSON under `research/`, not as new strategy documents. Put new knowledge in the owning document above; cross-reference instead of copying.

`/logs/` holds historical evidence of agent work: what each session was asked to do, did, verified, and left unresolved. It does not override project requirements, and `docs/01-CURRENT-STATE.md` remains authoritative for current state. Receipts are append-only. Never silently rewrite a historical receipt or RUN-LOG entry. Correct errors by adding a later correction entry (obvious formatting corruption excepted).

---

## 2. Before Work

1. Read `AGENTS.md` completely.
2. Read `docs/00-PROJECT-CHARTER.md`.
3. Read `docs/01-CURRENT-STATE.md`.
4. Read `logs/RUN-LOG.md`.
5. Read at least the latest relevant run receipt in `logs/runs/`. Read older receipts only when needed to understand the current task; do not read every historical receipt by default. Context order: CURRENT-STATE → RUN-LOG index → latest/relevant full receipt.
6. Read every strategy document relevant to the task.
7. Read `docs/05-BUILD-SPEC.md` before any implementation work.
8. Inspect the current repository and code before changing anything.
9. Never rely on stale summaries (including CURRENT-STATE or your own memory) when the current code contradicts them. Report the discrepancy.

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

Before giving the human the final completion response, every meaningful work session MUST, in this order:

1. Complete the relevant work.
2. Run relevant tests/checks.
3. Inspect your own work (re-read diffs and outputs; do not assume success).
4. Update `docs/01-CURRENT-STATE.md` when required (status sections, Change Log, anything now stale). Document material decisions in its Last Major Decisions section, and in the owning document if a rule or spec changed. Do not turn CURRENT-STATE into a run log.
5. Create a new full session receipt in `logs/runs/`, copied from `logs/RUN-RECEIPT-TEMPLATE.md`. Name it `YYYY-MM-DD-HHMM-<short-slug>.md` (local time; state the timezone, or use UTC and say so). Never overwrite an existing receipt; if a phase is run again, create another receipt.
6. Append the matching entry to `logs/RUN-LOG.md`.
7. Confirm that every factual claim planned for the final response appears in the receipt.
8. Commit and push when the task calls for repository changes.
9. Give the human the final response: what changed, unresolved risks, and the current commit SHA when Git exists.

### Critical final-response rule

An agent must not claim in its final response that it created, changed, verified, tested, committed, pushed, fixed, or completed something unless that claim is supported by the actual repository/tool state and is recorded in the current run receipt.

If the final response materially differs from the prepared run receipt, update the receipt before finalizing.

### What requires a receipt

- **Required:** every meaningful work session: code changes, research, configuration, deployment, SEO or content work, architectural decisions, documentation changes, production verification, bug fixes, migrations, significant audits.
- **Also required for failed work:** runs that are blocked, lack credentials, cannot verify a source, do research without repository changes, start but cannot finish, or conclude the request should not proceed. Record them with `Run result: PARTIAL` or `BLOCKED` (or `NO-CHANGE` where nothing was changed). Failed attempts are part of project history.
- **Not required** (unless the operator asks): typo fixes, read-only status checks, casual questions, and discussion with no project work.

A receipt cannot reliably contain the SHA of the commit that contains it. Record the starting SHA and "the commit containing this receipt; resolve with git log". Never create extra commits solely to insert a commit's own SHA.

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
