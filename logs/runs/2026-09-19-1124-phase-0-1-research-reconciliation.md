# RUN RECEIPT — Phase 0.1: Research evidence reconciliation (BACKFILLED)

> **Backfilled on 2026-09-19 during Phase 0.2.** Written after the fact from:
> (a) Git history (commit `52d4d96`, its diff and timestamp) and the files it contains, and
> (b) the context of the same Claude session that performed the work.
> Every factual claim below was checked against the committed research files and docs. Items that cannot be established are marked "Not recoverable from repository history."

## Run Metadata

- Date: 2026-09-19
- Time: Work start time not recoverable from repository history. Commit timestamp: 11:24:39.
- Timezone: America/New_York (EDT, UTC−04:00), per the commit timestamp
- Agent: Claude (Claude Code, desktop app)
- Model if known: Claude Opus 5 (`claude-opus-5`)
- Repository: https://github.com/tomytomz1/CIPP-IN
- Branch: `main`
- Starting SHA: `c8cf100a85a023b4e03e5dfbfeac094439320507`
- Ending/work commit: `52d4d96b34fb00ab68712cd96dfaaa1893f59cc2`
- Run result: COMPLETE

## Operator Request

"PHASE 0.1 — RESEARCH EVIDENCE RECONCILIATION."

- Preserve the pre-Phase 0 research evidence as structured JSON under `research/`, in five specified files.
- Independently re-verify all of it: Lawrence municipal sources, SERP/competitor pages, five prospective tenants, and Google Search policy.
- Keep research candidates separate from contacted or validated renters.
- Reconcile `docs/01-CURRENT-STATE.md` and `docs/02-SEO-SERP-BLUEPRINT.md` without redesigning strategy.
- Validate the JSON, then commit and push.
- Do not build a site, choose a stack/domain/brand, contact tenants, or invent data. Do not begin Phase 1.

Preceding attempt (same session, not separately committed): an earlier Phase 0.1 message was truncated after the `research/` folder layout. The agent fetched `origin/main` (confirmed at `c8cf100`, clean tree), changed nothing, and stopped to ask for the missing instructions and evidence. Under the Phase 0.2 rules that would be a BLOCKED / NO-CHANGE run; it is recorded here rather than as a separate receipt.

## Instructions / Requirements Read

- `AGENTS.md`, `CLAUDE.md`, `docs/00`–`docs/05`. All had been written by the same session in Phase 0 and were unchanged since `c8cf100`. They were not re-opened with a read tool at the start of this run; the agent relied on its working context of files it had authored in the same session. `docs/01-CURRENT-STATE.md` was opened (header lines) before rewriting.

## Starting State Observed

- `origin/main` = local `HEAD` = `c8cf100a85a023b4e03e5dfbfeac094439320507`. Working tree clean.
- Tree: `AGENTS.md`, `CLAUDE.md`, `docs/` (6 files). No `research/` directory.

## Work Performed

- Lawrence municipal sources:
  - Located the City's Construction Specifications page. It links the 2019 Unit I Policy and Procedures manual (approved 12/23/2019).
  - Opened the 2019 manual and confirmed §1.02–§1.04 and §1.06 on pages I-1 to I-4.
  - Opened the City-hosted 2018 manual and found it is a 4-page excerpt without §1.06.
- Lawrence Lift, August 2023, Issue 90:
  - The City URL `lift-2023-august.pdf` returns 404, and the City's archive filter did not list it.
  - Found the file in Internet Archive CDX listings and downloaded the 2024-08-08 capture.
  - Extracted its text and confirmed the lateral-responsibility content and ordinance citations.
- Lawrence Code of Ordinances (American Legal, "2025 S-18 (current)"): read §5-1-1-2(A)(10)–(11), §5-1-2-1, §5-1-2-4, §5-1-2-5, and §5-1-2-7 in the browser.
- Searched Internet Archive listings for newer manual revisions and found none newer than 2019.
- Google SERPs: ran 10 target queries in the built-in browser (the page showed location "Lawrence, IN") and recorded titles, breadcrumbs, and page features.
- Competitors and tenants: verified named competitor and tenant pages with WebFetch, WebSearch, curl, and the browser. This included YoHomeFix's Indiana sitemap (17,453 URLs), careers pages, the NuFlow article dated April 14, 2026, and 317 Plumber's Lawrence page.
- Google Search Central: verified spam policies, people-first content, AI-content blog post, gen-AI content guidance, and the AI-features optimization guide.
- Wrote the five research JSON files. Replaced two invented day-level dates with `null`, and corrected one camera-inspection wording from "may accept" to "may require".
- Rewrote `docs/01-CURRENT-STATE.md` and made narrow edits to `docs/02`, `AGENTS.md`, and `docs/05`.
- Validated JSON, inspected the diff, re-checked that `origin/main` had not moved, committed, pushed, and confirmed `origin/main` = `52d4d96`.

## Files Created

- `research/index.json`
- `research/sources/lawrence-primary-sources.json` (4 sources, 10 records)
- `research/sources/prospective-tenants.json` (5 candidates, 13 evidence records)
- `research/sources/google-search-policy.json` (7 records)
- `research/serps/2026-09-19-competitor-snapshot.json` (10 queries, 8 competitor-page records)

## Files Modified

- `docs/01-CURRENT-STATE.md`: rewritten to add:
  - Research Provenance
  - Lawrence Municipal Evidence Status (verified vs. uncertain)
  - Future Tenant Candidates split into research candidate / contacted / proven
  - revised Open Questions, Risks, Blockers, Priorities, and Change Log
- `docs/02-SEO-SERP-BLUEPRINT.md`: provenance block pointing to `research/`, 317 Plumber and SLB added as observed competitors, information-gap nuance, Information Advantage status.
- `AGENTS.md`: added a `research/` row to the ownership table and a line on storing evidence as JSON.
- `docs/05-BUILD-SPEC.md`: repository-contents line now includes `research/`.

## Files Deleted

None.

## Research / Evidence Added

- **Verified (Lawrence):**
  - owner responsibility for the private lateral, including the right-of-way portion (ordinance §5-1-2-7 + §5-1-1-2(A)(11); Aug 2023 Lift)
  - permit required for repair (ordinance §5-1-2-1(A); manual §1.06)
  - lining and pipe bursting allowed (2019 manual §1.06)
  - post-repair CCTV requirement: cleanout to main; point repair to at least 2 ft past (§1.06)
  - installation rules (§§1.02–1.04)
- **Partially verified / uncertain:**
  - manual "property line to main" wording, reconciled only by inference
  - whether the 2019 policy is still applied without unpublished revisions
  - CCTV delivery format, permit fees/forms/office, tap/wye responsibility, waiver frequency
  - service-area boundary (`law-010`, unverified)
  - any cost-share program
- **Competitors verified** with exact URLs: Roto-Rooter, Mr. Plumber, YoHomeFix, NuFlow Indy, Carter's My Plumber, Modern Plumbing, 317 Plumber, SLB Pipe Solutions.
- **Tenants:** 5 research candidates, 0 contacted, 0 with proven need for leads, 0 with proven willingness to pay.
- **Google policy:** 7 records. None contradicts `docs/03`.

## Commands / Tools Used

- `git fetch`, `git rev-parse`, `git status`, `git diff`, `git commit`, `git push`
- WebSearch, WebFetch; PDF page rendering (read tool); `pdftotext`
- `curl`: URL probing, Internet Archive CDX queries, sitemap and keyword checks
- Built-in browser: City site, American Legal code library, Google SERPs, 317 Plumber
- Python: JSON parse validation, record-count and field checks, string-replace fixes

## Validation / Tests Performed

| Check | Result | Notes |
|---|---|---|
| JSON parse (all 5 research files) | PASS | Python `json.load` |
| Record counts / required fields | PASS | Only `law-010` lacks a URL, deliberately (`status: unverified`, a recorded gap) |
| Stale-statement scan of docs | PASS | `grep` for "not stored / unverified / None identified / Current contents"; fixed `docs/05` |
| No application code | PASS | Tree listing: only `.md` and `.json` |
| `origin/main` unchanged before push | PASS | Still `c8cf100` |
| Push confirmed | PASS | `origin/main` = `52d4d96` |
| Application tests / build | NOT RUN | No application exists |

## Decisions Made

### Operator-approved / previously locked
- Evidence stored as JSON under `research/`, subordinate to `/docs/` (operator instruction).
- Lawrence / Indianapolis strategy unchanged.

### Agent implementation decision
- Record the Aug 2023 Lift using the Internet Archive capture, with the dead City URL noted.
- Mark the responsibility-wording reconciliation `partially_verified` (inference).
- Use `cipp_verified: "partial"` for Modern Plumbing.
- Add `research/` to the AGENTS.md ownership table and fix the `docs/05` repository-contents line.
- Add "Research Provenance" and "Lawrence Municipal Evidence Status" sections to CURRENT-STATE.

### Proposed / still awaiting operator approval
- Whether to add an AI-use disclosure policy to `docs/04` (CURRENT-STATE Open Question 9).

## Previous Conclusions Changed

1. Sources B and C are the same currently linked 2019 manual. The City-hosted 2018 file is an excerpt without §1.06.
2. The Aug 2023 Lift is no longer on the City site; verified via the Internet Archive only.
3. The suspected responsibility-wording conflict was resolved by the ordinance; the reconciliation is still an inference.
4. Carter's "50+ people" is not found on company pages; unverified.
5. Modern Plumbing does not name CIPP explicitly; its trenchless page mentions lining and bursting.
6. SLB is headquartered in Bedford, IN; Lawrence is not named in its service areas.
7. Mr. Plumber's Lawrence page links to site-wide `/sewer-repair/`, not a Lawrence-specific page.
8. YoHomeFix, Carter's, and Modern Plumbing were not seen in the top results of the 2026-09-19 capture.
9. The Lawrence "information gap" is in homeowner translation, not availability: the City's policy PDF ranked first for the primary query.

## Current Risks

- Residual Lawrence practical-detail uncertainty; the manual dates from 2019.
- The City's own PDF ranks first for the primary query.
- Specialists hold Indianapolis head terms.
- Tenant/competitor overlap.
- Rental viability unproven; legal/compliance pending.
- Evidence staleness.

## Current Blockers

- None for Phase 1.
- Remaining Lawrence uncertainties block **indexing** Lawrence content, not Phase 1.

## Things Explicitly NOT Done

- Did not build a website or install a framework.
- Did not choose a stack, hosting, database, CMS, brand, or domain.
- Did not create SEO, landing, or city pages.
- Did not contact any tenant candidate or Lawrence Utilities.
- Did not record rankings as reliable positions, or invent keyword volume, backlinks, revenue, or contractor capacity.
- Did not mark need for leads or willingness to pay as verified.
- Did not alter `docs/00`, `docs/03`, `docs/04`, or `CLAUDE.md`.
- Did not begin Phase 1.

## Current Project State After This Run

Docs plus verified research evidence were in the repository. There was no code, content, domain, leads, or data. The project was declared ready for Phase 1.

## Next Recommended Step

Phase 1 (brand/domain, then architecture and build-spec lock). Separately, confirm the Lawrence uncertainties with Lawrence Utilities before indexing.

## Commit / Push Status

- Branch: `main`
- Work committed: YES
- Pushed: YES
- Commit message: `Phase 0.1: preserve research evidence and reconcile project state`
- Commit reference: `52d4d96b34fb00ab68712cd96dfaaa1893f59cc2`

A follow-up "please commit and push to main" request in the same session found a clean tree with `HEAD` = `origin/main` = `52d4d96`. Nothing was committed (NO-CHANGE; no separate receipt, per the no-log-noise rule).

## Final Operator Report

Substance of the report given to the operator:

- Starting SHA `c8cf100…`; ending SHA `52d4d96…`.
- Five evidence files created; all JSON valid; every factual record has a URL and verification date (`law-010` is an explicit unverified gap).
- **Lawrence verified:** owner responsibility including the right-of-way portion; permit requirement; lining and pipe bursting allowed per the currently linked 2019 manual; CCTV-after-repair requirement per the manual; installation rules.
- **Lawrence still uncertain:** wording reconciliation (partially verified), whether the policy is current in practice, CCTV format, fees/forms/office, tap responsibility, waiver use, service boundary, cost-share programs, newsletter available only via archive.
- **Competitors:** all named competitor pages re-verified with exact URLs.
- **Tenants:** 5 research candidates. None contacted, none with proven need for leads, none with proven $5K willingness.
- **Google policy:** 5 sources re-verified (7 records); no contradiction with `docs/03`.
- **Docs updated:** `docs/01`, `docs/02`, the `AGENTS.md` ownership row, a one-line correction in `docs/05`.
- **Changed conclusions:** 9 (listed above).
- **Contradictions:** none.
- **Blockers:** none for Phase 1; Lawrence items block indexing only.
- Final line: "YES — READY FOR PHASE 1".
