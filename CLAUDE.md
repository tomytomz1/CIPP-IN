# CLAUDE.md

Before performing any work:

1. Read `/AGENTS.md` completely.
2. Follow every document referenced by AGENTS.md.
3. Read `/docs/01-CURRENT-STATE.md`.
4. Inspect the current repository before making changes.

Do not treat documentation as optional background.

The files under `/docs/` contain active production requirements.

If implementation convenience conflicts with those requirements, preserve the documented requirement unless the human operator explicitly changes it.

After meaningful work, update `/docs/01-CURRENT-STATE.md`.

Follow the run-logging requirements in `AGENTS.md`. Every meaningful repository work session must create a session receipt and update `logs/RUN-LOG.md` before the final completion report.
