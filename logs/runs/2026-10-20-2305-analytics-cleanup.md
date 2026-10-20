# RUN RECEIPT — Analytics cleanup: disable beacon and activate internal exclusion

## Run Metadata
- Date: 2026-10-20
- Time: 22:58–23:05 UTC
- Timezone: UTC; operator America/New_York
- Agent: Codex
- Model if known: GPT-6
- Repository: tomytomz1/CIPP-IN
- Branch: docs/pr18-merge-receipt (existing PR #19)
- Starting SHA: main 916ee4f76bb29c962fcc8364ecee929855f18375; audit 0fc6e0c42fb5e2cfda0f32dd17bb2ea3af4e9661
- Ending/work commit: the commit containing this receipt; resolve with git log
- Run result: COMPLETE for requested configuration changes

## Operator Request
"ok do 1 and 2": disable Cloudflare automatic beacon injection while preserving history, and activate GA4's internal-traffic exclusion after checking its match.

## Instructions / Requirements Read
AGENTS.md completely, charter, resilience, current-state, BUILD-SPEC Analytics, RUN-LOG, latest Claude release receipt and RUN-RECEIPT-TEMPLATE from this ongoing session. Cloudflare skill and current OpenAPI mutation schemas. Inspected production DOM and signed-in GA4 filter before action.

## Starting State Observed
Existing RUM site f8a0256769d9405aab326585520b1d0f, auto_install=true, ruleset enabled=true, lite=true, created 2026-09-20. GA4 property 559890873, account 411247031: Internal Traffic, Exclude, Testing.

## Work Performed
1. GET existing RUM site; PUT auto_install=false. API readback confirmed false but live DOM still had the matching injected beacon and ruleset remained enabled. Superseded this intermediate state with PUT auto_install=true, enabled=false, lite=true, disabling the existing ruleset. Response confirms enabled=false. The setup-mode flag remains true but disabled ruleset stops injection.
2. Signed-in cloud browser initially timed out creating a tab; recovered existing Analytics tab and explicitly selected Indy Sewer Resource property 559890873. Opened existing Internal Traffic filter, confirmed exact traffic_type=internal, operation Exclude. Selected Active, Save, confirmed Activate filter. Final list visibly Active. No IP/geographic exclusion.
3. Fresh live navigations after propagation: homepage, Lawrence, About all omit Cloudflare beacon, retain first-party analytics controller, correct HTTPS apex canonical and noindex meta. Used analytics=internal on first navigation, preserving normal QA opt-out. No collection test sent.
4. Updated owning docs and append-only receipt/log in existing audit PR #19.

## Files Created
- logs/runs/2026-10-20-2305-analytics-cleanup.md

## Files Modified
- docs/01-CURRENT-STATE.md: resolve RUM/filter decisions and record final settings.
- docs/05-BUILD-SPEC.md: operator-approved architecture/configuration follow-up and correct future validation guidance.
- logs/RUN-LOG.md: append entry.

## Files Deleted
None.

## Research / Evidence Added
Cloudflare existing site GET/PUT readbacks. Real browser DOM for /, /about/, /lawrence-sewer-lateral-repair/. GA4 Active list screenshot: /workspace/scratch/indy-ga4-active-1792537304315.jpg (local evidence, not committed; no secrets). No historical site deletion or dataset mutation; same site identifier and creation date retained.

## Commands / Tools Used
Cloudflare skill read, OpenAPI search, Cloudflare execute GET/PUT, cua_repl browser UI and read-only DOM inspection, GitHub read/tree/commit/ref updates, local attachment/screenshot file checks.

## Validation / Tests Performed
| Check | Result | Notes |
|---|---|---|
| RUM rule disabled | PASS | API enabled=false |
| Existing RUM site preserved | PASS | Same identifier/creation date; no delete API |
| No beacon on all three live pages | PASS | Fresh browser DOM after propagation |
| GA4 exact internal match | PASS | traffic_type exactly internal, Exclude; no IP/location match |
| GA4 saved state | PASS | List shows Active after save/confirmation |
| Canonical/noindex DOM | PASS | All three unchanged |
| Source unit/a11y/build rerun | NOT RUN | No runtime source changed; normal PR CI runs separately |
| Actual post-filter event exclusion receipt | NOT RUN | Active setting verified; no new tracking test and no propagation-time claim |

## Decisions Made
### Operator-approved / previously locked
Explicitly authorized disabling automatic injection and activating internal exclusion. Keep data/history, consent, publication/security controls.
### Agent implementation decision
Use existing RUM disabled ruleset rather than deleting analytics site or changing CSP. Consolidate audit docs on PR #19.
### Proposed / still awaiting operator approval
None for these two changes.

## Previous Conclusions Changed
RUM injection now disabled rather than CSP-blocked. GA4 Internal Traffic now Active rather than Testing. Earlier advice to use DebugView after activating the filter was unverified; do not assume it bypasses exclusion.

## Current Risks
Filter is prospective, not retroactive: earlier test traffic remains in historical data. No geographic/IP filtering. Excluded future matching events cannot be recovered through filter deactivation.

## Current Blockers
None for requested configuration. Documentation PR CI/merge follows independently.

## Things Explicitly NOT Done
No DNS, security protection, CSP, publication registry, sitemap, lead collection, application code or deployment change. No site/property deletion, no new secret or external collection test. No historical test-data deletion.

## Current Project State After This Run
Both requested configuration changes applied and verified. RUM site preserved, disabled ruleset; fresh pages omit beacon. Existing GA4 559890873 / G-2ZGM4PZ4DK Internal Traffic filter Active, Exclude exact traffic_type=internal. Ordinary visitors not matched by location.

## Next Recommended Step
Observe routine reporting; continue browser internal opt-out for QA. Previously collected test data remains subject to historical reporting exclusion.

## Commit / Push Status
- Branch: docs/pr18-merge-receipt
- Work committed: YES
- Pushed: YES
- Commit message: docs: record disabled Cloudflare beacon and active GA4 internal exclusion
- Commit reference: the commit containing this receipt; resolve with git log

## Final Operator Report
Done: Cloudflare automatic beacon injection disabled, existing site/history retained, no beacon in three fresh page navigations. GA4 exact internal-traffic exclusion Active; no location/IP exclusion. Changes apply going forward; earlier test data is not removed. Screenshot confirms saved Active state. Documentation recorded in PR #19.
