# RUN RECEIPT — <descriptive title>

<!--
Operational template, not a strategy document.
Copy to logs/runs/YYYY-MM-DD-HHMM-<short-slug>.md. Never overwrite an existing receipt.
Rules: /AGENTS.md §3. Record only what actually happened; write "Not recoverable" or "None." rather than guessing.
-->

## Run Metadata

- Date:
- Time:
- Timezone:
- Agent:
- Model if known:
- Repository:
- Branch:
- Starting SHA:
- Ending/work commit:
- Run result: COMPLETE | PARTIAL | BLOCKED | NO-CHANGE

## Operator Request

Concise description of what the human asked the agent to do. Do not invent intent that was not present.

## Instructions / Requirements Read

List the project instruction files actually read for this run. Do not claim a document was read unless it actually was.

## Starting State Observed

Relevant facts observed before changes (branch, starting SHA, working tree state, relevant files/directories, existing implementation state).

## Work Performed

Every material action actually performed, in specific language.

## Files Created

Exact paths, or `None.`

## Files Modified

Exact paths and concise reason, or `None.`

## Files Deleted

Exact paths, or `None.`

## Research / Evidence Added

Sources inspected, facts verified, facts that changed, uncertainties. If no research: `None.`

## Commands / Tools Used

Material commands/tools, for reproducibility. No huge transcripts.

## Validation / Tests Performed

| Check | Result | Notes |
|---|---|---|
|  | PASS / FAIL / NOT RUN |  |

Never claim a check passed if it was not run.

## Decisions Made

### Operator-approved / previously locked

### Agent implementation decision

### Proposed / still awaiting operator approval

Do not silently turn agent preference into a locked project decision.

## Previous Conclusions Changed

Or `None.`

## Current Risks

Or `None identified.`

## Current Blockers

Or `None.`

## Things Explicitly NOT Done

Mandatory. List what was not done, so future agents do not assume it happened.

## Current Project State After This Run

Concise snapshot. Do not replace `docs/01-CURRENT-STATE.md`.

## Next Recommended Step

State it. Do not begin it unless the operator requested it.

## Commit / Push Status

- Branch:
- Work committed: YES / NO
- Pushed: YES / NO
- Commit message:
- Commit reference: (a receipt cannot contain its own commit's SHA; write "the commit containing this receipt; resolve with git log")

## Final Operator Report

The substantive completion report given to the human. Preserve every factual completion claim (done, not done, test results, blockers, changed conclusions, readiness/next step). The final response may be shorter but must not claim anything absent from this receipt.
