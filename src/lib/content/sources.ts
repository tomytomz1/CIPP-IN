/**
 * On-page source citation shape (docs/04 → Source Hierarchy).
 *
 * A page cites what it used, who published it, when we verified it, and the limitation that
 * applies. Every entry mirrors a record in research/sources/*.json; nothing is cited here that
 * is not in the repository's evidence files.
 */
export interface Source {
  /** Stable anchor id fragment, unique within the page. */
  id: string;
  title: string;
  publisher: string;
  url?: string;
  /** ISO date this project last verified the source. */
  verifiedAt: string;
  /** What the source supports, in plain language. */
  supports: string;
  /** Honest caveat: currency, format, or scope limits. */
  limitation?: string;
}
