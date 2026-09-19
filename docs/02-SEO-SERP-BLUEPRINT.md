# SEO / SERP BLUEPRINT

Owner of: organic strategy, competitor model, query targets, page strategy, link strategy, organic metrics.

Publication and indexing gates are **not** defined here — they live in `03-GOOGLE-RESILIENCE.md` and override this document. The content production workflow lives in `04-CONTENT-EDITORIAL-SYSTEM.md`.

> Provenance: the competitive observations below come from pre-Phase 0 research and were independently re-verified on 2026-09-19. Supporting evidence is stored under `/research/` (index: `/research/index.json`):
> - Lawrence municipal evidence: `research/sources/lawrence-primary-sources.json`
> - SERP/competitor evidence: `research/serps/2026-09-19-competitor-snapshot.json`
> - Prospective tenant evidence: `research/sources/prospective-tenants.json`
>
> SERPs are dynamic and vary by location, device, and personalization. Exact positions in the snapshot are not reliable. Re-verify before any material publishing decision.

---

## Strategic SEO Model

```text
Lawrence first
  → build authority (evidence, tools, links, first-party data)
  → expand selectively to municipalities that pass the Location Page Quality Gate
  → attack broader Indianapolis commercial terms once authority exists
```

Expansion is earned, not scheduled. Every new municipality page must pass the gate in `03-GOOGLE-RESILIENCE.md`.

## Primary Competitor Classes

Known competitors (operator-identified):

- Roto-Rooter (Lawrence-targeted page)
- Mr. Plumber
- YoHomeFix
- NuFlow Indy
- Carter's My Plumber

Also observed in the 2026-09-19 snapshot: 317 Plumber (Lawrence service-area page seen on three of the five Lawrence queries) and SLB Pipe Solutions (specialist lining operator, strong on Indianapolis lining/CIPP queries). Exact competitor URLs and page evidence: `research/serps/2026-09-19-competitor-snapshot.json`.

Competitor classes these represent:

- **National/franchise plumbing brands with local pages** (e.g., Roto-Rooter).
- **Local general plumbing companies** with service/location pages (e.g., Mr. Plumber, Carter's My Plumber).
- **Specialist trenchless/CIPP operators** with genuine technical authority (e.g., NuFlow Indy).
- **Lead-gen / home-services aggregators** (e.g., YoHomeFix).

**The ranking competitor is the URL, not merely the business.** Analyze the specific page that ranks for a specific query — its intent match, depth, local evidence, tools, links, and freshness — not the company's brand in general. A strong business can rank with a weak page, and vice versa. Competitor evidence dossiers are built per page per the workflow in `04-CONTENT-EDITORIAL-SYSTEM.md` (step 3).

## Initial Competitive Thesis

**Lawrence:**

- more attackable than Indianapolis head terms
- a municipal/local-information gap exists. It is a gap in homeowner translation, not in raw availability: in the 2026-09-19 snapshot, the City's own scanned policy-manual PDF was the first organic result for the primary query (inference from one capture)
- generic/local plumbing pages currently rank
- opportunity exists to provide stronger homeowner-specific local information

**Indianapolis head CIPP terms:**

- materially harder
- NuFlow has genuine technical topical authority
- should not be the initial battleground

## Initial Primary Query

`sewer lateral repair lawrence in`

## Search Intent Model

```text
problem
→ diagnosis
→ ownership/responsibility
→ repair-method decision
→ estimate
→ contractor
```

Map every page to one or more stages. Commercial/action stages (repair-method decision, estimate, contractor) are prioritized; see Zero-Click Strategy in `03-GOOGLE-RESILIENCE.md`.

## Information Advantage

Our core Lawrence moat. Status as of 2026-09-19: owner responsibility, the permit requirement, lining/bursting allowance, and post-repair CCTV requirements are verified from current primary sources. The remaining uncertainties are listed in `01-CURRENT-STATE.md` → Lawrence Municipal Evidence Status. Re-verify before publication. Components:

- municipal vs. private lateral responsibility
- permit process
- lining rules
- pipe-bursting rules
- CCTV requirements
- homeowner translation of the above into plain language
- decision tools

## Page Strategy

Do NOT create one page per keyword.

One strong Lawrence lateral resource should naturally address:

- lateral repair
- trenchless options
- CIPP
- lining
- bursting
- excavation
- responsibility
- camera diagnosis

Separate URLs require **materially distinct user intent** plus sufficient unique value. Test before splitting:

1. Would a searcher for query A be poorly served by the page for query B?
2. Does the proposed page have its own evidence, tool, or decision utility — not just a reworded section?
3. Would the split page pass the full indexing gate in `03-GOOGLE-RESILIENCE.md` on its own?

If any answer is no, keep it as a section of the existing page. Specific URL plans and routes are NOT YET LOCKED (`05-BUILD-SPEC.md` → Routes).

## Backlink Strategy

Prioritize legitimate, relevant links from:

- Lawrence organizations
- the Indianapolis housing ecosystem
- real-estate organizations
- home inspectors
- property-management resources
- relevant local associations
- legitimate editorial/resource links (earned because a tool, dataset, or guide is genuinely useful)

Prohibited link tactics: see `/AGENTS.md` §4.6.

Link-worthy assets should be the moats in `00-PROJECT-CHARTER.md` (municipal regulatory information, tools, original visuals, first-party data), not generic articles.

## Organic Success Metrics

Track, segmented by page and query intent:

- impressions
- commercial query coverage (share of target commercial queries with any impressions)
- count of target queries in top 50
- count in top 30
- count in top 20
- count in top 10
- qualified leads (the metric that matters most)

Do not optimize around traffic alone. A page with low traffic and qualified leads outranks a page with high traffic and none. Page lifecycle decisions: `03-GOOGLE-RESILIENCE.md` → Site Quality Firewall.
