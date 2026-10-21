# RUN RECEIPT — Phase 2G premium visual redesign and credibility upgrade

## Run Metadata

- Date: 2026-10-21
- Time: 02:30 (work began ~01:45; earlier worker restarted before any commit)
- Timezone: UTC
- Agent: Claude Code (cloud session)
- Model if known: Claude (Anthropic); exact serving model not recorded in-repo per session instructions
- Repository: https://github.com/tomytomz1/CIPP-IN
- Branch: `claude/epic-volta-roofwc` (the branch this session is required to use; the operator's suggested `feat/phase-2g-credibility-redesign` name was not used for that reason)
- Starting SHA: `1ff25f0eec571f0083856f9bf73b63ed02b4de6b` (`main`, unchanged from the SHA named in the request)
- Ending/work commit: implementation commit `0291cd7`; documentation commit is the commit containing this receipt (resolve with `git log`)
- Run result: PARTIAL (updated below as PR, CI, merge, and release steps complete)

## Operator Request

Execute Phase 2G: a production-quality visual redesign of the three existing pages (`/`, `/lawrence-sewer-lateral-repair/`, `/about/`) so the site reads as a credible, independent, premium editorial publication to homeowners and to sewer/utility professionals. Preserve all research, caveats, and governance. Replace the global "Pre-publication draft" bar with truthful but less damaging status communication. Keep every indexing, lead-intake, analytics, CSP, DNS, and Cloudflare safeguard unchanged. Validate, open a PR, pass the five required CI checks, merge normally, confirm the Cloudflare release, and verify production after deployment.

## Instructions / Requirements Read

`AGENTS.md`, `CLAUDE.md`, `docs/00-PROJECT-CHARTER.md`, `docs/01-CURRENT-STATE.md` (full), `docs/04-CONTENT-EDITORIAL-SYSTEM.md` (full), `docs/03-GOOGLE-RESILIENCE.md` (targeted: gates, original-asset category, expert review), `docs/05-BUILD-SPEC.md` (Design System, Routes, Shared Components, Performance Budget, Accessibility, CSP/analytics, Phase 2D record), `logs/RUN-LOG.md` (recent entries), `logs/RUN-RECEIPT-TEMPLATE.md`, `research/editorial/2026-10-20-publication-readiness.json` (targeted), `content/publication-records/*.json`, `.github/CODEOWNERS`, `.github/workflows/ci.yml`. `docs/02-SEO-SERP-BLUEPRINT.md` was not re-read in full: no SEO, query, or page-strategy change was made.

## Starting State Observed

- `main` = `1ff25f0`; working tree clean; no unmerged work from the restarted worker.
- `src/`, `public/`, and `astro.config.mjs` identical between the deployed release commit `6187cbf` and `1ff25f0` (`git diff --stat` empty), so a local build of `main` reproduces the deployed source.
- The live domain could **not** be reached from this container: the egress proxy refused `indysewerresource.com:443` (HTTP 403 on CONNECT). TinyFish was unavailable (failed to connect) and was not used, per the request.

## Work Performed

1. **Before audit (local, not live).** Built `main` in production mode with `PUBLIC_GA4_ENABLED=true` and captured full-page and above-the-fold Chromium screenshots of all three pages at 320, 390, 768, 1024, 1440, and 1920 px (light) plus 390 and 1440 px (dark). Findings: global "Pre-publication draft" bar directly under the header; no brand mark; text-only header whose navigation wrapped awkwardly on phones; homepage led with method rather than the homeowner's problem; nested prose columns on the homepage were visibly off-axis; every h2 had a full-width rule ("documentation" look); Lawrence page a single 40 rem column with wide empty margins on desktop, no table of contents, a cramped 5-column project table, uniform amber boxes for both "Inference" and "Not established"; footer two plain paragraphs. No horizontal overflow at any width.
2. **Design system** (`src/styles/global.css`): new token set (ivory/navy/teal, distinct evidence colors) with dark theme, system serif display stack, layout primitives, components; no inline style attributes; reduced motion and print rules.
3. **Shared shell** (`src/layouts/BaseLayout.astro`, `src/config/brand.ts`): SVG brand mark, `SITE_DESCRIPTOR`, nav labels `Home` / `Lawrence guide` / `Methodology`; removed the global status bar; structured footer with Independence (original disclosure text), Editorial status, and a footer nav; consent component untouched.
4. **New components:** `BrandMark.astro`, `HeroIllustration.astro`, `MethodSchematic.astro`, `OnThisPage.astro`, `EvidenceChip.astro`. **Changed:** `DecisionFlow.astro` (portrait redraw; same steps, same title/desc), `EvidenceNote.astro` (icon + label, body wrapper), `SourceList.astro` (supports / verified / limitation as a description list; same text).
5. **Homepage** rebuilt per the requested hierarchy (hero, "What brings you here?", five decision stages, Lawrence feature, evidence and transparency, about the publication). Existing status list retained verbatim.
6. **Lawrence guide** restructured (status panel, summary, sticky contents, method cards, project cards, documented permit sequence, checklists, open-questions panel, source cards). Two wording refinements in new summary/sequence copy were made to avoid overstatement ("defective repair", "submitted to the utility for approval").
7. **About page** redesigned (in-brief cards, "Who it is for", ranked source ladder, claim table with chips, page-status table, contact statement, collected/not-collected lists). Corrected one pre-existing overstatement about source dates on every page.
8. **Pre-existing rendering bug fixed:** Astro dropped the space before an inline element when a source line ended with a word (e.g. footer "See<a>", Lawrence "the<a>Application…", "and<em>sewer service line", "published<strong>317-260-0220"). Fixed with explicit `{' '}`; re-scanned all built HTML for the pattern (0 remaining).
9. Pipe-bursting schematic corrected after self-review (the new pipe must trail the bursting head from the insertion pit).
10. Stale comment in `scripts/lib/similarity.ts` updated (no logic change).
11. Documentation: `docs/05-BUILD-SPEC.md` (Design System; Implementation Record: Phase 2G), `docs/01-CURRENT-STATE.md` (completed, architecture JS/CSS figures, not-started visuals, Open Question 15, risk, decision, change log, priorities).

## Files Created

- `src/components/BrandMark.astro`
- `src/components/EvidenceChip.astro`
- `src/components/HeroIllustration.astro`
- `src/components/MethodSchematic.astro`
- `src/components/OnThisPage.astro`
- `logs/runs/2026-10-21-0230-phase-2g-credibility-redesign.md`

## Files Modified

- `src/styles/global.css` — design system rewrite
- `src/layouts/BaseLayout.astro` — header, footer, status bar removal
- `src/config/brand.ts` — descriptor, nav labels, stale origin comment
- `src/pages/index.astro`, `src/pages/lawrence-sewer-lateral-repair.astro`, `src/pages/about.astro` — redesign
- `src/components/DecisionFlow.astro`, `src/components/EvidenceNote.astro`, `src/components/SourceList.astro` — presentation
- `scripts/lib/similarity.ts` — comment only
- `docs/05-BUILD-SPEC.md`, `docs/01-CURRENT-STATE.md`, `logs/RUN-LOG.md`

## Files Deleted

None.

## Research / Evidence Added

None. No new source was consulted and no research record changed. Contact-channel check: repository search found no published editorial address; `research/analytics/2026-10-20-cloudflare-history.json` records five registrar `eforward` MX records, which shows forwarding infrastructure exists but not that any address is configured or monitored.

## Commands / Tools Used

`git fetch/log/diff/stash/commit`, `npm ci`, `npm run typecheck|test|validate:records|validate:migrations|build|check:dist|check:budgets|similarity:qa|test:a11y|build:production`, `node scripts/serve-dist.ts`, Playwright/Chromium scripts in the session scratchpad (screenshots at six widths and two color schemes, overflow detection, dark-mode axe, keyboard focus walk, cross-page fragment resolution), a sentence-level old/new rendered-text comparison, `grep` scans of built HTML. Local Playwright needed a symlink from the expected headless-shell path to the preinstalled `/opt/pw-browsers` Chromium (environment only; no repository change).

## Validation / Tests Performed

| Check | Result | Notes |
|---|---|---|
| `npm ci` | PASS | |
| `npm run typecheck` | PASS | 0 errors, 0 warnings, 0 hints |
| `npm test` | PASS | 201 tests |
| `npm run validate:records` | PASS | |
| `npm run validate:migrations` | PASS | |
| `npm run build` (development) | PASS | |
| `npm run check:dist` | PASS | SEO / indexing firewall / links / structured data |
| `npm run check:budgets` | PASS | CSS 6,404 B gzip per page (was 1,948); JS 3,090 B gzip in GA4 production build (unchanged); 0 fonts |
| `npm run similarity:qa` | PASS (deterministic) | 0% sentence, 0% heading overlap; embeddings `not_run` (no key), as before |
| `npm run test:a11y` on development build | PASS | 18 passed, 8 analytics tests skipped by design |
| `npm run build:production` with `PUBLIC_GA4_ENABLED=true` | PASS | includes production check-dist, budgets, similarity |
| `npm run test:a11y` on GA4 production build | PASS | 26 passed; lab LCP 208–292 ms, CLS 0.000 |
| axe WCAG 2.2 A/AA in dark mode, 390 and 1440 px (manual script) | PASS | 0 violations on all three pages |
| Horizontal overflow at 320/390/768/1024/1440/1920 px | PASS | `scrollWidth` equals viewport on every page |
| Keyboard focus walk, 390 and 1440 px | PASS | every stop visibly outlined and in view; only sub-24 px targets are inline sentence links (2.5.8 inline exception) |
| Cross-page fragment links | PASS | 0 broken |
| Built-HTML safety scan | PASS | robots `noindex, follow` ×3; `X-Robots-Tag: noindex, nofollow`; apex canonicals; sitemap 0 URLs; 0 forms; 0 inline style attributes; scripts only JSON-LD + `/analytics.js`; one `<summary>` per page; no new external origin |
| Content-integrity diff (old vs new rendered text) | PASS | Lawrence: only layout-driven differences and the opening note label; About: one intentional correction plus heading renames |
| Visual review of local renders, light and dark | PASS after fixes | fixed: clipped hero label, missing spaces, nav wrap at 320 px, chip wrap, bursting schematic, spacing |
| Live production before-audit | NOT RUN | egress proxy refused the domain from this container |
| Manual screen-reader review | NOT RUN | no screen reader available in this environment |
| GitHub CI on PR head, merge, Cloudflare release, post-deploy live check | PENDING | recorded in the addendum below |

## Decisions Made

### Operator-approved / previously locked

- Presentation-only redesign of the three pages; remove the global draft bar while keeping truthful status; preserve all safeguards (operator request, 2026-10-21).
- System fonts only; no client JS for presentation; CSP `style-src 'self'`; WCAG 2.2 AA (locked in `05`).

### Agent implementation decision

- Palette, type scale, serif display stack, layout primitives, component structure, nav labels, and all illustration designs.
- Footer as the site-wide status location, plus page-level status on Lawrence and About.
- Situation cards link to Lawrence sections and carry an explicit "not a diagnosis" line.
- No `<details>` disclosure for content, so no caveat is ever collapsed (also keeps the consent test's single-`<summary>` assumption valid).
- Project compilation shown as cards rather than a five-column table; the About classification and page-status tables remain tables inside labeled, focusable scroll regions.
- Publication records were not edited: no workflow status, score, or gate value changed, and the new generic visuals are not claimed as gate category 7.

### Proposed / still awaiting operator approval

- A dedicated, tested editorial contact alias via the existing registrar forwarding (Open Question 15).

## Previous Conclusions Changed

- About page wording "every page carries the date its sources were last checked" corrected to apply only to pages that state local rules.
- `01-CURRENT-STATE.md` "Client JavaScript: 0 bytes on every page" was stale since the GA4 release; corrected to the actual 3,090 B consent controller in the GA4 production build.

## Current Risks

- A more polished site could be mistaken for a reviewed one. Mitigated by visible review status on the Lawrence intro, in every footer, and on About.
- Before/after comparison used local renders of the deployed source, not live captures.
- Manual screen-reader review remains outstanding.

## Current Blockers

- None for the redesign itself. Release steps are recorded in the addendum.

## Things Explicitly NOT Done

- No change to lifecycles, publication records, scores, gates, approvals, robots/meta/header logic, canonicals, or the sitemap.
- No indexing request, sitemap submission, GSC/Bing change.
- No lead form, intake activation, partner routing, notifications, or contact-data collection.
- No analytics change; consent component and `public/analytics.js` untouched; no new tracking.
- No CSP/security header change; no DNS or Cloudflare configuration change; no manual deployment.
- No new municipality page, SEO expansion, or outreach.
- No editorial contact address invented or published.
- No live screenshots of production (not reachable from this environment).
- No expert review, and the site does not claim one.

## Current Project State After This Run

Redesign implemented and validated locally on `claude/epic-volta-roofwc`. All three pages remain `published_noindex`; Lawrence 63/85, gate 5 of 8, expert review absent; 0 approvals; 0 indexable pages; intake 503 by code.

## Next Recommended Step

Operator: review the redesigned pages, set up and test an editorial contact alias, and only then begin professional outreach. Technical review of the Lawrence guide is still required before any index candidacy.

## Commit / Push Status

- Branch: `claude/epic-volta-roofwc`
- Work committed: YES
- Pushed: see addendum
- Commit message: "Phase 2G: premium editorial redesign of all three pages" (implementation); "Record Phase 2G redesign in current state, build spec, and run log" (documentation)
- Commit reference: implementation `0291cd7`; documentation is the commit containing this receipt; resolve with `git log`

## Final Operator Report

To be completed after the release steps; see addendum.
