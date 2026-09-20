# RUN RECEIPT — Phase 2E: Lawrence evidence enrichment + editorial QA

## Run Metadata

- Date: 2026-09-20
- Time: 00:15 start, 00:40 receipt written
- Timezone: EDT
- Agent: Claude (Claude Code)
- Model if known: Claude Opus 5
- Repository: https://github.com/tomytomz1/CIPP-IN
- Branch: `phase-2e-lawrence-evidence-editorial`
- Starting SHA: `7a76251d2d3d324da5ef2b2e1f225bcf9f8fc00a`
- Ending/work commit: the commit containing this receipt; resolve with `git log -- research/sources/technical-standards.json`
- Run result: COMPLETE

## Operator Request

Preserve newly identified authoritative Lawrence evidence; strengthen the flagship Lawrence page without inventing anything; apply specific editorial corrections identified by the strategy/editorial review; update the Lawrence publication record honestly; implement the missing similarity-QA runner; keep every page `noindex`. No deployment, no lead activation, no index approval, no new pages or municipalities.

## Instructions / Requirements Read

`AGENTS.md`, `docs/00-PROJECT-CHARTER.md`, `docs/01-CURRENT-STATE.md`, `logs/RUN-LOG.md`, the Phase 2D receipt and the post-Phase-2D reconciliation receipt, `docs/02-SEO-SERP-BLUEPRINT.md`, `docs/03-GOOGLE-RESILIENCE.md`, `docs/04-CONTENT-EDITORIAL-SYSTEM.md`, `docs/05-BUILD-SPEC.md`, `research/index.json`, `research/sources/lawrence-primary-sources.json`, the SERP snapshot's competitor records, `content/publication-records/lawrence-sewer-lateral-repair.json`, and all three page files.

## Starting State Observed

- `origin/main` = local HEAD = `7a76251`, matching the SHA the operator supplied; working tree clean.
- Three `published_noindex` pages; 0 approvals; 0 indexable; Lawrence gate 3 of 8; publication score 55/85.
- No similarity runner existed; workflow step 14 was `not_started`.

## Work Performed

1. Verified four new City of Lawrence sources directly (see below) before changing any research or content.
2. Added ten records and four sources to `research/sources/lawrence-primary-sources.json`, and created `research/sources/technical-standards.json` for general method mechanics; registered both in `research/index.json`.
3. Applied every operator-directed editorial correction to the Lawrence page, the About page, and the homepage.
4. Added two new Lawrence-evidence sections and an original compiled table of the City's own rehabilitation projects.
5. Implemented the similarity-QA runner and added it to CI.
6. Reassessed the municipality gate and re-scored the page, then updated the publication record.
7. Ran the full validation chain and verified the rendered page structure in a browser.
8. Updated `docs/01-CURRENT-STATE.md` and `docs/05-BUILD-SPEC.md`, wrote this receipt, appended the run log.

## Files Created

- `research/sources/technical-standards.json`
- `scripts/lib/similarity.ts`
- `scripts/similarity-qa.ts`
- `tests/unit/similarity.test.ts`
- `logs/runs/2026-09-20-0040-phase-2e-lawrence-evidence-editorial.md` (this receipt)

## Files Modified

- `research/sources/lawrence-primary-sources.json` — 4 new sources, 10 new records (now 8 sources, 20 records). Nothing existing was overwritten.
- `research/index.json` — registered the new file, added the `technical` category, updated counts and dates.
- `src/pages/lawrence-sewer-lateral-repair.astro` — editorial corrections, new evidence sections, project table, expanded sources.
- `src/pages/about.astro` — contractor-evidence and claim-labelling corrections.
- `src/pages/index.astro` — narrowed the quote wording.
- `src/components/DecisionFlow.astro` — removed the implied claim that a camera establishes burial depth.
- `content/publication-records/lawrence-sewer-lateral-repair.json` — evidence, claims, gate, score, workflow, hard gates.
- `tests/unit/site-pages.test.ts` — updated for the 5-of-8 gate and the re-classified claims.
- `package.json` — `similarity:qa` script; added it to the `ci` script.
- `.github/workflows/ci.yml` — similarity QA step inside `build-and-test`.
- `docs/01-CURRENT-STATE.md`, `docs/05-BUILD-SPEC.md`, `logs/RUN-LOG.md`.

## Files Deleted

None.

## Research / Evidence Added

**New official sources, each opened and read in full before use (all retrieved 2026-09-20):**

1. **Application for Sanitary Building Sewer Lateral Construction Permit** (City of Lawrence Utilities). Verified: it covers New Line, Repair/Modification Work, and Replace/Relocate; emergency work must be applied for no later than the following business day; a plat drawing showing location of work and materials is required, carrying the statement that all work will meet or exceed City standards; it collects owner details, parcel number, legal description, and installing/repairing contractor details including a Lawrence registration number; a separate grease-trap application is required where applicable. It states **no permit fee** and gives **no submission address**, so those gaps remain.
2. **The Lawrence Lift, August 2024 (Issue 102)**. Verified: residents are responsible for lateral maintenance and repair to the point of connection at the city's main; owners are asked to replace older clay laterals beyond their useful life because old clay cracks and breaks easily, letting dirt and roots in; an increase in laterals damaged by contractors installing fiber optic lines for 5G upgrades; an after-hours on-call number (317-260-0220) with the reminder that the City does not reimburse contractor costs when the fault is in the public main; sump pumps and downspouts must not be connected to the lateral (the utility cites ordinance 5-1-2-2); crews use robotic cameras on mains and building sewers and install liners in old pipes.
3. **The Lawrence Lift, July 2025**. Verified: the 71st Street Lift Station Basin Rehabilitation (approximately 3,000 linear feet of 8-inch and 12-inch CIPP, approximately 1,300 linear feet of 6-inch sanitary lateral lining, 400 feet of new 12-inch PVC, manhole rehabilitation; Oaklandon Northeast Addition streets named; EPA Administrative Order on Consent of November 2021; corrective action plan approved April 2025) and the Fort Harrison Collection System Capacity Improvements Phase III (2,155 feet of 18-inch replaced, 2,478 feet CIPP lined, approximately 2,180 feet abandoned).
4. **Lawrence 46th and Post I/I Removal Project — Pre-Bid Meeting Minutes, 2026-02-19** (hosted by the City). Verified: CIPP of 8-, 10-, 12-, and 15-inch sewers with associated lateral lining; partial replacements with wyes; manhole lining; pre-CCTV in Phase 1 and post-CIPP CCTV in Phase 2; customers whose building sewer laterals will be out of service get 24 to 48 hours' written notice, with a maximum of eight hours without service; pre-installation television inspection before lateral lining; bids received at the Utility Office, 9201 Harrison Park Court, by 2026-03-13.

**General technical evidence** (new file): Hampton Roads Planning District Commission Regional Construction Standards Section 824 (sewer lateral rehabilitation by cured-in-place method) and Section 815 (pipe bursting), June 2016. These source the method mechanics the page describes. They are issued for another jurisdiction and are labeled as such on the page and in the records; they never count toward the municipality gate.

**Not added:** the EPA state-of-technology report (EPA/600/R-09/048) was located and its citation verified, but the full text could not be retrieved (the NEPIS download returned a license error), so it is not cited anywhere.

**Retrieval note:** cityoflawrence.org returns HTTP 404 to a default user agent; a browser user agent is required. That also explains the 404 recorded for the August 2023 newsletter in Phase 0.1, which is reachable at its original URL again. Recorded as a new record (`law-020`) rather than by rewriting the historical record.

## Commands / Tools Used

`git fetch`/`switch`, `curl` (source retrieval), PDF reads of each source, `WebFetch`/`WebSearch` (locating the August 2024 issue and the pre-bid minutes), `npm run typecheck`, `npx vitest run`, `npm run validate:records`, `npm run validate:migrations`, `npm run build`, `npm run check:dist`, `npm run check:budgets`, `npm run similarity:qa`, `npm run test:a11y`, and the built-in browser against `scripts/serve-dist.ts`.

## Validation / Tests Performed

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | 70 files, 0 errors. |
| `npx vitest run` | PASS | 189 tests in 14 files (15 new similarity tests; site-page tests updated). |
| `npm run validate:records` | PASS | 3 records, 0 approvals, 0 effectively indexable; Lawrence 63/85. |
| `npm run validate:migrations` | PASS | Unchanged: 10 tables, 0 seeded rows. |
| `npm run build` | PASS | 3 pages. |
| `npm run check:dist` | PASS | 0 sitemap URLs, 0 indexable; links, fragments, and JSON-LD valid. |
| `npm run check:budgets` | PASS | 0 B JS, ~1.8 KB CSS gzip per page. |
| `npm run similarity:qa` | PASS (incomplete by design) | 0% sentence near-duplication and 0% heading overlap between all three pages; embeddings `not_run` (no API key), so step 14 stays unsatisfied. |
| `npm run test:a11y` | PASS | 18 checks; lab LCP 476–596 ms, CLS 0.000. |
| Rendered-page check | PASS (structure) | Page text and the accessibility tree confirm the new sections, the project table with its three rows and working source anchors. Screenshots returned blank this run because the browser pane was not drawing; the visual design was unchanged from Phase 2D, which was reviewed at desktop and 375 px. |
| CI on the PR | See Commit / Push Status | Recorded after the required checks ran. |

**Defect found and fixed during the run:** the first similarity run flagged 20% sentence duplication between pages. Investigation showed the runner was comparing whole documents including shared site chrome, because a corrupted escape sequence broke the `<main>` extraction regex. Fixed, and a test now guards it.

## Decisions Made

### Operator-approved / previously locked

- Every editorial correction in section 5, 8, and 9 of the operator's instruction, applied as directed.
- Locked thresholds and gates unchanged; `text-embedding-3-small` remains the only accepted model.

### Agent implementation decision

- General method mechanics are sourced from government-issued engineering specifications and stored in a separate `technical` evidence file, so they can never be mistaken for Lawrence requirements or counted toward the municipality gate.
- The method table's "usually considered when" column, which was unsourced suitability judgement, was replaced with "what the work involves", stated from cited documents.
- The after-hours number is published **with its August 2024 date** plus an instruction to check the City's current contact details, rather than omitted or presented as current.
- Similarity comparisons use the `<main>` element so shared chrome does not register as duplication.
- The compiled table of City rehabilitation projects is **not** claimed as gate category 7.
- CI runs the deterministic similarity checks; the embedding check is not run in CI because no key exists.

### Proposed / still awaiting operator approval

- Whether to obtain an OpenAI API key so the embedding half of similarity QA can run (Open Question: it is a paid vendor resource; none was created).
- The human editorial pass and expert reviewer remain outstanding operator actions.

## Previous Conclusions Changed

- The Location Page Quality Gate result changed from **fail (3 of 8)** to **pass (5 of 8)** on new evidence.
- The publication score changed from **55** to **63** (still below the 85 threshold).
- `repair-method-mechanics` moved from an uncited INFERENCE to a cited FACT.
- The Phase 0.1 note that the August 2023 newsletter URL returns 404 is narrowed: it returns 404 only to a non-browser user agent.
- Several editorial statements were removed as unsupported (listed under Things Explicitly NOT Done and in the final report).

## Current Risks

- Five of the eight gate categories now qualify, but two of them rest on utility newsletters, which are guidance rather than law and can be revised without notice.
- The page's caution about what CCTV can and cannot establish is recorded as an INFERENCE and is a prime candidate for correction by the expert reviewer who does not yet exist.
- The embedding half of similarity QA has never run, so cross-page and competitor semantic similarity is unmeasured.
- Unchanged: no expert reviewer, no human editorial pass, legal review outstanding, no deployment.

## Current Blockers

None for the next phase. Indexing the Lawrence page still needs expert review, a human editorial pass, the embedding similarity run, manual accessibility review, a score of 85, and operator index approval.

## Things Explicitly NOT Done

- No deployment, DNS, or hosting change; no Cloudflare, Resend, Twilio, or OpenAI resource, account, or key.
- No lead form, no data collection, no admin console, no additional pages or municipalities.
- No index approval; `governance/index-approvals.json` is untouched and empty; no page became indexable.
- Workflow step 11 (Human Editorial Restructuring) was **not** marked complete — an AI revision does not satisfy it.
- Expert review was **not** marked complete, and no reviewer was invented.
- Manual keyboard/screen-reader review was **not** performed and is still recorded as outstanding.
- Conversion QA was **not** marked passed; no lead path exists.
- Gate categories 6, 7, and 8 were **not** claimed; the count was not padded.
- No lifespan, price, ROI, success-rate, or prevalence claim was added anywhere.
- No Lawrence responsibility diagram was published.
- No competitor page body was stored; no API key was committed.
- `docs/02`, `docs/03`, `docs/04`, and `AGENTS.md` were not edited. No governance change.

## Current Project State After This Run

Three `published_noindex` pages. The Lawrence page now carries seven Lawrence sources plus general method specifications, passes the Location Page Quality Gate at 5 of 8, scores 63/85, and remains blocked from indexing by expert review, the human editorial pass, the embedding similarity run, manual accessibility review, the score gap, and the absent operator approval. 189 unit tests and 18 accessibility checks pass. 0 indexable pages, 0 approvals, 0 sitemap URLs, 0 leads, nothing deployed.

## Next Recommended Step

Operator actions, in order of what unblocks the most: a human editorial pass over the Lawrence page; recruiting a real expert reviewer; and deciding whether to provide an OpenAI API key so the embedding similarity check can run. Confirming the remaining Lawrence questions with the utility would raise the score further. None was started.

## Commit / Push Status

- Branch: `phase-2e-lawrence-evidence-editorial`; PR to `main`
- Work committed: YES
- Pushed: YES
- Commit message: `Phase 2E: Lawrence evidence enrichment, editorial QA, similarity runner`
- Commit reference: the commit containing this receipt; resolve with `git log -- logs/runs/2026-09-20-0040-phase-2e-lawrence-evidence-editorial.md`

## Final Operator Report

Recorded in the final response and consistent with this receipt: starting SHA `7a76251`; four new verified City sources and ten new research records plus a technical-standards file; municipality gate 3/8 → 5/8; publication score 55 → 63; the listed unsupported statements removed or narrowed; the similarity runner implemented with deterministic checks clean (0%/0%) and embeddings `not_run`; human editorial, expert review, manual accessibility review, and conversion QA all still outstanding; 0 index approvals and 0 indexable pages.
