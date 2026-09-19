# GOOGLE RESILIENCE

Owner of: AI policy, publication/indexing gates, quality thresholds, doorway and site-quality firewalls, algorithm-update protocol, zero-click strategy.

This is one of the strictest documents in the project. It outranks `04`, `02`, `05`, and `01` (see `/AGENTS.md` §1).

**All numeric thresholds in this document are internal project standards and heuristics. They are not published Google thresholds or ranking factors.**

---

## PRIMARY PRINCIPLE

**The website must deserve to rank even if Google perfectly identifies every AI-assisted sentence.**

---

## AI Policy

AI may assist with:

- research organization
- synthesis
- outlining
- drafting
- coding
- data analysis

AI may NOT substitute for:

- evidence
- original local research
- expert validation
- original utility
- first-party data
- editorial judgment

**No AI-humanizer / detection-evasion workflow.** We do not hide AI use, evade AI detectors, strip watermarks, "humanize" text to beat detectors, or mass-produce keyword variants.

---

## INDEXING GATE (summary)

A page may be set to indexable only when **all** of the following are true and recorded:

1. It completed the full workflow in `04-CONTENT-EDITORIAL-SYSTEM.md` (steps 1–19).
2. All material claims are verified or explicitly labeled (FACT / INFERENCE / ESTIMATE); no invented facts.
3. It passes the **Commodity Content Test**.
4. It passes the **Perfect-AI-Detection Test**.
5. It passes **Semantic Similarity QA** (or a documented manual review cleared it).
6. It is not a doorway page (**Doorway Page Firewall**).
7. Its **Publication Score** meets the threshold for its page type.
8. If it is a municipality/location page: it passes the **Location Page Quality Gate**.
9. Expert review is completed where required by `04-CONTENT-EDITORIAL-SYSTEM.md`.
10. Technical, internal-linking, and conversion QA pass (`05-BUILD-SPEC.md` → Definition of Done).

If any item fails: **`noindex` / remain draft.** The default state of every new page is draft / `noindex`.

---

## LOCATION PAGE QUALITY GATE

A municipality page must have **at least 5 of these 8** unique evidence categories, **including at least 2 authoritative local primary-source categories**:

1. verified lateral ownership/responsibility
2. municipality-specific permit/repair requirement
3. municipality-specific CIPP/lining/bursting rule
4. municipality-specific infrastructure information
5. municipality-specific housing/pipe/failure evidence
6. municipality-specific cost/permit/project evidence
7. original municipality-specific visual/data asset
8. original first-party/interview data

Counting rules:

- A category counts only if the evidence is **specific to that municipality** and unique to that page (not reused from another municipality page with the name changed).
- A category counts toward the "authoritative local primary-source" minimum only when it is supported by a local primary source (municipality, utility/public works, local government, or an engineering specification issued for that jurisdiction — tiers 1–4 in `04-CONTENT-EDITORIAL-SYSTEM.md` → Source Hierarchy).
- Broad Indiana or national information does not count.
- Record the evidence and sources for each claimed category with the page.

**If it fails: DO NOT INDEX IT.**

This is our internal standard, not a published Google threshold.

---

## SEMANTIC SIMILARITY QA

Internal heuristics (not Google ranking thresholds). Compare each candidate indexable page against every other indexable or candidate page on the site, and against competitor pages in its evidence dossier to detect repackaging.

```text
< 0.82 cosine similarity   = generally acceptable
0.82 – 0.88                = mandatory manual review
> 0.88                     = publication blocked pending review
> 0.92                     = presumed city-swap/duplication unless proven otherwise
```

Also flag for review:

- ≥ 20% sentence-level near-duplication with any other page
- ≥ 70% identical heading architecture with any other page

Manual review outcomes and reasons must be recorded. The implementation is defined in `05-BUILD-SPEC.md` → Publication-Quality Enforcement. The current locked embedding model is OpenAI `text-embedding-3-small`, supplemented by deterministic sentence-level and heading-architecture checks. Record the model and tooling used for every run, because scores from different embedding models are not directly comparable.

---

## COMMODITY CONTENT TEST

Every page must answer:

**Could a generic LLM answer this query almost as well without seeing our page?**

If yes: **do not index until unique value is added.**

Possible unique value:

- primary municipal research
- first-party data
- original tool
- original diagram
- expert interpretation
- local workflow
- unique comparison
- local cost/project evidence

---

## PUBLICATION SCORE

100 points total:

| Criterion | Points |
|---|---|
| Original/local information | 20 |
| Primary-source evidence | 10 |
| Homeowner decision utility | 15 |
| Expert verification | 10 |
| Original media/tool | 10 |
| Proprietary/interview/first-party data | 10 |
| Non-commodity distinctiveness | 10 |
| Technical/internal-link quality | 5 |
| Transparency/trust | 5 |
| Conversion usefulness | 5 |
| **Total** | **100** |

Thresholds:

- general indexable page: **80/100**
- money/location page: **85/100** (any page targeting commercial/local repair intent, routing leads, or targeting a municipality)

Below threshold: **`noindex` / remain draft.**

Rules:

- Score honestly; award zero for a criterion with no real evidence (e.g., zero for expert verification if no real expert reviewed it).
- The score does not override hard gates: a page scoring 90 that fails the Location Page Quality Gate or the Commodity Content Test is still not indexed.
- Record the score, the scorer, and the date with the page.

---

## PERFECT-AI-DETECTION TEST

Every page must pass both:

1. **Would this page still deserve to exist and be useful if Google did not exist?**
2. **Would it still deserve to rank if Google knew every sentence received AI assistance?**

If either answer is no: **do not index.**

---

## DOORWAY PAGE FIREWALL

Do not publish:

- city swaps
- repeated FAQs with names changed
- identical tools with the city changed
- identical intros
- dozens of URLs routing to the same contractor without unique local value

A shared tool may be embedded on multiple pages only if each page's indexable value is independent of the tool (i.e., the page passes all gates without it).

---

## SITE QUALITY FIREWALL

Every indexed page must eventually be classified as one of:

- **KEEP** — performing its role (leads, rankings, trust, links, or support of a money page).
- **IMPROVE** — has a legitimate role but underperforms; specific improvements identified.
- **CONSOLIDATE** — overlaps another page's intent; merge into the stronger URL with a redirect.
- **NOINDEX** — useful to users (e.g., utility/support pages) but not a search asset.
- **DELETE/REDIRECT** — no remaining user, trust, link, or conversion value.

Evaluation rules (days measured from first indexing):

- **90-day review:** confirm indexing and canonical status; review impressions, query coverage, ranking positions, engagement, and leads against the page's intended role. Diagnose before acting (technical issue? intent mismatch? missing evidence? cannibalization?). Typical outcomes: KEEP or IMPROVE; CONSOLIDATE if cannibalization is confirmed.
- **180-day review:** if a page still has no meaningful impressions for its target intent, no qualified leads, no backlinks, and no support role for other pages after at least one documented improvement cycle, classify it CONSOLIDATE, NOINDEX, or DELETE/REDIRECT.

**Do not delete pages solely for low traffic.** Low-volume pages that generate qualified leads, earn links, build trust (e.g., methodology, disclosure), or support money pages are KEEP.

Record every page-level classification, with date and reasoning, in the structured page/publication record defined in `05-BUILD-SPEC.md` → Publication / Indexing Architecture. Summarize material site-level status changes in `01-CURRENT-STATE.md`.

---

## ALGORITHM UPDATE PROTOCOL

**First 24 hours**
Verify technical, indexing, and tracking status (site up, robots/sitemap/canonicals intact, analytics and call tracking firing, Search Console data flowing) and confirm whether a Google update is officially rolling out. Rule out self-inflicted causes first.

**First 7 days**
Segment changes by query, intent, page, geography, AI-feature visibility (AI Overviews or equivalents), and competitors. Identify which URLs gained/lost and what the winners have in common. Observe; do not rewrite.

**First 30 days**
Make evidence-based improvements only after diagnosis, and only after the rollout is officially complete where applicable. Record hypotheses, changes, and results in `01-CURRENT-STATE.md`.

**Do not panic-rewrite the site during an active update rollout.**

---

## ZERO-CLICK STRATEGY

Prioritize commercial/action queries, where a homeowner needs something a search-results summary cannot provide:

- repair
- quote
- inspection
- diagnosis
- cost
- eligibility
- contractor matching
- upload/review camera result
- under-driveway/foundation problems

Informational content exists to support authority and the lead journey, not to generate vanity traffic.
