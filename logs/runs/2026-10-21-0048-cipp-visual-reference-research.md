# RUN RECEIPT — CIPP visual reference and image provenance research

## Run Metadata

- Date: 2026-10-21
- Time: approximately 00:39–00:49
- Timezone: America/Detroit (EDT)
- Agent: ChatGPT / GPT-6
- Repository: https://github.com/tomytomz1/CIPP-IN
- Branch: `research/cipp-visual-references-20261021`
- Starting SHA: `ac8f83e4449c265069b1ce665bacad7982937469`
- Ending/work commit: commit containing this receipt; resolve with git log.
- Run result: COMPLETE for reference-only research and cataloging; no image production or site deployment.

## Operator Request

Find and study CIPP Indiana image-search results and collect sourced photographic/technical image references for accurate future site design, rather than inventing infrastructure, methods, projects, or local claims.

## Instructions / Requirements Read

`AGENTS.md`, `docs/00-PROJECT-CHARTER.md`, `docs/01-CURRENT-STATE.md`, `docs/02-SEO-SERP-BLUEPRINT.md`, `docs/03-GOOGLE-RESILIENCE.md`, `docs/04-CONTENT-EDITORIAL-SYSTEM.md`, `docs/05-BUILD-SPEC.md`, `logs/RUN-LOG.md`, `logs/RUN-RECEIPT-TEMPLATE.md`, prior Phase 2G receipt, `research/index.json`, `research/sources/lawrence-primary-sources.json` and `research/sources/technical-standards.json`.

## Starting State Observed

- Current `main` `ac8f83e`; three public pages remain noindex; no active homeowner lead intake. Phase 2G redesign exists.
- The operator furnished seven representative suburban home photographs in chat. Their exact property details, licensing and sewer conditions have not been independently established.

## Work Performed

1. Performed multiple current web image searches including `CIPP Indiana`, residential lateral lining, CCTV, before/after liner, pipe bursting, and municipal work.
2. Cross-checked representative photos against their publisher/source pages; curated 17 external photographic and illustration reference URLs with publisher, geography, medium, rights guard, and limits.
3. Verified Lawrence's July 2025 utility newsletter specifies an approximately 1,300-linear-foot 6-inch sanitary lateral lining scope within the 71st Street Lift Station Basin project, in addition to public-main work. This is the documented scope, not an as-built result.
4. Verified Lawrence's August 2024 utility homeowner newsletter identifies old clay laterals, cracks, root intrusion, CCTV and lining. It does not establish prevalence or a 1940s–1970s house-vintage failure rate.
5. Reviewed NASSCO general guidance on distinct CIPP lateral lining, mainline lining, main-lateral junction lining, and pipe bursting; retained distinctions for visual-production review.
6. Identified a Wikimedia Commons/FHWA public-domain candidate and an independently licensed-media candidate; neither has final production rights approval.
7. Created a local private reference atlas `/mnt/data/cipp_visual_research/visual-research-atlas.html`, JSON manifest and zip package. The HTML embeds low-resolution thumbnails of the seven user-supplied photos and loads third-party image previews by remotely linked URLs; it does not mirror source images.
8. Stored a source-and-rights-only research record under `research/editorial/2026-10-21-cipp-visual-reference-scan.json`; indexed it; recorded the no-change-to-website status in CURRENT-STATE.
9. Opened a docs/research-only feature branch. No existing application source, content pages, publication record, permissions, or infrastructure was touched.

## Files Created

- `research/editorial/2026-10-21-cipp-visual-reference-scan.json`
- `logs/runs/2026-10-21-0048-cipp-visual-reference-research.md`
- Conversation attachments outside GitHub: HTML visual atlas, full JSON manifest, zipped research pack.

## Files Modified

- `research/index.json` — add new editorial research reference.
- `docs/01-CURRENT-STATE.md` — completed research note, explicitly no new published visuals.
- `logs/RUN-LOG.md` — append this session entry.

## Files Deleted

None.

## Research / Evidence Added

- Lawrence Utilities July 2025: https://www.cityoflawrence.org/sites/default/files/document-group/lift-2025-july.pdf — project planned scope, not completion.
- Lawrence Utilities August 2024: https://www.cityoflawrence.org/sites/default/files/document-group/lift-2024-augustv5.pdf — homeowner warning about aging clay laterals, roots and backups; not an era-based statistical study.
- NASSCO Rehabilitation: https://www.nassco.org/trenchless-technology/rehabilitation/pipe-rehabilitation — generic method descriptions.
- NASSCO Matrix 2025: https://nassco.org/pipeline-rehabilitation-matrix-2025/ — general method limits.
- Wessler Engineering Indianapolis: https://www.wesslerengineering.com/project/combined-sewer-and-sanitary-sewer-rehabilitation/ — municipal project and lateral work, not Lawrence household evidence.
- EPA general technology review: https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1008C45.TXT — national method distinctions.
- Seventeen individually linked reference image pages in the research JSON. No source images asserted to be licensed.

## Commands / Tools Used

Web image and source search, publisher page/PDF inspection, GitHub read/create/update, local Python/Pillow HTML thumbnails, JSON construction and zip packaging. Direct external binary image downloads were attempted but failed due to network/DNS restrictions; no downloaded third-party photograph is packaged.

## Validation / Tests Performed

| Check | Result | Notes |
|---|---|---|
| New research JSON parses | PASS | Parsed readback of branch file |
| Image record IDs are unique | PASS | 17 / 17 |
| Reference URL structure | PASS | HTTPS for each source/image URL where present; availability of remote preview URLs is not guaranteed |
| Rights guard | PASS | All 17 set to reference-only/permission not verified |
| Research index link | PASS | New file listed in `research/index.json` |
| User images kept out of public repository | PASS | Only reduced thumbnails embedded in local atlas; no house files committed |
| Original media rights for publication | NOT VERIFIED | Must secure proper rights or make original graphics |
| Technical diagram expert review | NOT RUN | Required before index eligibility |
| Application build/production verification | NOT RUN | No application code changes |

## Decisions Made

### Operator-approved / previously locked

Indy Sewer Resource is independent and must not invent local facts, expertise, projects, reviews or property boundaries; all indexability and intake gates remain locked.

### Agent implementation decision

Catalog third-party references by source URL and limitations without rehosting copyrighted image bytes or claiming production rights. Keep user-supplied house photo references out of the public GitHub repo.

### Proposed / still awaiting operator approval

Choose exact art direction and render original visual concepts only after verifying technical geometry; confirm image licensing if any external photo is desired for live publication.

## Previous Conclusions Changed

No strategy changed. Added corroboration: Lawrence has a documented 2025 municipal CIPP lateral-lining project scope, not proof of household-specific diagnoses.

## Current Risks

Marketing visuals sometimes omit necessary access work, mix mainline and lateral work, or portray before/after images with unverified same-pipe provenance. Site visuals could be misleading if copied without context; raw image licensing is unverified. Photo/house vintage does not prove lateral material or condition.

## Current Blockers

Third-party image-use rights and technical professional review for new assets. Direct image download network access also blocked for this session.

## Things Explicitly NOT Done

No third-party image was downloaded/rehosted or published. No local home photographs were committed to the public repo. No CIPP artwork or website redesign created. No index approval, source-claim score change, lead intake, GA4, security, DNS, deployment or expert outreach change.

## Current Project State After This Run

A verifiable image-source research dossier is available for future creative execution. No application or production behavior changed; all three pages remain in their previous publication states.

## Next Recommended Step

Use the visual atlas to design *original* side-by-side residential cutaway and pipe interior illustrations, checking the technical depictions against NASSCO/genuine lateral practices, and obtain expert validation before publication. No art-direction commitment is made in this research run.

## Commit / Push Status

- Branch: `research/cipp-visual-references-20261021`
- Work committed: YES, on research-only feature branch; final SHA is the commit containing this receipt
- Pushed: YES, through connected GitHub file APIs
- Commit message: `Archive CIPP source-backed visual research and audit trail`
- Commit reference: commit containing this receipt; resolve with git log

## Final Operator Report

Completed an external-image provenance research pack: 17 external source URLs, seven user-supplied private house thumbnails, six corroborating documents in GitHub (seven in the private atlas), clear regional/technical labeling and rights caveats. Reusable image rights remain unverified. No page, artwork or published image was changed. Research and audit trail are proposed for the normal GitHub protected-main PR workflow.

## Later evidence addendum — public media licensing review (2026-10-21 00:50 EDT)

The Wikimedia Commons source pages for VIS-16 and VIS-17 were read after the initial image-source scan. VIS-16's original photographer has dedicated the image to CC0 1.0; it depicts an April 2026 street installation in Cambridge, Massachusetts. VIS-17's page contains a U.S. federal-government public-domain designation (and a separately displayed original Flickr CC BY 2.0 license notice); the image depicts a Montana highway culvert rehabilitation, NOT a private sanitary lateral. These status notes were added to the JSON reference records. No third-party image file was downloaded or inserted into the website. All other discovered images have unverified reuse rights, and no use permission is assumed for them. This license-source review does not establish that either image is suitable to depict a Lawrence residential CIPP job.
