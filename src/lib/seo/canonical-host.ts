/**
 * Canonical-host policy.
 *
 * The apex is the only host that serves this site. Any other host the Worker is reachable on
 * (today: `www`) answers with a permanent redirect to the same path on the apex, so there is
 * never a second host serving the same content (docs/05 -> Domain / Brand, Canonicals).
 *
 * Pure and testable: the Worker entrypoint only applies the decision made here.
 */
import { APEX_HOST } from '../../config/brand.ts';

/** Hosts that must redirect to the apex instead of serving content. */
export const REDIRECTING_HOSTS = [`www.${APEX_HOST}`] as const;

/** 301: the move is permanent, and the apex is the canonical host for good. */
export const CANONICAL_REDIRECT_STATUS = 301;

/**
 * The absolute URL this request should be redirected to, or null when the host already is the
 * canonical one. Path, query, and fragment are preserved; the scheme is always https.
 */
export function canonicalRedirect(requestUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }
  if (!(REDIRECTING_HOSTS as readonly string[]).includes(url.hostname)) return null;
  url.protocol = 'https:';
  url.hostname = APEX_HOST;
  url.port = '';
  return url.toString();
}
