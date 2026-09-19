# CONTENT & EDITORIAL SYSTEM

Owner of: the mandatory content workflow, writing rules, source hierarchy, claim classification, expert review, and disclosure.

Gates and thresholds referenced here (similarity, commodity test, publication score, location gate) are defined in `03-GOOGLE-RESILIENCE.md`, which takes precedence over this document. Query and page strategy: `02-SEO-SERP-BLUEPRINT.md`.

---

## MANDATORY CONTENT WORKFLOW

Every indexable page follows every step, in order. Skipping a step means the page stays draft / `noindex`. Record the output of every step in the page's structured page/publication record (see `05-BUILD-SPEC.md` → Content / Editorial Storage and Publication / Indexing Architecture).

1. **User Problem Definition** — Why does this URL deserve to exist? What homeowner problem does it solve, and at which lead-journey stage (`00-PROJECT-CHARTER.md`)? Confirm it is not a keyword variant of an existing page (`02-SEO-SERP-BLUEPRINT.md` → Page Strategy).
2. **Search Intent Analysis** — Target query set, intent stage, what the current SERP rewards, and what the homeowner needs to decide.
3. **Competitor Evidence Dossier** — The specific ranking URLs (not just businesses), what each covers, what each lacks, and their sources.
4. **Primary Source Research** — Collect municipal, utility, government, and specification sources per the Source Hierarchy. Store citations.
5. **Local Evidence Package** — Assemble the verified local facts. For municipality pages, map evidence to the 8 categories of the Location Page Quality Gate.
6. **Proprietary Data Check** — What first-party, interview, or original data can this page use? If none exists, say so; do not fabricate.
7. **Expert Input Requirement** — Decide whether expert review is required (see Expert Review). Obtain input before drafting where it shapes the page.
8. **Page Architecture** — Headings, decision flow, tools/visuals placement, conversion points, internal links. Driven by the homeowner's decision, not by a template shared with other pages.
9. **AI-Assisted Draft** — AI may draft from the verified evidence package. It may not add facts not present in that package.
10. **Material Claim Verification** — Check every material claim against its source; label each FACT / INFERENCE / ESTIMATE. Remove or mark unverified anything that cannot be sourced.
11. **Human Editorial Restructuring** — A human editor restructures for clarity, accuracy, and decision utility, removes filler, and enforces the Content Rules below.
12. **Original Asset Insertion** — Original diagrams, data visuals, tools, or photos (only genuine photos with rights to use; never fake local photos).
13. **Expert Review Where Required** — Real, named reviewer; record scope and date.
14. **Similarity QA** — Per `03-GOOGLE-RESILIENCE.md`.
15. **Commodity Content Test** — Per `03-GOOGLE-RESILIENCE.md`.
16. **Publication Score** — Per `03-GOOGLE-RESILIENCE.md`; also run the Perfect-AI-Detection Test and Doorway Page Firewall.
17. **Technical SEO QA** — Per `05-BUILD-SPEC.md` (canonicals, metadata, schema validity/honesty, performance, accessibility).
18. **Internal Linking QA** — Links reflect the lead journey; no orphan pages; no manipulative anchor patterns.
19. **Conversion QA** — Lead paths work, disclosures are present, tracking fires, and the page helps even users who should not convert.
20. **Index Approval** — After steps 1–19 pass, move the page through the publication/indexing controls defined in `05-BUILD-SPEC.md`. A page may be publicly available as `published_noindex`. It becomes `indexable` only when all hard gates, score requirements, evidence-freshness requirements, and operator index approval pass. Update `01-CURRENT-STATE.md` → Current Indexed URLs when a URL actually becomes indexable.
21. **Monitor** — Indexing, queries, rankings, engagement, leads.
22. **90/180-Day Review** — Classify per the Site Quality Firewall in `03-GOOGLE-RESILIENCE.md`.

---

## CONTENT RULES

Banned generic openings (and close variants):

- "When it comes to..."
- "Whether you're dealing with..."
- "In today's world..."
- "If you're a homeowner in..."
- generic city-history introductions

Also:

- **No arbitrary word-count padding.** Length follows the homeowner's decision needs.
- **No invented local statements.**
- **No presenting broad Indiana (or national) information as Lawrence-specific** (or specific to any municipality).
- **No uncited material technical/local claims** where verification is reasonably available.
- Open with the answer or the decision the homeowner faces, not preamble.
- Be honest when trenchless repair is not the right answer.

---

## SOURCE HIERARCHY

Prefer, in order:

1. municipality
2. utility / public works
3. engineering specification
4. government (state/federal)
5. recognized technical standards / manufacturer documentation
6. credible contractor evidence
7. reputable secondary research

Use low-quality marketing blogs only when unavoidable, and clearly identify their limitations on the page or in the evidence record.

Record for every source: URL or document identifier, publisher, date accessed, and the claim it supports.

---

## CLAIM CLASSIFICATION

Use internally where useful (and on-page where it helps the reader):

- **FACT** — Verified against a cited source.
- **INFERENCE** — A reasonable conclusion drawn from facts; the reasoning is shown or recoverable.
- **ESTIMATE** — Modeled or estimated; the basis and uncertainty are stated.

**Never convert an estimate to a fact.** Never upgrade an inference to a fact without new evidence. Anything that cannot be classified is **unverified** and must not be stated as true.

---

## EXPERT REVIEW

Expert review is **required** for high-value technical pages where claims may materially affect homeowner decisions (e.g., repair-method selection, CIPP/bursting suitability, cost guidance, responsibility determinations).

Preferred reviewer:

- an Indiana-licensed plumber with trenchless/CIPP experience, or
- another genuinely relevant sewer rehabilitation professional.

Rules:

- **Do not fabricate reviewers**, credentials, quotes, or review dates.
- Display reviewer attribution only with the reviewer's consent and only for what they actually reviewed.
- If the reviewer is affiliated with the rental partner, disclose the relationship.
- If no qualified reviewer is available, the page scores 0 for expert verification and, where review is required, stays draft / `noindex`.

---

## DISCLOSURE

The website is an **independent research / contractor-matching resource.**

- Never imply that the website itself performs plumbing work unless that business model genuinely changes later (which would require a Charter change).
- Where leads are routed to a partner contractor, disclose that clearly at the point of contact and in a site-level disclosure.
- Partner attribution must be truthful; do not present the partner as the site's author or the site as neutral if a paid relationship exists.
- Exact disclosure wording requires legal review — NOT YET LOCKED (`05-BUILD-SPEC.md` → Privacy / Consent).
